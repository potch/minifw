import { describe } from "vitest";
import { tokenize, parse, run } from "../src/lang.js";

describe("lang", () => {
  it("tokenizes", () => {
    const tokens = tokenize(`(a 1 true (b "hi"))`);
    expect(tokens).not.toBe(null);
    expect(tokens).toStrictEqual([
      { type: "(" },
      { type: "ident", value: "a" },
      { type: "num", value: 1 },
      { type: "bool", value: true },
      { type: "(" },
      { type: "ident", value: "b" },
      { type: "str", value: "hi" },
      { type: ")" },
      { type: ")" },
    ]);
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

      const eq = async ({ args, raw }) =>
        Promise.all(args.map(raw)).then(([a, b]) => ({
          type: "bool",
          value: a === b,
        }));

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

      const result = await fn("(= 12 (* (+ 1 2) 4))", [
        {
          "=": eq,
          "+": add,
          "*": mul,
        },
      ]);

      expect(result).toStrictEqual({ type: "bool", value: true });
    });
  });

  describe("obj", async () => {
    const obj = ({ args, val }) =>
      Promise.all(
        args.map(async ({ args: [k, v] }) => [k.value, await val(v)])
      ).then((props) => ({
        type: "obj",
        value: props.reduce((o, [k, v]) => ((o[k] = v), o), {}),
      }));

    const add = async ({ args, raw }) =>
      Promise.all(args.map(raw)).then(([a, b]) => ({
        type: "num",
        value: a + b,
      }));

    test("object construction", async () => {
      const fn = vi.fn(run);

      const result = await fn(`(obj (name "bob") (age (add 40 2)))`, [
        { obj, add },
      ]);

      expect(result).toStrictEqual({
        type: "obj",
        value: {
          name: { type: "str", value: "bob" },
          age: { type: "num", value: 42 },
        },
      });
    });
  });
});
