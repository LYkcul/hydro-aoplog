import { db } from "hydrooj";
import { LogSchema } from "./interface";
import { UAParser } from "ua-parser-js";

export const collAccess = db.collection('a.oplog.access')
export const collLogin = db.collection('a.oplog.login')
export const collError = db.collection('a.oplog.error')

export async function aoplog(ctx, next) {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;
    try {
        await next();

        if (ctx.status >= 400) {
            success = false;
            error = ctx.message;
        }
    } catch (e) {
        success = false;
        error = e.message;
        throw e;
    } finally {
        const endTime = Date.now();
        const timeCost = endTime - startTime;

        const { path: url, method } = ctx.request;

        const ua = ctx.request.header['user-agent'];
        let os = 'unknown';
        let browser = 'unknown';
        if (ua) {
            const parsedUA = UAParser(ua);
            os = parsedUA?.os?.name || 'unknown';
            browser = parsedUA?.browser?.name || 'unknown';
        }

        try {
            const logData: LogSchema = {
                url,
                method: ctx.request.method,
                params: Object.keys(ctx.request.query) ? ctx.request.query : undefined,
                host: ctx.request.host,
                useragent: ctx.request.header['user-agent'],
                os,
                browser,
                uid: ctx.HydroContext.user._id || 0,
                username: ctx.HydroContext.user.uname || "Guest",
                domainId: ctx.domainId,
                timeCost,
                success,
                statusCode: ctx.status,
                error,
                createdAt: new Date(),
            }
            if (!success) {
                await collError.insertOne(logData);
                return;
            }
            if (url === '/login' && method === 'POST') {
                await collLogin.insertOne(logData);
                return;
            }
            await collAccess.insertOne(logData);
        } catch (e) {
            console.error('Error creating log data:', e);
            return;
        }
    }
}
