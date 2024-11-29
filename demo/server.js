import { Server } from "../src/server.js";
import { document } from "../src/ssr.js";
import { extname } from "node:path";
import { readFile, stat } from "node:fs/promises";

globalThis.document = document;

const MIMES = {
  js: "text/javascript",
  mjs: "text/javascript",
  json: "application/json",
  css: "text/css",
};

const start = async () => {
  const { router, template, host } = await import("./app.js");

  console.log();

  const server = new Server({ host });

  server.get("*", (req, res) => {
    req.addListener("close", () => {
      console.log(
        res.statusCode,
        req.method,
        req.url.pathname + req.url.search
      );
    });
  });

  server.get("*.*", async (req, res) => {
    const file = req.url.pathname;
    const ext = extname(file).slice(1);
    const path = process.cwd() + file;
    try {
      await stat(path);
      res.setHeader("content-type", MIMES[ext] ?? "text/plain");
      res.end(await readFile(path).then((b) => b.toString("utf8")));
    } catch (e) {
      console.warn("could not find local file", file);
    }
  });

  server.get("*", async (req, res) => {
    const routes = router.route(req.url.pathname);
    if (routes.length) {
      const { handler, params } = routes[0];
      const result = await handler({ params, url: req.url, onMount: () => {} });
      res.end(
        template({
          content: result.outerHTML,
        })
      );
    } else {
      res.statusCode = 404;
      res.end("Not Found");
    }
  });

  server.listen().then(() => console.log("check it out", server.host.href));
};

start().catch((e) => console.error(e));
