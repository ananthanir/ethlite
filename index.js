// index.js
// Minimal Ethereum transaction sending library using only Ethereum client API

// Import ABI encoding helpers
import { getSelector, encodeArguments } from './abi/encode.js';
// Import transaction type serializers
import { serializeLegacyTx, serializeEIP1559Tx, serializeEIP2930Tx } from './txTypes.js';
// Import https for JSON-RPC requests
import https from 'https';

/**
 * Encode function call data for contract interaction.
 * @param {string} signature - Function signature, e.g. 'transfer(address,uint256)'
 * @param {Array} types - Array of argument types, e.g. ['address', 'uint256']
 * @param {Array} values - Array of argument values, e.g. ['0x...', 1000]
 * @returns {string} Hex string for data field
 */
export function encodeFunctionCall(signature, types, values) {
  // Get the 4-byte function selector
  const selector = getSelector(signature);
  // ABI-encode the arguments
  const encodedArgs = encodeArguments(types, values);
  // Concatenate selector and encoded arguments
  return '0x' + selector + encodedArgs;
}

/**
 * Build a transaction object from fields.
 * @param {Object} txFields - Transaction fields (to, value, data, gas, gasPrice, nonce, chainId, ...)
 * @returns {Object} Transaction object
 */
export function buildTx(txFields) {
  // Shallow copy of fields
  return { ...txFields };
}

/**
 * Send a raw transaction using Ethereum JSON-RPC.
 * @param {string} rpcUrl - Ethereum node RPC URL
 * @param {string} rawTx - Raw transaction hex string
 * @returns {Promise<string>} Transaction hash
 */
export function sendRawTransaction(rpcUrl, rawTx) {
  return new Promise((resolve, reject) => {
    // Prepare JSON-RPC payload
    const data = JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_sendRawTransaction',
      params: [rawTx],
      id: 1
    });
    // Parse URL
    const url = new URL(rpcUrl);
    // Set up HTTPS request options
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    // Send HTTPS request
    const req = https.request(options, res => {
      let body = '';
      // Collect response data
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          // Parse JSON response
          const json = JSON.parse(body);
          if (json.result) resolve(json.result);
          else reject(json.error || body);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Serialize any Ethereum transaction type (legacy, EIP-1559, EIP-2930) to raw hex.
 * @param {Object} tx - Transaction fields
 * @returns {string} Raw transaction hex string
 */
export function serializeTx(tx) {
  // EIP-1559 transaction (type 2)
  if (tx.maxFeePerGas !== undefined && tx.maxPriorityFeePerGas !== undefined) {
    const raw = serializeEIP1559Tx(tx);
    return '0x' + raw.toString('hex');
  // EIP-2930 transaction (type 1)
  } else if (tx.accessList !== undefined) {
    const raw = serializeEIP2930Tx(tx);
    return '0x' + raw.toString('hex');
  // Legacy transaction (type 0)
  } else {
    const raw = serializeLegacyTx(tx);
    return '0x' + raw.toString('hex');
  }
}
