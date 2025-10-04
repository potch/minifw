import { signal, effect, computed, on, mount } from "../src/munifw.js";
import html from "./html.js";

const ItemList = ({ items }) => html`<ul>
  ${items.value.map((item) => html`<li>${item}</li>`)}
</ul>`;

export default async ({ onMount }) => {
  const count = signal(1);
  const counter = signal();
  const button = signal();

  const form = signal();
  const items = signal(["Hello"]);

  onMount(() => [
    on(button.value, "click", () => {
      count.value++;
    }),
    on(form.value, "submit", (e) => {
      e.preventDefault();
      items.value = [...items.value, form.value.elements.word.value];
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
        <form ref=${form}>
          <input name="word" />
        </form>
        <${ItemList} items=${items} />
      </div>
    </div>
  `;
};
