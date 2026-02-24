import { GoogleGenerativeAI } from "@google/generative-ai";
import { CONFIG } from '../constants/config';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || CONFIG.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * AI Modeli için yapılandırmayı döndürür.
 */
function getModel() {
    return genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
    }, { apiVersion: 'v1beta' });
}

/**
 * Yardımcı: Promise'i belirli bir süre sonra sonlandırır.
 */
const withTimeout = (promise, ms = 15000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI_TIMEOUT")), ms)
        )
    ]);
};

/**
 * Fotoğraflardan yiyecek analizi yapar.
 */
export async function analyzeFoodImage(base64Data) {
    console.log("AI Service: Starting Image Analysis (Gemini Flash Latest)...");
    try {
        const model = getModel();

        const prompt = `
            Analyze this image and identify the main food/meal. 
            Response MUST be a single JSON object. Return ONLY raw JSON.
            
            Important: 
            1. Estimates must be for the ENTIRE portion shown. 
            2. If portion size is unclear, assume a standard adult portion but look for cues (hand, plate size).
            3. Provide Nutrients in Turkish names for the JSON keys if applicable, but keep structure:
            {
                "name": "Yemek adÄ± (Turkish)",
                "calories": 400,
                "protein": 20,
                "carbs": 45,
                "fat": 15,
                "confidence": "high/medium/low"
            }
            Return ONLY the raw JSON.
        `;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
            },
        };

        const result = await withTimeout(model.generateContent([prompt, imagePart]), 20000); // 20s for image
        const response = await result.response;
        const text = response.text();
        console.log("AI Service: Gemini Raw Response:", text);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("GeÃ§erli bir JSON yanÄ±tÄ± alÄ±namadÄ±");
    } catch (error) {
        handleAiError(error);
    }
}

/**
 * Metinden yiyecek analizi yapar.
 */
export async function analyzeFoodText(transcript) {
    console.log("AI Service: Starting Text Analysis (Gemini Flash Latest) for:", transcript);
    try {
        const model = getModel();

        const prompt = `
            The user says they ate: "${transcript}"
            Analyze this and estimate nutritional values.
            Response MUST be a single JSON object. Return ONLY raw JSON. No markdown.
            
            Important Rules:
            1. Estimates must be for the ENTIRE portion mentioned.
            2. If portion size is specified (e.g., "büyük porsiyon", "yarım ekmek", "az pilav"), adjust the nutrition values accordingly.
            3. If portion is ambiguous, assume a standard single serving but consider qualifiers like "bir tabak" vs "bir kase".
            
            JSON structure:
            {
                "name": "Yemek adÄ± (Turkish)",
                "calories": 400,
                "protein": 20,
                "carbs": 45,
                "fat": 15
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("AI Service: Gemini Raw Response:", text);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("GeÃ§erli bir JSON yanÄ±tÄ± alÄ±namadÄ±");
    } catch (error) {
        handleAiError(error);
    }
}

/**
 * Metinden her türlü girdiyi (yemek veya su) analiz eder.
 */
export async function analyzeGenericInput(transcript) {
    console.log("AI Service: Analyzing Generic Input:", transcript);
    try {
        const model = getModel();

        const prompt = `
            Analyze this input: "${transcript}"
            Is the user logging food/meal or water intake?
            
            Response MUST be a single JSON object. Return ONLY raw JSON.
            
            If it's WATER:
            {
                "type": "water",
                "amount": 500 (in ml, extract from text: "1 litre" -> 1000, "yarım litre" -> 500, "bir bardak" -> 250, "büyük şişe" -> 1500)
            }
            
            If it's FOOD:
            {
                "type": "food",
                "data": {
                    "name": "Yemek adı (Turkish)",
                    "calories": 400,
                    "protein": 20,
                    "carbs": 45,
                    "fat": 15,
                    "portion_desc": "Estimating for [detected portion size]"
                }
            }
            
            Key Priority: Correctly identify qualifiers like "az", "yarım", "double", "xl" to adjust calorie/macro values.
        `;

        const result = await withTimeout(model.generateContent(prompt), 15000); // 15s timeout
        const response = await result.response;
        const text = response.text();
        console.log("AI Service: Generic Response:", text);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("GeÃ§erli bir JSON yanÄ±tÄ± alÄ±namadÄ±");
    } catch (error) {
        handleAiError(error);
    }
}

/**
 * Günlük verileri analiz edip dostane bir 'Rebalance' önerisi sunar.
 */
export async function getDailyCoachInsight(dailyData, currentTime, rebalanceInsight) {
    console.log("AI Service: Generating Premium Coach Insight...");
    try {
        const model = getModel();

        const { totals, targetCalories, targetMacros } = dailyData;

        const prompt = `
            Sen 'Rebalance Coach' yapay zeka asistanısın. Görevin kullanıcıyı suçlamadan, dengeleyici (rebalance) tavsiyeler vermek.
            
            Şu anki Yerel Saat: ${currentTime}
            Kullanıcının Bugünkü Durumu:
            - Alınan Kalori: ${totals.calories} kcal (Hedef: ${targetCalories})
            - Protein: ${totals.protein}g (Hedef: ${targetMacros.protein}g)
            - Karbonhidrat: ${totals.carbs}g (Hedef: ${targetMacros.carbs}g)
            - Yağ: ${totals.fat}g (Hedef: ${targetMacros.fat}g)
            
            Sistem Analizi (rebalanceInsight):
            - Durum: ${rebalanceInsight.title}
            - Mesaj: ${rebalanceInsight.message}
            - Önerilen Sonraki Öğün Stratejisi: ${rebalanceInsight.suggestedNextMeal}
            
            Önemli Yönergeler:
            1. Sirkadiyen Ritim: Eğer saat geçse (20:00+), sindirimi zorlamayacak (hafif protein veya sıvı ağırlıklı) tavsiyeler ver. Eğer sabahsa güne enerjik başlama tavsiyeleri ver.
            2. Rebalance: Kullanıcı bir makroda aşırıya kaçtıysa, bir sonraki öğünde bunu nasıl telafi edebileceğini nazikçe söyle.
            3. Tonlama: Profesyonel ama çok dostane ve motive edici ol.
            
            Yanıtın TÜRKÇE, en fazla 2 kısa cümle ve sadece düz metin olmalı. Markdown kullanma.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Coach Insight Error:", error);
        return "Bugün dengeli beslenmeye odaklanmaya devam et. Her küçük adım bir başarıdır! ✨";
    }
}

/**
 * Haftalık verileri analiz edip denge raporu sunar.
 */
export async function getWeeklyStatusInsight(weeklyData, targetCalories) {
    console.log("AI Service: Generating Weekly Insight...");
    try {
        const model = getModel();

        const summary = weeklyData.map(d => `${d.label}: ${d.calories} kcal`).join(', ');

        const prompt = `
            You are 'Rebalance Coach'. Analyze this user's last 7 days of calorie intake.
            Weekly Data: ${summary}
            Daily Target: ${targetCalories} kcal
            
            Write a professional yet friendly summary in Turkish.
            Highlight the consistencies or suggest areas for minor 'rebalance'.
            Return ONLY the text. Max 3 sentences.
        `;

        const result = await withTimeout(model.generateContent(prompt), 12000); // 12 second timeout
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Weekly Insight Error:", error);
        if (error.message === "AI_TIMEOUT") {
            return "Analiz biraz uzun sürdü, ancak genel dengenizi korumaya devam edin! Grafiklerden durumunuza göz atabilirsiniz. ✨";
        }
        if (error.message?.includes("429") || error.message?.includes("quota")) {
            return "Haftalık AI kotan dolmuş görünüyor. Grafikten genel durumuna bakabilirsin, yorumum yarın tazelenmiş olacak! 📈";
        }
        return "Haftalık verilerinizi analiz ederken bir sorun oluştu, ancak genel dengenizi korumaya devam edin! ✨";
    }
}

/**
 * Kalan kalori ve makrolara göre bir sonraki öğün için yemek önerisi yapar.
 */
export async function suggestNextMeal(remainingCalories, remainingMacros, mealTime) {
    try {
        const model = getModel();
        const prompt = `Sen bir TÃ¼rk diyet koÃ§usun. KullanÄ±cÄ±nÄ±n bugÃ¼n kalan beslenme durumu:

- Kalan Kalori: ${remainingCalories} kcal
- Kalan Protein: ${remainingMacros.protein}g
- Kalan Karbonhidrat: ${remainingMacros.carbs}g
- Kalan YaÄŸ: ${remainingMacros.fat}g
- Ã–ÄŸÃ¼n ZamanÄ±: ${mealTime}

LÃ¼tfen bu kalan deÄŸerlere uygun, TÃ¼rk mutfaÄŸÄ±ndan da Ã¶rnekler iÃ§eren, gerÃ§ekÃ§i ve evin mutfaÄŸÄ±nda yapÄ±labilecek bir yemek Ã–NER.

Ã–NEMLÄ° KURALLAR:
- Sporcu Ã¶nerisi YAPMA, normal gÃ¼nlÃ¼k beslenme Ã¶ner
- KÄ±sa ve net ol (max 3 cÃ¼mle)
- Ã–neriyi emoji ile sÃ¼sle
- Yemek adÄ±nÄ± ve tahmini kalorisini belirt
- Sadece 1 yemek Ã¶ner, karmaÅŸÄ±k kombinasyon yapma

Format: "ğŸ½ [Yemek AdÄ±] (~[kalori] kcal) â€” [kÄ±sa aÃ§Ä±klama]"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        if (error.message?.includes('429') || error.message?.includes('quota')) {
            return "ÄŸŸ½ AI koÃ§unuz ÅŸu an yoÄŸun, birazdan tekrar deneyin!";
        }
        return "🍽️ Dengeli bir porsiyon tercih etmenizi öneriyorum!";
    }
}

/**
 * Malzemelere ve kalan besin değerlerine göre detaylı bir tarif oluşturur.
 */
export async function generateRecipeFromIngredients(ingredients, remainingCalories, remainingMacros) {
    console.log("AI Service: Generating Recipe from ingredients...");
    try {
        const model = getModel();
        const prompt = `
            Sen profesyonel bir Türk mutfağı şefi ve diyetisyensin.
            Kullanıcının elindeki malzemeler: "${ingredients}"
            Bugün kalan beslenme bütçesi: ${remainingCalories} kcal, ${remainingMacros.protein}g Protein, ${remainingMacros.carbs}g Karbonhidrat, ${remainingMacros.fat}g Yağ.
            
            Bu malzemeleri kullanarak (ve mutfakta bulunan temel malzemeleri -yağ, tuz, baharat- varsayarak) bir tarif oluştur.
            
            Kurallar:
            1. Tarif kalan kalori ve makrolara mümkün olduğunca UYGUN olmalı.
            2. Türkçe dilinde, iştah açıcı bir tonla yaz.
            3. Yanıt formatı mutlaka bir JSON objesi olmalı. Başka hiçbir metin ekleme.
            
            JSON Yapısı:
            {
                "title": "Tarif Adı",
                "calories": 350,
                "protein": 15,
                "carbs": 40,
                "fat": 12,
                "ingredients": ["malzeme 1", "malzeme 2"...],
                "instructions": ["1. adım", "2. adım"...],
                "tips": "Kısa bir şef tavsiyesi"
            }
        `;

        const result = await withTimeout(model.generateContent(prompt), 25000);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Tarif formatı anlaşılamadı.");
    } catch (error) {
        handleAiError(error);
    }
}

/**
 * Detaylı haftalık rapor için AI analizi oluşturur.
 */
export async function generateWeeklyAiSummary(weeklyData, targetCalories, userProfile) {
    console.log("AI Service: Generating Detailed Weekly Summary for PDF...");
    try {
        const model = getModel();
        const dataSummary = weeklyData.map(d => `${d.label}: ${d.calories} kcal, ${d.water}ml su`).join(' | ');

        const prompt = `
            Sen 'Rebalance' sistemi uzmanısın. Kullanıcının haftalık beslenme ve su verilerini analiz edip profesyonel bir PDF raporu özeti hazırla.
            
            Kullanıcı Bilgileri: ${userProfile.full_name || 'Abdul'}
            Hedef Kalori: ${targetCalories} kcal
            Haftalık Veriler: ${dataSummary}
            
            Rapor Yapısı (TÜRKÇE):
            1. Genel Performans: Haftanın genel özeti (Pozitif ve motive edici).
            2. Denge Analizi: Kalori ve su hedeflerine uyum durumu.
            3. Gelecek Hafta İçin 3 Kritik Tavsiye: Somut ve uygulanabilir adımlar.
            
            Yanıtın profesyonel, yapılandırılmış ve dostane bir dille olmalı. Markdown formatında başlıklarla yazabilirsin.
        `;

        const result = await withTimeout(model.generateContent(prompt), 20000);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Weekly Summary Error:", error);
        return "Haftan genel olarak dengeli geçti. Gelecek hafta su tüketimine ve düzenli kayıt tutmaya odaklanarak ilerlemeni sürdürebilirsin. Denge her şeydir! ✨";
    }
}

/**
 * Hataları merkezi olarak yönetir ve kullanıcı dostu mesajlar döner.
 */
function handleAiError(error) {
    console.error("AI Service Error:", error);

    const errorMsg = error.message || "";

    if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        throw new Error("AI çok yoğun! 🤖 Günlük limitinize ulaştınız. Lütfen yarın tekrar deneyin veya bir süre sonra tekrar uğrayın.");
    }

    if (errorMsg.includes('404')) {
        throw new Error("Model bulunamadı. Lütfen API ayarlarını kontrol edin.");
    }

    throw new Error("Hata: " + errorMsg);
}
