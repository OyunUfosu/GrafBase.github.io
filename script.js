// Candlestick tipi için controller'ı güvenli şekilde kaydet
if (
    typeof Chart !== 'undefined' &&
    Chart.registry &&
    typeof window.FinancialController !== 'undefined'
) {
    Chart.register(
        Chart.ScatterController, // Bu satırı ekleyin
        window.FinancialController,
        window.CandlestickElement,
        window.FinancialController,
        window.CandlestickElement,
        window.CategoryScale,
        window.LinearScale,
        window.TimeScale,
        window.Title,
        window.Tooltip,
        window.Legend
    );
}

document.addEventListener('DOMContentLoaded', function () {
    const introVideo = document.getElementById('introVideo');
    const introModal = document.getElementById('introVideoModal');
    const closeBtn = document.getElementById('closeVideoBtn');

    if (introVideo && introModal && closeBtn) {
        introVideo.addEventListener('ended', () => {
            introModal.style.display = 'none';
        });

        closeBtn.addEventListener('click', () => {
            introVideo.pause();
            introModal.style.display = 'none';
        });
    }

    const addColumnBtn = document.getElementById('addColumn');
    const addRowBtn = document.getElementById('addRow');
    const generateChartBtn = document.getElementById('generateChart');
    const dataTable = document.getElementById('dataTable');
    const downloadPdfBtn = document.getElementById('downloadPdf');
    const chartBtns = document.querySelectorAll('.chart-btn');

    let currentChartType = 'line';
    let chartInstance = null;

    const colorPalette = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#8AC24A', '#EA5F89',
        '#00ACC1', '#FF7043', '#9CCC65', '#AB47BC'
    ];

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

    function updateChart() {
        if (chartInstance) chartInstance.destroy();
        const ctx = document.getElementById('chartCanvas').getContext('2d');

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

    
    // Regresyon hesaplama fonksiyonu
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
    return;
}


        if (currentChartType === 'radar') {
    const labels = [];
    const datasets = [];

    // Başlıkları al
    const headerRow = dataTable.querySelector('thead tr');
    const headers = [];
    headerRow.querySelectorAll('th').forEach((th, index) => {
        if (index !== 0 && index !== headerRow.children.length - 1) {
            headers.push(th.childNodes[0].textContent.trim());
        }
    });

    // Verileri işle
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
    return;
}

// HEX renk kodunu RGBA'ya çeviren yardımcı fonksiyon
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
            return;
        }

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
            maleData.push(-Math.abs(male)); // Negatif yap
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
    return;
}


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
        } else {
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
    }

    downloadPdfBtn.addEventListener('click', async function () {
        const chartCanvas = document.getElementById('chartCanvas');
        const { jsPDF } = window.jspdf;

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const canvas = await html2canvas(chartCanvas, { backgroundColor: '#ffffff', scale: 2 });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 280;
        const imgHeight = canvas.height * imgWidth / canvas.width;

        doc.addImage(imgData, 'PNG', 10, 20, imgWidth, imgHeight);
        doc.save('grafik.pdf');
    });

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

// Dosyanın en altına bu fonksiyonu ekleyin
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
    
    // R² ve RMSE hesapla
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
