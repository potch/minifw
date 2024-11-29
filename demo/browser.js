import { on, event } from "../src/fw.js";

on(window, "DOMContentLoaded", async () => {
  const { router } = await import("./app.js");

  const activeMounts = new WeakMap();

  const navigate = async (url, e) => {
    const routes = router.route(url.pathname);

    if (routes.length) {
      const [emitOnMount, onMount] = event();
      const { params, handler } = routes[0];
      const result = await handler({ params, onMount, url });
      const el = document.body;
      const currentMounts = activeMounts.get(el) || [];
      while (currentMounts.length) {
        currentMounts.pop()?.call?.();
      }
      el.replaceChildren(result);
      history.pushState({}, "", url);
      activeMounts.set(el, emitOnMount().flat(Infinity));
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
