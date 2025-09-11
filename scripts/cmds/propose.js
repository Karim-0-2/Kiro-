const axios = require("axios");
const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "propose",
    aliases: ["marryme", "love", "wedding", "forever"],
    version: "5.0",
    author: "Alfred Marshall + Enhanced by Hasib",
    countDown: 5,
    role: 0,
    shortDescription: "Confess your eternal love 💖",
    longDescription: "A magical proposal that works by tag or reply ✨",
    category: "love",
    guide: {
      vi: "{pn} @tag hoặc reply",
      en: "{pn} @tag or reply"
    }
  },

  onStart: async function ({ message, args, event, api }) {
    let proposer = event.senderID;
    let crush;

    // Case 1: If tagged
    const mention = Object.keys(event.mentions);
    if (mention.length > 0) {
      crush = mention[0];
    }

    // Case 2: If reply
    else if (event.type === "message_reply") {
      crush = event.messageReply.senderID;
    }

    // Case 3: Nothing
    if (!crush) {
      return message.reply("💌 Please tag or reply to the one you want to propose to.");
    }

    // Romantic proposal texts (random selection)
    const proposals = [
`🌹✨ My Dearest ${event.mentions[crush]?.replace("@", "") || "Love"},  
Every heartbeat of mine whispers your name 💖  
Today, I kneel before you… 💍  
Will you be mine forever? ✨`,

`💘 To my beloved ${event.mentions[crush]?.replace("@", "") || "Darling"},  
You are my sun, my moon, and all my stars 🌙⭐  
Life feels incomplete without you 🌹  
Will you say *YES* and complete my world? 💍`,

`✨ Darling ${event.mentions[crush]?.replace("@", "") || "Sweetheart"},  
Since the day I found you, my heart has never been the same 💕  
I want to walk this journey of life holding your hand 🌸  
Will you marry me? 💍`,

`🌹 ${event.mentions[crush]?.replace("@", "") || "Beloved"},  
In your smile I see paradise, in your eyes I see forever ✨  
My soul belongs with yours 💖  
Will you accept my love and be mine for eternity? 💍`
    ];

    const chosenMessage = proposals[Math.floor(Math.random() * proposals.length)];

    // Create the romantic proposal image
    createProposalImage(proposer, crush).then(path => {
      message.reply({
        body: chosenMessage,
        attachment: fs.createReadStream(path)
      });
    }).catch(err => {
      console.error(err);
      message.reply("❌ Oh no! Something went wrong while creating your magical proposal image.");
    });
  }
};

async function createProposalImage(one, two) {
  const avOne = await jimp.read(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
  avOne.circle();

  const avTwo = await jimp.read(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
  avTwo.circle();

  const pth = "proposal.png";
  const bg = await jimp.read("https://i.imgur.com/pP8nQkY.jpeg"); // Romantic dreamy background
  bg.resize(1077, 718)
    .composite(avOne.resize(150, 150), 230, 210) // proposer
    .composite(avTwo.resize(150, 150), 640, 370); // crush

  await bg.writeAsync(pth);
  return pth;
}
