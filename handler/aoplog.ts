import { Context, Handler, PRIV, query, Types } from "hydrooj";
import { collAccess, collError, collLogin } from "../aoplog";

abstract class AopLogBaseHandler extends Handler {
    abstract getColl(): typeof collAccess;
    abstract getPageName(): string;

    async _prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }

    @query('domId', Types.String, true)
    @query('path', Types.String, true)
    @query('username', Types.String, true)
    @query('method', Types.String, true)
    @query('hostname', Types.String, true)
    @query('success', Types.Boolean, true)
    @query('page', Types.PositiveInt, true)
    async get(domainId, domId?: string, path?: string, username?: string, method?: string, hostname?: string, success?: boolean, page = 1) {
        const coll = this.getColl();
        const query = {}
        if (domId) {
            query['domainId'] = { $regex: domId, $options: 'i' };
        }
        if (path) {
            query['path'] = { $regex: path, $options: 'i' };
        }
        if (username) {
            query['username'] = { $regex: username, $options: 'i' };
        }
        if (method) {
            query['method'] = { $regex: method, $options: 'i' };
        }
        if (hostname) {
            query['host'] = { $regex: hostname, $options: 'i' };
        }
        if (success !== undefined) {
            query['success'] = success;
        }

        // build query string
        const qsArray: string[] = []
        if (domId) qsArray.push(`domId=${encodeURIComponent(domId)}`);
        if (path) qsArray.push(`path=${encodeURIComponent(path)}`);
        if (username) qsArray.push(`username=${encodeURIComponent(username)}`);
        if (method) qsArray.push(`method=${encodeURIComponent(method)}`);
        if (hostname) qsArray.push(`hostname=${encodeURIComponent(hostname)}`);
        if (success !== undefined) qsArray.push(`success=${success}`);
        const qs = qsArray.join('&')

        const [ldocs, pcount, count] = await this.paginate(
            coll.find(query).sort({ _id: -1 }),
            page,
            'aoplog'
        );
        this.response.template = 'aoplog_log.html'
        this.response.body = {
            page_name: this.getPageName(),
            page,
            pcount,
            count,
            ldocs,
            qs,
            domId,
            path,
            username,
            method,
            success,
            hostname,
        }
    }
}

class AopLogAccessHandler extends AopLogBaseHandler {
    getColl() {
        return collAccess;
    }

    getPageName() {
        return 'aoplog_access';
    }
}

class AopLogLoginHandler extends AopLogBaseHandler {
    getColl() {
        return collLogin;
    }

    getPageName() {
        return 'aoplog_login';
    }
}

class AopLogErrorHandler extends AopLogBaseHandler {
    getColl() {
        return collError;
    }

    getPageName() {
        return 'aoplog_error';
    }
}

export function apply(ctx: Context) {
    ctx.Route('aoplog_access', '/manage/aoplog/access', AopLogAccessHandler)
    ctx.Route('aoplog_login', '/manage/aoplog/login', AopLogLoginHandler)
    ctx.Route('aoplog_error', '/manage/aoplog/error', AopLogErrorHandler)
}
