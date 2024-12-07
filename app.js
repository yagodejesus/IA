const fs = require("fs");
const wppconnect = require("@wppconnect-team/wppconnect");
const ExcelJS = require('exceljs');
const getAutoShopAIResponse = require('./src/api'); // Importando a função de resposta da IA

const EXCEL_FILE_PATH = 'dados.xlsx'; // Caminho e nome do arquivo Excel

wppconnect
  .create({
    session: "sessionName",
    catchQR: (base64Qr, asciiQR) => {
      console.log(asciiQR); // Opcional para registrar o QR no terminal
      var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

      if (matches.length !== 3) {
        return new Error("Entrada de string inválida");
      }
      response.type = matches[1];
      response.data = new Buffer.from(matches[2], "base64");

      var imageBuffer = response;
      fs.writeFile(
        "out.png",
        imageBuffer["data"],
        "binary",
        function (err) {
          if (err != null) {
            console.log(err);
          }
        }
      );
    },
    logQR: true,
  })
  .then((client) => start(client))
  .catch((error) => console.log(error));

// Função para gerenciar interações com o usuário
const userStates = {}; // Estado da conversa de cada usuário
const sessionTimeout = 600000; // Tempo limite de 10 minutos para a sessão

async function start(client) {
  client.onMessage(async (message) => {
    const lowerCaseMessage = message.body.toLocaleLowerCase().trim();
    const userId = message.from;

    console.log(`Mensagem recebida de ${userId}: ${message.body}`);

    if (!userStates[userId]) {
      // Se não houver estado salvo para o usuário, enviar mensagem inicial
      client
        .sendText(
          userId,
          "Olá, me chamo Ataide dos Dados, sou um Chatbot/Inteligência Artificial do Observatório do Mangue🙂🌱. Digite uma das opções abaixo para continuar.\n\n1. Quero enviar uma imagem de impacto Ambiental 📸\n2. Quero falar com a Inteligência Artificial🧠🤖\n3. Encerrar Conversa❌"
        )
        .then(() => {
          // Salvar estado do usuário como "esperando resposta"
          userStates[userId] = {
            state: "waiting_for_response",
            timeout: setTimeout(() => {
              if (userStates[userId]) {
                client.sendText(
                  userId,
                  "Sessão encerrada por inatividade. Envie uma mensagem para começar novamente."
                );
                delete userStates[userId];
              }
            }, sessionTimeout),
          };
        })
        .catch((error) => {
          console.error("Erro ao enviar mensagem inicial: ", error);
        });
    } else {
      // Limpar temporizador existente
      clearTimeout(userStates[userId].timeout);

      // Definir novo temporizador para inatividade
      userStates[userId].timeout = setTimeout(() => {
        if (userStates[userId]) {
          client.sendText(
            userId,
            "Sessão encerrada por inatividade. Envie uma mensagem para começar novamente."
          );
          delete userStates[userId];
        }
      }, sessionTimeout);

      // Processar resposta do usuário baseado no estado atual
      switch (userStates[userId].state) {
        case "waiting_for_response":
          switch (lowerCaseMessage) {
            case "1":
              // Pergunta 1
              client
                .sendText(userId, "Por favor, envie a localização do impacto ambiental?📍🗺️")
                .then(() => {
                  userStates[userId] = {
                    state: "waiting_for_location", // Estado atual
                    data: {}, // Inicialização do objeto de dados
                    timeout: setTimeout(() => {
                      if (userStates[userId]) {
                        client.sendText(
                          userId,
                          "Sessão encerrada por inatividade🙃. Envie uma mensagem para começar novamente.😃"
                        );
                        delete userStates[userId];
                      }
                    }, sessionTimeout),
                  };
                })
                .catch((error) => {
                  console.error("Erro ao enviar pergunta 1: ", error);
                });
              break;
            case "2":
              // Mensagem de introdução para o IA
              client
                .sendText(
                  userId,
                  "Olá, me chamo Ataide dos Dados a Inteligência Artificial do Observatório do Mangue o que voce quer perguntar?🙂🌱"
                )
                .then(() => {
                  // Altera o estado para aguardar a pergunta do usuário
                  userStates[userId] = {
                    state: "waiting_for_ai_question",
                    timeout: setTimeout(() => {
                      if (userStates[userId]) {
                        client.sendText(
                          userId,
                          "Sessão encerrada por inatividade🙃. Envie uma mensagem para começar novamente.😃"
                        );
                        delete userStates[userId];
                      }
                    }, sessionTimeout),
                  };
                })
                .catch((error) => {
                  console.error("Erro ao enviar mensagem inicial da IA: ", error);
                });
              break;
            case "3":
              client
                .sendText(
                  userId,
                  "Conversa encerrada. Obrigado por usar o Ataide dos Dados, qualquer coisa, estou a sua disposição.🙂🌱"
                )
                .then(() => {
                  delete userStates[userId];
                })
                .catch((error) => {
                  console.error("Erro ao enviar mensagem de encerramento: ", error);
                });
              break;
            default:
              client
                .sendText(
                  userId,
                  "Opção inválida. Por favor, Digite uma das opções abaixo para continuar.\n\n1. Quero enviar uma imagem de impacto Ambiental 📸\n2. Quero falar com a Inteligência Artificial🧠🤖\n3. Encerrar Conversa❌"
                )
                .then(() => {
                  userStates[userId].timeout = setTimeout(() => {
                    if (userStates[userId]) {
                      client.sendText(
                        userId,
                        "Sessão encerrada por inatividade🙃. Envie uma mensagem para começar novamente.😃"
                      );
                      delete userStates[userId];
                    }
                  }, sessionTimeout);
                })
                .catch((error) => {
                  console.error("Erro ao enviar mensagem de opção inválida: ", error);
                });
          }
          break;
        case "waiting_for_ai_question":
          // Verificar se a mensagem é "Voltar"
          if (lowerCaseMessage === "voltar") {
            client.sendText(
              userId,
              "Voltando ao menu principal. Digite uma das opções abaixo para continuar.\n\n1. Quero enviar uma imagem de impacto Ambiental 📸\n2. Quero falar com a Inteligência Artificial🧠🤖\n3. Encerrar Conversa❌"
            ).then(() => {
              userStates[userId].state = "waiting_for_response";
            });
          } else {
            // Enviar mensagem "Pensando..." antes de chamar a IA
            client.sendText(userId, "Pensando...🧠").then(() => {
              // Chamar a função de resposta da IA
              getAutoShopAIResponse(message.body) // Você pode ajustar os parâmetros conforme necessário
                .then((response) => {
                  client.sendText(userId, response).then(() => {
                    // Permanece no estado "waiting_for_ai_question" até que o usuário digite "Voltar"
                  });
                })
                .catch((error) => {
                  console.error("Erro ao obter resposta da IA: ", error);
                  client.sendText(userId, "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.").then(() => {
                    // Permanece no estado "waiting_for_ai_question"
                  });
                });
            });
          }
          break;
        case "waiting_for_location":
          // Verifica se a mensagem recebida é uma localização
          if (message.type === 'location') {
            // Extrai latitude e longitude da mensagem de localização
            const latitude = message.lat;
            const longitude = message.lng;

            // Salva latitude e longitude nos dados do usuário
            userStates[userId].data.latitude = latitude;
            userStates[userId].data.longitude = longitude;

            // Pergunta 2
            client.sendText(userId, "Qual é a data do impacto ambiental?(Padrão DD/MM/AAAA)📅")
              .then(() => {
                userStates[userId].state = "waiting_for_date"; // Altera o estado para esperar a data
              })
              .catch((error) => {
                console.error("Erro ao enviar pergunta 2: ", error);
              });
          } else {
            // Se não for uma localização válida, solicita novamente
            client.sendText(userId, "Por favor, envie uma localização válida.📍🗺️").then(() => {
              userStates[userId].timeout = setTimeout(() => {
                if (userStates[userId]) {
                  client.sendText(
                    userId,
                    "Sessão encerrada por inatividade🙃. Envie uma mensagem para começar novamente.😃"
                  );
                  delete userStates[userId];
                }
              }, sessionTimeout);
            });
          }
          break;
        case "waiting_for_date":
          // Captura a data do impacto ambiental
          userStates[userId].data.date = message.body;

          // Pergunta 3
          client
            .sendText(userId, "Descreva o impacto ambiental.✍️📝")
            .then(() => {
              userStates[userId].state = "waiting_for_description"; // Altera o estado para esperar a descrição
            })
            .catch((error) => {
              console.error("Erro ao enviar pergunta 3: ", error);
            });
          break;
        case "waiting_for_description":
          // Captura a descrição do impacto ambiental
          userStates[userId].data.description = message.body;

          // Solicitar imagem
          client
            .sendText(userId, "Por favor, envie uma imagem do impacto ambiental.📸")
            .then(() => {
              userStates[userId].state = "waiting_for_image"; // Altera o estado para esperar a imagem
            })
            .catch((error) => {
              console.error("Erro ao solicitar imagem: ", error);
            });
          break;
        case "waiting_for_image":
          console.log(`Estado atual: waiting_for_image. Tipo de mídia: ${message.type}`);
          if (message.type === 'image') {
            try {
              const mediaData = await client.decryptFile(message); // Obter dados da mídia
              const filename = `image_${userId}_${Date.now()}.jpg`; // Gerar um nome de arquivo único

              fs.writeFileSync(filename, mediaData); // Salvar a imagem localmente

              console.log(`Imagem salva com sucesso: ${filename}`);

              // Adicionar dados ao Excel
              const data = {
                userId: userId,
                latitude: userStates[userId].data.latitude,
                longitude: userStates[userId].data.longitude,
                date: userStates[userId].data.date,
                description: userStates[userId].data.description,
                filename: filename,
              };
              appendToExcel(EXCEL_FILE_PATH, data)
                .then(() => {
                  client.sendText(userId, "Dados e imagem Enviados com sucesso✅📊🖼️, Obrigado por usar o Ataide dos Dados! se quiser voltar ao menu principal, envie qualquer mensagem!").then(() => {
                    delete userStates[userId];
                  });
                })
                .catch((error) => {
                  console.error("Erro ao adicionar dados ao Excel: ", error);
                  client.sendText(userId, "Ocorreu um erro ao adicionar dados ao Excel. Por favor, tente novamente mais tarde.").then(() => {
                    delete userStates[userId];
                  });
                });
            } catch (error) {
              console.error("Erro ao processar imagem: ", error);
              client.sendText(userId, "Ocorreu um erro ao processar a imagem. Por favor, tente novamente.").then(() => {
                delete userStates[userId];
              });
            }
          } else {
            client.sendText(userId, "Por favor, envie uma imagem válida para adicionar aos dados do Excel.").then(() => {
              userStates[userId].timeout = setTimeout(() => {
                if (userStates[userId]) {
                  client.sendText(
                    userId,
                    "Sessão encerrada por inatividade. Envie uma mensagem para começar novamente."
                  );
                  delete userStates[userId];
                }
              }, sessionTimeout);
            });
          }
          break;
        default:
          client.sendText(userId, "Erro interno. Reinicie a conversa.").then(() => {
            delete userStates[userId];
          });
          break;
      }
    }
  });
}

// Função para adicionar dados ao Excel
async function appendToExcel(filePath, data) {
  const workbook = new ExcelJS.Workbook();
  let worksheet;

  try {
    if (fs.existsSync(filePath)) {
      await workbook.xlsx.readFile(filePath);
      worksheet = workbook.getWorksheet(1);
    } else {
      worksheet = workbook.addWorksheet('Dados');
      worksheet.addRow(['UserID', 'Latitude', 'Longitude', 'Data', 'Descrição', 'Imagem']); // Cabeçalhos
    }

    // Adicionar nova linha com os dados
    const newRow = worksheet.addRow([
      data.userId,
      data.latitude,
      data.longitude,
      data.date,
      data.description,
      data.filename,
    ]);

    // Salvar o arquivo Excel atualizado
    await workbook.xlsx.writeFile(filePath);

    return Promise.resolve(newRow);
  } catch (error) {
    return Promise.reject(error);
  }
}