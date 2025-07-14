import { searchGenius, getGeniusSong } from '../utils/geniusApi.js';

async function tryGeniusFallback(query) {
  try {
    const hits = await searchGenius(query);
    if (hits.length === 0) return null;

    const song = hits[0].result;
    const fullSong = await getGeniusSong(song.id);

    return {
      title: fullSong.full_title,
      lyrics_url: fullSong.url,
      artist: fullSong.primary_artist.name,
      thumbnail: fullSong.song_art_image_thumbnail_url,
    };
  } catch (err) {
    console.warn('Genius API fallback failed:', err.message);
    return null;
  }
}