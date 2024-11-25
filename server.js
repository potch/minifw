import { Server as httpServer } from "node:http";

const isRE = (o, fallback) => (o instanceof RegExp ? o : fallback);

const router = (routes = []) => ({
  handle(path, handler) {
    const pattern =
      isRE(path) ||
      new RegExp(
        "^" +
          path.replace(/\[([^\]]+)\]/g, (_, param) => `(?<${param}>[^\\/]+)`) +
          "$"
      );
    routes.push({
      path,
      pattern,
      handler,
    });
  },

  route: (path) =>
    routes.reduce((list, route) => {
      const match = route.pattern.exec(path);
      return match ? [...list, { ...route, params: match.groups }] : list;
    }, []),
});

class Server extends httpServer {
  constructor({ host = new URL("http://localhost:8080/"), routes = [] } = {}) {
    super((req, res) => this.handler(req, res).catch(console.error));

    Object.assign(this, router(routes), { host });
  }

  async handler(req, res) {
    req.url = new URL(req.url, this.host);

    const { pathname } = req.url;
    const chunks = [];
    const key = req.method + ":" + pathname;
    const matches = this.route(key);

    req.body = new Promise((resolve) => {
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks)));
    });

    for (let { handler, params } of matches) {
      req.params = params;
      await handler?.(req, res);
      if (res.writableEnded) return;
    }
  }

  get(path, handler) {
    this.handle(isRE(path, "GET:" + path), handler);
  }

  post(path, handler) {
    this.handle(isRE(path, "POST:" + path), handler);
  }

  listen() {
    return new Promise((ready) => super.listen(this.host.port, ready));
  }
}

export { router, Server };
