# Minimal Ethereum Transaction Library

This project provides a minimal, dependency-light set of utilities for encoding, signing, and sending Ethereum transactions and contract calls. It is designed for educational, testing, and low-level scripting purposes.

## Features
- **ABI Encoding**: Encode function calls and arguments for Ethereum smart contracts, including support for dynamic types and arrays.
- **RLP Encoding**: Minimal Recursive Length Prefix (RLP) encoder for transaction serialization.
- **Transaction Serialization**: Serialize all Ethereum transaction types: Legacy, EIP-1559, and EIP-2930.
- **Transaction Signing**: Sign transactions with a private key (supports all major tx types).
- **Raw Transaction Sending**: Send signed transactions to an Ethereum node via HTTP JSON-RPC.
- **Eth Call Support**: Read contract state using eth_call over HTTP.

## File Overview
- `index.js` — Main entry point. Exports helpers for encoding function calls, building tx objects, and serializing transactions.
- `lib/encode.js` — Minimal ABI encoder. Encodes arguments for contract calls, including support for arrays and dynamic types.
- `lib/rlp.js` — Minimal RLP encoder for serializing transaction fields.
- `lib/txTypes.js` — Serializes and signs all Ethereum transaction types (Legacy, EIP-1559, EIP-2930).
- `lib/sendTx.js` — HTTP helpers for sending raw transactions and making eth_call requests to an Ethereum node.
- `test.js` — Example script: demonstrates encoding, signing, sending a transaction, and reading contract state.

## Example Usage
See `test.js` for a complete example of how to encode a contract call, build and sign a transaction, send it to a local node, and read contract state.

---

**Note:** This library is for educational and testing purposes. For production use, prefer established libraries like ethers.js or web3.js.
