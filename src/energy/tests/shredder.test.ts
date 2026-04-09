import { describe, it, expect } from "vitest";
import { shredder } from "../src/core/the-shredder.js";

describe("Shredder", () => {
  it("should calculate Jule value", () => {
    const result = shredder(
      { content: "test content", tokens: 20 },
      { history: [], reputation: 0.5 }
    );

    expect(result.J).toBeGreaterThanOrEqual(0);
  });
});
