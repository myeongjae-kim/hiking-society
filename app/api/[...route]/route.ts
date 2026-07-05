import { handle } from 'hono/vercel';
import AuthProfileController from './controllers/AuthProfileController';
import FeedArticleController from './controllers/FeedArticleController';
import NotificationMemberController from './controllers/NotificationMemberController';
import { serverApp } from './serverApp';

[AuthProfileController, FeedArticleController, NotificationMemberController].forEach((controller) =>
  serverApp.route('/', controller),
);

export const GET = handle(serverApp);
export const POST = handle(serverApp);
export const PUT = handle(serverApp);
export const PATCH = handle(serverApp);
export const DELETE = handle(serverApp);
