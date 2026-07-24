const http = require('http');

const testParams = [
  // 1. Default loading params
  { page: 1, perPage: 10, search: '', status: 'ALL' },
  // 2. Filter status
  { page: 1, perPage: 10, search: '', status: 'ACTIVE' },
  // 3. Filter courseId (with empty string)
  { page: 1, perPage: 10, search: '', status: 'ALL', courseId: '' },
  // 4. Filter courseId (with invalid UUID)
  { page: 1, perPage: 10, search: '', status: 'ALL', courseId: 'invalid-uuid' },
  // 5. Filter courseId (with valid UUID)
  {
    page: 1,
    perPage: 10,
    search: '',
    status: 'ALL',
    courseId: '00000000-0000-0000-0000-000000000020',
  },
  // 6. Filter status invalid
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
