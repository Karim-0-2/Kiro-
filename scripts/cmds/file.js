const fs = require("fs");

module.exports = {
	config: {
		name: "file",
		aliases: ["files"],
		version: "1.0",
		author: "Hasib Hassain",
		countDown: 5,
		role: 2, // Owner only
		shortDescription: "Send bot file",
		longDescription: "Send any bot file from /cmds directory (Owner only)",
		category: "𝗢𝗪𝗡𝗘𝗥",
		guide: "{pn} filename (without .js)"
	},

	onStart: async function ({ message, args, api, event }) {
		// 🔐 Only your UID is allowed
		const ownerUID = "61557991443492";

		if (event.senderID !== ownerUID) {
			// If not you, bot reacts with 😼 only — no message
			return api.setMessageReaction("😼", event.messageID, () => {}, true);
		}

		// ✅ Check if filename is provided
		const fileName = args[0];
		if (!fileName) {
			return api.sendMessage("⚠️ Please provide a file name.", event.threadID, event.messageID);
		}

		// 📁 File path
		const filePath = `${__dirname}/${fileName}.js`;

		// ❌ Check if file exists
		if (!fs.existsSync(filePath)) {
			return api.sendMessage(`❌ File not found: ${fileName}.js`, event.threadID, event.messageID);
		}

		// 📤 Send file as attachment
		api.sendMessage({
			body: `📂 Sending file: ${fileName}.js`,
			attachment: fs.createReadStream(filePath)
		}, event.threadID, event.messageID);
	}
};
