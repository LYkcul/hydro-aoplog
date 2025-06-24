declare module 'hydrooj' {
    interface Collections {
        'a.oplog.access': LogSchema;
        'a.oplog.login': LogSchema;
        'a.oplog.error': LogSchema;
    }
}

export interface LogSchema {
    url: string;
    method: string;
    params?: any;
    host: string;
    useragent: string;
    os: string;
    browser: string;
    uid: string;
    username: string;
    domainId: string;
    timeCost: number;
    success: boolean;
    statusCode: number;
    error?: string;
    createdAt: Date;
}
