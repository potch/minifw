const router = ({ routes = [], handlerFactory = (h) => h } = {}) => ({
  handle(path, handler) {
    const pattern =
      path instanceof RegExp
        ? path
        : new RegExp(
            "^" +
              path
                .replace(/\./g, "\\.")
                .replace(/\[([^\]]+)\]/g, (_, param) => `(?<${param}>[^\\/]+)`)
                .replace(/\*/g, ".*?") +
              "$"
          );
    routes.push({
      path,
      pattern,
      handler: handlerFactory(handler),
    });
  },

  route: (path) =>
    routes.reduce((list, route) => {
      const match = route.pattern.exec(path);
      return match ? [...list, { ...route, params: match.groups }] : list;
    }, []),
});

export default router;
