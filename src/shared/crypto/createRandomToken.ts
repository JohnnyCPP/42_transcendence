import { randomBytes } from "node:crypto";

export function createRandomToken(bytes = 32): string 
{
  return randomBytes(bytes).toString("base64url");
}

