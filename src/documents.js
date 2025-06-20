const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const textract = require("textract");

const DOCUMENTS_PATH = path.join(__dirname, "..", "docs");

async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  return new Promise((resolve, reject) => {
    textract.fromFileWithPath(filePath, (err, text) => {
      if (err) return reject(err);
      resolve(text);
    });
  });
}

async function loadAllDocuments() {
  const files = fs.readdirSync(DOCUMENTS_PATH);
  const allTexts = [];

  for (const file of files) {
    try {
      const fullPath = path.join(DOCUMENTS_PATH, file);
      const text = await extractTextFromFile(fullPath);
      allTexts.push({ file, text });
    } catch (err) {
      console.error(`Erro ao ler ${file}:`, err);
    }
  }

  return allTexts;
}

function findRelevantDocs(userQuestion, docs) {
  const lowerQ = userQuestion.toLowerCase();
  return docs.filter(doc => doc.text.toLowerCase().includes(lowerQ));
}

module.exports = { loadAllDocuments, findRelevantDocs };
