import { OpenAPIHono } from '@hono/zod-openapi';
import { authMiddleware } from './config/auth';
import { globalErrorHandler } from './config/globalErrorHandler';

export const serverApp = new OpenAPIHono().basePath('/api');

serverApp.use('/*', authMiddleware).onError(globalErrorHandler);

serverApp.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

serverApp.openAPIRegistry.registerComponent('securitySchemes', 'cookieAuth', {
  in: 'cookie',
  name: 'hiking_access_token',
  type: 'apiKey',
});

if (process.env.NODE_ENV !== 'production') {
  serverApp.doc('/swagger', (c) => ({
    info: {
      title: 'Hiking Society API',
      version: '1.0.0',
    },
    openapi: '3.0.0',
    servers: [{ description: 'Current environment', url: new URL(c.req.url).origin }],
  }));

  serverApp.get('/docs', (c) =>
    c.html(`<!doctype html>
<html>
<head>
  <title>Hiking Society API Docs</title>
  <meta charset="utf-8" />
  <meta content="width=device-width, initial-scale=1" name="viewport" />
</head>
<body>
  <div id="app"></div>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  <script>
    Scalar.createApiReference('#app', { url: '/api/swagger', defaultOpenAllTags: true })
  </script>
</body>
</html>`),
  );
}
