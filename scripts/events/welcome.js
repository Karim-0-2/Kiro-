const fs = require("fs");
const path = require("path");

module.exports = async function onUserJoin({ api, event }) {
  try {
    const { threadID, senderID } = event;

    // Path to your join image
    const joinImagePath = path.join(__dirname, "cache/joinGif/join.jpeg");

    // Check if file exists
    if (!fs.existsSync(joinImagePath)) {
      console.error("Join image not found:", joinImagePath);
      return;
    }

    // Send the join message with image
    await api.sendMessage(
      {
        body: `Welcome <@${senderID}>! 🎉`,
        mentions: [{ tag: `<@${senderID}>`, id: senderID }],
        attachment: fs.createReadStream(joinImagePath),
      },
      threadID
    );

  } catch (error) {
    console.error("Error sending join image:", error);
  }
};
