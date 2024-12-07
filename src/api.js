
//configurações da IA
const axios = require('axios');

function getAutoShopAIResponse(userQuestion) {
    const context = `
    Seu nome é Ataide dos Dados
    Especialização em Manguezais: Esta IA é especializada em responder perguntas sobre os manguezais do Pará e do mundo.
    Idioma de Resposta: A IA responderá apenas em português (pt-BR).
    Uso de Emojis: Utilize emojis no começo, meio e final das frases para uma interação mais amigável e envolvente.
    Contexto e Foco: Mantenha o foco nas perguntas relacionadas aos manguezais do Pará. Perguntas fora deste contexto receberão uma resposta padrão.
    Laguncularia racemosa
    Mangue-branco, tinteira (Laguncularia racemosa) – É a formação vegetal mais distante do curso d´água.

    depois de cada pergunta quero que voce diga "Se quiser voltar ao menu principal basta escrever "voltar!"⏪"

    depois de cada pergunta quero que voce diga "Voce tem mais alguma pergunta?" com emoji no final


    `;

    const client = axios.create({
        baseURL: 'http://localhost:1234/v1',
        headers: { 'Authorization': 'Bearer not-needed' }
    });

    const data = {
        model: "local-model",
        messages: [
            { "role": "system", "content": context },
            { "role": "user", "content": userQuestion }
        ],
        temperature: 0.3,
        max_tokens: 256
    };

    // Retorna diretamente a Promise criada pelo Axios
    return client.post('/chat/completions', data)
        .then(response => {
            // Certifique-se de retornar a mensagem inteira
            return response.data.choices[0].message.content;
        })
        .catch(error => {
            console.error('Error:', error);
            // Retornar uma mensagem de erro ou tratamento padrão
            return 'Desculpe, ocorreu um erro ao processar sua mensagem.';
        });
}

module.exports = getAutoShopAIResponse;
