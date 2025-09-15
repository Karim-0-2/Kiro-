const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const vipPath = path.join(__dirname, "cache", "vip.json");
const OWNER_UIDS = ["61557991443492", "61578418080601"];

// --- Helper: VIP check ---
function isVip(userID) {
  if (OWNER_UIDS.includes(userID)) return true;
  if (!fs.existsSync(vipPath)) return false;
  const data = JSON.parse(fs.readFileSync(vipPath, "utf8"));
  const now = Date.now();
  return data.some(u => u.uid === userID && u.expire > now);
}

module.exports = {
  config: {
    name: "pair15",
    version: "5.1",
    author: "YourName + ChatGPT",
    role: 0,
    countDown: 2,
    shortDescription: "Pair 2 users together (VIP Only)",
    category: "love",
    guide: "{pn} [@mention (optional)]"
  },

  onStart: async function ({ api, event, usersData }) {
    const senderID = event.senderID;

    // --- VIP check ---
    if (!isVip(senderID)) {
      const msg = await api.sendMessage("⛔ This command is only for VIP users (or Owners).", event.threadID, event.messageID);
      setTimeout(() => api.unsendMessage(msg.messageID).catch(() => {}), 10000);
      return;
    }

    const W = 760, H = 400;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    let userID1 = senderID;
    let userID2 = Object.keys(event.mentions || {})[0];
    const repliedUserID = event.type === "message_reply" ? event.messageReply.senderID : null;

    if (!userID2 && repliedUserID && repliedUserID !== senderID) userID2 = repliedUserID;

    // Auto pick a partner if still none
    if (!userID2) {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const allUsers = threadInfo.userInfo;
      const botID = api.getCurrentUserID();

      const gender1 = allUsers.find(u => u.id === userID1)?.gender || "UNKNOWN";
      let candidates = allUsers.filter(u => u.id !== userID1 && u.id !== botID);

      if (gender1 === "MALE") candidates = candidates.filter(u => u.gender === "FEMALE");
      else if (gender1 === "FEMALE") candidates = candidates.filter(u => u.gender === "MALE");

      if (!candidates.length)
        return api.sendMessage("❌ No valid match found in this group.", event.threadID, event.messageID);

      userID2 = candidates[Math.floor(Math.random() * candidates.length)]?.id;
    }

    if (!userID2 || userID1 === userID2)
      return api.sendMessage("❌ Invalid pairing. Try mentioning someone else.", event.threadID, event.messageID);

    // Get names
    let name1 = "User 1", name2 = "User 2";
    try { name1 = await usersData.getName(userID1); } catch {}
    try { name2 = await usersData.getName(userID2); } catch {}

    const lovePercent = Math.floor(Math.random() * 31) + 70;

    // Load avatars
    let avatar1, avatar2;
    try {
      const [url1, url2] = await Promise.all([
        usersData.getAvatarUrl(userID1),
        usersData.getAvatarUrl(userID2)
      ]);
      [avatar1, avatar2] = await Promise.all([loadImage(url1), loadImage(url2)]);
    } catch (err) {
      console.error("Avatar error:", err);
      return api.sendMessage("❌ Could not load avatars.", event.threadID, event.messageID);
    }

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#1f0036");
    gradient.addColorStop(0.5, "#360060");
    gradient.addColorStop(1, "#1b002e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Sparkles
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(255,255,255,${Math.random()})`;
      ctx.fill();
    }

    // Avatar glow
    const drawGlowingAvatar = (img, x, y, size, glowColor) => {
      const r = size / 2;
      const cx = x + r, cy = y + r;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 30;
      ctx.fillStyle = glowColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, size, size);
      ctx.restore();
    };

    drawGlowingAvatar(avatar1, 90, 80, 160, "#ff66cc");
    drawGlowingAvatar(avatar2, 510, 80, 160, "#66ffff");

    // Heart
    ctx.font = "bold 93px Arial";
    ctx.fillStyle = "#ff4da6";
    ctx.shadowColor = "#ff99cc";
    ctx.shadowBlur = 25;
    ctx.textAlign = "center";
    ctx.fillText("💝", W / 2, 220);

    // Names
    ctx.font = "bold 26px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffccff";
    ctx.shadowBlur = 12;
    ctx.fillText(name1, 170, 270);
    ctx.fillText(name2, 590, 270);

    // Love percentage
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#00ffff";
    ctx.shadowColor = "#00ccff";
    ctx.shadowBlur = 20;
    ctx.fillText(`💘 Love: ${lovePercent}% 💘`, W / 2, 330);

    // Save
    const outputPath = path.join(__dirname, "cache", `pair_${userID1}_${userID2}.png`);
    await fs.ensureDir(path.dirname(outputPath));
    await fs.promises.writeFile(outputPath, canvas.toBuffer("image/png"));

    // Send message
    try {
      await api.sendMessage({
        body: `💘 [ Pair Result ] 💖\n» ${name1} ✨\n» ${name2} ✨\n💌 Love Percentage: ${lovePercent}%`,
        mentions: [{ tag: name2, id: userID2 }],
        attachment: fs.createReadStream(outputPath)
      }, event.threadID, () => fs.unlink(outputPath, () => {}), event.messageID);
    } catch (err) {
      console.error("Send error:", err);
      api.sendMessage("❌ Failed to send result.", event.threadID, event.messageID);
    }
  }
};
