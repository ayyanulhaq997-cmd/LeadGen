
import { GoogleGenAI } from "@google/genai";
import { Business, LeadStatus } from "../types.ts";

export const geminiService = {
  /**
   * Sales Agent AI: This is YOUR agent. It only speaks for you.
   * It analyzes the conversation and automatically sends the next best move.
   */
  generateAgentResponse: async (business: Business, incomingMessage?: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || (window as any).manualKey });

    const conversationHistory = business.history
      .map(m => `${m.role === 'agent' ? 'Sales Agent' : 'Manager'}: ${m.content}`)
      .join('\n');

    const prompt = `You are an expert Sales Assistant working for a web agency.
    Business Name: ${business.name}
    Business Location: ${business.city}
    Current Status: ${business.status}

    Conversation History:
    ${conversationHistory || "No messages sent yet."}

    ${incomingMessage ? `THE MANAGER JUST REPLIED: "${incomingMessage}"` : "This is the initial outreach."}

    GOAL:
    1. If this is the FIRST message, offer to upgrade their website/SEO for their ${business.city} business.
    2. If the manager is asking about price, stick to $2,500 with a 10-day turnaround.
    3. If they are interested, suggest a Discovery Call tomorrow at 10 AM.
    4. Be professional, high-end, and extremely concise (max 30 words).
    5. NEVER speak as the manager. Only as the agent.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Hi, I'd love to discuss upgrading your website. Do you have 10 minutes tomorrow?";
  },

  scanLocalBusinesses: async (city: string, keyword: string): Promise<Business[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || (window as any).manualKey });
    
    const prompt = `Find 5 local businesses in ${city} for "${keyword}" that need better websites.
    Format exactly like this:
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
