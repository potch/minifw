// used for computed/effect bookkeeping
let context = 0;
let batchSet = 0;

// file size optimizations
let doc = document;
let call = (fn) => fn();
let isObj = (o) => typeof o === "object";
let each = (a, fn) => a.forEach(fn);

// credit to @developit/preact for logic here
let setProp = (el, key, value) => {
  // situations where we always set prop
  // is value a function, object, or is the key an extant prop?
  // if el[key] is object, deep merge it, else set it.
  if (value?.call || isObj(value) || key in el) {
    isObj(el[key])
      ? assign(el[key], value)
      : (el[key] = value === null ? "" : value);
  } else {
    // treat as attribute
    // set if value not null and either not false or prop is `data-` or `aria-`
    if (value !== null && (value !== false || key[4] == "-")) {
      el.setAttribute(key, value);
    } else {
      el.removeAttribute(key);
    }
  }
};

// deep merge assignment
let assign = (a, b) => {
  for (let [k, v] of Object.entries(b || {})) {
    if (a.nodeType) {
      setProp(a, k, v);
    } else if (isObj(a[k]) && isObj(v)) {
      assign(a[k], v);
    } else {
      a[k] = v;
    }
  }
  return a;
};

// create DOM, hyperscript compatible
// works lovely with @developit/htm
let dom = (tag, props, ...children) => {
  let el = assign(doc.createElement(tag), props);
  el.append(...children);
  return el;
};

// event listeners, returns a callback to un-listen
let on = (target, ...args) => {
  target.addEventListener(...args);
  return (_) => target.removeEventListener(...args);
};

// event primitive, returns [emit, watch] fns
let event = (watchers = new Set()) => [
  (...args) => each(watchers, (fn) => fn(...args)),
  (fn) => {
    watchers.add(fn);
    return (_) => watchers.delete(fn);
  },
];

// reactive value primitive
let signal = (value, [emit, watch] = event()) => ({
  set val(v) {
    if (value !== v) {
      value = v;
      // defer emits when in batch callbacks
      if (batchSet) {
        batchSet.add(emit);
      } else {
        emit();
      }
    }
  },
  get val() {
    // if we're in an effect callback, register as a dep
    if (context) {
      context.add(this);
    }
    return value;
  },
  peek: (_) => value,
  watch,
});

// pure side effect
// runs when any signal referenced in `fn` by `.value` changes
// use signal.peek in effects to avoid dependency tracking
let effect = (fn) => {
  let inUpdate = 0;
  let teardown;
  let update = (_) => {
    if (!inUpdate) {
      inUpdate = 1;
      fn();
      inUpdate = 0;
    }
  };
  context = new Set();
  fn();
  teardown = [...context].map((d) => d.watch(update));
  context = 0;

  return (_) => each(teardown, call);
};

// derived reactive value, composition of a signal and an effect
// auto updates when any signal referenced in `fn` by `.value` changes
let computed = (fn) => {
  let s = signal();
  effect((_) => (s.val = fn()));
  return {
    get val() {
      return s.val;
    },
    peek: s.peek,
    watch: s.watch,
  };
};

// update a bunch of signals at once, get deduped effects after
let batch = (fn) => {
  batchSet = new Set();
  fn();
  each(batchSet, call);
  batchSet = 0;
};

export { assign, dom, on, event, signal, computed, effect, batch };
