import { on, event } from "../src/fw.js";

on(window, "DOMContentLoaded", async () => {
  const { router } = await import("./app.js");

  const currentMounts = [];

  const navigate = async (url, e) => {
    const routes = router.route(url.pathname);

    while (currentMounts.length) {
      currentMounts.pop()?.call();
    }

    if (routes.length) {
      const [emitOnMount, onMount] = event();
      const { params, handler } = routes[0];
      const result = await handler({ params, onMount, url });
      document.body.replaceChildren(result);
      history.pushState({}, "", url);
      currentMounts.push(...emitOnMount());
    }
  };

  on(document.body, "click", async (e) => {
    if (e.target.href) {
      e.preventDefault();
      await navigate(new URL(e.target.href));
    }
  });

  on(window, "popstate", () => {
    navigate(new URL(window.location));
  });

  navigate(new URL(window.location));
});
