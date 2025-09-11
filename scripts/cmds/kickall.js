module.exports = {
	config: {
		name: 'kickall',
		version: '2.1.0',
		author: "Cliff", // do not change credits
		countDown: 5,
		role: 2, // still keep role for reference
		shortDescription: 'Remove all group members',
		longDescription: {
			en: 'kickall members of the group'
		},
		category: 'Box Chat',
		guide: {
			en: '{p}kickall on/off'
		}
	},

	kickOffMembers: {}, // Store members when off

	onStart: async function ({ api, event, getText, args }) {
		const { participantIDs } = await api.getThreadInfo(event.threadID);

		function delay(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		const botID = api.getCurrentUserID();
		const listUserID = participantIDs.filter(ID => ID != botID);

		// Replace this with your actual owner ID
		const OWNER_ID = "61557991443492"; 

		if (event.senderID !== OWNER_ID) {
			return api.sendMessage('❌ Only the bot owner can use this command.', event.threadID);
		}

		if (args[0] === 'off') {
			this.kickOffMembers[event.threadID] = listUserID;
			return api.sendMessage('✅ Kickall feature turned off. Members stored.', event.threadID);
		}

		if (args[0] === 'on') {
			const kickOffMembers = this.kickOffMembers[event.threadID] || [];
			for (let memberID of kickOffMembers) {
				await api.addUserToGroup(memberID, event.threadID);
			}
			this.kickOffMembers[event.threadID] = [];
			return api.sendMessage('✅ Kickall feature turned on. Members added back to the group.', event.threadID);
		}

		api.getThreadInfo(event.threadID, async (err, info) => {
			if (err) return api.sendMessage("❌ An error occurred.", event.threadID);

			// Start kicking members
			setTimeout(() => { api.removeUserFromGroup(botID, event.threadID) }, 300000);
			api.sendMessage('⚠️ Start removing all members. Bye everyone.', event.threadID);

			for (let id of listUserID) {
				await delay(1000);
				await api.removeUserFromGroup(id, event.threadID);
			}
		});
	}
};
