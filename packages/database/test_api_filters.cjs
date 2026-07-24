const http = require('http');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Read private key from .env file
const envContent = fs.readFileSync(path.join(__dirname, '../../.env'), 'utf8');
const jwtPrivateKeyBase64 = envContent.match(/JWT_PRIVATE_KEY_BASE64="([^"]+)"/)[1];
const privateKey = Buffer.from(jwtPrivateKeyBase64, 'base64').toString('utf8');

// Sign a token for tenant admin
const token = jwt.sign(
  {
    sub: '00000000-0000-0000-0000-000000000003', // admin user id
    email: 'admin@neetplatform.com',
    userType: 'SYSTEM',
    tenantId: '00000000-0000-0000-0000-000000000001',
  },
  privateKey,
  { algorithm: 'RS256', expiresIn: '1h' },
);

const testParams = [
  // 1. Filter status
  { page: 1, perPage: 10, search: '', status: 'ACTIVE' },
  // 2. Filter courseId (with empty string)
  { page: 1, perPage: 10, search: '', status: 'ALL', courseId: '' },
  // 3. Filter courseId (with valid UUID)
  {
    page: 1,
    perPage: 10,
    search: '',
    status: 'ALL',
    courseId: '00000000-0000-0000-0000-000000000020',
  },
  // 4. Filter status invalid
  { page: 1, perPage: 10, search: '', status: 'INVALID' },
];

function makeRequest(params) {
  return new Promise((resolve) => {
    const queryString = Object.keys(params)
      .map((k) => `${k}=${encodeURIComponent(params[k])}`)
      .join('&');

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/master/batches?${queryString}`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            params,
            statusCode: res.statusCode,
            response: parsed,
          });
        } catch {
          resolve({
            params,
            statusCode: res.statusCode,
            response: data,
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        params,
        statusCode: 500,
        response: err.message,
      });
    });

    req.end();
  });
}

async function run() {
  for (const params of testParams) {
    const result = await makeRequest(params);
    console.log(`\nPARAMS: ${JSON.stringify(result.params)}`);
    console.log(`STATUS CODE: ${result.statusCode}`);
    console.log(`RESPONSE: ${JSON.stringify(result.response)}`);
  }
}

run();
