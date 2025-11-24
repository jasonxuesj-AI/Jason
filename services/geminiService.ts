import { GoogleGenAI } from "@google/genai";
import { Opportunity, VisitRecord } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeOpportunity = async (opportunity: Opportunity): Promise<string> => {
  if (!apiKey) return "API Key not configured.";

  const visitsText = opportunity.visitRecords.length > 0
    ? opportunity.visitRecords.map(v => `[${v.date}] ${v.content}`).join("\n")
    : "No visit records yet.";

  const prompt = `
    You are an expert Sales Manager AI. Analyze the following sales opportunity.
    
    Customer: ${opportunity.customerName}
    Current Status: ${opportunity.status} (Note: Statuses range from Initial Contact '初步接触' to Won '赢单'/Lost '输单')
    Salesperson: ${opportunity.salesperson}
    
    Visit History:
    ${visitsText}
    
    Please provide a concise analysis in Markdown format including:
    1. **Summary**: Brief overview of the situation.
    2. **Sentiment**: Positive, Neutral, or Negative.
    3. **Next Steps**: 3 actionable recommendations for the salesperson.
    4. **Win Probability**: An estimated percentage (0-100%) based on the progress.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed over deep reasoning for simple summaries
      }
    });
    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Failed to generate analysis. Please check your API configuration.";
  }
};