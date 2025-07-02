// work-in-progress tiny lisp thing. don't use even more than the rest of this stuff

let IDENT = "ident";
let NUMBER = "num";
let STRING = "str";
let BOOL = "bool";
let OPEN = "(";
let CLOSE = ")";
let EXPR = "expr";
let NIL = { type: "nil" };
let numberRE = /^-?[0-9][0-9]*\.?[0-9]*$/;
let whitespaceRE = /^\s$/;
let _null = null;

let token = "";
let inQuotes = false;

let makeToken = (type) => {
  if (!token) return _null;
  if (type) return { type, value: token };
  if (numberRE.test(token)) {
    return {
      type: NUMBER,
      value: parseFloat(token),
    };
  }
  if (/^(true|false)$/.test(token)) {
    return { type: BOOL, value: token == "true" };
  }
  return { type: IDENT, value: token };
};

let maybeToken = (type) => {
  let t = makeToken(type);
  if (t) {
    token = "";
  }
  return t;
};

let tokenize = (s) =>
  [...s]
    .map((c) => {
      if (inQuotes) {
        if (c == '"') {
          inQuotes = false;
          return maybeToken(STRING);
        }
        token += c;
        return _null;
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
        token += c;
        return _null;
      }
    })
    .flat(Infinity)
    .filter((t) => t);

let parse = (tokens) => {
  let pos = 0;
  let next = tokens[pos];
  let consume = () => {
    next = tokens[pos + 1];
    return tokens[pos++];
  };
  let parseExpr = () => {
    let args = [];
    consume(OPEN);
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

let evaluate = async (expr, stack = []) => {
  if (!expr) return NIL;

  let get = (ident, offset) =>
    stack.slice(offset).find((frame) => frame[ident])?.[ident];

  let val = (x) => evaluate(x, [{}, ...stack]);
  let raw = (x) => val(x).then((x) => x.value);

  let { type, value, args } = expr;

  if (type === EXPR) {
    let x = await val(args[0]);
    if (x?.call) {
      return (
        (await x({
          stack,
          args: args.slice(1),
          get,
          val,
          raw,
        })) ?? NIL
      );
    }
    return x;
  }
  if (type === IDENT) {
    return get(value);
  }
  return expr;
};

let run = (prog, stack) => evaluate(parse(tokenize(prog)), stack);

export { run, parse, tokenize, evaluate };
