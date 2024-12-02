import { on, event } from "../src/fw.js";

on(window, "DOMContentLoaded", async () => {
  const { router } = await import("./app.js");

  const activeMounts = new WeakMap();

  const navigate = async (url, didPop = false) => {
    const routes = router.route(url.pathname);

    if (!didPop) {
      history.pushState({}, "", url);
    }
    for await (let route of routes) {
      const [emitOnMount, onMount] = event();
      const { params, handler } = route;
      let result = await handler({ params, onMount, url });
      if (!result) continue;
      if (result.tagName) {
        result = {
          mountTo: "app",
          el: result,
        };
      }

      const mountEl = document.getElementById(result.mountTo) ?? document.body;
      if (mountEl) {
        const currentMounts = activeMounts.get(mountEl) || [];
        while (currentMounts.length) {
          currentMounts.pop()?.call?.();
        }
        mountEl.replaceChildren(result.el);
        setTimeout(() => {
          activeMounts.set(mountEl, emitOnMount().flat(Infinity));
        }, 0);
      }
    }
  };

  on(document.body, "click", (e) => {
    if (e.target.href) {
      e.preventDefault();
      navigate(new URL(e.target.href));
    }
  });

  on(window, "popstate", () => {
    navigate(new URL(window.location), true);
  });

  navigate(new URL(window.location), true);
});
