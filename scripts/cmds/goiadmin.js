module.exports = {
  config: {
    name: "goiadmin",
    author: "Hasib ",
    role: 0,
    shortDescription: " ",
    longDescription: "",
    category: "BOT",
    guide: "{pn}"
  },

  onChat: function({ api, event }) {
    const ownerID = "61557991443492";
    const wifeUID = "61578418080601";

    if (event.senderID !== ownerID) {
      const mentions = Object.keys(event.mentions);

      if (mentions.includes(ownerID)) {

        // Waiting messages for the wife of my lord Karim
        if (event.senderID === wifeUID) {
          const waitingMsgs = [
            "Your Excellency, the wife of my lord Karim, please wait a moment while my lord is busy ⏳",
            "My queen, the wife of my lord Karim, kindly wait, my lord will attend to you shortly ⌛",
            "My lady, the wife of my lord Karim, your lord is momentarily occupied, please be patient ⏱️",
            "Your Excellency, the wife of my lord Karim, hold on a little, my lord will respond soon 🌸",
            "My queen, the wife of my lord Karim, your lord is preparing to give you his full attention, please wait 💖",
            "My lady, the wife of my lord Karim, my lord is busy at the moment, your patience is appreciated ✨",
            "Your Excellency, the wife of my lord Karim, please wait a while, my lord will be with you shortly 🌹",
            "My queen, the wife of my lord Karim, a little patience, your lord will soon honor you 💫",
            "My lady, the wife of my lord Karim, wait for a short while, my lord is thinking of you even now 💕"
          ];

          return api.sendMessage({
            body: waitingMsgs[Math.floor(Math.random() * waitingMsgs.length)]
          }, event.threadID, event.messageID);
        }

        // Regular users replies
        const msg = [
          "If you mention my Owner again, I will punch you! 😾👊🏻",
          "Gf na dile maintion daw ken huh",
          "Amar owner re ki gf diba je maintion diteso",
          "Amar owner akhon busy ase maintion dio na 😒",
          "Don't dare mention my Owner again, or you'll regret it! 💀",
          "One more mention and you'll face serious consequences! 😠",
          "Keep mentioning my Owner and you'll be blocked permanently! 🔒",
          "Touch my Owner with words and you'll feel my wrath! ⚡",
          "Last warning! Stop tagging my Owner or face the fury! 🔥"
        ];

        return api.sendMessage({
          body: msg[Math.floor(Math.random() * msg.length)]
        }, event.threadID, event.messageID);
      }
    }
  },

  onStart: async function({}) {}
};
