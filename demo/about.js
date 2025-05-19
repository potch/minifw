import { signal, effect, on } from "../src/fw.js";
import html from "./html.js";

export default async ({ onMount }) => {
  const count = signal(1);
  const counter = signal();
  const button = signal();

  onMount(() => [
    on(button.value, "click", () => {
      count.value++;
    }),
    effect(() => {
      counter.value.innerText = " " + count.value;
    }),
  ]);

  return html`
    <div>
      <p>About</p>
      <div>
        <button ref=${button}>inc</button>
        <span ref=${counter}> ${count.value}</span>
      </div>
    </div>
  `;
};
