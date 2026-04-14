const axios = require('axios');

async function test() {
  const baseUrl = 'http://localhost:5000/api';
  const endpoints = [
    '/users/1',
    '/rooms',
    '/owner/send-otp', // will fail 401
  ];

  for (const url of endpoints) {
    try {
      const res = await axios.get(baseUrl + url);
      console.log(`GET ${url}: ${res.status}`);
    } catch (err) {
      console.log(`GET ${url}: ${err.response?.status || 'ERROR'}`);
    }
  }
}
test();
