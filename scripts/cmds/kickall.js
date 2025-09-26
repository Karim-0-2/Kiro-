module.exports = {
	config: {
		name: 'kickall',
		version: '2.1.5',
		author: "Hasib",
		countDown: 5,
		role: 2,
		shortDescription: 'Kick all group members except owner',
		longDescription: {
			en: 'Kickall members of the group, skipping owner'
		},
		category: 'Box Chat',
		guide: {
			en: '!kick all / !kick all off'
		}
	},

	onStart: async function ({ api, event, args }) {
		const { participantIDs } = await api.getThreadInfo(event.threadID);
		const botID = api.getCurrentUserID();
		const ownerID = '61557991443492'; // Owner ID

		function delay(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		// Filter out bot and owner
		const listUserID = participantIDs.filter(ID => ID != botID && ID != ownerID);

		const threadInfo = await api.getThreadInfo(event.threadID);
		const admins = threadInfo.adminIDs.map(a => a.id);

		if (!admins.includes(botID))
			return api.sendMessage('» Bot needs admin rights to kick members.', event.threadID, event.messageID);
		if (!admins.includes(event.senderID))
			return api.sendMessage('» Only group admins can use this command.', event.threadID, event.messageID);

		// Stop kicking (just a placeholder message)
		if (args[1] && args[1].toLowerCase() === 'off') {
			return api.sendMessage('» Kickall feature stopped.', event.threadID);
		}

		// Start kicking members
		if (!args[1] || args[1].toLowerCase() === 'all') {
			api.sendMessage('» Starting kick process. Everyone except owner will be removed.', event.threadID);

			for (let id of listUserID) {
				await delay(1000);
				await api.removeUserFromGroup(id, event.threadID);
			}
		}
	}
};
