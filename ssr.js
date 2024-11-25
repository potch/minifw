// fake enough DOM for the `dom()` function to work

const voids = new Set(
  "area,base,br,col,embed,hr,img,input,link,meta,source,track,wbr".split(",")
);

const cn = (el) => el.childNodes;
const pn = "parentNode";
const obj = Object;

const nodeMock = {
  append(...nodes) {
    for (let n of nodes) {
      n = n?.nodeType ? n : createTextNode(n?.toString());
      cn(this).push(n);
      n[pn] = this;
    }
  },
  setAttribute(a, v) {
    this.attributes.set(a, v);
  },
  removeAttribute(a) {
    this.attributes.delete(a);
  },
  insertBefore(node, ref) {
    cn(this).splice(cn(this).indexOf(ref), 0, node);
  },
  remove() {
    let parentNode = this[pn];
    if (parentNode) {
      parentNode.childNodes = cn(parentNode).filter((n) => n !== this);
      this[pn] = null;
    }
  },
  get outerHTML() {
    let { tagName } = this;
    switch (this.nodeType) {
      case 1:
        return (
          "<" +
          tagName +
          [...this.attributes]
            .map(([a, v]) => ` ${a}="${v.toString()}"`)
            .join("") +
          ">" +
          cn(this)
            .map((n) => n.outerHTML)
            .join("") +
          (voids.has(tagName) ? "" : `</${tagName}>`)
        );
      case 3:
        return this.textContent;
    }
    return "";
  },
};

const _node = (props) => obj.assign(obj.create(nodeMock), props);
const createElement = (tagName) =>
  _node({
    nodeType: 1,
    tagName,
    attributes: new Map(),
    childNodes: [],
  });
const createTextNode = (textContent) => _node({ nodeType: 3, textContent });
const createComment = (data) => _node({ nodeType: 8, data });

export const document = {
  createElement,
  createTextNode,
  createComment,
  body: createElement("body"),
};
