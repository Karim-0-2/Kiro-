const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const OWNER_UID = "61557991443492"; // Owner UID
const WIFE_UID = "61578418080601"; // Wife UID
const VIP_PATH = path.join(__dirname, "cache", "vip.json");

module.exports = {
  config: {
    name: "propose2",
    aliases: ["proposal"],
    version: "2.1",
    author: "Kivv × AceGun (Interactive upgrade by ChatGPT)",
    countDown: 5,
    role: 0,
    shortDescription: "Propose to someone with a cute image 💍❤️",
    longDescription: "Mention or reply to someone to propose. They can reply 'Yes' or 'No' for fun responses.",
    category: "vip",
    guide: "{pn} @mention | reply a message",
  },

  onStart: async function ({ message, event, api }) {
    // --- Load VIPs ---
    if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
    let vipData = JSON.parse(fs.readFileSync(VIP_PATH, "utf8"));
    const now = Date.now();
    vipData = vipData.filter(u => u.expire > now);
    fs.writeFileSync(VIP_PATH, JSON.stringify(vipData, null, 2));

    const sender = String(event.senderID);
    const isOwnerOrWife = sender === OWNER_UID || sender === WIFE_UID;
    const isVIP = vipData.some(u => u.uid === sender && u.expire > now);

    if (!isOwnerOrWife && !isVIP) {
      return message.reply("❌ You must be a VIP to use this command!");
    }

    // ✅ Visual feedback
    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    let one = event.senderID;
    let two = null;

    const mention = Object.keys(event.mentions);
    if (mention.length > 0) two = mention[0];
    else if (event.messageReply) two = event.messageReply.senderID;

    if (!two) {
      return message.reply("⚠️ Please @mention someone or reply to their message to propose 💌");
    }

    const imagePath = await makeProposeImage(one, two);

    const proposalMsg = `💘✨ A special proposal ✨💘\n\n💍 Someone is asking for your heart ❤️\n\n👉 Will you accept this love? (Reply with 'Yes' or 'No')`;

    message.reply(
      {
        body: proposalMsg,
        attachment: fs.createReadStream(imagePath),
      },
      async (err, info) => {
        fs.unlinkSync(imagePath);
        if (err) return;
        api.setMessageReaction('✅', event.messageID, () => {}, true);

        global.GoatBot.onReply.set(info.messageID, {
          commandName: "propose",
          author: one,
          target: two,
          type: "proposalReply",
        });
      }
    );
  },

  onReply: async function ({ event, message, Reply, api }) {
    if (Reply.type !== "proposalReply") return;

    const { author, target } = Reply;
    if (event.senderID !== target) return message.reply("⚠️ Only the person being proposed to can reply!");

    const answer = event.body.trim().toLowerCase();

    if (answer === "yes") {
      return message.reply(`💞❤️ Congratulations! ❤️💞\n\n💍 ${event.senderID} accepted the proposal of ${author}!\n\n🌹 Wishing you both endless love & happiness 😍✨`);
    }

    if (answer === "no") {
      return message.reply(`😂💔 Oops!\n\n${event.senderID} rejected poor ${author}'s proposal.\n\nBetter luck next time buddy! 😆🍵`);
    }

    return message.reply("⚠️ Please reply only with 'Yes' or 'No'.");
  },
};

async function makeProposeImage(id1, id2) {
  const pathFile = path.join(__dirname, `cache/propose_${id1}_${id2}.png`);

  const bgURL = "https://i.ibb.co/RNBjSJk/image.jpg";
  const avatar1URL = `https://graph.facebook.com/${id1}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
  const avatar2URL = `https://graph.facebook.com/${id2}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

  const [bgImg, av1, av2] = await Promise.all([
    loadImage(bgURL),
    loadImage(await getImageBuffer(avatar1URL)),
    loadImage(await getImageBuffer(avatar2URL)),
  ]);

  const canvas = createCanvas(760, 506);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  function drawCircleAvatar(ctx, img, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();
  }

  drawCircleAvatar(ctx, av1, 210, 65, 90);
  drawCircleAvatar(ctx, av2, 458, 105, 90);

  const buffer = canvas.toBuffer("image/png");
  await fs.outputFile(pathFile, buffer);

  return pathFile;
}

async function getImageBuffer(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
}
