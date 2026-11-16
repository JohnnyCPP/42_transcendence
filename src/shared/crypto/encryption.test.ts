import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { SecretBox } from "./encryption.js";

describe("SecretBox", () => {
  it("uses fresh IVs and rejects altered or malformed payloads", () => {
    const box = new SecretBox(randomBytes(32).toString("base64"));
    // Repeated encryption must use a fresh IV while remaining decryptable.
    const first = box.encrypt("secret");
    expect(first).not.toBe(box.encrypt("secret"));
    expect(box.decrypt(first)).toBe("secret");
    expect(box.decrypt(box.encrypt(""))).toBe("");
    // Tamper with each encrypted payload component to verify authentication.
    const parts = first.split(".");
    for (let i = 0; i < 3; i++) {
      const altered = [...parts];
      const bytes = Buffer.from(altered[i], "base64url");
      bytes[0] ^= 1;
      altered[i] = bytes.toString("base64url");
      expect(() => box.decrypt(altered.join("."))).toThrow();
    }
    // Reject malformed payloads and keys of the wrong length.
    expect(() => box.decrypt(first + ".extra")).toThrow();
    expect(() => new SecretBox("short")).toThrow();
  });
});
