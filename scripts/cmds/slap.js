const DIG = require("discord-image-generation");
const fs = require("fs-extra");

const OWNER_ID = "61557991443492"; // <-- your owner ID

module.exports = {
	config: {
		name: "slap",
		version: "1.2",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		shortDescription: "Batslap image",
		longDescription: "Batslap image",
		category: "image",
		guide: {
			en: "   {pn} @tag or reply to a message"
		}
	},

	langs: {
		vi: {
			noTarget: "Bạn phải tag người bạn muốn tát hoặc reply vào tin nhắn của họ",
			cantSlapOwner: "Bạn không thể tát chủ bot 😎"
		},
		en: {
			noTarget: "You must tag the person you want to slap or reply to their message",
			cantSlapOwner: "You cannot slap the bot owner 😎"
		}
	},

	onStart: async function ({ event, message, usersData, args, getLang }) {
		const uid1 = event.senderID;
		let uid2 = Object.keys(event.mentions)[0];

		// If no mention, check if this is a reply
		if (!uid2 && event.messageReply) {
			uid2 = event.messageReply.senderID;
		}

		if (!uid2) return message.reply(getLang("noTarget"));

		// Prevent using the command on the owner
		if (uid2 === OWNER_ID) return message.reply(getLang("cantSlapOwner"));

		const avatarURL1 = await usersData.getAvatarUrl(uid1);
		const avatarURL2 = await usersData.getAvatarUrl(uid2);

		const img = await new DIG.Batslap().getImage(avatarURL1, avatarURL2);
		const pathSave = `${__dirname}/tmp/${uid1}_${uid2}Batslap.png`;
		fs.writeFileSync(pathSave, Buffer.from(img));

		const content = args.join(' ').replace(Object.keys(event.mentions)[0] || "", "");
		message.reply({
			body: `${(content || "Bópppp 😵‍💫😵")}`,
			attachment: fs.createReadStream(pathSave)
		}, () => fs.unlinkSync(pathSave));
	}
};
