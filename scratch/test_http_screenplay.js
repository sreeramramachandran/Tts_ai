const http = require('http');

const payload = JSON.stringify({
  text: "പണ്ട് പണ്ട് ഒരു വലിയ കാട്ടിൽ ശക്തനായ ഒരു സിംഹരാജാവ് ഭരിച്ചിരുന്നു. സിംഹം വലിയ പാറപ്പുറത്തു കയറി നിന്ന് ഉറക്കെ അലറി[roar]."
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/screenplay',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload, 'utf-8')
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("RESPONSE:");
    console.log(data);
  });
});

req.write(payload, 'utf-8');
req.end();
