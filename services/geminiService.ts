
import { GoogleGenAI } from "@google/genai";
import { Business, LeadStatus, MessageLog } from "../types.ts";

export const geminiService = {
  /**
   * Autonomous Agent: Drives the conversation toward a meeting/sale.
   */
  generateAgentResponse: async (business: Business, incomingMessage?: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || (window as any).manualKey });

    const conversationHistory = business.history
      .map(m => `${m.role === 'agent' ? 'You' : 'Client'}: ${m.content}`)
      .join('\n');

    const prompt = `You are a high-performance autonomous Sales Agent.
    Business: ${business.name} (${business.city})
    Objective: Secure a "Discovery Call" to build them a new website.
    Price Target: $2,500 USD.
    Timeline: 10 days.

    Conversation History:
    ${conversationHistory || "None (Initial outreach)"}

    ${incomingMessage ? `LATEST CLIENT REPLY: "${incomingMessage}"` : ""}

    GOAL: 
    - If initial, offer a modern upgrade.
    - If they ask about price/time, give the $2500/10-day figures confidently.
    - If they seem interested, suggest a specific time for a "Discovery Call" tomorrow at 10:00 AM.
    - KEEP IT SHORT (max 35 words).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Let's schedule a call to discuss your new website.";
  },

  /**
   * Simulates the business owner replying to the AI agent.
   */
  simulateClientReply: async (business: Business): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || (window as any).manualKey });

    const prompt = `You are a local business owner named ${business.name}. 
    You just received an outreach message about a new website. 
    Respond with a short message asking about the cost, or saying "Okay, tomorrow works for a call." 
    Be realistic and busy. Under 12 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Sounds interesting. How much does it cost?";
  },

  scanLocalBusinesses: async (city: string, keyword: string): Promise<Business[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || (window as any).manualKey });
    
    const prompt = `Find 5 local businesses in ${city} for "${keyword}" that have poor or no websites.
    Format:
    NAME: [Name]
    PHONE: [Phone]
    URL: [Website or None]
    ---NEXT---`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    try {
      const text = response.text || "";
      const entries = text.split("---NEXT---").filter(e => e.trim().length > 10);
      
      return entries.map((entry): Business => {
        const name = entry.match(/NAME:\s*(.*)/i)?.[1]?.trim() || "Unknown";
        const phone = entry.match(/PHONE:\s*(.*)/i)?.[1]?.trim() || "N/A";
        const websiteText = entry.match(/URL:\s*(.*)/i)?.[1]?.trim() || "None";
        
        return {
          id: Math.random().toString(36).substring(2, 9),
          name: name.replace(/^[\d.\s*-]+/, ''),
          city,
          phone,
          website: websiteText.toLowerCase().includes("none") ? null : websiteText,
          status: LeadStatus.DISCOVERED,
          history: [],
          timestamp: Date.now()
        };
      });
    } catch (e) {
      return [];
    }
  }
};
