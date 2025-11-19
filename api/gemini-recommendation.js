import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // Apenas aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Extrai os dados do corpo da requisição
    const { stateA, stateB } = req.body;

    // Validação básica
    if (!stateA || !stateB) {
      return res.status(400).json({ 
        message: 'Dados insuficientes: stateA e stateB são obrigatórios' 
      });
    }

    // Verifica se a API key está configurada
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        message: 'GEMINI_API_KEY não configurada no servidor' 
      });
    }

    // Inicializa o cliente Gemini
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    // Monta o prompt para a IA
    const prompt = `
Você é um assistente especializado em análise de oportunidades de estágio e trabalho nos Estados Unidos.

Analise os dois estados abaixo e forneça uma recomendação clara e objetiva sobre qual seria a melhor escolha para um estudante internacional buscando estágio/trabalho.

**Estado A: ${stateA.nome} (${stateA.sigla})**
- Custo de Vida (índice): ${stateA.custo}
- Salário Mínimo: $${stateA.salario}
- Poder de Compra: ${stateA.poder_compra.toFixed(2)}%
- Acesso à Natureza: ${stateA.acesso_natureza}/10
- Probabilidade de Neve: ${stateA.prob_neve}/10
- Clima: ${stateA.clima}
- Destaque: ${stateA.destaque}
- Ambiente Acadêmico: ${stateA.ambiente_academico}

**Estado B: ${stateB.nome} (${stateB.sigla})**
- Custo de Vida (índice): ${stateB.custo}
- Salário Mínimo: $${stateB.salario}
- Poder de Compra: ${stateB.poder_compra.toFixed(2)}%
- Acesso à Natureza: ${stateB.acesso_natureza}/10
- Probabilidade de Neve: ${stateB.prob_neve}/10
- Clima: ${stateB.clima}
- Destaque: ${stateB.destaque}
- Ambiente Acadêmico: ${stateB.ambiente_academico}

Por favor, forneça:
1. Uma análise comparativa dos principais fatores
2. Vantagens e desvantagens de cada estado
3. Uma recomendação final baseada no melhor custo-benefício e qualidade de vida
4. Considerações especiais para estudantes internacionais

Mantenha a resposta concisa (máximo 300 palavras) e em português do Brasil.
`;

    // Chama a API Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", // ou "gemini-2.5-flash" se disponível
      contents: prompt,
    });

    // Extrai o texto da resposta
    const recommendation = response.text;

    // Retorna a recomendação
    return res.status(200).json({ 
      recommendation: recommendation || "Não foi possível gerar uma recomendação."
    });

  } catch (error) {
    console.error('Erro ao chamar Gemini API:', error);
    
    // Trata erros específicos
    if (error.message?.includes('API key')) {
      return res.status(401).json({ 
        message: 'Erro de autenticação com a API Gemini. Verifique a chave de API.' 
      });
    }
    
    if (error.message?.includes('quota')) {
      return res.status(429).json({ 
        message: 'Limite de requisições excedido. Tente novamente mais tarde.' 
      });
    }

    return res.status(500).json({ 
      message: error.message || 'Erro ao processar a requisição com a Gemini API.' 
    });
  }
}