import { randomUUID } from "node:crypto";

export type LogBase = {
  request_id: string;
  user_id?: string | null;
  op: string;
};

export function withRequestLogging<TResult>(
  op: string,
  userId: string | null,
  fn: () => Promise<TResult>
) {
  const request_id = randomUUID();
  const start = Date.now();
  return fn().finally(() => {
    const latency_ms = Date.now() - start;
    console.log(
      JSON.stringify({ request_id, user_id: userId, op, latency_ms })
    );
  });
}
