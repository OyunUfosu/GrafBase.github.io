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
// PDF indirme butonu event listener'ı
document.getElementById('downloadPdf').addEventListener('click', async function() {
    try {
        // jsPDF'nin yüklü olduğundan emin ol
        if (!window.jspdf || !window.jspdf.jsPDF) {
            await loadJsPdfLibrary();
        }
        
        // html2canvas'ın yüklü olduğundan emin ol
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
        const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape mode
        
        const imgWidth = 280;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const position = 10; // margin
        
        pdf.addImage(imgData, 'PNG', position, position, imgWidth, imgHeight);
        pdf.save('grafik.pdf');
        
        showToast('PDF indirildi!', 'success');
    } catch (error) {
        console.error('PDF hatası:', error);
        showToast(`PDF oluşturulamadı: ${error.message}`, 'error');
    }
});

// jsPDF'yi dinamik yükleme fonksiyonu
function loadJsPdfLibrary() {
    return new Promise((resolve, reject) => {
        if (window.jspdf) return resolve();
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            // jsPDF'yi global erişime aç
            window.jspdf = window.jspdf;
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
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
