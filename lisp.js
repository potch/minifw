const IDENT = "ident";
const NUMBER = "num";
const STRING = "str";
const BOOL = "bool";
const OPEN = "(";
const CLOSE = ")";
const EXPR = "expr";
const NIL = { type: "nil" };
const numberRE = /^-?[0-9][0-9]*\.?[0-9]*$/;
const whitespaceRE = /^\s$/;

const makeToken = (type) => {
  if (!token) return null;
  if (type) return { type, value: token };
  if (numberRE.test(token)) {
    return {
      type: NUMBER,
      value: parseFloat(token),
    };
  } else if (token == "true" || token == "false") {
    return { type: BOOL, value: token == "true" };
  }
  return { type: IDENT, value: token };
};

const maybeToken = (type) => {
  let t = makeToken(type);
  if (t) {
    token = "";
  }
  return t;
};

let token = "";
let inQuotes = false;

const tokenize = (s) =>
  [...s]
    .map((c) => {
      if (inQuotes) {
        if (c == '"') {
          inQuotes = false;
          return maybeToken(STRING);
        }
      } else {
        if (c == '"') {
          inQuotes = true;
          return maybeToken();
        }
        if (c == OPEN) {
          return [maybeToken(), { type: OPEN }];
        }
        if (c == CLOSE) {
          return [maybeToken(), { type: CLOSE }];
        }
        if (whitespaceRE.test(c)) {
          return maybeToken();
        }
      }
      token += c;
    })
    .flat(Infinity)
    .filter((t) => t);

const parse = (tokens) => {
  let pos = 0;
  let next = tokens[pos];
  const consume = (type) => {
    const token = next;
    next = tokens[++pos];
    return token;
  };
  const parseExpr = () => {
    consume(OPEN);
    const args = [];
    while (next.type !== CLOSE) {
      args.push(next.type === OPEN ? parseExpr() : consume(next.type));
    }
    consume(CLOSE);
    return {
      type: EXPR,
      args,
    };
  };
  return parseExpr();
};

const evaluate = async (expr, stack = []) => {
  if (!expr) return NIL;
  let context;

  const get = (ident, offset) =>
    stack.slice(offset).find((frame) => frame[ident])?.[ident];

  const val = (x) => evaluate(x, [{}, ...stack]);

  if (expr.type === EXPR) {
    const [method, ...args] = expr.args;
    const value = await val(method);
    if (value?.call) {
      context = {
        stack,
        args,
        get,
        val,
      };
      return (await value(context)) ?? NIL;
    }
    return value;
  }
  if (expr.type === IDENT) {
    return get(expr.value);
  }
  return expr;
};

const run = (prog, stack) => evaluate(parse(tokenize(prog)), stack);

export { run, evaluate };
