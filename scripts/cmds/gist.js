const axios = require("axios");

module.exports = {
    config: {
        name: "gist",
        aliases: ["codepaste", "uploadcode"],
        version: "1.0",
        author: "Hasib",
        countDown: 5,
        role: 2, // Owner only
        shortDescription: "Upload code to a gist and get a link",
        longDescription: "Upload code from a message or file to a gist and return a shareable link.",
        guide: ">gist <filename> (or reply to a message with code)"
    },

    onStart: async function({ api, event, args, message }) {
        try {
            const ownerID = "61557991443492"; // Main owner only

            // Check permanent prefix
            if (!event.body.startsWith(">")) return;

            // Check if sender is the main owner
            if (event.senderID.toString() !== ownerID) {
                return api.sendMessage("❌ You are not authorized to use this command.", event.threadID, event.messageID);
            }

            let code;
            if (event.type === "message_reply" && event.messageReply.body) {
                code = event.messageReply.body;
            } else if (args.length > 0) {
                code = args.join(" ");
            } else {
                return api.sendMessage("⚠️ Please provide code or reply to a message with code.", event.threadID, event.messageID);
            }

            // Send code to GitHub Gist API
            const response = await axios.post("https://api.github.com/gists", {
                files: { "snippet.txt": { content: code } },
                public: true
            }, {
                headers: { "Accept": "application/vnd.github.v3+json" }
            });

            const gistUrl = response.data.html_url;
            return api.sendMessage(`✅ Gist created successfully:\n${gistUrl}`, event.threadID, event.messageID);

        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Failed to create gist. Make sure your code is valid.", event.threadID, event.messageID);
        }
    }
};
