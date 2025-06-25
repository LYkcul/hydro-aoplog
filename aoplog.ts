import { db } from "hydrooj";

export const collAccess = db.collection('a.oplog.access')
export const collLogin = db.collection('a.oplog.login')
export const collError = db.collection('a.oplog.error')

export async function aoplog(ctx, next) {
    try {
        await next()
    } finally {
        try {
            const { __inserted_access_log_id, __inserted_login_log_id } = ctx.handler.args;
            if (__inserted_access_log_id || __inserted_login_log_id) {
                const statusCode = ctx.status;
                if (__inserted_access_log_id) {
                    await collAccess.updateOne({ _id: __inserted_access_log_id }, { $set: { statusCode } });
                } else if (__inserted_login_log_id) {
                    await collLogin.updateOne({ _id: __inserted_login_log_id }, { $set: { statusCode } });
                }
            }
        } catch (e) {
            console.error('Failed to update access log status:', e);
        }
    }
}
