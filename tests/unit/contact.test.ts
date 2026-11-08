import { describe, expect, it } from "vitest";
import { LIMITS, formspreeEndpoint, validateContact } from "../../src/lib/contact";

const ok = {
  name: "Asha Rao",
  email: "asha@example.com",
  message: "Hello, I'd like to talk about an AI Engineer role.",
};

describe("validateContact", () => {
  it("accepts a complete, valid message", () => {
    expect(validateContact(ok)).toEqual({});
  });

  it("requires every field and trims whitespace", () => {
    const e = validateContact({ name: "   ", email: " ", message: "\n\t" });
    expect(Object.keys(e).sort()).toEqual(["email", "message", "name"]);
    expect(e.name).toMatch(/enter your name/);
  });

  it.each(["plainaddress", "a@b", "a@b.", "a b@c.com", "@example.com", "a@.com", "a@@b.com"])(
    "rejects email %s",
    (email) => {
      expect(validateContact({ ...ok, email }).email).toMatch(/valid email/);
    },
  );

  it.each(["a@b.co", "first.last+tag@sub.example.org", "x@example.co.in"])("accepts email %s", (email) => {
    expect(validateContact({ ...ok, email }).email).toBeUndefined();
  });

  it("enforces name and message length limits at the boundaries", () => {
    expect(validateContact({ ...ok, name: "A" }).name).toBeDefined();
    expect(validateContact({ ...ok, name: "Al" }).name).toBeUndefined();
    expect(validateContact({ ...ok, name: "x".repeat(LIMITS.name.max + 1) }).name).toBeDefined();
    expect(validateContact({ ...ok, message: "x".repeat(LIMITS.message.min - 1) }).message).toMatch(/at least 20/);
    expect(validateContact({ ...ok, message: "x".repeat(LIMITS.message.min) }).message).toBeUndefined();
    expect(validateContact({ ...ok, message: "x".repeat(LIMITS.message.max + 1) }).message).toBeDefined();
  });
});

describe("formspreeEndpoint", () => {
  it("builds the endpoint from a valid form ID", () => {
    expect(formspreeEndpoint("xyzabcd")).toBe("https://formspree.io/f/xyzabcd");
  });
  it.each([undefined, "", "abc", "has space1", "../evil", "https://x"])("returns null for %s", (id) => {
    expect(formspreeEndpoint(id)).toBeNull();
  });
});
