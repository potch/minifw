import html from "./html.js";

export default ({ url }) => {
  return html`<div>
    <p>Searching for: ${url.searchParams.get("query")}</p>
  </div>`;
};
