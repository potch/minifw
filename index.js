// used for computed/effect bookkeeping
let context = false;
let batchSet = null;

// file size optimizations
const doc = document;
const call = (fn) => fn();

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

// querySelector shorthands
const $$ = (selector, scope = doc) => scope.querySelectorAll(selector);
const $ = (selector, scope = doc) => scope.querySelector(selector);

// create DOM
const dom = (tag, props, ...children) => {
  let el = assign(doc.createElement(tag), props);
  el.append(...children);
  return el;
};

// event listeners, returns a callback to un-listen
const on = (target, event, handler, opts) => {
  target.addEventListener(event, handler, opts);
  return (_) => target.removeEventListener(event, handler, opts);
};

// event primitive, returns [emit, watch] fns
const event = (_) => {
  let watchers = new Set();
  return [
    (...args) => watchers.forEach((fn) => fn(...args)),
    (fn) => {
      watchers.add(fn);
      return (_) => watchers.delete(fn);
    },
  ];
};

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
    peek: (_) => value,
    watch,
  };
};

// pure side effect
// runs when any signal referenced in `fn` by `.value` changes
const effect = (fn) => {
  let inUpdate = false;
  let update = (_) => {
    if (!inUpdate) {
      inUpdate = true;
      fn();
      inUpdate = false;
    }
  };
  context = new Set();
  fn();
  let teardown = [...context].map((d) => d.watch(update));
  context = false;

  return (_) => teardown.forEach(call);
};

// derived reactive value, composition of a signal and an effect
// auto updates when any signal referenced in `fn` by `.value` changes
const computed = (fn) => {
  let s = signal();
  effect((_) => (s.value = fn()));
  return {
    get value() {
      return s.value;
    },
    peek: (_) => s.peek(),
    watch: (fn) => s.watch(fn),
  };
};

const batch = (fn) => {
  batchSet = new Set();
  fn();
  batchSet.forEach(call);
  batchSet = null;
};

export { $$, $, assign, dom, on, event, signal, computed, effect, batch };
