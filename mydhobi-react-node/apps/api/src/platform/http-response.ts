import { serialize, type SerializeOptions } from "cookie";

/** Standard Fetch response with cookie serialization for feature handlers. */
export class HttpResponse extends Response {
  static json(data: unknown, init?: ResponseInit): HttpResponse {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json; charset=utf-8");
    return new HttpResponse(JSON.stringify(data), { ...init, headers });
  }
  readonly cookies = {
    set: (options: SerializeOptions & { name: string; value: string }) => {
      const { name, value, ...settings } = options;
      this.headers.append("Set-Cookie", serialize(name, value, settings));
    },
    delete: (name: string) => {
      this.headers.append(
        "Set-Cookie",
        serialize(name, "", { path: "/", maxAge: 0 }),
      );
    },
  };
}
