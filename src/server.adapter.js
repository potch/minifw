import Server from "./server.js";
import mockDocument from "./ssr.js";
import { extname } from "node:path";
import { stat } from "node:fs/promises";

const doc = (globalThis.document = mockDocument);

const noop = (_) => {};

const send404 = (res) => {
  res.statusCode = 404;
  res.end("404");
};

const MIMES = {
  js: "text/javascript",
  json: "application/json",
  css: "text/css",
};

const start = async (entrypoint) => {
  const {
    router,
    template,
    host,
    onReady = noop,
    onServer = noop,
  } = await import(entrypoint);

  const server = new Server({ host });

  server.get("*", (req, res) =>
    req.on("close", () => {
      console.log(res.statusCode, req.method, req.url.pathname);
    })
  );

  onServer(server);

  server.get("*.*", async (req, res) => {
    const file = req.url.pathname;
    const ext = extname(file).slice(1);
    const path = process.cwd() + file;
    try {
      await stat(path);
      await res.sendFile(path, MIMES[ext]);
    } catch (e) {
      send404(res);
    }
  });

  server.get("*", async ({ url }, res) => {
    const routes = router.route(url.pathname);
    const root = doc.createElement("div");
    if (routes.length) {
      for await (let route of routes) {
        const { handler, params } = route;
        let result = await handler({ params, url, onMount: noop });
        if (result.nodeType) {
          result = {
            mountTo: "app",
            el: result,
          };
        }
        const mountEl = doc.find(root, result.mountTo) ?? root;
        mountEl.replaceChildren(result.el);
      }
      res.end(
        template({
          content: root.innerHTML,
        })
      );
    } else {
      send404(res);
    }
  });

  server.listen().then(onReady);
};

start(process.argv.at(-1)).catch(console.error);
