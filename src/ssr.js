// fake enough DOM for the `dom()` function to work

let voids =
  /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/;

let attributes = "attributes";
let pn = "parentNode";
let cn = "childNodes";
let obj = Object;
let mapCn = (el, fn) => el[cn].map(fn);

let nodeMock = {
  append(...nodes) {
    nodes.map((n) => {
      n = n?.nodeType ? n : _node(3, { textContent: "" + n });
      this[cn].push(n);
      n[pn] = this;
    });
  },
  replaceWith(node) {
    let parentNode = this[pn];
    if (parentNode) {
      parentNode[cn] = mapCn(parentNode, (n) => (n == this ? node : n));
      node[pn] = parentNode;
    }
  },
  replaceChildren(...nodes) {
    mapCn(this, (n) => n.remove());
    this.append(...nodes);
  },
  setAttribute(a, v) {
    this[attributes][a] = v;
  },
  removeAttribute(a) {
    delete this[attributes][a];
  },
  remove() {
    let self = this;
    let parentNode = self[pn];
    if (parentNode) {
      parentNode[cn] = parentNode[cn].filter((n) => n != self);
      self[pn] = null;
    }
  },
  get outerHTML() {
    let self = this;
    let { tagName, nodeType } = self;
    if (nodeType == 1) {
      return (
        "<" +
        tagName +
        obj
          .entries(self[attributes])
          .map((a) => ` ${a[0]}="${a[1]}"`)
          .join("") +
        ">" +
        self.innerHTML +
        (voids.test(tagName) ? "" : `</${tagName}>`)
      );
    }
    if (nodeType == 3) {
      return self.textContent;
    }
    return "";
  },
  get innerHTML() {
    return mapCn(this, (n) => n.outerHTML).join("");
  },
};

let _node = (nodeType, props) =>
  obj.assign(obj.create(nodeMock), { nodeType }, props);

let createElement = (tagName) =>
  _node(1, {
    tagName: tagName.toLowerCase(),
    [attributes]: {},
    [cn]: [],
  });

export default {
  createElement,
  // used by ssr instead of getElementById
  find: (el, id) => {
    let current,
      stack = [el];
    do {
      current = stack.pop();
      if (current?.[attributes]?.id == id) return current;
      if (current) {
        stack.push(...current[cn]);
      }
    } while (stack.length);
  },
};
