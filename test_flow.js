const http = require('http');

function request(method, path, data = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5173,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body.startsWith('{') || body.startsWith('[') ? JSON.parse(body) : body
        });
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  try {
    // 1. Login as author
    console.log('Logging in as author...');
    const loginRes = await request('POST', '/api/auth/login', { email: 'author1@elevatebox.com', role: 'author' });
    console.log('Login Response:', loginRes.status, loginRes.body);
    const authorCookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : '';
    
    // 2. Login as reviewer
    console.log('Logging in as reviewer...');
    const reviewerLoginRes = await request('POST', '/api/auth/login', { email: 'reviewer1@elevatebox.com', role: 'reviewer' });
    console.log('Reviewer Login Response:', reviewerLoginRes.status, reviewerLoginRes.body);
    const reviewerCookie = reviewerLoginRes.headers['set-cookie'] ? reviewerLoginRes.headers['set-cookie'][0] : '';

    // We can't hit the create endpoint via API easily if it's a +page.server.ts action. 
    // Ah, wait, document creation is a POST to /documents/new
  } catch (err) {
    console.error(err);
  }
}

run();
