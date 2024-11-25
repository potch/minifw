import { document } from "./ssr.js";
import htm from "htm";
globalThis.document = document;

import("./index.js").then(
  ({ default: { effect, batch, signal, computed, dom } }) => {
    const html = htm.bind(dom);
    const a = signal(1);
    const b = signal(2);
    const c = computed(() => a.val + b.val);

    // print 3
    effect(() => console.log(c.val));

    // print 13, only once
    batch(() => {
      a.val = 5;
      b.val = 8;
    });

    const el = html`
      <div class="red">
        <i onclick=${(e) => console.log("hi")}>Hello</i>
        brah ${c.val}
        <img src="foo.png" />
      </div>
    `;

    console.log(el.outerHTML);
  }
);
