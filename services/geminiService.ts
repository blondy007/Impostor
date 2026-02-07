
import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty } from "../types";

export async function fetchSecretWord(difficulty: Difficulty, categories: string[]): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Usamos múltiples factores de aleatoriedad para el modelo
    const randomSalt = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now();
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ACTÚA COMO UN GENERADOR DE PALABRAS ALEATORIAS PARA EL JUEGO "EL IMPOSTOR".
      
      DIFICULTAD: ${difficulty}.
      CATEGORÍAS: ${categories.join(', ')}.
      NONCE DE SEGURIDAD: ${randomSalt}-${timestamp}.
      
      REGLAS CRÍTICAS:
      1. GENERA UNA PALABRA TOTALMENTE NUEVA Y SORPRENDENTE.
      2. EVITA PALABRAS CLICHÉ (perro, pizza, coche, mesa).
      3. DEBE SER UN SUSTANTIVO CONCRETO O CONCEPTO CLARO.
      4. SI LA DIFICULTAD ES EXTREMA, BUSCA TÉRMINOS CIENTÍFICOS O FILOSÓFICOS POCO COMUNES.
      
      RESPONDE SOLO CON LA PALABRA, SIN NADA MÁS.`,
      config: {
        temperature: 1.0, // Máxima creatividad
        topP: 0.99,
        topK: 100,
      },
    });
    
    const word = response.text?.trim() || "";
    return word;
  } catch (error) {
    console.error("Gemini failed to fetch word", error);
    return ""; 
  }
}

export async function validateClue(clue: string, secretWord: string): Promise<{ isValid: boolean; reason?: string }> {
  const normalizedClue = clue.toLowerCase().trim();
  const normalizedWord = secretWord.toLowerCase().trim();
  
  if (normalizedClue === normalizedWord) {
    return { isValid: false, reason: "¡Has dicho la palabra secreta!" };
  }
  
  if (normalizedClue.length < 2) {
    return { isValid: false, reason: "Demasiado corta." };
  }

  return { isValid: true };
}
