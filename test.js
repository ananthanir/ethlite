// test.js
// Example usage of eth-tx library
import { buildTx, sendRawTransaction, encodeFunctionCall } from './index.js';

async function main() {
  // Example: send a raw transaction (dummy values)
  const tx = buildTx({
    to: '0xContractAddress',
    value: '0x0',
    data: '0x', // Use encodeFunctionCall for contract calls
    gas: '0x5208',
    gasPrice: '0x3B9ACA00',
    nonce: '0x0',
    chainId: 1
  });

  // Normally, you would sign the transaction and serialize it to rawTxHex
  const rawTxHex = '0x...'; // Replace with actual signed tx

  // Send transaction (replace with your node's RPC URL)
  // const txHash = await sendRawTransaction('https://mainnet.infura.io/v3/YOUR_KEY', rawTxHex);
  // console.log('Transaction hash:', txHash);
}

// Test encodeFunctionCall
function testEncodeFunctionCall() {
  // Example: transfer(address,uint256)
  const signature = 'transfer(address,uint256)';
  const types = ['address', 'uint256'];
  const values = ['0x1111111111111111111111111111111111111111', 1000];
  const data = encodeFunctionCall(signature, types, values);
  console.log('Encoded transfer(address,uint256):', data);

  // Example: setMessage(string)
  const signature2 = 'setMessage(string)';
  const types2 = ['string'];
  const values2 = ['Hello, Ethereum!'];
  const data2 = encodeFunctionCall(signature2, types2, values2);
  console.log('Encoded setMessage(string):', data2);
}

main().catch(console.error);
testEncodeFunctionCall();


0xa9059cbb000000000000000000000000111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000003e8

0xa9059cbb000000000000000000000000111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000003e8