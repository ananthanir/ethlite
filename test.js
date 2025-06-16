// Example test script: store and retrieve a value from a contract
import { buildTx, encodeFunctionCall } from './index.js';
import { signTx } from './lib/txTypes.js';
import { sendRawTransactionHttp, ethCall } from './lib/sendTx.js';

// Main test routine
async function main() {
  // RPC and contract/account setup
  const rpcUrl = 'http://localhost:8546';
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // deployed contract
  const from = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // sender address
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // sender private key

  // Encode call to store(uint256)
  const storeData = encodeFunctionCall('store(uint256)', ['uint256'], [11111]);
  const nonce = 6; // update as needed
  // Build and sign transaction
  const tx = buildTx({
    to: contractAddress,
    value: 0,
    data: storeData,
    gas: 100000,
    gasPrice: 1000000000,
    nonce,
    chainId: 31337
  });
  const signedTx = signTx(tx, privateKey);
  // Send transaction
  const txHash = await sendRawTransactionHttp(rpcUrl, signedTx);
  console.log('store(uint256) txHash:', txHash);
  // Wait for mining
  await new Promise(res => setTimeout(res, 5000));
  // Encode and call retrieve()
  const retrieveData = encodeFunctionCall('retrieve()', [], []);
  const callObj = { to: contractAddress, data: retrieveData, from };
  const result = await ethCall(rpcUrl, callObj);
  const value = parseInt(result, 16);
  console.log('retrieve() value:', value);
}

main().catch(console.error);