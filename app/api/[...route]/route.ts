import { handle } from 'hono/vercel';
import { serverApp } from './serverApp';

export const GET = handle(serverApp);
export const POST = handle(serverApp);
export const PUT = handle(serverApp);
export const PATCH = handle(serverApp);
export const DELETE = handle(serverApp);
