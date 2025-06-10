// /render-scraper/index.js
import express from "express";
import cors from "cors";
import { scrapeGenius } from "./scrapers/genius.js";
import { scrapeAZLyrics } from "./scrapers/azlyrics.js";
import { scrapeLyricsCom } from "./scrapers/lyricscom.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  try {
    let data;
    if (url.includes("genius.com")) data = await scrapeGenius(url);
    else if (url.includes("azlyrics.com")) data = await scrapeAZLyrics(url);
    else if (url.includes("lyrics.com")) data = await scrapeLyricsCom(url);
    else return res.status(400).json({ error: "Unsupported lyrics source." });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scraping failed" });
  }
});

app.listen(3000, () => console.log("✅ Scraper running on :3000"));
