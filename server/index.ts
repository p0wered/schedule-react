import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createScheduleService } from './service.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
const port = Number(process.env.PORT ?? 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const getSchedule = createScheduleService(resolve(root, '.cache/rsreu-648m.json'));
const dev = process.argv.includes('--dev');
const vite = dev ? await (await import('vite')).createServer({
  root, server: { middlewareMode: true }, appType: 'spa',
}) : null;
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  if (pathname === '/api/schedule') {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    if (request.method !== 'GET') {
      response.writeHead(405, { Allow: 'GET' });
      response.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }
    try {
      response.end(JSON.stringify(await getSchedule()));
    } catch {
      response.statusCode = 503;
      response.end(JSON.stringify({ error: 'Расписание РГРТУ временно недоступно' }));
    }
    return;
  }
  if (vite) { vite.middlewares(request, response); return; }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
  }
  try {
    const path = resolve(dist, `.${decodeURIComponent(pathname)}`);
    if (!path.startsWith(`${dist}${sep}`) && path !== dist) {
      response.statusCode = 400; response.end(); return;
    }
    const file = extname(path) ? path : resolve(dist, 'index.html');
    const content = await readFile(file);
    response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    response.setHeader('Cache-Control', file.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache');
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.statusCode = 404; response.end('Not found');
  }
});
const host = process.env.HOST ?? (dev ? '127.0.0.1' : '0.0.0.0');
server.listen(port, host, () => {
  console.log(`Schedule app: http://${host}:${port}`);
});
