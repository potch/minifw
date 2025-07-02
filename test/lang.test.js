import { describe } from "vitest";
import { tokenize, parse, run } from "../src/lang.js";

describe("lang", () => {
  it("tokenizes", () => {
    const tokens = tokenize(`(a 1 true (b "hi"))`);
    expect(tokens).not.toBe(null);
  });
  it("parses", () => {
    const tokens = tokenize(`(a 1 true (b "hi"))`);
    const root = parse(tokens);
    expect(root.type).toBe("expr");
    expect(root).toStrictEqual({
      type: "expr",
      args: [
        { type: "ident", value: "a" },
        { type: "num", value: 1 },
        { type: "bool", value: true },
        {
          type: "expr",
          args: [
            { type: "ident", value: "b" },
            { type: "str", value: "hi" },
          ],
        },
      ],
    });
  });
  describe("evaluation", () => {
    it("accesses provided scope", async () => {
      const fn = vi.fn(run);

      const add = async ({ args, raw }) =>
        Promise.all(args.map(raw)).then(([a, b]) => ({
          type: "num",
          value: a + b,
        }));

      const mul = async ({ args, raw }) =>
        Promise.all(args.map(raw)).then(([a, b]) => ({
          type: "num",
          value: a * b,
        }));

      const result = await fn("(* (+ 1 2) 4)", [
        {
          "+": add,
          "*": mul,
        },
      ]);

      expect(result).toStrictEqual({ type: "num", value: 12 });
    });
  });
});
