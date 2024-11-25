import { Server } from "../server.js";
import { document } from "../ssr.js";
import { dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, stat } from "node:fs/promises";

globalThis.document = document;

const MIMES = {
  js: "text/javascript",
  json: "application/json",
};

const start = async () => {
  const { router, template } = await import("./app.js");

  const server = new Server();

  server.get(/.*/, (req, res) => {
    console.log(req.method, req.url.pathname + req.url.search);
    req.addListener("close", () => console.log(res.statusCode));
  });

  server.get(/.*\.\w+/, async (req, res) => {
    const file = req.url.pathname;
    console.log("fileget", file);
    const ext = extname(file).slice(1);
    const path = process.cwd() + file;
    console.log(file, ext, path);
    try {
      await stat(path);
      res.setHeader("content-type", MIMES[ext] ?? "text/plain");
      res.end(await readFile(path).then((b) => b.toString("utf8")));
    } catch (e) {
      console.warn("could not find local file", file);
    }
  });

  server.get(/.*/, async (req, res) => {
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
