# İSG Arena 2026

İSG Arena 2026; Next.js, TypeScript, Tailwind CSS ve App Router ile hazırlanmış Kahoot benzeri bir iş sağlığı ve güvenliği yarışması frontend prototipidir.

## Demo kapsamı

- 30 takımlı QR katılım akışı için statik demo ekranları
- Admin kontrol paneli taslağı
- Projeksiyon/sahne ekranı
- Mobil cevaplama ekranı
- Final ödül ve sonuç ekranı
- Local state, mock data ve statik yarışma akışı
- Backend, Firebase veya Supabase entegrasyonu yoktur

## Komutlar

```bash
npm install
npm run dev
npm run build
npm run typecheck
```

## Sayfalar

- `/` Landing page
- `/admin` Yarışma kontrol paneli
- `/screen` Projeksiyon ekranı
- `/join` Takım katılım formu
- `/play` Mobil cevaplama ekranı
- `/results` Final sonuçları

## Bağımlılık notu

`package.json` bilinçli olarak minimal tutulmuştur: runtime için sadece `next`, `react` ve `react-dom`; geliştirme/build zinciri için TypeScript, React/Node tipleri, Tailwind CSS, PostCSS ve Autoprefixer kullanılır. App Router dosyaları `src/app`, tekrar kullanılabilir bileşenler `src/components`, mock veri `src/data` ve saf yardımcı fonksiyonlar `src/lib` altında konumlanır.
