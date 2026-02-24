# Kalori Sayma Uygulaması (Rebalance App)

Bu proje, React Native (Expo) ve Supabase kullanılarak geliştirilmiş, AI destekli (Google Gemini) bir kalori takip uygulamasıdır.

## 🚀 Başlangıç

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları takip edin.

### 📋 Ön Koşullar

- [Node.js](https://nodejs.org/) (LTS sürümü önerilir)
- [Expo Go](https://expo.dev/go) (Mobil test için telefonunuzda yüklü olmalı)
- Git

### 🔧 Kurulum

1. **Projeyi Klonlayın:**
   ```bash
   git clone https://github.com/abdullahcelik1409-web/kalori-app-v2.git
   cd kalori-app-v2
   ```

2. **Bağımlılıkları Yükleyin:**
   ```bash
   cd rebalance-app
   npm install
   ```

### 🔑 Yapılandırma (Önemli!)

Projenin çalışması için gerekli olan API anahtarlarını `.gitignore` nedeniyle GitHub'a yüklemedik. Bu yüzden bir `.env` dosyası oluşturmanız gerekmektedir.

1. `rebalance-app` klasörü içinde `.env` adında bir dosya oluşturun.
2. Aşağıdaki şablonu içine yapıştırın ve kendi anahtarlarınızı ekleyin:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

   > [!NOTE]
   > Bu anahtarları mevcut yerel projenizdeki `rebalance-app/.env` dosyasından kopyalayabilirsiniz.

### 🏃 Çalıştırma

Uygulamayı başlatmak için:

```bash
npx expo start
```

Tarayıcıda açılan QR kodu **Expo Go** uygulaması ile taratarak projeyi mobil cihazınızda test edebilirsiniz.

---

## 🛠 Proje Yapısı

- `/rebalance-app`: Ana mobil uygulama kodları (React Native).
- `/backend`: Veritabanı şemaları ve SQL fonksiyonları.
- `/diag_logo.py` vb.: Logo tasarım ve işleme araçları.
