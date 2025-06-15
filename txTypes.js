// txTypes.js
// Utilities for serializing all Ethereum tx types: Legacy, EIP-1559, EIP-2930
import { rlpEncode } from './abi/rlp.js';
import { keccak256, ecsign } from 'ethereumjs-util';

// Convert value to Buffer for RLP
function toBuf(val) {
  if (typeof val === 'string' && val.startsWith('0x')) {
    let hex = val.slice(2);
    if (hex.length % 2) hex = '0' + hex;
    return Buffer.from(hex, 'hex');
  }
  if (typeof val === 'number' || typeof val === 'bigint') {
    if (val === 0) return Buffer.alloc(0);
    let hex = BigInt(val).toString(16);
    if (hex.length % 2) hex = '0' + hex;
    return Buffer.from(hex, 'hex');
  }
  if (Buffer.isBuffer(val)) return val;
  if (val === null || val === undefined) return Buffer.alloc(0);
  throw new Error('Cannot convert value to buffer');
}

/**
 * Serialize legacy (pre-EIP-2930) transaction to RLP
 * @param {Object} tx - Transaction fields
 * @param {number} v - v value (default 0)
 * @param {number} r - r value (default 0)
 * @param {number} s - s value (default 0)
 * @returns {Buffer} RLP-encoded transaction
 */
export function serializeLegacyTx(tx, v = 0, r = 0, s = 0) {
  const fields = [
    tx.nonce || 0,
    tx.gasPrice || 0,
    tx.gas || 0,
    tx.to ? tx.to : '',
    tx.value || 0,
    tx.data ? tx.data : '',
    tx.chainId || 1,
    v,
    r,
    s
  ];
  return rlpEncode(fields);
}

/**
 * Serialize EIP-1559 (type 2) transaction to RLP
 * @param {Object} tx - Transaction fields
 * @param {number} v - v value (default 0)
 * @param {number} r - r value (default 0)
 * @param {number} s - s value (default 0)
 * @returns {Buffer} RLP-encoded transaction with 0x02 prefix
 */
export function serializeEIP1559Tx(tx, v = 0, r = 0, s = 0) {
  // EIP-1559 tx: [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, v, r, s]
  const fields = [
    tx.chainId || 1,
    tx.nonce || 0,
    tx.maxPriorityFeePerGas || 0,
    tx.maxFeePerGas || 0,
    tx.gas || 0,
    tx.to ? tx.to : '',
    tx.value || 0,
    tx.data ? tx.data : '',
    tx.accessList || [],
    v,
    r,
    s
  ];
  const inner = rlpEncode(fields);
  // EIP-1559 tx type prefix is 0x02
  return Buffer.concat([Buffer.from([2]), inner]);
}

/**
 * Serialize EIP-2930 (type 1) transaction to RLP
 * @param {Object} tx - Transaction fields
 * @param {number} v - v value (default 0)
 * @param {number} r - r value (default 0)
 * @param {number} s - s value (default 0)
 * @returns {Buffer} RLP-encoded transaction with 0x01 prefix
 */
export function serializeEIP2930Tx(tx, v = 0, r = 0, s = 0) {
  // EIP-2930 tx: [chainId, nonce, gasPrice, gasLimit, to, value, data, accessList, v, r, s]
  const fields = [
    tx.chainId || 1,
    tx.nonce || 0,
    tx.gasPrice || 0,
    tx.gas || 0,
    tx.to ? tx.to : '',
    tx.value || 0,
    tx.data ? tx.data : '',
    tx.accessList || [],
    v,
    r,
    s
  ];
  const inner = rlpEncode(fields);
  // EIP-2930 tx type prefix is 0x01
  return Buffer.concat([Buffer.from([1]), inner]);
}

/**
 * Sign a legacy/EIP-155/EIP-1559/EIP-2930 transaction with a private key
 * @param {Object} tx - Transaction fields
 * @param {Buffer|string} privateKey - 32-byte private key (Buffer or 0x string)
 * @returns {string} Raw signed transaction hex string
 */
export function signTx(tx, privateKey) {
  // Convert privateKey to Buffer if needed
  const pk = Buffer.isBuffer(privateKey) ? privateKey : Buffer.from(privateKey.replace(/^0x/, ''), 'hex');
  let msgHash, v, r, s, raw;
  if (tx.maxFeePerGas !== undefined && tx.maxPriorityFeePerGas !== undefined) {
    // EIP-1559
    const fields = [
      tx.chainId || 1,
      tx.nonce || 0,
      tx.maxPriorityFeePerGas || 0,
      tx.maxFeePerGas || 0,
      tx.gas || 0,
      tx.to ? tx.to : '',
      tx.value || 0,
      tx.data ? tx.data : '',
      tx.accessList || []
    ];
    const inner = rlpEncode(fields);
    const txType = Buffer.from([2]);
    msgHash = keccak256(Buffer.concat([txType, inner]));
    ({ v, r, s } = ecsign(msgHash, pk));
    raw = Buffer.concat([txType, rlpEncode([...fields, v, r, s])]);
  } else if (tx.accessList !== undefined) {
    // EIP-2930
    const fields = [
      tx.chainId || 1,
      tx.nonce || 0,
      tx.gasPrice || 0,
      tx.gas || 0,
      tx.to ? tx.to : '',
      tx.value || 0,
      tx.data ? tx.data : '',
      tx.accessList || []
    ];
    const inner = rlpEncode(fields);
    const txType = Buffer.from([1]);
    msgHash = keccak256(Buffer.concat([txType, inner]));
    ({ v, r, s } = ecsign(msgHash, pk));
    raw = Buffer.concat([txType, rlpEncode([...fields, v, r, s])]);
  } else {
    // Legacy/EIP-155
    const chainId = tx.chainId || 1;
    const fields = [
      tx.nonce || 0,
      tx.gasPrice || 0,
      tx.gas || 0,
      tx.to ? tx.to : '',
      tx.value || 0,
      tx.data ? tx.data : '',
      chainId,
      0,
      0
    ];
    const rawForSig = rlpEncode(fields);
    msgHash = keccak256(rawForSig);
    const sig = ecsign(msgHash, pk);
    // EIP-155: v = v + chainId * 2 + 8
    v = sig.v + chainId * 2 + 8;
    r = sig.r;
    s = sig.s;
    raw = rlpEncode([
      tx.nonce || 0,
      tx.gasPrice || 0,
      tx.gas || 0,
      tx.to ? tx.to : '',
      tx.value || 0,
      tx.data ? tx.data : '',
      v,
      r,
      s
    ]);
  }
  return '0x' + raw.toString('hex');
}
