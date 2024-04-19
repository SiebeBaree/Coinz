import { Hono } from 'hono';
import router from './router';
import './utils/database';

const app = new Hono();

app.route('/api', router);

export default {
    fetch: app.fetch,
    port: process.env.PORT || 3000,
};
