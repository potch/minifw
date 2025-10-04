// @potch/minifw/fw.js without so much code golfing

// prop to monitor for changes
const val = "value";
const isObj = (o) => typeof o === "object";
const map = (a, fn) => [...a].map(fn);
export const using = (cb, fn) => (fn(), cb());
export const collect = (onEvent, fn, collection = []) => (
  using(
    onEvent((o) => collection.push(o)),
    fn
  ),
  collection
);

// event primitive, returns [emit, watch] fns
export const event = (watchers = new Set()) => [
  (...args) => map(watchers, (fn) => fn(...args)),
  (fn) => {
    watchers.add(fn);
    return () => watchers.delete(fn);
  },
];

// used for computed/effect bookkeeping
const context = [];

// reactive value primitive, notifies when .value changes
export const signal = (value, eq = (a, b) => a === b) => {
  // create event bus
  const [emit, watch] = event();
  return {
    set [val](v) {
      if (!eq(value, v)) {
        value = v;
        emit();
      }
    },
    // manually trigger a value update
    touch() {
      emit();
    },
    get [val]() {
      // if we're in an effect callback, register as a dep
      if (context[0]) {
        context[0].add(this);
      }
      return value;
    },
    peek: () => value,
    watch,
  };
};

export const [emitEffect, onEffect] = event();

// pure side effect
// runs when any signal referenced in `fn` by `.value` changes
// use signal.peek in effects to avoid dependency tracking
export const effect = (fn, ...explicitDependencies) => {
  let inUpdate = false;

  context.push(new Set(explicitDependencies));

  const update = () => {
    // prevents effects effecting themselves
    if (!inUpdate) {
      inUpdate = true;
      fn((...args) => emitEffect(effect(...args)));
      inUpdate = false;
    }
  };

  update();

  const teardown = map(context.at(-1), (dependency) =>
    dependency.watch(update)
  );

  context.pop();

  return () => map(teardown, (fn) => fn());
};

// derived reactive value, composition of a signal and an effect
// auto updates when any signal referenced in `fn` by `.value` changes
export const computed = (fn, value) => {
  const out = signal(value);
  effect(() => (out[val] = fn(out[val])));
  return out;
};

// credit to @developit/preact for logic here
export const setProp = (el, key, value) => {
  if (key == "ref" && val in value) {
    // if key is "ref" and value is signal-like, treat value as signal and set el as value
    value[val] = el;
  } else if (isObj(value) && val in value) {
    // if value is signal-like, mount an effect to update prop
    emitEffect(effect(() => setProp(el, key, value[val])));
  } else if (typeof value === "function" || isObj(value) || key in el) {
    // is value a function, object, or is the key an extant prop?
    // situations where we always set prop
    // if el[key] is object, deep merge it, else set it.
    if (el[key] && isObj(el[key])) {
      assign(el[key], value);
    } else {
      el[key] = value === null ? "" : value;
    }
  } else {
    // treat as attribute
    // set if value not null and either not false or prop is `data-` or `aria-`
    if (
      value !== null &&
      (value !== false || key.startsWith("data-") || key.startsWith("aria-"))
    ) {
      el.setAttribute(key, value);
    } else {
      el.removeAttribute(key);
    }
  }
};

// deep merge assignment
export const assign = (a, b) => {
  if (b) {
    Object.entries(b).forEach(([key, value]) => {
      if (a.nodeType) {
        // check if a is an HTMLElement (duck type for SSR)
        setProp(a, key, value);
      } else if (isObj(a[key]) && isObj(value)) {
        // if both current and new value are objects, recursively deep merge
        assign(a[key], value);
      } else {
        a[key] = value;
      }
    });
  }
  return a;
};

// create DOM, hyperscript compatible
// works lovely with @developit/htm
export const dom = (tag, props, ...children) => {
  let el;
  if (typeof tag === "function") {
    el = mount(() => tag(props, children));
  } else {
    el = document.createElement(tag);
    // allow optional props syntax
    if (props && isObj(props) && !props.nodeType) {
      assign(el, props);
    } else {
      if (props) {
        children.unshift(props);
      }
    }
    el.append(...children.flat(1));
  }
  return el;
};

// a "computed" value that can mount and update in DOM
export const mount = (fn) => {
  // track effects for disconnect
  const teardowns = [];
  let currentEl;
  emitEffect(
    effect(() => {
      // disconnect existing effects
      while (teardowns.length) {
        try {
          teardowns.pop()();
        } catch (e) {}
      }
      // track any effects created when generating mounted DOM
      collect(
        onEffect,
        () => {
          const newEl = fn();
          if (currentEl) {
            // swap or remove new element
            if (newEl) {
              currentEl.replaceWith(newEl);
            }
          }
          currentEl = newEl;
        },
        teardowns
      );
    })
  );
  return currentEl;
};

// dom event listeners, returns a callback to un-listen
export const on = (target, ...args) => {
  target.addEventListener(...args);
  return () => target.removeEventListener(...args);
};
