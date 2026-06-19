// ============ 数据分析工具（海关数据版）============
let CUSTOMS_DATA = [];
let _daChart1 = null, _daChart2 = null, _daChart3 = null, _daChart4 = null;

const MONTHS_ZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const HS_CATEGORIES = {
  '85': '电子产品', '84': '机械设备', '62': '服装', '61': '针织服装',
  '94': '家具', '95': '玩具', '39': '塑料制品', '87': '汽车配件',
  '33': '化妆品', '02': '食品'
};

function tDA(zh, en) {
  const lang = localStorage.getItem('lang') || 'zh';
  return lang === 'en' ? en : zh;
}

// 解析海关CSV数据
function parseCustomsCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.trim());
    if (vals.length >= 8) {
      data.push({
        date: vals[0],
        hsCode: vals[1],
        product: vals[2],
        type: vals[3],  // 出口/进口
        amount: parseFloat(vals[4]) || 0,
        quantity: parseFloat(vals[5]) || 0,
        unit: vals[6],
        country: vals[7]
      });
    }
  }
  return data;
}

// 获取月份标签
function getMonthLabels(data) {
  const lang = localStorage.getItem('lang') || 'zh';
  const months = [...new Set(data.map(d => d.date))].sort();
  return months.map(m => {
    const [year, mon] = m.split('-');
    const idx = parseInt(mon) - 1;
    return lang === 'en' ? `${MONTHS_EN[idx]} ${year}` : `${year}年${MONTHS_ZH[idx]}`;
  });
}

// 按月份汇总数据
function aggregateByMonth(data, field) {
  const months = [...new Set(data.map(d => d.date))].sort();
  return months.map(m => {
    const items = data.filter(d => d.date === m);
    return items.reduce((sum, d) => sum + d[field], 0);
  });
}

// 按国家汇总
function aggregateByCountry(data, type) {
  const filtered = type ? data.filter(d => d.type === type) : data;
  const countries = {};
  filtered.forEach(d => {
    countries[d.country] = (countries[d.country] || 0) + d.amount;
  });
  return countries;
}

// 按商品类别汇总
function aggregateByCategory(data, type) {
  const filtered = type ? data.filter(d => d.type === type) : data;
  const categories = {};
  filtered.forEach(d => {
    const prefix = d.hsCode.substring(0, 2);
    const cat = HS_CATEGORIES[prefix] || '其他';
    categories[cat] = (categories[cat] || 0) + d.amount;
  });
  return categories;
}

function renderDataAnalysis() {
  const t = tDA;
  return `
    <h2>${t('数据分析工具（海关数据）', 'Data Analytics Tool (Customs Data)')}</h2>
    <p style="color:var(--text-dim);margin-bottom:16px;font-size:13px;">${t('上传海关进出口数据CSV文件，或', 'Upload customs import/export CSV, or')} <a href="#" onclick="daLoadSample();return false;" style="color:var(--primary);">${t('加载示例数据', 'load sample data')}</a></p>

    <div class="tool-form" style="margin-bottom:20px;">
      <div class="form-row">
        <div class="form-group" style="flex:1;">
          <label>${t('上传海关数据（CSV）', 'Upload Customs Data (CSV)')}</label>
          <input type="file" id="da-file" accept=".csv" onchange="daImportCSV()">
          <div style="font-size:11px;color:var(--text-dim);margin-top:4px;">${t('格式：日期,HS编码,商品名称,进出口类型,金额美元,数量,单位,国家地区', 'Format: date,HScode,product,type,amount,quantity,unit,country')}</div>
        </div>
        <div class="form-group" style="width:200px;">
          <label>${t('数据类型', 'Data Type')}</label>
          <select id="da-type" onchange="daRenderCharts()">
            <option value="all">${t('全部', 'All')}</option>
            <option value="出口" selected>${t('仅出口', 'Export Only')}</option>
            <option value="进口">${t('仅进口', 'Import Only')}</option>
          </select>
        </div>
        <div class="form-group" style="width:160px;">
          <label>${t('显示条数', 'Show Items')}</label>
          <select id="da-limit" onchange="daRenderCharts()">
            <option value="10">Top 10</option>
            <option value="20" selected>Top 20</option>
            <option value="50">Top 50</option>
          </select>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div style="background:var(--card);padding:16px;border-radius:8px;">
        <h4 style="font-size:13px;color:var(--text-dim);margin:0 0 10px 0;">${t('进出口金额趋势（月度）', 'Import/Export Trend (Monthly)')}</h4>
        <canvas id="da-chart-trend" height="200"></canvas>
      </div>
      <div style="background:var(--card);padding:16px;border-radius:8px;">
        <h4 style="font-size:13px;color:var(--text-dim);margin:0 0 10px 0;">${t('金额汇总（月度）', 'Amount Summary (Monthly)')}</h4>
        <canvas id="da-chart-amount" height="200"></canvas>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div style="background:var(--card);padding:16px;border-radius:8px;">
        <h4 style="font-size:13px;color:var(--text-dim);margin:0 0 10px 0;">${t('主要贸易国家/地区', 'Top Trading Countries/Regions')}</h4>
        <canvas id="da-chart-country" height="200"></canvas>
      </div>
      <div style="background:var(--card);padding:16px;border-radius:8px;">
        <h4 style="font-size:13px;color:var(--text-dim);margin:0 0 10px 0;">${t('商品类别分布', 'Product Category Distribution')}</h4>
        <canvas id="da-chart-category" height="200"></canvas>
      </div>
    </div>

    <div style="background:var(--card);padding:16px;border-radius:8px;margin-bottom:20px;">
      <h4 style="font-size:13px;color:var(--text-dim);margin:0 0 10px 0;">${t('数据汇总', 'Data Summary')}</h4>
      <div id="da-summary" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;"></div>
    </div>

    <div style="margin-top:12px;">
      <button class="btn-cta" onclick="daExportExcel()" style="padding:8px 18px;font-size:13px;">${t('导出分析报告（Excel）', 'Export Analysis Report (Excel)')}</button>
      <button class="btn-cta" onclick="daExportCustomReport()" style="padding:8px 18px;font-size:13px;margin-left:10px;background:#3b82f6;">${t('导出海关分析报告', 'Export Customs Analysis Report')}</button>
    </div>
  `;
}

function daLoadSample() {
  const t = tDA;
  // 加载示例海关数据
  const sampleCSV = `日期,HS编码,商品名称,进出口类型,金额美元,数量,单位,国家地区
2024-01,851712,智能手机,出口,12500000000,85000000,台,美国
2024-01,847130,笔记本电脑,出口,9800000000,12000000,台,美国
2024-01,851761,无线耳机,出口,3800000000,45000000,副,美国
2024-01,620342,棉制男裤,出口,2200000000,85000000,条,美国
2024-01,940350,木质家具,出口,3100000000,8500000,件,美国
2024-01,950300,玩具,出口,2800000000,125000000,个,美国
2024-01,870891,汽车配件,出口,1800000000,42000000,件,美国
2024-01,850440,锂电池,出口,4200000000,280000000,个,欧盟
2024-01,854143,太阳能电池,出口,3100000000,8500000,个,欧盟
2024-01,330410,口红化妆品,进口,950000000,42000000,支,法国
2024-02,851712,智能手机,出口,10500000000,71500000,台,美国
2024-02,847130,笔记本电脑,出口,8200000000,10000000,台,美国
2024-02,851761,无线耳机,出口,3200000000,38000000,副,美国
2024-02,620342,棉制男裤,出口,1850000000,72000000,条,美国
2024-02,940350,木质家具,出口,2650000000,7300000,件,美国
2024-02,950300,玩具,出口,2350000000,105000000,个,美国
2024-02,870891,汽车配件,出口,1550000000,36000000,件,美国
2024-02,850440,锂电池,出口,3650000000,245000000,个,欧盟
2024-02,854143,太阳能电池,出口,2680000000,7400000,个,欧盟
2024-02,330410,口红化妆品,进口,820000000,36000000,支,法国
2024-03,851712,智能手机,出口,13200000000,90000000,台,美国
2024-03,847130,笔记本电脑,出口,10500000000,12800000,台,美国
2024-03,851761,无线耳机,出口,3950000000,47000000,副,美国
2024-03,620342,棉制男裤,出口,2350000000,91000000,条,美国
2024-03,940350,木质家具,出口,3250000000,8900000,件,美国
2024-03,950300,玩具,出口,2950000000,132000000,个,美国
2024-03,870891,汽车配件,出口,1850000000,43000000,件,美国
2024-03,850440,锂电池,出口,4350000000,290000000,个,欧盟
2024-03,854143,太阳能电池,出口,3250000000,8900000,个,欧盟
2024-03,330410,口红化妆品,进口,980000000,43500000,支,法国
2024-04,851712,智能手机,出口,12800000000,87000000,台,美国
2024-04,847130,笔记本电脑,出口,9950000000,12200000,台,美国
2024-04,851761,无线耳机,出口,3700000000,44000000,副,美国
2024-04,620342,棉制男裤,出口,2150000000,83000000,条,美国
2024-04,940350,木质家具,出口,3050000000,8350000,件,美国
2024-04,950300,玩具,出口,2750000000,123000000,个,美国
2024-04,870891,汽车配件,出口,1720000000,40000000,件,美国
2024-04,850440,锂电池,出口,4100000000,275000000,个,欧盟
2024-04,854143,太阳能电池,出口,3050000000,8350000,个,欧盟
2024-04,330410,口红化妆品,进口,910000000,40500000,支,法国
2024-05,851712,智能手机,出口,13500000000,91800000,台,美国
2024-05,847130,笔记本电脑,出口,10200000000,12400000,台,美国
2024-05,851761,无线耳机,出口,3850000000,45500000,副,美国
2024-05,620342,棉制男裤,出口,2280000000,88000000,条,美国
2024-05,940350,木质家具,出口,3150000000,8650000,件,美国
2024-05,950300,玩具,出口,2850000000,128000000,个,美国
2024-05,870891,汽车配件,出口,1780000000,41500000,件,美国
2024-05,850440,锂电池,出口,4250000000,285000000,个,欧盟
2024-05,854143,太阳能电池,出口,3180000000,8700000,个,欧盟
2024-05,330410,口红化妆品,进口,935000000,41500000,支,法国
2024-06,851712,智能手机,出口,14200000000,96500000,台,美国
2024-06,847130,笔记本电脑,出口,10800000000,13200000,台,美国
2024-06,851761,无线耳机,出口,4050000000,48000000,副,美国
2024-06,620342,棉制男裤,出口,2400000000,93000000,条,美国
2024-06,940350,木质家具,出口,3350000000,9200000,件,美国
2024-06,950300,玩具,出口,3050000000,137000000,个,美国
2024-06,870891,汽车配件,出口,1950000000,45500000,件,美国
2024-06,850440,锂电池,出口,4450000000,298000000,个,欧盟
2024-06,854143,太阳能电池,出口,3350000000,9200000,个,欧盟
2024-06,330410,口红化妆品,进口,1020000000,45000000,支,法国`;

  CUSTOMS_DATA = parseCustomsCSV(sampleCSV);
  daRenderCharts();
  alert(t('已加载示例数据！共 ' + CUSTOMS_DATA.length + ' 条记录', 'Sample data loaded! ' + CUSTOMS_DATA.length + ' records'));
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
      CUSTOMS_DATA = parseCustomsCSV(text);
      if (CUSTOMS_DATA.length > 0) {
        daRenderCharts();
        alert(t('CSV 导入成功！已分析 ' + CUSTOMS_DATA.length + ' 条数据', 'CSV imported! Analyzed ' + CUSTOMS_DATA.length + ' records'));
      } else {
        alert(t('未解析到有效数据，请检查CSV格式', 'No valid data parsed. Check CSV format.'));
      }
    } catch(err) {
      alert(t('CSV 解析失败：' + err.message, 'CSV parse failed: ' + err.message));
    }
  };
  reader.readAsText(file);
}

function daRenderCharts() {
  if (CUSTOMS_DATA.length === 0) return;
  
  const t = tDA;
  const lang = localStorage.getItem('lang') || 'zh';
  const type = document.getElementById('da-type')?.value || 'all';
  const limit = parseInt(document.getElementById('da-limit')?.value || '20');
  
  // 过滤数据
  const filtered = type === 'all' ? CUSTOMS_DATA : CUSTOMS_DATA.filter(d => d.type === type);
  
  // 获取月份标签
  const months = [...new Set(CUSTOMS_DATA.map(d => d.date))].sort();
  const monthLabels = months.map(m => {
    const [year, mon] = m.split('-');
    const idx = parseInt(mon) - 1;
    return lang === 'en' ? `${MONTHS_EN[idx]} ${year}` : `${year}年${MONTHS_ZH[idx]}`;
  });
  
  // 按月汇总金额
  const exportByMonth = months.map(m => {
    return CUSTOMS_DATA.filter(d => d.date === m && d.type === '出口').reduce((s, d) => s + d.amount, 0);
  });
  const importByMonth = months.map(m => {
    return CUSTOMS_DATA.filter(d => d.date === m && d.type === '进口').reduce((s, d) => s + d.amount, 0);
  });
  
  // 图表1：进出口趋势
  const ctx1 = document.getElementById('da-chart-trend')?.getContext('2d');
  if (ctx1) {
    if (_daChart1) _daChart1.destroy();
    _daChart1 = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [
          {label: t('出口金额($)', 'Export Amount($)'), data: exportByMonth, borderColor:'#d4af37', backgroundColor:'rgba(212,175,55,0.1)', fill:true, tension:0.4, pointRadius:3},
          {label: t('进口金额($)', 'Import Amount($)'), data: importByMonth, borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.1)', fill:true, tension:0.4, pointRadius:3}
        ]
      },
      options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#aaa'}}}, scales:{y:{grid:{color:'#333'}, ticks:{color:'#888', callback:v=>'$'+(v/1000000000).toFixed(1)+'B'}}, x:{grid:{display:false}, ticks:{color:'#888', maxRotation:45}}}}
    });
  }
  
  // 图表2：金额汇总（柱状图）
  const ctx2 = document.getElementById('da-chart-amount')?.getContext('2d');
  if (ctx2) {
    if (_daChart2) _daChart2.destroy();
    const totalByMonth = months.map(m => {
      return CUSTOMS_DATA.filter(d => d.date === m).reduce((s, d) => s + d.amount, 0);
    });
    _daChart2 = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [{label: t('总金额($)', 'Total Amount($)'), data: totalByMonth, backgroundColor:'rgba(212,175,55,0.6)', borderColor:'#d4af37', borderWidth:1}]
      },
      options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#aaa'}}}, scales:{y:{grid:{color:'#333'}, ticks:{color:'#888', callback:v=>'$'+(v/1000000000).toFixed(1)+'B'}}, x:{grid:{display:false}, ticks:{color:'#888', maxRotation:45}}}}
    });
  }
  
  // 图表3：主要贸易国家
  const ctx3 = document.getElementById('da-chart-country')?.getContext('2d');
  if (ctx3) {
    if (_daChart3) _daChart3.destroy();
    const countryData = aggregateByCountry(filtered);
    const sortedCountries = Object.entries(countryData).sort((a, b) => b[1] - a[1]).slice(0, limit);
    _daChart3 = new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: sortedCountries.map(c => c[0]),
        datasets: [{label: t('金额($)', 'Amount($)'), data: sortedCountries.map(c => c[1]), backgroundColor:['#d4af37','#3b82f6','#22c55e','#ef4444','#a855f7','#f59e0b','#06b6d4','#ec4899'].slice(0, sortedCountries.length)}]
      },
      options: {responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false}}, scales:{x:{grid:{color:'#333'}, ticks:{color:'#888', callback:v=>'$'+(v/1000000000).toFixed(1)+'B'}}, y:{grid:{display:false}, ticks:{color:'#888'}}}}
    });
  }
  
  // 图表4：商品类别分布
  const ctx4 = document.getElementById('da-chart-category')?.getContext('2d');
  if (ctx4) {
    if (_daChart4) _daChart4.destroy();
    const catData = aggregateByCategory(filtered);
    const categories = Object.entries(catData).sort((a, b) => b[1] - a[1]);
    _daChart4 = new Chart(ctx4, {
      type: 'doughnut',
      data: {
        labels: categories.map(c => c[0]),
        datasets: [{data: categories.map(c => c[1]), backgroundColor:['#d4af37','#3b82f6','#22c55e','#ef4444','#a855f7','#f59e0b','#06b6d4','#ec4899','#14b8a6','#f97316']}]
      },
      options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#aaa'}}}}
    });
  }
  
  // 汇总信息
  const totalExport = CUSTOMS_DATA.filter(d => d.type === '出口').reduce((s, d) => s + d.amount, 0);
  const totalImport = CUSTOMS_DATA.filter(d => d.type === '进口').reduce((s, d) => s + d.amount, 0);
  const totalAmount = totalExport + totalImport;
  const totalQuantity = CUSTOMS_DATA.reduce((s, d) => s + d.quantity, 0);
  const avgPrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;
  const topProduct = [...CUSTOMS_DATA].sort((a, b) => b.amount - a.amount)[0];
  const topCountry = Object.entries(aggregateByCountry(CUSTOMS_DATA)).sort((a, b) => b[1] - a[1])[0];
  
  document.getElementById('da-summary').innerHTML = `
    <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:var(--primary);">$${(totalExport/1000000000).toFixed(2)}B</div><div style="font-size:11px;color:var(--text-dim);">${t('总出口额', 'Total Export')}</div></div>
    <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#3b82f6;">$${(totalImport/1000000000).toFixed(2)}B</div><div style="font-size:11px;color:var(--text-dim);">${t('总进口额', 'Total Import')}</div></div>
    <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#22c55e;">$${(totalAmount/1000000000).toFixed(2)}B</div><div style="font-size:11px;color:var(--text-dim);">${t('总贸易额', 'Total Trade')}</div></div>
    <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#ef4444;">${CUSTOMS_DATA.length.toLocaleString()}</div><div style="font-size:11px;color:var(--text-dim);">${t('总记录数', 'Total Records')}</div></div>
    <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#a855f7;">${topProduct?.product || '-'}</div><div style="font-size:11px;color:var(--text-dim);">${t('最高金额商品', 'Top Product by Amount')}</div></div>
    <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#f59e0b;">${topCountry?.[0] || '-'}</div><div style="font-size:11px;color:var(--text-dim);">${t('最大贸易国', 'Top Trading Country')}</div></div>
  `;
}

function daExportExcel() {
  const t = tDA;
  if (typeof XLSX === 'undefined') return alert(t('XLSX library not loaded', 'XLSX library not loaded'));
  if (CUSTOMS_DATA.length === 0) return alert(t('请先导入数据', 'Please import data first'));
  
  const lang = localStorage.getItem('lang') || 'zh';
  const type = document.getElementById('da-type')?.value || 'all';
  const filtered = type === 'all' ? CUSTOMS_DATA : CUSTOMS_DATA.filter(d => d.type === type);
  
  const data = [
    [t('日期', 'Date'), t('HS编码', 'HS Code'), t('商品名称', 'Product'), t('进出口类型', 'Type'), t('金额(美元)', 'Amount(USD)'), t('数量', 'Quantity'), t('单位', 'Unit'), t('国家/地区', 'Country')],
    ...filtered.map(d => [d.date, d.hsCode, d.product, d.type, d.amount, d.quantity, d.unit, d.country])
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, t('海关数据', 'Customs Data'));
  XLSX.writeFile(wb, t('海关数据分析报告.xlsx', 'customs-data-analysis.xlsx'));
}

function daExportCustomReport() {
  const t = tDA;
  if (typeof XLSX === 'undefined') return alert(t('XLSX library not loaded', 'XLSX library not loaded'));
  if (CUSTOMS_DATA.length === 0) return alert(t('请先导入数据', 'Please import data first'));
  
  const lang = localStorage.getItem('lang') || 'zh';
  const type = document.getElementById('da-type')?.value || 'all';
  const filtered = type === 'all' ? CUSTOMS_DATA : CUSTOMS_DATA.filter(d => d.type === type);
  
  // 按国家汇总
  const countryData = aggregateByCountry(filtered);
  const countrySheet = [
    [t('国家/地区', 'Country/Region'), t('金额(美元)', 'Amount(USD)')],
    ...Object.entries(countryData).sort((a, b) => b[1] - a[1]).map(c => [c[0], c[1]])
  ];
  
  // 按商品汇总
  const productMap = {};
  filtered.forEach(d => {
    const key = d.hsCode + '|' + d.product;
    if (!productMap[key]) productMap[key] = {hsCode: d.hsCode, product: d.product, amount: 0, quantity: 0};
    productMap[key].amount += d.amount;
    productMap[key].quantity += d.quantity;
  });
  const productSheet = [
    [t('HS编码', 'HS Code'), t('商品名称', 'Product'), t('金额(美元)', 'Amount(USD)'), t('数量', 'Quantity')],
    ...Object.values(productMap).sort((a, b) => b.amount - a.amount).map(p => [p.hsCode, p.product, p.amount, p.quantity])
  ];
  
  // 按月汇总
  const months = [...new Set(CUSTOMS_DATA.map(d => d.date))].sort();
  const monthlySheet = [
    [t('月份', 'Month'), t('出口金额', 'Export'), t('进口金额', 'Import'), t('总金额', 'Total')],
    ...months.map(m => {
      const exportAmt = CUSTOMS_DATA.filter(d => d.date === m && d.type === '出口').reduce((s, d) => s + d.amount, 0);
      const importAmt = CUSTOMS_DATA.filter(d => d.date === m && d.type === '进口').reduce((s, d) => s + d.amount, 0);
      return [m, exportAmt, importAmt, exportAmt + importAmt];
    })
  ];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthlySheet), t('月度汇总', 'Monthly Summary'));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(countrySheet), t('国家分析', 'Country Analysis'));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(productSheet), t('商品分析', 'Product Analysis'));
  XLSX.writeFile(wb, t('海关深度分析报告.xlsx', 'customs-deep-analysis.xlsx'));
}

// 自动渲染
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => { try { if (CUSTOMS_DATA.length > 0) daRenderCharts(); } catch(e) {} }, 500);
});
