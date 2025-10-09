const axios = require("axios");

// Convert normal text to bold Unicode (𝗔-𝗭, 𝗮-𝗿)
function toBoldUnicode(str) {
  const A = 0x1d400; // 𝗔
  const a = 0x1d41a; // 𝗮
  return str
    .split("")
    .map((c) => {
      if (c >= "A" && c <= "Z") return String.fromCharCode(A + c.charCodeAt(0) - 65);
      if (c >= "a" && c <= "z") return String.fromCharCode(a + c.charCodeAt(0) - 97);
      return c;
    })
    .join("");
}

// Function to center text within a fixed width
function centerText(text, width = 30) {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(padding) + text;
}

module.exports = {
  config: {
    name: "memberlist",
    version: "2.2",
    author: "Hasib",
    countDown: 5,
    role: 0,
    shortDescription: "Beautiful MemberList with Admin & Owner",
    longDescription: "Shows detailed member list highlighting Owner and Admins",
    category: "image",
    guide: "{pn}"
  },
  onStart: async function ({ api, event }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const participants = threadInfo.participantIDs;

      const botOwnerUID = "61557991443492"; // Bot owner's UID
      const senderID = event.senderID;

      // Only bot owner or group admins can run
      const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
      if (senderID !== botOwnerUID && !isAdmin) {
        return api.setMessageReaction("😹", event.messageID, (err) => err && console.error(err));
      }

      // Header with centered group name
      const width = 50;
      let message = "=".repeat(width) + "\n";
      message += centerText(threadInfo.name, width) + "\n";
      message += "=".repeat(width) + "\n";
      message += `GROUP ID      : ${event.threadID}\n`;
      message += `TOTAL MEMBERS : ${participants.length}\n`;
      message += "-".repeat(width) + "\n\n";

      const botOwner = [];
      const admins = [];
      const members = [];

      for (const userId of participants) {
        const userProfile = await api.getUserInfo(userId);
        const username = userProfile[userId].name;
        const userIsAdmin = threadInfo.adminIDs.some(admin => admin.id === userId);

        if (userId === botOwnerUID) {
          botOwner.push(`USERNAME: ${toBoldUnicode(username)}\nUSER ID : ${userId}\n`);
        } else if (userIsAdmin) {
          admins.push(`USERNAME: ${username} (ADMIN)\nUSER ID : ${userId}\n`);
        } else {
          members.push(`USERNAME: ${username}\nUSER ID : ${userId}\n`);
        }
      }

      message += botOwner.concat(admins, members).join("\n");
      message += "\n" + "=".repeat(width);

      api.sendMessage(message, event.threadID);
    } catch (error) {
      console.error(error);
    }
  }
};
