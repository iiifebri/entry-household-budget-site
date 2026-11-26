// HearthLedger — dev server. Serves app/ over plain HTTP so the site can be
// opened in a browser at http://localhost:8080. Node standard library only.
// Usage: node serve.ts [--port 8080]

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(process.cwd());
const appDir = join(repoRoot, 'app');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function portFromArgs() {
  const i = process.argv.indexOf('--port');
  if (i >= 0 && process.argv[i + 1]) {
    const p = Number(process.argv[i + 1]);
    if (Number.isInteger(p) && p > 0 && p < 65536) return p;
  }
  return 8080;
}

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const file = resolve(join(appDir, `.${path}`));
  // Never serve anything outside app/.
  if (!file.startsWith(appDir + '/') && file !== appDir) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
    return;
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
    return;
  }
  const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'content-type': type });
  res.end(readFileSync(file));
});

const port = portFromArgs();
server.listen(port, () => {
  console.log(`HearthLedger serving app/ at http://localhost:${port}`);
});
