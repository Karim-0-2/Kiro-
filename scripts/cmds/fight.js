const TIMEOUT_SECONDS = 120; // Game timeout duration in seconds

// Maps to track ongoing fights and game instances
const ongoingFights = new Map();
const gameInstances = new Map();

// Replace with your owner UID
const OWNER_ID = "61557991443492";

module.exports = {
  config: {
    name: "fight",
    version: "2.0",
    author: "Shikaki",
    countDown: 10,
    role: 0,
    shortDescription: "Fight with your friends!",
    longDescription: "Challenge your friends to a fight and see who wins!",
    category: "🎮 Game",
    guide: "{prefix}fight @mention or reply to a message",
  },

  onStart: async function ({ event, message, usersData }) {
    const threadID = event.threadID;

    // Check if a fight is already ongoing
    if (ongoingFights.has(threadID)) {
      return message.send("⚔️ A fight is already in progress in this group.");
    }

    let opponentID;

    // ✅ Mention support
    if (event.mentions && Object.keys(event.mentions).length === 1) {
      opponentID = Object.keys(event.mentions)[0];
    }
    // ✅ Reply support
    else if (event.messageReply) {
      opponentID = event.messageReply.senderID;
    } 
    else {
      return message.send("🤔 Please mention one person or reply to their message to start a fight.");
    }

    const challengerID = event.senderID;
    if (challengerID === opponentID) {
      return message.send("❌ You cannot fight yourself!");
    }

    const challenger = await usersData.getName(challengerID);
    const opponent = await usersData.getName(opponentID);

    // Create a new fight instance
    const fight = {
      participants: [
        { id: challengerID, name: challenger, hp: 100 },
        { id: opponentID, name: opponent, hp: 100 }
      ],
      currentPlayer: Math.random() < 0.5 ? challengerID : opponentID,
      threadID,
      startTime: Date.now(),
    };

    // Create game instance
    const gameInstance = {
      fight,
      lastAttack: null,
      lastPlayer: null,
      timeoutID: null,
      turnMessageSent: false,
    };

    gameInstances.set(threadID, gameInstance);

    startFight(message, fight);
    startTimeout(threadID, message);
  },

  onChat: async function ({ event, message }) {
    const threadID = event.threadID;
    const gameInstance = gameInstances.get(threadID);
    if (!gameInstance) return;

    const currentPlayerID = gameInstance.fight.currentPlayer;
    const currentPlayer = gameInstance.fight.participants.find(p => p.id === currentPlayerID);

    const attack = (event.body || event.messageReply?.body || "").trim().toLowerCase();
    if (!attack) return;

    // Only current player can attack
    if (event.senderID !== currentPlayerID) {
      if (!gameInstance.turnMessageSent) {
        message.send(`😒 It's ${currentPlayer.name}'s turn. Wait for your turn!`);
        gameInstance.turnMessageSent = true;
      }
      return;
    }

    // Forfeit
    if (attack === "forfeit") {
      const forfeiter = currentPlayer.name;
      const opponent = gameInstance.fight.participants.find(p => p.id !== currentPlayerID).name;
      message.send(`🏃 ${forfeiter} forfeits the match! ${opponent} wins!`);
      return endFight(threadID);
    }

    // Owner special attack
    if (attack === "bom" && event.senderID === OWNER_ID) {
      const opponent = gameInstance.fight.participants.find(p => p.id !== currentPlayerID);
      message.send(`💥 ${currentPlayer.name} used BOM! ${opponent.name} is instantly defeated! 🎉`);
      return endFight(threadID);
    }

    // Normal attacks
    if (["kick", "punch", "slap"].includes(attack)) {
      const damage = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 20 + 10);
      const opponent = gameInstance.fight.participants.find(p => p.id !== currentPlayerID);
      opponent.hp -= damage;

      message.send(
        `🥊 ${currentPlayer.name} attacks ${opponent.name} with ${attack} and deals ${damage} damage.\n` +
        `HP: ${currentPlayer.name} ${currentPlayer.hp} | ${opponent.name} ${opponent.hp}`
      );

      if (opponent.hp <= 0) {
        message.send(`🎉 ${currentPlayer.name} wins! ${opponent.name} is defeated.`);
        return endFight(threadID);
      }

      // Switch turns
      gameInstance.fight.currentPlayer =
        currentPlayerID === gameInstance.fight.participants[0].id
          ? gameInstance.fight.participants[1].id
          : gameInstance.fight.participants[0].id;

      gameInstance.lastAttack = attack;
      gameInstance.lastPlayer = currentPlayer;
      gameInstance.turnMessageSent = false;

      const nextPlayer = gameInstance.fight.participants.find(p => p.id === gameInstance.fight.currentPlayer);
      message.send(`🥲 It's ${nextPlayer.name}'s turn now.`);
    } else {
      message.send("❌ Invalid attack! Use 'kick', 'punch', 'slap', 'forfeit', or 'bom' (owner only).");
    }
  },
};

// Start a fight
function startFight(message, fight) {
  ongoingFights.set(fight.threadID, fight);

  const currentPlayer = fight.participants.find(p => p.id === fight.currentPlayer);
  const opponent = fight.participants.find(p => p.id !== fight.currentPlayer);

  message.send(
    `${currentPlayer.name} has challenged ${opponent.name} to a duel!\n\n` +
    `HP: ${currentPlayer.name} ${currentPlayer.hp} | ${opponent.name} ${opponent.hp}\n\n` +
    `It's ${currentPlayer.name}'s turn.\nAvailable attacks: kick, punch, slap, forfeit${OWNER_ID ? ", bom (owner only)" : ""}`
  );
}

// Timeout
function startTimeout(threadID, message) {
  const timeoutID = setTimeout(() => {
    const gameInstance = gameInstances.get(threadID);
    if (!gameInstance) return;

    const [player1, player2] = gameInstance.fight.participants;
    const winner = player1.hp > player2.hp ? player1 : player2;
    const loser = player1.hp > player2.hp ? player2 : player1;

    message.send(`⏰ Time's up! ${winner.name} wins with more HP! ${loser.name} is defeated.`);
    endFight(threadID);
  }, TIMEOUT_SECONDS * 1000);

  gameInstances.get(threadID).timeoutID = timeoutID;
}

// End fight
function endFight(threadID) {
  const gameInstance = gameInstances.get(threadID);
  if (gameInstance?.timeoutID) clearTimeout(gameInstance.timeoutID);
  ongoingFights.delete(threadID);
  gameInstances.delete(threadID);
  }
