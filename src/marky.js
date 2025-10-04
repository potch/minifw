let sl = (s, n, e) => s.slice(n, e);
let sw = (s, t) => t === sl(s, 0, len(t));
let len = (a) => a?.length ?? 0;
let tip = (a) => a.at(-1);
let count = (s) => len(s.match(/^(.)\1*/)?.[0]);
let blockquote = "blockquote";

let zipIn = (arr, [re, fn]) => {
  let item, matches, match, start, end, i;
  if (arr.map) {
    for (i = 0; i < len(arr); i++) {
      item = arr[i];
      if (item?.t) {
        zipIn(item, [re, fn]);
      } else if (item) {
        matches = item.matchAll(re) ?? [];
        start = 0;
        for (match of matches) {
          end = match.index + len(match[0]);
          arr.splice(
            i,
            1,
            sl(item, start, match.index),
            fn(match),
            sl(item, end)
          );
          i += 2;
          start = end;
        }
      }
    }
  }
  return arr;
};

let html = (t, c = [], p = {}) => ({ t, c: c || [], p });

let fence = (delimiter, tag, stop = delimiter) => [
  RegExp(delimiter + "([^" + stop + "]+)" + delimiter, "g"),
  (m) => html(tag, [m[1]]),
];

let inlineREs = [
  [
    /(\!?)\[([^\]]+)\]\(([^\)]+)\)/g,
    ([_, i, t, u]) =>
      i ? html("img", null, { src: u, alt: t }) : html("a", [t], { href: u }),
  ],
  fence("`", "code"),
  fence("\\*", "i"),
  fence("_", "u"),
  fence("\\*\\*", "b", "\\*"),
];

export let marky = (source) => {
  let indent, l, size;

  let parseLine = (line) => {
    indent = count(line);
    l = line.trim();
    size = count(l);
    if (!l) {
      return ["br"];
    } else if (sw(l, "* ") || sw(l, "- ")) {
      return ["li", sl(l, 2), ((indent / 2) | 0) + 1];
    } else if (sw(l, "#")) {
      return ["h" + size, sl(l, size + 1)];
    } else if (l == "---" || l == "***") {
      return ["hr"];
    } else if (sl(l, 0, 3) == "```") {
      return ["pre", "", sl(l, 3)];
    } else if (indent >= 2) {
      return [blockquote, l];
    } else if (sw(l, ">")) {
      return [blockquote, sl(l, 1)];
    } else {
      return ["p", line];
    }
  };

  let blocks = [];
  let stack = [blocks];
  let push = (o, t = tip(stack)) => (t.c ?? t)?.push?.(o);
  let descend = (o) => {
    push(o);
    stack.push(o);
  };
  let ascend = () => {
    stack.pop();
  };
  let reset = () => {
    stack = [blocks];
  };

  let lastTag, lastContent, state;

  source.split("\n").map((line) => {
    let [tag, content, meta] = parseLine(line);

    if (content) {
      content = [content];
      for (let inlineRE of inlineREs) {
        content = zipIn(content, inlineRE);
      }
    } else {
      if (tag === blockquote) {
        content = [html("br")];
      }
    }

    if (tag == "li") {
      if (tip(stack).t !== "ul" || len(stack) - 1 < meta) {
        descend(html("ul"));
      }
      while (len(stack) - 1 > meta) {
        ascend();
      }
    } else {
      reset();
    }

    if (lastTag == "p") {
      if (tag == "p") {
        return lastContent.push(...content);
      }
    }

    if (tag == blockquote) {
      if (lastTag == blockquote) {
        return lastContent.push(...content);
      } else {
        content = [html("p", content)];
      }
    }

    if (tag == "pre") {
      if (lastTag == "pre") {
        return (state = null);
      } else {
        state = html("code", "", { lang: meta });
        content = [state];
      }
    }

    if (tag == "br" && lastTag != "br") {
      return;
    }

    if (lastTag == "pre" && state) {
      return state.c.push(line + "\n");
    }

    push(html(tag, content));
    [lastTag, lastContent] = [tag, content];
  });
  return blocks;
};

// const voids =
//   /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/;

// const toHTML = (el) => {
//   if (typeof el === "string") return el;
//   let { t, p, c } = el;
//   return (
//     "<" +
//     t +
//     Object.entries(p)
//       .map(([a, v]) => " " + a + '="' + v + '"')
//       .join("") +
//     ">" +
//     c.map(toHTML).join("\n") +
//     (voids.test(t) ? "" : `</${t}>`)
//   );
// };

// console.log(
//   marky(
//     `# Hello
// ## what is up

// This is just _some_ text [with a link](https://potch.me/) and also ![another link](https://example.com/).
// Here's the next line, should be joined.

// Here's a new para

//   a *cool* blockquote

// > a *cooler* blockquote
// > with multiple lines
// >
// > and a gap

// ---

// ## What's up

// * this is a bulleted list
//   - this is indented
//     * this is more indented
// * back to business
// * whoop
//   * there it is
// * more bullets

// the end!

// \`\`\`javascript
// console.log("fart");
// alert(1);
// \`\`\`

// `
//   )
//     .map(toHTML)
//     .join("\n")
// );
