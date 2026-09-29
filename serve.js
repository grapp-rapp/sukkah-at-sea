// Minimal static file server for local playtesting: node serve.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2]) || 5178;
const ROOT = __dirname;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

http.createServer((req, res) => {
  // dev only: save a screenshot posted from the page (data URL body) to shots/
  if (req.method === 'POST' && req.url.startsWith('/__shot')) {
    let body = ''; req.on('data', (c) => (body += c)); req.on('end', () => {
      const name = (new URL(req.url, 'http://x').searchParams.get('n') || 'shot').replace(/[^a-zA-Z0-9_-]/g, '');
      fs.mkdirSync(path.join(ROOT, 'shots'), { recursive: true });
      fs.writeFileSync(path.join(ROOT, 'shots', name + '.jpg'), Buffer.from(body.split(',')[1], 'base64'));
      res.writeHead(200).end('ok');
    }); return;
  }
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => console.log(`serving ${ROOT} on http://127.0.0.1:${PORT}`));
