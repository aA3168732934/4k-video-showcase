// ============ 自动化工具 ============
const AUTO_TASKS = [
  {id:1, name_zh:'自动回复-售前咨询', name_en:'Auto-Reply: Pre-Sales', enabled:true, type:'reply', runCount:128, lastRun:'2026-06-20 10:30'},
  {id:2, name_zh:'订单同步-Amazon', name_en:'Order Sync: Amazon', enabled:true, type:'sync', runCount:56, lastRun:'2026-06-20 10:15'},
  {id:3, name_zh:'评价邀请-自动发送', name_en:'Review Request: Auto-Send', enabled:false, type:'review', runCount:34, lastRun:'2026-06-19 18:00'},
  {id:4, name_zh:'库存预警-低于10件', name_en:'Stock Alert: <10 items', enabled:true, type:'alert', runCount:12, lastRun:'2026-06-20 09:00'},
  {id:5, name_zh:'价格监控-竞品追踪', name_en:'Price Monitor: Competitor', enabled:false, type:'monitor', runCount:89, lastRun:'2026-06-20 08:00'},
];

const REPLY_RULES = [
  {id:1, keyword_zh:'多少钱', keyword_en:'price', response_zh:'感谢咨询！这款商品现价 $${price}，今日下单享9折。', response_en:'Thanks for asking! This item is $${price}, 10% off today.', enabled:true},
  {id:2, keyword_zh:'包邮吗', keyword_en:'shipping', response_zh:'全场满$99包邮，直邮3-7天到达。', response_en:'Free shipping on orders over $99. Delivery 3-7 days.', enabled:true},
  {id:3, keyword_zh:'正品吗', keyword_en:'authentic', response_zh:'我们所有商品均为原装正品，支持7天无理由退货。', response_en:'All our products are 100% authentic. 7-day return policy.', enabled:true},
  {id:4, keyword_zh:'什么时候发货', keyword_en:'when ship', response_zh:'订单确认后24小时内发货，请留意物流通知。', response_en:'Ships within 24 hours after order confirmation.', enabled:false},
];

let _atLogTimer = null;

function tAT(zh, en) {
  const lang = localStorage.getItem('lang') || 'zh';
  return lang === 'en' ? en : zh;
}

function renderAutomation() {
  const t = tAT;
  let html = `<h2>${t('自动化工具', 'Automation Tools')}</h2>`;

  // Task list
  html += `<p style="color:var(--text-dim);margin-bottom:16px;font-size:13px;">${t('管理和监控所有自动化任务。', 'Manage and monitor all automation tasks.')}</p>`;

  html += `<div style="margin-bottom:20px;">
    <button class="btn-cta" onclick="atAddTask()" style="padding:8px 18px;font-size:13px;margin-right:8px;">+ ${t('新增任务', 'New Task')}</button>
    <button class="btn-connect" onclick="atExportLog()" style="padding:8px 18px;font-size:13px;">${t('导出日志', 'Export Log')}</button>
  </div>`;

  // Task table
  html += `<div style="background:var(--card);border-radius:8px;overflow:hidden;margin-bottom:24px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:#111;color:var(--primary);">
        <th style="padding:10px;text-align:left;">${t('任务名', 'Task Name')}</th>
        <th style="padding:10px;">${t('类型', 'Type')}</th>
        <th style="padding:10px;">${t('状态', 'Status')}</th>
        <th style="padding:10px;">${t('运行次数', 'Runs')}</th>
        <th style="padding:10px;">${t('最后运行', 'Last Run')}</th>
        <th style="padding:10px;">${t('操作', 'Action')}</th>
      </tr></thead>
      <tbody id="at-task-tbody">`;

  AUTO_TASKS.forEach(task => {
    const typeMap = {reply:t('自动回复','Auto-Reply'), sync:t('订单同步','Order Sync'), review:t('评价邀请','Review'), alert:t('库存预警','Stock Alert'), monitor:t('价格监控','Price Monitor')};
    const statusColor = task.enabled ? '#22c55e' : '#888';
    const statusText = task.enabled ? t('运行中','Running') : t('已停止','Stopped');
    html += `<tr style="border-bottom:1px solid #222;" id="at-task-${task.id}">
      <td style="padding:10px;font-weight:500;">${t(task.name_zh, task.name_en)}</td>
      <td style="padding:10px;text-align:center;font-size:12px;">${typeMap[task.type]||task.type}</td>
      <td style="padding:10px;text-align:center;"><span style="color:${statusColor};">●</span> ${statusText}</td>
      <td style="padding:10px;text-align:center;">${task.runCount}</td>
      <td style="padding:10px;text-align:center;font-size:12px;color:var(--text-dim);">${task.lastRun}</td>
      <td style="padding:10px;text-align:center;">
        <button onclick="atToggleTask(${task.id})" style="padding:4px 10px;font-size:12px;border-radius:4px;border:1px solid ${task.enabled?'#ef4444':'#22c55e'};color:${task.enabled?'#ef4444':'#22c55e'};background:transparent;cursor:pointer;">
          ${task.enabled ? t('停止','Stop') : t('启动','Start')}
        </button>
        <button onclick="atDeleteTask(${task.id})" style="padding:4px 10px;font-size:12px;border-radius:4px;border:1px solid #666;color:#666;background:transparent;cursor:pointer;margin-left:4px;">${t('删除','Del')}</button>
      </td>
    </tr>`;
  });

  html += `</tbody></table></div>`;

  // Auto-reply rules section
  html += `<h3 style="font-size:15px;margin:0 0 12px 0;">${t('自动回复规则', 'Auto-Reply Rules')}</h3>`;
  html += `<div style="margin-bottom:12px;"><button class="btn-connect" onclick="atAddRule()" style="padding:6px 14px;font-size:12px;">+ ${t('新增规则', 'Add Rule')}</button></div>`;

  html += `<div style="background:var(--card);border-radius:8px;overflow:hidden;margin-bottom:24px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:#111;color:var(--primary);">
        <th style="padding:10px;text-align:left;">${t('关键词', 'Keyword')}</th>
        <th style="padding:10px;text-align:left;">${t('自动回复内容', 'Auto-Reply Content')}</th>
        <th style="padding:10px;">${t('状态', 'Status')}</th>
        <th style="padding:10px;">${t('操作', 'Action')}</th>
      </tr></thead>
      <tbody id="at-rule-tbody">`;

  REPLY_RULES.forEach(rule => {
    html += `<tr style="border-bottom:1px solid #222;" id="at-rule-${rule.id}">
      <td style="padding:10px;font-weight:500;color:var(--primary);">${t(rule.keyword_zh, rule.keyword_en)}</td>
      <td style="padding:10px;font-size:12px;color:var(--text-dim);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t(rule.response_zh, rule.response_en)}</td>
      <td style="padding:10px;text-align:center;"><span style="color:${rule.enabled?'#22c55e':'#888'};">●</span> ${rule.enabled?t('启用','On'):t('禁用','Off')}</td>
      <td style="padding:10px;text-align:center;">
        <button onclick="atToggleRule(${rule.id})" style="padding:4px 10px;font-size:12px;border-radius:4px;border:1px solid #d4af37;color:#d4af37;background:transparent;cursor:pointer;">
          ${rule.enabled ? t('禁用','Disable') : t('启用','Enable')}
        </button>
      </td>
    </tr>`;
  });

  html += `</tbody></table></div>`;

  // Execution log
  html += `<h3 style="font-size:15px;margin:0 0 12px 0;">${t('执行日志', 'Execution Log')}</h3>`;
  html += `<div id="at-log" style="background:#0a0a0a;border-radius:8px;padding:12px;font-size:12px;color:#22c55e;height:140px;overflow-y:auto;font-family:monospace;margin-bottom:16px;"></div>`;

  html += `<div style="display:flex;gap:8px;">
    <button class="btn-connect" onclick="atClearLog()" style="padding:6px 14px;font-size:12px;">${t('清空日志', 'Clear Log')}</button>
    <button class="btn-connect" onclick="atStartLog()" style="padding:6px 14px;font-size:12px;" id="at-log-btn">${t('模拟运行', 'Simulate')}</button>
  </div>`;

  return html;
}

function atAddTask() {
  const t = tAT;
  const nameZh = prompt(t('输入任务名（中文）', 'Enter task name (Chinese):')) || t('新任务','New Task');
  const nameEn = prompt(t('输入任务名（英文）', 'Enter task name (English):')) || 'New Task';
  const types = ['reply','sync','review','alert','monitor'];
  const type = types[Math.floor(Math.random()*types.length)];
  AUTO_TASKS.push({
    id: Date.now(), name_zh:nameZh, name_en:nameEn, enabled:true, type,
    runCount:0, lastRun: new Date().toISOString().slice(0,16).replace('T',' ')
  });
  atRefreshTasks();
}

function atToggleTask(id) {
  const task = AUTO_TASKS.find(t => t.id === id);
  if (task) { task.enabled = !task.enabled; atRefreshTasks(); }
}

function atDeleteTask(id) {
  const t = tAT;
  if (confirm(t('确认删除此任务？', 'Delete this task?'))) {
    const idx = AUTO_TASKS.findIndex(t => t.id === id);
    if (idx >= 0) { AUTO_TASKS.splice(idx, 1); atRefreshTasks(); }
  }
}

function atRefreshTasks() {
  // Re-render the task tbody
  const tbody = document.getElementById('at-task-tbody');
  if (!tbody) return;
  const t = tAT;
  tbody.innerHTML = AUTO_TASKS.map(task => {
    const typeMap = {reply:t('自动回复','Auto-Reply'), sync:t('订单同步','Order Sync'), review:t('评价邀请','Review'), alert:t('库存预警','Stock Alert'), monitor:t('价格监控','Price Monitor')};
    const statusColor = task.enabled ? '#22c55e' : '#888';
    const statusText = task.enabled ? t('运行中','Running') : t('已停止','Stopped');
    return `<tr style="border-bottom:1px solid #222;" id="at-task-${task.id}">
      <td style="padding:10px;font-weight:500;">${t(task.name_zh, task.name_en)}</td>
      <td style="padding:10px;text-align:center;font-size:12px;">${typeMap[task.type]||task.type}</td>
      <td style="padding:10px;text-align:center;"><span style="color:${statusColor};">●</span> ${statusText}</td>
      <td style="padding:10px;text-align:center;">${task.runCount}</td>
      <td style="padding:10px;text-align:center;font-size:12px;color:var(--text-dim);">${task.lastRun}</td>
      <td style="padding:10px;text-align:center;">
        <button onclick="atToggleTask(${task.id})" style="padding:4px 10px;font-size:12px;border-radius:4px;border:1px solid ${task.enabled?'#ef4444':'#22c55e'};color:${task.enabled?'#ef4444':'#22c55e'};background:transparent;cursor:pointer;">
          ${task.enabled ? t('停止','Stop') : t('启动','Start')}
        </button>
        <button onclick="atDeleteTask(${task.id})" style="padding:4px 10px;font-size:12px;border-radius:4px;border:1px solid #666;color:#666;background:transparent;cursor:pointer;margin-left:4px;">${t('删除','Del')}</button>
      </td>
    </tr>`;
  }).join('');
}

function atAddRule() {
  const t = tAT;
  const kwZh = prompt(t('关键词（中文）', 'Keyword (Chinese):')) || '关键词';
  const kwEn = prompt(t('Keyword (English)', 'Keyword (English):')) || 'keyword';
  const resZh = prompt(t('回复内容（中文）', 'Reply content (Chinese):')) || '自动回复内容';
  const resEn = prompt(t('Reply content (English)', 'Reply content (English):')) || 'Auto reply content';
  REPLY_RULES.push({id:Date.now(), keyword_zh:kwZh, keyword_en:kwEn, response_zh:resZh, response_en:resEn, enabled:true});
  atRefreshRules();
}

function atToggleRule(id) {
  const rule = REPLY_RULES.find(r => r.id === id);
  if (rule) { rule.enabled = !rule.enabled; atRefreshRules(); }
}

function atRefreshRules() {
  const tbody = document.getElementById('at-rule-tbody');
  if (!tbody) return;
  const t = tAT;
  tbody.innerHTML = REPLY_RULES.map(rule => {
    return `<tr style="border-bottom:1px solid #222;" id="at-rule-${rule.id}">
      <td style="padding:10px;font-weight:500;color:var(--primary);">${t(rule.keyword_zh, rule.keyword_en)}</td>
      <td style="padding:10px;font-size:12px;color:var(--text-dim);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t(rule.response_zh, rule.response_en)}</td>
      <td style="padding:10px;text-align:center;"><span style="color:${rule.enabled?'#22c55e':'#888'};">●</span> ${rule.enabled?t('启用','On'):t('禁用','Off')}</td>
      <td style="padding:10px;text-align:center;">
        <button onclick="atToggleRule(${rule.id})" style="padding:4px 10px;font-size:12px;border-radius:4px;border:1px solid #d4af37;color:#d4af37;background:transparent;cursor:pointer;">
          ${rule.enabled ? t('禁用','Disable') : t('启用','Enable')}
        </button>
      </td>
    </tr>`;
  }).join('');
}

function atExportLog() {
  const t = tAT;
  if (typeof XLSX === 'undefined') return alert(t('XLSX library not loaded', 'XLSX library not loaded'));
  const logEl = document.getElementById('at-log');
  const lines = logEl ? logEl.innerText.split('\n').filter(l => l.trim()) : [];
  const data = [[t('时间','Time'), t('任务','Task'), t('状态','Status')], ...lines.filter(l => l.includes('[')).map(l => {
    const m = l.match(/\[(.+?)\](.+)/);
    return m ? [m[1], m[2], 'OK'] : [l, '', ''];
  })];
  if (data.length <= 1) data.push([new Date().toLocaleString(), t('示例日志','Sample log'), 'OK']);
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Log');
  XLSX.writeFile(wb, t('自动化日志.xlsx','automation-log.xlsx'));
}

function atClearLog() {
  const logEl = document.getElementById('at-log');
  if (logEl) logEl.innerHTML = '';
}

function atStartLog() {
  const t = tAT;
  const logEl = document.getElementById('at-log');
  const btn = document.getElementById('at-log-btn');
  if (!logEl) return;

  if (_atLogTimer) {
    clearInterval(_atLogTimer);
    _atLogTimer = null;
    btn.textContent = t('模拟运行', 'Simulate');
    return;
  }

  btn.textContent = t('停止模拟', 'Stop Sim');
  const taskNames = AUTO_TASKS.filter(t => t.enabled);
  if (!taskNames.length) taskNames.push({name_zh:'示例任务', name_en:'Sample Task'});

  _atLogTimer = setInterval(() => {
    const now = new Date().toLocaleTimeString();
    const task = taskNames[Math.floor(Math.random()*taskNames.length)];
    const name = t(task.name_zh, task.name_en);
    const msgs = [
      `[${now}] ${t('任务「','Task "')}${name}${t('」执行成功','" executed successfully')}`,
      `[${now}] ${t('自动回复触发：','Auto-reply triggered: ')}"${t('你好','Hello')}"`,
      `[${now}] ${t('订单同步完成，新增','Order sync complete, new: ')}${Math.floor(Math.random()*5)}`,
      `[${now}] ${t('库存检查：','Stock check: ')}${t('低于阈值','below threshold')}`,
    ];
    logEl.innerHTML += msgs[Math.floor(Math.random()*msgs.length)] + '\n';
    logEl.scrollTop = logEl.scrollHeight;
  }, 2000);
}

// Init
document.addEventListener('DOMContentLoaded', () => {});
