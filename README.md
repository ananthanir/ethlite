# eth-tx

A minimal Ethereum transaction sending library using only the Ethereum client API.

## Features
- Build transaction objects for contract deployment and function calls
- Encode function call data (function selector and ABI arguments, static and dynamic types)
- Serialize and send all Ethereum transaction types: Legacy, EIP-1559, EIP-2930
- Minimal local ABI and RLP encoding (no third-party ABI libraries)
- Send raw transactions via JSON-RPC

## Usage

### 1. Build and Encode a Function Call
```js
import { buildTx, encodeFunctionCall, serializeTx, sendRawTransaction } from './index.js';

// Encode a contract function call
env const data = encodeFunctionCall(
  'transfer(address,uint256)',
  ['address', 'uint256'],
  ['0x1111111111111111111111111111111111111111', 1000]
);

// Build a transaction object
const tx = buildTx({
  to: '0xContractAddress',
  value: 0,
  data,
  gas: 21000,
  gasPrice: 1000000000,
  nonce: 0,
  chainId: 1
});
```

### 2. Serialize the Transaction
```js
const rawTx = serializeTx(tx); // Returns raw RLP-encoded hex string
```

### 3. Send the Transaction
```js
// Send to your Ethereum node (replace with your node's RPC URL)
// const txHash = await sendRawTransaction('https://mainnet.infura.io/v3/YOUR_KEY', rawTx);
```

## Supported Transaction Types
- **Legacy** (pre-EIP-2930)
- **EIP-1559** (type 2, with `maxFeePerGas` and `maxPriorityFeePerGas`)
- **EIP-2930** (type 1, with `accessList`)

## ABI Encoding
- Supports static types: `address`, `uint256`, `bool`, `bytesN`
- Supports dynamic types: `bytes`, `string`
- No third-party ABI library required

## RLP Encoding
- Minimal RLP encoder for transaction serialization

## Example: Encode and Serialize a Transaction
```js
const data = encodeFunctionCall('setMessage(string)', ['string'], ['Hello, Ethereum!']);
const tx = buildTx({
  to: '0xContractAddress',
  value: 0,
  data,
  gas: 21000,
  gasPrice: 1000000000,
  nonce: 0,
  chainId: 1
});
const rawTx = serializeTx(tx);
console.log('Raw transaction:', rawTx);
```

## Note
- For contract deployment, set `to` to `undefined` and `data` to contract bytecode.
- For function call, set `to` to contract address and `data` to encoded function call.
- This library is for educational/demo purposes and does not include transaction signing.
