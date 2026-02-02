
import { GoogleGenAI } from "@google/genai";
import { Business, LeadStatus } from "../types.ts";

export const geminiService = {
  /**
   * Scan for local businesses using Google Maps Grounding.
   */
  scanLocalBusinesses: async (city: string, keyword: string): Promise<Business[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let toolConfig = undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }
        }
      };
    } catch (e) {
      console.debug("Geolocation not available or denied", e);
    }

    const prompt = `Find 5 local businesses in ${city} for the category "${keyword}". 
    For each business, provide:
    1. Name
    2. Phone number
    3. Official website URL (if they have one, otherwise "None")
    4. Assessment: Does the website look modern or outdated? (If no website, say "None").
    
    Format the output as a clear list where each business entry starts with "BUSINESS_ENTRY:".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig,
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const mapsUrls = groundingChunks
      .filter((chunk: any) => chunk.maps?.uri)
      .map((chunk: any) => chunk.maps.uri);

    try {
      const text = response.text || "";
      const sections = text.split(/BUSINESS_ENTRY:/i).filter(s => s.trim().length > 10);
      
      return sections.map((section, index): Business => {
        const nameMatch = section.match(/(?:Name|BUSINESS_ENTRY):\s*(.*)/i);
        const name = nameMatch ? nameMatch[1].replace(/^[\d.\s*-]+/, '').trim() : "Unknown Business";
        
        const phoneMatch = section.match(/Phone:\s*(.*)/i);
        const phone = phoneMatch ? phoneMatch[1].trim() : "N/A";
        
        const websiteMatch = section.match(/Website:\s*(.*)/i);
        const websiteText = websiteMatch ? websiteMatch[1].trim() : "None";
        
        const assessmentMatch = section.match(/Assessment:\s*(.*)/i);
        const assessment = assessmentMatch ? assessmentMatch[1].trim() : "";

        let status = LeadStatus.COLD;
        if (!websiteText || websiteText.toLowerCase() === "none" || websiteText.toLowerCase() === "null") {
          status = LeadStatus.HOT;
        } else if (assessment.toLowerCase().includes("outdated") || assessment.toLowerCase().includes("bad") || assessment.toLowerCase().includes("old")) {
          status = LeadStatus.WARM;
        }

        return {
          id: Math.random().toString(36).substring(2, 9),
          name,
          city,
          phone,
          website: (websiteText.toLowerCase() === "none" || websiteText === "") ? null : websiteText,
          mapsUrl: mapsUrls[index] || undefined,
          status,
          timestamp: Date.now()
        };
      });
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      return [];
    }
  },

  /**
   * Generate a personalized outreach message using Gemini 3 Flash.
   */
  generateMessage: async (business: Business): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Generate a short, professional, and highly converting outreach message for a local business owner.
    Business Name: ${business.name}
    City: ${business.city}
    Lead Status: ${business.status} (HOT = No website, WARM = Needs improvement)
    
    Rule: Keep it under 60 words. Mention how a better web presence can bring more local customers. Do not include subject lines, just the message body.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Hi, I noticed your business could benefit from a new website. Let's chat!";
  }
};
