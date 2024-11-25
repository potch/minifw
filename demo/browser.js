import { on, event } from "../index.js";

on(window, "DOMContentLoaded", async () => {
  const { router } = await import("/demo/app.js");

  const navigate = async (url) => {
    const routes = router.route(url.pathname);

    if (routes.length) {
      const [emitOnMount, onMount] = event();
      const { params, handler } = routes[0];
      const result = await handler({ params, onMount, url });
      document.body.replaceChildren(result);
      history.replaceState({}, "", url);
      setTimeout(emitOnMount, 0);
    }
  };

  on(document.body, "click", async (e) => {
    if (e.target.href) {
      e.preventDefault();
      await navigate(new URL(e.target.href));
    }
  });

  navigate(new URL(window.location));
});
