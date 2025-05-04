// src/utils/youtube.js
export async function getRandomVideo(query, apiKey) {
  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${encodeURIComponent(
      query
    )}&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();
  if (!data.items?.length) return null;

  const item = data.items[Math.floor(Math.random() * data.items.length)];
  return {
    videoId: item.id.videoId,
    title: item.snippet.title
  };
}
