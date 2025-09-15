const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

// VIP system paths
const vipPath = path.join(__dirname, "cache", "vip.json");

// --- Owners (fixed) ---
const OWNER_UIDS = ["61557991443492", "61578418080601"];

function getVipData() {
  if (!fs.existsSync(vipPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(vipPath, "utf8"));
  } catch {
    return [];
  }
}

module.exports = {
  config: {
    name: "pair2",
    author: "Hasib",
    category: "TOOLS",
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const senderID = event.senderID;

      // --- VIP / Owner check ---
      let allowed = false;

      if (OWNER_UIDS.includes(senderID)) {
        allowed = true; // Owner always allowed
      } else {
        const data = getVipData();
        const now = Date.now();
        const userVip = data.find(u => u.uid === senderID && u.expire > now);
        if (userVip) allowed = true;
      }

      if (!allowed) {
        const msg = await api.sendMessage("⛔ This feature is only for VIP users (or Owners).", event.threadID, event.messageID);
        // Auto-unsend after 10s
        setTimeout(() => api.unsendMessage(msg.messageID).catch(() => {}), 10000);
        return;
      }

      // --- Original Pairing Logic ---
      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;
      const mentions = event.mentions || {};
      const mentionIDs = Object.keys(mentions);
      const repliedUserID = event.type === "message_reply" ? event.messageReply.senderID : null;

      let user1ID = null;
      let user2ID = null;

      // Determine pairing
      if (mentionIDs.length >= 2) {
        const filtered = mentionIDs.filter(id => id !== senderID);
        if (filtered.length < 2)
          return api.sendMessage("⚠️ Please mention two different users (not yourself).", event.threadID, event.messageID);
        user1ID = filtered[0];
        user2ID = filtered[1];
      } else if (mentionIDs.length === 1 && mentionIDs[0] !== senderID) {
        user1ID = senderID;
        user2ID = mentionIDs[0];
      } else if (repliedUserID && repliedUserID !== senderID) {
        user1ID = senderID;
        user2ID = repliedUserID;
      }

      let selectedMatch, matchName, baseUserID;

      if (user1ID && user2ID) {
        // Pairing by mention or reply
        const user1 = users.find(u => u.id === user1ID);
        const user2 = users.find(u => u.id === user2ID);
        if (!user1 || !user2) return api.sendMessage("❌ Could not find one or both users in the group.", event.threadID, event.messageID);
        if (!user1.gender || !user2.gender) return api.sendMessage("⚠️ Couldn't determine gender for one or both users.", event.threadID, event.messageID);
        if (user1.gender === user2.gender) return api.sendMessage("⚠️ Same gender pairing is not allowed.", event.threadID, event.messageID);
        baseUserID = user1ID;
        selectedMatch = user2;
        matchName = user2.name;
      } else {
        // Random pairing
        const senderData = users.find(u => u.id === senderID);
        if (!senderData || !senderData.gender) return api.sendMessage("⚠️ Could not determine your gender.", event.threadID, event.messageID);
        const myGender = senderData.gender;

        let matchCandidates =
          myGender === "MALE"
            ? users.filter(u => u.gender === "FEMALE" && u.id !== senderID)
            : users.filter(u => u.gender === "MALE" && u.id !== senderID);

        if (!matchCandidates.length) return api.sendMessage("❌ No suitable match found in the group.", event.threadID, event.messageID);

        // Pick random partner (never self)
        do {
          selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
        } while (selectedMatch.id === senderID && matchCandidates.length > 1);

        matchName = selectedMatch.name;
        baseUserID = senderID;
      }

      const baseUserData = await usersData.get(baseUserID);
      const senderName = baseUserData?.name || "User";

      // Load images
      const defaultAvatar = "https://files.catbox.moe/4l3pgh.jpg"; // fallback avatar
      let sIdImage, pairPersonImage, background;
      try {
        background = await loadImage("https://i.imgur.com/Z56ISV5.png"); // fixed background
        const avatarUrl1 = await usersData.getAvatarUrl(baseUserID).catch(() => null);
        sIdImage = await loadImage(avatarUrl1 || defaultAvatar);
        const avatarUrl2 = await usersData.getAvatarUrl(selectedMatch.id).catch(() => null);
        pairPersonImage = await loadImage(avatarUrl2 || defaultAvatar);
      } catch (err) {
        console.error("Image loading error:", err);
        return api.sendMessage("❌ Failed to load images.", event.threadID, event.messageID);
      }

      // Draw canvas
      try {
        const width = 1200;
        const height = 600;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(background, 0, 0, width, height);

        // Caption
        const caption = " Two hearts, one destiny – a perfect match! ";
        ctx.font = "50px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(caption, width / 2, 70);

        // Avatars
        const leftCircle = { x: 200, y: 265, size: 230 };
        const rightCircle = { x: 495, y: 265, size: 230 };

        // Left avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(leftCircle.x, leftCircle.y, leftCircle.size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.shadowColor = "rgba(255,255,255,0.9)";
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.clip();
        ctx.drawImage(sIdImage, leftCircle.x - leftCircle.size / 2, leftCircle.y - leftCircle.size / 2, leftCircle.size, leftCircle.size);
        ctx.restore();

        // Right avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(rightCircle.x, rightCircle.y, rightCircle.size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.shadowColor = "rgba(255,255,255,0.9)";
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.clip();
        ctx.drawImage(pairPersonImage, rightCircle.x - rightCircle.size / 2, rightCircle.y - rightCircle.size / 2, rightCircle.size, rightCircle.size);
        ctx.restore();

        // Heart
        ctx.font = "120px Arial";
        ctx.fillStyle = "red";
        ctx.fillText("❤️", width / 2 - 60, height / 2 + 40);

        // Save canvas
        const outputPath = path.join(__dirname, "pairing_image.png");
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(outputPath, buffer);

        // Send image
        api.sendMessage(
          { body: `💘 ${senderName} & ${matchName}`, attachment: fs.createReadStream(outputPath) },
          event.threadID,
          event.messageID
        );
      } catch (err) {
        console.error("Canvas drawing error:", err);
        return api.sendMessage("❌ Failed to generate pairing image.", event.threadID, event.messageID);
      }
    } catch (err) {
      console.error("Error:", err);
      return api.sendMessage("❌ An error occurred while processing your request.", event.threadID, event.messageID);
    }
  },
};
