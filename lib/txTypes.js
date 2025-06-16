// Utilities for serializing and signing all Ethereum transaction types
import { rlpEncode } from './rlp.js';
import { keccak256, ecsign } from 'ethereumjs-util';

// Serialize legacy (pre-EIP-2930) transaction to RLP
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

// Serialize EIP-1559 (type 2) transaction to RLP
export function serializeEIP1559Tx(tx, v = 0, r = 0, s = 0) {
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
  return Buffer.concat([Buffer.from([2]), inner]);
}

// Serialize EIP-2930 (type 1) transaction to RLP
export function serializeEIP2930Tx(tx, v = 0, r = 0, s = 0) {
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
  return Buffer.concat([Buffer.from([1]), inner]);
}

// Sign a legacy/EIP-155/EIP-1559/EIP-2930 transaction with a private key
export function signTx(tx, privateKey) {
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
