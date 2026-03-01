import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Modal, FlatList, Alert, ActivityIndicator, TextInput, Animated, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { LIGHT_COLORS, DARK_COLORS, SIZES, FONTS, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { fetchDailyData, logFoodEntry, logWaterEntry, removeLastWaterEntry, fetchWeeklyData, deleteFoodEntry, fetchStreak } from '../services/dataService';
import { getDailyInsight } from '../utils/rebalanceLogic';
import { searchFood, fetchFoodByBarcode } from '../services/nutritionService';
import * as aiService from '../services/aiService';
import { requestNotificationPermissions, scheduleDailyCoachNotification } from '../services/notificationService';
import { generateWeeklyReport } from '../services/pdfService';
import { getLevelInfo } from '../services/gamificationService';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAudioRecorder, RecordingPresets, setAudioModeAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import AnimatedButton from '../components/AnimatedButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getStyles from './DashboardScreen.styles';

const INITIAL_MEALS = [
    { id: 1, name: 'Breakfast', calories: 0, icon: 'sunny-outline', color: '#F59E0B' },
    { id: 2, name: 'Lunch', calories: 0, icon: 'restaurant-outline', color: '#EF4444' },
    { id: 3, name: 'Dinner', calories: 0, icon: 'moon-outline', color: '#8B5CF6' },
    { id: 4, name: 'Snacks', calories: 0, icon: 'cafe-outline', color: '#10B981' },
];

export default function DashboardScreen() {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const theme = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
    const styles = getStyles(theme);

    const [date, setDate] = useState(new Date().toDateString());
    const [meals, setMeals] = useState([]); // Will be populated from Supabase
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMealId, setSelectedMealId] = useState(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Gram input step
    const [selectedFood, setSelectedFood] = useState(null);
    const [gramInput, setGramInput] = useState('100');
    const [modalStep, setModalStep] = useState('search'); // 'search' or 'gram'

    // Water state
    const [waterMl, setWaterMl] = useState(0);
    const [waterModalVisible, setWaterModalVisible] = useState(false);
    const [customWaterInput, setCustomWaterInput] = useState('');

    // Profile / Targets state
    const [userProfile, setUserProfile] = useState({
        target_calories: 2000,
        target_water_ml: 2000,
        target_protein: 150,
        target_carbs: 200,
        target_fat: 65
    });

    // AI State
    const [loading, setLoading] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [aiModalVisible, setAiModalVisible] = useState(false);
    const [coachInsight, setCoachInsight] = useState("Verilerin yükleniyor, koçun birazdan burada olacak...");
    const [isCoachLoading, setIsCoachLoading] = useState(false);
    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const [isRecording, setIsRecording] = useState(false);
    const [manualAiModalVisible, setManualAiModalVisible] = useState(false);
    const [manualAiInput, setManualAiInput] = useState('');
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Trends State
    const [weeklyModalVisible, setWeeklyModalVisible] = useState(false);
    const [weeklyData, setWeeklyData] = useState([]);
    const [weeklyInsight, setWeeklyInsight] = useState("");
    const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);

    // === YENÄ° Ã–ZELLÄ°KLER ===
    // Streak
    const [streak, setStreak] = useState(0);

    // Favori Yemekler
    const [favorites, setFavorites] = useState([]);
    const [showFavorites, setShowFavorites] = useState(false);

    // GeniÅŸletilmiÅŸ Ã¶ÄŸÃ¼n (yemek listesi gÃ¶rme/silme)
    const [expandedMeal, setExpandedMeal] = useState(null);

    // AI Yemek Ã–nerisi
    const [mealSuggestion, setMealSuggestion] = useState(null);
    const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
    const [suggestionModalVisible, setSuggestionModalVisible] = useState(false);

    // Barcode state
    const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    // Recipe Generator State
    const [recipeModalVisible, setRecipeModalVisible] = useState(false);
    const [ingredientsInput, setIngredientsInput] = useState('');
    const [generatedRecipe, setGeneratedRecipe] = useState(null);
    const [isRecipeLoading, setIsRecipeLoading] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 800,
                        useNativeDriver: false,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: false,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording]);

    const targetCalories = userProfile.target_calories;
    const waterTargetMl = userProfile.target_water_ml;
    const targetMacros = {
        protein: userProfile.target_protein,
        carbs: userProfile.target_carbs,
        fat: userProfile.target_fat,
    };

    // Calculate totals for calories and macros from the meals fetched from Supabase
    // Note: meals state will now be an array of food objects directly from DB
    const totals = meals.reduce((acc, meal) => {
        return {
            calories: acc.calories + (meal.calories || 0),
            protein: acc.protein + (meal.protein || 0),
            carbs: acc.carbs + (meal.carbs || 0),
            fat: acc.fat + (meal.fat || 0)
        };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const consumedCalories = totals.calories;
    const remainingCalories = targetCalories - consumedCalories;
    const progress = Math.min(consumedCalories / targetCalories, 1);

    const insight = getDailyInsight(totals, userProfile);


    // Animation values
    const calorieAnim = useRef(new Animated.Value(0)).current;
    const proteinAnim = useRef(new Animated.Value(0)).current;
    const carbsAnim = useRef(new Animated.Value(0)).current;
    const fatAnim = useRef(new Animated.Value(0)).current;



    useEffect(() => {
        const loadCoachInsight = async () => {
            // Sadece veriler yüklendikten ve meals varsa çalıştır
            if (!loading && userProfile && !isCoachLoading) {
                // Ön kontrol: Eğer data boşsa (0 kalori) ve daha önce cache varsa onu göster ama API'ye gitme
                // Sirkadiyen Ritim Notu: Akşam saatlerinde (20:00+) sindirimi kolaylaştırmak önemlidir.

                try {
                    // Caching Anahtarı oluştur (Tarih + Toplam Kalori + Insight Başlığı)
                    // Hata durumunda (429) cache'den dönmek hayat kurtarır.
                    const cacheKey = `coach_insight_${date}_v2`;
                    const cachedData = await AsyncStorage.getItem(cacheKey);

                    // Önceki durumu kontrol et (Veri değişmediyse API çağırma)
                    if (cachedData) {
                        const { timestamp, insight, lastTotals } = JSON.parse(cachedData);

                        const totalsChanged = JSON.stringify(totals) !== JSON.stringify(lastTotals);
                        const isRecent = (Date.now() - timestamp) < 15 * 60 * 1000; // 15 dakika

                        // Eğer veri değişmediyse VE (henüz süre dolmadıysa VEYA data aynıysa)
                        if (!totalsChanged || isRecent) {
                            console.log("Dashboard: Using cached Coach Insight (No API call needed)");
                            setCoachInsight(insight);
                            // Veri değişmiş olsa bile, çok sık (1 dakikadan az) güncelleme yapma
                            if (totalsChanged && (Date.now() - timestamp) < 60 * 1000) {
                                return;
                            }
                            if (!totalsChanged) return;
                        }
                    }

                    setIsCoachLoading(true);
                    const coachResponse = await aiService.getDailyCoachInsight({
                        totals,
                        targetCalories,
                        targetMacros
                    }, new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), insight);

                    setCoachInsight(coachResponse);

                    // Önbelleğe kaydet
                    await AsyncStorage.setItem(cacheKey, JSON.stringify({
                        timestamp: Date.now(),
                        insight: coachResponse,
                        lastTotals: totals
                    }));

                } catch (error) {
                    console.error("Coach Update Error:", error);
                    setCoachInsight("Åu an biraz yoÄŸunum, lÃ¼tfen birazdan tekrar dene. ğŸ¤–");
                } finally {
                    setIsCoachLoading(false);
                }
            }
        };

        // Veri değişiminden 2 saniye sonra koçu tetikle (Debounce artırıldı)
        const timeoutId = setTimeout(loadCoachInsight, 2000);
        return () => clearTimeout(timeoutId);
    }, [meals, userProfile, insight]); // waterMl removed, added insight dependency

    // Favorileri AsyncStorage'dan yükle
    useEffect(() => {
        const loadFavorites = async () => {
            try {
                const stored = await AsyncStorage.getItem('favorite_foods');
                if (stored) setFavorites(JSON.parse(stored));
            } catch (e) { console.error('Favorites load error:', e); }
        };
        loadFavorites();
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await fetchDailyData(date);
                if (data) {
                    setUserProfile(data.profile);
                    setWaterMl(data.totalWaterMl);
                    setMeals(data.meals);

                    // Bildirimleri kur (Sadece bugÃ¼nse ve profil yÃ¼klendiyse)
                    if (date === new Date().toDateString()) {
                        const hasPermission = await requestNotificationPermissions();
                        if (hasPermission) {
                            await scheduleDailyCoachNotification(data.profile.full_name || data.profile.username || 'Abdul');
                        }
                    }
                }
                // Streak yükle
                const s = await fetchStreak();
                setStreak(s);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [date]);

    useEffect(() => {
        const animate = (val, toValue) => {
            Animated.spring(val, {
                toValue: isNaN(toValue) ? 0 : toValue,
                useNativeDriver: false,
                friction: 8,
                tension: 40
            }).start();
        };

        animate(calorieAnim, progress);
        animate(proteinAnim, Math.min(totals.protein / targetMacros.protein, 1));
        animate(carbsAnim, Math.min(totals.carbs / targetMacros.carbs, 1));
        animate(fatAnim, Math.min(totals.fat / targetMacros.fat, 1));
    }, [totals, progress, targetMacros]);

    async function signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert('Error', error.message);
    }

    const openAddFoodModal = (mealId) => {
        setSelectedMealId(mealId);
        setSearchQuery('');
        setSearchResults([]);
        setHasSearched(false);
        setSelectedFood(null);
        setGramInput('100');
        setModalStep('search');
        setModalVisible(true);
    };

    const handleSearch = async () => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            Alert.alert('Too Short', 'Please enter at least 2 characters.');
            return;
        }

        setSearching(true);
        setHasSearched(true);
        const results = await searchFood(searchQuery.trim());
        setSearchResults(results);
        setSearching(false);
    };

    const handleSelectFood = (food) => {
        setSelectedFood(food);
        setGramInput('100');
        setModalStep('gram');
    };

    const handleConfirmGrams = async () => {
        const grams = parseFloat(gramInput);
        if (!grams || grams <= 0) {
            Alert.alert('Invalid', 'Please enter a valid amount in grams.');
            return;
        }

        const calculatedCalories = Math.round((selectedFood.calories * grams) / 100);
        const calculatedProtein = Math.round((selectedFood.protein * grams) / 100);
        const calculatedCarbs = Math.round((selectedFood.carbs * grams) / 100);
        const calculatedFat = Math.round((selectedFood.fat * grams) / 100);

        const targetMealId = selectedMealId || 4;
        const mealName = INITIAL_MEALS.find(m => m.id === targetMealId)?.name || 'Snacks';

        try {
            const newMeal = await logFoodEntry({
                meal_name: mealName,
                food_name: selectedFood.name,
                calories: calculatedCalories,
                protein: calculatedProtein,
                carbs: calculatedCarbs,
                fat: calculatedFat,
                grams: Math.round(grams)
            });

            setMeals(prev => [...prev, newMeal]);
            setModalVisible(false);
        } catch (error) {
            Alert.alert('Error', 'Could not save your meal.');
        }
    };

    const addWater = async (amount = 200) => {
        try {
            await logWaterEntry(amount);
            setWaterMl(prev => prev + amount);
        } catch (error) {
            Alert.alert('Error', 'Could not save water intake.');
        }
    };

    const removeWater = async (amount = 200) => {
        try {
            await removeLastWaterEntry();
            setWaterMl(prev => Math.max(prev - amount, 0));
        } catch (error) {
            console.error(error);
        }
    };

    const handleManualWaterEntry = async () => {
        const amount = parseInt(customWaterInput);
        if (amount && amount > 0) {
            await addWater(amount);
            setWaterModalVisible(false);
            setCustomWaterInput('');
        } else {
            Alert.alert('Invalid', 'Please enter a valid amount in ml.');
        }
    };


    const pickImageAndScanBarcode = async () => {
        Alert.alert(
            "Bilgi",
            "Galeriden barkod tarama özelliği şu anki Expo sürümünde desteklenmemektedir. Lütfen kamerayı kullanarak canlı tarama yapın."
        );
    };

    const handleBarcodeScanned = async ({ data }) => {
        if (scanned) return;
        setScanned(true);
        console.log(`Dashboard: Barcode scanned: ${data}`);

        try {
            const food = await fetchFoodByBarcode(data);
            if (food) {
                setBarcodeModalVisible(false);
                setSelectedFood(food);
                setGramInput('100');
                setModalStep('gram');
                setModalVisible(true);
            } else {
                Alert.alert('Ürün Bulunamadı', 'Bu barkoda ait ürün bilgisi sistemde bulunmuyor.');
                setScanned(false);
            }
        } catch (error) {
            console.error('Barcode fetch error:', error);
            Alert.alert('Hata', 'Ürün bilgisi alınırken bir sorun oluştu.');
            setScanned(false);
        }
    };

    const openBarcodeScanner = async () => {
        if (!permission) {
            return;
        }

        if (!permission.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                Alert.alert("İzin Gerekli", "Barkod taramak için kameraya erişim izni vermeniz gerekmektedir.");
                return;
            }
        }

        setScanned(false);
        setBarcodeModalVisible(true);
    };

    // --- AI Functions ---

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            processImage(result.assets[0].base64);
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Camera access is needed to scan food.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            processImage(result.assets[0].base64);
        }
    };

    const processImage = async (base64) => {
        console.log("Dashboard: Starting Image Process...");
        setAiLoading(true);
        try {
            const analysis = await aiService.analyzeFoodImage(base64);
            console.log("Dashboard: Image Analysis Result:", analysis);
            setAiResult(analysis);
            setAiModalVisible(true);
        } catch (error) {
            console.error("Dashboard: Image Process Error:", error);
            Alert.alert("AI Error", "Could not analyze the image. Please try again.");
        } finally {
            setAiLoading(false);
        }
    };

    const startRecording = async () => {
        console.log("Dashboard: Starting Audio Recording...");
        try {
            const { granted } = await requestRecordingPermissionsAsync();
            if (!granted) {
                Alert.alert("Permission", "Audio recording permission is required.");
                return;
            }

            await setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            await audioRecorder?.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
            audioRecorder?.record();
            setIsRecording(true);
            console.log("Dashboard: Recording active");
        } catch (err) {
            console.error('Dashboard: Start Audio Error', err);
        }
    };

    const stopRecording = async () => {
        if (!isRecording) return;
        setIsRecording(false);
        try {
            await audioRecorder?.stop();
            // Analiz ekranına (simülasyon metin girişi) yönlendir
            setTimeout(() => {
                setManualAiInput('');
                setManualAiModalVisible(true);
            }, 500);
        } catch (error) {
            console.error("Stop recording error", error);
        }
    };

    const handleQuickVoiceLog = () => {
        setManualAiInput('');
        setManualAiModalVisible(true);
    };

    const processManualAiInput = async () => {
        console.log("Dashboard: Processing Generic AI Input:", manualAiInput);
        if (!manualAiInput || manualAiInput.trim().length < 2) return;

        setManualAiModalVisible(false);
        setAiLoading(true);
        try {
            const analysis = await aiService.analyzeGenericInput(manualAiInput);
            console.log("Dashboard: Analysis Result:", analysis);

            if (analysis.type === 'water') {
                // Su girişi tespiti
                await logWaterEntry(analysis.amount || 250);
                Alert.alert("Su Eklendi", `${analysis.amount || 250}ml su başarıyla kaydedildi. 💧`);
                // Dashboard verilerini yenile
                const data = await fetchDailyData(date);
                if (data) {
                    setWaterMl(data.totalWaterMl);
                }
            } else {
                // Yemek girişi tespiti
                setAiResult(analysis.data || analysis);
                setAiModalVisible(true);
            }
        } catch (e) {
            console.error("Dashboard: AI Process Error:", e);
            Alert.alert("AI Error", e.message || "Could not analyze input.");
        } finally {
            setAiLoading(false);
        }
    };

    const confirmAiLog = async () => {
        if (!aiResult) return;

        try {
            console.log("Confirming AI Log:", aiResult);
            const newMeal = await logFoodEntry({
                meal_name: 'Snacks', // Listede gÃ¶rÃ¼nmesi iÃ§in bir kategoriye ata
                food_name: aiResult.name,
                calories: Math.round(aiResult.calories || 0),
                protein: Math.round(aiResult.protein || 0),
                carbs: Math.round(aiResult.carbs || 0),
                fat: Math.round(aiResult.fat || 0),
                grams: 0 // Estimated portion
            });
            console.log("Meal logged successfully:", newMeal);

            setMeals(prev => [...prev, newMeal]);

            // Re-fetch to sync everything (water, totals etc.)
            const freshData = await fetchDailyData(date);
            if (freshData) {
                setMeals(freshData.meals);
                setWaterMl(freshData.totalWaterMl);
            }

            setAiModalVisible(false);
            setAiResult(null);
            console.log("Dashboard: UI Synced with new AI entry");
        } catch (error) {
            Alert.alert('Error', 'Could not save AI entry.');
        }
    };

    const loadWeeklyTrends = async () => {
        console.log("Dashboard: Opening Weekly Trends...");
        setWeeklyModalVisible(true);
        setIsWeeklyLoading(true);
        setWeeklyInsight(''); // Reset previous insight
        try {
            console.log("Dashboard: Fetching Weekly Data...");
            const data = await fetchWeeklyData();
            console.log("Dashboard: Weekly Data Fetched:", data?.length, "days found");
            setWeeklyData(data || []);

            if (!data || data.length === 0) {
                setWeeklyInsight("HenÃ¼z yeterli veri giriÅŸi yapÄ±lmamÄ±ÅŸ.");
                setIsWeeklyLoading(false);
                return;
            }

            console.log("Dashboard: Requesting AI Weekly Insight...");
            const insight = await aiService.getWeeklyStatusInsight(data, targetCalories);
            console.log("Dashboard: AI Weekly Insight Received:", insight ? "Success" : "Empty");
            setWeeklyInsight(insight || "HaftalÄ±k Ã¶zet hazÄ±rlanamadÄ±.");
        } catch (error) {
            console.error("Weekly Trends Critical Error:", error);
            setWeeklyInsight("HaftalÄ±k veriler ÅŸu an analiz edilemiyor.");
        } finally {
            setIsWeeklyLoading(false);
            console.log("Dashboard: Weekly Trends Loading Finished");
        }
    };

    const handleExportPDF = async () => {
        if (weeklyData.length === 0 || isExportingPDF) return;

        setIsExportingPDF(true);
        try {
            // DetaylÄ± AI Ã¶zeti al (EÄŸer modalda gÃ¶rÃ¼nen yetersizse veya taze istenirse)
            // Burada modalda zaten olan weeklyInsight'Ä± kullanabiliriz veya daha detaylÄ±sÄ±nÄ± Ã¼retebiliriz.
            // Daha profesyonel bir rapor iÃ§in PDF'e Ã¶zel fonksiyonu Ã§aÄŸÄ±rÄ±yoruz.
            const fullAiSummary = await aiService.generateWeeklyAiSummary(weeklyData, targetCalories, userProfile);
            await generateWeeklyReport(weeklyData, fullAiSummary, userProfile);
        } catch (error) {
            console.error("PDF Export Error:", error);
            Alert.alert("Hata", "PDF raporu oluÅŸturulurken bir sorun oluÅŸtu.");
        } finally {
            setIsExportingPDF(false);
        }
    };

    // === TARI\u0048 NAV\u0130GASYO\u004eU ===
    const goToPreviousDay = () => {
        const current = new Date(date);
        current.setDate(current.getDate() - 1);
        setDate(current.toDateString());
    };

    const goToNextDay = () => {
        const current = new Date(date);
        const today = new Date();
        if (current.toDateString() === today.toDateString()) return; // Gelecek gÃ¼ne gitme
        current.setDate(current.getDate() + 1);
        setDate(current.toDateString());
    };

    const isToday = new Date(date).toDateString() === new Date().toDateString();

    // === YEMEK S\u0130LME ===
    const handleDeleteMeal = async (mealId, foodName) => {
        Alert.alert(
            'YemeÄŸi Sil',
            `"${foodName}" Ã¶ÄŸesini silmek istediÄŸinize emin misiniz?`,
            [
                { text: 'Ä°ptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteFoodEntry(mealId);
                            setMeals(prev => prev.filter(m => m.id !== mealId));
                        } catch (error) {
                            Alert.alert('Hata', 'Yemek silinemedi.');
                        }
                    }
                }
            ]
        );
    };

    // === FAVOR\u0130 YEMEKLER ===
    const toggleFavorite = async (food) => {
        let updated;
        const exists = favorites.find(f => f.name === food.name);
        if (exists) {
            updated = favorites.filter(f => f.name !== food.name);
        } else {
            updated = [...favorites, {
                name: food.name,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat,
                per: food.per || '100g',
                brand: food.brand || ''
            }];
        }
        setFavorites(updated);
        await AsyncStorage.setItem('favorite_foods', JSON.stringify(updated));
    };

    const addFavoriteToMeal = async (fav) => {
        try {
            const mealName = selectedMealId
                ? INITIAL_MEALS.find(m => m.id === selectedMealId)?.name || 'Snacks'
                : 'Snacks';
            const newMeal = await logFoodEntry({
                meal_name: mealName,
                food_name: fav.name,
                calories: fav.calories,
                protein: fav.protein || 0,
                carbs: fav.carbs || 0,
                fat: fav.fat || 0,
                grams: 100
            });
            setMeals(prev => [...prev, newMeal]);
            setShowFavorites(false);
            setModalVisible(false);
        } catch (error) {
            Alert.alert('Hata', 'Favori eklenemedi.');
        }
    };

    // === A\u0049 YEMEK \u00d6NER\u0130S\u0130 ===
    const loadMealSuggestion = async () => {
        setSuggestionModalVisible(true);
        setIsSuggestionLoading(true);
        setMealSuggestion(null);
        try {
            const hour = new Date().getHours();
            let mealTime = 'KahvaltÄ±';
            if (hour >= 11 && hour < 14) mealTime = 'Ã–ÄŸle YemeÄŸi';
            else if (hour >= 14 && hour < 17) mealTime = 'Ara Ã–ÄŸÃ¼n';
            else if (hour >= 17 && hour < 21) mealTime = 'AkÅŸam YemeÄŸi';
            else if (hour >= 21) mealTime = 'Gece AtÄ±ÅŸtÄ±rmalÄ±ÄŸÄ±';

            const remaining = {
                protein: Math.max(0, targetMacros.protein - totals.protein),
                carbs: Math.max(0, targetMacros.carbs - totals.carbs),
                fat: Math.max(0, targetMacros.fat - totals.fat),
            };
            const suggestion = await aiService.suggestNextMeal(
                Math.max(0, remainingCalories),
                remaining,
                mealTime
            );
            setMealSuggestion(suggestion);
        } catch (error) {
            setMealSuggestion('Ã–neri yÃ¼klenirken bir hata oluÅŸtu.');
        } finally {
            setIsSuggestionLoading(false);
        }
    };

    const handleGenerateRecipe = async () => {
        if (!ingredientsInput.trim()) {
            Alert.alert("Hata", "LÃ¼tfen elinizdeki malzemeleri girin.");
            return;
        }

        setIsRecipeLoading(true);
        setGeneratedRecipe(null);
        try {
            const remaining = {
                protein: Math.max(0, targetMacros.protein - totals.protein),
                carbs: Math.max(0, targetMacros.carbs - totals.carbs),
                fat: Math.max(0, targetMacros.fat - totals.fat),
            };
            const recipe = await aiService.generateRecipeFromIngredients(
                ingredientsInput,
                Math.max(0, remainingCalories),
                remaining
            );
            setGeneratedRecipe(recipe);
        } catch (error) {
            Alert.alert("Hata", "Tarif oluÅŸturulurken bir sorun oluÅŸtu.");
        } finally {
            setIsRecipeLoading(false);
        }
    };

    const calculatedCalories = selectedFood ? Math.round((selectedFood.calories * (parseFloat(gramInput) || 0)) / 100) : 0;

    const renderMealItem = ({ item }) => {
        const categoryTotal = meals
            .filter(m => m.meal_name === item.name)
            .reduce((sum, m) => sum + (m.calories || 0), 0);
        const mealFoods = meals.filter(m => m.meal_name === item.name);
        const hasFood = categoryTotal > 0;
        const isExpanded = expandedMeal === item.id;

        return (
            <View>
                <AnimatedButton
                    style={[styles.mealCard, { borderLeftColor: item.color }]}
                    onPress={() => hasFood ? setExpandedMeal(isExpanded ? null : item.id) : openAddFoodModal(item.id)}
                >
                    <View style={[styles.iconContainer, { backgroundColor: item.color + '18' }]}>
                        <Ionicons name={item.icon} size={26} color={item.color} />
                    </View>
                    <View style={styles.mealInfo}>
                        <Text style={styles.mealName} numberOfLines={1}>{item.name}</Text>
                        {hasFood ? (
                            <View style={styles.mealMetaRow}>
                                <Text numberOfLines={1} ellipsizeMode="tail" style={{ flex: 1 }}>
                                    <Text style={[styles.mealCaloriesActive, { color: item.color }]}>
                                        {categoryTotal}
                                    </Text>
                                    <Text style={styles.mealCaloriesUnit}> kcal</Text>
                                    <Text style={styles.mealDot}> {'\u2022'} </Text>
                                    <Text style={styles.mealItemCount}>
                                        {mealFoods.length} {mealFoods.length === 1 ? 'item' : 'items'}
                                    </Text>
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.mealCaloriesEmpty}>Tap + to add food</Text>
                        )}
                    </View>
                    <View style={styles.mealActions}>
                        {hasFood && (
                            <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={theme.textSubtle}
                            />
                        )}
                        <AnimatedButton
                            style={[styles.addButton, hasFood ? { backgroundColor: item.color + '15', borderColor: item.color + '30' } : {}]}
                            onPress={() => openAddFoodModal(item.id)}
                        >
                            <Ionicons name="add" size={20} color={hasFood ? item.color : theme.textSubtle} />
                        </AnimatedButton>
                    </View>
                </AnimatedButton>

                {/* Genişletilmiş yemek listesi */}
                {isExpanded && mealFoods.length > 0 && (
                    <View style={styles.expandedFoodList}>
                        {mealFoods.map(food => (
                            <View key={food.id} style={styles.foodItemRow}>
                                <View style={styles.foodItemInfo}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={styles.foodItemName} numberOfLines={1}>{food.food_name}</Text>
                                        <Text style={{ fontSize: 10, color: theme.textInactive }}>• {food.grams}g</Text>
                                    </View>
                                    <Text style={styles.foodItemCal}>{food.calories} kcal</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDeleteMeal(food.id, food.food_name)}
                                >
                                    <Ionicons name="trash-outline" size={16} color={theme.error} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const renderSearchResultItem = ({ item }) => {
        const isFav = favorites.find(f => f.name === item.name);
        return (
            <AnimatedButton
                style={styles.resultCard}
                onPress={() => handleSelectFood(item)}
            >
                <View style={styles.resultInfo}>
                    <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                    {item.brand ? <Text style={styles.resultBrand} numberOfLines={1}>{item.brand}</Text> : null}
                </View>
                <View style={styles.resultRightSide}>
                    <View style={styles.resultNutrients}>
                        <Text style={styles.resultCalories}>{item.calories}</Text>
                        <Text style={styles.resultUnit}>kcal/{item.per}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.favIconBtn}
                        onPress={() => toggleFavorite(item)}
                    >
                        <Ionicons
                            name={isFav ? "heart" : "heart-outline"}
                            size={22}
                            color={isFav ? theme.error : theme.textInactive}
                        />
                    </TouchableOpacity>
                </View>
            </AnimatedButton>
        );
    };

    const SummaryCard = () => {
        const levelInfo = getLevelInfo(userProfile?.points || 0);

        return (
            <View style={styles.summaryCard}>
                <View style={[styles.summaryHeader, { marginBottom: 20 }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.modalTitle}>Günlük Özet</Text>
                        <Text style={styles.remainingLabel}>Bugünkü denge durumun</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={[styles.streakBadge, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30', marginBottom: 4 }]}>
                            <Text style={[styles.streakText, { color: theme.primary }]}>Lvl {levelInfo.level}</Text>
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSubtle }}>{userProfile?.points || 0} Puan</Text>
                    </View>
                </View>

                {/* Level Progress Bar */}
                <View style={{ height: 6, backgroundColor: theme.surfaceHighlight, borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
                    <View style={{ height: '100%', backgroundColor: theme.primary, width: `${levelInfo.progress * 100}%` }} />
                </View>

                <View style={styles.progressContainer}>
                    <Animated.View style={[styles.progressBar, {
                        width: calorieAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%']
                        }),
                        position: 'absolute',
                        left: 0,
                        top: 0
                    }]} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 24 }}>
                    <Text style={styles.macroValue}>
                        {consumedCalories} <Text style={{ color: theme.textSubtle, fontWeight: '400' }}>/ {targetCalories} kcal</Text>
                    </Text>
                    <Text style={[styles.macroValue, { color: theme.primary }]}>{Math.round(progress * 100)}%</Text>
                </View>

                <View style={styles.macrosRow}>
                    <View style={styles.macroItem}>
                        <View style={styles.macroHeader}>
                            <Text style={styles.macroLabel}>Protein</Text>
                            <Text style={styles.macroValue}>{totals.protein}g</Text>
                        </View>
                        <View style={styles.macroBarBg}>
                            <Animated.View style={[styles.macroBarFill, {
                                backgroundColor: theme.protein,
                                width: proteinAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%']
                                })
                            }]} />
                        </View>
                        <Text style={styles.macroTarget}>of {targetMacros.protein}g</Text>
                    </View>

                    <View style={styles.macroItem}>
                        <View style={styles.macroHeader}>
                            <Text style={styles.macroLabel}>Carbs</Text>
                            <Text style={styles.macroValue}>{totals.carbs}g</Text>
                        </View>
                        <View style={styles.macroBarBg}>
                            <Animated.View style={[styles.macroBarFill, {
                                backgroundColor: theme.carbs,
                                width: carbsAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%']
                                })
                            }]} />
                        </View>
                        <Text style={styles.macroTarget}>of {targetMacros.carbs}g</Text>
                    </View>

                    <View style={styles.macroItem}>
                        <View style={styles.macroHeader}>
                            <Text style={styles.macroLabel}>Fat</Text>
                            <Text style={styles.macroValue}>{totals.fat}g</Text>
                        </View>
                        <View style={styles.macroBarBg}>
                            <Animated.View style={[styles.macroBarFill, {
                                backgroundColor: theme.fat,
                                width: fatAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%']
                                })
                            }]} />
                        </View>
                        <Text style={styles.macroTarget}>of {targetMacros.fat}g</Text>
                    </View>
                </View>
            </View>
        );
    };
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle={isDarkMode ? "light-content" : "dark-content"}
                backgroundColor={theme.surface}
                translucent={!!false}
            />

            {/* Main Content Wrapper for Web Centering */}
            <View style={styles.contentWrapper}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/rebalance_final_v11_transparent.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.logoText}>{userProfile?.username || 'Kullanıcı'}</Text>
                                <Text style={styles.username}>Daily Rebalance</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity onPress={signOut} style={styles.actionButton}>
                                <Ionicons name="log-out-outline" size={22} color={theme.error} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Integrated Date Navigation */}
                    <View style={styles.dateIntegratedNav}>
                        <TouchableOpacity onPress={goToPreviousDay}>
                            <Ionicons name="chevron-back" size={20} color={theme.primary} />
                        </TouchableOpacity>
                        <Text style={styles.dateText}>
                            {isToday ? 'Bugün' : new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </Text>
                        <TouchableOpacity onPress={goToNextDay} disabled={isToday} style={isToday && { opacity: 0.3 }}>
                            <Ionicons name="chevron-forward" size={20} color={isToday ? theme.textInactive : theme.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* AI Action Row */}
                    <View style={styles.aiActionRow}>
                        <AnimatedButton style={[styles.aiButton, { backgroundColor: theme.primary + '12' }]} onPress={takePhoto}>
                            <Ionicons name="scan-outline" size={26} color={theme.primary} />
                            <Text style={[styles.aiButtonText, { color: theme.primary }]}>Analiz</Text>
                        </AnimatedButton>
                        <AnimatedButton style={[styles.aiButton, { backgroundColor: theme.secondary + '12' }]} onPress={startRecording}>
                            <Ionicons name="mic-outline" size={26} color={theme.secondary} />
                            <Text style={[styles.aiButtonText, { color: theme.secondary }]}>Sesli</Text>
                        </AnimatedButton>
                        <AnimatedButton style={[styles.aiButton, { backgroundColor: theme.accent + '12' }]} onPress={openBarcodeScanner}>
                            <Ionicons name="barcode-outline" size={26} color={theme.accent} />
                            <Text style={[styles.aiButtonText, { color: theme.accent }]}>Barkod</Text>
                        </AnimatedButton>
                        <AnimatedButton style={[styles.aiButton, { backgroundColor: theme.success + '12' }]} onPress={() => setRecipeModalVisible(true)}>
                            <Ionicons name="sparkles-outline" size={26} color={theme.success} />
                            <Text style={[styles.aiButtonText, { color: theme.success }]}>AI Tarif</Text>
                        </AnimatedButton>
                    </View>

                    <SummaryCard />

                    {/* Rebalance Coach Insight Card */}
                    <View style={[styles.coachCard, { borderLeftWidth: 4, borderLeftColor: theme.success }]}>
                        <View style={styles.coachHeader}>
                            <Ionicons name="sunny-outline" size={20} color={theme.success} />
                            <Text style={[styles.coachTitle, { color: theme.success, fontSize: 16, textTransform: 'uppercase' }]}>
                                Güne Başla!
                            </Text>
                        </View>
                        <Text style={styles.coachText}>
                            {coachInsight || "Verilerin yükleniyor, koçun birazdan burada olacak..."}
                        </Text>
                        <View style={styles.coachButtonsRow}>
                            <TouchableOpacity style={styles.coachActionButton} onPress={loadWeeklyTrends}>
                                <Ionicons name="stats-chart" size={18} color={theme.primary} />
                                <Text style={styles.coachActionButtonText}>Trends</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.coachActionButton} onPress={loadMealSuggestion}>
                                <Ionicons name="sparkles" size={18} color={theme.primary} />
                                <Text style={styles.coachActionButtonText}>Suggest</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Rebalance Insight Card */}
                    <AnimatedButton
                        style={[styles.insightCard, { borderLeftColor: insight.type === 'warning' ? '#F59E0B' : theme.primary }]}
                        onPress={() => { }}
                    >
                        <View style={styles.insightHeader}>
                            <Ionicons
                                name={insight.icon}
                                size={20}
                                color={insight.type === 'warning' ? '#F59E0B' : theme.primary}
                            />
                            <Text style={[styles.insightTitle, { color: insight.type === 'warning' ? '#F59E0B' : theme.primary }]}>
                                {insight.title}
                            </Text>
                        </View>
                        <Text style={styles.insightMessage}>{insight.message}</Text>
                    </AnimatedButton>

                    {/* Water Tracker Section */}
                    <View style={styles.waterCard}>
                        <View style={styles.waterHeader}>
                            <View>
                                <Text style={styles.waterTitle}>Su Takibi</Text>
                                <Text style={styles.waterValue}>
                                    {waterMl} <Text style={styles.waterTarget}>ml (5.0L Hedef)</Text>
                                </Text>
                            </View>
                            <Ionicons name="water" size={28} color={theme.water} />
                        </View>

                        <ScrollView
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                            style={styles.waterScroll}
                            contentContainerStyle={styles.waterGrid}
                        >
                            {Array.from({ length: 25 }).map((_, i) => { // 25 bardak * 200ml = 5000ml (5L)
                                const isFull = (i + 1) * 200 <= waterMl;
                                const isPartial = !isFull && (i * 200 < waterMl);
                                const glassColor = isFull ? theme.water : (isPartial ? theme.water + '70' : theme.textInactive + '20');

                                return (
                                    <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                                        <View style={[
                                            styles.waterGlass,
                                            isFull && { backgroundColor: theme.water + '15', borderColor: theme.water + '30' },
                                            isPartial && { backgroundColor: theme.water + '08', borderColor: theme.water + '15' }
                                        ]}>
                                            <Ionicons
                                                name={isFull ? "pint" : "pint-outline"}
                                                size={28}
                                                color={glassColor}
                                            />
                                        </View>
                                        <Text style={{
                                            fontSize: 10,
                                            fontWeight: '700',
                                            color: isFull ? theme.water : theme.textInactive,
                                            textAlign: 'center'
                                        }}>
                                            {(i + 1) * 200}ml
                                        </Text>
                                    </View>
                                );
                            })}
                        </ScrollView>

                        <View style={styles.waterControls}>
                            <TouchableOpacity style={styles.waterButton} onPress={() => removeWater(200)}>
                                <Ionicons name="remove" size={20} color={theme.textBody} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.waterButton}
                                onPress={() => {
                                    setCustomWaterInput('');
                                    setWaterModalVisible(true);
                                }}
                            >
                                <Ionicons name="create-outline" size={18} color={theme.textBody} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.waterButton, styles.waterButtonAdd]} onPress={() => addWater(200)}>
                                <Ionicons name="add" size={22} color={theme.white} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Spacer for bottom padding */}
                    <View style={{ height: Platform.OS === 'web' ? 40 : 60 }} />
                </ScrollView>

                {/* Add Food Modal - Now with Search */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={!!modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, SHADOWS.dark]}>
                            <View style={styles.modalHeader}>
                                {modalStep === 'gram' ? (
                                    <AnimatedButton onPress={() => setModalStep('search')} style={styles.backButton}>
                                        <Ionicons name="arrow-back" size={22} color={theme.textHeading} />
                                    </AnimatedButton>
                                ) : null}
                                <Text style={styles.modalTitle}>{modalStep === 'search' ? 'Add Food' : 'How much?'}</Text>
                                <AnimatedButton onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={theme.textSubtle} />
                                </AnimatedButton>
                            </View>

                            {modalStep === 'search' && (
                                <View style={styles.tabContainer}>
                                    <TouchableOpacity
                                        style={[styles.tab, !showFavorites && styles.activeTab]}
                                        onPress={() => setShowFavorites(false)}
                                    >
                                        <Text style={[styles.tabText, !showFavorites && styles.activeTabText]}>Search</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.tab, showFavorites && styles.activeTab]}
                                        onPress={() => setShowFavorites(true)}
                                    >
                                        <Text style={[styles.tabText, showFavorites && styles.activeTabText]}>Favorites ({favorites.length})</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {modalStep === 'search' ? (
                                <>
                                    {/* Search Bar */}
                                    <View style={styles.searchContainer}>
                                        <Ionicons name="search" size={20} color={theme.textSubtle} style={styles.searchIcon} />
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Search food... (e.g. rice, banana)"
                                            placeholderTextColor={theme.textInactive}
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            onSubmitEditing={handleSearch}
                                            returnKeyType="search"
                                            autoFocus={true}
                                        />
                                        <AnimatedButton
                                            style={styles.searchButton}
                                            onPress={handleSearch}
                                            disabled={searching}
                                        >
                                            {searching ? (
                                                <ActivityIndicator size="small" color={theme.white} animating={!!true} />
                                            ) : (
                                                <Ionicons name="arrow-forward" size={20} color={theme.white} />
                                            )}
                                        </AnimatedButton>
                                        <AnimatedButton
                                            style={[styles.searchButton, { backgroundColor: theme.accent }]}
                                            onPress={openBarcodeScanner}
                                        >
                                            <Ionicons name="barcode-outline" size={20} color={theme.white} />
                                        </AnimatedButton>
                                    </View>

                                    {/* Results */}
                                    <View style={styles.resultsContainer}>
                                        {showFavorites ? (
                                            favorites.length === 0 ? (
                                                <View style={styles.centerContent}>
                                                    <Ionicons name="heart-outline" size={48} color={theme.textInactive} />
                                                    <Text style={styles.noResultsText}>No favorites yet</Text>
                                                    <Text style={styles.noResultsHint}>Tap the heart on any food search result</Text>
                                                </View>
                                            ) : (
                                                <FlatList
                                                    data={favorites}
                                                    renderItem={({ item }) => (
                                                        <TouchableOpacity style={styles.resultCard} onPress={() => addFavoriteToMeal(item)}>
                                                            <View style={styles.resultInfo}>
                                                                <Text style={styles.resultName}>{item.name}</Text>
                                                                <Text style={styles.resultMeta}>{item.calories} kcal / 100g</Text>
                                                            </View>
                                                            <TouchableOpacity onPress={() => toggleFavorite(item)}>
                                                                <Ionicons name="heart" size={22} color={theme.error} />
                                                            </TouchableOpacity>
                                                        </TouchableOpacity>
                                                    )}
                                                    keyExtractor={(item, index) => 'fav' + index}
                                                    contentContainerStyle={styles.resultsList}
                                                />
                                            )
                                        ) : (
                                            searching ? (
                                                <View style={styles.centerContent}>
                                                    <ActivityIndicator size="large" color={theme.primary} animating={!!true} />
                                                    <Text style={styles.searchingText}>Searching...</Text>
                                                </View>
                                            ) : hasSearched && searchResults.length === 0 ? (
                                                <View style={styles.centerContent}>
                                                    <Ionicons name="sad-outline" size={48} color={theme.textInactive} />
                                                    <Text style={styles.noResultsText}>No results found</Text>
                                                    <Text style={styles.noResultsHint}>Try searching in English (e.g. "chicken")</Text>
                                                </View>
                                            ) : !hasSearched ? (
                                                <View style={styles.centerContent}>
                                                    <Ionicons name="nutrition-outline" size={48} color={theme.primaryLight} />
                                                    <Text style={styles.hintText}>Search for a food to see its calories</Text>
                                                </View>
                                            ) : (
                                                <FlatList
                                                    data={searchResults}
                                                    renderItem={renderSearchResultItem}
                                                    keyExtractor={item => item.id}
                                                    contentContainerStyle={styles.resultsList}
                                                    showsVerticalScrollIndicator={false}
                                                />
                                            )
                                        )}
                                    </View>
                                </>
                            ) : (
                                /* Step 2: Gram Input */
                                <View style={styles.gramStepContainer}>
                                    {/* Selected food info */}
                                    <View style={styles.selectedFoodCard}>
                                        <Ionicons name="nutrition" size={20} color={theme.primary} />
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={styles.selectedFoodName} numberOfLines={1}>{selectedFood?.name}</Text>
                                            <Text style={styles.selectedFoodMeta}>{selectedFood?.calories} kcal / 100g</Text>
                                        </View>
                                    </View>

                                    {/* Gram input */}
                                    <View style={styles.gramInputRow}>
                                        <TextInput
                                            style={styles.gramTextInput}
                                            value={gramInput}
                                            onChangeText={setGramInput}
                                            autoFocus={true}
                                            selectTextOnFocus={true}
                                            placeholder="100"
                                            placeholderTextColor={theme.textInactive}
                                        />
                                        <Text style={styles.gramUnit}>g</Text>
                                    </View>

                                    {/* Quick gram buttons */}
                                    <View style={styles.quickGramRow}>
                                        {[50, 100, 150, 200, 250, 500].map(g => (
                                            <TouchableOpacity
                                                key={g}
                                                style={[styles.quickGramButton, gramInput === String(g) && styles.quickGramButtonActive]}
                                                onPress={() => setGramInput(String(g))}
                                            >
                                                <Text style={[styles.quickGramText, gramInput === String(g) && styles.quickGramTextActive]}>{g}g</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Confirm button with calorie preview */}
                                    <AnimatedButton style={styles.confirmButton} onPress={handleConfirmGrams}>
                                        <Text style={styles.confirmCalorieText}>{calculatedCalories} kcal</Text>
                                        <Text style={styles.confirmButtonText}>Add to Log</Text>
                                    </AnimatedButton>
                                </View>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* AI Suggestion Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={!!suggestionModalVisible}
                    onRequestClose={() => setSuggestionModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { height: 'auto', maxHeight: '90%' }, SHADOWS.dark]}>
                            <View style={styles.modalHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="sparkles" size={24} color={theme.primary} />
                                    <Text style={styles.modalTitle}>AI Suggestion</Text>
                                </View>
                                <TouchableOpacity onPress={() => setSuggestionModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={theme.textSubtle} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.suggestionBody}>
                                {isSuggestionLoading ? (
                                    <View style={styles.suggestionLoading}>
                                        <ActivityIndicator size="large" color={theme.primary} animating={!!true} />
                                        <Text style={styles.suggestionLoadingText}>Calculating perfect meal...</Text>
                                    </View>
                                ) : (
                                    <>
                                        <ScrollView
                                            style={styles.suggestionScrollView}
                                            showsVerticalScrollIndicator={false}
                                            contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
                                        >
                                            <View style={styles.suggestionCard}>
                                                <Text style={styles.suggestionText}>{mealSuggestion}</Text>
                                            </View>
                                        </ScrollView>
                                        <AnimatedButton
                                            style={[styles.suggestionAction, { marginTop: 10 }]}
                                            onPress={() => setSuggestionModalVisible(false)}
                                        >
                                            <Text style={styles.suggestionActionText}>Thanks!</Text>
                                        </AnimatedButton>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Manual Water Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={!!waterModalVisible}
                    onRequestClose={() => setWaterModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { height: 'auto' }, SHADOWS.dark]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Add Water</Text>
                                <TouchableOpacity onPress={() => setWaterModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={theme.textSubtle} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.gramInputRow}>
                                <TextInput
                                    style={styles.gramTextInput}
                                    value={customWaterInput}
                                    onChangeText={setCustomWaterInput}
                                    keyboardType="numeric"
                                    autoFocus={true}
                                    placeholder="250"
                                    placeholderTextColor={theme.textInactive}
                                />
                                <Text style={styles.gramUnit}>ml</Text>
                            </View>

                            <View style={styles.quickGramRow}>
                                {[50, 100, 200, 330, 500].map(amt => (
                                    <TouchableOpacity
                                        key={amt}
                                        style={styles.quickGramButton}
                                        onPress={() => setCustomWaterInput(String(amt))}
                                    >
                                        <Text style={styles.quickGramText}>{amt}ml</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <AnimatedButton
                                style={[styles.confirmButton, { backgroundColor: theme.water }]}
                                onPress={handleManualWaterEntry}
                            >
                                <Text style={styles.confirmButtonText}>Add Water</Text>
                            </AnimatedButton>
                        </View>
                    </View>
                </Modal>

                {/* AI Confirm Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={!!aiModalVisible}
                    onRequestClose={() => setAiModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { height: 'auto' }, SHADOWS.dark]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>AI Analysis</Text>
                                <TouchableOpacity onPress={() => setAiModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={theme.textSubtle} />
                                </TouchableOpacity>
                            </View>

                            {aiResult && (
                                <View style={styles.aiResultContainer}>
                                    <View style={styles.aiResultBadge}>
                                        <Ionicons name="sparkles" size={16} color={theme.primary} />
                                        <Text style={styles.aiResultBadgeText}>Detected with Gemini</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <Text style={styles.aiFoodName}>{aiResult.name}</Text>
                                        <TouchableOpacity
                                            onPress={() => toggleFavorite(aiResult)}
                                            style={styles.favIconBtn}
                                        >
                                            <Ionicons
                                                name={favorites.find(f => f.name === aiResult.name) ? "heart" : "heart-outline"}
                                                size={28}
                                                color={favorites.find(f => f.name === aiResult.name) ? theme.error : theme.textInactive}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.aiStatsRow}>
                                        <View style={styles.aiStatItem}>
                                            <Text style={styles.aiStatValue}>{aiResult.calories}</Text>
                                            <Text style={styles.aiStatLabel}>kcal</Text>
                                        </View>
                                        <View style={styles.aiStatItem}>
                                            <Text style={[styles.aiStatValue, { color: theme.protein }]}>{aiResult.protein}g</Text>
                                            <Text style={styles.aiStatLabel}>Protein</Text>
                                        </View>
                                        <View style={styles.aiStatItem}>
                                            <Text style={[styles.aiStatValue, { color: theme.carbs }]}>{aiResult.carbs}g</Text>
                                            <Text style={styles.aiStatLabel}>Carbs</Text>
                                        </View>
                                        <View style={styles.aiStatItem}>
                                            <Text style={[styles.aiStatValue, { color: theme.fat }]}>{aiResult.fat}g</Text>
                                            <Text style={styles.aiStatLabel}>Fat</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.aiDisclaimer}>
                                        *These are estimated values for the entire portion detected.
                                    </Text>

                                    <AnimatedButton style={styles.confirmButton} onPress={confirmAiLog}>
                                        <Text style={styles.confirmButtonText}>Confirm & Add Log</Text>
                                    </AnimatedButton>
                                </View>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* Voice Recording Overlay */}
                <Modal
                    transparent={true}
                    visible={!!isRecording}
                    animationType="fade"
                >
                    <View style={styles.recordingOverlay}>
                        <View style={[styles.recordingCard, { backgroundColor: theme.surface }]}>
                            <Animated.View style={[styles.micIconContainer, { transform: [{ scale: pulseAnim }], backgroundColor: theme.secondary + '20' }]}>
                                <Ionicons name="mic" size={48} color={theme.secondary} />
                            </Animated.View>
                            <Text style={styles.recordingTitle}>Dinliyorum...</Text>
                            <Text style={styles.recordingSubtitle}>Ne yediğinizi söyleyin...</Text>

                            <TouchableOpacity style={[styles.stopButton, { backgroundColor: theme.secondary }]} onPress={stopRecording}>
                                <Text style={styles.stopButtonText}>KaydÄ± Durdur</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Manual AI Input Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={!!manualAiModalVisible}
                    onRequestClose={() => setManualAiModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { height: 'auto' }, SHADOWS.dark]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Quick Log</Text>
                                <TouchableOpacity onPress={() => setManualAiModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={theme.textSubtle} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.modalSubtitle, { marginBottom: 15 }]}>What did you eat? (e.g. 2 eggs and a coffee)</Text>

                            <View style={styles.searchContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Describe your meal..."
                                    placeholderTextColor={theme.textInactive}
                                    value={manualAiInput}
                                    onChangeText={setManualAiInput}
                                    autoFocus={true}
                                    onSubmitEditing={processManualAiInput}
                                />
                            </View>

                            <TouchableOpacity style={styles.confirmButton} onPress={processManualAiInput}>
                                <Text style={styles.confirmButtonText}>Analyze Meal</Text>
                                <Ionicons name="sparkles" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {aiLoading && (
                    <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                        <ActivityIndicator size="large" color={theme.primary} animating={!!aiLoading} />
                        <Text style={styles.loadingText}>AI Analiz Ediyor...</Text>
                    </View>
                )}

                {/* Weekly Trends Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={!!weeklyModalVisible}
                    onRequestClose={() => setWeeklyModalVisible(false)}
                >
                    <View style={styles.trendsOverlay}>
                        <View style={[styles.trendsContent, { backgroundColor: theme.surface }]}>
                            <View style={styles.trendsHeader}>
                                <Text style={styles.trendsTitle}>Weekly Balance</Text>
                                <TouchableOpacity onPress={() => setWeeklyModalVisible(false)}>
                                    <Ionicons name="close-circle" size={32} color={theme.textSubtle} />
                                </TouchableOpacity>
                            </View>

                            {isWeeklyLoading ? (
                                <View style={styles.trendsLoading}>
                                    <ActivityIndicator size="large" color={theme.primary} animating={!!true} />
                                    <Text style={styles.loadingText}>Analiz ediliyor...</Text>
                                </View>
                            ) : (
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {/* Bar Chart */}
                                    <View style={styles.chartContainer}>
                                        <View style={styles.chartYAxis}>
                                            <Text style={styles.yAxisLabel}>{targetCalories}</Text>
                                            <Text style={styles.yAxisLabel}>{targetCalories / 2}</Text>
                                            <Text style={styles.yAxisLabel}>0</Text>
                                        </View>
                                        <View style={styles.barsArea}>
                                            {weeklyData.map((day, idx) => {
                                                const height = Math.min((day.calories / targetCalories) * 150, 150);
                                                const isOver = day.calories > targetCalories;
                                                return (
                                                    <View key={idx} style={styles.barColumn}>
                                                        <View style={[styles.bar, {
                                                            height: height || 5,
                                                            backgroundColor: isOver ? theme.error : theme.primary,
                                                            opacity: day.calories > 0 ? 1 : 0.3
                                                        }]} />
                                                        <Text style={styles.barLabel}>{day.label}</Text>
                                                    </View>
                                                );
                                            })}
                                            {/* Target Line */}
                                            <View style={[styles.targetLine, { bottom: 150 + 20 }]} />
                                        </View>
                                    </View>

                                    {/* AI Insight Card */}
                                    <View style={styles.weeklyInsightCard}>
                                        <View style={styles.insightHeader}>
                                            <Ionicons name="sparkles" size={18} color={theme.primary} />
                                            <Text style={styles.insightTitle}>Weekly AI Summary</Text>
                                        </View>
                                        <Text style={styles.insightText}>{weeklyInsight}</Text>
                                    </View>

                                    {/* Water Stats */}
                                    <View style={styles.waterStatsCard}>
                                        <Text style={styles.cardSmallTitle}>Water Consistency</Text>
                                        <View style={styles.waterGrid}>
                                            {weeklyData.map((day, idx) => (
                                                <View key={idx} style={styles.waterDotContainer}>
                                                    <View style={[styles.waterDot, {
                                                        backgroundColor: day.water >= 2000 ? theme.primary : theme.textInactive,
                                                        opacity: day.water > 0 ? 1 : 0.2
                                                    }]} />
                                                    <Text style={styles.dotLabel}>{day.label}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>

                                    {/* PDF Export Button */}
                                    <AnimatedButton
                                        style={[styles.confirmButton, { marginTop: 10, backgroundColor: theme.primary }]}
                                        onPress={handleExportPDF}
                                        disabled={isExportingPDF}
                                    >
                                        {isExportingPDF ? (
                                            <ActivityIndicator color="white" animating={!!true} />
                                        ) : (
                                            <>
                                                <Ionicons name="document-text-outline" size={20} color="white" />
                                                <Text style={styles.confirmButtonText}>Haftalık PDF Raporu Al</Text>
                                            </>
                                        )}
                                    </AnimatedButton>
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* Barcode Scanner Modal */}
                <Modal
                    visible={!!barcodeModalVisible}
                    animationType="slide"
                    transparent={false}
                    onRequestClose={() => setBarcodeModalVisible(false)}
                >
                    <View style={styles.barcodeModalContainer}>
                        <CameraView
                            style={styles.scanner}
                            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                            barcodeScannerSettings={{
                                barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
                            }}
                        />
                        <View style={styles.scannerOverlay}>
                            <View style={styles.unfocusedContainer} />
                            <View style={styles.focusedRow}>
                                <View style={styles.unfocusedContainer} />
                                <View style={styles.focusedContainer} />
                                <View style={styles.unfocusedContainer} />
                            </View>
                            <View style={styles.unfocusedContainer} />
                        </View>
                        <TouchableOpacity
                            style={styles.closeScannerButton}
                            onPress={() => setBarcodeModalVisible(false)}
                        >
                            <Ionicons name="close" size={30} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.scannerInfo}>
                            <Text style={styles.scannerInfoText}>Ürün barkodunu çerçeve içine hizalayın</Text>
                            <TouchableOpacity style={styles.galleryScanButton} onPress={pickImageAndScanBarcode}>
                                <Ionicons name="image-outline" size={24} color="#fff" />
                                <Text style={styles.galleryScanButtonText}>Galeriden Seç</Text>
                            </TouchableOpacity>
                        </View>
                    </View >
                </Modal >

                {/* AI Recipe Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={!!recipeModalVisible}
                    onRequestClose={() => setRecipeModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { height: '90%' }, SHADOWS.dark]}>
                            <View style={styles.modalHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="sparkles" size={24} color={theme.success} />
                                    <Text style={styles.modalTitle}>AI Tarif Oluşturucu</Text>
                                </View>
                                <TouchableOpacity onPress={() => {
                                    setRecipeModalVisible(false);
                                    setGeneratedRecipe(null);
                                    setIngredientsInput('');
                                }}>
                                    <Ionicons name="close" size={24} color={theme.textSubtle} />
                                </TouchableOpacity>
                            </View>

                            {!generatedRecipe ? (
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.modalSubtitle, { marginBottom: 15 }]}>Elinizdeki malzemeleri virgülle ayırarak yazın:</Text>
                                    <View style={[styles.searchContainer, { height: 100, alignItems: 'flex-start', paddingVertical: 12 }]}>
                                        <TextInput
                                            style={[styles.searchInput, { height: '100%', textAlignVertical: 'top' }]}
                                            placeholder="Örn: Tavuk göğsü, mantar, krema, kabak..."
                                            placeholderTextColor={theme.textInactive}
                                            value={ingredientsInput}
                                            onChangeText={setIngredientsInput}
                                            multiline={true}
                                            autoFocus={true}
                                        />
                                    </View>
                                    <AnimatedButton
                                        style={[styles.confirmButton, { backgroundColor: theme.success }]}
                                        onPress={handleGenerateRecipe}
                                        disabled={isRecipeLoading}
                                    >
                                        {isRecipeLoading ? (
                                            <ActivityIndicator color="white" animating={!!isRecipeLoading} />
                                        ) : (
                                            <>
                                                <Text style={styles.confirmButtonText}>Tarif Oluştur</Text>
                                                <Ionicons name="sparkles" size={20} color="white" />
                                            </>
                                        )}
                                    </AnimatedButton>
                                </View>
                            ) : (
                                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                                    <View style={[styles.recipeCard, { backgroundColor: theme.surfaceHighlight, padding: 20, borderRadius: 24 }]}>
                                        <Text style={[styles.recipeTitle, { fontSize: 22, fontWeight: '800', color: theme.textHeading, marginBottom: 16 }]}>
                                            {generatedRecipe.title}
                                        </Text>

                                        <View style={[styles.aiStatsRow, { marginBottom: 20 }]}>
                                            <View style={styles.aiStatItem}>
                                                <Text style={styles.aiStatValue}>{generatedRecipe.calories}</Text>
                                                <Text style={styles.aiStatLabel}>kcal</Text>
                                            </View>
                                            <View style={styles.aiStatItem}>
                                                <Text style={[styles.aiStatValue, { color: theme.protein }]}>{generatedRecipe.protein}g</Text>
                                                <Text style={styles.aiStatLabel}>Pro</Text>
                                            </View>
                                            <View style={styles.aiStatItem}>
                                                <Text style={[styles.aiStatValue, { color: theme.carbs }]}>{generatedRecipe.carbs}g</Text>
                                                <Text style={styles.aiStatLabel}>Carb</Text>
                                            </View>
                                            <View style={styles.aiStatItem}>
                                                <Text style={[styles.aiStatValue, { color: theme.fat }]}>{generatedRecipe.fat}g</Text>
                                                <Text style={styles.aiStatLabel}>Fat</Text>
                                            </View>
                                        </View>

                                        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textHeading, marginBottom: 8 }}>Malzemeler:</Text>
                                        {generatedRecipe.ingredients.map((ing, idx) => (
                                            <Text key={idx} style={{ color: theme.textBody, marginBottom: 4 }}>â€¢ {ing}</Text>
                                        ))}

                                        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textHeading, marginTop: 16, marginBottom: 8 }}>Hazırlanışı:</Text>
                                        {generatedRecipe.instructions.map((step, idx) => (
                                            <Text key={idx} style={{ color: theme.textBody, marginBottom: 8, lineHeight: 20 }}>
                                                {idx + 1}. {step}
                                            </Text>
                                        ))}

                                        {generatedRecipe.tips && (
                                            <View style={{ marginTop: 16, padding: 12, backgroundColor: theme.primary + '10', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: theme.primary }}>
                                                <Text style={{ fontSize: 14, fontStyle: 'italic', color: theme.primaryDark }}>
                                                    ğŸ’¡ {generatedRecipe.tips}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <AnimatedButton
                                        style={[styles.confirmButton, { marginTop: 20, backgroundColor: theme.primary }]}
                                        onPress={() => {
                                            setGeneratedRecipe(null);
                                            setIngredientsInput('');
                                        }}
                                    >
                                        <Text style={styles.confirmButtonText}>Yeni Tarif</Text>
                                    </AnimatedButton>
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </Modal>
            </View >
        </SafeAreaView >
    );
}
