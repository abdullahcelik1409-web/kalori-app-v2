import { supabase } from '../../lib/supabase';
import { addPoints } from './gamificationService';

/**
 * Fetches all nutrition and water data for a specific date range (usually one day)
 * and the user's profile settings.
 */
export const fetchDailyData = async (dateStr) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Start and end of the day in ISO format
        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateStr);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Fetch Profile (Goals)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) throw profileError;

        // 2. Fetch Meals
        const { data: meals, error: mealsError } = await supabase
            .from('meals')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString());

        if (mealsError) throw mealsError;

        // 3. Fetch Water
        const { data: waterLogs, error: waterError } = await supabase
            .from('water_logs')
            .select('amount_ml')
            .eq('user_id', user.id)
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString());

        if (waterError) throw waterError;

        const totalWaterMl = waterLogs.reduce((acc, log) => acc + log.amount_ml, 0);

        return {
            profile,
            meals,
            totalWaterMl
        };
    } catch (error) {
        console.error('Error fetching daily data:', error);
        throw error;
    }
};

/**
 * Logs food intake to Supabase
 */
export const logFoodEntry = async (mealData) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('meals')
            .insert([{
                user_id: user.id,
                ...mealData,
                // Ensure created_at matches the selected date if provided
                ...(mealData.date ? { created_at: new Date(mealData.date).toISOString() } : {})
            }])
            .select();

        if (error) throw error;

        // Puan ekle
        addPoints('FOOD_LOG');

        return data[0];
    } catch (error) {
        console.error('Error logging food:', error);
        throw error;
    }
};

/**
 * Logs water intake to Supabase
 */
export const logWaterEntry = async (amountMl, customDate = null) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('water_logs')
            .insert([{
                user_id: user.id,
                amount_ml: amountMl,
                // If customDate is provided, use it (assumed to be YYYY-MM-DD)
                ...(customDate ? { created_at: new Date(customDate).toISOString() } : {})
            }]);

        if (error) throw error;
    } catch (error) {
        console.error('Error logging water:', error);
        throw error;
    }
};

/**
 * Removes the most recent water log entry (undo/decrement)
 */
export const removeLastWaterEntry = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Find the latest entry for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { data: latestEntry, error: fetchError } = await supabase
            .from('water_logs')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', startOfDay.toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        if (!latestEntry) return;

        const { error: deleteError } = await supabase
            .from('water_logs')
            .delete()
            .eq('id', latestEntry.id);

        if (deleteError) throw deleteError;
    } catch (error) {
        console.error('Error removing water log:', error);
        throw error;
    }
};

/**
 * Fetches nutrition and water data for the last 7 days.
 */
export const fetchWeeklyData = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        // 1. Fetch Meals
        const { data: meals, error: mealsError } = await supabase
            .from('meals')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (mealsError) throw mealsError;

        // 2. Fetch Water
        const { data: waterLogs, error: waterError } = await supabase
            .from('water_logs')
            .select('amount_ml, created_at')
            .eq('user_id', user.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (waterError) throw waterError;

        // Group data by day
        const weeklyData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const isoDate = d.toISOString().split('T')[0];
            const displayLabel = d.toLocaleDateString('tr-TR', { weekday: 'short' });

            const dayMeals = meals.filter(m => m.created_at.startsWith(isoDate));
            const dayWater = waterLogs
                .filter(w => w.created_at.startsWith(isoDate))
                .reduce((acc, log) => acc + log.amount_ml, 0);

            weeklyData.push({
                date: isoDate,
                label: displayLabel,
                calories: dayMeals.reduce((acc, m) => acc + (m.calories || 0), 0),
                water: dayWater
            });
        }

        return weeklyData;
    } catch (error) {
        console.error('Error fetching weekly data:', error);
        throw error;
    }
};

/**
 * Bir yemek kaydÄ±nÄ± siler.
 */
export const deleteFoodEntry = async (mealId) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('meals')
            .delete()
            .eq('id', mealId)
            .eq('user_id', user.id);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting food entry:', error);
        throw error;
    }
};

/**
 * KullanÄ±cÄ±nÄ±n kaÃ§ gÃ¼n Ã¼st Ã¼ste kalori kaydettiÄŸini hesaplar (streak).
 */
export const fetchStreak = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        // Son 60 gÃ¼nlÃ¼k verileri Ã§ek
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 60);
        startDate.setHours(0, 0, 0, 0);

        const { data: meals, error } = await supabase
            .from('meals')
            .select('created_at')
            .eq('user_id', user.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        if (error) throw error;

        // Hangi gÃ¼nlerde kayÄ±t var?
        const daysWithMeals = new Set();
        meals.forEach(m => {
            daysWithMeals.add(new Date(m.created_at).toDateString());
        });

        // BugÃ¼nden geriye doÄŸru streak hesapla
        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 60; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);

            if (daysWithMeals.has(checkDate.toDateString())) {
                streak++;
            } else {
                // BugÃ¼n henÃ¼z kayÄ±t yoksa streak'i kÄ±rma, dÃ¼nden devam et
                if (i === 0) continue;
                break;
            }
        }

        return streak;
    } catch (error) {
        console.error('Error fetching streak:', error);
        return 0;
    }
};

/**
 * Ã–ÄŸÃ¼nleri sirkadiyen ritim analizi iÃ§in zaman dilimlerine gÃ¶re gruplar.
 */
export const groupMealsByTime = (meals) => {
    const periods = {
        morning: [],    // 05:00 - 11:00
        afternoon: [],  // 11:00 - 17:00
        evening: [],    // 17:00 - 21:00
        night: []       // 21:00 - 05:00
    };

    meals.forEach(meal => {
        const hour = new Date(meal.created_at).getHours();
        if (hour >= 5 && hour < 11) periods.morning.push(meal);
        else if (hour >= 11 && hour < 17) periods.afternoon.push(meal);
        else if (hour >= 17 && hour < 21) periods.evening.push(meal);
        else periods.night.push(meal);
    });

    return periods;
};
