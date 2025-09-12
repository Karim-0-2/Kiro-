module.exports = {
  config: {
    name: "set",
    version: "2.2",
    author: "xnil6x | Updated by ChatGPT",
    shortDescription: "Owner data management",
    longDescription: "Set user money, exp, or custom variables (owner only)",
    category: "Owner",
    guide: {
      en: "{p}set money [amount] [@user OR reply]\n{p}set exp [amount] [@user OR reply]\n{p}set custom [variable] [value] [@user OR reply]"
    },
    role: 2
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      const OWNER_UID = "61557991443492"; // Only owner

      if (event.senderID.toString() !== OWNER_UID) {
        return api.sendMessage("⛔ Access Denied: Only the owner can use this command", event.threadID);
      }

      const action = args[0]?.toLowerCase();
      if (!action) return api.sendMessage("❌ Please specify an action: money, exp, custom", event.threadID);

      // Determine target: reply first, then mention, fallback to sender
      let targetID;
      if (event.messageReply && event.messageReply.senderID) {
        targetID = event.messageReply.senderID;
      } else {
        targetID = Object.keys(event.mentions)[0] || event.senderID;
      }

      const userData = await usersData.get(targetID);
      if (!userData) return api.sendMessage("❌ User not found in database", event.threadID);

      switch (action) {
        case 'money': {
          const amount = parseFloat(args[1]);
          if (isNaN(amount)) return api.sendMessage("❌ Invalid amount", event.threadID);
          await usersData.set(targetID, { ...userData, money: amount });
          return api.sendMessage(`💰 Set money to ${amount} for ${userData.name}`, event.threadID);
        }

        case 'exp': {
          const amount = parseFloat(args[1]);
          if (isNaN(amount)) return api.sendMessage("❌ Invalid amount", event.threadID);
          await usersData.set(targetID, { ...userData, exp: amount });
          return api.sendMessage(`🌟 Set exp to ${amount} for ${userData.name}`, event.threadID);
        }

        case 'custom': {
          const variable = args[1];
          const value = args[2];
          if (!variable || value === undefined) {
            return api.sendMessage("❌ Usage: {p}set custom [variable] [value] [@user OR reply]", event.threadID);
          }
          await usersData.set(targetID, { ...userData, [variable]: value });
          return api.sendMessage(`🔧 Set ${variable} to ${value} for ${userData.name}`, event.threadID);
        }

        default:
          return api.sendMessage("❌ Invalid action. Available options: money, exp, custom", event.threadID);
      }

    } catch (error) {
      console.error("Owner Set Error:", error);
      return api.sendMessage("⚠️ Command failed: " + error.message, event.threadID);
    }
  }
};
