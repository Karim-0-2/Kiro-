module.exports = {
  config: {
    name: "girl",
    aliases: ["girl"],
    version: "1.1",
    author: "AceGun",
    countDown: 5,
    role: 0,
    shortDescription: "Send a random girl photo (OWNER ONLY, HIDDEN)",
    longDescription: "",
    category: "No permission", // hidden category so it won't appear in help
    guide: "{pn}",
    hidden: true // custom flag to hide from help
  },

  OWNER_UID: "61557991443492", // Replace with your UID
  allowedUsers: [], // Array to store temporary allowed users

  onStart: async function ({ message, event, args }) {
    const senderID = event.senderID;

    // Command to allow another user (owner only)
    if (args[0] === "allow") {
      if (senderID !== this.OWNER_UID) 
        return message.send("🚫 Only the owner can allow someone.");
      if (!args[1]) return message.send("❗ Provide the UID of the user to allow.");
      this.allowedUsers.push(args[1]);
      return message.send(`✅ User ${args[1]} is now allowed to use this command temporarily.`);
    }

    // Check if sender is owner or allowed
    if (senderID !== this.OWNER_UID && !this.allowedUsers.includes(senderID)) {
      return message.send("🚫 Only the bot owner or allowed users can use this command.");
    }

    // Send hidden content
    var links = [
      "https://i.postimg.cc/wTJNSC1G/E-B9ea-WQAAst-Yg.jpg",
      "https://i.postimg.cc/sgrWyTSD/E-B9eb-AWUAINyt-B.jpg",
      "https://i.postimg.cc/TYcj48LJ/E02i-P-q-XIAE62tu.jpg",
      "https://i.postimg.cc/MpK0ks12/E02i-P-w-WYAEbvgg.jpg",
      "https://i.postimg.cc/k5LWbqzq/E02i-P-x-XIAAy-K2k.jpg"
      // Add more URLs as needed
    ];

    let img = links[Math.floor(Math.random() * links.length)];

    return message.send({
      body: "🌸 Here's a secret girl photo just for you!",
      attachment: await global.utils.getStreamFromURL(img)
    });
  }
};
