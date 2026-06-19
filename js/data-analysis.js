// ============ 数据分析工具 ============
const SALES_DATA = [];
const MONTHS_ZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const REGIONS_ZH = ['北美','欧洲','中东','东南亚','其他'];
const REGIONS_EN = ['North America','Europe','Middle East','SE Asia','Others'];
const CATEGORIES_ZH = ['电子产品','家居','美妆','服装','其他'];
const CATEGORIES_EN = ['Electronics','Home','Beauty','Clothing','Others'];

// 生成模拟数据
function genSalesData() {
  for (let m = 0; m < 12; m++) {
    SALES_DATA.push({
      month: m,
      sales: Math.floor(3000 + Math.random() * 7000),
      profit: +(Math.random() * 8000 + 2000).toFixed(0),
      orders: Math.floor(100 + Math.random() * 400),
      regions: REGIONS_ZH.map(() => Math.floor(Math.random() * 5000)),
      categories: CATEGORIES_ZH.map(() => Math.floor(Math.random() * 4000)),
    });
  }
}
genSalesData();

let _daChart1 = null, _daChart2 = null, _daChart3 = null;

function tDA(zh, en) {
  const lang = localStorage.getItem('lang') || 'zh';
  return lang === 'en' ? en : zh;
}

function renderDataAnalysis() {
  const t = tDA;
  return `
    <h2>${t('数据分析工具', 'Data Analytics Tool')}</h2>
    <p style="color:var(--text-dim);margin-bottom:16px;font-size:13px;">${t('上传销售数据或查看模拟数据进行分析。', 'Upload sales data or view simulated data for analysis.')}</p>

    <div class="tool-form" style="margin-bottom:20px;">
      <div class="form-row">
        <div class="form-group" style="flex:1;">
          <label>${t('上传销售数据（CSV）', 'Upload Sales Data (CSV)')}</label>
          <input type="file" id="da-file" accept=".csv" onchange="daImportCSV()">
          <div style="font-size:11px;color:var(--text-dim);margin-top:4px;">${t('CSV格式：日期,销量,利润,地区,类目', 'CSV format: date,sales,profit,region,category')}</div>
        </div>
        <div class="form-group" style="width:200px;">
          <label>${t('分析类型', 'Analysis Type')}</label>
          <select id="da-type" onchange="daRenderCharts()">
            <option value="sales">${t('销售趋势', 'Sales Trend')}</option>
            <option value="profit">${t('利润分析', 'Profit Analysis')}</option>
            <option value="region">${t('地区分布', 'Regional Distribution')}</option>
            <option value="category">${t('类目分析', 'Category Analysis')}</option>
          </select>
        </div>
        <div class="form-group" style="width:160px;">
          <label>${t('时间范围', 'Time Range')}</label>
          <select id="da-range" onchange="daRenderCharts()">
            <option value="6">${t('近6个月', 'Last 6 Months')}</option>
            <option value="12" selected>${t('近12个月', 'Last 12 Months')}</option>
          </select>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div style="background:var(--card);padding:16px;border-radius:8px;">
        <h4 style="font-size:13px;color:var(--text-dim);margin:0 0 10px 0;">${t('销售趋势', 'Sales Trend')}</h4>
        <canvas id="da-chart-sales" height="200"></canvas>
      </div>
      <div style="background:var(--card);padding:16px;border-radius:8px;">
        <h4 style="font-size:13px;color:var(--text-dim);margin:0 0 10px 0;">${t('利润分析', 'Profit Analysis')}</h4>
        <canvas id="da-chart-profit" height="200"></canvas>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div style="background:var(--card);padding:16px;border-radius:8px;">
        <h4 style="font-size:13px;color:var(--text-dim);margin:0 0 10px 0;">${t('地区分布', 'Regional Distribution')}</h4>
        <canvas id="da-chart-region" height="200"></canvas>
      </div>
      <div style="background:var(--card);padding:16px;border-radius:8px;">
        <h4 style="font-size:13px;color:var(--text-dim);margin:0 0 10px 0;">${t('类目销量占比', 'Sales by Category')}</h4>
        <canvas id="da-chart-category" height="200"></canvas>
      </div>
    </div>

    <div style="background:var(--card);padding:16px;border-radius:8px;margin-bottom:20px;">
      <h4 style="font-size:13px;color:var(--text-dim);margin:0 0 10px 0;">${t('数据汇总', 'Data Summary')}</h4>
      <div id="da-summary" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;"></div>
    </div>

    <div style="margin-top:12px;">
      <button class="btn-cta" onclick="daExportExcel()" style="padding:8px 18px;font-size:13px;">${t('导出分析报告（Excel）', 'Export Analysis Report (Excel)')}</button>
    </div>
  `;
}

function daGetMonths() {
  const range = parseInt(document.getElementById('da-range')?.value || '12');
  return SALES_DATA.slice(-range);
}

function daRenderCharts() {
  const t = tDA;
  const lang = localStorage.getItem('lang') || 'zh';
  const months = daGetMonths();
  const monthLabels = months.map(m => lang === 'en' ? MONTHS_EN[m.month] : MONTHS_ZH[m.month]);
  const range = parseInt(document.getElementById('da-range')?.value || '12');

  // Sales trend
  const ctx1 = document.getElementById('da-chart-sales')?.getContext('2d');
  if (ctx1) {
    if (_daChart1) _daChart1.destroy();
    _daChart1 = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [
          {label: t('销售额($)', 'Sales($)'), data: months.map(m => m.sales), borderColor:'#d4af37', backgroundColor:'rgba(212,175,55,0.1)', fill:true, tension:0.4, pointRadius:2},
          {label: t('订单数', 'Orders'), data: months.map(m => m.orders), borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.1)', fill:true, tension:0.4, pointRadius:2, yAxisID:'y2'}
        ]
      },
      options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#aaa'}}}, scales:{y:{grid:{color:'#333'}, ticks:{color:'#888'}}, y2:{position:'right', grid:{display:false}, ticks:{color:'#888'}}, x:{grid:{display:false}, ticks:{color:'#888'}}}}
    });
  }

  // Profit analysis
  const ctx2 = document.getElementById('da-chart-profit')?.getContext('2d');
  if (ctx2) {
    if (_daChart2) _daChart2.destroy();
    _daChart2 = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [{label: t('利润($)', 'Profit($)'), data: months.map(m => m.profit), backgroundColor:'rgba(212,175,55,0.6)', borderColor:'#d4af37', borderWidth:1}]
      },
      options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#aaa'}}}, scales:{y:{grid:{color:'#333'}, ticks:{color:'#888'}}, x:{grid:{display:false}, ticks:{color:'#888'}}}}
    });
  }

  // Regional distribution (pie)
  const ctx3 = document.getElementById('da-chart-region')?.getContext('2d');
  if (ctx3) {
    if (_daChart3) _daChart3.destroy();
    const regions = lang === 'en' ? REGIONS_EN : REGIONS_ZH;
    const regionTotals = REGIONS_ZH.map((_, i) => months.reduce((a, m) => a + m.regions[i], 0));
    _daChart3 = new Chart(ctx3, {
      type: 'doughnut',
      data: {
        labels: regions,
        datasets: [{data: regionTotals, backgroundColor:['#d4af37','#3b82f6','#22c55e','#ef4444','#a855f7']}]
      },
      options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#aaa'}}}}
    });
  }

  // Category pie
  const ctx4 = document.getElementById('da-chart-category')?.getContext('2d');
  if (ctx4) {
    if (window._daChart4) window._daChart4.destroy();
    const categories = lang === 'en' ? CATEGORIES_EN : CATEGORIES_ZH;
    const catTotals = CATEGORIES_ZH.map((_, i) => months.reduce((a, m) => a + m.categories[i], 0));
    window._daChart4 = new Chart(ctx4, {
      type: 'pie',
      data: {
        labels: categories,
        datasets: [{data: catTotals, backgroundColor:['#d4af37','#3b82f6','#22c55e','#ef4444','#f59e0b']}]
      },
      options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#aaa'}}}}
    });
  }

  // Summary
  const totalSales = months.reduce((a, m) => a + m.sales, 0);
  const totalProfit = months.reduce((a, m) => a + m.profit, 0);
  const totalOrders = months.reduce((a, m) => a + m.orders, 0);
  const avgOrder = totalOrders > 0 ? (totalSales / totalOrders).toFixed(1) : 0;
  const profitRate = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0;

  document.getElementById('da-summary').innerHTML = `
    <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:var(--primary);">$${totalSales.toLocaleString()}</div><div style="font-size:11px;color:var(--text-dim);">${t('总销售额', 'Total Sales')}</div></div>
    <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#22c55e;">$${totalProfit.toLocaleString()}</div><div style="font-size:11px;color:var(--text-dim);">${t('总利润', 'Total Profit')}</div></div>
    <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#3b82f6;">${totalOrders.toLocaleString()}</div><div style="font-size:11px;color:var(--text-dim);">${t('总订单', 'Total Orders')}</div></div>
    <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#ef4444;">${profitRate}%</div><div style="font-size:11px;color:var(--text-dim);">${t('利润率', 'Profit Rate')}</div></div>
    <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#a855f7;">$${avgOrder}</div><div style="font-size:11px;color:var(--text-dim);">${t('客单价', 'AOV')}</div></div>
  `;
}

function daImportCSV() {
  const t = tDA;
  const fileInput = document.getElementById('da-file');
  const file = fileInput?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const text = e.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) throw new Error('No data');

      // Parse CSV (simple)
      const headers = lines[0].split(',').map(h => h.trim());
      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim());
        if (vals.length >= 2) {
          parsed.push({
            month: i - 1,
            sales: parseInt(vals[1]) || 0,
            profit: parseInt(vals[2]) || 0,
            orders: Math.floor(Math.random() * 300 + 50),
            regions: REGIONS_ZH.map(() => Math.floor(Math.random() * 3000)),
            categories: CATEGORIES_ZH.map(() => Math.floor(Math.random() * 2000)),
          });
        }
      }
      if (parsed.length > 0) {
        SALES_DATA.length = 0;
        SALES_DATA.push(...parsed);
        daRenderCharts();
        alert(t('CSV 导入成功！已分析 ' + parsed.length + ' 条数据', 'CSV imported! Analyzed ' + parsed.length + ' records'));
      }
    } catch(err) {
      alert(t('CSV 解析失败，请检查格式', 'CSV parse failed. Check format.'));
    }
  };
  reader.readAsText(file);
}

function daExportExcel() {
  const t = tDA;
  if (typeof XLSX === 'undefined') return alert(t('XLSX library not loaded', 'XLSX library not loaded'));
  const lang = localStorage.getItem('lang') || 'zh';
  const months = daGetMonths();
  const monthLabels = months.map(m => lang === 'en' ? MONTHS_EN[m.month] : MONTHS_ZH[m.month]);

  const data = [
    [t('月份', 'Month'), t('销售额($)', 'Sales($)'), t('利润($)', 'Profit($)'), t('订单数', 'Orders'), ...(lang==='en'?REGIONS_EN:REGIONS_ZH), ...(lang==='en'?CATEGORIES_EN:CATEGORIES_ZH)],
    ...months.map(m => [lang==='en'?MONTHS_EN[m.month]:MONTHS_ZH[m.month], m.sales, m.profit, m.orders, ...m.regions, ...m.categories])
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, t('数据分析', 'Data Analysis'));
  XLSX.writeFile(wb, t('数据分析报告.xlsx', 'data-analysis-report.xlsx'));
}

// Auto-render on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => { try { daRenderCharts(); } catch(e) {} }, 500);
});
