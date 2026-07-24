const http = require('http');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Read private key from .env file
const envContent = fs.readFileSync(path.join(__dirname, '../../.env'), 'utf8');
const jwtPrivateKeyBase64 = envContent.match(
  /JWT_PRIVATE_KEY_BASE64="([^"]+)"/,
)[1];
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

// Payload representing creating a new tutor
const payload = {
  firstName: 'Test',
  lastName: 'Tutor',
  email: `test_tutor_${Date.now()}@neetplatform.com`,
  phone: '+919876543210',
  employeeCode: `TUT_${Date.now().toString(36).toUpperCase()}`,
  designation: 'Senior Physics Faculty',
  qualification: 'M.Sc Physics',
  specialization: 'Mechanics',
  yearsOfExperience: 5,
  previousInstitution: 'Test Institute',
  bio: 'Test bio',
  createLogin: true,
  subjectIds: ['00000000-0000-0000-0000-000000000040'], // Physics subject id
  branchIds: ['00000000-0000-0000-0000-000000000006'], // Sivakasi branch id
  batchIds: ['00000000-0000-0000-0000-000000000030'], // NEET26_SIV_A batch id
};

const reqData = JSON.stringify(payload);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/people/tutors',
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(reqData),
    Authorization: `Bearer ${token}`,
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`STATUS CODE: ${res.statusCode}`);
    try {
      console.log('RESPONSE:', JSON.stringify(JSON.parse(data), null, 2));
    } catch {
      console.log('RESPONSE:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('Request Error:', err);
});

req.write(reqData);
req.end();
