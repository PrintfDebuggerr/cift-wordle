# 🎮 Çift Wordle - 2 Kişilik Kelime Oyunu

Modern, responsive ve performanslı 2 kişilik online Türkçe kelime oyunu.

## ✨ Özellikler

- 🎯 **2 Oyun Modu**: Sırayla ve Düello modları
- 📱 **Mobil-First**: Tüm cihazlarda mükemmel deneyim
- ⚡ **Real-time**: Socket.io ile anlık multiplayer
- 🎨 **Modern UI**: Glassmorphism ve neon efektler
- 🔊 **Ses & Haptik**: Kapsamlı ses efektleri ve titreşim
- 💬 **Chat Sistemi**: Oyun içi mesajlaşma
- 📊 **PWA**: Offline çalışma ve app-like deneyim
- 🚀 **Performance**: 90+ Lighthouse skoru

## 🛠️ Teknoloji Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Socket.io, Prisma
- **Database**: SQLite/PostgreSQL
- **State**: Zustand
- **Animasyon**: Framer Motion
- **PWA**: Service Worker, Web App Manifest

## 🚀 Kurulum

```bash
# Repo klonla
git clone https://github.com/your-username/cift-wordle.git
cd cift-wordle

# Dependencies kur
npm install

# Environment setup
cp .env.example .env.local

# Database setup
npm run db:push
npm run db:seed

# Development başlat
npm run dev
```

## 📱 Mobil Optimizasyon

- Touch-friendly 44px+ dokunma hedefleri
- Safe area desteği (iPhone notch)
- Haptic feedback
- Swipe gestures
- Bottom sheet modaller
- PWA install prompt

## 🎯 Performance Hedefleri

- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **Bundle Size**: < 500KB
- **Lighthouse**: 90+

## 🎮 Oyun Modları

### 🔄 Sırayla Modu
- Oyuncular sırayla tahmin yapar
- Aynı kelimeyi bulmaya çalışır
- İlk doğru tahmin eden kazanır
- Her tahmin için 60 saniye süre

### ⚔️ Düello Modu
- Her oyuncunun farklı kelimesi var
- Aynı anda tahmin yapabilir
- Kelimesini ilk bulan kazanır
- Sadece renk ipuçlarını görebilir

## 🎨 Tasarım Sistemi

### Renk Paleti
- **Ana**: Neon Purple (#6c5ce7)
- **Vurgu**: Electric Blue (#00d4ff)
- **Başarı**: Cyber Green (#00ff88)
- **Uyarı**: Neon Pink (#ff006b)
- **Premium**: Golden Yellow (#ffd700)

### Tipografi
- **Başlıklar**: Orbitron (Futuristik)
- **Kod**: JetBrains Mono (Monospace)
- **Metin**: Poppins (Okunabilir)

## 📊 Veritabanı Şeması

- **Words**: Kelime veritabanı
- **Rooms**: Oyun odaları
- **Players**: Oyuncu bilgileri
- **Games**: Oyun kayıtları
- **Guesses**: Tahmin geçmişi
- **PlayerStats**: Oyuncu istatistikleri
- **Achievements**: Başarım sistemi

## 🔧 API Endpoints

- `POST /api/rooms` - Oda oluştur
- `POST /api/rooms/join` - Odaya katıl
- `POST /api/games/guess` - Tahmin yap
- `GET /api/words/random` - Rastgele kelime
- `POST /api/words/validate` - Kelime doğrula

## 🎵 Ses Sistemi

- **UI Sesleri**: Buton tıklama, geçiş efektleri
- **Oyun Sesleri**: Harf flip, kazanma, kaybetme
- **Ambient**: Arkaplan atmosferi
- **Haptik**: Mobil titreşim desteği

## 📱 PWA Özellikleri

- Offline çalışma
- App-like deneyim
- Push notifications
- Background sync
- Install prompt

## 🧪 Test Stratejisi

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Socket.io testing
- **E2E Tests**: Playwright
- **Performance**: Lighthouse CI

## 🚀 Deployment

### Vercel (Frontend)
```bash
npm run build
vercel --prod
```

### Railway (Backend)
```bash
railway up
```

## 📈 Monitoring

- **Error Tracking**: Sentry
- **Performance**: Vercel Analytics
- **Logging**: LogTail
- **Uptime**: UptimeRobot

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animasyon kütüphanesi
- [Socket.io](https://socket.io/) - Real-time iletişim
- [Zustand](https://github.com/pmndrs/zustand) - State management

## 📞 İletişim

- **Website**: [cift-wordle.vercel.app](https://cift-wordle.vercel.app)
- **Email**: info@cift-wordle.com
- **Discord**: [Çift Wordle Community](https://discord.gg/cift-wordle)

---

**Çift Wordle** ile arkadaşlarınla yarış ve Türkçe kelime bilgini test et! 🚀✨

