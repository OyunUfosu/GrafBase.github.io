// Gauge grafiği için renk belirleme fonksiyonu
function getGaugeColor(value) {
    if (value < 30) return '#ff6384'; // Kırmızı
    if (value < 70) return '#ffce56'; // Sarı
    return '#2ecc71'; // Yeşil
}

// Chart.js kayıt işlemleri
if (
    typeof Chart !== 'undefined' &&
    Chart.registry &&
    typeof window.FinancialController !== 'undefined'
) {
    Chart.register(
        Chart.ScatterController,
        window.FinancialController,
        window.CandlestickElement,
        window.FinancialController,
        window.CandlestickElement,
        window.CategoryScale,
        window.LinearScale,
        window.TimeScale,
        window.Title,
        window.Tooltip,
        window.Legend,
        window.ChartAnnotation,
        ChartDataLabels
    );
}

// ChartDataLabels eklentisini yükle
function loadChartDataLabels() {
    return new Promise((resolve, reject) => {
        if (window.ChartDataLabels) return resolve();
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

document.addEventListener('DOMContentLoaded', async function () {
    // ChartDataLabels eklentisini yükle
    await loadChartDataLabels();

// script.js dosyasında, DOMContentLoaded event listener'ı içine ekleyin

// Paylaş butonu event listener'ı
document.getElementById('shareData').addEventListener('click', generateShareableLink);

// Veriyi sıkıştırma fonksiyonu (base64 URL-safe)
function compressData(data) {
    const jsonString = JSON.stringify(data);
    // LZ-String kütüphanesi kullanarak sıkıştırma
    if (typeof LZString !== 'undefined') {
        return LZString.compressToEncodedURIComponent(jsonString);
    }
    // Fallback: base64 encode
    return btoa(encodeURIComponent(jsonString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
}

// Veriyi açma fonksiyonu
function decompressData(compressed) {
    try {
        // LZ-String kütüphanesi kullanarak açma
        if (typeof LZString !== 'undefined') {
            return JSON.parse(LZString.decompressFromEncodedURIComponent(compressed));
        }
        // Fallback: base64 decode
        return JSON.parse(decodeURIComponent(atob(compressed.replace(/-/g, '+').replace(/_/g, '/'))));
    } catch (e) {
        console.error('Veri açma hatası:', e);
        return null;
    }
}

// Paylaşılabilir bağlantı oluşturma fonksiyonu
async function generateShareableLink() {
    try {
        const tableData = getTableData();
        const chartConfig = chartInstance ? {
            type: chartInstance.config.type,
            data: chartInstance.data,
            options: chartInstance.options
        } : null;
        
        const dataToShare = {
            version: "1.1",
            tableData: tableData,
            chartConfig: chartConfig,
            colorPalette: colorPalette,
            timestamp: new Date().toISOString()
        };

        // Datalabels plugin'i kaldır (JSON.stringify sorun çıkarıyor)
        if (dataToShare.chartConfig && dataToShare.chartConfig.options && 
            dataToShare.chartConfig.options.plugins && 
            dataToShare.chartConfig.options.plugins.datalabels) {
            delete dataToShare.chartConfig.options.plugins.datalabels;
        }

        // LZ-String kütüphanesini dinamik olarak yükle
        await loadLZStringLibrary();
        
        const compressedData = compressData(dataToShare);
        const currentUrl = window.location.href.split('?')[0];
        const shareableUrl = `${currentUrl}?data=${compressedData}`;

        // Kopyalama işlemi için modal göster
        showShareModal(shareableUrl);
    } catch (error) {
        console.error('Paylaşma hatası:', error);
        showToast('Paylaşılabilir bağlantı oluşturulurken hata oluştu!', 'error');
    }
}

// LZ-String kütüphanesini yükleme fonksiyonu
function loadLZStringLibrary() {
    return new Promise((resolve, reject) => {
        if (typeof LZString !== 'undefined') return resolve();
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/lz-string@1.4.4/libs/lz-string.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Paylaşım modalını gösteren fonksiyon
function showShareModal(shareableUrl) {
    const modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="width: 500px; max-width: 90%;">
            <span class="close-share-modal">&times;</span>
            <h3>Paylaşılabilir Bağlantı</h3>
            <p>Bu bağlantıyı kopyalayarak verilerinizi başkalarıyla paylaşabilirsiniz:</p>
            <div class="share-url-container">
                <input type="text" id="shareUrlInput" value="${shareableUrl}" readonly>
                <button id="copyShareUrl" class="btn-primary"><i class="fas fa-copy"></i> Kopyala</button>
            </div>
            <div class="share-actions">
                <a href="mailto:?body=${encodeURIComponent(shareableUrl)}" class="btn-primary" id="emailShare">
                    <i class="fas fa-envelope"></i> E-posta ile gönder
                </a>
                <button class="btn-primary" id="whatsappShare">
                    <i class="fab fa-whatsapp"></i> WhatsApp ile paylaş
                </button>
            </div>
            <p class="share-note"><small>Not: Büyük veri setleri için URL çok uzun olabilir. Bu durumda "Veri Kaydet" butonunu kullanarak dosya paylaşmayı deneyin.</small></p>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Kapatma butonu
    modal.querySelector('.close-share-modal').onclick = function() {
        modal.remove();
    };
    
    // Dışarı tıklayarak kapatma
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    // Kopyalama butonu
    document.getElementById('copyShareUrl').addEventListener('click', function() {
        const input = document.getElementById('shareUrlInput');
        input.select();
        document.execCommand('copy');
        showToast('Bağlantı panoya kopyalandı!', 'success');
    });
    
    // WhatsApp paylaşım butonu
    document.getElementById('whatsappShare').addEventListener('click', function() {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareableUrl)}`, '_blank');
    });
}

// Sayfa yüklendiğinde URL'den veri okuma
function checkForSharedData() {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');
    
    if (sharedData) {
        try {
            const decompressed = decompressData(sharedData);
            if (decompressed) {
                // Kullanıcıya onay soralım
                if (confirm('Paylaşılan verileri yüklemek istiyor musunuz? Mevcut verileriniz silinecek.')) {
                    loadSharedData(decompressed);
                }
            }
        } catch (error) {
            console.error('Paylaşılan veri okuma hatası:', error);
            showToast('Paylaşılan veri okunamadı!', 'error');
        }
    }
}

// Paylaşılan verileri yükleme fonksiyonu
function loadSharedData(data) {
    // Tablo verilerini yükle
    if (data.tableData) {
        loadTableData(data.tableData);
    }
    
    // Renk paletini yükle
    if (data.colorPalette) {
        colorPalette = data.colorPalette;
    }
    
    // Grafik verilerini yükle
    if (data.chartConfig) {
        currentChartType = data.chartConfig.type;
        
        // Aktif butonu güncelle
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === currentChartType) {
                btn.classList.add('active');
            }
        });
        
        // Grafiği oluştur
        setTimeout(() => {
            const ctx = document.getElementById('chartCanvas').getContext('2d');
            if (chartInstance) chartInstance.destroy();
            
            chartInstance = new Chart(ctx, {
                type: data.chartConfig.type,
                data: data.chartConfig.data,
                options: data.chartConfig.options
            });
            
            setupChartClickHandler();
        }, 100);
    }
    
    showToast('Paylaşılan veriler başarıyla yüklendi!', 'success');
    
    // URL'den veri parametresini temizle (yeniden yükleme yapılmaması için)
    if (window.history.replaceState) {
        const cleanUrl = window.location.href.split('?')[0];
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

// DOMContentLoaded event listener'ının en sonuna ekleyin
document.addEventListener('DOMContentLoaded', function() {

// Ses tanıma için değişkenler
let recognition;
let isListening = false;

// Sesli giriş butonu
const voiceInputBtn = document.getElementById('voiceInput');

// Ses tanımayı başlatma fonksiyonu
function setupVoiceRecognition() {
    // Tarayıcı desteğini kontrol et
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        voiceInputBtn.disabled = true;
        voiceInputBtn.title = "Tarayıcınız ses tanımayı desteklemiyor";
        showToast('Tarayıcınız ses tanımayı desteklemiyor', 'error');
        return;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'tr-TR'; // Türkçe için
    
    // Ses tanıma başladığında
    recognition.onstart = function() {
        isListening = true;
        voiceInputBtn.classList.add('listening');
        showToast('Dinleniyor...', 'info');
    };
    
    // Ses tanıma bittiğinde
    recognition.onend = function() {
        isListening = false;
        voiceInputBtn.classList.remove('listening');
    };
    
    // Sonuç alındığında
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.trim();
        processVoiceInput(transcript);
    };
    
    // Hata durumunda
    recognition.onerror = function(event) {
        console.error('Ses tanıma hatası:', event.error);
        showToast(`Ses tanıma hatası: ${event.error}`, 'error');
        voiceInputBtn.classList.remove('listening');
    };
    
    // Buton event listener'ı
    voiceInputBtn.addEventListener('click', toggleVoiceRecognition);
}

// Ses tanımayı başlat/durdur
function toggleVoiceRecognition() {
    if (!recognition) {
        showToast('Ses tanıma başlatılamadı', 'error');
        return;
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (error) {
            console.error('Ses tanıma başlatma hatası:', error);
            showToast('Mikrofon erişimi reddedildi', 'error');
        }
    }
}

// Sesli girişi işleme fonksiyonu
function processVoiceInput(transcript) {
    showToast(`Algılandı: "${transcript}"`, 'success');
    
    // Aktif hücreyi bul
    const activeCell = document.querySelector('td[contenteditable="true"]:focus');
    if (activeCell) {
        // Sayısal değer kontrolü (eğer hücre sayısal bir değer bekliyorsa)
        const isNumericCell = activeCell.closest('td') && 
                             activeCell.closest('tr').querySelectorAll('td').length > 1 && 
                             activeCell.closest('td') !== activeCell.closest('tr').querySelector('td:first-child');
        
        if (isNumericCell) {
            // Türkçe sayı formatı (virgül için)
            const number = parseFloat(transcript.replace(',', '.'));
            if (!isNaN(number)) {
                activeCell.textContent = number;
            } else {
                activeCell.textContent = transcript;
            }
        } else {
            activeCell.textContent = transcript;
        }
    } else {
        // Aktif hücre yoksa, yeni satır ekle ve ilk hücreye yaz
        const tbody = dataTable.querySelector('tbody');
        const newRow = document.createElement('tr');
        const colCount = dataTable.querySelector('thead tr').children.length;
        
        for (let i = 0; i < colCount; i++) {
            const cell = document.createElement('td');
            if (i === 0) {
                cell.contentEditable = 'true';
                cell.textContent = transcript;
            } else if (i === colCount - 1) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-danger deleteRow';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Sil';
                deleteBtn.addEventListener('click', () => newRow.remove());
                cell.appendChild(deleteBtn);
            } else {
                cell.contentEditable = 'true';
                cell.textContent = '0';
            }
            newRow.appendChild(cell);
        }
        
        tbody.appendChild(newRow);
    }
    
    // Değişiklikten sonra tabloyu güncelle
    if (chartInstance) {
        updateChart();
    }
}

// Uygulama başladığında ses tanımayı ayarla
document.addEventListener('DOMContentLoaded', function() {
    // ... diğer kodlar ...
    setupVoiceRecognition();
});

    // Sayfa yüklendiğinde URL'de paylaşılan veri olup olmadığını kontrol et
    checkForSharedData();
});

    document.getElementById('recommendChart').addEventListener('click', analyzeDataForRecommendation);
    // Grafik önerisi modalını oluştur
function createRecommendationModal() {
    const modal = document.createElement('div');
    modal.id = 'recommendationModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-recommendation">&times;</span>
            <h3>Grafik Önerileri</h3>
            <div id="recommendationResults"></div>
            <button id="applyRecommendation" class="btn-primary">Öneriyi Uygula</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Modal kapatma işlevi
    document.querySelector('.close-recommendation').onclick = function() {
        modal.style.display = 'none';
    };
    
    // Dışarı tıklayarak kapatma
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
    
    // Öneriyi uygula butonu
    document.getElementById('applyRecommendation').addEventListener('click', function() {
        const selectedRecommendation = document.querySelector('.recommendation-item.selected');
        if (selectedRecommendation) {
            const chartType = selectedRecommendation.dataset.type;
            currentChartType = chartType;
            
            // Aktif butonu güncelle
            document.querySelectorAll('.chart-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.type === chartType) {
                    btn.classList.add('active');
                }
            });
            
            updateChart();
            modal.style.display = 'none';
            showToast('Önerilen grafik uygulandı!', 'success');
        }
    });
    
    return modal;
}

// Veriyi analiz ederek grafik önerileri oluştur
function analyzeDataForRecommendation() {
    const { headers, rows } = getTableData();
    if (rows.length === 0 || headers.length === 0) {
        showToast('Öneri için yeterli veri bulunamadı!', 'error');
        return;
    }

    // Veri özelliklerini analiz et
    const analysis = {
        rowCount: rows.length,
        columnCount: headers.length,
        numericColumns: 0,
        timeBased: false,
        hasNegativeValues: false,
        hasZeroValues: false,
        valueRange: { min: Infinity, max: -Infinity },
        uniqueCategories: new Set(),
        valueDistribution: {},
        columnTypes: []
    };

    // Sütun tiplerini belirle
    headers.forEach((header, colIndex) => {
        let isNumeric = true;
        let isDate = false;
        const values = [];
        
        rows.forEach(row => {
            const value = row[colIndex];
            values.push(value);
            
            // Kategorik veri kontrolü
            if (typeof value === 'string' && isNaN(parseFloat(value))) {
                isNumeric = false;
                analysis.uniqueCategories.add(value);
            }
            
            // Tarih kontrolü
            if (typeof value === 'string') {
                const date = luxon.DateTime.fromISO(value);
                if (date.isValid) {
                    isDate = true;
                    isNumeric = false;
                }
            }
            
            // Sayısal değer analizi
            if (typeof value === 'number') {
                analysis.valueRange.min = Math.min(analysis.valueRange.min, value);
                analysis.valueRange.max = Math.max(analysis.valueRange.max, value);
                
                if (value < 0) analysis.hasNegativeValues = true;
                if (value === 0) analysis.hasZeroValues = true;
            }
        });
        
        // Sütun tipini kaydet
        analysis.columnTypes.push({
            name: header,
            isNumeric,
            isDate,
            uniqueValues: new Set(values).size
        });
        
        if (isNumeric) analysis.numericColumns++;
    });

    // Zaman serisi kontrolü
    analysis.timeBased = analysis.columnTypes[0]?.isDate || false;

    // Öneri puanlarını hesapla
    const recommendations = [
        { type: 'line', score: 0, description: 'Zaman içindeki değişimleri göstermek için uygun' },
        { type: 'bar', score: 0, description: 'Kategorik verileri karşılaştırmak için uygun' },
        { type: 'pie', score: 0, description: 'Parçaların bütün içindeki oranını göstermek için uygun' },
        { type: 'doughnut', score: 0, description: 'Pasta grafiğine benzer, daha modern bir alternatif' },
        { type: 'radar', score: 0, description: 'Çoklu değişkenleri karşılaştırmak için uygun' },
        { type: 'scatter', score: 0, description: 'İki değişken arasındaki ilişkiyi göstermek için uygun' },
        { type: 'bubble', score: 0, description: 'Üç boyutlu verileri göstermek için uygun' },
        { type: 'area', score: 0, description: 'Zaman içindeki değişimleri vurgulamak için uygun' },
        { type: 'stackedBar', score: 0, description: 'Kategorilerin bileşenlerini göstermek için uygun' },
        { type: 'timeseries', score: 0, description: 'Zaman serisi verileri için optimize edilmiş' },
        { type: 'polarArea', score: 0, description: 'Radar grafiğine benzer, daha vurgulu bir alternatif' },
        { type: 'heatmap', score: 0, description: 'Yoğunlukları ve korelasyonları göstermek için uygun' },
        { type: 'histogram', score: 0, description: 'Veri dağılımını göstermek için uygun' },
        { type: 'violin', score: 0, description: 'Dağılımın yoğunluğunu ve aralığını gösterir' },
        { type: 'boxplot', score: 0, description: 'Verilerin istatistiksel özelliklerini gösterir' },
        { type: 'stream', score: 0, description: 'Zaman içindeki bileşen değişimlerini gösterir' },
        { type: 'treemap', score: 0, description: 'Hiyerarşik verileri göstermek için uygun' },
        { type: 'population', score: 0, description: 'Yaş dağılımı gibi veriler için uygun' }
    ];

    // Puanlama kuralları
    recommendations.forEach(rec => {
        switch(rec.type) {
            case 'line':
            case 'area':
            case 'timeseries':
                if (analysis.timeBased) rec.score += 30;
                if (analysis.numericColumns >= 2) rec.score += 20;
                if (analysis.rowCount > 5) rec.score += 10;
                break;
                
            case 'bar':
            case 'stackedBar':
                if (analysis.columnCount >= 2) rec.score += 20;
                if (analysis.rowCount <= 10) rec.score += 15;
                if (analysis.numericColumns >= 1) rec.score += 10;
                break;
                
            case 'pie':
            case 'doughnut':
            case 'polarArea':
                if (analysis.rowCount <= 7) rec.score += 30;
                if (analysis.columnCount === 2) rec.score += 20;
                if (!analysis.hasNegativeValues) rec.score += 10;
                break;
                
            case 'radar':
                if (analysis.columnCount >= 3) rec.score += 20;
                if (analysis.rowCount <= 10) rec.score += 15;
                if (!analysis.hasNegativeValues) rec.score += 5;
                break;
                
            case 'scatter':
            case 'bubble':
                if (analysis.numericColumns >= 2) rec.score += 30;
                if (analysis.rowCount >= 10) rec.score += 20;
                break;
                
            case 'heatmap':
                if (analysis.columnCount >= 3 && analysis.rowCount >= 3) rec.score += 30;
                if (analysis.numericColumns >= 2) rec.score += 20;
                break;
                
            case 'histogram':
            case 'violin':
            case 'boxplot':
                if (analysis.numericColumns >= 1) rec.score += 30;
                if (analysis.rowCount >= 15) rec.score += 20;
                break;
                
            case 'stream':
                if (analysis.columnCount >= 3 && analysis.rowCount >= 5) rec.score += 30;
                if (analysis.timeBased) rec.score += 20;
                break;
                
            case 'treemap':
                if (analysis.columnCount === 2) rec.score += 30;
                if (analysis.rowCount >= 5) rec.score += 15;
                break;
                
            case 'population':
                if (analysis.columnCount === 3) rec.score += 30;
                if (analysis.hasNegativeValues) rec.score += 20;
                break;
        }
    });

    // Puanlara göre sırala
    recommendations.sort((a, b) => b.score - a.score);
    
    // En iyi 5 öneriyi al
    const topRecommendations = recommendations.slice(0, 5);
    
    // Öneri modalını göster
    const modal = document.getElementById('recommendationModal') || createRecommendationModal();
    const resultsContainer = document.getElementById('recommendationResults');
    resultsContainer.innerHTML = '';
    
    topRecommendations.forEach((rec, index) => {
        const recItem = document.createElement('div');
        recItem.className = 'recommendation-item';
        recItem.dataset.type = rec.type;
        recItem.innerHTML = `
            <h4>${index + 1}. ${getChartTypeName(rec.type)} <span class="score">${rec.score}p</span></h4>
            <p>${rec.description}</p>
        `;
        
        // İlk öğeyi seçili yap
        if (index === 0) recItem.classList.add('selected');
        
        recItem.addEventListener('click', function() {
            document.querySelectorAll('.recommendation-item').forEach(item => {
                item.classList.remove('selected');
            });
            this.classList.add('selected');
        });
        
        resultsContainer.appendChild(recItem);
    });
    
    modal.style.display = 'block';
}

// Grafik tipi adlarını döndür
function getChartTypeName(type) {
    const names = {
        'line': 'Çizgi Grafiği',
        'bar': 'Izgara Grafiği',
        'pie': 'Pasta Grafiği',
        'doughnut': 'Gösterge Grafiği',
        'radar': 'Radar Grafiği',
        'scatter': 'Dağılım Grafiği',
        'area': 'Alan Grafiği',
        'bubble': 'Bubble Grafiği',
        'stackedBar': 'Stacked Bar Grafiği',
        'timeseries': 'Zaman Serisi',
        'polarArea': 'Polar Area Grafiği',
        'heatmap': 'Heatmap Grafiği',
        'histogram': 'Histogram Grafiği',
        'violin': 'Violin Plot',
        'boxplot': 'Boxplot Grafiği',
        'stream': 'Stream Graph',
        'treemap': 'Treemap Grafiği',
        'population': 'Nüfus Piramidi',
        'candlestick': 'Mum Grafiği',
        'gauge': 'Gösterge Grafiği',
        'progressDonut': 'Progress Donut'
    };
    return names[type] || type;
}
    
    // Renk seçici modal elementi
    const colorPickerModal = document.createElement('div');
    colorPickerModal.id = 'colorPickerModal';
    colorPickerModal.className = 'modal';
    colorPickerModal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>Renk Seçin</h3>
            <input type="color" id="selectedColor" value="#ff0000">
            <button id="applyColor" class="btn-primary">Uygula</button>
        </div>
    `;
    document.body.appendChild(colorPickerModal);

    // Renk paleti seçici ekleme
    const colorPaletteBtn = document.createElement('button');
    colorPaletteBtn.id = 'colorPaletteBtn';
    colorPaletteBtn.className = 'btn-primary';
    colorPaletteBtn.innerHTML = '<i class="fas fa-palette"></i> Renk Paleti';
    document.querySelector('.chart-types').appendChild(colorPaletteBtn);

    // Renk paleti modalı
    const paletteModal = document.createElement('div');
    paletteModal.id = 'paletteModal';
    paletteModal.className = 'modal';
    paletteModal.innerHTML = `
        <div class="modal-content">
            <span class="close-palette">&times;</span>
            <h3>Renk Paletini Düzenle</h3>
            <div id="paletteContainer"></div>
            <button id="addColor" class="btn-primary"><i class="fas fa-plus"></i> Renk Ekle</button>
            <button id="savePalette" class="btn-success">Kaydet</button>
        </div>
    `;
    document.body.appendChild(paletteModal);

    // Renk paleti işlevleri
    document.getElementById('colorPaletteBtn').addEventListener('click', function() {
        const container = document.getElementById('paletteContainer');
        container.innerHTML = '';
        
        colorPalette.forEach((color, index) => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'palette-item';
            colorDiv.innerHTML = `
                <input type="color" value="${color}" class="palette-color">
                <button class="btn-icon remove-color" data-index="${index}"><i class="fas fa-trash"></i></button>
            `;
            container.appendChild(colorDiv);
        });
        
        paletteModal.style.display = 'block';
    });

    document.querySelector('.close-palette').onclick = function() {
        paletteModal.style.display = 'none';
    };

    document.getElementById('addColor').addEventListener('click', function() {
        const container = document.getElementById('paletteContainer');
        const colorDiv = document.createElement('div');
        colorDiv.className = 'palette-item';
        colorDiv.innerHTML = `
            <input type="color" value="#ffffff" class="palette-color">
            <button class="btn-icon remove-color"><i class="fas fa-trash"></i></button>
        `;
        container.appendChild(colorDiv);
    });

    document.getElementById('paletteContainer').addEventListener('click', function(e) {
        if (e.target.closest('.remove-color')) {
            e.target.closest('.palette-item').remove();
        }
    });

    document.getElementById('savePalette').addEventListener('click', function() {
        const colors = [];
        document.querySelectorAll('.palette-color').forEach(input => {
            colors.push(input.value);
        });
        
        if (colors.length > 0) {
            colorPalette = colors;
            paletteModal.style.display = 'none';
            if (chartInstance) updateChart();
            showToast('Renk paleti kaydedildi!', 'success');
        } else {
            showToast('En az bir renk eklemelisiniz!', 'error');
        }
    });

    // Modal işlevleri
    const closeModal = document.querySelector('.close');
    const applyColorBtn = document.getElementById('applyColor');
    const selectedColorInput = document.getElementById('selectedColor');
    let selectedDatasetIndex = null;
    let selectedDataIndex = null;

    closeModal.onclick = function() {
        colorPickerModal.style.display = 'none';
    };

    applyColorBtn.onclick = function() {
        if (selectedDatasetIndex !== null && selectedDataIndex !== null && chartInstance) {
            const newColor = selectedColorInput.value;
            
            if (Array.isArray(chartInstance.data.datasets[selectedDatasetIndex].backgroundColor)) {
                chartInstance.data.datasets[selectedDatasetIndex].backgroundColor[selectedDataIndex] = newColor;
            } else {
                chartInstance.data.datasets[selectedDatasetIndex].backgroundColor = newColor;
            }
            
            if (Array.isArray(chartInstance.data.datasets[selectedDatasetIndex].borderColor)) {
                chartInstance.data.datasets[selectedDatasetIndex].borderColor[selectedDataIndex] = newColor;
            } else {
                chartInstance.data.datasets[selectedDatasetIndex].borderColor = newColor;
            }
            
            chartInstance.update();
            colorPickerModal.style.display = 'none';
        }
    };

    window.onclick = function(event) {
        if (event.target == colorPickerModal) {
            colorPickerModal.style.display = 'none';
        }
    };

    // Grafik tıklama işleyicisi
    function setupChartClickHandler() {
        const chartCanvas = document.getElementById('chartCanvas');
        if (!chartCanvas) return;
        
        chartCanvas.onclick = function(evt) {
            if (!chartInstance) return;
            
            const points = chartInstance.getElementsAtEventForMode(
                evt, 'nearest', { intersect: true }, true
            );
            
            if (points.length) {
                const firstPoint = points[0];
                selectedDatasetIndex = firstPoint.datasetIndex;
                selectedDataIndex = firstPoint.index;
                
                const dataset = chartInstance.data.datasets[selectedDatasetIndex];
                let currentColor = dataset.backgroundColor;
                
                if (Array.isArray(currentColor)) {
                    currentColor = currentColor[selectedDataIndex];
                }
                
                if (currentColor && currentColor.startsWith('rgba')) {
                    currentColor = rgbaToHex(currentColor);
                }
                
                selectedColorInput.value = currentColor || '#ff0000';
                colorPickerModal.style.display = 'block';
            }
        };
    }

    // RGBA rengini HEX'e çevirme
    function rgbaToHex(rgba) {
        const parts = rgba.substring(rgba.indexOf('(')).split(',');
        const r = parseInt(parts[0].substring(1).trim(), 10);
        const g = parseInt(parts[1].trim(), 10);
        const b = parseInt(parts[2].trim(), 10);
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // HEX rengini RGBA'ya çevirme
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Diğer değişkenler ve fonksiyonlar
    const addColumnBtn = document.getElementById('addColumn');
    const addRowBtn = document.getElementById('addRow');
    const importDataBtn = document.getElementById('importData');
    const generateChartBtn = document.getElementById('generateChart');
    const dataTable = document.getElementById('dataTable');
    const downloadPdfBtn = document.getElementById('downloadPdf');
    const chartBtns = document.querySelectorAll('.chart-btn');
    const fileInput = document.getElementById('fileInput');
    const saveDataBtn = document.getElementById('saveData');
    const loadDataBtn = document.getElementById('loadData');
    const loadDataInput = document.getElementById('loadDataInput');
    
    let currentChartType = 'line';
    let chartInstance = null;
    let colorPalette = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#8AC24A', '#EA5F89',
        '#00ACC1', '#FF7043', '#9CCC65', '#AB47BC'
    ];

    // SheetJS (xlsx) kütüphanesini dinamik olarak yükle
    function loadXLSXLibrary() {
        return new Promise((resolve, reject) => {
            if (window.XLSX) return resolve();
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // CSV dosyasını işle
    function processCSV(content) {
        const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length === 0) return { headers: [], rows: [] };

        const parseCSVLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            let quoteChar = '"';
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"' || char === "'") {
                    if (!inQuotes) {
                        inQuotes = true;
                        quoteChar = char;
                        continue;
                    } else if (char === quoteChar) {
                        inQuotes = false;
                        continue;
                    }
                }
                
                if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                    continue;
                }
                
                current += char;
            }
            result.push(current.trim());
            return result;
        };

        const headers = parseCSVLine(lines[0]).map(h => h.replace(/^['"]|['"]$/g, ''));
        const rows = [];
        
        for (let i = 1; i < lines.length; i++) {
            const parsed = parseCSVLine(lines[i]);
            const row = headers.map((_, index) => {
                const value = parsed[index] || '';
                const numValue = parseFloat(value.replace(',', '.'));
                return isNaN(numValue) ? value : numValue;
            });
            rows.push(row);
        }

        return { headers, rows };
    }

    // Excel dosyasını işle
    async function processExcel(file) {
        await loadXLSXLibrary();
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
            header: 1, 
            defval: null,
            raw: false
        });

        const headers = (jsonData[0] || []).map(h => {
            if (h === null || h === undefined) return '';
            return String(h).trim();
        }).filter(h => h !== '');

        const rows = [];
        for (let i = 1; i < jsonData.length; i++) {
            const rowData = jsonData[i] || [];
            const row = headers.map((_, index) => {
                const cell = rowData[index];
                
                if (cell === null || cell === undefined || cell === '') {
                    return null;
                }
                
                const numValue = typeof cell === 'number' ? cell : parseFloat(String(cell).replace(',', '.'));
                return isNaN(numValue) ? String(cell).trim() : numValue;
            });
            
            if (row.some(cell => cell !== null)) {
                rows.push(row);
            }
        }

        return { headers, rows };
    }

    // Verileri tabloya ekle
    function importToTable({ headers, rows }) {
        const headerRow = dataTable.querySelector('thead tr');
        const tbody = dataTable.querySelector('tbody');
        
        // Başlıkları temizle
        while (headerRow.children.length > 2) {
            headerRow.removeChild(headerRow.children[1]);
        }
        
        // Yeni başlıkları ekle
        data.headers.forEach((header, i) => {
            const newHeaderCell = document.createElement('th');
            newHeaderCell.innerHTML = `
                ${header}
                <button class="btn-icon edit-header"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete-col"><i class="fas fa-times"></i></button>
            `;
            headerRow.insertBefore(newHeaderCell, headerRow.lastElementChild);
        });
        
        // Satırları temizle ve yenilerini ekle
        tbody.innerHTML = '';
        data.rows.forEach((row, rowIndex) => {
            const newRow = document.createElement('tr');
            
            // Kategori hücresi
            const categoryCell = document.createElement('td');
            categoryCell.contentEditable = 'true';
            categoryCell.textContent = row[0] || `Kategori ${rowIndex + 1}`;
            newRow.appendChild(categoryCell);
            
            // Değer hücreleri
            for (let i = 1; i < row.length; i++) {
                const cell = document.createElement('td');
                cell.contentEditable = 'true';
                cell.textContent = row[i];
                newRow.appendChild(cell);
            }
            
            // Sil butonu
            const actionCell = document.createElement('td');
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-danger deleteRow';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Sil';
            deleteBtn.addEventListener('click', () => newRow.remove());
            actionCell.appendChild(deleteBtn);
            newRow.appendChild(actionCell);
            
            tbody.appendChild(newRow);
        });
        
        setupHeaderButtons();
    }

    // Toast mesajı gösterme fonksiyonu
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
        
        return toast;
    }

    function setupHeaderButtons() {
        document.querySelectorAll('.edit-header').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const th = this.closest('th');
                const currentText = th.childNodes[0].textContent.trim();
                const newText = prompt('Başlığı düzenle:', currentText);
                if (newText && newText !== currentText) {
                    th.childNodes[0].textContent = newText;
                    if (chartInstance) updateChart();
                }
            });
        });

        document.querySelectorAll('.delete-col').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const th = this.closest('th');
                const colIndex = Array.from(th.parentNode.children).indexOf(th);
                if (confirm('Bu sütunu silmek istediğinize emin misiniz?')) {
                    document.querySelectorAll('tr').forEach(row => {
                        const cell = row.children[colIndex];
                        if (cell) cell.remove();
                    });
                    if (chartInstance) updateChart();
                }
            });
        });
    }

    // Tablo verilerini alma fonksiyonu
    function getTableData() {
        const headers = [];
        const rows = [];
        
        // Başlıkları al
        const headerRow = dataTable.querySelector('thead tr');
        headerRow.querySelectorAll('th').forEach((th, index) => {
            if (index !== 0 && index !== headerRow.children.length - 1) {
                headers.push(th.childNodes[0].textContent.trim());
            }
        });
        
        // Satır verilerini al
        dataTable.querySelectorAll('tbody tr').forEach(row => {
            const rowData = [];
            row.querySelectorAll('td').forEach((td, index) => {
                if (index !== row.children.length - 1) { // Son sütun (işlem butonları) hariç
                    const value = td.textContent.trim();
                    const numValue = parseFloat(value.replace(',', '.'));
                    rowData.push(isNaN(numValue) ? value : numValue);
                }
            });
            rows.push(rowData);
        });
        
        return { headers, rows };
    }

    // Tablo verilerini yükleme fonksiyonu
    function loadTableData(data) {
        const headerRow = dataTable.querySelector('thead tr');
        const tbody = dataTable.querySelector('tbody');
        
        // Başlıkları temizle
        while (headerRow.children.length > 2) {
            headerRow.removeChild(headerRow.children[1]);
        }
        
        // Yeni başlıkları ekle
        data.headers.forEach((header, i) => {
            const newHeaderCell = document.createElement('th');
            newHeaderCell.innerHTML = `
                ${header}
                <button class="btn-icon edit-header"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete-col"><i class="fas fa-times"></i></button>
            `;
            headerRow.insertBefore(newHeaderCell, headerRow.lastElementChild);
        });
        
        // Satırları temizle ve yenilerini ekle
        tbody.innerHTML = '';
        data.rows.forEach((row, rowIndex) => {
            const newRow = document.createElement('tr');
            
            // Kategori hücresi
            const categoryCell = document.createElement('td');
            categoryCell.contentEditable = 'true';
            categoryCell.textContent = row[0] || `Kategori ${rowIndex + 1}`;
            newRow.appendChild(categoryCell);
            
            // Değer hücreleri
            for (let i = 1; i < row.length; i++) {
                const cell = document.createElement('td');
                cell.contentEditable = 'true';
                cell.textContent = row[i];
                newRow.appendChild(cell);
            }
            
            // Sil butonu
            const actionCell = document.createElement('td');
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-danger deleteRow';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Sil';
            deleteBtn.addEventListener('click', () => newRow.remove());
            actionCell.appendChild(deleteBtn);
            newRow.appendChild(actionCell);
            
            tbody.appendChild(newRow);
        });
        
        setupHeaderButtons();
    }

    function updateChart() {
        if (chartInstance) chartInstance.destroy();
        const ctx = document.getElementById('chartCanvas').getContext('2d');

        // Stream Graph
if (currentChartType === 'stream') {
    const categories = [];
    const headers = [];
    const headerRow = dataTable.querySelector('thead tr');
    
    // Başlıkları al
    headerRow.querySelectorAll('th').forEach((th, index) => {
        if (index !== 0 && index !== headerRow.children.length - 1) {
            headers.push(th.childNodes[0].textContent.trim());
        }
    });

    // Kategorileri al
    dataTable.querySelectorAll('tbody tr').forEach(row => {
        const firstCell = row.querySelector('td');
        if (firstCell) categories.push(firstCell.textContent.trim());
    });

    // Veri setlerini oluştur
    const chartDatasets = headers.map((header, headerIndex) => {
        const data = [];
        dataTable.querySelectorAll('tbody tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells[headerIndex + 1]) {
                data.push(parseFloat(cells[headerIndex + 1].textContent) || 0);
            }
        });
        
        return {
            label: header,
            data: data,
            backgroundColor: hexToRgba(colorPalette[headerIndex % colorPalette.length], 0.7),
            borderColor: colorPalette[headerIndex % colorPalette.length],
            borderWidth: 0,
            fill: true,
            tension: 0.4
        };
    });

    // Stream Graph için verileri normalize et (merkez çizgisi etrafında)
    const normalizedData = [];
    const timePoints = headers.length;
    
    for (let i = 0; i < timePoints; i++) {
        let sum = 0;
        for (let j = 0; j < chartDatasets.length; j++) {
            sum += chartDatasets[j].data[i] || 0;
        }
        
        let cumulative = 0;
        for (let j = 0; j < chartDatasets.length; j++) {
            const value = chartDatasets[j].data[i] || 0;
            const normalizedValue = (value / sum) * 100;
            cumulative += normalizedValue;
            
            if (!normalizedData[j]) {
                normalizedData[j] = {
                    label: chartDatasets[j].label,
                    data: [],
                    backgroundColor: chartDatasets[j].backgroundColor,
                    borderColor: chartDatasets[j].borderColor,
                    borderWidth: 0,
                    fill: true
                };
            }
            
            normalizedData[j].data.push(cumulative - normalizedValue / 2);
        }
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: categories,
            datasets: normalizedData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const originalData = chartDatasets[context.datasetIndex].data[context.dataIndex];
                            return `${context.dataset.label}: ${originalData}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    display: true
                },
                y: {
                    stacked: true,
                    display: false // Y eksenini gizle
                }
            },
            elements: {
                line: {
                    tension: 0.4 // Daha yumuşak eğriler
                }
            }
        }
    });
    
    // Stream Graph stilini uygula
    ctx.canvas.parentNode.classList.add('stream-chart');
    setupChartClickHandler();
    return;
}

        // Boxplot grafiği
if (currentChartType === 'boxplot') {
    const datasets = [];
    const labels = [];
    const headerRow = dataTable.querySelector('thead tr');
    const headers = [];
    
    // Başlıkları al
    headerRow.querySelectorAll('th').forEach((th, index) => {
        if (index !== 0 && index !== headerRow.children.length - 1) {
            headers.push(th.childNodes[0].textContent.trim());
        }
    });

    // Verileri topla
    headers.forEach((header, headerIndex) => {
        const values = [];
        dataTable.querySelectorAll('tbody tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells[headerIndex + 1]) {
                const value = parseFloat(cells[headerIndex + 1].textContent);
                if (!isNaN(value)) {
                    values.push(value);
                }
            }
        });

        if (values.length > 0) {
            // Boxplot hesaplamaları
            values.sort((a, b) => a - b);
            const q1 = quantile(values, 0.25);
            const median = quantile(values, 0.5);
            const q3 = quantile(values, 0.75);
            const iqr = q3 - q1;
            const min = Math.max(values[0], q1 - 1.5 * iqr);
            const max = Math.min(values[values.length - 1], q3 + 1.5 * iqr);
            const outliers = values.filter(v => v < min || v > max);

            datasets.push({
                label: header,
                data: {
                    min: min,
                    q1: q1,
                    median: median,
                    q3: q3,
                    max: max,
                    outliers: outliers
                },
                backgroundColor: hexToRgba(colorPalette[headerIndex % colorPalette.length], 0.5),
                borderColor: colorPalette[headerIndex % colorPalette.length],
                borderWidth: 1
            });
        }
    });

    if (datasets.length === 0) {
        showToast('Boxplot oluşturmak için sayısal veri bulunamadı!', 'error');
        return;
    }

    // Canvas'ı temizle
    const canvas = document.getElementById('chartCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Boxplot çizme fonksiyonu
    function drawBoxplot() {
        const container = canvas.parentNode;
        const width = container.clientWidth;
        const height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;

        const padding = 40;
        const boxWidth = 30;
        const availableHeight = height - 2 * padding;
        const availableWidth = width - 2 * padding;
        const xStep = availableWidth / (datasets.length + 1);

        // Y ekseni ölçeklendirme
        const allValues = datasets.flatMap(d => [
            d.data.min, d.data.q1, d.data.median, d.data.q3, d.data.max, ...d.data.outliers
        ]);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const valueRange = maxValue - minValue;

        // Eksenleri çiz
        ctx.beginPath();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        // Y ekseni
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        
        // X ekseni
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Y ekseni etiketleri
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = '10px Arial';
        for (let i = 0; i <= 10; i++) {
            const value = minValue + (i / 10) * valueRange;
            const y = height - padding - (i / 10) * availableHeight;
            ctx.fillText(value.toFixed(2), padding - 5, y);
            ctx.beginPath();
            ctx.moveTo(padding - 3, y);
            ctx.lineTo(padding, y);
            ctx.stroke();
        }

        // Boxplot'ları çiz
        datasets.forEach((dataset, i) => {
            const x = padding + (i + 1) * xStep;
            const color = colorPalette[i % colorPalette.length];

            // Min-Max çizgisi
            const minY = height - padding - ((dataset.data.min - minValue) / valueRange) * availableHeight;
            const maxY = height - padding - ((dataset.data.max - minValue) / valueRange) * availableHeight;
            
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.moveTo(x, minY);
            ctx.lineTo(x, maxY);
            ctx.stroke();

            // Kutu
            const q1Y = height - padding - ((dataset.data.q1 - minValue) / valueRange) * availableHeight;
            const q3Y = height - padding - ((dataset.data.q3 - minValue) / valueRange) * availableHeight;
            const medianY = height - padding - ((dataset.data.median - minValue) / valueRange) * availableHeight;
            
            ctx.fillStyle = hexToRgba(color, 0.3);
            ctx.fillRect(x - boxWidth/2, q3Y, boxWidth, q1Y - q3Y);
            ctx.strokeRect(x - boxWidth/2, q3Y, boxWidth, q1Y - q3Y);
            
            // Medyan çizgisi
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.moveTo(x - boxWidth/2, medianY);
            ctx.lineTo(x + boxWidth/2, medianY);
            ctx.stroke();

            // Outlier'lar
            dataset.data.outliers.forEach(outlier => {
                const outlierY = height - padding - ((outlier - minValue) / valueRange) * availableHeight;
                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.arc(x, outlierY, 3, 0, Math.PI * 2);
                ctx.fill();
            });

            // Etiket
            ctx.textAlign = 'center';
            ctx.fillStyle = '#333';
            ctx.fillText(dataset.label, x, height - padding + 20);
        });
    }

    // Boxplot'u çiz
    drawBoxplot();

    // Chart instance'ı oluştur (diğer fonksiyonlarla uyumlu olması için)
    chartInstance = {
        destroy: function() {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        update: function() {
            this.destroy();
            updateChart();
        }
    };

    // Boxplot stilini uygula
    canvas.parentNode.classList.add('boxplot-chart');
    return;
}

// Quantile hesaplama fonksiyonu
function quantile(sortedArray, q) {
    const pos = (sortedArray.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    
    if (sortedArray[base + 1] !== undefined) {
        return sortedArray[base] + rest * (sortedArray[base + 1] - sortedArray[base]);
    } else {
        return sortedArray[base];
    }
}

// Violin Plot grafiği
if (currentChartType === 'violin') {
    const values = [];
    const labels = [];
    
    // Verileri topla
    dataTable.querySelectorAll('tbody tr').forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            labels.push(cells[0].textContent.trim());
            for (let i = 1; i < cells.length - 1; i++) {
                const value = parseFloat(cells[i].textContent);
                if (!isNaN(value)) {
                    values.push({
                        label: cells[0].textContent.trim(),
                        value: value
                    });
                }
            }
        }
    });

    if (values.length === 0) {
        showToast('Violin Plot oluşturmak için sayısal veri bulunamadı!', 'error');
        return;
    }

    // Verileri gruplara ayır
    const groupedData = {};
    values.forEach(item => {
        if (!groupedData[item.label]) {
            groupedData[item.label] = [];
        }
        groupedData[item.label].push(item.value);
    });

    // Kernel Density Estimation fonksiyonu
    function kernelDensityEstimation(data, bandwidth = 1) {
        const min = Math.min(...data) - bandwidth * 3;
        const max = Math.max(...data) + bandwidth * 3;
        const step = (max - min) / 100;
        const points = [];
        
        // Gaussian kernel fonksiyonu
        const kernel = u => Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
        
        for (let x = min; x <= max; x += step) {
            let density = 0;
            for (let i = 0; i < data.length; i++) {
                density += kernel((x - data[i]) / bandwidth);
            }
            density /= (data.length * bandwidth);
            points.push({ x, density });
        }
        
        return points;
    }

    // Violin şekillerini oluştur
    const violinDatasets = Object.keys(groupedData).map((label, index) => {
        const data = groupedData[label];
        const kde = kernelDensityEstimation(data);
        const maxDensity = Math.max(...kde.map(d => d.density));
        
        // Violin şekli için pozitif ve negatif noktalar
        const violinPoints = kde.map(point => ({
            x: label,
            y: point.x,
            v: point.density / maxDensity // normalize edilmiş yoğunluk
        }));

        return {
            label: label,
            data: violinPoints,
            backgroundColor: hexToRgba(colorPalette[index % colorPalette.length], 0.5),
            borderColor: colorPalette[index % colorPalette.length],
            borderWidth: 1
        };
    });

    chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: violinDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    title: {
                        display: true,
                        text: 'Gruplar'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Değerler'
                    }
                }
            },
            elements: {
                point: {
                    radius: function(context) {
                        // Violin şeklini oluşturmak için nokta boyutunu ayarla
                        const data = context.dataset.data[context.dataIndex];
                        return Math.max(1, Math.abs(data.v * 20)); // Yoğunluğa göre boyut
                    },
                    pointStyle: 'rect',
                    rotation: 45
                }
            }
        }
    });

    // Violin stilini uygula
    ctx.canvas.parentNode.classList.add('violin-chart');
    setupChartClickHandler();
    return;
}

        // Treemap grafiği
if (currentChartType === 'treemap') {
    if (chartInstance) chartInstance.destroy();
    
    const ctx = document.getElementById('chartCanvas');
    ctx.parentNode.classList.add('treemap-chart');
    
    // Verileri topla
    const data = [];
    const labels = [];
    const headerRow = dataTable.querySelector('thead tr');
    const headers = [];
    
    // Başlıkları al
    headerRow.querySelectorAll('th').forEach((th, index) => {
        if (index !== 0 && index !== headerRow.children.length - 1) {
            headers.push(th.childNodes[0].textContent.trim());
        }
    });

    // Verileri ve etiketleri topla
    dataTable.querySelectorAll('tbody tr').forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            labels.push(cells[0].textContent.trim());
            for (let i = 1; i < cells.length - 1; i++) {
                const value = parseFloat(cells[i].textContent) || 0;
                if (!data[i - 1]) {
                    data[i - 1] = {
                        label: headers[i - 1],
                        values: []
                    };
                }
                data[i - 1].values.push(value);
            }
        }
    });

    // Treemap oluşturmak için canvas'ı temizle
    ctx.width = ctx.parentNode.clientWidth;
    ctx.height = ctx.parentNode.clientHeight;
    const context = ctx.getContext('2d');
    context.clearRect(0, 0, ctx.width, ctx.height);

    // Treemap verilerini hazırla (ilk sütunun değerlerini kullanıyoruz)
    const treemapData = [];
    dataTable.querySelectorAll('tbody tr').forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            const value = parseFloat(cells[1].textContent) || 0;
            if (value > 0) {
                treemapData.push({
                    label: cells[0].textContent.trim(),
                    value: value,
                    color: colorPalette[rowIndex % colorPalette.length]
                });
            }
        }
    });

    // Toplam değeri hesapla
    const totalValue = treemapData.reduce((sum, item) => sum + item.value, 0);
    if (totalValue === 0) {
        showToast('Treemap oluşturmak için pozitif değerler gereklidir!', 'error');
        return;
    }

    // Treemap oluşturma fonksiyonu
    function drawTreemap(items, width, height, x = 0, y = 0) {
        if (items.length === 0) return;
        
        // Tek öğe kaldıysa
        if (items.length === 1) {
            const item = items[0];
            const percentage = (item.value / totalValue) * 100;
            
            // Hücreyi çiz
            context.fillStyle = item.color;
            context.fillRect(x, y, width, height);
            context.strokeStyle = '#fff';
            context.strokeRect(x, y, width, height);
            
            // Metni çiz
            context.fillStyle = '#fff';
            context.font = `bold ${Math.max(10, Math.min(16, height / 5))}px Arial`;
            context.textAlign = 'center';
            
            // Metni sığdırmaya çalış
            const lines = wrapText(context, `${item.label}\n${item.value} (${percentage.toFixed(1)}%)`, width - 10);
            const lineHeight = 20;
            const textHeight = lines.length * lineHeight;
            const startY = y + (height - textHeight) / 2 + lineHeight;
            
            lines.forEach((line, i) => {
                context.fillText(line, x + width / 2, startY + (i * lineHeight));
            });
            
            return;
        }
        
        // Öğeleri sırala
        items.sort((a, b) => b.value - a.value);
        
        // Yatay veya dikey bölme kararı
        const halfTotal = items.reduce((sum, item) => sum + item.value, 0) / 2;
        let currentSum = 0;
        let splitIndex = 0;
        
        // Bölme noktasını bul
        while (currentSum < halfTotal && splitIndex < items.length - 1) {
            currentSum += items[splitIndex].value;
            splitIndex++;
        }
        
        // Hangi yönde böleceğimize karar ver
        const isWide = width > height;
        const splitAt = isWide ? 
            (currentSum / (currentSum + items.slice(splitIndex).reduce((sum, item) => sum + item.value, 0))) * width :
            (currentSum / (currentSum + items.slice(splitIndex).reduce((sum, item) => sum + item.value, 0))) * height;
        
        // Öğeleri böl ve rekürsif olarak çiz
        const firstHalf = items.slice(0, splitIndex);
        const secondHalf = items.slice(splitIndex);
        
        if (isWide) {
            drawTreemap(firstHalf, splitAt, height, x, y);
            drawTreemap(secondHalf, width - splitAt, height, x + splitAt, y);
        } else {
            drawTreemap(firstHalf, width, splitAt, x, y);
            drawTreemap(secondHalf, width, height - splitAt, x, y + splitAt);
        }
    }
    
    // Metni sığdırmak için yardımcı fonksiyon
    function wrapText(context, text, maxWidth) {
        const words = text.split('\n');
        let lines = [];
        
        words.forEach(phrase => {
            let line = '';
            const subWords = phrase.split(' ');
            
            subWords.forEach(word => {
                const testLine = line + word + ' ';
                const metrics = context.measureText(testLine);
                const testWidth = metrics.width;
                
                if (testWidth > maxWidth && line !== '') {
                    lines.push(line);
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            });
            
            lines.push(line.trim());
        });
        
        return lines;
    }
    
    // Treemap'i çiz
    drawTreemap(treemapData, ctx.width, ctx.height);
    
    // Chart instance'ı boş bir obje olarak ayarla (diğer fonksiyonların beklentisini karşılamak için)
    chartInstance = {
        destroy: function() {
            // Treemap'i temizle
            context.clearRect(0, 0, ctx.width, ctx.height);
        },
        update: function() {
            // Treemap'i yeniden çiz
            this.destroy();
            updateChart();
        }
    };
    
    return;
}

        // Progress Donut grafiği
if (currentChartType === 'progressDonut') {
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    

    // Örnek veri (tablodan veri alabilirsiniz)
    const progressValue = 75; // %75 ilerleme (tablodan dinamik olarak alınabilir)
    const remainingValue = 100 - progressValue;

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [progressValue, remainingValue],
                backgroundColor: [
                    '#2ecc71', // İlerleme rengi (yeşil)
                    '#f0f0f0'  // Kalan rengi (açık gri)
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            circumference: 270, // 270 derece (3/4 daire)
            rotation: -135,    // Başlangıç açısı
            cutout: '80%',     // İç boşluk
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                },
                datalabels: {
                    display: false
                }
            }
        },
        plugins: [{
            id: 'progress-text',
            afterDraw: (chart) => {
                const { ctx, chartArea: { width, height } } = chart;
                
                // Ortadaki değeri yazdır
                ctx.save();
                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = '#333';
                ctx.textAlign = 'center';
                ctx.fillText(`${progressValue}%`, width / 2, height / 2 + 10);
                
                // Etiket
                ctx.font = '14px Arial';
                ctx.fillText('İlerleme', width / 2, height / 2 + 40);
                ctx.restore();
            }
        }]
    });
    return;
}

// Tablodan ilerleme değerini al
let progressValue = 0;
const rows = dataTable.querySelectorAll('tbody tr');
if (rows.length > 0 && rows[0].querySelectorAll('td').length > 1) {
    progressValue = parseFloat(rows[0].querySelectorAll('td')[1].textContent) || 0;
}

        // Gauge grafiği
if (currentChartType === 'gauge') {
    // Önceki grafiği temizle
    if (chartInstance) chartInstance.destroy();
    
    // Canvas ve container'ı al
    const canvas = document.getElementById('chartCanvas');
    const container = canvas.parentNode;
    container.classList.add('gauge-chart');
    
    // Gauge için verileri topla
    let total = 0;
    let count = 0;
    let maxValue = 0;
    
    dataTable.querySelectorAll('tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        for (let i = 1; i < cells.length - 1; i++) {
            const value = parseFloat(cells[i].textContent) || 0;
            total += value;
            count++;
            if (value > maxValue) maxValue = value;
        }
    });
    
    const average = count > 0 ? total / count : 0;
    const percentage = maxValue > 0 ? (average / maxValue) * 100 : 0;
    
    // Gauge grafiği oluştur
    chartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [percentage, 100 - percentage],
                backgroundColor: [
                    getGaugeColor(percentage),
                    '#f0f0f0'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            circumference: 180,
            rotation: -90,
            cutout: '80%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                },
                datalabels: {
                    display: false
                }
            }
        },
        plugins: [{
            id: 'gauge-text',
            afterDraw: (chart) => {
                const { ctx, chartArea: { width, height } } = chart;
                
                // Ortadaki değeri yazdır
                ctx.save();
                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = '#333';
                ctx.textAlign = 'center';
                ctx.fillText(average.toFixed(2), width / 2, height / 2 + 10);
                
                // Eğer varsa etiket
                if (dataTable.querySelector('thead th:first-child')) {
                    const label = dataTable.querySelector('thead th:first-child').textContent.trim();
                    ctx.font = '14px Arial';
                    ctx.fillText(label, width / 2, height / 2 + 40);
                }
                ctx.restore();
            }
        }]
    });
    
    return;
}

// Gauge rengini belirleme fonksiyonu
function getGaugeColor(value) {
    if (value < 30) return '#ff6384'; // Kırmızı
    if (value < 70) return '#ffce56'; // Sarı
    return '#2ecc71'; // Yeşil
}

        // Histogram grafiği
if (currentChartType === 'histogram') {
    const values = [];
    
    // Tüm sayısal değerleri topla
    dataTable.querySelectorAll('tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        for (let i = 1; i < cells.length - 1; i++) {
            const value = parseFloat(cells[i].textContent);
            if (!isNaN(value)) {
                values.push(value);
            }
        }
    });

    if (values.length === 0) {
        showToast('Histogram oluşturmak için sayısal veri bulunamadı!', 'error');
        return;
    }

    // Bin sayısını belirle (Sturges formülü)
    const binCount = Math.ceil(Math.log2(values.length) + 1) || 5;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;
    const binSize = range / binCount;

    // Bin aralıklarını ve frekansları hesapla
    const bins = Array(binCount).fill(0).map((_, i) => {
        const binStart = minValue + (i * binSize);
        const binEnd = binStart + binSize;
        return {
            x: binStart,
            xEnd: binEnd,
            y: 0,
            label: `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`
        };
    });

    // Değerleri bölmelere dağıt
    values.forEach(value => {
        let binIndex = Math.floor((value - minValue) / binSize);
        // Son değer en son bölmeye gitmeli
        if (binIndex >= binCount) binIndex = binCount - 1;
        bins[binIndex].y++;
    });

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: bins.map(bin => bin.label),
            datasets: [{
                label: 'Frekans',
                data: bins.map(bin => bin.y),
                backgroundColor: colorPalette[0],
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Değer Aralıkları'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Frekans'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Frekans: ${context.raw}`;
                        },
                        afterLabel: function(context) {
                            const bin = bins[context.dataIndex];
                            return `Aralık: ${bin.x.toFixed(2)} - ${bin.xEnd.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });

    // Histogram stilini uygula
    ctx.canvas.parentNode.classList.add('histogram-chart');
    setupChartClickHandler();
    return;
}

        // Heatmap grafiği
if (currentChartType === 'heatmap') {
    const labels = [];
    const datasets = [];
    const headerRow = dataTable.querySelector('thead tr');
    const headers = [];
    
    // Başlıkları al (sütun isimleri)
    headerRow.querySelectorAll('th').forEach((th, index) => {
        if (index !== 0 && index !== headerRow.children.length - 1) {
            headers.push(th.childNodes[0].textContent.trim());
        }
    });

    // Satır etiketlerini ve verilerini al
    dataTable.querySelectorAll('tbody tr').forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        const rowLabel = cells[0].textContent.trim();
        labels.push(rowLabel);
        
        const rowData = [];
        for (let i = 1; i < cells.length - 1; i++) {
            const value = parseFloat(cells[i].textContent) || 0;
            rowData.push(value);
        }
        
        datasets.push(rowData);
    });

    // Renk skalası için fonksiyon
    function getColor(value, maxValue) {
        const ratio = value / maxValue;
        const hue = (1 - ratio) * 120; // 120 yeşil, 0 kırmızı
        return `hsl(${hue}, 100%, 50%)`;
    }

    // Maksimum değeri bul
    let maxValue = 0;
    datasets.forEach(row => {
        row.forEach(value => {
            if (value > maxValue) maxValue = value;
        });
    });

    // Heatmap veri setini oluştur
    const heatmapData = {
        labels: headers,
        datasets: labels.map((label, i) => ({
            label: label,
            data: datasets[i],
            backgroundColor: datasets[i].map(value => getColor(value, maxValue))
        }))
    };

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: heatmapData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Özel heatmap stilini uygula
    ctx.canvas.parentNode.classList.add('heatmap-chart');
    setupChartClickHandler();
    return;
}

// Polar Area grafiği
if (currentChartType === 'polarArea') {
    const labels = [];
    const data = [];
    const backgroundColors = [];
    
    dataTable.querySelectorAll('tbody tr').forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            labels.push(cells[0].textContent.trim());
            data.push(parseFloat(cells[1].textContent) || 0);
            backgroundColors.push(colorPalette[rowIndex % colorPalette.length]);
        }
    });

    chartInstance = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    formatter: (value, ctx) => {
                        const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${value}\n(${percentage}%)`;
                    },
                    color: '#fff',
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    textAlign: 'center',
                    padding: 6
                }
            },
            scales: {
                r: {
                    pointLabels: {
                        display: true,
                        centerPointLabels: true,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
    setupChartClickHandler();
    return;
}

        // Stacked Bar Grafiği
if (currentChartType === 'stackedBar') {
    const categories = [];
    const headers = [];
    const headerRow = dataTable.querySelector('thead tr');
    
    // Başlıkları al
    headerRow.querySelectorAll('th').forEach((th, index) => {
        if (index !== 0 && index !== headerRow.children.length - 1) {
            headers.push(th.childNodes[0].textContent.trim());
        }
    });

    // Kategorileri al
    dataTable.querySelectorAll('tbody tr').forEach(row => {
        const firstCell = row.querySelector('td');
        if (firstCell) categories.push(firstCell.textContent.trim());
    });

    // Veri setlerini oluştur
    const chartDatasets = headers.map((header, headerIndex) => {
        const data = [];
        dataTable.querySelectorAll('tbody tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells[headerIndex + 1]) {
                data.push(parseFloat(cells[headerIndex + 1].textContent) || 0);
            }
        });
        
        return {
            label: header,
            data: data,
            backgroundColor: hexToRgba(colorPalette[headerIndex % colorPalette.length], 0.7),
            borderColor: colorPalette[headerIndex % colorPalette.length],
            borderWidth: 1
        };
    });

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: chartDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        afterBody: function(context) {
                            const dataset = context[0].dataset;
                            const total = dataset.data.reduce((acc, current) => acc + current, 0);
                            const currentValue = dataset.data[context[0].dataIndex];
                            const percentage = Math.round((currentValue / total) * 100);
                            return `Toplamın %${percentage}'si`;
                        }
                    }
                },
                datalabels: {
                    display: false // Stacked bar'da datalabels genellikle kapatılır
                }
            }
        }
    });
    setupChartClickHandler();
    return;
}

if (currentChartType === 'timeseries') {
    const datasets = [];
    const headers = [];
    const headerRow = dataTable.querySelector('thead tr');

    headerRow.querySelectorAll('th').forEach((th, index) => {
        if (index !== 0 && index !== headerRow.children.length - 1) {
            headers.push(th.childNodes[0].textContent.trim());
        }
    });

    const labels = [];
    dataTable.querySelectorAll('tbody tr').forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        const dateStr = cells[0].textContent.trim();
        
        // Tarih formatını Luxon ile parse et
        let date;
        try {
            // ISO formatı (YYYY-MM-DD) deneyelim
            date = luxon.DateTime.fromISO(dateStr);
            if (!date.isValid) {
                // Diğer yaygın formatları deneyelim
                date = luxon.DateTime.fromFormat(dateStr, 'dd.MM.yyyy') || 
                       luxon.DateTime.fromFormat(dateStr, 'MM/dd/yyyy') || 
                       luxon.DateTime.fromFormat(dateStr, 'yyyy/MM/dd');
            }
            
            if (!date || !date.isValid) {
                // Son çare olarak JavaScript Date nesnesi kullanalım
                date = luxon.DateTime.fromJSDate(new Date(dateStr));
            }
            
            if (!date.isValid) {
                console.warn(`Geçersiz tarih formatı: ${dateStr}`);
                date = luxon.DateTime.now().plus({days: rowIndex});
            }
        } catch (e) {
            console.error(`Tarih parse hatası: ${e}`);
            date = luxon.DateTime.now().plus({days: rowIndex});
        }
        
        labels.push(date.toISODate()); // ISO formatında sakla

        for (let i = 1; i < cells.length - 1; i++) {
            const y = parseFloat(cells[i].textContent.replace(',', '.')) || 0;

            if (!datasets[i - 1]) {
                datasets[i - 1] = {
                    label: headers[i - 1],
                    data: [],
                    borderColor: colorPalette[i % colorPalette.length],
                    backgroundColor: hexToRgba(colorPalette[i % colorPalette.length], 0.4),
                    fill: false,
                    tension: 0.1
                };
            }

            datasets[i - 1].data.push({
                x: date.toJSDate(), // Chart.js için JS Date nesnesi
                y: y
            });
        }
    });

    // Verileri tarihe göre sırala
    datasets.forEach(dataset => {
        dataset.data.sort((a, b) => a.x - b.x);
    });

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'dd MMM yyyy',
                        displayFormats: {
                            day: 'dd MMM yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Tarih'
                    },
                    ticks: {
                        source: 'auto',
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Değer'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return luxon.DateTime.fromJSDate(context[0].parsed.x).toFormat('dd MMM yyyy');
                        }
                    }
                }
            }
        }
    });

    setupChartClickHandler();
    return;
}

        // Bubble grafiği
if (currentChartType === 'bubble') {
    const dataPoints = [];
    const headerRow = dataTable.querySelector('thead tr');
    const headers = [];
    
    // Başlıkları al
    headerRow.querySelectorAll('th').forEach((th, index) => {
        if (index !== 0 && index !== headerRow.children.length - 1) {
            headers.push(th.childNodes[0].textContent.trim());
        }
    });

    // Veri noktalarını oluştur
    dataTable.querySelectorAll('tbody tr').forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) { // En az 4 sütun gerekiyor (etiket, x, y, boyut)
            const label = cells[0].textContent.trim();
            const xValue = parseFloat(cells[1].textContent) || 0;
            const yValue = parseFloat(cells[2].textContent) || 0;
            const sizeValue = parseFloat(cells[3].textContent) || 10; // Varsayılan boyut
            
            dataPoints.push({
                x: xValue,
                y: yValue,
                r: Math.max(5, Math.min(30, sizeValue)), // Boyutu 5-30 arasında sınırla
                label: label
            });
        }
    });

    chartInstance = new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'Bubble Grafiği',
                data: dataPoints,
                backgroundColor: dataPoints.map((_, i) => hexToRgba(colorPalette[i % colorPalette.length], 0.7)),
                borderColor: dataPoints.map((_, i) => colorPalette[i % colorPalette.length]),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: headers.length > 1,
                        text: headers[1] || 'X Değeri'
                    }
                },
                y: {
                    title: {
                        display: headers.length > 2,
                        text: headers[2] || 'Y Değeri'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const data = context.raw;
                            return [
                                `Etiket: ${data.label}`,
                                `X: ${data.x}`,
                                `Y: ${data.y}`,
                                `Boyut: ${data.r}`
                            ];
                        }
                    }
                }
            }
        }
    });
    setupChartClickHandler();
    return;
}

        // HEX rengini RGBA'ya çevirme fonksiyonu
        function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        // Scatter grafik
        if (currentChartType === 'scatter') {
    const points = [];
    const xValues = [];
    const yValues = [];

    dataTable.querySelectorAll('tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
            const x = parseFloat(cells[1].textContent) || 0;
            const y = parseFloat(cells[2].textContent) || 0;
            xValues.push(x);
            yValues.push(y);
            points.push({ x, y });
        }
    });

    const regression = linearRegression(points);
    const regressionLine = xValues.map(x => regression.slope * x + regression.intercept);

    chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Veri Noktaları',
                    data: points,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    pointRadius: 6
                },
                {
                    label: 'Regresyon Çizgisi',
                    data: xValues.map((x, i) => ({ x, y: regressionLine[i] })),
                    type: 'line',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'X Değerleri'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Y Değerleri'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: 0,
                            yMax: 0,
                            borderColor: 'rgb(0, 0, 0)',
                            borderWidth: 1
                        },
                        line2: {
                            type: 'line',
                            xMin: 0,
                            xMax: 0,
                            borderColor: 'rgb(0, 0, 0)',
                            borderWidth: 1
                        },
                        label1: {
                            type: 'label',
                            xValue: Math.min(...xValues),
                            yValue: Math.max(...yValues),
                            content: [
                                `R² = ${regression.rSquared.toFixed(2)}`,
                                `RMSE = ${regression.rmse.toFixed(2)}`
                            ],
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        }
    });
    setupChartClickHandler();
    return;
}

        // Radar grafik
        if (currentChartType === 'radar') {
            const labels = [];
            const datasets = [];

            const headerRow = dataTable.querySelector('thead tr');
            const headers = [];
            headerRow.querySelectorAll('th').forEach((th, index) => {
                if (index !== 0 && index !== headerRow.children.length - 1) {
                    headers.push(th.childNodes[0].textContent.trim());
                }
            });

            dataTable.querySelectorAll('tbody tr').forEach((row, rowIndex) => {
                const cells = row.querySelectorAll('td');
                const label = cells[0].textContent.trim();
                const data = [];

                for (let i = 1; i < cells.length - 1; i++) {
                    data.push(parseFloat(cells[i].textContent) || 0);
                }

                datasets.push({
                    label: label,
                    data: data,
                    backgroundColor: hexToRgba(colorPalette[rowIndex % colorPalette.length], 0.2),
                    borderColor: colorPalette[rowIndex % colorPalette.length],
                    borderWidth: 2,
                    pointBackgroundColor: colorPalette[rowIndex % colorPalette.length],
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: colorPalette[rowIndex % colorPalette.length]
                });
            });

            chartInstance = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: headers,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: {
                                display: true
                            },
                            suggestedMin: 0,
                            ticks: {
                                precision: 0
                            }
                        }
                    },
                    elements: {
                        line: {
                            tension: 0.1
                        }
                    }
                }
            });
            setupChartClickHandler();
            return;
        }

        // Mum grafiği
        if (currentChartType === 'candlestick') {
            const labels = [];
            const data = [];
            dataTable.querySelectorAll('tbody tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 5) {
                    const label = cells[0].textContent.trim();
                    const open = parseFloat(cells[1].textContent) || 0;
                    const high = parseFloat(cells[2].textContent) || 0;
                    const low = parseFloat(cells[3].textContent) || 0;
                    const close = parseFloat(cells[4].textContent) || 0;
                    labels.push(label);
                    data.push({ x: label, o: open, h: high, l: low, c: close });
                }
            });

            chartInstance = new Chart(ctx, {
                type: 'candlestick',
                data: {
                    datasets: [{
                        label: 'Mum Grafiği',
                        data: data,
                        borderColor: '#333',
                        color: {
                            up: '#2ecc71',
                            down: '#e74c3c',
                            unchanged: '#999'
                        }
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { type: 'category', labels: labels },
                        y: { beginAtZero: false }
                    }
                }
            });
            setupChartClickHandler();
            return;
        }

        // Nüfus piramidi
        if (currentChartType === 'population') {
            const labels = [];
            const maleData = [];
            const femaleData = [];

            dataTable.querySelectorAll('tbody tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 3) {
                    const label = cells[0].textContent.trim();
                    const male = parseFloat(cells[1].textContent.replace(',', '.')) || 0;
                    const female = parseFloat(cells[2].textContent.replace(',', '.')) || 0;

                    labels.push(label);
                    maleData.push(-Math.abs(male));
                    femaleData.push(Math.abs(female));
                }
            });

            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Erkek',
                            data: maleData,
                            backgroundColor: 'rgba(54, 162, 235, 0.7)'
                        },
                        {
                            label: 'Kadın',
                            data: femaleData,
                            backgroundColor: 'rgba(255, 99, 132, 0.7)'
                        }
                    ]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            stacked: true,
                            ticks: {
                                callback: function (value) {
                                    return Math.abs(value);
                                }
                            }
                        },
                        y: {
                            stacked: true
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return `${context.dataset.label}: ${Math.abs(context.raw)}`;
                                }
                            }
                        }
                    }
                }
            });
            setupChartClickHandler();
            return;
        }

        // Pasta ve Doughnut grafikleri
        if (currentChartType === 'pie' || currentChartType === 'doughnut') {
            const labels = [];
            const data = [];
            const backgroundColors = [];
            
            dataTable.querySelectorAll('tbody tr').forEach((row, rowIndex) => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    labels.push(cells[0].textContent.trim());
                    data.push(parseFloat(cells[1].textContent) || 0);
                    backgroundColors.push(colorPalette[rowIndex % colorPalette.length]);
                }
            });

            chartInstance = new Chart(ctx, {
                type: currentChartType,
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        borderColor: '#fff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        },
                        datalabels: {
                            formatter: (value, ctx) => {
                                const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${value}\n(${percentage}%)`;
                            },
                            color: '#fff',
                            font: {
                                weight: 'bold',
                                size: 12
                            },
                            textAlign: 'center',
                            padding: 6
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });
            setupChartClickHandler();
            return;
        }

        // Alan grafiği
        if (currentChartType === 'area') {
            const categories = [];
            const headers = [];
            const headerRow = dataTable.querySelector('thead tr');
            
            // Başlıkları al
            headerRow.querySelectorAll('th').forEach((th, index) => {
                if (index !== 0 && index !== headerRow.children.length - 1) {
                    headers.push(th.childNodes[0].textContent.trim());
                }
            });

            // Kategorileri al
            dataTable.querySelectorAll('tbody tr').forEach(row => {
                const firstCell = row.querySelector('td');
                if (firstCell) categories.push(firstCell.textContent.trim());
            });

            // Veri setlerini oluştur
            const chartDatasets = categories.map((category, catIndex) => {
                const row = dataTable.querySelectorAll('tbody tr')[catIndex];
                const data = [];
                
                if (row) {
                    const cells = row.querySelectorAll('td');
                    for (let i = 1; i < cells.length - 1; i++) {
                        data.push(parseFloat(cells[i].textContent) || 0);
                    }
                }
                
                return {
                    label: category,
                    data: data,
                    backgroundColor: hexToRgba(colorPalette[catIndex % colorPalette.length], 0.5),
                    borderColor: colorPalette[catIndex % colorPalette.length],
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                };
            });

            chartInstance = new Chart(ctx, {
                type: 'line', // Alan grafiği için line tipini kullanıyoruz
                data: {
                    labels: headers,
                    datasets: chartDatasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    elements: {
                        line: {
                            tension: 0.1
                        }
                    }
                }
            });
            setupChartClickHandler();
            return;
        }

        // Diğer grafik türleri (line, bar)
        const categories = [];
        const headers = [];
        const headerRow = dataTable.querySelector('thead tr');
        headerRow.querySelectorAll('th').forEach((th, index) => {
            if (index !== 0 && index !== headerRow.children.length - 1) {
                headers.push(th.childNodes[0].textContent.trim());
            }
        });

        dataTable.querySelectorAll('tbody tr').forEach(row => {
            const firstCell = row.querySelector('td');
            if (firstCell) categories.push(firstCell.textContent.trim());
        });

        let chartLabels, chartDatasets;
        if (currentChartType === 'line') {
            chartLabels = headers;
            chartDatasets = categories.map((category, catIndex) => {
                const row = dataTable.querySelectorAll('tbody tr')[catIndex];
                const data = [];
                if (row) {
                    const cells = row.querySelectorAll('td');
                    for (let i = 1; i < cells.length - 1; i++) {
                        data.push(parseFloat(cells[i].textContent) || 0);
                    }
                }
                return {
                    label: category,
                    data: data,
                    backgroundColor: colorPalette[catIndex % colorPalette.length],
                    borderColor: colorPalette[catIndex % colorPalette.length],
                    borderWidth: 3,
                    fill: false,
                    tension: 0.1
                };
            });
        } else { // Bar grafik
            chartLabels = categories;
            chartDatasets = headers.map((header, headerIndex) => {
                const data = [];
                dataTable.querySelectorAll('tbody tr').forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells[headerIndex + 1]) {
                        data.push(parseFloat(cells[headerIndex + 1].textContent) || 0);
                    }
                });
                return {
                    label: header,
                    data: data,
                    backgroundColor: colorPalette[headerIndex % colorPalette.length],
                    borderColor: '#ffffff',
                    borderWidth: 1
                };
            });
        }

        chartInstance = new Chart(ctx, {
            type: currentChartType,
            data: {
                labels: chartLabels,
                datasets: chartDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
        setupChartClickHandler();
    }
// PDF indirme butonu event listener'ını değiştir
document.getElementById('downloadChart').addEventListener('click', async function() {
    try {
        // Format seçim modalını göster
        const format = await showDownloadFormatModal();
        if (!format) return; // Kullanıcı iptal etti
        
        switch(format) {
            case 'pdf':
                await downloadAsPDF();
                break;
            case 'png':
                await downloadAsPNG();
                break;
            case 'svg':
                await downloadAsSVG();
                break;
        }
    } catch (error) {
        console.error('İndirme hatası:', error);
        showToast(`İndirme başarısız: ${error.message}`, 'error');
    }
});

// Format seçim modalını gösteren fonksiyon
function showDownloadFormatModal() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="width: 300px;">
                <span class="close-modal">&times;</span>
                <h3>İndirme Formatı Seçin</h3>
                <div class="format-options">
                    <button class="format-btn" data-format="png"><i class="fas fa-file-image"></i> PNG</button>
                    <button class="format-btn" data-format="svg"><i class="fas fa-file-code"></i> SVG</button>
                    <button class="format-btn" data-format="pdf"><i class="fas fa-file-pdf"></i> PDF</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Kapatma butonu
        modal.querySelector('.close-modal').onclick = function() {
            modal.remove();
            resolve(null);
        };
        
        // Dışarı tıklayarak kapatma
        modal.onclick = function(e) {
            if (e.target === modal) {
                modal.remove();
                resolve(null);
            }
        };
        
        // Format butonları
        modal.querySelectorAll('.format-btn').forEach(btn => {
            btn.onclick = function() {
                const format = this.dataset.format;
                modal.remove();
                resolve(format);
            };
        });
    });
}

// PNG olarak indirme fonksiyonu
async function downloadAsPNG() {
    if (typeof html2canvas === 'undefined') {
        await loadHtml2CanvasLibrary();
    }

    const chartContainer = document.querySelector('.chart-container');
    showToast('PNG hazırlanıyor...', 'info');
    
    const canvas = await html2canvas(chartContainer, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#FFFFFF'
    });

    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `grafik-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('PNG indirildi!', 'success');
}

// SVG olarak indirme fonksiyonu
async function downloadAsSVG() {
    if (!chartInstance) {
        throw new Error('Önce bir grafik oluşturmalısınız');
    }

    showToast('SVG hazırlanıyor...', 'info');
    
    // Canvas'ı SVG'ye dönüştür
    const canvas = document.getElementById('chartCanvas');
    const svgData = canvasToSVG(canvas);
    
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const link = document.createElement('a');
    link.href = svgUrl;
    link.download = `grafik-${new Date().toISOString().slice(0, 10)}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Belleği temizle
    setTimeout(() => URL.revokeObjectURL(svgUrl), 100);
    
    showToast('SVG indirildi!', 'success');
}

// Canvas'ı SVG'ye dönüştürme fonksiyonu
function canvasToSVG(canvas) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', canvas.width);
    svg.setAttribute('height', canvas.height);
    
    const image = document.createElementNS(ns, 'image');
    image.setAttribute('width', canvas.width);
    image.setAttribute('height', canvas.height);
    image.setAttribute('href', canvas.toDataURL('image/png'));
    
    svg.appendChild(image);
    
    // SVG string olarak döndür
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
}

// PDF indirme fonksiyonu (mevcut fonksiyonu güncelle)
async function downloadAsPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        await loadJsPdfLibrary();
    }
    
    if (typeof html2canvas === 'undefined') {
        await loadHtml2CanvasLibrary();
    }

    const { jsPDF } = window.jspdf;
    const chartContainer = document.querySelector('.chart-container');
    
    showToast('PDF hazırlanıyor...', 'info');
    
    const canvas = await html2canvas(chartContainer, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#FFFFFF'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    const imgWidth = 280;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const position = 10;
    
    pdf.addImage(imgData, 'PNG', position, position, imgWidth, imgHeight);
    pdf.save(`grafik-${new Date().toISOString().slice(0, 10)}.pdf`);
    
    showToast('PDF indirildi!', 'success');
}

// html2canvas'ı dinamik yükleme fonksiyonu
function loadHtml2CanvasLibrary() {
    return new Promise((resolve, reject) => {
        if (typeof html2canvas !== 'undefined') return resolve();
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

    addColumnBtn.addEventListener('click', () => {
        const headerRow = dataTable.querySelector('thead tr');
        const bodyRows = dataTable.querySelectorAll('tbody tr');
        const colCount = headerRow.children.length;
        const defaultName = `Değer ${colCount}`;
        const colName = prompt('Yeni sütun adını girin:', defaultName) || defaultName;

        const newHeaderCell = document.createElement('th');
        newHeaderCell.innerHTML = `
            ${colName}
            <button class="btn-icon edit-header"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete-col"><i class="fas fa-times"></i></button>
        `;
        headerRow.insertBefore(newHeaderCell, headerRow.lastElementChild);

        bodyRows.forEach(row => {
            const newCell = document.createElement('td');
            newCell.contentEditable = 'true';
            newCell.textContent = '0';
            row.insertBefore(newCell, row.lastElementChild);
        });

        setupHeaderButtons();
    });

    addRowBtn.addEventListener('click', () => {
        const tbody = dataTable.querySelector('tbody');
        const headerRow = dataTable.querySelector('thead tr');
        const colCount = headerRow.children.length;
        const newRow = document.createElement('tr');

        for (let i = 0; i < colCount; i++) {
            const cell = document.createElement('td');
            if (i === 0) {
                cell.contentEditable = 'true';
                cell.textContent = `Kategori ${tbody.children.length + 1}`;
            } else if (i === colCount - 1) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-danger deleteRow';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Sil';
                deleteBtn.addEventListener('click', () => newRow.remove());
                cell.appendChild(deleteBtn);
            } else {
                cell.contentEditable = 'true';
                cell.textContent = '0';
            }
            newRow.appendChild(cell);
        }
        tbody.appendChild(newRow);
    });

    importDataBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const loadingToast = showToast('Dosya işleniyor, lütfen bekleyin...', 'info');
            
            let processed;
            if (file.name.endsWith('.csv')) {
                const content = await file.text();
                processed = processCSV(content);
            } else if (file.name.match(/\.xlsx?$/i)) {
                processed = await processExcel(file);
            } else {
                throw new Error('Desteklenmeyen dosya formatı. Lütfen CSV veya Excel dosyası yükleyin.');
            }
            
            if (processed.headers.length === 0 || processed.rows.length === 0) {
                throw new Error('Dosyada işlenebilir veri bulunamadı.');
            }
            
            importToTable(processed);
            showToast('Veri başarıyla yüklendi!', 'success');
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            showToast(`Hata: ${error.message}`, 'error');
        } finally {
            fileInput.value = '';
        }
    });

    // Veri kaydetme butonu
    saveDataBtn.addEventListener('click', function() {
    try {
        const tableData = getTableData();
        const chartConfig = chartInstance ? {
            type: chartInstance.config.type,
            data: chartInstance.data,
            options: chartInstance.options
        } : null;
        
        const dataToSave = {
            version: "1.0",
            tableData: tableData,
            chartConfig: chartConfig,
            colorPalette: colorPalette,
            timestamp: new Date().toISOString()
        };

        // Datalabels plugin'i kaldır (JSON.stringify sorun çıkarıyor)
        if (dataToSave.chartConfig && dataToSave.chartConfig.options && 
            dataToSave.chartConfig.options.plugins && 
            dataToSave.chartConfig.options.plugins.datalabels) {
            delete dataToSave.chartConfig.options.plugins.datalabels;
        }
            
            const dataStr = JSON.stringify(dataToSave, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `grafik-verisi-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            showToast('Veri başarıyla kaydedildi!', 'success');
        } catch (error) {
            console.error('Kaydetme hatası:', error);
            showToast('Veri kaydedilirken hata oluştu!', 'error');
        }
    });

    // Veri yükleme butonu
    loadDataBtn.addEventListener('click', function() {
        loadDataInput.click();
    });

    // Veri yükleme inputu
    loadDataInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Tablo verilerini yükle
                loadTableData(data.tableData);
                
                // Renk paletini yükle
                if (data.colorPalette) {
                    colorPalette = data.colorPalette;
                }
                
                // Grafik verilerini yükle
                if (data.chartConfig) {
                    currentChartType = data.chartConfig.type;
                    
                    // Aktif butonu güncelle
                    document.querySelectorAll('.chart-btn').forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.dataset.type === currentChartType) {
                            btn.classList.add('active');
                        }
                    });
                    
                    // Grafiği oluştur
                    setTimeout(() => {
                        const ctx = document.getElementById('chartCanvas').getContext('2d');
                        if (chartInstance) chartInstance.destroy();
                        
                        chartInstance = new Chart(ctx, {
                            type: data.chartConfig.type,
                            data: data.chartConfig.data,
                            options: data.chartConfig.options
                        });
                        
                        setupChartClickHandler();
                    }, 100);
                }
                
                showToast('Veri başarıyla yüklendi!', 'success');
            } catch (error) {
                console.error('Veri yükleme hatası:', error);
                showToast('Hatalı veri dosyası!', 'error');
            }
        };
        reader.readAsText(file);
        
        e.target.value = '';
    });

    generateChartBtn.addEventListener('click', updateChart);

    chartBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            chartBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentChartType = this.dataset.type;
            updateChart();
        });
    });

    dataTable.addEventListener('click', function (e) {
        if (e.target.closest('.deleteRow')) {
            e.preventDefault();
            if (confirm('Bu satırı silmek istediğinize emin misiniz?')) {
                e.target.closest('tr').remove();
                if (chartInstance) updateChart();
            }
        }
    });

    setupHeaderButtons();
    updateChart();
});

function linearRegression(points) {
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    points.forEach(point => {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumXX += point.x * point.x;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    let ssTot = 0, ssRes = 0;
    const yMean = sumY / n;
    
    points.forEach(point => {
        ssTot += Math.pow(point.y - yMean, 2);
        const yPred = slope * point.x + intercept;
        ssRes += Math.pow(point.y - yPred, 2);
    });
    
    const rSquared = 1 - (ssRes / ssTot);
    const rmse = Math.sqrt(ssRes / n);
    
    return { slope, intercept, rSquared, rmse };
}

// Video modal kapatma işlevi
document.addEventListener('DOMContentLoaded', function() {
    const videoModal = document.getElementById('introVideoModal');
    const closeVideoBtn = document.getElementById('closeVideoBtn');
    
    if (videoModal && closeVideoBtn) {
        closeVideoBtn.addEventListener('click', function() {
            videoModal.style.display = 'none';
            const video = document.getElementById('introVideo');
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        });
        
        // Sayfa yüklendiğinde video modalını göster
        videoModal.style.display = 'block';
    }
});
