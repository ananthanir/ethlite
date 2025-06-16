// HTTP helpers for sending Ethereum transactions and contract calls
import http from 'http';

// Send a raw transaction using HTTP (eth_sendRawTransaction)
export async function sendRawTransactionHttp(rpcUrl, rawTx) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_sendRawTransaction',
      params: [rawTx],
      id: 1
    });
    const url = new URL(rpcUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 8545,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
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

// eth_call for reading contract state using HTTP
export async function ethCall(rpcUrl, callObj, block = 'latest') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [callObj, block],
      id: 1
    });
    const url = new URL(rpcUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 8545,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
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
