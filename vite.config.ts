import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'universal-ai-cors-proxy',
      configureServer(server) {
        // Handle /api/proxy endpoint for any AI provider
        server.middlewares.use('/api/proxy', (req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Target-Base-Url');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          let bodyChunks: Buffer[] = [];
          req.on('data', (chunk) => bodyChunks.push(chunk));
          req.on('end', () => {
            const bodyBuffer = Buffer.concat(bodyChunks);

            // Determine target base URL from custom header or query param, default to OpenCode Zen
            const targetBaseHeader = req.headers['x-target-base-url'] as string;
            let targetBase = targetBaseHeader || 'https://opencode.ai/zen/v1';
            targetBase = targetBase.replace(/\/+$/, '');

            const pathAndQuery = req.url || '';
            let targetUrlString = `${targetBase}${pathAndQuery}`;
            if (!targetUrlString.startsWith('http://') && !targetUrlString.startsWith('https://')) {
              targetUrlString = `https://${targetUrlString}`;
            }

            let parsedTarget: URL;
            try {
              parsedTarget = new URL(targetUrlString);
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: { message: `Invalid target URL: ${targetUrlString}` } }));
              return;
            }

            const headers: Record<string, string> = {
              'Content-Type': req.headers['content-type'] || 'application/json',
              'Authorization': (req.headers['authorization'] as string) || '',
              'Content-Length': String(bodyBuffer.length),
              'User-Agent': 'EchoGraph-Accessibility-App/1.0',
            };

            const isHttps = parsedTarget.protocol === 'https:';
            const client = isHttps ? https : http;

            const proxyReq = client.request(
              parsedTarget,
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
              console.error(`[AI Proxy Error to ${parsedTarget.origin}]:`, err.message);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: { message: `Proxy connection error: ${err.message}` } }));
            });

            if (bodyBuffer.length > 0) {
              proxyReq.write(bodyBuffer);
            }
            proxyReq.end();
          });
        });

        // Legacy alias for /api/opencode
        server.middlewares.use('/api/opencode', (req, res) => {
          req.headers['x-target-base-url'] = 'https://opencode.ai/zen/v1';
          const proxyHandler = server.middlewares.stack.find(m => m.route === '/api/proxy')?.handle;
          if (proxyHandler && typeof proxyHandler === 'function') {
            proxyHandler(req, res, () => {});
          }
        });
      },
    },
  ],
  server: {
    port: 3000,
    open: true,
  },
});
