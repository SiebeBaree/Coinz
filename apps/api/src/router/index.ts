import { Hono } from 'hono';
import vote from './vote';

const app = new Hono();

app.route('/vote', vote);

export default app;
