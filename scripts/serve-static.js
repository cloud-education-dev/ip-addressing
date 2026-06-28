const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, '../apps/web/out');
const BASE_PATH = '/ip-addressing';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url;
  
  // Strip BASE_PATH if present
  if (urlPath.startsWith(BASE_PATH)) {
    urlPath = urlPath.slice(BASE_PATH.length);
  }
  
  // Default to index.html for root or directories
  if (urlPath === '/' || urlPath === '') {
    urlPath = '/index.html';
  }
  
  // Clean query parameters/hashes from path
  const cleanPath = urlPath.split('?')[0].split('#')[0];
  const filePath = path.join(PUBLIC_DIR, cleanPath);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fallback to 404.html
      const errorPage = path.join(PUBLIC_DIR, '404.html');
      fs.readFile(errorPage, (err404, data404) => {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(err404 ? '404 Not Found' : data404);
      });
      return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}${BASE_PATH}/`);
});
