import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs');
const prefix = '/ViewImage/';
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };
createServer(async (request, response) => {
    try {
        const url = new URL(request.url, 'http://127.0.0.1:4178');
        if (!url.pathname.startsWith(prefix)) {
            response.writeHead(302, { Location: prefix });
            response.end();
            return;
        }
        const relative = decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html';
        const target = path.resolve(docs, relative);
        if (!target.startsWith(`${docs}${path.sep}`)) {
            response.writeHead(403);
            response.end();
            return;
        }
        const data = await readFile(target);
        response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(target)] || 'application/octet-stream' });
        response.end(data);
    } catch {
        response.writeHead(404);
        response.end('Not found');
    }
}).listen(4178, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:4178/ViewImage/'));
