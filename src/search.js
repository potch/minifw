const GRAMSIZE = 3;

const pad = (s) => ["\u0002", ...s, "\u0003"];
const grams = (a, size = GRAMSIZE) =>
  a.slice(size - 1).map((_, i) => a.slice(i, i + size).join(""));

const ingest = ({ entries, index = {}, filter, transform = (o) => o }) => {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const g = grams(pad("" + entry), GRAMSIZE);
    for (let j = 0; j < g.length; j++) {
      const gram = transform(g[j]);
      if (filter && !filter.test(gram)) continue;
      if (!index[gram]) {
        index[gram] = [];
      }
      index[gram].push(i);
    }
  }
  return index;
};

const search = (index, query, results = {}) => {
  const g = grams(pad(query), GRAMSIZE);
  for (let i = 0; i < g.length; i++) {
    const gram = g[i];
    const matches = index[gram];
    if (matches) {
      for (let j = 0; j < matches.length; j++) {
        const key = matches[j];
        if (!results[key]) {
          results[key] = 0;
        }
        results[key]++;
      }
    }
  }
  return Object.entries(results).sort((a, b) => b[1] - a[1]);
};

export { ingest, search };

import { readFileSync } from "fs";

let data = readFileSync("/Users/potch/data/wiki/h2g2.json").toString("utf8");
data = data.split(/\n+/);
data = data.reduce((data, r) => {
  r = r.trim();
  if (!r) return data;
  try {
    data.push(JSON.parse(r));
  } catch (e) {
    console.log("failed on [[" + r + "]]");
  }
  return data;
}, []);
console.log(data.length);

const names = data.map((r) => r.name);
// .replace(/\n+/g, " ")
// .match(/(.+?[\.\?!]["”]?)/g)
// .map((s) => s.trim());

console.log("ingesting amount: ", names.length);

const filterRE = new RegExp(`[\\w-]{${GRAMSIZE}}`);

console.time("ingest");
let index = ingest({
  entries: names,
  transform: (g) => g.toLowerCase(),
  // filter: filterRE,
});
console.timeEnd("ingest");

console.log("hwg");

console.log(
  "\nindex size:\t",
  JSON.stringify(index).length,
  "\nsource size:\t",
  JSON.stringify(data).length
);

// console.log(
//   Object.entries(index)
//     .sort((a, b) => b[1].length - a[1].length)
//     .map((k) => [k[0], k[1].length])
//     .slice(0, 5)
// );

const query = process.argv.at(-1);
console.time("search");
console.log(`\nsearching for: "${query}"\n`);
console.log(
  search(index, query)
    .map((k) => {
      let s = data[k[0]];
      return k[1] + ": " + s.name + "\n" + s.url; // + "\n" + s.abstract;
    })
    .slice(0, 30)
    .join("\n")
);
console.timeEnd("search");
