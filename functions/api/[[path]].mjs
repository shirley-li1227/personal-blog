import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { handleAsNodeRequest } = require("cloudflare:node");
const app = require("../../src/app.js");

app.listen(3000);

export async function onRequest(context) {
  return handleAsNodeRequest(3000, context.request);
}
