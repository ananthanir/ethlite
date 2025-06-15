// abi/rlp.js
// Minimal RLP encoder for Ethereum transaction serialization

// Convert value to Buffer for RLP encoding
function toBuffer(value) {
  if (typeof value === 'string' && value.startsWith('0x')) {
    let hex = value.slice(2);
    if (hex.length % 2) hex = '0' + hex;
    return Buffer.from(hex, 'hex');
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    if (value === 0) return Buffer.alloc(0);
    let hex = BigInt(value).toString(16);
    if (hex.length % 2) hex = '0' + hex;
    return Buffer.from(hex, 'hex');
  }
  if (Buffer.isBuffer(value)) return value;
  if (value === null || value === undefined) return Buffer.alloc(0);
  throw new Error('Cannot convert value to buffer');
}

// Encode length for RLP (short/long form)
function encodeLength(len, offset) {
  if (len < 56) {
    return Buffer.from([len + offset]);
  } else {
    const hexLength = len.toString(16);
    const lLength = Math.ceil(hexLength.length / 2);
    const buf = Buffer.alloc(1 + lLength);
    buf[0] = offset + 55 + lLength;
    buf.write(hexLength, 1, 'hex');
    return buf;
  }
}

/**
 * RLP-encode a value or array of values
 * @param {any|any[]} input - Value or array to encode
 * @returns {Buffer} RLP-encoded buffer
 */
export function rlpEncode(input) {
  if (Array.isArray(input)) {
    // Encode each item and concatenate
    const output = Buffer.concat(input.map(rlpEncode));
    // Prefix with list marker
    return Buffer.concat([encodeLength(output.length, 0xc0), output]);
  } else {
    // Encode single value
    const buf = toBuffer(input);
    // Single byte < 0x80 is its own encoding
    if (buf.length === 1 && buf[0] < 0x80) return buf;
    // Otherwise, prefix with length
    return Buffer.concat([encodeLength(buf.length, 0x80), buf]);
  }
}
