require("dotenv").config();
const wppconnect = require("@wppconnect-team/wppconnect");
const getAutoShopAIResponse = require("./src/api");

const userStates = {};
const sessionTimeout = 600000;

wppconnect
  .create({
    session: "sessionName",
    catchQR: (base64Qr, asciiQR) => {
      console.log("QR Code gerado! Escaneie abaixo:");
      console.log(asciiQR);
    },
    logQR: true,
  })
  .then((client) => start(client))
  .catch((error) => console.error("Erro ao iniciar o WPPConnect:", error));

async function start(client) {
  console.log("WhatsApp conectado com sucesso!");

  client.onMessage((message) => {
    setTimeout(async () => {
      const userId = message.from;
      const msg = message.body.toLowerCase().trim();

      if (msg === "encerrar" || msg === "sair") {
        client.sendText(userId, "Conversa encerrada. Até logo!");
        delete userStates[userId];
        return;
      }

      if (!userStates[userId]) {
        client.sendText(userId, "Olá, em que posso ajudar?");
        userStates[userId] = { state: "waiting_for_ai_question" };
      } else {
        client.sendText(userId, "Pensando...🧠");
        const resposta = await getAutoShopAIResponse(message.body);
        client.sendText(userId, resposta);
      }
    }, 0);
  });
}
