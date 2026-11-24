(function () {
  'use strict';
  var MAX = 1500, MAXLOC = 200, LS = 'collection-register-v1';
  var $ = function (s) { return document.querySelector(s); };
  var list = $('#list'), tpl = $('#rowT'), st = $('#status'), locMenu = $('#locMenu');
  var ST = {
    loading: '讀取中…', saving: '儲存中…', saved: '已儲存', local: '僅存在這個瀏覽器',
    error: '未能儲存，請稍後再試', stale: '尚未連上儲存空間，內容可能不是最新'
  };
  var rows = [], locs = [], prefs = { inc: false }, ready = false, docRef = null;
  var dirty = false, writing = false, saveTimer = 0, retries = 0, savePromise = null;
  var undoSnap = null, toastTimer = 0, armTimer = 0, loadTimer = 0;
  var menuFor = null, menuFilter = false, menuAct = -1;

  var uid = function () { return Math.random().toString(36).slice(2, 9); };
  var clone = function (a) { return a.map(function (r) { return { id: r.id, title: r.title, loc: r.loc, sn: r.sn, ex: !!r.ex }; }); };
  var idxOf = function (id) { for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return i; return -1; };
  var rowEl = function (id) { var c = list.children; for (var i = 0; i < c.length; i++) if (c[i].dataset.id === id) return c[i]; return null; };
  var sig = function (a) { return JSON.stringify(a.map(function (r) { return [r.id, r.title, r.loc, r.sn, !!r.ex]; })); };

  function say(t) { $('#sr').textContent = t; }
  function setStatus(k) { st.dataset.s = k; st.querySelector('.t').textContent = ST[k]; }

  function normalize(d) {
    var arr = d && Array.isArray(d.rows) ? d.rows : [];
    var seen = {}, out = [];
    for (var i = 0; i < arr.length && out.length < MAX; i++) {
      var x = arr[i];
      if (!x || typeof x !== 'object') continue;
      var id = typeof x.id === 'string' && x.id && !seen[x.id] ? x.id.slice(0, 40) : uid();
      seen[id] = 1;
      out.push({
        id: id,
        title: String(x.title == null ? '' : x.title).slice(0, 300),
        loc: String(x.loc == null ? '' : x.loc).slice(0, 200),
        sn: String(x.sn == null ? '' : x.sn).slice(0, 100),
        ex: !!x.ex
      });
    }
    var ls = [], lseen = {}, la = d && Array.isArray(d.locs) ? d.locs : [];
    for (var j = 0; j < la.length && ls.length < MAXLOC; j++) {
      var v = typeof la[j] === 'string' ? la[j].trim().slice(0, 200) : '';
      if (v && !lseen[v]) { lseen[v] = 1; ls.push(v); }
    }
    return { rows: out, inc: !!(d && d.inc), locs: ls };
  }
  function adopt(n) { rows = n.rows; locs = n.locs; prefs.inc = n.inc; $('#inc').checked = prefs.inc; }

  /* ---------- storage ---------- */
  function lsGet() { try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { return null; } }
  function lsSet(p) { localStorage.setItem(LS, JSON.stringify(p)); }
  function payload() { return { rows: clone(rows), locs: locs.slice(), inc: prefs.inc, updatedAt: new Date().toISOString() }; }

  function markDirty() {
    dirty = true; retries = 0; setStatus('saving');
    clearTimeout(saveTimer); saveTimer = setTimeout(flush, 600);
  }
  function flush() {
    if (writing) return savePromise.then(function (ok) { return ok && dirty ? flush() : ok; });
    if (!dirty) return Promise.resolve(true);
    writing = true; dirty = false;
    savePromise = (async function () {
      var ok = true;
      try { if (docRef) await docRef.set(payload()); else lsSet(payload()); } catch (e) { ok = false; }
      writing = false;
      if (!ok) {
        dirty = true; setStatus('error');
        if (retries++ < 2) saveTimer = setTimeout(flush, 5000);
        return false;
      }
      if (dirty) return flush();
      setStatus(docRef ? 'saved' : 'local');
      return true;
    })();
    return savePromise;
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && dirty) flush(); });
  window.addEventListener('pagehide', function () { if (dirty) flush(); });

  /* ---------- render ---------- */
  function updateCount() {
    var seen = {}, n = 0;
    rows.forEach(function (r) { var v = r.loc.trim(); if (v && !seen[v]) { seen[v] = 1; n++; } });
    $('#count').textContent = !ready ? '讀取中…' : rows.length ? rows.length + ' 筆 · ' + n + ' 個地點' : '尚無資料';
  }
  function renumber() {
    var items = list.children;
    for (var i = 0; i < items.length; i++) {
      var li = items[i], n = i + 1;
      li.querySelector('.n').textContent = String(n).padStart(2, '0');
      li.querySelector('.handle').setAttribute('aria-label', '拖曳排序：第 ' + n + ' 列');
      li.querySelector('[data-k="title"]').setAttribute('aria-label', '第 ' + n + ' 列 書名');
      li.querySelector('[data-k="loc"]').setAttribute('aria-label', '第 ' + n + ' 列 館藏地點');
      li.querySelector('[data-k="sn"]').setAttribute('aria-label', '第 ' + n + ' 列 序號');
      li.querySelector('.chev').setAttribute('aria-label', '開啟第 ' + n + ' 列的地點清單');
      li.querySelector('[data-act="dup"]').setAttribute('aria-label', '複製第 ' + n + ' 列');
      li.querySelector('[data-act="del"]').setAttribute('aria-label', '刪除第 ' + n + ' 列');
    }
  }
  function applyFocus(f) {
    if (!f) return;
    if (f.field === 'add') { $('#add').focus(); return; }
    var li = rowEl(f.id); if (!li) return;
    var el = f.field === 'handle' ? li.querySelector('.handle') : li.querySelector('[data-k="' + f.field + '"]');
    if (!el) return;
    el.focus({ preventScroll: f.field === 'handle' });
    if (f.select && el.select) el.select();
    if (f.s != null && el.setSelectionRange) { try { el.setSelectionRange(f.s, f.e); } catch (e) {} }
    if (f.flash) { li.classList.add('new'); setTimeout(function () { li.classList.remove('new'); }, 1000); }
  }
  function render(focus) {
    closeMenu();
    var a = document.activeElement, keep = null;
    if (!focus && a && list.contains(a)) {
      var cur = a.closest('.row');
      keep = { id: cur.dataset.id, field: a.classList.contains('handle') ? 'handle' : (a.dataset.k || null), s: a.selectionStart, e: a.selectionEnd };
    }
    var frag = document.createDocumentFragment();
    rows.forEach(function (r) {
      var li = tpl.content.firstElementChild.cloneNode(true);
      li.dataset.id = r.id;
      ['title', 'loc', 'sn'].forEach(function (k) {
        var inp = li.querySelector('[data-k="' + k + '"]');
        inp.value = r[k]; inp.id = k + '-' + r.id;
        inp.parentNode.querySelector('.lbl').htmlFor = inp.id;
      });
      li.querySelector('.tag').hidden = !r.ex;
      frag.appendChild(li);
    });
    list.replaceChildren(frag);
    renumber(); updateCount();
    var has = rows.length > 0;
    $('#empty').hidden = has; $('#head').hidden = !has; $('#hint').hidden = !has;
    if (focus) applyFocus(focus); else if (keep && keep.field) applyFocus(keep);
  }

  /* ---------- location dropdown ---------- */
  function navItems() { return locMenu.querySelectorAll('.pick, .addloc'); }
  function buildMenu() {
    var typed = menuFor.value.trim(), q = menuFilter ? typed.toLowerCase() : '';
    var items = locs.filter(function (v) { return !q || v.toLowerCase().indexOf(q) >= 0; });
    var addable = typed && locs.indexOf(typed) < 0 && locs.length < MAXLOC;
    locMenu.replaceChildren();
    items.forEach(function (v) {
      var d = document.createElement('div'); d.className = 'mi';
      var b = document.createElement('li-button'); b.type = 'button'; b.className = 'pick'; b.setAttribute('role', 'option');
      b.dataset.v = v; b.textContent = v; if (v === typed) b.classList.add('cur');
      var x = document.createElement('li-button'); x.type = 'button'; x.className = 'rm'; x.dataset.rm = v;
      x.setAttribute('aria-label', '從清單移除 ' + v); x.title = '從清單移除'; x.textContent = '×';
      d.appendChild(b); d.appendChild(x); locMenu.appendChild(d);
    });
    if (!items.length && !addable) {
      var n = document.createElement('div'); n.className = 'none';
      n.textContent = locs.length ? '沒有符合的地點' : '清單還是空的。在欄位輸入地點後，可以加入清單。';
      locMenu.appendChild(n);
    }
    if (addable) {
      var ad = document.createElement('li-button'); ad.type = 'button'; ad.className = 'addloc';
      ad.textContent = '＋ 將「' + typed + '」加入清單'; locMenu.appendChild(ad);
    }
    menuAct = -1;
    return items.length > 0 || !!addable;
  }
  function positionMenu() {
    if (!menuFor) return;
    var r = menuFor.getBoundingClientRect(), vh = window.innerHeight;
    var below = vh - r.bottom - 12, above = r.top - 12, s = locMenu.style;
    s.left = r.left + 'px'; s.width = r.width + 'px';
    if (below < 200 && above > below) { s.top = 'auto'; s.bottom = (vh - r.top + 4) + 'px'; s.maxHeight = Math.min(280, above) + 'px'; }
    else { s.bottom = 'auto'; s.top = (r.bottom + 4) + 'px'; s.maxHeight = Math.min(280, Math.max(below, 120)) + 'px'; }
  }
  function openMenu(inp, filter) {
    if (menuFor && menuFor !== inp) menuFor.setAttribute('aria-expanded', 'false');
    menuFor = inp; menuFilter = !!filter;
    var show = buildMenu();
    if (filter && !show) { closeMenu(); return; }
    positionMenu(); locMenu.hidden = false; inp.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    if (!menuFor) return;
    menuFor.setAttribute('aria-expanded', 'false');
    menuFor = null; locMenu.hidden = true;
  }
  function stepMenu(d) {
    var items = navItems(); if (!items.length) return;
    if (menuAct < 0) menuAct = d > 0 ? 0 : items.length - 1; else menuAct = (menuAct + d + items.length) % items.length;
    for (var i = 0; i < items.length; i++) items[i].classList.toggle('on', i === menuAct);
    items[menuAct].scrollIntoView({ block: 'nearest' });
  }
  function pickLoc(v) {
    var inp = menuFor; if (!inp) return;
    var li = inp.closest('.row'), r = rows[idxOf(li.dataset.id)];
    closeMenu(); if (!r) return;
    inp.value = v; r.loc = v;
    if (r.ex) { r.ex = false; li.querySelector('.tag').hidden = true; }
    markDirty(); updateCount();
    li.querySelector('[data-k="sn"]').focus();
  }
  function addLoc(v) {
    v = v.trim(); if (!v) return;
    if (locs.indexOf(v) < 0) {
      if (locs.length >= MAXLOC) { toast('地點清單最多 ' + MAXLOC + ' 筆'); return; }
      locs.push(v);
    }
    markDirty(); closeMenu(); toast('已加入地點清單');
  }
  locMenu.addEventListener('mousedown', function (e) { e.preventDefault(); });
  locMenu.addEventListener('click', function (e) {
    if (!menuFor) return;
    var rm = e.target.closest('[data-rm]'), pk = e.target.closest('.pick'), ad = e.target.closest('.addloc');
    if (rm) {
      var v = rm.dataset.rm;
      locs = locs.filter(function (x) { return x !== v; });
      markDirty(); buildMenu(); positionMenu(); say('已從清單移除 ' + v);
    } else if (pk) pickLoc(pk.dataset.v);
    else if (ad) addLoc(menuFor.value);
  });
  document.addEventListener('pointerdown', function (e) {
    if (!menuFor) return;
    if (locMenu.contains(e.target) || e.target === menuFor || e.target.closest('.chev')) return;
    closeMenu();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('scroll', function (e) { if (menuFor && !locMenu.contains(e.target)) closeMenu(); }, true);
  window.addEventListener('resize', closeMenu);

  /* ---------- row actions ---------- */
  function addRow() {
    if (rows.length >= MAX) { toast('最多可登記 ' + MAX + ' 列'); return; }
    var n = { id: uid(), title: '', loc: '', sn: '', ex: false };
    rows.push(n);
    render({ id: n.id, field: 'title', flash: true }); markDirty();
  }
  function bump(s) {
    var m = String(s).match(/^([\s\S]*?)(\d+)(\D*)$/);
    if (!m) return s;
    return m[1] + (BigInt(m[2]) + 1n).toString().padStart(m[2].length, '0') + m[3];
  }
  function dup(id) {
    var i = idxOf(id);
    if (i < 0) return;
    if (rows.length >= MAX) { toast('最多可登記 ' + MAX + ' 列'); return; }
    var s = rows[i], n = { id: uid(), title: s.title, loc: s.loc, sn: prefs.inc ? bump(s.sn) : s.sn, ex: false };
    rows.splice(i + 1, 0, n);
    render({ id: n.id, field: 'sn', select: true, flash: true }); markDirty();
    say('已複製第 ' + (i + 1) + ' 列');
  }
  function del(id) {
    var i = idxOf(id);
    if (i < 0) return;
    var snap = clone(rows);
    rows.splice(i, 1);
    var nb = rows[i] || rows[i - 1];
    render(nb ? { id: nb.id, field: 'handle' } : { field: 'add' }); markDirty();
    toast('已刪除第 ' + (i + 1) + ' 列', snap);
  }
  function move(from, to) {
    var r = rows.splice(from, 1)[0];
    rows.splice(to, 0, r);
    render({ id: r.id, field: 'handle' }); markDirty();
    say('第 ' + (from + 1) + ' 列移到第 ' + (to + 1) + ' 位');
  }

  list.addEventListener('click', function (e) {
    var c = e.target.closest('.chev');
    if (c) {
      var inp = c.parentNode.querySelector('input');
      if (menuFor === inp) closeMenu(); else openMenu(inp, false);
      return;
    }
    var b = e.target.closest('li-button[data-act]');
    if (!b) return;
    var id = b.closest('.row').dataset.id;
    if (b.dataset.act === 'dup') dup(id); else del(id);
  });
  list.addEventListener('input', function (e) {
    var inp = e.target;
    if (!inp.matches('input[data-k]')) return;
    var li = inp.closest('.row'), r = rows[idxOf(li.dataset.id)];
    if (!r) return;
    r[inp.dataset.k] = inp.value;
    if (r.ex) { r.ex = false; li.querySelector('.tag').hidden = true; }
    if (inp.dataset.k === 'loc' && !e.isComposing) openMenu(inp, true);
    markDirty();
  });
  list.addEventListener('compositionend', function (e) {
    if (e.target.matches('input[data-k="loc"]')) openMenu(e.target, true);
  });
  list.addEventListener('change', function (e) { if (e.target.matches('input[data-k="loc"]')) updateCount(); });
  list.addEventListener('keydown', function (e) {
    var li = e.target.closest('.row');
    if (!li) return;
    var i = idxOf(li.dataset.id);
    if (e.target.matches('input')) {
      if (e.isComposing || e.keyCode === 229) return;
      var k = e.target.dataset.k;
      if (k === 'loc') {
        if (e.key === 'Tab') closeMenu();
        if (menuFor === e.target) {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); stepMenu(e.key === 'ArrowDown' ? 1 : -1); return; }
          if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
          if (e.key === 'Enter' && menuAct >= 0) { e.preventDefault(); navItems()[menuAct].click(); return; }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault(); openMenu(e.target, false); stepMenu(1); return;
        }
      }
      if (e.key !== 'Enter') return;
      e.preventDefault(); closeMenu();
      if (k === 'title') li.querySelector('[data-k="loc"]').focus();
      else if (k === 'loc') li.querySelector('[data-k="sn"]').focus();
      else if (rows[i + 1]) applyFocus({ id: rows[i + 1].id, field: 'title' });
      else addRow();
    } else if (e.target.classList.contains('handle')) {
      if (e.key === 'ArrowUp' && i > 0) { e.preventDefault(); move(i, i - 1); }
      else if (e.key === 'ArrowDown' && i < rows.length - 1) { e.preventDefault(); move(i, i + 1); }
    }
  });

  /* ---------- drag to reorder (mouse, pen, touch) ---------- */
  var drag = null;
  list.addEventListener('pointerdown', function (e) {
    var h = e.target.closest('.handle');
    if (!h || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    closeMenu();
    var items = Array.prototype.slice.call(list.children), li = h.closest('.row');
    var from = items.indexOf(li);
    var rects = items.map(function (x) { return x.getBoundingClientRect(); });
    var gap = parseFloat(getComputedStyle(list).rowGap) || 0;
    e.preventDefault();
    drag = {
      li: li, items: items, from: from, to: from, step: rects[from].height + gap,
      startY: e.clientY, y: e.clientY, startScroll: window.scrollY, pid: e.pointerId, raf: 0,
      minDy: rects[0].top - rects[from].top, maxDy: rects[items.length - 1].top - rects[from].top
    };
    li.classList.add('dragging');
    document.body.classList.add('is-dragging');
    drag.raf = requestAnimationFrame(autoscroll);
  });
  function updateDrag() {
    var d = drag; if (!d) return;
    var dy = (d.y - d.startY) + (window.scrollY - d.startScroll);
    dy = Math.max(d.minDy, Math.min(d.maxDy, dy));
    d.li.style.transform = 'translateY(' + dy + 'px)';
    var to = Math.max(0, Math.min(d.items.length - 1, Math.round(d.from + dy / d.step)));
    d.to = to;
    d.items.forEach(function (el, k) {
      if (k === d.from) return;
      var s = 0;
      if (d.from < to && k > d.from && k <= to) s = -d.step;
      else if (d.from > to && k < d.from && k >= to) s = d.step;
      el.style.transform = s ? 'translateY(' + s + 'px)' : '';
    });
  }
  function autoscroll() {
    var d = drag; if (!d) return;
    var vh = window.innerHeight;
    if (d.y < 70) window.scrollBy(0, -Math.ceil((70 - d.y) / 5));
    else if (d.y > vh - 70) window.scrollBy(0, Math.ceil((d.y - (vh - 70)) / 5));
    updateDrag();
    d.raf = requestAnimationFrame(autoscroll);
  }
  function endDrag(commit) {
    var d = drag; if (!d) return;
    drag = null; cancelAnimationFrame(d.raf);
    document.body.classList.remove('is-dragging');
    d.items.forEach(function (el) { el.style.transform = ''; });
    d.li.classList.remove('dragging');
    if (commit && d.to !== d.from) move(d.from, d.to);
  }
  window.addEventListener('pointermove', function (e) { if (drag && e.pointerId === drag.pid) { drag.y = e.clientY; updateDrag(); } });
  window.addEventListener('pointerup', function (e) { if (drag && e.pointerId === drag.pid) endDrag(true); });
  window.addEventListener('pointercancel', function (e) { if (drag && e.pointerId === drag.pid) endDrag(false); });

  /* ---------- toolbar ---------- */
  $('#save').addEventListener('click', async function () {
    if (!ready) return;
    var button = $('#save');
    button.disabled = true; button.textContent = '儲存中…';
    clearTimeout(saveTimer);
    dirty = true; retries = 0; setStatus('saving');
    try {
      var ok = await flush();
      toast(ok ? (docRef ? '已儲存館藏資料' : '已儲存到這個瀏覽器，重新開啟頁面後仍會保留') : '儲存失敗，請再試一次');
    } finally {
      button.disabled = false; button.textContent = '儲存';
    }
  });
  $('#add').addEventListener('click', addRow);
  $('#addFirst').addEventListener('click', addRow);
  $('#inc').addEventListener('change', function (e) { prefs.inc = e.target.checked; markDirty(); });

  $('#copyAll').addEventListener('click', async function () {
    var clean = function (s) { return s.replace(/[\t\r\n]+/g, ' '); };
    var lines = rows.filter(function (r) { return r.title || r.loc || r.sn; })
      .map(function (r) { return clean(r.title) + '\t' + clean(r.loc) + '\t' + clean(r.sn); });
    if (!lines.length) { toast('沒有可複製的內容'); return; }
    var text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast('已複製 ' + lines.length + ' 列，可直接貼到 Excel');
    } catch (e) {
      var box = $('#exportBox'), ta = $('#exportText');
      ta.value = text; box.hidden = false; ta.focus(); ta.select();
    }
  });
  $('#exportClose').addEventListener('click', function () { $('#exportBox').hidden = true; $('#copyAll').focus(); });

  var clearBtn = $('#clear');
  function disarm() { clearTimeout(armTimer); clearBtn.classList.remove('armed'); clearBtn.textContent = '全部清空'; }
  clearBtn.addEventListener('click', function () {
    if (!rows.length) return;
    if (!clearBtn.classList.contains('armed')) {
      clearBtn.classList.add('armed'); clearBtn.textContent = '再按一次清空全部';
      armTimer = setTimeout(disarm, 4000); return;
    }
    disarm();
    var snap = clone(rows);
    rows = []; render({ field: 'add' }); markDirty();
    toast('已清空 ' + snap.length + ' 列', snap);
  });

  /* ---------- toast with undo ---------- */
  function toast(msg, snap) {
    var t = $('#toast'), u = t.querySelector('.undo');
    t.querySelector('.msg').textContent = msg;
    undoSnap = snap || null; u.hidden = !snap;
    t.classList.add('show'); say(msg);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); undoSnap = null; }, snap ? 7000 : 2600);
  }
  $('#toast .undo').addEventListener('click', function () {
    if (!undoSnap) return;
    rows = clone(undoSnap); undoSnap = null;
    $('#toast').classList.remove('show');
    render(); markDirty(); say('已復原');
  });

  /* ---------- load ---------- */
  function becomeReady() {
    if (ready) return;
    ready = true;
    ['#add', '#save', '#copyAll', '#clear'].forEach(function (s) { $(s).disabled = false; });
    $('#emptyLoading').hidden = true; $('#emptyReady').hidden = false;
    render();
  }
  function onSnap(snap) {
    var definitive = !snap.metadata.fromCache;
    if (snap.exists) {
      var own = dirty || writing || snap.metadata.hasPendingWrites;
      if (!ready) {
        adopt(normalize(snap.data()));
        becomeReady();
      } else if (!own) {
        var n = normalize(snap.data());
        if (sig(n.rows) !== sig(rows) || n.inc !== prefs.inc || JSON.stringify(n.locs) !== JSON.stringify(locs)) {
          adopt(n); render();
        }
      }
    } else if (definitive) {
      becomeReady();
    }
    if (definitive) {
      clearTimeout(loadTimer);
      if (!dirty && !writing) setStatus('saved');
    }
  }
  (async function init() {
    setStatus('loading');
    var db = null;
    try { db = window.claude && window.claude.use ? await window.claude.use('db') : null; } catch (e) { db = null; }
    if (!db) {
      var d = lsGet();
      if (d) adopt(normalize(d));
      becomeReady(); setStatus('local'); return;
    }
    docRef = db.doc('lists/main');
    loadTimer = setTimeout(function () { setStatus('stale'); becomeReady(); }, 10000);
    docRef.onSnapshot(onSnap, function () { clearTimeout(loadTimer); setStatus('stale'); becomeReady(); });
  })();
  render();
})();
