import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'opencode-cors-proxy',
      configureServer(server) {
        server.middlewares.use('/api/opencode', (req, res) => {
          // Handle CORS preflight OPTIONS request
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          let bodyChunks: Buffer[] = [];
          req.on('data', (chunk) => bodyChunks.push(chunk));
          req.on('end', () => {
            const bodyBuffer = Buffer.concat(bodyChunks);
            const targetUrl = new URL(`https://opencode.ai/zen/v1${req.url || ''}`);

            const headers: Record<string, string> = {
              'Content-Type': req.headers['content-type'] || 'application/json',
              'Authorization': (req.headers['authorization'] as string) || '',
              'Content-Length': String(bodyBuffer.length),
              'User-Agent': 'EchoGraph-App/1.0',
            };

            const proxyReq = https.request(
              targetUrl,
              {
                method: req.method,
                headers: headers,
              },
              (proxyRes) => {
                res.statusCode = proxyRes.statusCode || 200;
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/json');
                proxyRes.pipe(res);
              }
            );

            proxyReq.on('error', (err) => {
              console.error('[OpenCode Proxy Error]:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: { message: `Proxy connection error: ${err.message}` } }));
            });

            if (bodyBuffer.length > 0) {
              proxyReq.write(bodyBuffer);
            }
            proxyReq.end();
          });
        });
      },
    },
  ],
  server: {
    port: 3000,
    open: true,
  },
});
