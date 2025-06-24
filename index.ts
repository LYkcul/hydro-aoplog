import type { Context } from 'hydrooj';
import { aoplog } from './aoplog';

export function apply(ctx: Context) {
    ctx.plugin(require('./handler/aoplog'));
    ctx.injectUI('ControlPanel', 'aoplog_access')
    ctx.injectUI('ControlPanel', 'aoplog_login')
    ctx.injectUI('ControlPanel', 'aoplog_error')
    ctx.inject(['server'], ({ server }) => {
        server.server.middleware.unshift(aoplog);
    })
}
