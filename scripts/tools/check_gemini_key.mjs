import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkApiKey() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log("❌ Error: GEMINI_API_KEY is not set in .env.local");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello, confirm you are alive." }] }]
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log("✅ API Key is VALID!");
            console.log("Response:", data.candidates?.[0]?.content?.parts?.[0]?.text);
        } else {
            console.log("❌ API Key ERROR:", data.error?.message);
            console.log("Full Error:", JSON.stringify(data.error, null, 2));
        }
    } catch (err) {
        console.log("❌ Network Error:", err.message);
    }
}

checkApiKey();
