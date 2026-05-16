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
    
    // Get ALL category for Top 5
    const allResult = this.pivotEngine.generatePivots(records, 'All', 'ALL');
    const allRows = allResult?.summary?.rows || [];
    const grandTotal = allResult?.summary?.grandTotal || { TOTAL: 0, COMPLETED: 0, PERCENTAGE: 0 };
    
    // Compute Top 5 Performers based on COMPLETED volume or PERCENTAGE
    // We will use a combination: High percentage and high completed
    // Let's sort by PERCENTAGE descending, then COMPLETED descending
    const topPerformers = [...allRows]
      .sort((a, b) => {
        if (b.PERCENTAGE !== a.PERCENTAGE) return b.PERCENTAGE - a.PERCENTAGE;
        return b.COMPLETED - a.COMPLETED;
      })
      .slice(0, 5);

    // Get ALL data for the Table and Charts
    const labels = allRows.map(r => r.state);
    const completedData = allRows.map(r => r.COMPLETED || 0);
    const cancelledData = allRows.map(r => r.CANCELLED || 0);
    const notServicedData = allRows.map(r => r.NOT_SERVICED || 0);

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Vista CRM - \${fileName} Dashboard</title>
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
        <p>Project: \${fileName} &nbsp;|&nbsp; Generated: \${timestamp}</p>
      </div>
      <div>
        <img src="https://via.placeholder.com/120x40/0f172a/60a5fa?text=DATA+VISTA" alt="Logo" style="border-radius:4px;">
      </div>
    </header>

    <div class="stats-summary">
      <div class="stat-card total">
        <h3>Total Records</h3>
        <p class="value">\${grandTotal.TOTAL}</p>
      </div>
      <div class="stat-card completed">
        <h3>Completed</h3>
        <p class="value">\${grandTotal.COMPLETED}</p>
      </div>
      <div class="stat-card percentage">
        <h3>Performance Score</h3>
        <p class="value">\${grandTotal.PERCENTAGE}%</p>
      </div>
    </div>

    <div class="top-performers">
      <h2>Top 5 Performers 🏆</h2>
      <div class="performer-cards">
        \${topPerformers.map((p, index) => \`
          <div class="p-card">
            <h4>#\${index + 1} \${p.state}</h4>
            <p>Score: <strong>\${p.PERCENTAGE}%</strong></p>
            <p>Completed: \${p.COMPLETED} / \${p.TOTAL}</p>
          </div>
        \`).join('')}
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="chart-container">
        <h2>Performance by Region (Bar)</h2>
        <div style="height: 280px;"><canvas id="barChart"></canvas></div>
      </div>
      <div class="chart-container">
        <h2>Trend Analysis (Line)</h2>
        <div style="height: 280px;"><canvas id="lineChart"></canvas></div>
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
          \${allRows.map(row => \`
            <tr>
              <td>\${row.state}</td>
              <td>\${row.COMPLETED || 0}</td>
              <td>\${row.CANCELLED || 0}</td>
              <td>\${row.NOT_SERVICED || 0}</td>
              <td>\${row.FULFILLMENT_HOLD || 0}</td>
              <td>\${row.TOTAL || 0}</td>
              <td class="\${row.PERCENTAGE >= 80 ? 'pct-high' : row.PERCENTAGE >= 60 ? 'pct-mid' : 'pct-low'}">\${row.PERCENTAGE}%</td>
            </tr>
          \`).join('')}
          <tr class="grand-total">
            <td>GRAND TOTAL</td>
            <td>\${grandTotal.COMPLETED}</td>
            <td>\${grandTotal.CANCELLED}</td>
            <td>\${grandTotal.NOT_SERVICED}</td>
            <td>\${grandTotal.FULFILLMENT_HOLD}</td>
            <td>\${grandTotal.TOTAL}</td>
            <td class="\${grandTotal.PERCENTAGE >= 80 ? 'pct-high' : grandTotal.PERCENTAGE >= 60 ? 'pct-mid' : 'pct-low'}">\${grandTotal.PERCENTAGE}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    // Data Injected from Angular
    const labels = \${JSON.stringify(labels)};
    const completedData = \${JSON.stringify(completedData)};
    const cancelledData = \${JSON.stringify(cancelledData)};
    const notServicedData = \${JSON.stringify(notServicedData)};

    // Chart.js Default Config
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';

    const datasets = [
      {
        label: 'COMPLETED',
        data: completedData,
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        borderWidth: 2,
        tension: 0.4,
        borderRadius: 4
      },
      {
        label: 'CANCELLED',
        data: cancelledData,
        backgroundColor: '#f59e0b',
        borderColor: '#f59e0b',
        borderWidth: 2,
        tension: 0.4,
        borderRadius: 4
      },
      {
        label: 'NOT_SERVICED',
        data: notServicedData,
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
        borderWidth: 2,
        tension: 0.4,
        borderRadius: 4
      }
    ];

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

    // Render Bar Chart
    new Chart(document.getElementById('barChart'), {
      type: 'bar',
      data: { labels, datasets },
      options: chartOptions
    });

    // Render Line Chart
    new Chart(document.getElementById('lineChart'), {
      type: 'line',
      data: { 
        labels, 
        datasets: datasets.map(d => ({ ...d, fill: false, borderRadius: 0 })) 
      },
      options: chartOptions
    });
  </script>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    saveAs(blob, \`Data_Vista_Dashboard_\${fileName}_\${new Date().getTime()}.html\`);
  }
}
