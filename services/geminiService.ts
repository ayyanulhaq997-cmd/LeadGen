
import { GoogleGenAI } from "@google/genai";
import { Business, LeadStatus } from "../types.ts";

const getApiKey = () => {
  return (window as any).process?.env?.API_KEY || "";
};

export const geminiService = {
  /**
   * Scan for local businesses using Google Search Grounding.
   */
  scanLocalBusinesses: async (city: string, keyword: string): Promise<Business[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key must be set");
    
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Find 5 currently active local businesses in ${city} for the category "${keyword}". 
    For each business, provide these exact fields:
    - NAME: [Business Name]
    - PHONE: [Phone Number]
    - URL: [Website URL or "None"]
    - INFO: [Short assessment of their website quality - modern, old, or none]
    
    Separate each business entry with the marker "---NEXT_BUSINESS---".`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchLinks = groundingChunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => chunk.web.uri);

    try {
      const text = response.text || "";
      const entries = text.split("---NEXT_BUSINESS---").filter(e => e.trim().length > 20);
      
      return entries.map((entry, index): Business => {
        const name = entry.match(/NAME:\s*(.*)/i)?.[1]?.trim() || "Unknown Business";
        const phone = entry.match(/PHONE:\s*(.*)/i)?.[1]?.trim() || "N/A";
        const websiteText = entry.match(/URL:\s*(.*)/i)?.[1]?.trim() || "None";
        const info = entry.match(/INFO:\s*(.*)/i)?.[1]?.trim() || "";

        let status = LeadStatus.COLD;
        const normalizedWeb = websiteText.toLowerCase();
        
        if (normalizedWeb === "none" || normalizedWeb === "" || normalizedWeb.includes("n/a")) {
          status = LeadStatus.HOT;
        } else if (info.toLowerCase().includes("old") || info.toLowerCase().includes("outdated") || info.toLowerCase().includes("poor")) {
          status = LeadStatus.WARM;
        }

        return {
          id: Math.random().toString(36).substring(2, 9),
          name: name.replace(/^[\d.\s*-]+/, ''),
          city,
          phone,
          website: (status === LeadStatus.HOT || normalizedWeb === "none") ? null : websiteText,
          mapsUrl: searchLinks[index] || searchLinks[0] || undefined,
          status,
          timestamp: Date.now()
        };
      });
    } catch (e) {
      console.error("Failed to parse Gemini Search response", e);
      return [];
    }
  },

  /**
   * Generate a personalized outreach message using Gemini 3 Flash.
   */
  generateMessage: async (business: Business): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key must be set");

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Generate a short, professional outreach message for a business owner.
    Business: ${business.name} in ${business.city}
    Context: ${business.status === LeadStatus.HOT ? 'They have no website' : 'Their website looks outdated'}
    
    Goal: Offer to build a modern, high-converting website to help them get more local customers.
    Constraint: Under 50 words. Professional and friendly. No subject line.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Hi, I noticed your business could benefit from a modern website. Let's chat!";
  }
};
