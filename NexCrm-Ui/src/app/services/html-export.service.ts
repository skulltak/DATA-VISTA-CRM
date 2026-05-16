import { Injectable } from '@angular/core';
import { PivotEngineService } from './pivot-engine';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class HtmlExportService {

  constructor(private pivotEngine: PivotEngineService) {}

  async exportHtmlDashboard(records: any[], fileName: string) {
    const timestamp = new Date().toLocaleString();
    const categories: ('ALL' | 'TVLA' | 'AC')[] = ['ALL', 'AC', 'TVLA'];
    const dashboardData: any = {};

    for (const cat of categories) {
      const result = this.pivotEngine.generatePivots(records, 'All', cat);
      const rows = result?.summary?.rows || [];
      const grandTotal = result?.summary?.grandTotal || { TOTAL: 0, COMPLETED: 0, PERCENTAGE: 0 };
      
      const topPerformers = [...rows]
        .sort((a, b) => {
          if (b.PERCENTAGE !== a.PERCENTAGE) return b.PERCENTAGE - a.PERCENTAGE;
          return b.COMPLETED - a.COMPLETED;
        })
        .slice(0, 5);

      const labels = rows.map(r => r.state);
      const completedData = rows.map(r => r.COMPLETED || 0);
      const cancelledData = rows.map(r => r.CANCELLED || 0);
      const notServicedData = rows.map(r => r.NOT_SERVICED || 0);

      dashboardData[cat] = {
        title: cat === 'ALL' ? 'Unified Operations' : cat + ' Operations',
        rows,
        grandTotal,
        topPerformers,
        chartData: {
          labels,
          completedData,
          cancelledData,
          notServicedData
        }
      };
    }

    let sectionsHtml = '';
    
    for (const cat of categories) {
      const data = dashboardData[cat];
      if (!data.rows || data.rows.length === 0) continue;

      sectionsHtml += `
    <div class="category-section">
      <div class="section-header">
        <h2>${data.title}</h2>
      </div>

      <div class="stats-summary">
        <div class="stat-card total">
          <h3>Total Records</h3>
          <p class="value">${data.grandTotal.TOTAL}</p>
        </div>
        <div class="stat-card completed">
          <h3>Completed</h3>
          <p class="value">${data.grandTotal.COMPLETED}</p>
        </div>
        <div class="stat-card percentage">
          <h3>Performance Score</h3>
          <p class="value">${data.grandTotal.PERCENTAGE}%</p>
        </div>
      </div>

      <div class="top-performers">
        <h2>Top 5 Performers 🏆</h2>
        <div class="performer-cards">
          ${data.topPerformers.map((p: any, index: number) => `
            <div class="p-card">
              <h4>#${index + 1} ${p.state}</h4>
              <p>Score: <strong>${p.PERCENTAGE}%</strong></p>
              <p>Completed: ${p.COMPLETED} / ${p.TOTAL}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="table-container">
        <h2>Detailed Analytics</h2>
        <table>
          <thead>
            <tr>
              <th>Region</th>
              <th>Completed</th>
              <th>Cancelled</th>
              <th>Not Serviced</th>
              <th>Hold</th>
              <th>Total</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            ${data.rows.map((row: any) => `
              <tr>
                <td>${row.state}</td>
                <td>${row.COMPLETED || 0}</td>
                <td>${row.CANCELLED || 0}</td>
                <td>${row.NOT_SERVICED || 0}</td>
                <td>${row.FULFILLMENT_HOLD || 0}</td>
                <td>${row.TOTAL || 0}</td>
                <td class="${row.PERCENTAGE >= 80 ? 'pct-high' : row.PERCENTAGE >= 60 ? 'pct-mid' : 'pct-low'}">${row.PERCENTAGE}%</td>
              </tr>
            `).join('')}
            <tr class="grand-total">
              <td>GRAND TOTAL</td>
              <td>${data.grandTotal.COMPLETED}</td>
              <td>${data.grandTotal.CANCELLED}</td>
              <td>${data.grandTotal.NOT_SERVICED}</td>
              <td>${data.grandTotal.FULFILLMENT_HOLD}</td>
              <td>${data.grandTotal.TOTAL}</td>
              <td class="${data.grandTotal.PERCENTAGE >= 80 ? 'pct-high' : data.grandTotal.PERCENTAGE >= 60 ? 'pct-mid' : 'pct-low'}">${data.grandTotal.PERCENTAGE}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="dashboard-grid">
        <div class="chart-container">
          <h2>Performance by Region (Bar)</h2>
          <div style="height: 280px;"><canvas id="barChart-${cat}"></canvas></div>
        </div>
        <div class="chart-container">
          <h2>Trend Analysis (Line)</h2>
          <div style="height: 280px;"><canvas id="lineChart-${cat}"></canvas></div>
        </div>
      </div>
    </div>
      `;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Vista CRM - ${fileName} Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #0f172a;
      --card-bg: rgba(30, 41, 59, 0.7);
      --text-light: #f8fafc;
      --text-muted: #94a3b8;
      --accent-blue: #3b82f6;
      --accent-green: #10b981;
      --accent-red: #ef4444;
      --accent-orange: #f59e0b;
      --border-color: rgba(255, 255, 255, 0.1);
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg-dark);
      background-image: 
        radial-gradient(circle at 15% 50%, rgba(59, 130, 246, 0.08), transparent 25%),
        radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.08), transparent 25%);
      color: var(--text-light);
      margin: 0;
      padding: 0;
      min-height: 100vh;
    }

    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(10px);
      z-index: 100;
      padding-top: 1rem;
    }

    .header-info h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.8rem;
      background: linear-gradient(90deg, #60a5fa, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-info p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .category-section {
      margin-bottom: 4rem;
      padding-bottom: 2rem;
      border-bottom: 2px dashed rgba(255,255,255,0.05);
    }
    .category-section:last-child {
      border-bottom: none;
    }

    .section-header {
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
    }
    .section-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #fff;
      border-left: 4px solid var(--accent-blue);
      padding-left: 1rem;
    }

    .stats-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--card-bg);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-5px);
    }

    .stat-card h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .stat-card .value {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0;
    }

    .stat-card.total .value { color: var(--accent-blue); }
    .stat-card.completed .value { color: var(--accent-green); }
    .stat-card.percentage .value { color: var(--accent-orange); }

    .top-performers {
      background: var(--card-bg);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .top-performers h2 {
      margin-top: 0;
      font-size: 1.2rem;
      color: var(--text-light);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .performer-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .p-card {
      background: rgba(255, 255, 255, 0.05);
      border-left: 4px solid var(--accent-green);
      padding: 1rem;
      border-radius: 6px;
    }

    .p-card h4 {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
    }

    .p-card p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .chart-container {
      background: var(--card-bg);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      height: 350px;
      position: relative;
    }

    .chart-container h2 {
      margin-top: 0;
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }

    .table-container {
      background: var(--card-bg);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      overflow-x: auto;
      margin-bottom: 2rem;
    }

    .table-container h2 {
      margin-top: 0;
      font-size: 1.2rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    th {
      font-size: 0.85rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      font-size: 0.95rem;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .grand-total {
      font-weight: bold;
      background: rgba(255, 255, 255, 0.05);
    }

    .pct-high { color: var(--accent-green); }
    .pct-mid { color: var(--accent-orange); }
    .pct-low { color: var(--accent-red); }

  </style>
</head>
<body>

  <div class="container">
    <header>
      <div class="header-info">
        <h1>FDSS Operations Dashboard</h1>
        <p>Project: ${fileName} &nbsp;|&nbsp; Generated: ${timestamp}</p>
      </div>
      <div>
        <img src="https://via.placeholder.com/120x40/0f172a/60a5fa?text=DATA+VISTA" alt="Logo" style="border-radius:4px;">
      </div>
    </header>

    ${sectionsHtml}

  </div>

  <script>
    // Data Injected from Angular
    const dashboardData = ${JSON.stringify(dashboardData)};
    const categories = ['ALL', 'AC', 'TVLA'];

    // Chart.js Default Config
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, font: { size: 10 } } },
        tooltip: { backgroundColor: '#1e293b', titleColor: '#f8fafc', bodyColor: '#94a3b8', borderColor: '#334155', borderWidth: 1 }
      },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    };

    categories.forEach(cat => {
      const data = dashboardData[cat];
      if (!data || !data.chartData || !data.chartData.labels || data.chartData.labels.length === 0) return;

      const cData = data.chartData;
      const datasets = [
        {
          label: 'COMPLETED',
          data: cData.completedData,
          backgroundColor: '#10b981',
          borderColor: '#10b981',
          borderWidth: 2,
          tension: 0.4,
          borderRadius: 4
        },
        {
          label: 'CANCELLED',
          data: cData.cancelledData,
          backgroundColor: '#f59e0b',
          borderColor: '#f59e0b',
          borderWidth: 2,
          tension: 0.4,
          borderRadius: 4
        },
        {
          label: 'NOT_SERVICED',
          data: cData.notServicedData,
          backgroundColor: '#ef4444',
          borderColor: '#ef4444',
          borderWidth: 2,
          tension: 0.4,
          borderRadius: 4
        }
      ];

      const barElem = document.getElementById('barChart-' + cat);
      if (barElem) {
        new Chart(barElem, {
          type: 'bar',
          data: { labels: cData.labels, datasets },
          options: chartOptions
        });
      }

      const lineElem = document.getElementById('lineChart-' + cat);
      if (lineElem) {
        new Chart(lineElem, {
          type: 'line',
          data: { 
            labels: cData.labels, 
            datasets: datasets.map(d => ({ ...d, fill: false, borderRadius: 0 })) 
          },
          options: chartOptions
        });
      }
    });

  </script>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `Data_Vista_Dashboard_${fileName}_${new Date().getTime()}.html`);
  }
}
