import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono<{ Bindings: { state: DurableObjectState } }>() //
    .post(
        '/increment',
        zValidator('query', z.object({ amount: z.coerce.number().default(1) })),
        async (ctx) => {
            const state = ctx.env.state;
            const current = (await state.storage.get<number>('count')) ?? 0;
            const amount = ctx.req.valid('query').amount;
            await state.storage.put('count', current + amount);
            return ctx.json({ count: current + amount });
        },
    )
    .get('/count', async (ctx) => {
        const state = ctx.env.state;
        const count = (await state.storage.get<number>('count')) ?? 0;
        return ctx.json({ count });
    });

export type AppType = typeof app;

export class Counter implements DurableObject {
    state: DurableObjectState;

    constructor(state: DurableObjectState) {
        this.state = state;
    }

    fetch(request: Request) {
        return app.fetch(request, { state: this.state });
    }
}
