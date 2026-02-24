const fs = require('fs');
const path = require('path');

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
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    console.log("Fetching available Gemini models...");

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.models) {
                console.log("\nAvailable Models:");
                data.models.forEach(model => {
                    console.log(`- ${model.name} (${model.version}) [Supported methods: ${model.supportedGenerationMethods.join(', ')}]`);
                });
            } else {
                console.log("No models found or error occurred:", data);
            }
        })
        .catch(error => {
            console.error("Fetch Error:", error);
            // Detaylı hata yazdırma
            if (error.cause) console.error("Cause:", error.cause);
        });

} catch (error) {
    console.error("Setup Error:", error.message);
}
