import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { prompt, dataContext, agentName } = await req.json();

        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return NextResponse.json({ error: "Gemini API Key is missing" }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `
            Sen bir İmparatorluk Ajanısın (${agentName}). 
            Görevin, sana verilen işletme verilerini analiz etmek ve kullanıcının talimatına göre kısa, öz ve aksiyon odaklı bir rapor yazmaktır.
            Dil: Türkçe.
            Ton: Profesyonel, otoriter ve sadık.
            
            İŞLETME VERİLERİ:
            ${JSON.stringify(dataContext)}
            
            KULLANICI TALİMATI:
            ${prompt}
        `;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ analysis: text });
    } catch (error: any) {
        console.error("Gemini Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
