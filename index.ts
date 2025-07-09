import { HydroError, type Context } from 'hydrooj';
import { aoplog, collAccess, collError, collLogin } from './aoplog';
import { UAParser } from 'ua-parser-js';
import { LogSchema } from './interface';

export function apply(ctx: Context) {
    ctx.plugin(require('./handler/aoplog'));
    ctx.injectUI('ControlPanel', 'aoplog_access')
    ctx.injectUI('ControlPanel', 'aoplog_login')
    ctx.injectUI('ControlPanel', 'aoplog_error')
    ctx.inject(['server'], ({ server }) => {
        server.server.middleware.unshift(aoplog);
    })
    ctx.on('handler/finish', async (h) => {
        const startTime = h.args.__start;
        const endTime = Date.now();
        const statusCode = h.response.status;
        const timeCost = endTime - startTime;
        const { method, path, query, host } = h.request;
        const ua = h.request.headers['user-agent'] || 'unknown';
        let os = 'unknown';
        let browser = 'unknown';
        if (ua) {
            const parsedUA = UAParser(ua);
            os = `${parsedUA.os.name || ''} ${parsedUA.os.version || ''}`.trim();
            if (os === '') os = 'unknown';
            browser = `${parsedUA.browser.name || ''} ${parsedUA.browser.version || ''}`.trim();
            if (browser === '') browser = 'unknown';
        }
        const logData: LogSchema = {
            path,
            method,
            params: Object.keys(query) ? query : undefined,
            host: host,
            useragent: ua,
            os,
            browser,
            updateGeoip: ctx.geoip?.lookup?.(
                host,
                'zh-CN',
            ).display,
            uid: (h.user._id || 0).toString(),
            username: h.user.uname || "Guest",
            domainId: h.domain._id,
            timeCost,
            success: true,
            statusCode,
            createdAt: new Date(),
        }
        try {
            if (path === '/login' && method.toLocaleLowerCase() === 'post') {
                logData.uid = (h.session.uid || 0).toString();
                logData.username = h.request.body.uname || "Guest";
                const inserted = await collLogin.insertOne(logData);
                h.args.__inserted_login_log_id = inserted.insertedId;
                return;
            }
            const inserted = await collAccess.insertOne(logData);
            h.args.__inserted_access_log_id = inserted.insertedId;
        } catch (e) {
            console.error('Failed to insert access log:', e);
        }
    })

    ctx.on('handler/error', async (h, e) => {
        const startTime = h.args.__start;
        const endTime = Date.now();
        let statusCode = h.response.status;
        const timeCost = endTime - startTime;
        const { method, path, query, host } = h.request;
        const ua = h.request.headers['user-agent'] || 'unknown';
        let os = 'unknown';
        let browser = 'unknown';
        let error = e.message;
        const errorName = e.name;
        if (e instanceof HydroError) {
            statusCode = e.code;
            error = h.translate(e.message).format(e.params);
        }
        if (ua) {
            const parsedUA = UAParser(ua);
            os = `${parsedUA.os.name || ''} ${parsedUA.os.version || ''}`.trim();
            if (os === '') os = 'unknown';
            browser = `${parsedUA.browser.name || ''} ${parsedUA.browser.version || ''}`.trim();
            if (browser === '') browser = 'unknown';
        }
        const logData: LogSchema = {
            path,
            method,
            params: Object.keys(query) ? query : undefined,
            host: host,
            useragent: ua,
            os,
            browser,
            updateGeoip: ctx.geoip?.lookup?.(
                host,
                'zh-CN',
            ).display,
            uid: (h.user._id || 0).toString(),
            username: h.user.uname || "Guest",
            domainId: h.domain._id,
            timeCost,
            success: true,
            statusCode,
            errorName,
            error,
            createdAt: new Date(),
        }
        try {
            const inserted = await collError.insertOne(logData);
            h.args.__inserted_error_log_id = inserted.insertedId;
        } catch (e) {
            console.error('Failed to insert error log:', e);
        }
    })
}
