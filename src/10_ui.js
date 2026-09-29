// ---------------------------------------------------------------- build panel: controls + presets (labels are [English, Hebrew])
const tfx = (cm) => `${cm} ${tt('cm', 'ס״מ')}<small>${toT(cm).toFixed(1)} ${tt('tef.', 'טפחים')}</small>`;
const CONTROLS = [
  [['Measure & moment', 'שיעור וזמן'], [
    { key: 'shiur', label: ['Shiur', 'שיעור'], type: 'seg', opts: [['naeh', ['R’ Chaim Na’eh', 'ר׳ חיים נאה']], ['ci', ['Chazon Ish', 'חזון איש']]] },
    { key: 'day', label: ['Day', 'יום'], type: 'seg', opts: [['first', ['Yom Tov', 'יום טוב']], ['cholhamoed', ['Chol HaMoed', 'חול המועד']]] },
    { key: 'hour', label: ['Time', 'שעה'], type: 'range', min: 6, max: 23.5, step: 0.05, fmt: (v) => clockText(v) },
  ]],
  [['The sea', 'הים'], [
    { key: 'boat', label: ['Ship', 'ספינה'], type: 'seg', opts: [['anchored', ['Anchored', 'עוגנת']], ['sailing', ['Sailing', 'מפליגה']]] },
    { key: 'wind', label: ['Wind', 'רוח'], type: 'range', min: 0, max: 70, step: 1, fmt: (v) => `${v} ${tt('km/h', 'קמ״ש')}<small>${v < 12 ? tt('calm', 'רגועה') : v < 30 ? tt('breeze', 'בריזה') : v < 45 ? tt('strong', 'חזקה') : tt('gale', 'סערה')}</small>` },
    { key: 'rain', label: ['Rain', 'גשם'], type: 'range', min: 0, max: 100, step: 1, fmt: (v) => `${v}%<small>${v === 0 ? tt('dry', 'יבש') : v < 35 ? tt('drizzle', 'טפטוף') : tt('spoils food', 'מקלקל תבשיל')}</small>` },
    { key: 'seasick', label: ['You feel', 'מרגישים'], type: 'check', text: ['Seasick', 'מחלת ים'] },
  ]],
  [['The vehicle', 'הרכב'], [
    { key: 'vehicle', label: ['Built on', 'בנויה על'], type: 'seg', opts: [['pickup', ['Pickup bed', 'ארגז טנדר']], ['sedan', ['Car roof', 'גג מכונית']], ['deck', ['Deck', 'הסיפון']]] },
    { key: 'strapped', label: ['Frame', 'שלד'], type: 'check', text: ['Strapped down', 'קשור ברצועות'] },
    { key: 'driving', label: ['Car', 'רכב'], type: 'check', text: ['Driving it around', 'נוהגים בו'] },
  ]],
  [['Size (inside)', 'מידות (פנים)'], [
    { key: 'w', label: ['Width', 'רוחב'], type: 'range', min: 40, max: 300, step: 1, fmt: tfx },
    { key: 'd', label: ['Length', 'אורך'], type: 'range', min: 40, max: 320, step: 1, fmt: tfx },
    { key: 'h', label: ['Height', 'גובה'], type: 'range', min: 50, max: 300, step: 1, fmt: tfx },
  ]],
  [['Walls', 'דפנות'], [
    { key: 'walls', label: ['How many', 'כמה'], type: 'seg', opts: [['4', '4'], ['3', '3'], ['2t', ['2 + tefach', '2 + טפח']], ['2', '2']] },
    { key: 'wallType', label: ['Made of', 'עשויות'], type: 'seg', opts: [['canvas', ['Canvas', 'בד']], ['sheet', ['Bedsheets', 'סדינים']], ['wood', ['Plywood', 'דיקט']]] },
    { key: 'tied', label: ['Fabric', 'הבד'], type: 'check', text: ['Tied tight on all sides', 'קשור היטב מכל הצדדים'] },
    { key: 'wallH', label: ['Wall height', 'גובה דופן'], type: 'range', min: 20, max: 300, step: 1, fmt: tfx },
    { key: 'wallGap', label: ['Gap at bottom', 'רווח מלמטה'], type: 'range', min: 0, max: 60, step: 1, fmt: tfx },
  ]],
  [['Schach', 'סכך'], [
    { key: 'schach', label: ['Material', 'חומר'], type: 'select', opts: [['palm', ['Palm fronds', 'כפות תמרים']], ['bamboo', ['Bamboo poles', 'מקלות במבוק']], ['mats', ['Bamboo mats (for schach)', 'מחצלות (לשם סכך)']], ['branches', ['Evergreen branches', 'ענפי אורן']], ['boards', ['Narrow boards (8 cm)', 'נסרים צרים (8 ס״מ)']], ['wideboards', ['Wide boards (40 cm)', 'נסרים רחבים (40 ס״מ)']], ['tarp', ['Plastic tarp', 'יריעת ניילון']], ['metal', ['Metal sheet', 'פח']], ['corn', ['Corn cobs (food)', 'קלחי תירס (אוכל)']]] },
    { key: 'amount', label: ['How much', 'כמות'], type: 'range', min: 0, max: 100, step: 1, fmt: (v) => `${v}%<small>${tt('laid', 'מונח')}</small>` },
    { key: 'avir', label: ['Air gap', 'אויר'], type: 'range', min: 0, max: 80, step: 1, fmt: tfx },
    { key: 'supports', label: ['Resting on', 'מונח על'], type: 'seg', opts: [['wood', ['Wood beams', 'קורות עץ']], ['metal', ['Metal poles', 'צינורות מתכת']]] },
    { key: 'overhead', label: ['Above it', 'מעליה'], type: 'seg', opts: [['none', ['Open sky', 'שמים פתוחים']], ['awning', ['Awning', 'סוכך']], ['upper', ['Upper deck', 'סיפון עליון']]] },
  ]],
  [['How it was built', 'איך נבנתה'], [
    { key: 'order', label: ['Order', 'סדר'], type: 'seg', opts: [['walls', ['Walls first', 'דפנות קודם']], ['schach', ['Schach first', 'סכך קודם']]] },
    { key: 'old', label: ['Age', 'גיל'], type: 'check', text: ['Built over 30 days ago', 'נבנתה לפני יותר מ־30 יום'] },
    { key: 'renewed', label: '', type: 'check', text: ['Renewed a tefach of schach', 'חידשו טפח בסכך'] },
    { key: 'permission', label: ['Owner', 'בעלים'], type: 'check', text: ['Owner gave permission', 'הבעלים הרשו'] },
    { key: 'decor', label: ['Hiddur', 'נוי סוכה'], type: 'check', text: ['Lights, chains, pomegranates', 'אורות, שרשראות, רימונים'] },
  ]],
];
const PRESETS = [
  [['Chabad sukkah-mobile', 'סוכה ניידת של חב״ד'], { vehicle: 'pickup', w: 150, d: 175, h: 190, wallH: 185, wallGap: 4, walls: '4', wallType: 'canvas', tied: true, strapped: true, schach: 'palm', amount: 70, avir: 0, supports: 'wood', overhead: 'none', order: 'walls', old: false, permission: true, wind: 16, rain: 0, seasick: false, boat: 'anchored', driving: false, decor: true }],
  [['Tiny roof sukkah', 'סוכה זעירה על הגג'], { vehicle: 'sedan', w: 62, d: 70, h: 82, wallH: 82, wallGap: 2, walls: '3', wallType: 'wood', strapped: true, schach: 'bamboo', amount: 75, avir: 0, overhead: 'none', decor: false }],
  [['Rabbi Akiva’s ship', 'הספינה של רבי עקיבא'], { vehicle: 'deck', w: 200, d: 220, h: 180, wallH: 175, wallGap: 6, walls: '3', wallType: 'sheet', tied: false, strapped: false, schach: 'branches', amount: 80, boat: 'sailing', wind: 42, overhead: 'none' }, 'akiva'],
  [['Under the awning', 'מתחת לסוכך'], { vehicle: 'pickup', overhead: 'awning', w: 150, d: 175, h: 190, walls: '4', wallType: 'canvas', tied: true, strapped: true, schach: 'palm', amount: 70 }],
  [['Plastic tarp', 'יריעת ניילון'], { vehicle: 'pickup', schach: 'tarp', amount: 100, overhead: 'none' }],
  [['Two walls + tefach', 'שתיים ושלישית טפח'], { vehicle: 'pickup', walls: '2t', wallType: 'wood', schach: 'mats', amount: 100, overhead: 'none' }],
  [['Storm at sea', 'סערה בים'], { vehicle: 'pickup', wind: 58, rain: 60, seasick: true, boat: 'sailing', overhead: 'none', schach: 'palm', amount: 75, tied: true, strapped: true }],
  [['Gap in the schach', 'אויר בסכך'], { vehicle: 'pickup', schach: 'bamboo', amount: 85, avir: 40, overhead: 'none' }],
];
const REBUILD_KEYS = new Set(['vehicle', 'strapped', 'w', 'd', 'h', 'walls', 'wallType', 'wallH', 'wallGap', 'schach', 'amount', 'avir', 'supports', 'overhead', 'decor', 'shiur']);
let rebuildPending = false;
function onCfgChange(key) {
  if (key === 'wind' || key === 'boat') setSeaState(CFG.wind, CFG.boat === 'sailing');
  if (key === 'shiur') refreshTefachLabels();
  if (REBUILD_KEYS.has(key) && !rebuildPending) { rebuildPending = true; requestAnimationFrame(() => { rebuildPending = false; buildSukkah(); renderHalacha(); }); }
  else renderHalacha();
  store.set('cfg', JSON.stringify(CFG));
}
const CTRL_EL = {};
function buildControls() {
  const root = $('controls'); root.innerHTML = '';
  for (const [title, items] of CONTROLS) {
    const sec = document.createElement('div'); sec.className = 'sec'; sec.innerHTML = `<h2>${tr(title)}</h2>`; root.appendChild(sec);
    for (const c of items) {
      const row = document.createElement('div'); row.className = 'row';
      const lab = document.createElement('label'); lab.textContent = tr(c.label); row.appendChild(lab);
      let el;
      if (c.type === 'range') {
        el = document.createElement('div'); el.className = 'rng';
        const inp = document.createElement('input'); inp.type = 'range'; inp.min = c.min; inp.max = c.max; inp.step = c.step; inp.value = CFG[c.key];
        const out = document.createElement('output'); out.innerHTML = c.fmt(CFG[c.key]);
        inp.oninput = () => { CFG[c.key] = parseFloat(inp.value); out.innerHTML = c.fmt(CFG[c.key]); onCfgChange(c.key); };
        el.append(inp, out); CTRL_EL[c.key] = { set: (v) => { inp.value = v; out.innerHTML = c.fmt(v); }, refresh: () => { out.innerHTML = c.fmt(CFG[c.key]); } };
      } else if (c.type === 'seg') {
        el = document.createElement('div'); el.className = 'seg';
        const btns = c.opts.map(([v, t]) => { const b = document.createElement('button'); b.textContent = tr(t); b.onclick = () => { CFG[c.key] = v; btns.forEach((x) => x.classList.toggle('on', x === b)); onCfgChange(c.key); }; el.appendChild(b); return [v, b]; }).map(([v, b]) => { b.dataset.v = v; return b; });
        CTRL_EL[c.key] = { set: (v) => btns.forEach((b) => b.classList.toggle('on', b.dataset.v === String(v))) };
      } else if (c.type === 'select') {
        el = document.createElement('select'); for (const [v, t] of c.opts) { const o = document.createElement('option'); o.value = v; o.textContent = tr(t); el.appendChild(o); }
        el.onchange = () => { CFG[c.key] = el.value; onCfgChange(c.key); };
        CTRL_EL[c.key] = { set: (v) => { el.value = v; } };
      } else {
        el = document.createElement('label'); el.className = 'tog';
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = CFG[c.key];
        cb.onchange = () => { CFG[c.key] = cb.checked; onCfgChange(c.key); };
        el.append(cb, document.createTextNode(tr(c.text))); CTRL_EL[c.key] = { set: (v) => { cb.checked = !!v; } };
      }
      row.appendChild(el); sec.appendChild(row);
      CTRL_EL[c.key].set(CFG[c.key]);
    }
  }
  const pr = $('presets'); pr.innerHTML = '';
  for (const [name, p, tag] of PRESETS) {
    const b = document.createElement('button'); b.textContent = tr(name);
    b.onclick = () => { applyPreset(p); if (tag === 'akiva') $('story').hidden = false; };
    pr.appendChild(b);
  }
  // rule filters
  for (const b of $('filters').children) b.onclick = () => { RULE_FILTER = b.dataset.f; [...$('filters').children].forEach((x) => x.classList.toggle('on', x === b)); renderHalacha(); };
  // mobile tabs
  for (const b of document.querySelectorAll('.mtabs button')) b.onclick = () => showSheet(b.dataset.p);
  $('vchip').onclick = () => showSheet(document.body.dataset.sheet === 'check' ? 'none' : 'check');
  showSheet(document.body.dataset.sheet || (mobileLayout() ? 'none' : 'build'));
}
// phone layout: one bottom sheet at a time (Build / Halacha), or none to just look
function showSheet(p) {
  document.body.dataset.sheet = p;
  document.querySelectorAll('.mtabs button').forEach((x) => x.classList.toggle('on', x.dataset.p === p));
  $('build').classList.toggle('hide', p !== 'build'); $('check').classList.toggle('hide', p !== 'check');
  document.body.classList.toggle('sheet-open', mobileLayout() && p !== 'none');
  fitViewToSheet();
}
// keep the sukkah in the part of the screen the sheet doesn't cover
function fitViewToSheet() {
  const W = innerWidth, H = innerHeight;
  const panel = document.body.classList.contains('sheet-open') ? $(document.body.dataset.sheet) : null;
  if (!panel) { camera.clearViewOffset(); return; }
  const r = panel.getBoundingClientRect();
  if (r.width < W * 0.7) camera.setViewOffset(W, H, (r.left < W / 2 ? -1 : 1) * r.width / 2, 0, W, H);
  else camera.setViewOffset(W, H, 0, (H - r.top) / 2, W, H);
}
const PRESET_BASE = { ...PRESETS[0][1], walls: '4', wallType: 'canvas', tied: true, supports: 'wood', order: 'walls', old: false, renewed: false, permission: true };
function applyPreset(p, keepRest = false) {
  if (!keepRest) Object.assign(CFG, PRESET_BASE);
  Object.assign(CFG, p);
  for (const k in CTRL_EL) CTRL_EL[k].set(CFG[k]);
  setSeaState(CFG.wind, CFG.boat === 'sailing');
  buildSukkah(); renderHalacha();
  store.set('cfg', JSON.stringify(CFG));
  if (camMode === 'orbit') frameOrbit();
}
function refreshTefachLabels() { for (const k of ['w', 'd', 'h', 'wallH', 'wallGap', 'avir']) CTRL_EL[k] && CTRL_EL[k].refresh(); }
