
import { GoogleGenAI } from "@google/genai";
import { Business, LeadStatus } from "../types.ts";

export const geminiService = {
  /**
   * Scan for leads using Google Search Grounding.
   */
  scanLocalBusinesses: async (city: string, keyword: string): Promise<Business[]> => {
    // Always use process.env.API_KEY directly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Find 5 local businesses in ${city} for the category "${keyword}". 
    Evaluate their online presence.
    Provide exact fields for each:
    - NAME: [Business Name]
    - PHONE: [Phone Number]
    - URL: [Website URL or "None"]
    - ASSESSMENT: [Briefly why they need help]
    
    Separate with "---NEXT---".`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    // Guideline: Extract URLs from groundingChunks and list them on the web app
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sourceUrls = groundingChunks.map((chunk: any) => chunk.web?.uri || chunk.maps?.uri).filter(Boolean);

    try {
      const text = response.text || "";
      const entries = text.split("---NEXT---").filter(e => e.trim().length > 20);
      
      return entries.map((entry, index): Business => {
        const name = entry.match(/NAME:\s*(.*)/i)?.[1]?.trim() || "Unknown Business";
        const phone = entry.match(/PHONE:\s*(.*)/i)?.[1]?.trim() || "N/A";
        const websiteText = entry.match(/URL:\s*(.*)/i)?.[1]?.trim() || "None";
        
        return {
          id: Math.random().toString(36).substring(2, 9),
          name: name.replace(/^[\d.\s*-]+/, ''),
          city,
          phone,
          website: (websiteText.toLowerCase().includes("none")) ? null : websiteText,
          // Extract grounding URL to satisfy the search grounding guideline
          mapsUrl: sourceUrls[index] || sourceUrls[0] || undefined,
          status: LeadStatus.DISCOVERED,
          history: [],
          timestamp: Date.now()
        };
      });
    } catch (e) {
      console.error("Failed to parse", e);
      return [];
    }
  },

  /**
   * Autonomous Agent: Decide the next move and generate the text.
   */
  generateAgentResponse: async (business: Business, incomingMessage?: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const conversationHistory = business.history
      .map(m => `${m.role === 'agent' ? 'You' : 'Client'}: ${m.content}`)
      .join('\n');

    const prompt = `You are an autonomous Sales Agent for a high-end web design agency.
    Business Name: ${business.name}
    Business City: ${business.city}
    Current Status: ${business.status}
    
    Conversation History:
    ${conversationHistory || "None (This is the initial outreach)"}

    ${incomingMessage ? `NEW CLIENT REPLY: "${incomingMessage}"` : ""}

    TASK: 
    1. If this is initial outreach, offer a modern website to help them grow.
    2. If they replied with questions about price/time, handle it professionally (Target: $2000, 2 weeks).
    3. Be concise (under 40 words).
    4. Provide ONLY the message content.`;

    // Complex text tasks like negotiation logic should use gemini-3-pro-preview
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Let's chat about upgrading your online presence.";
  },

  /**
   * Simulates a client's response to test the autonomy.
   */
  simulateClientReply: async (business: Business): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Simulate a realistic short reply from a busy small business owner named ${business.name} 
    after receiving an outreach message. They should be either curious about the price, 
    asking how long it takes, or saying they are interested but busy. 
    Keep it under 15 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "How much do you charge for this?";
  }
};
