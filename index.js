export const $$ = (selector, scope = document) =>
  scope.querySelectorAll(selector);
export const $ = (selector, scope = document) => scope.querySelector(selector);

export const dom = (tag, props, ...children) => {
  const el = Object.assign(document.createElement(tag), props);
  el.append(...children);
  return el;
};

export const on = (target, event, handler, opts) => {
  target.addEventListener(event, handler, opts);
  return () => target.removeEventListener(event, handler, opts);
};

let context = false;

export const signal = (value) => {
  const watchers = new Set();

  return {
    set value(v) {
      if (value !== v) {
        value = v;
        watchers.forEach((d) => d());
      }
    },
    get value() {
      if (context) context.add(this);
      return value;
    },
    peek() {
      return value;
    },
    watch(fn) {
      watchers.add(fn);
      return () => watchers.delete(fn);
    },
  };
};

export const computed = (fn) => {
  const watchers = new Set();
  let teardown;

  context = new Set();
  let value = fn();
  const deps = [...context];
  context = false;

  const update = () => {
    const v = fn();
    if (v !== value) {
      value = v;
      watchers.forEach((d) => d());
    }
  };

  return {
    get value() {
      if (context) context.add(this);
      return value;
    },
    peek() {
      return value;
    },
    watch(fn) {
      if (!watchers.size) {
        teardown = deps.map((d) => d.watch(update));
      }
      watchers.add(fn);
      return () => {
        watchers.delete(fn);
        if (!watchers.size) teardown.forEach((fn) => fn());
      };
    },
  };
};

export const effect = (fn) => {
  context = new Set();
  fn();
  const deps = [...context];
  context = false;

  const teardown = deps.map((d) => d.watch(fn));

  return () => teardown.forEach((fn) => fn());
};
