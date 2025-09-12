const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "namaz",
    aliases: ["prayer", "salah"],
    version: "1.8",
    author: "MahMUD", // real author (kept here for credit)
    countDown: 5,
    role: 0,
    category: "Islamic",
    guide: "{pn} <city>\nExample: {pn} Dhaka"
  },

  onStart: async function ({ message, args }) {
    const city = args.join(" ") || "Dhaka";
    const apiUrl = `${await baseApiUrl()}/api/namaz/font3/${encodeURIComponent(city)}`;

    try {
      const response = await axios.get(apiUrl, {
        headers: { "author": "Hasib" } // always show Hasib in API header/output
      });

      if (response.data?.error) {
        return message.reply(`${response.data.error}`);
      }

      if (response.data?.message) {
        return message.reply(`🕌 Prayer times for ${city}\n👤 Author: Hasib\n\n${response.data.message}`);
      }

      return message.reply(`No prayer times available for ${city}. 👤 Author: Hasib`);
    } catch (error) {
      console.error(error);
      return message.reply("Error fetching prayer times. Please try again later.\n👤 Author: Hasib");
    }
  }
};
