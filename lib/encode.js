// Minimal ABI encoder for Ethereum contract calls
import { keccak256 } from 'ethereumjs-util';

// Pad a hex string to 32 bytes (left pad with zeros)
function padTo32Bytes(hex) {
  return hex.padStart(64, '0');
}

// Encode uint256 as 32-byte hex
function encodeUint256(value) {
  let hex = BigInt(value).toString(16);
  return padTo32Bytes(hex);
}

// Encode address as 32-byte hex
function encodeAddress(value) {
  let hex = value.toLowerCase().replace(/^0x/, '');
  return padTo32Bytes(hex);
}

// Encode boolean as 32-byte hex (0 or 1)
function encodeBool(value) {
  return padTo32Bytes(value ? '1' : '0');
}

// Encode fixed-size bytes (bytesN)
function encodeBytes(value, size) {
  let hex = value.toLowerCase().replace(/^0x/, '');
  if (size) {
    if (hex.length !== size * 2) throw new Error('Invalid bytesN length');
    return padTo32Bytes(hex);
  } else {
    throw new Error('Dynamic bytes not supported');
  }
}

// Convert value to hex string for dynamic types
function toHex(value) {
  if (Buffer.isBuffer(value)) return value.toString('hex');
  if (typeof value === 'string') {
    if (value.startsWith('0x')) return value.slice(2);
    return Buffer.from(value, 'utf8').toString('hex');
  }
  if (typeof value === 'bigint' || typeof value === 'number') {
    if (value < 0) throw new Error('Negative numbers not supported');
    let hex = BigInt(value).toString(16);
    if (hex.length % 2 !== 0) hex = '0' + hex;
    return hex;
  }
  throw new Error('Cannot convert value to hex');
}

// Encode dynamic bytes (bytes, string)
function encodeDynamicBytes(value) {
  let hex = toHex(value);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  const length = padTo32Bytes((hex.length / 2).toString(16));
  const data = hex.padEnd(Math.ceil(hex.length / 64) * 64, '0');
  return length + data;
}

// Encode string as dynamic bytes
function encodeString(value) {
  const hex = Buffer.from(value, 'utf8').toString('hex');
  return encodeDynamicBytes(hex);
}

// Helper: encode an array of values for ABI
function encodeArray(elementType, arr) {
  // Dynamic array: encode length, then each element
  let encoded = padTo32Bytes(arr.length.toString(16));
  for (let v of arr) {
    if (elementType === 'uint256' || elementType === 'uint') encoded += encodeUint256(v);
    else if (elementType === 'address') encoded += encodeAddress(v);
    else if (elementType === 'bool') encoded += encodeBool(v);
    else if (elementType === 'string') encoded += encodeString(v);
    else if (elementType.startsWith('bytes') && elementType !== 'bytes') {
      const size = parseInt(elementType.slice(5), 10);
      encoded += encodeBytes(v, size);
    } else if (elementType === 'bytes') encoded += encodeDynamicBytes(v);
    else throw new Error('Array element type not supported: ' + elementType);
  }
  return encoded;
}

// ABI-encode function arguments for contract call (now supports arrays)
export function encodeArguments(types, values) {
  if (types.length !== values.length) throw new Error('Types/values length mismatch');
  const heads = [];
  const tails = [];
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const value = values[i];
    if (type.endsWith('[]')) {
      // Array type (dynamic)
      heads.push('');
      const elementType = type.slice(0, -2);
      tails.push(encodeArray(elementType, value));
    } else if (type === 'uint256' || type === 'uint') heads.push(encodeUint256(value));
    else if (type === 'address') heads.push(encodeAddress(value));
    else if (type === 'bool') heads.push(encodeBool(value));
    else if (type.startsWith('bytes') && type !== 'bytes') {
      const size = parseInt(type.slice(5), 10);
      heads.push(encodeBytes(value, size));
    } else if (type === 'bytes') {
      heads.push('');
      tails.push(encodeDynamicBytes(value));
    } else if (type === 'string') {
      heads.push('');
      tails.push(encodeString(value));
    } else {
      throw new Error('Type not supported: ' + type);
    }
  }
  let headLen = types.length * 32;
  let tailOffset = 0;
  let tailData = '';
  let dynamicIndex = 0;
  for (let i = 0; i < types.length; i++) {
    if (heads[i] === '') {
      heads[i] = padTo32Bytes((headLen + tailOffset).toString(16));
      tailData += tails[dynamicIndex++];
      tailOffset = tailData.length / 2;
    }
  }
  return heads.join('') + tailData;
}

// Get 4-byte function selector from signature
export function getSelector(signature) {
  return keccak256(Buffer.from(signature)).slice(0, 4).toString('hex');
}
