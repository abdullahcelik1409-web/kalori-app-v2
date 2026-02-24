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
   npm install --legacy-peer-deps
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

---

## 🤝 Canlı Çalışma ve Mobil Test (Vibe Coding)

Başka geliştiricilerle veya AI ajanlarıyla canlı bir şekilde çalışıp, anında mobil cihazda test etmek için şu adımları izleyin:

### 1. GitHub Codespaces (Canlı IDE)
- GitHub repository sayfanızda **Code** butonuna tıklayın ve **Open with Codespaces** seçeneğini seçin.
- Bu, projeyi tarayıcıda hazır bir geliştirme ortamıyla açacaktır.

### 2. QR Kod ile Mobilde Canlı Test (Tunneling)
Terminalden QR kod alıp telefonunuzdaki **Expo Go** uygulamasıyla uzak bir sunucudan test etmek için şu komutları sırasıyla yazın:

```bash
# 1. Önce uygulama klasörüne girin
cd rebalance-app

# 2. Tunnel moduyla başlatın
npx expo start --tunnel
```

- Bu komut çalıştıktan sonra terminalde çıkan **QR kodu** telefonunuzun kamerasıyla veya Expo Go uygulamasıyla taratın.
- Artık dünyanın neresinde olursanız olun, projedeki canlı değişiklikleri telefonunuzda anlık olarak görebilirsiniz. ✨

---

## 🛠 Proje Yapısı

- `/rebalance-app`: Ana mobil uygulama kodları (React Native).
- `/backend`: Veritabanı şemaları ve SQL fonksiyonları.
- `/diag_logo.py` vb.: Logo tasarım ve işleme araçları.
