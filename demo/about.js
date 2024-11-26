import { signal, effect } from "../src/fw.js";
import html from "./html.js";
import nav from "./nav.js";

export default ({ onMount }) => {
  const count = signal(1);
  const counter = html`<span id="counter">${count.val}</span>`;

  effect(() => {
    counter.innerText = count.val;
  });

  const button = html`<button>inc</button>`;

  onMount(() => {
    return on(button, "click", () => {
      count.val++;
    });
  });

  return html`
    <div>
      ${nav}
      <p>About</p>
      <div>${button} ${counter}</div>
    </div>
  `;
};
