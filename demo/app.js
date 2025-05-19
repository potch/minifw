import createRouter from "../src/router.js";
import html from "./html.js";

import nav from "./nav.js";

const loadingRoutes = {};
const lazyRoute =
  (file) =>
  async (...args) => {
    if (!loadingRoutes[file]) {
      loadingRoutes[file] = import(file).then((i) => i.default);
    }
    return (await loadingRoutes[file])(...args);
  };

export const host = new URL("http://localhost:8080/");

export const onServer = (server) =>
  server.get("/@htm", (_, res) =>
    res.sendFile("./node_modules/htm/dist/htm.mjs", "text/javascript")
  );

export const onReady = (server) => {
  console.log("check it out", server.host.href);
};

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
          "htm": "/@htm"
        }
      }
    </script>
    <script type="module">
      import start from "/src/browser.adapter.js"
      start('/demo/app.js')
    </script>
  </head>
  <body>
    ${content}
  </body>
</html>
`;

export const router = createRouter();

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

router.handle("/about", mountTo("main", lazyRoute("../demo/about.js")));

router.handle("/party/[time]", ({ params }) => {
  return {
    mountTo: "main",
    el: html`<div>
      <p>Party on, ${params.time}</p>
      <span id="special">foo</span>
    </div>`,
  };
});

router.handle("/party/special", ({ params }) => {
  return {
    mountTo: "special",
    el: html`SECRET FOUND`,
  };
});

router.handle("/search", mountTo("main", lazyRoute("../demo/search.js")));
