import { getLyrics } from "./routes/getlyrics";
import { addLyrics } from "./routes/addlyrics";
import { scrapeLyrics } from "./routes/scrapelyrics";
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