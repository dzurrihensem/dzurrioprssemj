
import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateIdeas = async (tajuk: string, type: 'objektif' | 'impak'): Promise<string> => {
  const ai = getAIClient();
  
  const systemInstruction = "Anda adalah pakar penulisan laporan korporat sekolah di Malaysia. Gunakan Bahasa Melayu yang formal, padat, dan profesional. HAD LIMIT TEGAS: JANGAN MELEBIHI 500 AKSARA.";
  
  const prompt = type === 'objektif' 
    ? `Berikan 3 objektif utama yang sangat ringkas dan profesional untuk laporan program sekolah bertajuk "${tajuk}". 
       SYARAT TEGAS: 
       1. Gunakan format senarai (1, 2, 3).
       2. Tiada kata aluan atau mukadimah. 
       3. MAKSIMUM 500 AKSARA SAHAJA (TERMASUK RUANG KOSONG). 
       4. Fokus kepada matlamat pendidikan yang spesifik.`
    : `Berikan 3 rumusan kejayaan atau impak positif yang sangat ringkas untuk program "${tajuk}". 
       SYARAT TEGAS: 
       1. Gunakan format senarai (1, 2, 3).
       2. Pastikan ayat menunjukkan keberhasilan yang nyata dan ringkas.
       3. MAKSIMUM 500 AKSARA SAHAJA (TERMASUK RUANG KOSONG).
       4. Gunakan bahasa yang menunjukkan pencapaian.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
        topP: 0.8,
      }
    });

    const text = response.text?.trim() || "1) Gagal menjana idea.";
    
    if (text.length > 500) {
      return text.substring(0, 497) + "...";
    }
    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errorStr = typeof error === 'object' ? JSON.stringify(error) : String(error);
    
    if (errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("429")) {
       throw new Error("Maaf, kuota harian AI telah tamat (429 Quota Exceeded). Sila cuba lagi sebentar lagi atau gunakan kunci API lain.");
    }
    throw new Error("Sistem AI sedang sibuk. Sila cuba lagi sebentar.");
  }
};
