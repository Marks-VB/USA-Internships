// api/gemini-recommendation.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuração para permitir CORS (para funcionar no navegador)
const allowCors = (fn) => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

async function handler(req, res) {
  // 1. Verifica se a chave da API existe
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave da API (GEMINI_API_KEY) não configurada no servidor.' });
  }

  // 2. Apenas aceita método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const { stateA, stateB } = req.body;

    if (!stateA || !stateB) {
      return res.status(400).json({ error: 'Dados dos estados incompletos.' });
    }

    // 3. Inicializa o Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 4. Cria o Prompt
    const prompt = `
      Aja como um consultor de carreiras e viagens para estudantes internacionais.
      Compare estes dois estados dos EUA para um estágio de verão:
      
      Estado A: ${stateA.nome} (Custo: ${stateA.custo}, Salário: $${stateA.salario}, Neve: ${stateA.prob_neve}/10, Natureza: ${stateA.acesso_natureza}/10)
      Estado B: ${stateB.nome} (Custo: ${stateB.custo}, Salário: $${stateB.salario}, Neve: ${stateB.prob_neve}/10, Natureza: ${stateB.acesso_natureza}/10)

      Dê uma recomendação curta e direta (máximo de 3 parágrafos). 
      Analise qual vale mais a pena financeiramente (Poder de compra) e qual oferece melhor qualidade de vida no verão.
      Termine escolhendo um vencedor claro baseado no perfil de um estudante que quer economizar mas também se divertir.
    `;

    // 5. Gera a resposta
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 6. Retorna para o Frontend
    res.status(200).json({ recommendation: text });

  } catch (error) {
    console.error("Erro na API Gemini:", error);
    res.status(500).json({ message: "Erro interno ao processar a IA.", details: error.message });
  }
}

module.exports = allowCors(handler);