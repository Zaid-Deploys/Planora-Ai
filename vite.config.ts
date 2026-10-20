import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables for the development server
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }
  if (env.GEMINI_MODEL) {
    process.env.GEMINI_MODEL = env.GEMINI_MODEL;
  }

  return {
    plugins: [
      react(),
      {
        name: 'planora-local-api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/plan') {
              try {
                // Dynamically import handler to keep bundle clean
                const { default: handler } = await server.ssrLoadModule('./api/plan.ts');

                let body = '';
                req.on('data', (chunk: Buffer) => {
                  body += chunk.toString();
                });

                req.on('end', async () => {
                  const serverlessReq = {
                    method: req.method,
                    headers: req.headers,
                    body,
                    connection: req.connection,
                    socket: req.socket,
                  };

                  let statusCode = 200;
                  const serverlessRes = {
                    status(code: number) {
                      statusCode = code;
                      res.statusCode = code;
                      return this;
                    },
                    setHeader(name: string, value: string) {
                      res.setHeader(name, value);
                      return this;
                    },
                    json(data: unknown) {
                      res.statusCode = statusCode;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                    },
                    end(data?: string) {
                      res.end(data);
                    },
                  };

                  await handler(serverlessReq, serverlessRes);
                });
              } catch (err) {
                console.error('[Vite Local API Middleware Error]:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Internal API middleware error' }));
              }
            } else {
              next();
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
    },
  };
});
