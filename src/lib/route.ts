import "server-only";
import { StoreError } from "./store";

// Wraps an API route handler so an unexpected failure is logged on the server
// and comes back to the browser as a readable { error } instead of an empty 500.
export function route<Args extends unknown[]>(name: string, handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (e) {
      console.error(`[bonbon] ${name} failed:`, e);
      const readOnly = e instanceof StoreError && e.readOnly;
      const message = e instanceof Error && e.message ? e.message : "Something went wrong on the server.";
      return Response.json({ error: message }, { status: readOnly ? 503 : 500 });
    }
  };
}
