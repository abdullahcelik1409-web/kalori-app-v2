const BASE_URL = 'https://world.openfoodfacts.org';

// Basit bir in-memory cache
const searchCache = new Map();

/**
 * Yiyecek adına göre arama yapar. Önbellek (caching) desteği mevcuttur.
 * @param {string} query - Aranacak yiyecek adı (örn: "rice", "chicken breast")
 * @returns {Array} - Bulunan ürünlerin listesi
 */
export async function searchFood(query) {
    if (!query || query.trim().length < 2) return [];

    const cacheKey = query.trim().toLowerCase();
    if (searchCache.has(cacheKey)) {
        console.log(`NutritionService: Returning cached results for "${cacheKey}"`);
        return searchCache.get(cacheKey);
    }

    try {
        const response = await fetch(
            `${BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,nutriments,image_front_small_url,brands`,
            {
                headers: {
                    'User-Agent': 'RebalanceApp/1.0 - React Native Calorie Tracker',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.products || data.products.length === 0) {
            return [];
        }

        const items = data.products
            .filter(product => product.product_name && product.nutriments)
            .map((product, index) => ({
                id: index.toString(),
                name: product.product_name,
                brand: product.brands || '',
                image: product.image_front_small_url || null,
                calories: Math.round(product.nutriments['energy-kcal_100g'] || product.nutriments['energy-kcal'] || 0),
                protein: Math.round(product.nutriments['proteins_100g'] || 0),
                carbs: Math.round(product.nutriments['carbohydrates_100g'] || 0),
                fat: Math.round(product.nutriments['fat_100g'] || 0),
                per: '100g', // Open Food Facts verisi 100g başına
            }))
            .filter(item => item.calories > 0); // Kalorisi olmayan ürünleri filtrele

        // Önbelleğe kaydet (Maksimum 50 arama)
        if (searchCache.size >= 50) {
            const firstKey = searchCache.keys().next().value;
            searchCache.delete(firstKey);
        }
        searchCache.set(cacheKey, items);

        return items;
    } catch (error) {
        console.error('Open Food Facts API Error:', error.message);
        return [];
    }
}

/**
 * Barkoda göre ürün bilgilerini getirir.
 * @param {string} barcode - Ürünün barkod numarası (EAN-13, EAN-8 vb.)
 * @returns {Object|null} - Bulunan ürünün bilgileri veya bulunamazsa null
 */
export async function fetchFoodByBarcode(barcode) {
    if (!barcode) return null;

    try {
        console.log(`NutritionService: Fetching data for barcode: ${barcode}`);
        const response = await fetch(
            `${BASE_URL}/api/v0/product/${barcode}.json`,
            {
                headers: {
                    'User-Agent': 'RebalanceApp/1.0 - React Native Calorie Tracker',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== 1 || !data.product) {
            console.log(`NutritionService: No product found for barcode: ${barcode}`);
            return null;
        }

        const product = data.product;

        // Mevcut searchFood formatÄ±na uygun dÃ¶nÃ¼ÅŸ yapalÄ±m
        return {
            id: barcode,
            name: product.product_name || 'Bilinmeyen Ürün',
            brand: product.brands || '',
            image: product.image_front_small_url || null,
            calories: Math.round(product.nutriments?.['energy-kcal_100g'] || product.nutriments?.['energy-kcal'] || 0),
            protein: Math.round(product.nutriments?.['proteins_100g'] || 0),
            carbs: Math.round(product.nutriments?.['carbohydrates_100g'] || 0),
            fat: Math.round(product.nutriments?.['fat_100g'] || 0),
            per: '100g',
        };
    } catch (error) {
        console.error('NutritionService (Barcode) Error:', error.message);
        return null;
    }
}
