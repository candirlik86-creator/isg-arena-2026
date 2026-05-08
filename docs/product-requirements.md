# İSG Arena 2026 Ürün Gereksinim Dokümanı

## Ürün amacı

İSG Arena 2026, iş sağlığı ve güvenliği eğitimlerini yarışmalı, sahneye uygun ve takım bazlı bir deneyime dönüştüren interaktif bir etkinlik uygulamasıdır. Ürün, katılımcıların telefonlarından PIN ile yarışmaya girmesini, adminin akışı canlı olarak kontrol etmesini ve projeksiyon/canlı yayın ekranında izlenebilir bir oyun temposu sunulmasını hedefler.

Uygulamada kullanıcıya görünen metinlerde "Kahoot benzeri" ifadesi kullanılmayacaktır. Bu ifade yalnızca dahili ürün ve geliştirme dokümantasyonunda referans model olarak kullanılabilir.

Bu fazda backend, Firebase veya uzak veritabanı yoktur. Yarışmalar, oturum bilgileri, geçici skorlar ve oyuncu verileri localStorage ve sessionStorage üzerinden yönetilecektir.

## Videolardan çıkan Kahoot akışı

Referans akışta temel deneyim şu sırayla ilerler:

1. Admin bir yarışma akışı hazırlar.
2. Admin canlı oturumu başlatır ve projeksiyon ekranında PIN gösterilir.
3. Takımlar telefonlarından PIN ve takım adı girerek katılır.
4. Admin, akıştaki içerikleri sırayla ekrana getirir.
5. Quiz sorularında oyuncular telefonlarından cevap verir.
6. Her soru sonrasında doğru cevap, cevap dağılımı ve ara skor gösterilebilir.
7. Bilgi Slaytı ve Medya Slaytı soru olarak sayılmaz; anlatım, bilgilendirme veya geçiş amacıyla kullanılır.
8. Final veya özel etaplarda deneyim klasik soru-cevap akışı dışına çıkar.
9. Yarışmadan sonra skorlar, lider tablosu ve rapor dışarı aktarılır.

İSG Arena 2026 bu akışı temel alır, ancak Forklift Güvenli Sürüş Etabı ile sahne etkisi yüksek, markaya özgü bir final/oyun etabı sunar.

## Ana kullanıcı rolleri

### Admin

Admin; yarışma akışını oluşturan, düzenleyen, canlı oturumu başlatan, ekranları yöneten, katılımları izleyen ve sonuçları raporlayan kullanıcıdır. Admin arayüzü operasyonel, hızlı ve hata riskini azaltacak şekilde tasarlanmalıdır.

### Oyuncu / Takım

Oyuncu veya takım; telefon ekranından PIN ve takım adı ile oturuma katılır, quiz sorularını cevaplar ve gerekiyorsa final etabı kontrollerini kullanır. Oyuncu ekranında gereksiz ayarlar, uzun formlar veya QR merkezli bir giriş akışı bulunmamalıdır.

### İzleyici

İzleyici; projeksiyon veya canlı yayın ekranından soruları, slaytları, geri sayımları, cevap dağılımlarını ve lider tablosunu takip eder. Bu rol için ekranlar büyük mesafeden okunabilir ve sahne temposuna uygun olmalıdır.

## İçerik türleri: Quiz, Bilgi Slaytı, Medya Slaytı, Forklift Güvenli Sürüş Etabı

Yarışma sabit 10 sorudan oluşmayacaktır. Admin, bir yarışma içinde istediği kadar akış öğesi ekleyebilmelidir. Desteklenecek temel içerik türleri şunlardır:

### Quiz

Quiz, puanlamaya dahil olan soru tipidir. Her quiz öğesinde soru metni, cevap seçenekleri, doğru cevap, süre ve puan ayarları bulunmalıdır. Quiz sayısı dinamik olarak hesaplanır ve sadece Quiz tipindeki öğeler soru sayacına dahil edilir.

### Bilgi Slaytı

Bilgi Slaytı, katılımcılara eğitim veya yönlendirme bilgisi vermek için kullanılır. Soru sayısına dahil edilmez ve doğru/yanlış cevap mantığı taşımaz. Admin bu slaytları quizler arasında açıklama, konu geçişi veya kural anlatımı için kullanabilir.

### Medya Slaytı

Medya Slaytı, görsel veya video odaklı anlatım için kullanılır. Soru sayısına dahil edilmez. Bu içerik türü; iş güvenliği videoları, kaza senaryoları, saha görselleri veya sponsor/etkinlik medyası için kullanılabilir.

### Forklift Güvenli Sürüş Etabı

Forklift Güvenli Sürüş Etabı, uygulamanın Kahoot'tan ayrışan ana şov özelliğidir. Bu etap, klasik soru-cevap akışını genişleten, sahnede izlenebilir ve oyuncuların aktif katılım hissini artıran özel bir final veya ara etap olarak tasarlanmalıdır.

Bu etabın amacı, forklift kullanımı ve güvenli sürüş prensiplerini oyunlaştırılmış bir deneyimle pekiştirmektir. Admin, bu etabı akış içinde bir veya birden fazla kez ekleyebilmelidir. Etap puanlaması genel skora dahil edilecek şekilde tasarlanabilir; detaylı puan algoritması ilgili uygulama fazında netleştirilecektir.

## Yarışma editörü gereksinimleri

Yarışma editörü, adminin sabit bir soru sayısına bağlı kalmadan akış hazırlamasını sağlamalıdır.

Gereksinimler:

- Admin istediği kadar Quiz, Bilgi Slaytı, Medya Slaytı ve Forklift Final Etabı ekleyebilmelidir.
- Akış öğeleri silinebilmelidir.
- Akış öğeleri çoğaltılabilmelidir.
- Akış öğeleri yukarı ve aşağı taşınabilmelidir.
- Akış öğeleri düzenlenebilmelidir.
- Quiz sayısı dinamik hesaplanmalıdır.
- Bilgi Slaytı ve Medya Slaytı soru sayısına dahil edilmemelidir.
- Editör, akış sırasını kullanıcıya net göstermelidir.
- Her öğede içerik türü kolayca ayırt edilmelidir.
- Eksik veya geçersiz alanlar admin tarafından kolayca fark edilmelidir.

Editör, "10 soruluk yarışma" varsayımına göre tasarlanmamalıdır. Tüm hesaplamalar, validasyonlar, ekran başlıkları ve ilerleme göstergeleri dinamik akış yapısını temel almalıdır.

## PIN ile katılım

Katılım ana yöntemi PIN ile olacaktır. QR kod, bu fazda ana giriş yöntemi olarak ele alınmayacaktır.

Katılım ekranında yalnızca şu alanlar bulunmalıdır:

- PIN
- Takım adı

Oyuncudan e-posta, telefon, kişi adı, departman, şifre veya benzeri ek bilgiler istenmemelidir. Giriş akışı hızlı olmalı ve etkinlik ortamında bekleme yaratmamalıdır.

PIN, aktif oturumu bulmak için kullanılır. Takım adı, skor tablosunda ve raporlarda görünecek ana kimliktir.

## Admin kontrol merkezi

Admin kontrol merkezi, canlı yarışmayı yönetmek için kullanılır.

Temel gereksinimler:

- Aktif yarışma oturumunu başlatma.
- PIN'i görüntüleme.
- Katılan takımları listeleme.
- Akıştaki mevcut öğeyi görme.
- Sonraki ve önceki akış öğesine geçme.
- Quiz sorusunu başlatma ve bitirme.
- Cevapları kilitleme.
- Doğru cevabı ve sonuç ekranını gösterme.
- Lider tablosunu gösterme veya gizleme.
- Forklift Güvenli Sürüş Etabı'nı başlatma ve sonlandırma.
- Oturumu bitirme.

Admin kontrolleri sahne akışını bozmayacak kadar hızlı erişilebilir olmalıdır. Yanlışlıkla kritik aksiyon alınmasını önlemek için oturum bitirme gibi işlemlerde ek onay kullanılabilir.

## Projeksiyon/canlı yayın ekranı

Projeksiyon veya canlı yayın ekranı, izleyici deneyiminin ana ekranıdır. Bu ekran telefon ekranından farklı olarak büyük, okunabilir ve görsel olarak sahneye uygun olmalıdır.

Gereksinimler:

- Oturum başında PIN'i büyük ve net göstermelidir.
- Aktif Quiz sorusunu ve cevap seçeneklerini göstermelidir.
- Geri sayım veya süre bilgisini göstermelidir.
- Cevap toplama durumunu göstermelidir.
- Doğru cevap ve cevap dağılımını gösterebilmelidir.
- Bilgi Slaytı ve Medya Slaytı içeriklerini tam ekran veya sahneye uygun düzende göstermelidir.
- Forklift Güvenli Sürüş Etabı için özel, izlenebilir bir ekran sunmalıdır.
- Lider tablosunu admin kontrolüyle göstermelidir.

Bu ekranda kullanıcıya görünen hiçbir yerde "Kahoot benzeri" ifadesi yer almamalıdır.

## Telefon/oyuncu ekranı

Telefon/oyuncu ekranı, hızlı katılım ve cevap verme için sade tutulmalıdır.

Gereksinimler:

- Katılım ekranında sadece PIN ve takım adı bulunmalıdır.
- Oyuncu aktif oturuma bağlandıktan sonra bekleme durumunu görebilmelidir.
- Quiz sorularında cevap seçenekleri dokunmaya uygun büyük alanlarla sunulmalıdır.
- Cevap verildikten sonra oyuncuya seçiminin alındığı net gösterilmelidir.
- Bilgi Slaytı ve Medya Slaytı sırasında oyuncu ekranında bekleme veya ilgili yönlendirme durumu gösterilebilir.
- Forklift Güvenli Sürüş Etabı için gerekirse özel kontrol veya katılım ekranları sunulabilir.

Oyuncu ekranında gereksiz navigasyon, admin ayarları veya karmaşık durum bilgileri bulunmamalıdır.

## Skor, lider tablosu ve CSV/Excel raporu

Skor sistemi dinamik akış yapısını desteklemelidir. Puanlama sadece puanlamaya dahil edilen öğeler üzerinden hesaplanmalıdır.

Gereksinimler:

- Quiz cevapları doğruluk ve süreye göre puanlanabilir.
- Forklift Güvenli Sürüş Etabı genel skora dahil edilebilir.
- Bilgi Slaytı ve Medya Slaytı varsayılan olarak puan üretmez.
- Lider tablosu takım adı ve toplam puanı göstermelidir.
- Admin yarışma sonunda sonuçları CSV veya Excel uyumlu formatta dışa aktarabilmelidir.

Rapor en az şu bilgileri içermelidir:

- Takım adı
- Toplam puan
- Sıralama
- Quiz bazlı cevap durumu
- Doğru/yanlış bilgisi
- Cevap süresi veya zaman damgası
- Forklift etabı puanı varsa ilgili puan

CSV/Excel raporu, etkinlik sonrası değerlendirme ve arşivleme için kullanılacaktır.

## Lider tablosu ayarları

Lider tablosu admin tarafından kontrol edilebilir olmalıdır.

Gereksinimler:

- Lider tablosu her quizden sonra otomatik gösterilebilir veya admin tarafından manuel açılabilir.
- Admin lider tablosunu gizleyebilmelidir.
- Gösterilecek takım sayısı ayarlanabilir olmalıdır.
- Eşitlik durumunda sıralama kuralı tutarlı olmalıdır.
- Bilgi Slaytı ve Medya Slaytı lider tablosu hesaplamasını değiştirmemelidir.
- Forklift Güvenli Sürüş Etabı puanları, etap tamamlandıktan sonra lider tablosuna yansıtılabilmelidir.

Lider tablosu, sahne ekranında kısa sürede okunabilecek şekilde tasarlanmalıdır.

## Geçici teknik mimari: localStorage + sessionStorage

Bu fazda backend, Firebase, uzak veritabanı veya kimlik doğrulama altyapısı kullanılmayacaktır. Geçici teknik mimari tarayıcı depolaması üzerine kurulacaktır.

Kullanım prensipleri:

- localStorage, yarışma taslakları ve kalıcı demo verileri için kullanılabilir.
- sessionStorage, aktif oturum, geçici katılım ve canlı yarışma durumu için kullanılabilir.
- Veriler aynı cihaz ve tarayıcı bağlamında saklanacaktır.
- Çoklu cihaz senkronizasyonu bu fazın kapsamına dahil değildir.
- Gerçek zamanlı uzak bağlantı, hesap sistemi ve merkezi raporlama sonraki fazlara bırakılacaktır.

Bu mimari etkinlik demosu ve ilk ürün doğrulaması içindir. Geliştiriciler, kodu ileride backend'e taşınabilecek veri modelleriyle yazmaya özen göstermelidir; ancak bu fazda backend entegrasyonu yapılmamalıdır.

## Olmazsa olmazlar

Bu faz için kritik gereksinimler:

- Yarışma sabit 10 sorudan oluşmayacak.
- Admin sınırsız sayıda Quiz, Bilgi Slaytı, Medya Slaytı ve Forklift Final Etabı ekleyebilecek.
- Akış öğeleri silinebilecek, çoğaltılabilecek, yukarı/aşağı taşınabilecek ve düzenlenebilecek.
- Quiz sayısı dinamik hesaplanacak.
- Bilgi Slaytı ve Medya Slaytı soru sayısına dahil edilmeyecek.
- Katılım PIN ile olacak.
- QR ana katılım yöntemi olmayacak.
- Katılım ekranında sadece PIN ve takım adı olacak.
- Forklift Güvenli Sürüş Etabı ana ayrıştırıcı şov özelliği olacak.
- Kullanıcıya görünen alanlarda "Kahoot benzeri" yazmayacak.
- Backend/Firebase bu fazda kullanılmayacak.
- localStorage ve sessionStorage kullanılacak.
- Bu dokümanın oluşturulması sırasında hiçbir fonksiyonel kod dosyası değiştirilmeyecek.

## Sonra yapılabilirler

Sonraki fazlarda değerlendirilebilecek geliştirmeler:

- Backend ve merkezi veritabanı entegrasyonu.
- Firebase veya alternatif gerçek zamanlı altyapı.
- Kalıcı kullanıcı hesapları ve admin yetkilendirme.
- Çoklu cihaz ve çoklu salon desteği.
- QR ile yardımcı katılım yöntemi.
- Gelişmiş raporlama paneli.
- Excel dosyası olarak doğrudan indirme.
- Medya kütüphanesi ve dosya yükleme yönetimi.
- Forklift Güvenli Sürüş Etabı için daha detaylı fizik, animasyon ve puanlama sistemi.
- Sponsor ekranları ve etkinlik markalama ayarları.
- Takım kategorileri, departmanlar veya lokasyon bazlı filtreleme.
- İnternet üzerinden canlı katılım ve uzaktan izleme.
