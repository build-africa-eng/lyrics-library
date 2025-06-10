// /worker/src/index.js
import { getLyrics } from "./routes/getLyrics";
import { addLyrics } from "./routes/addLyrics";
import { scrapeLyrics } from "./routes/scrapeLyrics";
import { getDB } from "./db";

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const db = getDB(env);

    if (req.method === "GET" && url.pathname === "/lyrics") return getLyrics(req, db);
    if (req.method === "POST" && url.pathname === "/lyrics") return addLyrics(req, db);
    if (req.method === "POST" && url.pathname === "/scrape") return scrapeLyrics(req, db);

    return new Response("Not found", { status: 404 });
  }
};
