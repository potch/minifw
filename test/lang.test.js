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
        Promise.all(args.map(raw)).then(([a, b]) => a + b);
      const result = await fn("(log (add 1 2))", [
        {
          add,
          log: ({ args, val }) => {
            const x = val(args[0]);
            x.then((v) => console.log(v));
            return x;
          },
        },
      ]);
      expect(result).toBe(3);
    });
  });
});
