// ============ 选品工具 ============
const PRODUCT_DB = [
  {name_zh:'无线蓝牙耳机', name_en:'Wireless Bluetooth Earbuds', price:19.9, sales:12580, trend:'up', platform:'Amazon', profit:8.5, rating:4.5},
  {name_zh:'瑜伽垫', name_en:'Yoga Mat', price:24.5, sales:8930, trend:'up', platform:'Amazon', profit:12.0, rating:4.3},
  {name_zh:'便携咖啡杯', name_en:'Portable Coffee Cup', price:12.8, sales:15600, trend:'up', platform:'Shopee', profit:6.2, rating:4.6},
  {name_zh:'LED台灯', name_en:'LED Desk Lamp', price:32.0, sales:6230, trend:'down', platform:'Amazon', profit:14.5, rating:4.1},
  {name_zh:'手机支架', name_en:'Phone Stand', price:8.5, sales:22100, trend:'up', platform:'Shopee', profit:4.8, rating:4.7},
  {name_zh:'旅行收纳包', name_en:'Travel Organizer', price:15.9, sales:9870, trend:'up', platform:'Amazon', profit:7.3, rating:4.4},
  {name_zh:'厨房空气炸锅', name_en:'Air Fryer', price:45.0, sales:4560, trend:'down', platform:'Amazon', profit:18.0, rating:4.2},
  {name_zh:'宠物玩具球', name_en:'Pet Toy Ball', price:6.9, sales:18900, trend:'up', platform:'Shopee', profit:3.5, rating:4.8},
  {name_zh:'防晒霜SPF50', name_en:'Sunscreen SPF50', price:11.2, sales:31200, trend:'up', platform:'Shopee', profit:5.6, rating:4.5},
  {name_zh:'运动水壶', name_en:'Sport Water Bottle', price:14.0, sales:13450, trend:'up', platform:'Amazon', profit:6.8, rating:4.4},
  {name_zh:'颈枕旅行', name_en:'Travel Neck Pillow', price:16.8, sales:7650, trend:'stable', platform:'Amazon', profit:8.2, rating:4.3},
  {name_zh:'USB-C充电线', name_en:'USB-C Charging Cable', price:5.5, sales:28700, trend:'up', platform:'Shopee', profit:2.8, rating:4.6},
  {name_zh:'加湿器', name_en:'Humidifier', price:22.0, sales:5430, trend:'down', platform:'Amazon', profit:10.5, rating:4.0},
  {name_zh:'蓝牙音箱', name_en:'Bluetooth Speaker', price:28.5, sales:8920, trend:'up', platform:'Amazon', profit:13.0, rating:4.3},
  {name_zh:'婴儿湿巾', name_en:'Baby Wipes', price:9.8, sales:25600, trend:'up', platform:'Shopee', profit:4.2, rating:4.7},
];

function renderProductSelection() {
  const lang = localStorage.getItem('lang') || 'zh';
  const t = (zh, en) => lang === 'en' ? en : zh;

  return `
    <h2>${t('选品工具', 'Product Selection Tool')}</h2>
    <div class="tool-form">
      <div class="form-row">
        <div class="form-group" style="flex:1">
          <label>${t('搜索商品', 'Search Products')}</label>
          <input type="text" id="ps-search" placeholder="${t('输入关键词...', 'Enter keywords...')}" oninput="psSearch()">
        </div>
        <div class="form-group" style="width:180px">
          <label>${t('平台', 'Platform')}</label>
          <select id="ps-platform" onchange="psSearch()">
            <option value="">${t('全部', 'All')}</option>
            <option>Amazon</option>
            <option>Shopee</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group" style="flex:1">
          <label>${t('价格区间（美元）', 'Price Range (USD)')}</label>
          <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
            <input type="number" id="ps-min" placeholder="0" style="width:90px" oninput="psSearch()">
            <span>—</span>
            <input type="number" id="ps-max" placeholder="100" style="width:90px" oninput="psSearch()">
          </div>
        </div>
        <div class="form-group" style="width:180px">
          <label>${t('排序', 'Sort By')}</label>
          <select id="ps-sort" onchange="psSearch()">
            <option value="sales-desc">${t('销量最高', 'Highest Sales')}</option>
            <option value="sales-asc">${t('销量最低', 'Lowest Sales')}</option>
            <option value="price-asc">${t('价格最低', 'Lowest Price')}</option>
            <option value="price-desc">${t('价格最高', 'Highest Price')}</option>
            <option value="profit-desc">${t('利润最高', 'Highest Profit')}</option>
          </select>
        </div>
      </div>
    </div>
    <div id="ps-results" style="margin-top:20px;"></div>
    <div id="ps-table-wrap" style="margin-top:16px;overflow-x:auto;display:none">
      <div style="margin-bottom:10px;">
        <button class="btn-cta" onclick="psExportExcel()" style="padding:8px 18px;font-size:13px;">${t('导出 Excel', 'Export Excel')}</button>
        <span id="ps-count" style="margin-left:12px;color:var(--text-dim);font-size:13px;"></span>
      </div>
      <table id="ps-table" style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:var(--card);color:var(--primary);"></tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `;
}

function psSearch() {
  const lang = localStorage.getItem('lang') || 'zh';
  const t = (zh, en) => lang === 'en' ? en : zh;
  const kw = (document.getElementById('ps-search')?.value || '').toLowerCase();
  const platform = document.getElementById('ps-platform')?.value || '';
  const min = parseFloat(document.getElementById('ps-min')?.value) || 0;
  const max = parseFloat(document.getElementById('ps-max')?.value) || 9999;
  const sort = document.getElementById('ps-sort')?.value || 'sales-desc';

  let results = PRODUCT_DB.filter(p => {
    const name = lang === 'en' ? p.name_en.toLowerCase() : p.name_zh.toLowerCase();
    if (kw && !name.includes(kw)) return false;
    if (platform && p.platform !== platform) return false;
    if (p.price < min || p.price > max) return false;
    return true;
  });

  // Sort
  results.sort((a, b) => {
    if (sort === 'sales-desc') return b.sales - a.sales;
    if (sort === 'sales-asc') return a.sales - b.sales;
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'profit-desc') return b.profit - a.profit;
    return 0;
  });

  const wrap = document.getElementById('ps-table-wrap');
  const container = document.getElementById('ps-results');
  const countEl = document.getElementById('ps-count');

  if (results.length === 0) {
    wrap.style.display = 'none';
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-dim)">${t('没有找到匹配的商品', 'No matching products found')}</div>`;
    return;
  }

  wrap.style.display = '';
  countEl.textContent = t(`共找到 ${results.length} 个商品`, `Found ${results.length} products`);

  // Render table
  const thead = document.querySelector('#ps-table thead tr');
  const isEn = lang === 'en';
  thead.innerHTML = `
    <th style="padding:8px;text-align:left">${t('商品名', 'Product')}</th>
    <th style="padding:8px">${t('平台', 'Platform')}</th>
    <th style="padding:8px">${t('价格($)', 'Price($)')}</th>
    <th style="padding:8px">${t('利润($)', 'Profit($)')}</th>
    <th style="padding:8px">${t('销量', 'Sales')}</th>
    <th style="padding:8px">${t('评分', 'Rating')}</th>
    <th style="padding:8px">${t('趋势', 'Trend')}</th>
  `;

  const tbody = document.querySelector('#ps-table tbody');
  tbody.innerHTML = results.map(p => {
    const trendIcon = p.trend === 'up' ? '📈' : p.trend === 'down' ? '📉' : '➡️';
    const trendColor = p.trend === 'up' ? '#22c55e' : p.trend === 'down' ? '#ef4444' : '#888';
    return `<tr style="border-bottom:1px solid #222;">
      <td style="padding:8px;font-weight:500">${isEn ? p.name_en : p.name_zh}</td>
      <td style="padding:8px;text-align:center">${p.platform}</td>
      <td style="padding:8px;text-align:center">$${p.price.toFixed(1)}</td>
      <td style="padding:8px;text-align:center;color:var(--primary)">$${p.profit.toFixed(1)}</td>
      <td style="padding:8px;text-align:center">${p.sales.toLocaleString()}</td>
      <td style="padding:8px;text-align:center">⭐${p.rating}</td>
      <td style="padding:8px;text-align:center;color:${trendColor}">${trendIcon}</td>
    </tr>`;
  }).join('');

  // Store for export
  window._psResults = results;
}

function psExportExcel() {
  const lang = localStorage.getItem('lang') || 'zh';
  const results = window._psResults || [];
  if (!results.length) return alert(lang === 'en' ? 'No data to export' : '没有数据可导出');
  if (typeof XLSX === 'undefined') return alert('XLSX library not loaded');

  const isEn = lang === 'en';
  const data = [
    [isEn ? 'Product' : '商品名', isEn ? 'Platform' : '平台', 'Price(USD)', isEn ? 'Profit(USD)' : '利润(USD)', isEn ? 'Sales' : '销量', isEn ? 'Rating' : '评分', isEn ? 'Trend' : '趋势'],
    ...results.map(p => [isEn ? p.name_en : p.name_zh, p.platform, p.price, p.profit, p.sales, p.rating, p.trend])
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isEn ? 'Products' : '选品');
  XLSX.writeFile(wb, isEn ? 'product-selection.xlsx' : '选品工具导出.xlsx');
}

// init
document.addEventListener('DOMContentLoaded', () => {
  // placeholder
});
