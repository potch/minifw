import createRouter from "../src/router.js";
import html from "./html.js";

import nav from "./nav.js";

const loadingRoutes = {};
const loadRoute =
  (file) =>
  async (...args) => {
    if (!loadingRoutes[file]) {
      loadingRoutes[file] = import(file).then((i) => i.default);
    }
    return (await loadingRoutes[file])(...args);
  };

export const host = new URL("http://localhost:8080/");

export const router = createRouter();

export const template = ({ content }) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf8">
    <title>My Site</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="/demo/style.css">
    <script type="importmap">
      {
        "imports": {
          "htm": "/node_modules/htm/dist/htm.mjs"
        }
      }
    </script>
    <script type="module" src="/demo/browser.js"></script>
  </head>
  <body>
    ${content}
  </body>
</html>
`;

// top layout
router.handle("/*", () => {
  return html`<div class="app">
    <h1>Website</h1>
    ${nav}
    <div id="main"></div>
  </div>`;
});

const mountTo = (mountTo, handler) => (context) =>
  handler(context).then((el) => ({
    mountTo,
    el,
  }));

router.handle("/", (_) => {
  return {
    mountTo: "main",
    el: html`<div>
      <p>hi</p>
      <form action="/search">
        <input name="query" />
        <button>go</button>
      </form>
    </div>`,
  };
});

router.handle("/about", mountTo("main", loadRoute("../demo/about.js")));

router.handle("/party/[time]", ({ params }) => {
  return {
    mountTo: "main",
    el: html`<p>Party on, ${params.time}</p>`,
  };
});

router.handle("/search", mountTo("main", loadRoute("../demo/search.js")));
