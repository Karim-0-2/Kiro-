const axios = require('axios');

async function getStreamFromURL(url) {
  const response = await axios.get(url, { responseType: 'stream' });
  return response.data;
}

async function fetchAnimeEditVideos(query) {
  try {
    const response = await axios.get(`https://lyric-search-neon.vercel.app/kshitiz?keyword=${query}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching videos:', error.message);
    return null;
  }
}

module.exports = {
  config: {
    name: "anisearch",
    aliases: ["animeedit", "ae"],
    author: "Vex_kshitiz",
    version: "1.1",
    shortDescription: { en: "Get anime edit videos" },
    longDescription: { en: "Search for anime edit videos on TikTok" },
    category: "fun",
    guide: { en: "{p}{n} [query]" },
  },

  onStart: async function ({ api, event, args }) {
    // React to user's message
    api.setMessageReaction("✨", event.messageID, (err) => {}, true);

    const query = args.join(' ');
    if (!query) {
      return api.sendMessage({ body: "Please provide a search query." }, event.threadID, event.messageID);
    }

    const modifiedQuery = `${query} anime edit`;
    const videos = await fetchAnimeEditVideos(modifiedQuery);

    if (!videos || videos.length === 0) {
      return api.sendMessage({ body: `No anime edits found for "${query}".` }, event.threadID, event.messageID);
    }

    // Select a random video
    const selectedVideo = videos[Math.floor(Math.random() * videos.length)];
    const videoUrl = selectedVideo.videoUrl;

    if (!videoUrl) {
      return api.sendMessage({ body: 'Error: Video URL not found.' }, event.threadID, event.messageID);
    }

    try {
      const videoStream = await getStreamFromURL(videoUrl);
      await api.sendMessage({
        body: `Here’s your anime edit for "${query}":`,
        attachment: videoStream
      }, event.threadID, event.messageID);
    } catch (error) {
      console.error('Error sending video:', error.message);
      api.sendMessage({
        body: 'An error occurred while processing the video.\nPlease try again later.'
      }, event.threadID, event.messageID);
    }
  },
};
