import { Context, Handler, param, query, Types } from "hydrooj";
import { collAccess, collError, collLogin } from "../aoplog";

abstract class AopLogBaseHandler extends Handler {
    abstract getColl(): typeof collAccess;
    abstract getPageName(): string;

    @query('page', Types.PositiveInt, true)
    async get(domainId, page = 1) {
        const coll = this.getColl();
        const [ldocs, pcount, count] = await this.paginate(
            coll.find().sort({ _id: -1 }),
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
