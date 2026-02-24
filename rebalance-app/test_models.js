const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Try to get key from process.env or direct hardcoded check (user has it in .env usually but expo might handle it differently)
// Since we are running in node, we need to load .env manually or rely on the user having it in env vars.
// The user's package.json shows @google/generative-ai is installed.
// We'll assume EXPO_PUBLIC_GEMINI_API_KEY is available or we might need to ask user to check .env
// Wait, in React Native/Expo, .env is handled by Metro. In Node script, we need dotenv.
// Let's check if dotenv is installed. If not, this might fail if I don't see the key.
// I'll try to read the .env file directly if dotenv isn't there, or just assume the env var is set if I run with `env` command logic.

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Error: EXPO_PUBLIC_GEMINI_API_KEY is not set in environment variables.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        console.log("Fetching available models...");
        // Note: listModels might not be available in the public helper SDK in older versions, 
        // but let's try the generic way or just test a few specific ones.
        // Actually the SDK doesn't expose listModels directly on the instance usually, 
        // it's often a separate API call. 
        // Let's try to just generate content with a few candidates and report which one works.

        const candidates = [
            "gemini-2.0-flash-lite-preview-02-05",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-002",
            "gemini-1.5-flash-8b",
            "gemini-1.5-pro",
            "gemini-pro"
        ];

        for (const modelName of candidates) {
            process.stdout.write(`Testing ${modelName}... `);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                const response = await result.response;
                console.log("SUCCESS ✅");
            } catch (error) {
                if (error.message.includes("404")) {
                    console.log("NOT FOUND (404) ❌");
                } else if (error.message.includes("429")) {
                    console.log("RATE LIMITED (429) ⚠️ (But model exists)");
                } else {
                    console.log(`FAILED (${error.message}) ❌`);
                }
            }
        }

    } catch (error) {
        console.error("Fatal Error:", error);
    }
}

listModels();
