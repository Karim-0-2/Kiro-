const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const OWNER_UID = "61557991443492"; // Owner UID
const WIFE_UID = "61578418080601";  // Wife UID
const VIP_PATH = path.join(__dirname, "cache", "vip.json"); // VIP data

module.exports = {
  config: {
    name: "marry2",
    aliases: ["m"],
    version: "2.2",
    author: "AceGun × ChatGPT",
    countDown: 5,
    role: 0,
    shortDescription: "Propose marriage 💍",
    longDescription: "Propose to someone by mention or by replying to their message. VIP only.",
    category: "vip",
    guide: "{pn} @mention | reply to a message",
  },

  onStart: async function ({ message, event }) {
    // --- Load VIPs ---
    if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
    let vipData = JSON.parse(fs.readFileSync(VIP_PATH));
    const now = Date.now();
    vipData = vipData.filter(u => u.expire > now);
    fs.writeFileSync(VIP_PATH, JSON.stringify(vipData, null, 2));

    const sender = String(event.senderID);
    const isOwner = sender === OWNER_UID;
    const isWife = sender === WIFE_UID;
    const isVIP = vipData.some(u => u.uid === sender && u.expire > now);

    if (!isOwner && !isWife && !isVIP) {
      return message.reply("❌ You must be VIP to use this command!");
    }

    // --- Determine target ---
    const mention = Object.keys(event.mentions);
    let target;
    if (mention.length === 1) target = mention[0];
    else if (event.messageReply) target = event.messageReply.senderID;
    if (!target) return message.reply("💡 Please @mention someone or reply to their message to propose.");

    // --- Reaction: Processing ---
    await message.react("⏳");

    // --- Generate image ---
    const imagePath = await generateMarriageImage(sender, target);

    // --- Send message ---
    message.reply(
      {
        body: "「 Love you Babe🥰❤️ 」",
        attachment: fs.createReadStream(imagePath),
      },
      () => {
        fs.unlinkSync(imagePath);
        message.react("✅"); // Done reaction
      }
    );
  },
};

// ================= IMAGE GENERATOR =================
async function createCircleImage(image, size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, 0, 0, size, size);
  return canvas;
}

async function generateMarriageImage(one, two) {
  const dirCache = path.resolve(__dirname, "cache");
  if (!fs.existsSync(dirCache)) fs.mkdirSync(dirCache, { recursive: true });
  const outputPath = path.resolve(dirCache, `marry2_${one}_${two}.png`);

  const bgUrl = "https://i.ibb.co/5TwSHpP/Guardian-Place-full-1484178.jpg";
  const background = await loadImage(bgUrl);

  const urlOne = `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const urlTwo = `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  const [avatarOne, avatarTwo] = await Promise.all([loadImage(urlOne), loadImage(urlTwo)]);

  const circleOne = await createCircleImage(avatarOne, 75);
  const circleTwo = await createCircleImage(avatarTwo, 80);

  const canvas = createCanvas(background.width, background.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(background, 0, 0, background.width, background.height);

  ctx.drawImage(circleOne, 262, 0, 75, 75);
  ctx.drawImage(circleTwo, 350, 69, 80, 80);

  const buffer = canvas.toBuffer("image/png");
  await fs.writeFile(outputPath, buffer);

  return outputPath;
}
