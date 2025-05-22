document.addEventListener('DOMContentLoaded', function() {
    // Tablo kontrolleri
    const addColumnBtn = document.getElementById('addColumn');
    const addRowBtn = document.getElementById('addRow');
    const generateChartBtn = document.getElementById('generateChart');
    const dataTable = document.getElementById('dataTable');
    const downloadPdfBtn = document.getElementById('downloadPdf');
    const chartBtns = document.querySelectorAll('.chart-btn');
    
    let currentChartType = 'line';
    let chartInstance = null;
    
    // Geliştirilmiş renk paleti (tüm grafiklerde tutarlı)
    const colorPalette = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#8AC24A', '#EA5F89',
        '#00ACC1', '#FF7043', '#9CCC65', '#AB47BC'
    ];
    
    // Sütun ekleme
    addColumnBtn.addEventListener('click', function() {
        const headerRow = dataTable.querySelector('thead tr');
        const bodyRows = dataTable.querySelectorAll('tbody tr');
        
        const colCount = headerRow.children.length;
        const defaultName = `Değer ${colCount}`;
        const colName = prompt('Yeni sütun adını girin:', defaultName) || defaultName;
        
        // Başlık satırına sütun ekle
        const newHeaderCell = document.createElement('th');
        newHeaderCell.innerHTML = `
            ${colName} 
            <button class="btn-icon edit-header"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete-col"><i class="fas fa-times"></i></button>
        `;
        headerRow.insertBefore(newHeaderCell, headerRow.lastElementChild);
        
        // Tüm satırlara hücre ekle
        bodyRows.forEach(row => {
            const newCell = document.createElement('td');
            newCell.contentEditable = 'true';
            newCell.textContent = '0';
            row.insertBefore(newCell, row.lastElementChild);
        });
        
        // Yeni eklenen butonlara event listener ekle
        setupHeaderButtons();
    });
    
    // Satır ekleme
    addRowBtn.addEventListener('click', function() {
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
                deleteBtn.addEventListener('click', function() {
                    newRow.remove();
                });
                cell.appendChild(deleteBtn);
            } else {
                cell.contentEditable = 'true';
                cell.textContent = '0';
            }
            
            newRow.appendChild(cell);
        }
        
        tbody.appendChild(newRow);
    });
    
    // Başlık düzenleme ve sütun silme butonlarını ayarla
    function setupHeaderButtons() {
        document.querySelectorAll('.edit-header').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const th = this.closest('th');
                const currentText = th.childNodes[0].textContent.trim();
                const newText = prompt('Başlığı düzenle:', currentText);
                if (newText && newText !== currentText) {
                    th.childNodes[0].textContent = newText;
                    if (chartInstance) {
                        updateChart();
                    }
                }
            });
        });
        
        document.querySelectorAll('.delete-col').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const th = this.closest('th');
                const colIndex = Array.from(th.parentNode.children).indexOf(th);
                
                if (confirm('Bu sütunu silmek istediğinize emin misiniz?')) {
                    // Tüm satırlardan ilgili sütunu sil
                    document.querySelectorAll('tr').forEach(row => {
                        const cell = row.children[colIndex];
                        if (cell) cell.remove();
                    });
                    
                    if (chartInstance) {
                        updateChart();
                    }
                }
            });
        });
    }
    
    // Satır silme (dinamik olarak eklenen butonlar için event delegation)
    dataTable.addEventListener('click', function(e) {
        if (e.target.closest('.deleteRow')) {
            e.preventDefault();
            if (confirm('Bu satırı silmek istediğinize emin misiniz?')) {
                e.target.closest('tr').remove();
                if (chartInstance) {
                    updateChart();
                }
            }
        }
    });
    
    // Grafik oluşturma
    generateChartBtn.addEventListener('click', function() {
        updateChart();
    });
    
    // Grafik türü değiştirme
    chartBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            chartBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentChartType = this.dataset.type;
            updateChart();
        });
    });
    
    // PDF indirme - TAM ÇALIŞAN VERSİYON
    downloadPdfBtn.addEventListener('click', async function() {
        try {
            // jsPDF ve html2canvas kütüphanelerini kontrol et
            if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
                throw new Error('PDF oluşturma kütüphaneleri yüklenmedi');
            }
            
            const { jsPDF } = window.jspdf;
            
            // PDF dokümanı oluştur
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm'
            });
            
            // Başlık
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(52, 73, 94);
            doc.text('Grafik Raporu', 148, 20, { align: 'center' });
            
            // Tarih
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            const today = new Date();
            doc.text(`Oluşturulma Tarihi: ${today.toLocaleDateString()} ${today.toLocaleTimeString()}`, 148, 30, { align: 'center' });
            
            // Grafik türü bilgisi
            doc.setFontSize(14);
            doc.setTextColor(41, 128, 185);
            doc.text(`Grafik Türü: ${getChartTypeName(currentChartType)}`, 148, 40, { align: 'center' });
            
            // Grafik resmini ekle
            const chartCanvas = document.getElementById('chartCanvas');
            
            // html2canvas ile grafiği yakala
            const canvas = await html2canvas(chartCanvas, {
                scale: 2,
                logging: true,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#FFFFFF'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 250;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Grafik resmini PDF'e ekle
            doc.addImage(imgData, 'PNG', (297 - imgWidth) / 2, 50, imgWidth, imgHeight);
            
            // Tablo verilerini ekle (2. sayfa)
            doc.addPage();
            doc.setFontSize(18);
            doc.setTextColor(52, 73, 94);
            doc.text('Tablo Verileri', 148, 20, { align: 'center' });
            
            // Tablo başlıkları
            const headers = [];
            const headerRow = dataTable.querySelector('thead tr');
            headerRow.querySelectorAll('th').forEach((th, index) => {
                if (index !== headerRow.children.length - 1) {
                    headers.push(th.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim());
                }
            });
            
            // Tablo verileri
            const data = [];
            dataTable.querySelectorAll('tbody tr').forEach(row => {
                const rowData = [];
                row.querySelectorAll('td').forEach((cell, index) => {
                    if (index !== row.children.length - 1) {
                        rowData.push(cell.textContent.trim());
                    }
                });
                data.push(rowData);
            });
            
            // Tabloyu PDF'e ekle
            if (typeof doc.autoTable === 'function') {
                doc.autoTable({
                    head: [headers],
                    body: data,
                    startY: 30,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [41, 128, 185],
                        textColor: 255,
                        fontStyle: 'bold'
                    },
                    alternateRowStyles: {
                        fillColor: [236, 240, 241]
                    },
                    margin: { top: 30 }
                });
            } else {
                // Eğer autoTable yoksa basit bir tablo oluştur
                let startY = 30;
                doc.setFontSize(12);
                
                // Başlıklar
                headers.forEach((header, i) => {
                    doc.text(header, 20 + (i * 40), startY);
                });
                startY += 10;
                
                // Veriler
                data.forEach(row => {
                    row.forEach((cell, i) => {
                        doc.text(cell, 20 + (i * 40), startY);
                    });
                    startY += 10;
                });
            }
            
            // PDF'i indir
            doc.save(`Grafik_Raporu_${new Date().getTime()}.pdf`);
            
        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            alert('PDF oluşturulurken bir hata oluştu. Lütfen konsolu kontrol edin.');
        }
    });
    
    // Grafik güncelleme fonksiyonu - TÜM GRAFİKLER İÇİN DÜZGÜN ÇALIŞAN VERSİYON
    function updateChart() {
        const categories = [];
        const headers = [];
        
        // Başlıkları al (Kategori sütununu ve işlem sütununu atla)
        const headerRow = dataTable.querySelector('thead tr');
        headerRow.querySelectorAll('th').forEach((th, index) => {
            if (index !== 0 && index !== headerRow.children.length - 1) {
                headers.push(th.childNodes[0].textContent.trim());
            }
        });
        
        // Kategorileri al (ilk sütun)
        dataTable.querySelectorAll('tbody tr').forEach(row => {
            const firstCell = row.querySelector('td');
            if (firstCell) {
                categories.push(firstCell.textContent.trim());
            }
        });
        
        // Veri setlerini hazırla
        let chartLabels, chartDatasets;
        
        if (currentChartType === 'line') {
            // Çizgi grafiği için özel format
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
        } else {
            // Diğer grafik türleri için format
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
        
        // Eski grafiği temizle
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        // Yeni grafik oluştur
        const ctx = document.getElementById('chartCanvas').getContext('2d');
        
        // Grafik arkaplanını beyaz yap
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        chartInstance = new Chart(ctx, {
            type: currentChartType,
            data: {
                labels: chartLabels,
                datasets: chartDatasets
            },
            options: getChartOptions(currentChartType)
        });
    }
    
    // Grafik seçenekleri
    function getChartOptions(type) {
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: type === 'pie' || type === 'doughnut' ? 'right' : 'top',
                    labels: {
                        font: {
                            size: 14,
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        },
                        padding: 20,
                        usePointStyle: true,
                        color: '#333'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 16,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 14
                    },
                    padding: 12,
                    cornerRadius: 6,
                    displayColors: type !== 'line',
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.raw.toLocaleString();
                            return label;
                        }
                    }
                }
            }
        };
        
        if (type === 'line') {
            return {
                ...commonOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Değerler',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#333'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Değer Türleri',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#333'
                        }
                    }
                },
                elements: {
                    line: {
                        tension: 0.4
                    },
                    point: {
                        radius: 5,
                        hoverRadius: 7
                    }
                }
            };
        } else {
            return {
                ...commonOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#333'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#333'
                        }
                    }
                }
            };
        }
    }
    
    // Grafik türü adını döndür
    function getChartTypeName(type) {
        const names = {
            'line': 'Çizgi Grafiği',
            'bar': 'Izgara Grafiği',
            'pie': 'Pasta Grafiği',
            'doughnut': 'Gösterge Grafiği'
        };
        return names[type] || type;
    }
    
    // Sayfa yüklendiğinde varsayılan grafiği oluştur ve başlık butonlarını ayarla
    setupHeaderButtons();
    updateChart();
    window.addEventListener('DOMContentLoaded', function () {
        const introVideo = document.getElementById('introVideo');
        const introModal = document.getElementById('introVideoModal');
        const closeBtn = document.getElementById('closeVideoBtn');
    
        if (introVideo && introModal) {
            introVideo.addEventListener('ended', () => {
                introModal.style.display = 'none';
            });
    
            closeBtn.addEventListener('click', () => {
                introVideo.pause();
                introModal.style.display = 'none';
            });
        }
    });
    
});
