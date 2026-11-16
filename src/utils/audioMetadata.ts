export interface ExtractedAudioMeta {
  title?: string;
  artist?: string;
  album?: string;
  artworkUrl?: string;
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

function readSyncSafe32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f)
  );
}

function decodeTextFrame(data: Uint8Array): string {
  if (data.length < 2) return '';
  const encoding = data[0];
  const payload = data.subarray(1);
  try {
    if (encoding === 1 || encoding === 2) {
      const decoder = new TextDecoder(encoding === 1 ? 'utf-16' : 'utf-16be');
      return decoder.decode(payload).replace(/\0/g, '').trim();
    }
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(payload).replace(/\0/g, '').trim();
  } catch {
    return '';
  }
}

function detectImageMime(bytes: Uint8Array): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'image/webp';
  }
  return 'image/jpeg';
}

function parseID3v2(bytes: Uint8Array): ExtractedAudioMeta {
  const result: ExtractedAudioMeta = {};
  if (
    bytes.length < 10 ||
    bytes[0] !== 0x49 ||
    bytes[1] !== 0x44 ||
    bytes[2] !== 0x33
  ) {
    return result;
  }

  const version = bytes[3];
  const flags = bytes[5];
  const tagSize = readSyncSafe32(bytes, 6);
  const limit = Math.min(bytes.length, 10 + tagSize);

  let offset = 10;
  // Skip extended header if present
  if ((flags & 0x40) !== 0 && offset + 4 <= limit) {
    const extSize =
      version === 4 ? readSyncSafe32(bytes, offset) : readUint32BE(bytes, offset);
    offset += version === 4 ? extSize : extSize + 4;
  }

  const decoder = new TextDecoder('latin1');

  while (offset + (version === 2 ? 6 : 10) <= limit) {
    if (bytes[offset] === 0) break;

    let frameId = '';
    let frameSize = 0;
    let headerLen = 10;

    if (version === 2) {
      headerLen = 6;
      frameId = decoder.decode(bytes.subarray(offset, offset + 3));
      frameSize =
        (bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5];
    } else {
      frameId = decoder.decode(bytes.subarray(offset, offset + 4));
      frameSize =
        version === 4
          ? readSyncSafe32(bytes, offset + 4)
          : readUint32BE(bytes, offset + 4);
    }

    if (!frameId.trim() || frameSize <= 0 || offset + headerLen + frameSize > limit) {
      break;
    }

    const frameData = bytes.subarray(offset + headerLen, offset + headerLen + frameSize);

    if (frameId === 'TIT2' || frameId === 'TT2') {
      result.title = decodeTextFrame(frameData) || result.title;
    } else if (frameId === 'TPE1' || frameId === 'TP1') {
      result.artist = decodeTextFrame(frameData) || result.artist;
    } else if (frameId === 'TALB' || frameId === 'TAL') {
      result.album = decodeTextFrame(frameData) || result.album;
    } else if ((frameId === 'APIC' || frameId === 'PIC') && !result.artworkUrl) {
      const encoding = frameData[0];
      let pos = 1;
      let mime = 'image/jpeg';

      if (frameId === 'PIC') {
        const imgFmt = decoder.decode(frameData.subarray(1, 4)).toLowerCase();
        mime = imgFmt === 'png' ? 'image/png' : 'image/jpeg';
        pos = 4;
      } else {
        let mimeEnd = pos;
        while (mimeEnd < frameData.length && frameData[mimeEnd] !== 0) mimeEnd++;
        const rawMime = decoder.decode(frameData.subarray(pos, mimeEnd)).trim();
        if (rawMime.includes('/')) mime = rawMime;
        else if (rawMime.toLowerCase().includes('png')) mime = 'image/png';
        pos = mimeEnd + 1;
      }

      // Picture type byte
      pos += 1;

      // Skip null-terminated description
      if (encoding === 1 || encoding === 2) {
        while (
          pos + 1 < frameData.length &&
          !(frameData[pos] === 0 && frameData[pos + 1] === 0)
        ) {
          pos += 2;
        }
        pos += 2;
      } else {
        while (pos < frameData.length && frameData[pos] !== 0) pos++;
        pos += 1;
      }

      if (pos < frameData.length) {
        const imgBytes = frameData.subarray(pos);
        const actualMime = mime === '-->' ? 'image/jpeg' : detectImageMime(imgBytes);
        if (imgBytes.length > 16) {
          const blob = new Blob([new Uint8Array(imgBytes)], { type: actualMime });
          result.artworkUrl = URL.createObjectURL(blob);
        }
      }
    }

    offset += headerLen + frameSize;
  }

  return result;
}

function parseMP4Atoms(bytes: Uint8Array, start: number, end: number, out: ExtractedAudioMeta) {
  const decoder = new TextDecoder('latin1');
  const utf8 = new TextDecoder('utf-8');
  let offset = start;

  while (offset + 8 <= end) {
    let size = readUint32BE(bytes, offset);
    const type = decoder.decode(bytes.subarray(offset + 4, offset + 8));
    let headerSize = 8;

    if (size === 1 && offset + 16 <= end) {
      // 64-bit size fallback
      size = readUint32BE(bytes, offset + 12);
      headerSize = 16;
    } else if (size === 0) {
      size = end - offset;
    }

    if (size < 8 || offset + size > end) break;
    const atomEnd = offset + size;

    if (type === 'moov' || type === 'udta' || type === 'ilst') {
      parseMP4Atoms(bytes, offset + headerSize, atomEnd, out);
    } else if (type === 'meta') {
      // 'meta' is a full box with 4 bytes version/flags
      parseMP4Atoms(bytes, offset + headerSize + 4, atomEnd, out);
    } else if (type === 'covr' || type === '\xa9nam' || type === '\xa9ART' || type === '\xa9alb') {
      // Find nested 'data' atom
      let sub = offset + headerSize;
      while (sub + 16 <= atomEnd) {
        const subSize = readUint32BE(bytes, sub);
        const subType = decoder.decode(bytes.subarray(sub + 4, sub + 8));
        if (subSize < 16 || sub + subSize > atomEnd) break;
        if (subType === 'data') {
          const payload = bytes.subarray(sub + 16, sub + subSize);
          if (type === 'covr' && !out.artworkUrl && payload.length > 16) {
            const mime = detectImageMime(payload);
            out.artworkUrl = URL.createObjectURL(new Blob([new Uint8Array(payload)], { type: mime }));
          } else if (type === '\xa9nam') {
            out.title = utf8.decode(payload).trim() || out.title;
          } else if (type === '\xa9ART') {
            out.artist = utf8.decode(payload).trim() || out.artist;
          } else if (type === '\xa9alb') {
            out.album = utf8.decode(payload).trim() || out.album;
          }
        }
        sub += subSize;
      }
    }

    offset = atomEnd;
  }
}

function parseFlac(bytes: Uint8Array): ExtractedAudioMeta {
  const result: ExtractedAudioMeta = {};
  if (
    bytes.length < 8 ||
    bytes[0] !== 0x66 ||
    bytes[1] !== 0x4c ||
    bytes[2] !== 0x61 ||
    bytes[3] !== 0x43
  ) {
    return result;
  }

  let offset = 4;
  const ascii = new TextDecoder('latin1');
  const utf8 = new TextDecoder('utf-8');

  while (offset + 4 <= bytes.length) {
    const headerByte = bytes[offset];
    const isLast = (headerByte & 0x80) !== 0;
    const blockType = headerByte & 0x7f;
    const blockSize =
      (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
    offset += 4;

    if (offset + blockSize > bytes.length) break;
    const block = bytes.subarray(offset, offset + blockSize);

    if (blockType === 6 && !result.artworkUrl && block.length > 32) {
      // METADATA_BLOCK_PICTURE
      let pos = 4; // skip picture type
      const mimeLen = readUint32BE(block, pos);
      pos += 4;
      const mime = ascii.decode(block.subarray(pos, pos + mimeLen)) || 'image/jpeg';
      pos += mimeLen;
      const descLen = readUint32BE(block, pos);
      pos += 4 + descLen + 16; // skip desc + width/height/depth/colors
      if (pos + 4 <= block.length) {
        const picLen = readUint32BE(block, pos);
        pos += 4;
        if (pos + picLen <= block.length && picLen > 16) {
          const picBytes = block.subarray(pos, pos + picLen);
          result.artworkUrl = URL.createObjectURL(new Blob([new Uint8Array(picBytes)], { type: mime }));
        }
      }
    } else if (blockType === 4 && block.length > 8) {
      // VORBIS_COMMENT (little endian lengths)
      const view = new DataView(block.buffer, block.byteOffset, block.byteLength);
      let pos = 0;
      const vendorLen = view.getUint32(pos, true);
      pos += 4 + vendorLen;
      if (pos + 4 <= block.length) {
        const count = view.getUint32(pos, true);
        pos += 4;
        for (let i = 0; i < count && pos + 4 <= block.length; i++) {
          const len = view.getUint32(pos, true);
          pos += 4;
          if (pos + len > block.length) break;
          const entry = utf8.decode(block.subarray(pos, pos + len));
          pos += len;
          const eqIdx = entry.indexOf('=');
          if (eqIdx > 0) {
            const key = entry.slice(0, eqIdx).toUpperCase();
            const val = entry.slice(eqIdx + 1).trim();
            if (key === 'TITLE') result.title = val;
            else if (key === 'ARTIST' || key === 'ALBUMARTIST') result.artist = result.artist || val;
            else if (key === 'ALBUM') result.album = val;
          }
        }
      }
    }

    offset += blockSize;
    if (isLast) break;
  }

  return result;
}

export async function extractAudioMetadata(file: File): Promise<ExtractedAudioMeta> {
  try {
    // Read first 8MB (covers ID3v2, FLAC, and fast-start M4B/M4A)
    const headLimit = Math.min(file.size, 8 * 1024 * 1024);
    const headBuf = await file.slice(0, headLimit).arrayBuffer();
    const headBytes = new Uint8Array(headBuf);

    // ID3v2 (MP3 / AAC)
    if (headBytes[0] === 0x49 && headBytes[1] === 0x44 && headBytes[2] === 0x33) {
      return parseID3v2(headBytes);
    }

    // FLAC
    if (
      headBytes[0] === 0x66 &&
      headBytes[1] === 0x4c &&
      headBytes[2] === 0x61 &&
      headBytes[3] === 0x43
    ) {
      return parseFlac(headBytes);
    }

    // MP4 / M4A / M4B Audiobooks
    const ftypSig =
      headBytes.length > 8 &&
      headBytes[4] === 0x66 &&
      headBytes[5] === 0x74 &&
      headBytes[6] === 0x79 &&
      headBytes[7] === 0x70;

    if (ftypSig || /\.(m4a|m4b|mp4)$/i.test(file.name)) {
      const out: ExtractedAudioMeta = {};
      parseMP4Atoms(headBytes, 0, headBytes.length, out);

      // Many M4B audiobooks put 'moov' at the end of the file
      if (!out.artworkUrl && file.size > headLimit) {
        const tailStart = Math.max(0, file.size - 8 * 1024 * 1024);
        const tailBuf = await file.slice(tailStart, file.size).arrayBuffer();
        const tailBytes = new Uint8Array(tailBuf);
        // Find top-level 'moov' atom offset in tail
        for (let i = 0; i + 8 < tailBytes.length; i++) {
          if (
            tailBytes[i + 4] === 0x6d &&
            tailBytes[i + 5] === 0x6f &&
            tailBytes[i + 6] === 0x6f &&
            tailBytes[i + 7] === 0x76
          ) {
            parseMP4Atoms(tailBytes, i, tailBytes.length, out);
            break;
          }
        }
      }
      return out;
    }

    return {};
  } catch {
    return {};
  }
}
