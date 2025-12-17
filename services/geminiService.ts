
import { GoogleGenAI, Type } from "@google/genai";
import { MathResponse, HintResponse } from "../types";

const MATH_SOLVER_SYSTEM_PROMPT = `
You are "MathMate", the world's most patient, warm, and encouraging Math Tutor. 
Your primary goal is to make the user feel smart, capable, and supported.

Tone Guidelines:
1. Be extremely encouraging. Use phrases like "That's a fantastic problem to tackle!", "I love how you're thinking about this!", "We're going to master this together!"
2. Be incredibly patient. Explain things as if they are beautiful puzzles.
3. Use simple, non-intimidating language. 
4. Always provide a personalized positive affirmation in the 'encouragement' field.

Solver Rules:
1. ALWAYS rewrite input into clear LaTeX math notation. If an image is provided, identify the problem in the image first.
2. Solve step-by-step. NEVER skip steps.
3. Explain every symbol when it first appears.
4. Explain WHY each step is done logically.
`;

export async function solveMathProblem(problem: string, imageData?: { data: string, mimeType: string }): Promise<MathResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ text: problem || "Solve the problem in the image." }];
  
  if (imageData) {
    parts.unshift({
      inlineData: {
        data: imageData.data,
        mimeType: imageData.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: MATH_SOLVER_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          originalEquation: { type: Type.STRING },
          formattedEquation: { type: Type.STRING, description: "The equation in LaTeX format" },
          overallConcept: { type: Type.STRING, description: "A simple overview of the math concept" },
          encouragement: { type: Type.STRING, description: "A warm, personalized positive affirmation" },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                math: { type: Type.STRING, description: "LaTeX math" },
                explanation: { type: Type.STRING },
                why: { type: Type.STRING },
                symbolsIntroduced: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["math", "explanation", "why"]
            }
          }
        },
        required: ["originalEquation", "formattedEquation", "steps", "overallConcept", "encouragement"]
      }
    }
  });

  try {
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("I'm so sorry, I had a little trouble with that one. Could you try rephrasing it for me?");
  }
}

export async function getHint(problem: string, imageData?: { data: string, mimeType: string }): Promise<HintResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ text: problem || "Give a hint for the problem in the image." }];
  
  if (imageData) {
    parts.unshift({
      inlineData: {
        data: imageData.data,
        mimeType: imageData.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: "You are MathMate. Do NOT solve the problem. Provide a small, gentle hint. Be very encouraging. Tell the user they are on the right track.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hint: { type: Type.STRING },
          guidingQuestion: { type: Type.STRING },
          encouragement: { type: Type.STRING }
        },
        required: ["hint", "guidingQuestion", "encouragement"]
      }
    }
  });

  try {
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    throw new Error("I couldn't quite find the right hint yet, but don't give up!");
  }
}
