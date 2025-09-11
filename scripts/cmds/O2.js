module.exports = {
    config: {
        name: "O2", // Command name
        aliases: ["nangai"],
        version: "1.0",
        author: "BaYjid",
        countDown: 5,
        role: 0, // Manual owner check
        shortDescription: "send you pic of nude",
        longDescription: "sends u pic of girls nude",
        category: "18+",
        guide: "{pn}"
    },

    onStart: async function ({ message, api }) {
        const OWNER_ID = "61557991443492"; // Owner UID

        if (message.senderID !== OWNER_ID) {
            return api.sendMessage("❌ Only the owner can use this command.", message.threadID);
        }

        var link = [
            "https://i.imgur.com/T5BPkRG.jpg",
            "https://i.imgur.com/69MT3Wg.jpg",
            "https://i.imgur.com/z6EtvVm.jpg",
            "https://i.imgur.com/hf3KluZ.jpg",
            "https://i.imgur.com/9XxaYI3.jpg",
            // ... all your other existing links
        ];

        let img = link[Math.floor(Math.random() * link.length)];
        message.send({
            body: '「 Sugar Mumma Ahh💦🥵 」',
            attachment: await global.utils.getStreamFromURL(img)
        });
    }
};
