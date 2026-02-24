/**
 * GÃ¼nlÃ¼k besin toplamlarÄ±nÄ± hedeflerle analiz eder ve proaktif bir "Rebalance" iÃ§gÃ¶rÃ¼sÃ¼ sunar.
 */
export const getDailyInsight = (totals, targets, hour = new Date().getHours()) => {
    const { calories, protein, carbs, fat } = totals;
    const {
        target_calories,
        target_protein,
        target_carbs,
        target_fat
    } = targets;

    if (calories === 0) {
        return {
            type: 'info',
            title: 'Güne Merhaba! ✨',
            message: hour < 11 ? 'Harika bir kahvaltıyla güne dengeli başlamaya ne dersin?' : 'Henüz bir şey kaydetmedin, dengeli bir öğünle başlayalım!',
            icon: 'sunny',
            suggestedNextMeal: 'balanced'
        };
    }

    const calorieProgress = calories / target_calories;
    const proteinProgress = protein / target_protein;
    const carbsProgress = carbs / target_carbs;
    const fatProgress = fat / target_fat;

    // Sirkadiyen Ritim Notu: AkÅŸam saatlerinde (20:00+) sindirimi kolaylaÅŸtÄ±rmak Ã¶nemlidir.
    // Sirkadiyen Ritim Notu: Akşam saatlerinde (20:00+) sindirimi kolaylaştırmak önemlidir.
    const isLate = hour >= 20;

    // Vaka 1: Karbonhidratlar çok yüksek
    if (carbsProgress > calorieProgress + 0.15 && carbsProgress > 0.5) {
        return {
            type: 'warning',
            title: 'Karbonhidrat Dengesi ⚖️',
            message: 'Karbonhidratlar biraz önden gidiyor. Bir sonraki öğünde protein ve lif ağırlıklı ilerleyerek dengeyi kurabiliriz.',
            icon: 'scale',
            suggestedNextMeal: 'high-protein-low-carb'
        };
    }

    // Vaka 2: Yağ oranı yüksek
    if (fatProgress > calorieProgress + 0.15 && fatProgress > 0.5) {
        return {
            type: 'warning',
            title: 'Yağ Dengesi 🥑',
            message: 'Bugün yağ alımı hedefin üzerinde seyrediyor. Bir sonraki öğünde ızgara/haşlama ve bol sebze tercih etmek harika olur.',
            icon: 'leaf',
            suggestedNextMeal: 'low-fat-high-fiber'
        };
    }

    // Vaka 3: Protein eksik (Özellikle sporcular ve kas koruması için kritik)
    if (proteinProgress < calorieProgress - 0.2 && calorieProgress > 0.4) {
        return {
            type: 'info',
            title: 'Protein Desteği 💪',
            message: 'Enerjin yerinde ama kasların biraz protein bekliyor. Sonraki öğünde protein kaynağını artırmanı öneririm.',
            icon: 'fitness',
            suggestedNextMeal: 'high-protein'
        };
    }

    // Vaka 4: Akşam yemeği uyarısı (Sirkadiyen Ritim)
    if (isLate && calorieProgress < 0.9) {
        return {
            type: 'info',
            title: 'Hafif Kapanış 🌙',
            message: 'Saat epey ilerledi. Sindirimi yormamak için hafif ve protein ağırlıklı bir kapanış akşam uykuna iyi gelecektir.',
            icon: 'moon',
            suggestedNextMeal: 'light-protein'
        };
    }

    // Vaka 5: Mükemmel Denge
    if (calorieProgress < 0.95) {
        return {
            type: 'success',
            title: 'Dengedesin! 🌈',
            message: 'Şu ana kadar makroların ve kalorin harika bir uyum içinde. Bu çizgide devam et!',
            icon: 'checkmark-circle',
            suggestedNextMeal: 'balanced'
        };
    }

    // Vaka 6: Hedefe ulaşıldı
    return {
        type: 'success',
        title: 'Günü Tamamladın! 🏆',
        message: 'Bugünkü hedeflerine ulaştın. Vücudunu dinlendirip yarına hazırlanma vakti.',
        icon: 'trophy',
        suggestedNextMeal: 'fasting'
    };
};

/**
 * KullanÄ±cÄ± verilerine gÃ¶re gÃ¼nlÃ¼k kalori ve makro hedeflerini hesaplar.
 * Harris-Benedict formÃ¼lÃ¼ kullanÄ±lmÄ±ÅŸtÄ±r.
 */
export const calculateDailyTargets = (profile) => {
    const { weight, height, age, gender, activity_level, goal } = profile;

    // VarsayÄ±lan deÄŸerler (eÄŸer profil eksikse)
    if (!weight || !height || !age) return null;

    // 1. Bazal Metabolizma HÄ±zÄ± (BMR) Hesaplama
    let bmr;
    if (gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    // 2. Aktivite Ã‡arpanÄ±
    const activityMultipliers = {
        sedentary: 1.2,      // Masa baÅŸÄ±
        light: 1.375,       // Hafif egzersiz (haftada 1-3 gÃ¼n)
        moderate: 1.55,     // Orta egzersiz (haftada 3-5 gÃ¼n)
        active: 1.725,      // YoÄŸun egzersiz (haftada 6-7 gÃ¼n)
        very_active: 1.9    // Atletik seviye
    };

    let tdee = bmr * (activityMultipliers[activity_level] || 1.2);

    // 3. Hedefe GÃ¶re Kalori AyarÄ±
    if (goal === 'lose') tdee -= 500;
    else if (goal === 'gain') tdee += 500;

    const target_calories = Math.round(tdee);

    // 4. Makro DaÄŸÄ±lÄ±mÄ± (Standart Dengeli DaÄŸÄ±lÄ±m: %30 P, %40 C, %30 F)
    // Protein: 1.8g - 2.2g per kg (kilo baÅŸÄ±na)
    const target_protein = Math.round(weight * 2);
    const target_fat = Math.round((target_calories * 0.25) / 9);
    const target_carbs = Math.round((target_calories - (target_protein * 4) - (target_fat * 9)) / 4);

    return {
        target_calories,
        target_protein,
        target_carbs,
        target_fat
    };
};
