module.exports = {
    config: {
        name: 'kickuser',
        version: '1.0.1',
        author: 'Hasib',
        countDown: 5,
        role: 2,
        shortDescription: 'Kick all inactive/deactivated FB users',
        longDescription: {
            en: 'Automatically removes deactivated, deleted, or unused Facebook accounts from the group'
        },
        category: 'Box Chat',
        guide: {
            en: '!kick user'
        }
    },

    onStart: async function ({ api, event }) {
        const botID = api.getCurrentUserID();
        const ownerID = '61557991443492'; // Skip owner

        const threadInfo = await api.getThreadInfo(event.threadID);
        const admins = threadInfo.adminIDs.map(a => a.id);

        if (!admins.includes(botID))
            return api.sendMessage('» Bot needs admin rights to remove inactive accounts.', event.threadID);
        if (!admins.includes(event.senderID))
            return api.sendMessage('» Only group admins can use this command.', event.threadID);

        // Filter members to skip bot and owner
        const members = threadInfo.participantIDs.filter(id => id != botID && id != ownerID);

        let inactiveUsers = [];

        for (let id of members) {
            try {
                const userInfo = await api.getUserInfo(id);
                const user = userInfo[id];

                // If user object is missing or name is empty, account is deactivated or deleted
                if (!user || !user.name) {
                    inactiveUsers.push(id);
                }
            } catch (err) {
                // Error usually means account is deactivated or deleted
                inactiveUsers.push(id);
            }
        }

        if (inactiveUsers.length === 0) {
            return api.sendMessage('» No inactive or deleted accounts found.', event.threadID);
        }

        api.sendMessage(`» Removing ${inactiveUsers.length} inactive/deactivated accounts...`, event.threadID);

        for (let id of inactiveUsers) {
            try {
                await api.removeUserFromGroup(id, event.threadID);
            } catch (err) {
                console.log(`Failed to remove ${id}: ${err}`);
            }
        }

        api.sendMessage('» Inactive/deactivated accounts have been removed.', event.threadID);
    }
};
