// ============ 竞品分析工具 ============
const COMPETITOR_DB = [
  {name_zh:'无线耳机 Pro', name_en:'Wireless Earbuds Pro', competitor:'SellerA', price:29.9, prevPrice:32.5, sales:12580, reviews:2340, rating:4.5, platform:'Amazon'},
  {name_zh:'无线耳机 Lite', name_en:'Wireless Earbuds Lite', competitor:'SellerB', price:19.9, prevPrice:19.9, sales:8930, reviews:1870, rating:4.3, platform:'Amazon'},
  {name_zh:'瑜伽垫经典', name_en:'Classic Yoga Mat', competitor:'SellerC', price:24.5, prevPrice:22.0, sales:6230, reviews:980, rating:4.6, platform:'Amazon'},
  {name_zh:'USB-C 快充线', name_en:'USB-C Fast Cable', competitor:'SellerD', price:7.5, prevPrice:8.9, sales:22100, reviews:4520, rating:4.7, platform:'Shopee'},
  {name_zh:'旅行收纳包', name_en:'Travel Organizer', competitor:'SellerE', price:15.9, prevPrice:15.9, sales:9870, reviews:1560, rating:4.4, platform:'Amazon'},
  {name_zh:'便携咖啡杯', name_en:'Portable Coffee Cup', competitor:'SellerF', price:12.8, prevPrice:14.2, sales:15600, reviews:2890, rating:4.6, platform:'Shopee'},
];

// 价格历史模拟数据
function genPriceHistory(days) {
  const data = [];
  let p = 25 + Math.random() * 10;
  for (let i = days; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    p += (Math.random() - 0.48) * 1.5;
    p = Math.max(15, Math.min(45, p));
    data.push({date: d.toISOString().slice(0,10), price: +p.toFixed(1)});
  }
  return data;
}

// 评价分析模拟数据
function genReviewAnalysis() {
  return {
    positive: [68, 72, 65, 78, 70],
    neutral:  [20, 16, 22, 15, 18],
    negative: [12, 12, 13, 7, 12],
    keywords: ['质量好', '物流快', '性价比高', '包装好', '有瑕疵', '物流慢'],
    sentiment: [85, 78, 92, 70, 88, 65]
  };
}

let _caChart1 = null, _caChart2 = null;

function renderCompetitorAnalysis() {
  const lang = localStorage.getItem('lang') || 'zh';
  const t = (zh, en) => lang === 'en' ? en : zh;

  return `
    <h2>${t('竞品分析工具', 'Competitor Analysis Tool')}</h2>
    <div class="tool-form">
      <div class="form-row">
        <div class="form-group" style="flex:1">
          <label>${t('搜索竞品', 'Search Competitor')}</label>
          <input type="text" id="ca-search" placeholder="${t('输入商品名或店铺名...', 'Enter product or store name...')}" oninput="caSearch()">
        </div>
        <div class="form-group" style="width:180px">
          <label>${t('平台', 'Platform')}</label>
          <select id="ca-platform" onchange="caSearch()">
            <option value="">${t('全部', 'All')}</option>
            <option>Amazon</option>
            <option>Shopee</option>
          </select>
        </div>
      </div>
    </div>
    <div id="ca-results" style="margin-top:16px;"></div>
    <div id="ca-detail" style="display:none;margin-top:20px;">
      <h3 id="ca-detail-title" style="color:var(--primary);margin-bottom:16px;"></h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
        <div style="background:var(--card);padding:16px;border-radius:8px;">
          <h4 style="font-size:13px;color:var(--text-dim);margin-bottom:10px;">${t('价格趋势（30天）', 'Price Trend (30 Days)')}</h4>
          <canvas id="ca-chart-price" height="180"></canvas>
        </div>
        <div style="background:var(--card);padding:16px;border-radius:8px;">
          <h4 style="font-size:13px;color:var(--text-dim);margin-bottom:10px;">${t('评价情感分析', 'Review Sentiment')}</h4>
          <canvas id="ca-chart-sentiment" height="180"></canvas>
        </div>
      </div>
      <div style="background:var(--card);padding:16px;border-radius:8px;">
        <h4 style="font-size:13px;color:var(--text-dim);margin-bottom:10px;">${t('销量趋势（近5个月）', 'Sales Trend (Last 5 Months)')}</h4>
        <canvas id="ca-chart-sales" height="180"></canvas>
      </div>
    </div>
  `;
}

function caSearch() {
  const lang = localStorage.getItem('lang') || 'zh';
  const t = (zh, en) => lang === 'en' ? en : zh;
  const kw = (document.getElementById('ca-search')?.value || '').toLowerCase();
  const platform = document.getElementById('ca-platform')?.value || '';

  let results = COMPETITOR_DB.filter(p => {
    const name = lang === 'en' ? p.name_en.toLowerCase() : p.name_zh.toLowerCase();
    if (kw && !name.includes(kw)) return false;
    if (platform && p.platform !== platform) return false;
    return true;
  });

  const container = document.getElementById('ca-results');
  const detail = document.getElementById('ca-detail');

  if (results.length === 0) {
    detail.style.display = 'none';
    container.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-dim)">${t('没有找到竞品，请调整搜索条件', 'No competitors found. Adjust search criteria.')}</div>`;
    return;
  }

  container.innerHTML = `
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:var(--card);color:var(--primary);">
          <th style="padding:8px;text-align:left;">${t('商品', 'Product')}</th>
          <th style="padding:8px;">${t('竞品店铺', 'Competitor')}</th>
          <th style="padding:8px;">${t('当前价', 'Price')}</th>
          <th style="padding:8px;">${t('价格变化', 'Price Change')}</th>
          <th style="padding:8px;">${t('销量', 'Sales')}</th>
          <th style="padding:8px;">${t('评分', 'Rating')}</th>
          <th style="padding:8px;">${t('操作', 'Action')}</th>
        </tr></thead>
        <tbody>
          ${results.map((p, i) => {
            const diff = (p.price - p.prevPrice).toFixed(1);
            const diffColor = diff > 0 ? '#ef4444' : diff < 0 ? '#22c55e' : '#888';
            const diffText = diff > 0 ? `+$${diff}` : diff < 0 ? `-$${Math.abs(diff)}` : '-';
            return `<tr style="border-bottom:1px solid #222;cursor:pointer;" onclick="caShowDetail(${i})" onmouseover="this.style.background='#1a1a1a'" onmouseout="this.style.background=''">
              <td style="padding:8px;font-weight:500">${lang === 'en' ? p.name_en : p.name_zh}</td>
              <td style="padding:8px;text-align:center;">${p.competitor}</td>
              <td style="padding:8px;text-align:center;font-weight:600;">$${p.price.toFixed(1)}</td>
              <td style="padding:8px;text-align:center;color:${diffColor};font-size:12px;">${diffText}</td>
              <td style="padding:8px;text-align:center;">${p.sales.toLocaleString()}</td>
              <td style="padding:8px;text-align:center;">⭐${p.rating}</td>
              <td style="padding:8px;text-align:center;"><button class="btn-connect" style="padding:4px 12px;font-size:12px;" onclick="event.stopPropagation();caShowDetail(${i})">${t('分析', 'Analyze')}</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  if (results.length > 0) caShowDetail(0, results);
}

function caShowDetail(idx, data) {
  const lang = localStorage.getItem('lang') || 'zh';
  const t = (zh, en) => lang === 'en' ? en : zh;
  const results = data || COMPETITOR_DB;
  const p = results[idx] || results[0];
  if (!p) return;

  document.getElementById('ca-detail').style.display = '';
  document.getElementById('ca-detail-title').textContent = (lang === 'en' ? p.name_en : p.name_zh) + ' — ' + p.competitor;

  // Price trend chart
  const priceData = genPriceHistory(30);
  const ctx1 = document.getElementById('ca-chart-price')?.getContext('2d');
  if (ctx1) {
    if (_caChart1) _caChart1.destroy();
    _caChart1 = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: priceData.map(d => d.date.slice(5)),
        datasets: [{data: priceData.map(d => d.price), borderColor:'#d4af37', backgroundColor:'rgba(212,175,55,0.1)', fill:true, tension:0.4, pointRadius:0}]
      },
      options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{grid:{color:'#333'}, ticks:{color:'#888'}}, x:{grid:{display:false}, ticks:{color:'#888', maxRotation:0, autoSkip:true, maxTicksLimit:8}}}}
    });
  }

  // Sentiment chart
  const review = genReviewAnalysis();
  const ctx2 = document.getElementById('ca-chart-sentiment')?.getContext('2d');
  if (ctx2) {
    if (_caChart2) _caChart2.destroy();
    _caChart2 = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: [t('好评', 'Positive'), t('中评', 'Neutral'), t('差评', 'Negative')],
        datasets: [{data: [review.positive[0], review.neutral[0], review.negative[0]], backgroundColor:['#22c55e','#eab308','#ef4444']}]
      },
      options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#aaa'}}}}
    });
  }

  // Sales trend chart
  const ctx3 = document.getElementById('ca-chart-sales')?.getContext('2d');
  if (ctx3) {
    const months = t(['1月','2月','3月','4月','5月'], ['Jan','Feb','Mar','Apr','May']);
    if (window._caChart3) window._caChart3.destroy();
    window._caChart3 = new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {label: t('我的销量', 'My Sales'), data: [4200,5100,6800,5900,7200], backgroundColor:'#d4af37'},
          {label: p.competitor, data: [(p.sales*0.7/5)|0, (p.sales*0.8/5)|0, (p.sales*0.9/5)|0, (p.sales*1.0/5)|0, (p.sales*1.1/5)|0], backgroundColor:'#3b82f6'}
        ]
      },
      options: {responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#aaa'}}}, scales:{y:{grid:{color:'#333'}, ticks:{color:'#888'}}, x:{grid:{display:false}, ticks:{color:'#888'}}}}
    });
  }
}
