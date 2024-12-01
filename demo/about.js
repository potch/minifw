import { signal, effect, on } from "../src/fw.js";
import html from "./html.js";

export default ({ onMount }) => {
  const count = signal(1);
  const counter = signal();
  const button = signal();

  onMount(() => [
    on(button.val, "click", () => {
      count.val++;
    }),
    effect(() => {
      counter.val.innerText = " " + count.val;
    }),
  ]);

  return html`
    <div>
      <p>About</p>
      <div>
        <button ref=${button}>inc</button>
        <span ref=${counter}> ${count.val}</span>
      </div>
    </div>
  `;
};
