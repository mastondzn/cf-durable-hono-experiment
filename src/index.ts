import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { hc } from 'hono/client';
import { z } from 'zod';

import type { AppType } from './durable';
import type { Environment } from './env';

const app = new Hono<{ Bindings: Environment }>()
    .get(
        '/increment',
        zValidator('query', z.object({ amount: z.coerce.number().optional() })),
        async (ctx) => {
            const amount = ctx.req.valid('query').amount;
            const stub = ctx.env.COUNTER.get(ctx.env.COUNTER.idFromName('counter'));
            const client = hc<AppType>('https://counter.example.com', {
                fetch: stub.fetch.bind(stub),
            });

            const response = await client.increment.$post({
                query: { amount: amount?.toString(10) },
            });
            const data = await response.json();
            return ctx.json(data);
        },
    )
    .get('/count', async (ctx) => {
        const stub = ctx.env.COUNTER.get(ctx.env.COUNTER.idFromName('counter'));
        const client = hc<AppType>('https://counter.example.com', {
            fetch: stub.fetch.bind(stub),
        });

        const response = await client.count.$get();
        const data = await response.json();
        return ctx.json(data);
    })
    .get('/', (ctx) => {
        return ctx.text('Hello Hono!');
    });

export default app;
export { Counter } from './durable';
