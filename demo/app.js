import createRouter from "../router.js";
import { dom, signal, effect } from "../index.js";

export const router = createRouter();

export const template = ({ title, content }) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf8">
    <title>My Site</title>
    <style>
      * {
        box-sizing: border-box;
      }
      html { font: normal 20px sans-serif }
      body { margin: 2rem }
    </style>
    <script type="module" src="/demo/browser.js"></script>
  </head>
  <body>
    ${content}
  </body>
</html>
`;

const nav = dom(
  "nav",
  {},
  dom("a", { href: "/" }, "home"),
  " ",
  dom("a", { href: "/about" }, "about"),
  " ",
  dom("a", { href: "/party/farty" }, "party")
);

router.handle("/", () => {
  return dom(
    "div",
    {},
    nav,
    dom("p", {}, "Welcome Home!"),
    dom(
      "form",
      { action: "/search" },
      dom("input", { name: "query" }),
      dom("button", {}, "go")
    )
  );
});

router.handle("/about", ({ onMount }) => {
  onMount(() => console.log("mounted!"));
  return dom("div", {}, nav, dom("p", {}, "About"));
});

router.handle("/party/[time]", ({ params }) => {
  return dom("div", {}, nav, dom("p", {}, "Party on, ", params.time));
});

router.handle("/search", ({ url }) => {
  return dom(
    "div",
    {},
    nav,
    dom("p", {}, "Searching for: ", url.searchParams.get("query"))
  );
});
