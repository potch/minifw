import { Server } from "../server.js";
import { document } from "../ssr.js";

globalThis.document = document;

const render = ({ title, content }) => `
<!doctype html>
<html>
  <head>
    <title>${title}</title>
    <style>
      * {
        box-sizing: border-box;
      }
      html { font: normal 20px sans-serif }
      body { margin: 2rem }
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>
`;

const server = new Server();

server.get(/.*/, (req, res) => {
  console.log(req.method, req.url.pathname + req.url.search);
  req.addListener("close", () => console.log(res.statusCode));
});

server.get("/", (req, res) => {
  res.end(
    render({
      title: "site home",
      content: "home",
    })
  );
});

server.get("/party/[time]", (req, res) => {
  res.end(
    render({
      title: "party time",
      content: req.params.time,
    })
  );
});

server.handle(/.*/, (req, res) => {
  res.statusCode = 404;
  res.end("Not Found");
});

server.listen().then(() => console.log("check it out", server.host.href));
