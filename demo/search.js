import html from "./html.js";
import nav from "./nav.js";

export default ({ url }) => {
  return html`<div>
    ${nav}
    <p>Searching for: ${url.searchParams.get("query")}</p>
  </div>`;
};
