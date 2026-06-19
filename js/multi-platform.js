// ============ 多平台管理工具 ============
const PLATFORM_STORES = {
  'Amazon': [
    {name_zh:'主店铺 US', name_en:'Main Store US', status:'已连接', orders:156, sync:'正常', stock:892},
    {name_zh:'主店铺 EU', name_en:'Main Store EU', status:'已连接', orders:98, sync:'正常', stock:654},
    {name_zh:'品牌店', name_en:'Brand Store', status:'异常', orders:23, sync:'失败', stock:120},
  ],
  'Shopee': [
    {name_zh:'泰国店', name_en:'Thailand Store', status:'已连接', orders:234, sync:'正常', stock:1560},
    {name_zh:'马来店', name_en:'Malaysia Store', status:'已连接', orders:189, sync:'延迟', stock:980},
  ],
  'Lazada': [
    {name_zh:'马来西亚店', name_en:'MY Store', status:'未连接', orders:0, sync:'-', stock:0},
  ],
  'eBay': [
    {name_zh:'美国店', name_en:'US Store', status:'已连接', orders:67, sync:'正常', stock:430},
  ]
};

let _mpSyncTimer = null;

function renderMultiPlatform() {
  const lang = localStorage.getItem('lang') || 'zh';
  const t = (zh, en) => lang === 'en' ? en : zh;

  let html = `<h2>${t('多平台管理', 'Multi-Platform Manager')}</h2>`;
  html += `<p style="color:var(--text-dim);margin-bottom:16px;font-size:13px;">${t('连接你的店铺，一站式管理库存和订单。', 'Connect your stores to manage inventory and orders from one place.')}</p>`;

  // Platform cards
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin-bottom:24px;">`;
  const platforms = ['Amazon','Shopee','Lazada','eBay'];
  const icons = ['📦','🛒','🏪','📊'];
  platforms.forEach((pf, i) => {
    const stores = PLATFORM_STORES[pf] || [];
    const connected = stores.filter(s => s.status === '已连接' || s.status === 'Connected').length;
    const totalOrders = stores.reduce((a,s) => a + s.orders, 0);
    html += `
      <div class="platform-card" style="cursor:pointer;" onclick="mpShowPlatform('${pf}')">
        <div style="font-size:28px;margin-bottom:8px;">${icons[i]}</div>
        <h3 style="margin:0 0 8px 0;font-size:15px;">${pf}</h3>
        <div style="font-size:12px;color:var(--text-dim);">
          ${t('已连接', 'Connected')}: <span style="color:var(--primary);font-weight:600;">${connected}</span> /
          ${t('店铺', 'stores')}: ${stores.length}<br>
          ${t('今日订单', 'Today Orders')}: <span style="color:#22c55e;font-weight:600;">${totalOrders}</span>
        </div>
        <button class="btn-connect" style="margin-top:12px;width:100%;" onclick="event.stopPropagation();mpConnect('${pf}')">
          ${connected > 0 ? t('重新连接', 'Reconnect') : t('连接', 'Connect')}
        </button>
      </div>`;
  });
  html += `</div>`;

  // Store list (hidden initially)
  html += `<div id="mp-store-list" style="display:none;"></div>`;

  // Sync panel
  html += `
    <div style="background:var(--card);border-radius:8px;padding:16px;margin-top:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;font-size:14px;">${t('库存同步', 'Inventory Sync')}</h3>
        <div>
          <span id="mp-sync-status" style="font-size:12px;color:var(--text-dim);margin-right:12px;">${t('待启动', 'Idle')}</span>
          <button class="btn-connect" id="mp-sync-btn" onclick="mpToggleSync()" style="padding:6px 16px;">${t('启动同步', 'Start Sync')}</button>
        </div>
      </div>
      <div id="mp-sync-log" style="background:#0a0a0a;border-radius:6px;padding:12px;font-size:12px;color:#22c55e;height:120px;overflow-y:auto;font-family:monospace;display:none;"></div>
    </div>
  `;

  return html;
}

function mpShowPlatform(platform) {
  const lang = localStorage.getItem('lang') || 'zh';
  const t = (zh, en) => lang === 'en' ? en : zh;
  const stores = PLATFORM_STORES[platform] || [];
  const container = document.getElementById('mp-store-list');
  container.style.display = '';

  let html = `<h3 style="margin:16px 0 12px 0;color:var(--primary);">${platform} ${t('店铺列表', 'Store List')}</h3>`;
  html += `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr style="background:var(--bg);color:var(--text-dim);">
      <th style="padding:8px;text-align:left;">${t('店铺名', 'Store')}</th>
      <th style="padding:8px;">${t('状态', 'Status')}</th>
      <th style="padding:8px;">${t('今日订单', 'Orders')}</th>
      <th style="padding:8px;">${t('同步状态', 'Sync')}</th>
      <th style="padding:8px;">${t('库存', 'Stock')}</th>
      <th style="padding:8px;">${t('操作', 'Action')}</th>
    </tr></thead>
    <tbody>`;
  stores.forEach((s, i) => {
    const statusColor = s.status === '已连接' ? '#22c55e' : s.status === '异常' ? '#ef4444' : '#888';
    html += `<tr style="border-bottom:1px solid #222;">
      <td style="padding:8px;font-weight:500;">${lang==='en'? s.name_en : s.name_zh}</td>
      <td style="padding:8px;text-align:center;"><span style="color:${statusColor};">●</span> ${s.status}</td>
      <td style="padding:8px;text-align:center;">${s.orders}</td>
      <td style="padding:8px;text-align:center;color:${s.sync==='正常'?'#22c55e':s.sync==='失败'?'#ef4444':'#888'}">${s.sync}</td>
      <td style="padding:8px;text-align:center;">${s.stock}</td>
      <td style="padding:8px;text-align:center;"><button class="btn-connect" style="padding:4px 10px;font-size:12px;" onclick="mpSyncStore('${platform}',${i})">${t('同步', 'Sync')}</button></td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

function mpConnect(platform) {
  const lang = localStorage.getItem('lang') || 'zh';
  alert(lang === 'en' ? `Connecting to ${platform}...\n(Simulated - requires API credentials)` : `正在连接 ${platform}...\n（模拟功能 - 需配置 API 密钥）`);
  const stores = PLATFORM_STORES[platform];
  if (stores) stores.forEach(s => { s.status = '已连接'; s.sync = '正常'; });
  mpShowPlatform(platform);
}

function mpSyncStore(platform, idx) {
  const lang = localStorage.getItem('lang') || 'zh';
  const stores = PLATFORM_STORES[platform];
  if (!stores || !stores[idx]) return;
  const s = stores[idx];
  s.stock = s.stock + Math.floor(Math.random()*50) - 10;
  s.stock = Math.max(0, s.stock);
  s.sync = '正常';
  mpShowPlatform(platform);
}

function mpToggleSync() {
  const lang = localStorage.getItem('lang') || 'zh';
  const btn = document.getElementById('mp-sync-btn');
  const status = document.getElementById('mp-sync-status');
  const log = document.getElementById('mp-sync-log');

  if (_mpSyncTimer) {
    clearInterval(_mpSyncTimer);
    _mpSyncTimer = null;
    btn.textContent = lang === 'en' ? 'Start Sync' : '启动同步';
    status.textContent = lang === 'en' ? 'Idle' : '待启动';
    status.style.color = '';
    log.style.display = 'none';
  } else {
    btn.textContent = lang === 'en' ? 'Stop Sync' : '停止同步';
    status.textContent = lang === 'en' ? 'Syncing every 30s' : '每30秒同步中';
    status.style.color = '#22c55e';
    log.style.display = '';
    log.innerHTML = `[${new Date().toLocaleTimeString()}] ${lang==='en'?'Sync started':'同步已启动'}\n`;
    _mpSyncTimer = setInterval(() => {
      const now = new Date().toLocaleTimeString();
      const msg = `[${now}] ${lang==='en'?'Sync complete - all stores updated':'同步完成 - 所有店铺已更新'}`;
      log.innerHTML += msg + '\n';
      log.scrollTop = log.scrollHeight;
    }, 3000);
  }
}
