# 📈 GrafBase

**GrafBase**, kullanıcıların hızlıca veri girip çeşitli modern grafik türleri oluşturmasını, bu grafikleri özelleştirmesini ve PDF formatında dışa aktarmasını sağlayan kapsamlı ve yenilikçi bir web tabanlı grafik oluşturma uygulamasıdır.

---

## 🔗 Uygulama Web Sitesi

> [GrafBase Uygulamasını Aç](https://oyunufosu.github.io/GrafBase.github.io/)

---

## 🚀 Özellikler

### 📊 Zengin Grafik Türleri

* Çizgi (Line) Grafiği
* Izgara (Bar) Grafiği
* Pasta (Pie) Grafiği
* Gösterge (Gauge) Grafiği
* Mum (Candlestick) Grafiği
* Nüfus (Population) Grafiği
* Radar (Radar) Grafiği
* Dağılım (Scatter) Grafiği
* Alan (area) Grafiği
* Baloncuk (Bubble) Grafiği
* Yığılmış Çubuk (Stacked Bar) Grafiği
* Zaman Serisi (Time Series) Grafiği
* Polar Alan (Polar Area) Grafiği
* Isı Haritası (Heatmap) Grafiği
* Histogram Grafiği
* İbreli (Gauge) Grafiği
* İlerleme Halka (Progress Donut) Grafiği
* 📌 **Yeni:** Ağaç Haritası (Treemap) Grafiği
* 📌 **Yeni:** Keman (Violin Plot) Grafiği
* 📌 **Yeni:** Kutu Planı (Boxplot) Grafiği
* 📌 **Yeni:** Akış (stream) Grafiği


### ✍️ Kolay ve Esnek Veri Girişi

* Etiketler ve sayısal değerlerle hızlı giriş imkanı
* 📥 **Yeni:** XLS formatında veri içeri aktarma desteği  
* 🎙️ **Yeni:** Sesli veri girişi desteği *(⚠️ şu anda tüm tarayıcılarda tam olarak çalışmamaktadır)*

### 🔗 Grafik Paylaşma Özelliği

* 📤 **Yeni:** Oluşturduğunuz grafikleri tek tıkla paylaşılabilir bağlantı (link) olarak oluşturabilirsiniz
* 💬 **Yeni:** Bağlantıyı kopyalayıp başkalarıyla kolayca paylaşabilirsiniz

### 📄 PDF Dışa Aktarma

* Oluşturulan grafikleri yüksek kalitede PDF olarak indirme

* **Yeni:** Oluşturulan grafikleri yüksek kaliteli PNG olarak indirme

* **Yeni:** Oluşturulan grafikleri yüksek kaliteli PVG olarak indirme

### 💡 Hafif ve Responsive Arayüz

* Mobil ve masaüstü cihazlarda akıcı kullanım

### 🔄 Canlı Grafik Önizleme

* Anında veri görselleştirme

### 💾 Veri Kaydetme & Yükleme

* JSON formatında veri kaydedip daha sonra yükleyerek düzenleme

### 🎨 Kapsamlı Renk Özelleştirme

* Grafik elemanları için manuel renk seçimi
* Kendi renk paletini oluşturma ve uygulama
* 📌 **Yeni:** Grafiklerin renklerini gerçek zamanlı değiştirme desteği  

### 🧠 Grafik Öneri Sistemi

* 📌 **Yeni:** Girdiğiniz veriye göre en uygun grafik türünü otomatik olarak önerir 

### 🗑️ Veri Sıfırlama

* Tüm verileri tek tuşla temizleme

### 🔎 Regresyon Analizi

* Çizgi grafiklerinde regresyon çizgisi, R², RMSE hesaplama desteği *(script.js içerisinde `linearRegression()` fonksiyonu bulunur)*

---

## 🖼️ Ekran Görüntüsü

> *(Eğer varsa ekran görüntüsü ekleyebilirsiniz)*

---

## 🛠️ Kullanım

1. Web sitesine gidin: [GrafBase](#)
2. Veri etiketlerini ve sayı değerlerini girin
3. İstediğiniz grafik türünü seçin (Çizgi, Sütun, Pasta, Bubble, vs.)
4. Renk Paleti Yönetimi ile renkleri özelleştirin
5. "Grafik Oluştur" butonuna tıklayın
6. "PDF Olarak İndir" ile çıktıyı alın
7. "Veriyi Kaydet / Yükle" ile işlem yapın

---

## 📦 Kullanılan Teknolojiler

* ✅ HTML, CSS, JavaScript (Vanilla)
* 📄 [jsPDF](https://github.com/parallax/jsPDF) ile PDF çıktısı
* 📊 [Chart.js v4.4.1](https://www.chartjs.org/) ile grafik çizimi
* ⏱️ [luxon](https://moment.github.io/luxon/#/) + `chartjs-adapter-luxon` ile zaman serileri
* 📈 `chartjs-chart-financial` ile finansal grafikler (candlestick)
* 🏷️ `chartjs-plugin-datalabels` ile veri etiketleri
* ✍️ `chartjs-plugin-annotation` ile çizim/etiket/işaretleme
* 📥 **xlsx-parser** veya benzeri bir kütüphane ile `.xls` dosya içe aktarma
* 🧠 Özel algoritmalar ile grafik öneri sistemi

---

## 🎥 Video Eğitim

🎬 Adım adım anlatım için: `video.mp4` dosyasını izleyin *(proje dizinindedir)*

---

## 📄 Lisans

Bu proje herhangi bir açık kaynak lisansa tabi değildir.
Ancak isteyen herkes:

* Projeyi inceleyebilir
* İlham alabilir
* Kendi projelerinde kullanabilir

Projeden esinlenen çalışmaların **GitHub sayfamdan (@oyunufosu)** ilham aldığını belirtmesi beni mutlu eder.

---

## ✉️ İletişim

**Geliştirici:** @oyunufosu
Geri bildirim, öneri veya katkı için GitHub üzerinden benimle iletişime geçebilirsiniz.
