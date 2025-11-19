// Este é o código do Serverless Function (Node.js) para Vercel,
// usando a biblioteca oficial '@google/genai'.

// IMPORTANTE: Você deve ter 'npm install @google/genai' e 'npm install node-fetch'
// (se não estiver usando um ambiente Vercel/Node moderno)

import { GoogleGenAI } from "@google/genai";
// O método padrão para exportar Serverless Functions na Vercel
export default async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido.' });
    }

    // 1. Obter a chave de API de forma segura (process.env.GEMINI_API_KEY)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ message: 'A chave de API GEMINI_API_KEY não está configurada no servidor Vercel.' });
    }

    // 2. Inicializa o cliente com a chave de API
    const ai = new GoogleGenAI({ apiKey });

    let data;
    try {
        // Tenta obter o corpo da requisição JSON.
        data = req.body || JSON.parse(await getBody(req)); 
    } catch (e) {
        return res.status(400).json({ message: 'Corpo da requisição inválido.' });
    }

    const { stateA, stateB } = data;

    if (!stateA || !stateB) {
        return res.status(400).json({ message: 'Dados de comparação ausentes.' });
    }

    // 3. Montar o prompt detalhado para a IA
    const prompt = `Analise a comparação entre o Estado A e o Estado B e forneça uma recomendação.

    Estado A (${stateA.nome}):
    - Custo de Vida (Índice): ${stateA.custo.toFixed(1)}
    - Salário Mínimo (USD): $${stateA.salario.toFixed(2)}
    - Poder de Compra: ${stateA.poder_compra.toFixed(2)}%
    - Acesso à Natureza (1-10): ${stateA.acesso_natureza}
    - Clima: ${stateA.clima}
    - Destaque Principal: ${stateA.destaque}

    Estado B (${stateB.nome}):
    - Custo de Vida (Índice): ${stateB.custo.toFixed(1)}
    - Salário Mínimo (USD): $${stateB.salario.toFixed(2)}
    - Poder de Compra: ${stateB.poder_compra.toFixed(2)}%
    - Acesso à Natureza (1-10): ${stateB.acesso_natureza}
    - Clima: ${stateB.clima}
    - Destaque Principal: ${stateB.destaque}
    
    Com base nestes dados, qual estado seria ideal para o usuário se ele prioriza: 1) Economia e Carreira e 2) Qualidade de Vida e Natureza? Apresente a análise em dois parágrafos distintos para as duas prioridades. Seja conciso e use português.`;

    const systemInstruction = "Você é um consultor de estilo de vida focado em mudança de país. Sua tarefa é analisar os dois estados fornecidos e fornecer uma recomendação personalizada de forma clara e profissional, separando as prioridades conforme solicitado.";

    // 4. Configuração e Chamada para a API Gemini (usando o SDK)
    try {
        const response = await ai.models.generateContent({
            // AGORA USANDO gemini-3-pro-preview
            model: "gemini-3-pro-preview", 
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                // O SDK usa 'systemInstruction' diretamente na config
                systemInstruction: systemInstruction,
            },
        });

        const recommendation = response.text;

        // 5. Retorna o resultado para o front-end
        if (recommendation) {
            return res.status(200).json({ recommendation });
        } else {
            return res.status(500).json({ message: 'Falha ao processar a resposta da Gemini API (SDK).' });
        }
    } catch (error) {
        console.error('Erro na comunicação com a Gemini API (SDK):', error);
        return res.status(500).json({ message: `Erro interno ao comunicar com o serviço de IA. Detalhe: ${error.message}` });
    }
}

// Função auxiliar para obter o corpo da requisição de streams
function getBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}