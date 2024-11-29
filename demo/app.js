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
      nav { display: flex; gap: .5rem }
    </style>
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

router.handle("/", () => {
  return html`<div>
    ${nav}
    <p>Welcome Home!</p>
    <form action="/search">
      <input name="query" />
      <button>go</button>
    </form>
  </div>`;
});

router.handle("/about", loadRoute("./about.js"));

router.handle("/party/[time]", ({ params }) => {
  return html`<div>
    ${nav}
    <p>Party on, ${params.time}</p>
  </div>`;
});

router.handle("/search", loadRoute("./search.js"));
