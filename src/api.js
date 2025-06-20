const axios = require("axios");
const { loadAllDocuments, findRelevantDocs } = require("./documents");

let cachedDocs = [];

async function getAutoShopAIResponse(userQuestion) {
  if (cachedDocs.length === 0) {
    cachedDocs = await loadAllDocuments();
  }

  const relevantes = findRelevantDocs(userQuestion, cachedDocs);

  if (relevantes.length === 0) {
    return "Não encontrei nada relacionado nos documentos.";
  }

  const contexto = relevantes
    .map(doc => `Arquivo: ${doc.file}\n${doc.text.slice(0, 1000)}`)
    .join("\n\n");

  const prompt = `
Aqui vai toda a engenharai de pronpts

DOCUMENTOS:
${contexto}

PERGUNTA:
${userQuestion}
`;

  const client = axios.create({
    baseURL: "http://localhost:1234/v1",
    headers: { Authorization: "Bearer not-needed" },
  });

  const data = {
    model: "local-model",
    messages: [
      { role: "system", content: "Você é um assistente especialista em fisica." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 512,
  };

  try {
    const response = await client.post("/chat/completions", data);
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Erro ao consultar modelo local:", error.message);
    return "Erro ao processar a resposta. Verifique o modelo local.";
  }
}

module.exports = getAutoShopAIResponse;
