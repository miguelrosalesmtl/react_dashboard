export type HeaderMiddleware = (headers: Headers) => Headers;

enum METHODS {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    PATCH = "PATCH",
}

export interface Headers {
    [name: string]: string;
}

export interface HttpClientOptions {
    headers?: Headers;
    queryParams?: { [key: string]: string };
}

export const createHttpClient = (hostname: string) => {
    let headers: Headers = { "Content-Type": "application/json" };
    const middlewares: HeaderMiddleware[] = [];

    const runHeadersMiddleware = (): Headers => {
        return middlewares.reduce((acc, fn) => ({ ...acc, ...fn(acc) }), headers);
    };

    const buildQueryParams = (queryParams: { [key: string]: string } = {}): string => {
        const queryString = new URLSearchParams(queryParams).toString();
        return queryString ? `?${queryString}` : "";
    };

    const req = (method: METHODS, url: string, options: HttpClientOptions = {}, data?: any) => {
        const finalHeaders = { ...runHeadersMiddleware(), ...options.headers };
        const body = data && typeof data !== "string" ? JSON.stringify(data) : data;
        const queryString = buildQueryParams(options.queryParams);
        return fetch(`${hostname}${url}${queryString}`, { method, headers: finalHeaders, body });
    };

    const setHeaders = (newHeaders: Headers) => {
        headers = newHeaders;
    };

    const addMiddleware = (fn: HeaderMiddleware) => {
        middlewares.push(fn);
    };

    return {
        setHeaders,
        addMiddleware,
        post: (url: string, data: never, options: HttpClientOptions = {}) => req(METHODS.POST, url, options, data),
        put: (url: string, data: never, options: HttpClientOptions = {}) => req(METHODS.PUT, url, options, data),
        get: (url: string, options: HttpClientOptions = {}) => req(METHODS.GET, url, options),
        delete: (url: string, options: HttpClientOptions = {}) => req(METHODS.DELETE, url, options),
        patch: (url: string, data: never, options: HttpClientOptions = {}) => req(METHODS.PATCH, url, options, data),
    };
};