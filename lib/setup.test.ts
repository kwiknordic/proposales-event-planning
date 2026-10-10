// Proves the test runner works (slice 0). Real tests live next to each lib/ module.
import { describe, expect, it } from "vitest";

describe("test setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
