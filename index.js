// Minimal Ethereum transaction sending library
// Provides helpers for encoding contract calls and serializing transactions
import { getSelector, encodeArguments } from './lib/encode.js';
import { serializeLegacyTx, serializeEIP1559Tx, serializeEIP2930Tx } from './lib/txTypes.js';

// Encode a contract function call for the data field
export function encodeFunctionCall(signature, types, values) {
  const selector = getSelector(signature); // 4-byte selector
  const encodedArgs = encodeArguments(types, values); // ABI-encoded args
  return '0x' + selector + encodedArgs;
}

// Build a transaction object from provided fields
export function buildTx(txFields) {
  return { ...txFields };
}

// Serialize a transaction object to raw hex (handles all tx types)
export function serializeTx(tx) {
  if (tx.maxFeePerGas !== undefined && tx.maxPriorityFeePerGas !== undefined) {
    return '0x' + serializeEIP1559Tx(tx).toString('hex');
  } else if (tx.accessList !== undefined) {
    return '0x' + serializeEIP2930Tx(tx).toString('hex');
  } else {
    return '0x' + serializeLegacyTx(tx).toString('hex');
  }
}
