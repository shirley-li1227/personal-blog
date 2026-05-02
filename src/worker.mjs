import { handleAsNodeRequest } from "cloudflare:node";
import app from "./app.js";
import { runWithWorkerEnv } from "./config/db.js";

app.listen(3000);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) {
      return runWithWorkerEnv(env, async () => {
        return await handleAsNodeRequest(3000, request);
      });
    }
    return env.ASSETS.fetch(request);
  },
};
