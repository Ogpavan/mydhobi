import { AsyncLocalStorage } from "node:async_hooks";
export const requestContext = new AsyncLocalStorage<{ request: Request }>();
export function currentRequest() {
  const context = requestContext.getStore();
  if (!context) throw new Error("Request context is missing");
  return context.request;
}
