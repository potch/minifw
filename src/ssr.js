// fake enough DOM for the `dom()` function to work

let voids =
  /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/;

let attributes = "attributes";
let pn = "parentNode";
let obj = Object;

let nodeMock = {
  append(...nodes) {
    nodes.map((n) => {
      n = n?.nodeType ? n : _node(3, { textContent: "" + n });
      this.c.push(n);
      n[pn] = this;
    });
  },
  replaceChildren(...nodes) {
    this.c.map((n) => n.remove());
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
      parentNode.childNodes = parentNode.c.filter((n) => n !== self);
      self[pn] = null;
    }
  },
  get c() {
    return this.childNodes ?? [];
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
          .map(([a, v]) => " " + a + '="' + v + '"')
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
    return this.c.map((n) => n.outerHTML).join("");
  },
};

let _node = (nodeType, props) =>
  obj.assign(obj.create(nodeMock), { nodeType }, props);

let createElement = (tagName) =>
  _node(1, {
    tagName: tagName.toLowerCase(),
    [attributes]: {},
    childNodes: [],
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
      stack.push(...(current?.c ?? []));
    } while (stack.length > 0);
  },
};
