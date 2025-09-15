const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const vipPath = path.join(__dirname, "cache", "vip.json");
const OWNER_UIDS = ["61557991443492", "61578418080601"]; // Fixed owners

function isVip(userID) {
  if (OWNER_UIDS.includes(userID)) return true;
  if (!fs.existsSync(vipPath)) return false;
  const data = JSON.parse(fs.readFileSync(vipPath, "utf8"));
  const now = Date.now();
  return data.some(u => u.uid === userID && u.expire > now);
}

module.exports = {
  config: {
    name: "pair5",
    author: "Hasib",
    category: "love",
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const senderID = event.senderID;

      // VIP check
      if (!isVip(senderID)) {
        const msg = await api.sendMessage("⛔ This command is VIP-only!", event.threadID, event.messageID);
        setTimeout(() => api.unsendMessage(msg.messageID).catch(() => {}), 10000);
        return;
      }

      const senderData = await usersData.get(senderID);
      const senderName = senderData?.name || "Unknown User";

      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      const myData = users.find((user) => user.id === senderID);
      if (!myData || !myData.gender) {
        return api.sendMessage("⚠️ Could not determine your gender.", event.threadID, event.messageID);
      }

      const myGender = myData.gender;
      let matchCandidates = [];

      if (myGender === "MALE") {
        matchCandidates = users.filter((user) => user.gender === "FEMALE" && user.id !== senderID);
      } else if (myGender === "FEMALE") {
        matchCandidates = users.filter((user) => user.gender === "MALE" && user.id !== senderID);
      } else {
        return api.sendMessage("⚠️ Your gender is undefined. Cannot find a match.", event.threadID, event.messageID);
      }

      if (matchCandidates.length === 0) {
        return api.sendMessage("❌ No suitable match found in the group.", event.threadID, event.messageID);
      }

      const selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
      const matchName = selectedMatch.name;

      const width = 800, height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const background = await loadImage("https://i.imgur.com/753i3RF.jpeg");

      const sIdImage = await loadImage(`https://graph.facebook.com/${senderID}/picture?width=720&height=720`);
      const pairPersonImage = await loadImage(`https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720`);

      ctx.drawImage(background, 0, 0, width, height);
      ctx.drawImage(sIdImage, 385, 40, 170, 170);
      ctx.drawImage(pairPersonImage, width - 213, 190, 180, 170);

      const outputPath = path.join(__dirname, "pair8_output.png");
      const out = fs.createWriteStream(outputPath);
      canvas.createPNGStream().pipe(out);

      out.on("finish", () => {
        const lovePercent = Math.floor(Math.random() * 31) + 70;
        const message = `💘 Pair8 Result 💘
・${senderName} 🎀
・${matchName} 🎀
💙 Love percentage: ${lovePercent}%`;

        api.sendMessage({ body: message, attachment: fs.createReadStream(outputPath) }, event.threadID, () => fs.unlinkSync(outputPath), event.messageID);
      });
    } catch (error) {
      api.sendMessage("❌ Error: " + error.message, event.threadID, event.messageID);
    }
  },
};
