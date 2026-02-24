import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Puan Kazanma KurallarÄ±:
 * - Yemek KaydÄ±: 10 puan
 * - Su KaydÄ±: 5 puan
 * - GÃ¼nlÃ¼k Kalori Hedefini Tuturma (+/- 100): 50 puan
 * - Su Hedefine UlaÅŸma: 30 puan
 */

export const AWARD_TYPES = {
    FOOD_LOG: { points: 10, label: 'Besin KaydÄ±' },
    WATER_LOG: { points: 5, label: 'Su TÃ¼ketimi' },
    GOAL_REACHED: { points: 50, label: 'GÃ¼nlÃ¼k Hedef Uyumu' },
    WATER_GOAL: { points: 30, label: 'Su Hedefi' },
};

export const addPoints = async (typeKey) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const award = AWARD_TYPES[typeKey];
        if (!award) return;

        // 1. Supabase'deki profile gÃ¼ncelle
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', user.id)
            .single();

        if (fetchError) {
            console.error('Error fetching points:', fetchError);
            // EÄŸer tablo yapÄ±sÄ±nda 'points' yoksa sessizce devam et
            return;
        }

        const newPoints = (profile.points || 0) + award.points;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ points: newPoints })
            .eq('id', user.id);

        if (updateError) throw updateError;

        console.log(`Gamification: Awarded ${award.points} points for ${award.label}`);
        return newPoints;
    } catch (error) {
        console.error('Gamification: Error adding points:', error);
    }
};

export const checkBadges = async (stats) => {
    // Rozet mantÄ±ÄŸÄ± (AsyncStorage veya DB'de tutulabilir)
    // Ã–rn: 3 gÃ¼nlÃ¼k streak -> 'Continuous' rozeti
    // 5000+ toplam puan -> 'Elite' rozeti
    // Bu kÄ±sÄ±m ileride geniÅŸletilebilir.
};

export const getLevelInfo = (points) => {
    const level = Math.floor(points / 100) + 1;
    const pointsInLevel = points % 100;
    const progress = pointsInLevel / 100;

    return { level, progress, nextLevelPoints: 100 - pointsInLevel };
};
