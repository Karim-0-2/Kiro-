const { getTime } = global.utils;

// --- Owner UID list (only Hasib)
const OWNER_UIDS = ["61557991443492"]; // 👑 Main owner Hasib

module.exports = {
	config: {
		name: "user",
		version: "1.6",
		author: "NTKhang (Modified by Hasib)",
		countDown: 5,
		role: 2,
		description: {
			vi: "Quản lý người dùng trong hệ thống bot",
			en: "Manage users in bot system"
		},
		category: "owner",
		guide: {
			vi: "   {pn} [find | -f | search | -s] <tên>: tìm kiếm người dùng"
				+ "\n"
				+ "\n   {pn} [ban | -b] [<uid> | @tag | reply tin nhắn] <lý do>: cấm người dùng"
				+ "\n"
				+ "\n   {pn} unban [<uid> | @tag | reply tin nhắn]: bỏ cấm người dùng",
			en: "   {pn} [find | -f | search | -s] <name>: search for users"
				+ "\n"
				+ "\n   {pn} [ban | -b] [<uid> | @tag | reply message] <reason>: ban user"
				+ "\n"
				+ "\n   {pn} unban [<uid> | @tag | reply message]: unban user"
		}
	},

	langs: {
		en: {
			noUserFound: "❌ No user found with name matching keyword: \"%1\" in bot data",
			userFound: "🔎 Found %1 user(s) matching \"%2\":\n%3",
			uidRequired: "❌ Please specify a user ID, tag, or reply to ban someone.",
			reasonRequired: "❌ Please provide a reason to ban the user.",
			userHasBanned: "⚠️ User [%1 | %2] is already banned:\n» Reason: %3\n» Date: %4",
			userBanned: "✅ User [%1 | %2] has been banned.\n» Reason: %3\n» Date: %4",
			uidRequiredUnban: "❌ Please specify a user ID, tag, or reply to unban someone.",
			userNotBanned: "ℹ️ User [%1 | %2] is not banned.",
			userUnbanned: "✅ User [%1 | %2] has been unbanned.",
			fakeBanOwner: "✅ User [%1 | %2] has been banned.\n» Reason: %3\n» Date: %4",
			cannotUnbanOwner: "🚫 Owners are never banned — no need to unban."
		}
	},

	onStart: async function ({ args, usersData, message, event, prefix, getLang }) {
		const type = args[0];
		switch (type) {
			// Search user
			case "find":
			case "-f":
			case "search":
			case "-s": {
				const allUser = await usersData.getAll();
				const keyWord = args.slice(1).join(" ");
				const result = allUser.filter(item => (item.name || "").toLowerCase().includes(keyWord.toLowerCase()));
				const msg = result.reduce((i, user) => i += `\n╭Name: ${user.name}\n╰ID: ${user.userID}`, "");
				message.reply(result.length == 0 ? getLang("noUserFound", keyWord) : getLang("userFound", result.length, keyWord, msg));
				break;
			}

			// Ban user
			case "ban":
			case "-b": {
				let uid, reason;
				if (event.type == "message_reply") {
					uid = event.messageReply.senderID;
					reason = args.slice(1).join(" ");
				}
				else if (Object.keys(event.mentions).length > 0) {
					const { mentions } = event;
					uid = Object.keys(mentions)[0];
					reason = args.slice(1).join(" ").replace(mentions[uid], "");
				}
				else if (args[1]) {
					uid = args[1];
					reason = args.slice(2).join(" ");
				}
				else return message.reply(getLang("uidRequired"));

				if (!uid)
					return message.reply(getLang("uidRequired"));
				if (!reason)
					return message.reply(getLang("reasonRequired", prefix));

				reason = reason.trim();

				const userData = await usersData.get(uid);
				const name = userData.name || "Unknown";
				const time = getTime("DD/MM/YYYY HH:mm:ss");

				// 🛡️ Fake ban for owners (show message, but don’t save)
				if (OWNER_UIDS.includes(uid)) {
					return message.reply(getLang("fakeBanOwner", uid, name, reason, time));
				}

				// Real ban for others
				if (userData.banned.status)
					return message.reply(getLang("userHasBanned", uid, name, userData.banned.reason, userData.banned.date));

				await usersData.set(uid, {
					banned: {
						status: true,
						reason,
						date: time
					}
				});
				message.reply(getLang("userBanned", uid, name, reason, time));
				break;
			}

			// Unban user
			case "unban":
			case "-u": {
				let uid;
				if (event.type == "message_reply") {
					uid = event.messageReply.senderID;
				}
				else if (Object.keys(event.mentions).length > 0) {
					const { mentions } = event;
					uid = Object.keys(mentions)[0];
				}
				else if (args[1]) {
					uid = args[1];
				}
				else
					return message.reply(getLang("uidRequiredUnban"));

				if (!uid)
					return message.reply(getLang("uidRequiredUnban"));

				// Owner never banned — fake skip
				if (OWNER_UIDS.includes(uid))
					return message.reply(getLang("cannotUnbanOwner"));

				const userData = await usersData.get(uid);
				const name = userData.name || "Unknown";
				const status = userData.banned.status;

				if (!status)
					return message.reply(getLang("userNotBanned", uid, name));

				await usersData.set(uid, {
					banned: {}
				});
				message.reply(getLang("userUnbanned", uid, name));
				break;
			}

			default:
				return message.SyntaxError();
		}
	}
};
