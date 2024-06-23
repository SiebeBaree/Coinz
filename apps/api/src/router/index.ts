import { Hono } from 'hono';
import vote from './vote';
import member from './member';

const app = new Hono();

app.route('/vote', vote);
app.route('/member', member);

export default app;
