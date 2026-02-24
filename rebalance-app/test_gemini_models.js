const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// .env dosyasını manuel oku
try {
    const envPath = path.resolve(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/EXPO_PUBLIC_GEMINI_API_KEY=(.*)/);

    if (!match) {
        console.error("API Key .env dosyasında bulunamadı!");
        process.exit(1);
    }

    const API_KEY = match[1].trim();
    const genAI = new GoogleGenerativeAI(API_KEY);

    const modelsToTest = [
        { model: "gemini-1.5-flash", apiVersion: "v1beta" },
        { model: "gemini-1.5-flash", apiVersion: undefined }, // Default (v1)
        { model: "gemini-1.5-flash-latest", apiVersion: "v1beta" },
        { model: "gemini-1.5-flash-001", apiVersion: "v1beta" },
        { model: "gemini-1.5-flash-002", apiVersion: "v1beta" },
        { model: "gemini-1.5-flash-8b", apiVersion: "v1beta" }
    ];

    console.log("Gemini Model Availability Test Started...\n");

    async function testModel(config) {
        const modelName = config.model;
        const apiVersion = config.apiVersion || "default (v1)";

        console.log(`Testing: ${modelName} [API: ${apiVersion}]...`);

        try {
            const model = genAI.getGenerativeModel(
                { model: modelName },
                config.apiVersion ? { apiVersion: config.apiVersion } : undefined
            );

            const result = await model.generateContent("Test");
            const response = await result.response;
            console.log(`✅ SUCCESS: ${modelName} [API: ${apiVersion}]`);
            return true;
        } catch (error) {
            console.log(`❌ FAILED: ${modelName} [API: ${apiVersion}] - Error: ${error.message.split('\n')[0]}`);
            return false;
        }
    }

    (async () => {
        for (const config of modelsToTest) {
            await testModel(config);
        }
    })();

} catch (error) {
    console.error("Setup Error:", error.message);
}
