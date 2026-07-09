import { serverApp } from '#/api/serverApp';
import { createFileRoute } from '@tanstack/react-router';

const handler = ({ request }: { request: Request }) => serverApp.fetch(request);

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      ANY: handler,
    },
  },
});
