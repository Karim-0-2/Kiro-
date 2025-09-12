const fs = require("fs-extra");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

const OWNER_UID = "61557991443492"; // Owner UID
const WIFE_UID = "61578418080601";  // Wife UID
const VIP_PATH = path.join(__dirname, "cache", "vip.json"); // VIP data

module.exports = {
  config: {
    name: "marry",
    aliases: ["bibaho", "biye"],
    version: "2.1",
    author: "Hasib",
    countDown: 5,
    role: 0,
    shortDescription: "বিয়ে করো কারো সাথে 💍",
    longDescription: "Mention someone or reply to their message to propose marriage 💌. VIP only.",
    category: "vip",
    guide: "{pn} @mention | reply to a message",
  },

  onStart: async function ({ message, event, api }) {
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
    if (!target) return message.reply("👰 কার সাথে বিয়ে করবে তা mention করো বা reply করো!");

    // --- Processing indicator ---
    await message.react("⏳");

    const senderInfo = await api.getUserInfo(sender);
    const receiverInfo = await api.getUserInfo(target);

    const senderName = senderInfo[sender]?.name || "Someone";
    const receiverName = receiverInfo[target]?.name || "Someone";

    const imgPath = await makeMarryImage(sender, target);

    // --- Send proposal ---
    message.reply(
      {
        body: `💍 ${senderName} proposes to ${receiverName}! 👰‍♀️🤵\n\n👉 Reply with **Yes** or **No** 💌`,
        attachment: fs.createReadStream(imgPath),
      },
      (err, info) => {
        fs.unlinkSync(imgPath);
        if (err) return;

        message.react("✅"); // Done reaction

        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          proposer: sender,
          target,
          type: "marryProposal",
        });
      }
    );
  },

  onReply: async function ({ event, message, Reply }) {
    if (Reply.type !== "marryProposal") return;
    const { proposer, target } = Reply;

    if (event.senderID !== target) {
      return message.reply("⚠️ Only the proposed person can reply!");
    }

    const answer = event.body.trim().toLowerCase();

    if (answer === "yes") {
      return message.reply(
        `💞❤️ Congratulations! ❤️💞\n\n<@${target}> accepted <@${proposer}>'s proposal!\n\n🎉 Wishing you endless love 💖`,
        { mentions: [{ id: proposer }, { id: target }] }
      );
    }

    if (answer === "no") {
      return message.reply(
        `😂💔 Oh no!\n\n<@${target}> rejected <@${proposer}>'s proposal.\n\n👉 Better luck next time! 😆`,
        { mentions: [{ id: proposer }, { id: target }] }
      );
    }

    return message.reply("💡 Please reply only with **Yes** or **No**.");
  },
};

// =============== IMAGE GENERATOR =================
async function makeMarryImage(uid1, uid2) {
  const path = __dirname + `/cache/marry_result_${uid1}_${uid2}.png`;

  const bgURL = "https://i.postimg.cc/XN1TcH3L/tumblr-mm9nfpt7w-H1s490t5o1-1280.jpg";
  const avatar1URL = `https://graph.facebook.com/${uid1}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
  const avatar2URL = `https://graph.facebook.com/${uid2}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

  const [bgImg, av1Img, av2Img] = await Promise.all([
    loadImage(bgURL),
    loadImage(avatar1URL),
    loadImage(avatar2URL)
  ]);

  const canvas = createCanvas(1024, 684);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(bgImg, 0, 0, 1024, 684);

  function drawCircleImage(img, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();
  }

  drawCircleImage(av1Img, 204, 160, 85);
  drawCircleImage(av2Img, 315, 105, 80);

  const buffer = canvas.toBuffer();
  fs.writeFileSync(path, buffer);
  return path;
}
