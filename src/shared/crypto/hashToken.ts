import { createHash } from "node:crypto";

/*
 * createHash() returns a hasher object. You feed it input with .update(data) 
 * (possibly many times), then finalize with 
 * digest(encoding) to get the result.
 * The hashing computation happens between the first .update() 
 * and the digest().
 */
export function hashToken(token: string): string 
{
  return createHash("sha256").update(token).digest("hex");
}
