/* ============================================
   Fairy🌲💦 个人成长工作台 - 核心逻辑
   数据持久化：localStorage
   ============================================ */

// ===== 数据中心 =====
const STORAGE_KEY = 'fairy_workspace_v1';

const defaultData = {
  meta: { version: 1, created: Date.now() },
  checkin: { days: [], streak: 0, lastDate: null }, // days: ['2026-07-20', ...]
  plan: [],      // {id, text, done, date}
  english: [],   // {id, word, meaning, date}
  spanish: [],   // {id, word, meaning, date}
  video: [],     // {id, title, status, date}
  psai: [],      // {id, title, status, date}
  sport: [],     // {id, text, status, date}
  book: [],      // {id, title, author, status, date}
  movie: [],     // {id, title, type, status, date}
  resource: [],  // {id, title, link, category, date}
  report: [],    // {id, text, date}
  mood: [],      // {id, mood, text, date}
  review: []     // {id, week, highlight, problem, next, date}
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultData);
    const parsed = JSON.parse(raw);
    // 合并缺失字段（兼容旧版本）
    return { ...structuredClone(defaultData), ...parsed };
  } catch (e) {
    console.error('加载数据失败', e);
    return structuredClone(defaultData);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('保存数据失败', e);
    toast('保存失败，请检查浏览器存储');
  }
}

// ===== 工具函数 =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekKey(d = new Date()) {
  // 返回年份+周序号，例如 "2026-W31"
  const year = d.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function toast(msg, ms = 1800) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

function getTodayItems() {
  const t = today();
  return {
    plan: state.plan.filter(x => x.date === t),
    english: state.english.filter(x => x.date === t),
    spanish: state.spanish.filter(x => x.date === t),
    video: state.video.filter(x => x.date === t),
    psai: state.psai.filter(x => x.date === t),
    sport: state.sport.filter(x => x.date === t),
    book: state.book.filter(x => x.date === t),
    movie: state.movie.filter(x => x.date === t),
    resource: state.resource.filter(x => x.date === t),
  };
}

// ===== 渲染：模块卡片网格 =====
const modules = [
  { id: 'plan',     name: '每日计划',     icon: '📋' },
  { id: 'english',  name: '英语学习',     icon: '🌍' },
  { id: 'spanish',  name: '西语学习',     icon: '🇪🇸' },
  { id: 'video',    name: '剪辑创作',     icon: '🎬' },
  { id: 'psai',     name: 'PS AI 设计',   icon: '🎨' },
  { id: 'sport',    name: '运动打卡',     icon: '🏃' },
  { id: 'book',     name: '读书板块',     icon: '📚' },
  { id: 'movie',    name: '电影电视',     icon: '🎥' },
  { id: 'resource', name: '学习资源广场', icon: '🛍️' },
  { id: 'report',   name: '每日汇报',     icon: '📰' },
  { id: 'mood',     name: '心情日记',     icon: '💭' },
  { id: 'review',   name: '每周复盘',     icon: '📝' },
];

function renderModuleGrid() {
  const grid = $('#moduleGrid');
  const todayItems = getTodayItems();
  const counts = {
    plan: todayItems.plan.filter(x => !x.done).length,
    english: state.english.length,
    spanish: state.spanish.length,
    video: state.video.filter(x => x.status !== '完成').length,
    psai: state.psai.filter(x => x.status !== '完成').length,
    sport: state.sport.filter(x => x.status !== '已完成').length,
    book: state.book.filter(x => x.status !== '已读完').length,
    movie: state.movie.filter(x => x.status !== '已看').length,
    resource: state.resource.length,
    report: state.report.length,
    mood: state.mood.length,
    review: state.review.length,
  };

  grid.innerHTML = modules.map(m => `
    <div class="module-card" data-goto="${m.id}">
      <span class="module-icon">${m.icon}</span>
      <span class="module-name">${m.name}</span>
      ${counts[m.id] ? `<span class="module-count">${counts[m.id]}</span>` : ''}
    </div>
  `).join('');

  grid.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => scrollToPanel(el.dataset.goto));
  });
}

function scrollToPanel(id) {
  const panel = document.querySelector(`[data-panel="${id}"]`);
  if (panel) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const input = panel.querySelector('input, textarea');
    if (input) setTimeout(() => input.focus(), 400);
  }
}

// ===== 渲染：顶部统计 / 本周统计 =====
function renderStats() {
  const todayItems = getTodayItems();
  const todayPlan = todayItems.plan;
  const done = todayPlan.filter(x => x.done).length;
  const todo = todayPlan.length - done;

  $('#statCheckin').textContent = state.checkin.streak || 0;
  $('#statDone').textContent = done;
  $('#statTodo').textContent = todo;

  // 本周统计
  const wk = getWeekKey();
  // 本周打卡天数
  const weekDays = state.checkin.days.filter(d => {
    const dd = new Date(d);
    return getWeekKey(dd) === wk;
  }).length;

  // 本周完成率：本周所有任务完成情况
  const weekAll = [];
  const monday = getMonday(new Date());
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 7);
  ['plan', 'english', 'spanish', 'video', 'psai', 'sport', 'book', 'movie', 'resource'].forEach(k => {
    state[k].forEach(item => {
      const itemDate = new Date(item.date);
      if (itemDate >= monday && itemDate < sunday) {
        if (k === 'plan') weekAll.push(item.done);
        else weekAll.push(item.status === '完成' || item.status === '已完成' || item.status === '已看' || item.status === '已读完');
      }
    });
  });
  const weekDone = weekAll.filter(Boolean).length;
  const weekRate = weekAll.length ? Math.round((weekDone / weekAll.length) * 100) : 0;

  // 待完成：所有未完成项数
  const weekPending = weekAll.length - weekDone;

  $('#weekDays').textContent = weekDays;
  $('#weekRate').textContent = weekRate + '%';
  $('#weekPending').textContent = weekPending;
  $('#weekBar').style.width = weekRate + '%';
}

function getMonday(d) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// ===== 渲染：每日计划 =====
function renderPlan() {
  const list = $('#planList');
  const items = state.plan.filter(x => x.date === today());
  if (!items.length) {
    list.innerHTML = `<div class="empty"><span class="empty-icon">📝</span>今天还没有计划，添加一个吧</div>`;
    return;
  }
  list.innerHTML = items.map(item => `
    <li>
      <div class="todo-check ${item.done ? 'checked' : ''}" data-toggle="${item.id}"></div>
      <div class="todo-text ${item.done ? 'done' : ''}">${escapeHtml(item.text)}</div>
      <button class="del-btn" data-del="${item.id}">删除</button>
    </li>
  `).join('');

  list.querySelectorAll('[data-toggle]').forEach(el => {
    el.addEventListener('click', () => {
      const it = state.plan.find(x => x.id === el.dataset.toggle);
      if (it) it.done = !it.done;
      saveState();
      renderAll();
    });
  });
  list.querySelectorAll('[data-del]').forEach(el => {
    el.addEventListener('click', () => {
      state.plan = state.plan.filter(x => x.id !== el.dataset.del);
      saveState();
      renderAll();
      toast('已删除');
    });
  });
}

// 通用卡片渲染（英语 / 西语 / 剪辑 / PS / 运动 / 读书 / 电影 / 资源）
function renderCards(key, listSel, fields) {
  const list = $(listSel);
  if (!state[key].length) {
    list.innerHTML = `<div class="empty"><span class="empty-icon">${modules.find(m=>m.id===key)?.icon || '📌'}</span>暂无内容</div>`;
    return;
  }
  // 按日期倒序
  const items = [...state[key]].sort((a, b) => b.date.localeCompare(a.date));
  list.innerHTML = items.map(item => {
    const tags = (fields.tags || []).map((t, i) => {
      const cls = fields.tagClass ? fields.tagClass(item, i) : '';
      return `<span class="tag ${cls}">${escapeHtml(item[t])}</span>`;
    }).join('');
    const title = fields.title ? escapeHtml(item[fields.title]) : '';
    const sub = fields.sub ? fields.sub(item) : '';
    return `
      <li>
        <div class="card-meta">
          <div class="card-title">${title}</div>
          <div class="card-sub">${tags}${sub}</div>
        </div>
        <button class="del-btn" data-del-card="${item.id}" data-key="${key}">删除</button>
      </li>
    `;
  }).join('');

  list.querySelectorAll('[data-del-card]').forEach(el => {
    el.addEventListener('click', () => {
      const k = el.dataset.key;
      state[k] = state[k].filter(x => x.id !== el.dataset.delCard);
      saveState();
      renderAll();
      toast('已删除');
    });
  });
}

// ===== 渲染：英语 / 西语 =====
function renderEnglish() {
  renderCards('english', '#engList', {
    title: 'word',
    sub: item => ` <span class="card-sub" style="display:inline">${escapeHtml(item.meaning)}</span>`,
    tags: []
  });
}
function renderSpanish() {
  renderCards('spanish', '#spList', {
    title: 'word',
    sub: item => ` <span class="card-sub" style="display:inline">${escapeHtml(item.meaning)}</span>`,
    tags: []
  });
}

// ===== 渲染：剪辑 =====
function renderVideo() {
  renderCards('video', '#vidList', {
    title: 'title',
    tags: ['status'],
    tagClass: (item) => item.status === '完成' ? 'done' : ''
  });
}

// ===== 渲染：PS AI =====
function renderPsai() {
  renderCards('psai', '#psList', {
    title: 'title',
    tags: ['status'],
    tagClass: (item) => item.status === '完成' ? 'done' : ''
  });
}

// ===== 渲染：运动 =====
function renderSport() {
  renderCards('sport', '#sportList', {
    title: 'text',
    tags: ['status'],
    tagClass: (item) => {
      if (item.status === '已完成') return 'done';
      if (item.status === '未开始') return 'todo';
      return '';
    }
  });
  // 打卡状态
  const isChecked = state.checkin.days.includes(today());
  const btn = $('#checkinBtn');
  if (isChecked) {
    btn.classList.add('done');
    btn.textContent = '✓ 今日已打卡';
  } else {
    btn.classList.remove('done');
    btn.textContent = '今日打卡 ✓';
  }
  $('#checkinStatus').textContent = `已连续打卡 ${state.checkin.streak} 天`;
}

// ===== 渲染：读书 =====
function renderBook() {
  renderCards('book', '#bookList', {
    title: 'title',
    tags: [],
    sub: item => `<span class="card-sub" style="display:inline">作者：${escapeHtml(item.author || '佚名')} · ${escapeHtml(item.status || '想读')}</span>`
  });
}

// ===== 渲染：电影 =====
function renderMovie() {
  renderCards('movie', '#mvList', {
    title: 'title',
    tags: ['type', 'status'],
    tagClass: (item, i) => {
      if (i === 1) return item.status === '已看' ? 'done' : '';
      return 'accent';
    }
  });
}

// ===== 渲染：资源广场 =====
function renderResource() {
  const list = $('#resList');
  if (!state.resource.length) {
    list.innerHTML = `<div class="empty"><span class="empty-icon">🛍️</span>暂无资源，添加第一个吧</div>`;
    return;
  }
  list.innerHTML = [...state.resource].sort((a,b) => b.date.localeCompare(a.date)).map(item => `
    <li>
      <div class="card-meta">
        <div class="card-title">
          ${escapeHtml(item.title)}
          ${item.link ? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener" style="font-size:12px; color:var(--primary); margin-left:6px;">🔗</a>` : ''}
        </div>
        <div class="card-sub">
          <span class="tag accent">${escapeHtml(item.category)}</span>
          <span style="color:var(--muted)">${escapeHtml(item.date)}</span>
        </div>
      </div>
      <button class="del-btn" data-del-res="${item.id}">删除</button>
    </li>
  `).join('');
  list.querySelectorAll('[data-del-res]').forEach(el => {
    el.addEventListener('click', () => {
      state.resource = state.resource.filter(x => x.id !== el.dataset.delRes);
      saveState();
      renderAll();
      toast('已删除');
    });
  });
}

// ===== 渲染：每日汇报 =====
function renderReport() {
  // 填充日期选择
  const sel = $('#reportDate');
  const cur = sel.value;
  const dates = [...new Set(state.report.map(r => r.date))].sort().reverse();
  if (!dates.includes(today())) dates.unshift(today());
  sel.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');
  if (cur && dates.includes(cur)) sel.value = cur;
  // 加载文本
  const r = state.report.find(x => x.date === sel.value);
  $('#reportText').value = r ? r.text : '';

  // 列表
  const list = $('#reportList');
  if (!state.report.length) {
    list.innerHTML = `<div class="empty"><span class="empty-icon">📰</span>暂无汇报</div>`;
    return;
  }
  list.innerHTML = [...state.report].sort((a,b) => b.date.localeCompare(a.date)).map(item => `
    <li>
      <div class="card-meta">
        <div class="card-title">📅 ${escapeHtml(item.date)}</div>
        <div class="card-sub" style="white-space:pre-wrap; color:var(--text);">${escapeHtml(item.text.slice(0, 80))}${item.text.length > 80 ? '...' : ''}</div>
      </div>
      <button class="del-btn" data-del-rep="${item.id}">删除</button>
    </li>
  `).join('');
  list.querySelectorAll('[data-del-rep]').forEach(el => {
    el.addEventListener('click', () => {
      state.report = state.report.filter(x => x.id !== el.dataset.delRep);
      saveState();
      renderReport();
      toast('已删除');
    });
  });
}

// ===== 渲染：心情日记 =====
let currentMood = '😊';
function renderMood() {
  const list = $('#moodList');
  if (!state.mood.length) {
    list.innerHTML = `<div class="empty"><span class="empty-icon">💭</span>暂无心情记录</div>`;
    return;
  }
  list.innerHTML = [...state.mood].sort((a,b) => b.date.localeCompare(a.date)).map(item => `
    <li>
      <div style="font-size:28px;">${escapeHtml(item.mood)}</div>
      <div class="card-meta">
        <div class="card-title">📅 ${escapeHtml(item.date)}</div>
        <div class="card-sub" style="white-space:pre-wrap; color:var(--text);">${escapeHtml(item.text)}</div>
      </div>
      <button class="del-btn" data-del-mood="${item.id}">删除</button>
    </li>
  `).join('');
  list.querySelectorAll('[data-del-mood]').forEach(el => {
    el.addEventListener('click', () => {
      state.mood = state.mood.filter(x => x.id !== el.dataset.delMood);
      saveState();
      renderMood();
      toast('已删除');
    });
  });
}

// ===== 渲染：每周复盘 =====
function renderReview() {
  const sel = $('#reviewWeek');
  const cur = sel.value;
  const wk = getWeekKey();
  const weeks = [...new Set([wk, ...state.review.map(r => r.week)])].sort().reverse();
  sel.innerHTML = weeks.map(w => `<option value="${w}">${w}</option>`).join('');
  if (cur && weeks.includes(cur)) sel.value = cur;

  const r = state.review.find(x => x.week === sel.value) || {};
  $('#reviewHighlight').value = r.highlight || '';
  $('#reviewProblem').value = r.problem || '';
  $('#reviewNext').value = r.next || '';

  const list = $('#reviewList');
  if (!state.review.length) {
    list.innerHTML = `<div class="empty"><span class="empty-icon">📝</span>暂无复盘</div>`;
    return;
  }
  list.innerHTML = [...state.review].sort((a,b) => b.week.localeCompare(a.week)).map(item => `
    <li>
      <div class="card-meta">
        <div class="card-title">📅 ${escapeHtml(item.week)}</div>
        <div class="card-sub"><span class="tag accent">亮点 ${escapeHtml((item.highlight || '').slice(0, 20))}</span></div>
      </div>
      <button class="del-btn" data-del-rev="${item.id}">删除</button>
    </li>
  `).join('');
  list.querySelectorAll('[data-del-rev]').forEach(el => {
    el.addEventListener('click', () => {
      state.review = state.review.filter(x => x.id !== el.dataset.delRev);
      saveState();
      renderReview();
      toast('已删除');
    });
  });
}

// ===== 一键渲染 =====
function renderAll() {
  renderModuleGrid();
  renderStats();
  renderPlan();
  renderEnglish();
  renderSpanish();
  renderVideo();
  renderPsai();
  renderSport();
  renderBook();
  renderMovie();
  renderResource();
  renderReport();
  renderMood();
  renderReview();
}

// ===== 事件绑定 =====
function bindEvents() {
  // 侧边栏
  const sb = $('#sidebar'), mask = $('#mask');
  $('#openSidebar').addEventListener('click', () => { sb.classList.add('open'); mask.classList.add('open'); });
  mask.addEventListener('click', () => { sb.classList.remove('open'); mask.classList.remove('open'); });

  // 侧边栏导航
  const sbNav = $('#sidebarNav');
  sbNav.innerHTML = modules.map(m => `
    <div class="sb-nav-item" data-nav="${m.id}">
      <span class="nav-icon">${m.icon}</span>
      <span>${m.name}</span>
    </div>
  `).join('');
  sbNav.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      sb.classList.remove('open'); mask.classList.remove('open');
      scrollToPanel(el.dataset.nav);
    });
  });

  // FAB
  $('#fab').addEventListener('click', () => {
    sb.classList.add('open');
    mask.classList.add('open');
  });

  // 每日计划
  const addPlan = () => {
    const v = $('#planInput').value.trim();
    if (!v) return;
    state.plan.push({ id: uid(), text: v, done: false, date: today() });
    $('#planInput').value = '';
    saveState(); renderAll();
    toast('✓ 已添加');
  };
  $('#addPlanBtn').addEventListener('click', addPlan);
  $('#planInput').addEventListener('keypress', e => { if (e.key === 'Enter') addPlan(); });

  // 英语
  const addEng = () => {
    const w = $('#engInput').value.trim();
    const m = $('#engMeaning').value.trim();
    if (!w) return;
    state.english.push({ id: uid(), word: w, meaning: m, date: today() });
    $('#engInput').value = ''; $('#engMeaning').value = '';
    saveState(); renderEnglish(); renderModuleGrid();
    toast('✓ 已添加');
  };
  $('#addEngBtn').addEventListener('click', addEng);

  // 西语
  const addSp = () => {
    const w = $('#spInput').value.trim();
    const m = $('#spMeaning').value.trim();
    if (!w) return;
    state.spanish.push({ id: uid(), word: w, meaning: m, date: today() });
    $('#spInput').value = ''; $('#spMeaning').value = '';
    saveState(); renderSpanish(); renderModuleGrid();
    toast('✓ 已添加');
  };
  $('#addSpBtn').addEventListener('click', addSp);

  // 剪辑
  $('#addVidBtn').addEventListener('click', () => {
    const t = $('#vidTitle').value.trim();
    if (!t) return;
    state.video.push({ id: uid(), title: t, status: $('#vidStatus').value, date: today() });
    $('#vidTitle').value = '';
    saveState(); renderVideo(); renderModuleGrid();
    toast('✓ 已添加');
  });

  // PS AI
  $('#addPsBtn').addEventListener('click', () => {
    const t = $('#psTitle').value.trim();
    if (!t) return;
    state.psai.push({ id: uid(), title: t, status: $('#psStatus').value, date: today() });
    $('#psTitle').value = '';
    saveState(); renderPsai(); renderModuleGrid();
    toast('✓ 已添加');
  });

  // 运动
  $('#addSportBtn').addEventListener('click', () => {
    const t = $('#sportInput').value.trim();
    if (!t) return;
    state.sport.push({ id: uid(), text: t, status: $('#sportStatus').value, date: today() });
    $('#sportInput').value = '';
    saveState(); renderSport(); renderModuleGrid();
    toast('✓ 已添加');
  });

  // 打卡
  $('#checkinBtn').addEventListener('click', () => {
    const t = today();
    if (state.checkin.days.includes(t)) {
      toast('今日已打卡');
      return;
    }
    state.checkin.days.push(t);
    // 计算连续天数
    state.checkin.streak = calculateStreak(state.checkin.days);
    state.checkin.lastDate = t;
    saveState(); renderStats(); renderSport(); renderModuleGrid();
    toast('🎉 打卡成功！');
  });

  // 读书
  $('#addBookBtn').addEventListener('click', () => {
    const t = $('#bookInput').value.trim();
    if (!t) return;
    state.book.push({ id: uid(), title: t, author: $('#bookAuthor').value.trim(), status: '在读', date: today() });
    $('#bookInput').value = ''; $('#bookAuthor').value = '';
    saveState(); renderBook(); renderModuleGrid();
    toast('✓ 已添加');
  });

  // 电影
  $('#addMvBtn').addEventListener('click', () => {
    const t = $('#mvInput').value.trim();
    if (!t) return;
    state.movie.push({ id: uid(), title: t, type: $('#mvType').value, status: $('#mvStatus').value, date: today() });
    $('#mvInput').value = '';
    saveState(); renderMovie(); renderModuleGrid();
    toast('✓ 已添加');
  });

  // 资源
  $('#addResBtn').addEventListener('click', () => {
    const t = $('#resTitle').value.trim();
    if (!t) return;
    state.resource.push({ id: uid(), title: t, link: $('#resLink').value.trim(), category: $('#resCategory').value, date: today() });
    $('#resTitle').value = ''; $('#resLink').value = '';
    saveState(); renderResource(); renderModuleGrid();
    toast('✓ 已添加');
  });

  // 汇报
  $('#saveReportBtn').addEventListener('click', () => {
    const text = $('#reportText').value.trim();
    const date = $('#reportDate').value || today();
    if (!text) { toast('请先写点什么'); return; }
    const exist = state.report.find(r => r.date === date);
    if (exist) {
      exist.text = text;
    } else {
      state.report.push({ id: uid(), text, date });
    }
    saveState(); renderReport(); renderModuleGrid();
    toast('✓ 已保存');
  });
  $('#reportDate').addEventListener('change', renderReport);

  // 心情
  $$('#moodPicker span').forEach(el => {
    el.addEventListener('click', () => {
      currentMood = el.dataset.mood;
      $$('#moodPicker span').forEach(s => s.classList.remove('active'));
      el.classList.add('active');
    });
  });
  $('#saveMoodBtn').addEventListener('click', () => {
    const text = $('#moodText').value.trim();
    if (!text) { toast('写点什么吧'); return; }
    state.mood.push({ id: uid(), mood: currentMood, text, date: today() });
    $('#moodText').value = '';
    saveState(); renderMood(); renderModuleGrid();
    toast('✓ 心情已记录');
  });

  // 复盘
  $('#reviewWeek').addEventListener('change', renderReview);
  $('#newReviewBtn').addEventListener('click', () => {
    $('#reviewWeek').value = getWeekKey();
    $('#reviewHighlight').focus();
    scrollToPanel('review');
  });
  $('#saveReviewBtn').addEventListener('click', () => {
    const week = $('#reviewWeek').value;
    const highlight = $('#reviewHighlight').value.trim();
    const problem = $('#reviewProblem').value.trim();
    const next = $('#reviewNext').value.trim();
    if (!highlight && !problem && !next) { toast('至少写一项吧'); return; }
    const exist = state.review.find(r => r.week === week);
    if (exist) {
      exist.highlight = highlight;
      exist.problem = problem;
      exist.next = next;
      exist.date = today();
    } else {
      state.review.push({ id: uid(), week, highlight, problem, next, date: today() });
    }
    saveState(); renderReview(); renderModuleGrid();
    toast('✓ 复盘已保存');
  });

  // 数据导出
  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fairy_backup_${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('✓ 数据已导出');
    sb.classList.remove('open'); mask.classList.remove('open');
  });

  // 数据导入
  $('#importBtn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (confirm('导入将覆盖当前数据，确定吗？')) {
            state = { ...structuredClone(defaultData), ...data };
            saveState();
            renderAll();
            toast('✓ 导入成功');
            sb.classList.remove('open'); mask.classList.remove('open');
          }
        } catch (err) {
          toast('文件格式错误');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  // 清空
  $('#clearBtn').addEventListener('click', () => {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      state = structuredClone(defaultData);
      saveState();
      renderAll();
      toast('已清空');
      sb.classList.remove('open'); mask.classList.remove('open');
    }
  });
}

// 计算连续打卡天数
function calculateStreak(days) {
  if (!days.length) return 0;
  const sorted = [...new Set(days)].sort().reverse();
  const todayD = new Date(today());
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i]);
    const diff = Math.floor((todayD - d) / (24 * 60 * 60 * 1000));
    if (diff === i || (i === 0 && diff <= 1)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  // 默认选中第一个心情
  $('#moodPicker span[data-mood="😊"]').classList.add('active');
  renderAll();
});