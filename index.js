// querySelector shorthands
const $$ = (selector, scope = document) => scope.querySelectorAll(selector);
const $ = (selector, scope = document) => scope.querySelector(selector);

// deep merge assignment
const assign = (a, b) => {
  for (let [k, v] of Object.entries(b || {})) {
    if (typeof a[k] === typeof v && typeof v === "object") {
      assign(a[k], v);
    } else {
      a[k] = v;
    }
  }
  return a;
};

// create DOM, props arg optional
const dom = (tag, props, ...children) => {
  let el = assign(document.createElement(tag), props);
  el.append(...children);
  return el;
};

// event listeners, returns a callback to un-listen
const on = (target, event, handler, opts) => {
  target.addEventListener(event, handler, opts);
  return () => target.removeEventListener(event, handler, opts);
};

// event primitive, returns [emit, watch] fns
const event = () => {
  let watchers = new Set();
  return [
    (...args) => watchers.forEach((fn) => fn(...args)),
    (fn) => {
      watchers.add(fn);
      return () => watchers.delete(fn);
    },
  ];
};

// used for computed/effect bookkeeping
let context = false;
let batchSet = null;

// reactive value primitive
const signal = (value) => {
  let [emit, watch] = event();

  return {
    set value(v) {
      if (value !== v) {
        value = v;
        if (batchSet) {
          batchSet.add(emit);
        } else {
          emit();
        }
      }
    },
    get value() {
      if (context) context.add(this);
      return value;
    },
    peek() {
      return value;
    },
    watch,
  };
};

// pure side effect
// runs when any signal referenced in `fn` by `.value` changes
const effect = (fn) => {
  context = new Set();
  let inUpdate = false;
  const update = () => {
    if (!inUpdate) {
      inUpdate = true;
      fn();
      inUpdate = false;
    }
  };
  fn();
  let deps = [...context];
  context = false;

  let teardown = deps.map((d) => d.watch(update));
  return () => teardown.forEach((t) => t());
};

// derived reactive value, composition of a signal and an effect
// auto updates when any signal referenced in `fn` by `.value` changes
const computed = (fn) => {
  let s = signal();
  effect(() => (s.value = fn()));
  return {
    get value() {
      return s.value;
    },
    peek() {
      return s.peek();
    },
    watch(fn) {
      return s.watch(fn);
    },
  };
};

const batch = (fn) => {
  batchSet = new Set();
  fn();
  batchSet.forEach((fn) => fn());
  batchSet = null;
};

export { $$, $, assign, dom, on, event, signal, computed, effect, batch };
