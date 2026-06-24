// Minimal dev server — serves static files and proxies Claude API calls.
// Usage: node server.js   then open http://localhost:3000
//
// Why needed: browsers block direct API calls from file:// origins (CORS).
// This server sits in between so the Anthropic request is made server-side.

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT = 3000;

// Load .env file if present
try {
    const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    for (const line of env.split('\n')) {
        const [k, ...v] = line.split('=');
        if (k && v.length) process.env[k.trim()] = v.join('=').trim();
    }
} catch {}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY || API_KEY === 'sk-ant-your-key-here') {
    console.warn('⚠  No API key found. Add ANTHROPIC_API_KEY to .env to enable AI analysis.');
}

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
};

http.createServer((req, res) => {

    // ── CORS pre-flight ────────────────────────────────────────────────────────
    if (req.method === 'OPTIONS') {
        res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' });
        return res.end();
    }

    // ── Proxy endpoint ─────────────────────────────────────────────────────────
    if (req.method === 'POST' && req.url === '/api/analyse') {
        if (!API_KEY || API_KEY === 'sk-ant-your-key-here') {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: { message: 'No API key configured. Add ANTHROPIC_API_KEY to your .env file.' } }));
        }
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            let prompt;
            try { ({ prompt } = JSON.parse(body)); }
            catch { res.writeHead(400); return res.end('Bad JSON'); }

            const payload = JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 600,
                stream: true,
                messages: [{ role: 'user', content: prompt }],
            });

            const apiReq = https.request({
                hostname: 'api.anthropic.com',
                path:     '/v1/messages',
                method:   'POST',
                headers: {
                    'Content-Type':      'application/json',
                    'Content-Length':    Buffer.byteLength(payload),
                    'x-api-key':         API_KEY,
                    'anthropic-version': '2023-06-01',
                },
            }, apiRes => {
                res.writeHead(apiRes.statusCode, {
                    'Content-Type':  'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Access-Control-Allow-Origin': '*',
                });
                apiRes.pipe(res);
            });

            apiReq.on('error', e => { res.writeHead(502); res.end(e.message); });
            apiReq.write(payload);
            apiReq.end();
        });
        return;
    }

    // ── Static files ───────────────────────────────────────────────────────────
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); return res.end('Not found'); }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });

}).listen(PORT, () => console.log(`Open  http://localhost:${PORT}`));
