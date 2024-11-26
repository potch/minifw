const router = (routes = []) => ({
  handle(path, handler) {
    const pattern =
      path instanceof RegExp
        ? path
        : new RegExp(
            "^" +
              path.replace(
                /\[([^\]]+)\]/g,
                (_, param) => `(?<${param}>[^\\/]+)`
              ) +
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

export default router;
