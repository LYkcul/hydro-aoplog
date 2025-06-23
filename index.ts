import type { Context } from 'hydrooj';
import { aoplog } from './aoplog';

export function apply(ctx: Context) {
    ctx.inject(['server'], ({ server }) => {
        server.server.middleware.unshift(aoplog);
    })
}
