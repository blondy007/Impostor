import { GoogleGenAI } from '@google/genai';
import { Difficulty } from '../types';

export async function fetchSecretWord(difficulty: Difficulty, categories: string[]): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const randomSalt = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now();

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ACTUA COMO UN GENERADOR DE PALABRAS ALEATORIAS PARA EL JUEGO "EL IMPOSTOR".
      
      DIFICULTAD: ${difficulty}.
      CATEGORIAS: ${categories.join(', ')}.
      NONCE DE SEGURIDAD: ${randomSalt}-${timestamp}.
      
      REGLAS CRITICAS:
      1. GENERA UNA PALABRA TOTALMENTE NUEVA Y SORPRENDENTE.
      2. EVITA PALABRAS CLICHE (perro, pizza, coche, mesa).
      3. DEBE SER UN SUSTANTIVO CONCRETO O CONCEPTO CLARO.
      4. SI LA DIFICULTAD ES EXTREMA, BUSCA TERMINOS CIENTIFICOS O FILOSOFICOS POCO COMUNES.
      
      RESPONDE SOLO CON LA PALABRA, SIN NADA MAS.`,
      config: {
        temperature: 1.0,
        topP: 0.99,
        topK: 100,
      },
    });

    return response.text?.trim() || '';
  } catch (error) {
    console.error('Gemini failed to fetch word', error);
    return '';
  }
}
