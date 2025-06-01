// file size optimizations
let val = "value";
let _null = null;
let isObj = (o) => typeof o === "object";
let map = (a, fn) => [...a].map(fn);
let tee = (v, fn) => (fn(v), v);

// event primitive, returns [emit, watch] fns
let event = (watchers = new Set()) => [
  (...args) => map(watchers, (fn) => fn(...args)),
  (fn) => {
    watchers.add(fn);
    return (_) => watchers.delete(fn);
  },
];

// used for computed/effect bookkeeping
let context = _null;

// reactive value primitive, notifies when .value changes
let signal = (value, [emit, watch] = event()) => ({
  set [val](v) {
    if (value !== v) {
      value = v;
      emit();
    }
  },
  get [val]() {
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
  let inUpdate = false;
  let teardown;

  context = new Set();
  fn();
  teardown = map(context, (d) =>
    d.watch((_) => {
      if (!inUpdate) {
        inUpdate = true;
        fn();
        inUpdate = false;
      }
    })
  );
  context = _null;

  return (_) => map(teardown, (fn) => fn());
};

// derived reactive value, composition of a signal and an effect
// auto updates when any signal referenced in `fn` by `.value` changes
let computed = (fn, value) =>
  tee(signal(value), (s) => effect((_) => (s[val] = fn(s[val]))));

let [onEffect, emitEffect] = event();

// credit to @developit/preact for logic here
let setProp = (el, key, value) => {
  if (key == "ref") {
    // if key is "ref", treat value as signal and set el as value
    value[val] = el;
  } else if (isObj(value) && val in value) {
    // if value is signal-like, mount an effect to update prop
    emitEffect(effect(() => setProp(el, key, value[val])));
  } else if (value?.call || isObj(value) || key in el) {
    // is value a function, object, or is the key an extant prop?
    // situations where we always set prop
    // if el[key] is object, deep merge it, else set it.
    el[key] && isObj(el[key])
      ? assign(el[key], value)
      : (el[key] = value === _null ? "" : value);
  } else {
    // treat as attribute
    // set if value not null and either not false or prop is `data-` or `aria-`
    if (value !== _null && (value !== false || key[4] == "-")) {
      el.setAttribute(key, value);
    } else {
      el.removeAttribute(key);
    }
  }
};

// deep merge assignment
let assign = (a, b) => {
  map(Object.entries(b || {}), ([k, v]) => {
    if (a.nodeType) {
      setProp(a, k, v);
    } else if (isObj(a[k]) && isObj(v)) {
      assign(a[k], v);
    } else {
      a[k] = v;
    }
  });
  return a;
};

// create DOM, hyperscript compatible
// works lovely with @developit/htm
let dom = (tag, props, ...children) =>
  tee(assign(document.createElement(tag), props), (el) =>
    el.append(...children)
  );

// dom event listeners, returns a callback to un-listen
let on = (target, ...args) => {
  target.addEventListener(...args);
  return (_) => target.removeEventListener(...args);
};

export { assign, dom, on, event, signal, computed, effect, onEffect };
