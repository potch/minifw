import { document } from "../src/ssr.js";
import htm from "htm";
globalThis.document = document;

import("../src/fw.js").then(({ effect, batch, signal, computed, dom }) => {
  const html = htm.bind(dom);
  const a = signal(1);
  const b = signal(2);
  const c = computed(() => a.val + b.val);

  // print 3
  effect(() => console.log("boop", c.val));

  a.val = 2;

  const el = html`
    <div class="red">
      <i onclick=${(e) => console.log("hi")}>Hello</i>
      brah ${c.val}
      <img src="foo.png" />
    </div>
  `;

  console.log(el.outerHTML);
});
