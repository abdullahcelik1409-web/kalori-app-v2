const https = require('https');
require('dotenv').config();

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Error: EXPO_PUBLIC_GEMINI_API_KEY is not set.");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log(`Querying: https://generativelanguage.googleapis.com/v1beta/models?key=HIDDEN`);

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const response = JSON.parse(data);
                if (response.models) {
                    console.log("\n✅ AVAILABLE MODELS FOR YOUR KEY:");
                    response.models.forEach(model => {
                        // Filter for Gemini models to keep it relevant
                        if (model.name.includes("gemini")) {
                            console.log(`- ${model.name.replace('models/', '')} (${model.displayName})`);
                        }
                    });
                } else {
                    console.log("No models found in response.");
                    console.log(data);
                }
            } catch (e) {
                console.error("Error parsing JSON:", e);
            }
        } else {
            console.error(`Request Failed. Status Code: ${res.statusCode}`);
            console.error("Response:", data);
        }
    });

}).on("error", (err) => {
    console.error("Error: ", err.message);
});
