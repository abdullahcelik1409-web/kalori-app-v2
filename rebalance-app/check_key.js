require('dotenv').config();

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

console.log("Checking API Key...");
if (!apiKey) {
    console.log("❌ API KEY IS MISSING or EMPTY");
} else {
    console.log(`✅ API Key found (Length: ${apiKey.length})`);
    console.log(`Starts with: ${apiKey.substring(0, 4)}...`);
}
