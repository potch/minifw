import { run, evaluate } from "../src/lang.js";

const schema = {
  query: async (context) => {
    const { args, val } = context;
    const result = [];
    for (let part of args) {
      const ret = (await val(part.args[0])) ?? {};
      const { type, value } = ret;
      if (type) {
        const obj = {};
        for (let field of part.args.slice(1)) {
          obj[field.value] = (await evaluate(
            {
              type: "expr",
              args: [field],
            },
            [schema[type] ?? {}, value, schema]
          )) ?? { type: "nil" };
        }
        result.push(obj);
      } else {
        result.push(ret ?? null);
      }
    }
    return result;
  },
};

const users = [
  {
    id: 1,
    name: "bob",
    url: "https://example.com",
  },
];

const resolvers = {
  search: ({ args }) => {
    const user = users.find((u) => u.name === args[0].value);
    return user && { type: "User", value: user };
  },
  stats: () => {
    return {
      type: "Stats",
      value: {
        hits: 5,
        boops: 2,
      },
    };
  },
  User: {
    name: (context) => {
      const name = context.get("name", 1);
      return name.toUpperCase();
    },
    slug: ({ get }) => {
      return get("name", 1) + ":" + get("id");
    },
  },
  Stats: {
    hits: ({ get }) => get("hits", 1) * 1000,
  },
};

const query = `(query
  ((search "bob")
    name
    slug
  )
  ((stats)
    hits
  )
)`;

run(query, [resolvers, schema]).then((result) =>
  console.log(JSON.stringify(result, null, 2))
);
