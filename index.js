const { App } = require("@slack/bolt");
const { formatISO } = require("date-fns");
var admin = require("firebase-admin");

const { SLACK_SIGNING_SECRET, SLACK_BOT_TOKEN, FIREBASE_CREDENTIALS, FIREBASE_DATABASE_URL } = process.env

admin.initializeApp({
  credential: FIREBASE_CREDENTIALS,
  databaseURL: FIREBASE_DATABASE_URL
});

var db = admin.database();
var ref = db.ref("notifications");

const emojiMap = {
  ':eggplant:': '🍆',
  ':cat:': '🐱'
}

const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
});

const sendNotification = (title, description, channel) => {
  const payload = {
    notification: {
      title,
      body: description,
      sound: 'default'
    },
  };

  admin
    .messaging()
    .sendToTopic(channel, payload)
    .then((response) => {
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
}

app.command("/post", async ({ command, ack, say }) => {
    let formattedText = command.text

    Object.keys(emojiMap).forEach((key) => {
      const parts = formattedText.split(key)
      formattedText = parts.join(emojiMap[key])
    })

    const [title, description] = formattedText.split(';')

    try {
      await ack();

      ref.push().set({
        title: description,
        date: formatISO(new Date())
      });

      sendNotification(title, description, 'announcements')

      say("Announcement sent to everyone");
    } catch (error) {
      console.log("err")
      console.error(error);
    }
});

app.command("/eggplant", async ({ command, ack, say }) => {
    let formattedText = command.text

    Object.keys(emojiMap).forEach((key) => {
      const parts = formattedText.split(key)
      formattedText = parts.join(emojiMap[key])
    })

    const [title, description] = formattedText.split(';')
    try {
      await ack();
      await sendNotification(title, description, 'eggplant')
      say("Hidden message sent to 🍆");
    } catch (error) {
      console.log("err")
      console.error(error);
    }
});

(async () => {
  const port = 3000


  await app.start(process.env.PORT || port);
  console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
})();
