import type { RequestHandler } from "express";
import { requestContext } from "./request-context";

/** Keeps feature handlers transport-independent; Express owns the HTTP server. */
export function adapt<P extends Record<string, string>>(
  handler: (
    request: Request,
    context: { params: Promise<P> },
  ) => Promise<Response>,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) {
        if (Array.isArray(value))
          for (const item of value) headers.append(name, item);
        else if (value !== undefined) headers.set(name, value);
      }
      const origin = process.env.APP_ORIGIN ?? "http://localhost:3000";
      const request = new Request(new URL(req.originalUrl, origin), {
        method: req.method,
        headers,
        ...(req.method !== "GET" &&
        req.method !== "HEAD" &&
        Buffer.isBuffer(req.body)
          ? { body: new Uint8Array(req.body) }
          : {}),
      });
      const params = Object.fromEntries(
        Object.entries(req.params).map(([key, value]) => [key, String(value)]),
      ) as P;
      const response = await requestContext.run({ request }, () =>
        handler(request, { params: Promise.resolve(params) }),
      );
      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (key !== "set-cookie") res.setHeader(key, value);
      });
      const cookies = response.headers.getSetCookie();
      if (cookies.length) res.setHeader("Set-Cookie", cookies);
      res.send(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      next(error);
    }
  };
}
