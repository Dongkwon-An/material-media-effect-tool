import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import * as BRAND from './brand.js?v=20261111f'; // ?v= makes the browser load fresh copies after an update
import { I18N } from './i18n.js?v=20261111f';

/* =========================================================
   State
   - global: camera, background, export, language
   - per category: its own copy of the category defaults (brand.js)
   ========================================================= */
const CAT = Object.fromEntries(BRAND.CATEGORIES.map(c => [c.id, c]));
const state = {
  on: new Set(),          // checked categories
  edit: null,             // category whose settings the sidebar shows
  cats: Object.fromEntries(BRAND.CATEGORIES.map(c => [c.id, { ...c.defaults }])),
  bg: BRAND.BACKGROUND,
  camera: 'low', camDist: 1, returnFront: false, panX: 0, panY: 0,
  exportSize: 'web', exportDuration: 10, exportQuality: 'high',
  lang: 'ko',
};
{ let l = null; try { l = localStorage.getItem('mm-lang'); } catch (e) { /* storage unavailable */ } state.lang = l || ((navigator.language || '').toLowerCase().startsWith('ko') ? 'ko' : 'en'); }

const t = k => (I18N[state.lang] && I18N[state.lang][k]) || I18N.en[k] || k;
const L = obj => obj[state.lang] || obj.en;
const gradientById = id => BRAND.GRADIENTS.find(g => g.id === id) || BRAND.GRADIENTS[0];
const P = () => (state.edit ? state.cats[state.edit] : null);

/* =========================================================
   Sidebar schema
   Rows with c: true read/write the edited category's settings.
   ========================================================= */
const R = {
  posX: { k: 'posX', c: true, type: 'range', label: 'positionX', min: 0.05, max: 0.95, step: 0.01 },
  posY: { k: 'posY', c: true, type: 'range', label: 'positionY', min: 0.05, max: 0.95, step: 0.01 },
  center: { type: 'button', id: 'centerBtn', label: 'toCenter' },
  count: { k: 'count', c: true, type: 'select', label: 'count', opts: [[1, '1'], [2, '2'], [3, '3'], [4, '4']], num: true, literalOpts: true },
  spacing: { k: 'spacing', c: true, type: 'range', label: 'spacing', min: 0, max: 2.5, step: 0.05, unit: '×' },
  behaviour: { k: 'behaviour', c: true, type: 'select', label: 'behaviour', opts: [['independent', 'independent'], ['sync', 'sync'], ['sequential', 'sequential']] },
  reverse: { k: 'reverse', c: true, type: 'check', label: 'reverse' },
  lineColor: { k: 'lineColor', c: true, type: 'select', label: 'lineColor', opts: [['category', 'lcCategory'], ['white', 'lcWhite']] },
  duration: { k: 'duration', c: true, type: 'range', label: 'duration', min: 0.8, max: 8, step: 0.1, unit: 's' },
  interval: { k: 'interval', c: true, type: 'range', label: 'interval', min: 0, max: 5, step: 0.1, unit: 's' },
  swing: { k: 'swing', c: true, type: 'range', label: 'swing', min: 10, max: 90, step: 1, unit: '°' },
  path: { k: 'path', c: true, type: 'select', label: 'path', opts: [['straight', 'straight'], ['curve', 'curve']] },
  quant: { k: 'quant', c: true, type: 'select', label: 'quant', opts: [[0, 'off'], [15, '15°'], [30, '30°'], [45, '45°']], num: true },
  // network
  crossCols: { k: 'crossCols', c: true, type: 'range', label: 'crossCols', min: 3, max: 10, step: 1 },
  spread: { k: 'spread', c: true, type: 'range', label: 'fieldSize', min: 0.5, max: 1.6, step: 0.05, unit: '×' },
  gap: { k: 'gap', c: true, type: 'range', label: 'gap', min: 0.2, max: 0.9, step: 0.01 },
  packets: { k: 'packets', c: true, type: 'range', label: 'signals', min: 1, max: 6, step: 1 },
  waveTime: { k: 'duration', c: true, type: 'range', label: 'waveTime', min: 1, max: 6, step: 0.1, unit: 's' },
  turnRate: { k: 'turnRate', c: true, type: 'range', label: 'turnRate', min: 0, max: 1, step: 0.05 },
  // light
  length: { k: 'length', c: true, type: 'range', label: 'length', min: 0.4, max: 2.5, step: 0.05, unit: '×' },
  spin: { k: 'spin', c: true, type: 'select', label: 'spin', opts: [[1, '1'], [2, '2'], [3, '3'], [4, '4']], num: true, literalOpts: true },
  tilt: { k: 'tilt', c: true, type: 'range', label: 'tilt', min: 0, max: 80, step: 1, unit: '°' },
  lightCount: { k: 'count', c: true, type: 'select', label: 'lightCount', opts: [1, 2, 3, 4, 5, 6].map(n => [n, String(n)]), num: true, literalOpts: true },
  lightSpacing: { k: 'spacing', c: true, type: 'range', label: 'lightSpacing', min: 0, max: 2, step: 0.05, unit: '×' },
  lightDuration: { k: 'duration', c: true, type: 'range', label: 'duration', min: 0.8, max: 6, step: 0.1, unit: 's' },
  // software
  rule: { k: 'rule', c: true, type: 'select', label: 'rule', opts: [['fill', 'ruleFill'], ['life', 'ruleLife'], ['blocks', 'ruleBlocks']] },
  cols: { k: 'cols', c: true, type: 'select', label: 'cols', opts: [12, 16, 24, 32, 40].map(n => [n, String(n)]), num: true, literalOpts: true },
  tick: { k: 'tick', c: true, type: 'range', label: 'tick', min: 0.05, max: 1, step: 0.01, unit: 's' },
  history: { k: 'history', c: true, type: 'range', label: 'history', min: 0, max: 12, step: 1 },
  layerDepth: { k: 'layerDepth', c: true, type: 'range', label: 'layerDepth', min: 0, max: 2, step: 0.05, unit: '×' },
  voxel: { k: 'voxel', c: true, type: 'check', label: 'voxel' },
  gridSize: { k: 'size', c: true, type: 'range', label: 'gridSize', min: 0.5, max: 1.6, step: 0.05, unit: '×' },
  // performance
  armThickness: { k: 'thickness', c: true, type: 'range', label: 'armThickness', min: 0.3, max: 3, step: 0.05, unit: '×' },
  boxLength: { k: 'length', c: true, type: 'range', label: 'boxLength', min: 0.4, max: 2, step: 0.05, unit: '×' },
  performers: { k: 'count', c: true, type: 'select', label: 'performers', opts: [[1, '1'], [2, '2'], [3, '3'], [4, '4']], num: true, literalOpts: true },
  performerSpacing: { k: 'spacing', c: true, type: 'range', label: 'performerSpacing', min: 0.3, max: 2, step: 0.05, unit: '×' },
  amplitude: { k: 'amplitude', c: true, type: 'range', label: 'swingRange', min: 0, max: 1.8, step: 0.05, unit: '×' },
  stepTime: { k: 'duration', c: true, type: 'range', label: 'stepTime', min: 0.4, max: 4, step: 0.05, unit: 's' },
  together: { k: 'behaviour', c: true, type: 'select', label: 'mode', opts: [['canon', 'canon'], ['unison', 'unison'], ['mirror', 'mirror']] },
  bpm: { k: 'bpm', c: true, type: 'range', label: 'bpm', min: 60, max: 160, step: 1 },
  accent: { k: 'accent', c: true, type: 'range', label: 'accent', min: 0, max: 0.9, step: 0.01 },
  figureSize: { k: 'amplitude', c: true, type: 'range', label: 'figureSize', min: 0.3, max: 2, step: 0.05, unit: '×' },
  twist: { k: 'twist', c: true, type: 'range', label: 'twist', min: 0, max: 3, step: 0.05, unit: '×' },
  danceStage: { k: 'spread', c: true, type: 'range', label: 'stageSize', min: 0.4, max: 1.6, step: 0.05, unit: '×' },
  ribbon: { k: 'ribbon', c: true, type: 'range', label: 'ribbon', min: 1, max: 12, step: 0.5 },
  ribbonWidth: { k: 'ribbonWidth', c: true, type: 'range', label: 'ribbonWidth', min: 0.3, max: 3, step: 0.05, unit: '×' },
  strands: { k: 'strands', c: true, type: 'range', label: 'strands', min: 1, max: 8, step: 1 },
  // digital image
  // smallest sheet compared with the largest, as a ratio of lengths (each step is ×1/√2, so 2 steps halve it)
  smallest: { k: 'steps', c: true, type: 'select', label: 'smallest', opts: [[2, '1:2'], [4, '1:4'], [6, '1:8'], [8, '1:16']], num: true, literalOpts: true },
  aspect: { k: 'aspect', c: true, type: 'select', label: 'aspect', opts: [['mix', 'aspectMix'], ['16:9', '16:9'], ['3:2', '3:2'], ['4:3', '4:3'], ['1:1', '1:1'], ['4:5', '4:5'], ['9:16', '9:16']], literalOpts: false },
  plateSize: { k: 'size', c: true, type: 'range', label: 'plateSize', min: 0.4, max: 1.6, step: 0.05, unit: '×' },
  cutTime: { k: 'duration', c: true, type: 'range', label: 'cutTime', min: 0.3, max: 4, step: 0.05, unit: 's' },
  // screens
  screenW: { k: 'screenW', c: true, type: 'range', label: 'screenW', min: 0.4, max: 2, step: 0.05, unit: '×' },
  screenH: { k: 'screenH', c: true, type: 'range', label: 'screenH', min: 0.4, max: 2, step: 0.05, unit: '×' },
  screenD: { k: 'screenD', c: true, type: 'range', label: 'screenD', min: 0.01, max: 0.4, step: 0.01 },
  startW: { k: 'startW', c: true, type: 'range', label: 'startW', min: 0.1, max: 1.5, step: 0.05, unit: '×' },
  startH: { k: 'startH', c: true, type: 'range', label: 'startH', min: 0.1, max: 1.5, step: 0.05, unit: '×' },
  startD: { k: 'startD', c: true, type: 'range', label: 'startD', min: 0.05, max: 1.5, step: 0.05, unit: '×' },
  echoLength: { k: 'echoLength', c: true, type: 'range', label: 'echoLength', min: 10, max: 240, step: 1 },
  echoDensity: { k: 'echoDensity', c: true, type: 'range', label: 'echoDensity', min: 0.5, max: 5, step: 0.1 },
  echoOpacity: { k: 'echoOpacity', c: true, type: 'range', label: 'echoOpacity', min: 0.3, max: 2, step: 0.05 },
  colorShift: { k: 'colorShift', c: true, type: 'range', label: 'colorShift', min: 0, max: 1, step: 0.01 },
  distanceFade: { k: 'distanceFade', c: true, type: 'range', label: 'distanceFade', min: 0.5, max: 5, step: 0.1 },
  air: { k: 'air', c: true, type: 'range', label: 'air', min: 0, max: 1, step: 0.01 },
  thickness: { type: 'locked', label: 'lineThickness', value: `${BRAND.LINE.px} px` },
};
const SCREEN_ROWS = [R.screenW, R.screenH, R.screenD];
const START_ROWS = [R.startW, R.startH, R.startD];
const ECHO_ROWS = [R.echoLength, R.echoDensity, R.echoOpacity, R.colorShift, R.air, R.distanceFade, R.thickness];
const TRAIL_ROWS = [R.echoLength, R.echoDensity, R.echoOpacity, R.colorShift, R.air, R.thickness];

// which settings each motion grammar shows
const MOTION_GROUPS = {
  swing: [
    { key: 'motion', desc: 'descMotion', rows: [R.count, R.spacing, R.behaviour, R.path, R.duration, R.interval, R.swing, R.quant] },
    { key: 'screenShape', desc: 'descScreenShape', rows: SCREEN_ROWS },
    { key: 'startShape', desc: 'descStartShape', rows: START_ROWS },
    { key: 'echoes', desc: 'descEchoes', rows: ECHO_ROWS },
  ],
  grid: [
    { key: 'motion', desc: 'descGrid', rows: [R.rule, R.cols, R.tick, R.gridSize, R.voxel] },
    { key: 'echoes', desc: 'descHistory', rows: [R.history, R.layerDepth, R.echoOpacity, R.colorShift, R.air, R.thickness] },
  ],
  net: [
    { key: 'motion', desc: 'descNet', rows: [R.crossCols, R.spread, R.gap, R.packets, R.waveTime, R.turnRate] },
    { key: 'echoes', desc: 'descEchoes', rows: [R.echoLength, R.echoDensity, R.echoOpacity, R.colorShift, R.air, R.thickness] },
  ],
  spin: [
    { key: 'motion', desc: 'descMotion', rows: [R.length, R.spin, R.tilt, R.lightDuration, R.lightCount, R.lightSpacing] },
    { key: 'echoes', desc: 'descEchoes', rows: ECHO_ROWS },
  ],
  dance: [
    { key: 'motion', desc: 'descDance', rows: [R.performers, R.together, R.bpm, R.accent, R.figureSize, R.twist, R.danceStage] },
    { key: 'echoes', desc: 'descRibbon', rows: [R.ribbon, R.ribbonWidth, R.strands, R.echoOpacity, R.colorShift, R.air, R.thickness] },
  ],
  arm: [
    { key: 'motion', desc: 'descBody', rows: [R.performers, R.performerSpacing, R.boxLength, R.armThickness, R.amplitude, R.stepTime, R.interval] },
    { key: 'echoes', desc: 'descEchoes', rows: ECHO_ROWS },
  ],
  format: [
    { key: 'motion', desc: 'descFormat', rows: [R.count, R.behaviour, R.aspect, R.smallest, R.cutTime, R.interval, R.plateSize, R.thickness] },
  ],
};

const GLOBAL_SECTIONS = [
  { key: 'global', desc: 'descGlobal', rows: [{ type: 'palette', label: 'backgroundColor' }] },
  { key: 'camera', desc: 'descCamera', rows: [
    { k: 'camera', type: 'select', label: 'motionTemplate', opts: [['low', 'low'], ['side', 'side'], ['orbit', 'orbit'], ['fly', 'fly'], ['front', 'front']] },
    { k: 'camDist', type: 'range', label: 'cameraDistance', min: 0.15, max: 2.5, step: 0.05 },
    { k: 'returnFront', type: 'check', label: 'returnToFront' },
    { type: 'button', id: 'resetViewBtn', label: 'resetView' },
    { k: 'panX', type: 'range', label: 'panX', min: -1, max: 1, step: 0.05 },
    { k: 'panY', type: 'range', label: 'panY', min: -1, max: 1, step: 0.05 },
  ] },
  { key: 'export', desc: null, rows: [
    { k: 'exportSize', type: 'select', label: 'exportSize', opts: Object.keys(BRAND.EXPORT_SIZES).map(v => [v, v]) },
    { k: 'exportDuration', type: 'select', label: 'exportDuration', opts: [[5, '5s'], [10, '10s'], [15, '15s']], num: true, literalOpts: true },
    { k: 'exportQuality', type: 'select', label: 'exportQuality', opts: [['standard', 'qStandard'], ['high', 'qHigh'], ['max', 'qMax']] },
    { type: 'button', id: 'exportPng', label: 'exportPng' },
    { type: 'button', id: 'exportMp4', label: 'exportMp4' },
    { type: 'button', id: 'exportSvg', label: 'exportSvg' },
  ] },
];
const CAMERA_KEYS = new Set(['camera', 'camDist', 'returnFront', 'panX', 'panY']);
const LIVE_CAT_KEYS = new Set(['echoDensity', 'echoOpacity', 'colorShift', 'distanceFade', 'echoLength', 'reverse', 'lineColor', 'history', 'layerDepth', 'air', 'bpm', 'accent', 'twist', 'ribbon', 'ribbonWidth', 'cropMarks', 'tick', 'gap', 'turnRate']);

/* =========================================================
   Sidebar rendering
   ========================================================= */
const sidebar = document.getElementById('sidebar');
let rowRegistry = [];
function fmt(r, v) {
  const d = r.step >= 1 ? 0 : (r.step < 0.01 ? 3 : 2);
  return (+v).toFixed(d) + (r.unit || '');
}
// a category may run its gradient the other way (flip) so no two categories start on the same colour
function catColors(c) { if (c.colors) return c.colors; const g = gradientById(c.gradient); return c.flip ? [g.b, g.a] : [g.a, g.b]; }
const colorName = hex => { const k = BRAND.KEY_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase()); return k ? k.name.replace('Material ', '') : hex; };
function gradCss(c) { const cs = catColors(c), st = c.stops || cs.map((_, i) => i / (cs.length - 1)); return `linear-gradient(90deg, ${cs.map((x, i) => `${x} ${Math.round(st[i] * 100)}%`).join(', ')})`; }
function rowHTML(r) {
  const id = r.k ? `p-${r.c ? 'c-' : ''}${r.k}-${r.label}` : (r.id || '');
  if (r.k) rowRegistry.push({ ...r, _id: id });
  const lab = `<label for="${id}">${t(r.label)}</label>`;
  if (r.type === 'select') {
    const opts = r.opts.map(o => `<option value="${o[0]}">${r.literalOpts || /^\d|°/.test(o[1]) ? o[1] : t(o[1])}</option>`).join('');
    return `<div class="row">${lab}<select id="${id}">${opts}</select></div>`;
  }
  if (r.type === 'range') return `<div class="row">${lab}<input type="range" id="${id}" min="${r.min}" max="${r.max}" step="${r.step}"><span class="value" id="v-${id}"></span></div>`;
  if (r.type === 'check') return `<div class="row">${lab}<input type="checkbox" class="check" id="${id}"></div>`;
  if (r.type === 'locked') return `<div class="row"><label>${t(r.label)}</label><div class="locked"><span>${r.value}</span><span>${t('locked')}</span></div></div>`;
  if (r.type === 'palette') {
    const sw = BRAND.BACKGROUNDS.map(c => `<button type="button" class="swatch-btn" data-bg="${c.hex}" title="${c.name}" aria-label="${c.name}" style="background:${c.hex}"></button>`).join('');
    return `<div class="row"><label>${t(r.label)}</label><span class="value wide" id="v-bg"></span></div><div class="palette">${sw}</div>`;
  }
  if (r.type === 'button') return `<div class="row"><button type="button" class="btn" id="${r.id}">${t(r.label)}</button></div>`;
  return '';
}
const openState = {};
function group(key, desc, inner, cls = 'group', title) {
  const open = openState[key] === false ? '' : 'open';
  return `<details class="${cls}" data-key="${key}" ${open}><summary>${title || t(key)}</summary><div class="rows">${desc ? `<div class="desc">${t(desc)}</div>` : ''}${inner}</div></details>`;
}
function categoryListHTML() {
  return BRAND.CATEGORIES.map(c => {
    const on = state.on.has(c.id), editing = state.edit === c.id;
    return `<div class="cat-row${editing ? ' editing' : ''}${on ? ' on' : ''}">
      <input type="checkbox" class="check" id="cat-${c.id}" data-cat="${c.id}" ${on ? 'checked' : ''} aria-label="${L(c.name)}">
      <span class="cat-chip" style="background:${gradCss(c)}"></span>
      <button type="button" class="cat-name" data-edit="${c.id}" ${on ? '' : 'disabled'}><b>${L(c.name)}</b><em>${state.lang === 'ko' ? c.name.en : c.name.ko}</em></button>
    </div>`;
  }).join('');
}
function categoryInfoHTML(c) {
  const g = gradientById(c.gradient);
  return `<dl class="info">
    <dt>${t('infoTypes')}</dt><dd>${L(c.types)}</dd>
    <dt>${t('infoColor')}</dt><dd><span class="info-grad" style="background:${gradCss(c)}"></span>${catColors(c).map(colorName).join(' → ')}</dd>
    <dt>${t('infoShape')}</dt><dd>${L(c.shape)}</dd>
    <dt>${t('infoRule')}</dt><dd>${L(c.rule)}</dd>
  </dl>`;
}
function buildSidebar() {
  sidebar.querySelectorAll('details[data-key]').forEach(d => { openState[d.dataset.key] = d.open; });
  rowRegistry = [];
  let h = group('categories', 'descCategories', `<div class="cat-list">${categoryListHTML()}</div>`);
  const c = state.edit && CAT[state.edit];
  if (c) {
    h += group('categoryInfo', 'descCategoryInfo', categoryInfoHTML(c), 'group cat-card', `${t('categoryInfo')} · ${L(c.name)}`);
    const subs = [
      group('placement', 'descPlacement', [R.posX, R.posY, R.center].map(rowHTML).join(''), 'sub'),
      group('color', 'descColor', [R.reverse, R.lineColor].map(rowHTML).join(''), 'sub'),
      ...MOTION_GROUPS[c.motion].map(g => group(g.key, g.key === 'motion' ? null : g.desc, (g.key === 'motion' ? `<div class="desc">${t('descMotionOf').replace('{name}', L(c.name))}</div>` : '') + g.rows.map(rowHTML).join(''), 'sub')),
    ].join('');
    h += group('categorySettings', null, subs, 'group', `${t('categorySettings')} · ${L(c.name)}`);
  }
  h += GLOBAL_SECTIONS.map(s => group(s.key, s.desc, s.rows.map(rowHTML).join(''))).join('');
  sidebar.innerHTML = h;

  rowRegistry.forEach(r => {
    const el = document.getElementById(r._id);
    if (!el) return;
    el.addEventListener('input', () => {
      let v = el.type === 'checkbox' ? el.checked : el.value;
      if (el.type === 'range' || r.num) v = +v;
      if (r.c) setCat(r.k, v); else setGlobal(r.k, v);
    });
  });
  sidebar.querySelectorAll('[data-cat]').forEach(el => el.addEventListener('change', () => toggleCategory(el.dataset.cat, el.checked)));
  sidebar.querySelectorAll('[data-edit]').forEach(el => el.addEventListener('click', () => { state.edit = el.dataset.edit; buildSidebar(); }));
  sidebar.querySelectorAll('[data-bg]').forEach(b => b.addEventListener('click', () => setBackground(b.dataset.bg)));
  const cb = document.getElementById('centerBtn');
  if (cb) cb.addEventListener('click', () => { setCat('posX', 0.5, true); setCat('posY', 0.5); });
  document.getElementById('resetViewBtn').addEventListener('click', resetView);
  document.getElementById('exportPng').addEventListener('click', exportPNG);
  document.getElementById('exportMp4').addEventListener('click', exportVideo);
  document.getElementById('exportSvg').addEventListener('click', exportSVG);
  syncSidebar();
  lockExport(recording);
}
function syncSidebar() {
  const p = P();
  rowRegistry.forEach(r => {
    const el = document.getElementById(r._id);
    if (!el) return;
    const v = r.c ? (p ? p[r.k] : undefined) : state[r.k];
    if (v === undefined) return;
    if (r.type === 'check') el.checked = !!v; else el.value = String(v);
    if (r.type === 'range') { const o = document.getElementById(`v-${r._id}`); if (o) o.textContent = fmt(r, v); }
  });
  const vbg = document.getElementById('v-bg');
  if (vbg) vbg.textContent = state.bg;
  sidebar.querySelectorAll('[data-bg]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.bg === state.bg)));
}

function toggleCategory(id, on) {
  if (on) {
    // one category at a time: choosing one turns the others off
    state.on.clear();
    state.on.add(id);
    state.edit = id;
    state.camera = CAT[id].camera; // each category brings the camera that suits it
    resetView();
  } else {
    state.on.delete(id);
    if (state.edit === id) state.edit = [...state.on].pop() || null;
  }
  buildSidebar();
  rebuild();
}
function setCat(k, v, silent) {
  const p = P();
  if (!p) return;
  p[k] = v;
  syncSidebar();
  if (silent) return;
  if (LIVE_CAT_KEYS.has(k)) return; // read every frame, no rebuild needed
  rebuildCategory(state.edit);
}
function setGlobal(k, v) {
  state[k] = v;
  syncSidebar();
  if (k === 'camera') resetView();
  if (CAMERA_KEYS.has(k) || k === 'exportDuration' || k === 'exportQuality') return;
  if (k === 'exportSize') { resize(); rebuild(); }
}
function setBackground(hex) { state.bg = hex; canvas.style.background = hex; syncSidebar(); }

/* =========================================================
   Language
   ========================================================= */
function applyLang() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  buildSidebar();
  updatePlayIcon();
}
document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => {
  state.lang = b.dataset.lang;
  try { localStorage.setItem('mm-lang', state.lang); } catch (e) { /* storage unavailable */ }
  applyLang();
}));

/* =========================================================
   Three.js setup
   ========================================================= */
const canvas = document.getElementById('canvas');
const stageEl = document.getElementById('stage');
const emptyEl = document.getElementById('empty');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
const scene = new THREE.Scene();
const FOV = 35;
const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 400);

let groups = {};        // category id -> { group, units, links, cat }
let lineScale = 1, renderW = 1, renderH = 1, renderPR = 1;
let clock = 0, playing = !matchMedia('(prefers-reduced-motion: reduce)').matches, recording = false, exporting = false, offline = false;

function exportAspect() { const [w, h] = BRAND.EXPORT_SIZES[state.exportSize]; return w / h; }
function stageDims() {
  const aspect = exportAspect(), Hs = 9, Ws = 9 * aspect;
  return { Ws, Hs, D: (Hs / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2)), aspect };
}
function allMaterials() {
  const out = [];
  Object.values(groups).forEach(g => { g.units.forEach(u => u.meshes.forEach(m => out.push(m.material))); g.dyn.forEach(d => d.layers.forEach(l => out.push(l.mesh.material))); });
  return out;
}
function applyResolution() {
  allMaterials().forEach(m => { m.resolution.set(renderW * renderPR, renderH * renderPR); m.linewidth = m.userData.px * lineScale; });
}
function setRenderSize(cssW, cssH, pixelRatio, updateStyle) {
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(cssW, cssH, updateStyle);
  renderW = cssW; renderH = cssH; renderPR = pixelRatio;
  lineScale = Math.min(cssW * pixelRatio, cssH * pixelRatio) / BRAND.LINE.basis;
  camera.aspect = cssW / cssH;
  camera.updateProjectionMatrix();
  applyResolution();
}
function resize() {
  if (recording) return;
  const aspect = exportAspect();
  const aw = stageEl.clientWidth, ah = stageEl.clientHeight;
  let w = aw, h = aw / aspect;
  if (h > ah) { h = ah; w = ah * aspect; }
  setRenderSize(Math.max(50, Math.floor(w)), Math.max(50, Math.floor(h)), Math.min(window.devicePixelRatio || 1, 2), true);
}
new ResizeObserver(resize).observe(stageEl);

/* =========================================================
   Units: one box per screen, drawn as its 12 edges
   ========================================================= */
function seeded(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const easeInOut = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const MAX_ECHO = 240;
const UNIT_EDGES = (() => {
  const e = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  const arr = Array.from(e.attributes.position.array); e.dispose(); return arr;
})();
const sharedGeometry = new LineSegmentsGeometry().setPositions(UNIT_EDGES);
const quatFromDeg = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(...[x, y, z].map(THREE.MathUtils.degToRad), 'YXZ'));
const CAT_ORDER = BRAND.CATEGORIES.map(c => c.id);

function makeLineMaterial(px) {
  const m = new LineMaterial({ color: 0xffffff, linewidth: px * lineScale, transparent: true, opacity: 0, depthWrite: false });
  m.userData.px = px;
  m.resolution.set(renderW * renderPR, renderH * renderPR);
  return m;
}
function makeUnit(g, data) {
  const meshes = [];
  for (let i = 0; i < MAX_ECHO; i++) {
    const m = new LineSegments2(sharedGeometry, makeLineMaterial(BRAND.LINE.px));
    m.renderOrder = data.order * 1000 + (MAX_ECHO - i);
    m.visible = false; m.frustumCulled = false;
    g.group.add(m); meshes.push(m);
  }
  return { meshes, g, ...data };
}

// offsets for several screens of one category (multiples of the base screen width)
const MULTI = {
  1: [[0, 0, 0]],
  2: [[-0.3, 0.08, -0.15], [0.3, -0.08, 0.15]],
  3: [[-0.32, 0.12, -0.2], [0.32, 0.12, 0], [0, -0.18, 0.2]],
  4: [[-0.3, 0.15, -0.25], [0.3, 0.15, -0.05], [-0.3, -0.15, 0.05], [0.3, -0.15, 0.25]],
};

/* =========================================================
   Dynamic line layers: segments rewritten every frame.
   Each layer has its own opacity, so trails fade by age.
   ========================================================= */
function makeDyn(g, px, maxSeg, buckets = 1, layer = 0) {
  const d = { px, maxSeg, layers: [], alpha: new Array(buckets).fill(1) };
  for (let b = 0; b < buckets; b++) {
    const geo = new LineSegmentsGeometry();
    geo.setPositions(new Float32Array(maxSeg * 6));
    geo.setColors(new Float32Array(maxSeg * 6));
    const mat = makeLineMaterial(px);
    mat.vertexColors = true;
    const mesh = new LineSegments2(geo, mat);
    mesh.frustumCulled = false; mesh.visible = false;
    mesh.renderOrder = g.order * 1000 + layer * 40 + (buckets - b);
    g.group.add(mesh);
    d.layers.push({ mesh, pos: geo.attributes.instanceStart.data.array, col: geo.attributes.instanceColorStart.data.array, n: 0 });
  }
  g.dyn.push(d);
  return d;
}
function dynBegin(d) { d.layers.forEach(l => { l.n = 0; }); }
function dynSeg(d, b, a, z, c1, c2 = c1) {
  const l = d.layers[b];
  if (!l || l.n >= d.maxSeg) return;
  const i = l.n * 6, P = l.pos, C = l.col;
  P[i] = a.x; P[i + 1] = a.y; P[i + 2] = a.z; P[i + 3] = z.x; P[i + 4] = z.y; P[i + 5] = z.z;
  C[i] = c1.r; C[i + 1] = c1.g; C[i + 2] = c1.b; C[i + 3] = c2.r; C[i + 4] = c2.g; C[i + 5] = c2.b;
  l.n++;
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
function dynLine(d, b, ax, ay, az, bx, by, bz, c) { _a.set(ax, ay, az); _b.set(bx, by, bz); dynSeg(d, b, _a, _b, c); }
function dynDot(d, b, v, c) { _a.copy(v); _b.copy(v); _b.x += 1e-3; dynSeg(d, b, _a, _b, c); } // a very short segment draws as a round dot
function dynRect(d, b, cx, cy, cz, w, h, c) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  dynLine(d, b, x0, y0, cz, x1, y0, cz, c); dynLine(d, b, x1, y0, cz, x1, y1, cz, c);
  dynLine(d, b, x1, y1, cz, x0, y1, cz, c); dynLine(d, b, x0, y1, cz, x0, y0, cz, c);
}
const camR = new THREE.Vector3(), camU = new THREE.Vector3(), _q = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
function dynSquare(d, b, v, size, c) { // a small square that always faces the camera
  camR.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(size / 2);
  camU.setFromMatrixColumn(camera.matrixWorld, 1).multiplyScalar(size / 2);
  _q[0].copy(v).sub(camR).sub(camU); _q[1].copy(v).add(camR).sub(camU); _q[2].copy(v).add(camR).add(camU); _q[3].copy(v).sub(camR).add(camU);
  for (let i = 0; i < 4; i++) dynSeg(d, b, _q[i], _q[(i + 1) % 4], c);
}
function dynBox(d, b, x0, y0, z0, x1, y1, z1, c) {
  for (const z of [z0, z1]) {
    dynLine(d, b, x0, y0, z, x1, y0, z, c); dynLine(d, b, x1, y0, z, x1, y1, z, c);
    dynLine(d, b, x1, y1, z, x0, y1, z, c); dynLine(d, b, x0, y1, z, x0, y0, z, c);
  }
  for (const [x, y] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) dynLine(d, b, x, y, z0, x, y, z1, c);
}
function dynEnd(d) {
  d.layers.forEach((l, b) => {
    const geo = l.mesh.geometry, A = geo.attributes.instanceStart.data, Cc = geo.attributes.instanceColorStart.data;
    geo.instanceCount = l.n;
    [A, Cc].forEach(buf => {
      if (buf.clearUpdateRanges) { buf.clearUpdateRanges(); buf.addUpdateRange(0, Math.max(6, l.n * 6)); }
      buf.needsUpdate = true;
    });
    l.mesh.visible = l.n > 0 && d.alpha[b] * (d.mul ?? 1) > 0.003;
    l.mesh.material.opacity = Math.min(1, d.alpha[b] * (d.mul ?? 1));
  });
}
function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const clamp01 = x => Math.min(1, Math.max(0, x));
const cA = new THREE.Color(), cB = new THREE.Color();
// atmosphere: older and farther lines take on the background colour, so trails turn airy and pale
// instead of piling up into heavy, saturated masses (the soft light of the Intrinsic film, without grain)
const bgCol = new THREE.Color('#FFFFFF');
function airy(c, amount) { return amount > 0 ? c.lerp(bgCol, Math.min(0.92, amount)) : c; }
function gcol(g, t, out = cA) {
  // gradients can have more than two stops (network: saffron → acid yellow → mint)
  const c = colorsFor(g), x = clamp01(t), L = c.list, S = c.stops;
  for (let i = 1; i < L.length; i++) if (x <= S[i] || i === L.length - 1) return out.copy(L[i - 1]).lerp(L[i], clamp01((x - S[i - 1]) / Math.max(1e-6, S[i] - S[i - 1])));
  return out.copy(c.A);
}

function buildCategory(id) {
  const cat = CAT[id], p = state.cats[id], { Ws, Hs } = stageDims();
  const order = CAT_ORDER.indexOf(id);
  const g = { group: new THREE.Group(), units: [], dyn: [], links: null, cat, p, order, t0: 0, tscale: 1, dim: 1, follow: new THREE.Vector3(), update: null };
  const base = new THREE.Vector3((p.posX - 0.5) * Ws, (0.5 - p.posY) * Hs, 0);
  const W0 = 0.46 * Ws, seedBase = order * 1000;
  const common = { cat, p, order };

  if (cat.motion === 'swing') {
    const n = p.count, shrink = n === 1 ? 1 : n === 2 ? 0.85 : 0.75;
    MULTI[n].forEach((o, i) => {
      const bw = W0 * shrink;
      const w = bw * p.screenW, h = (bw / BRAND.SCREEN.aspect) * p.screenH, d = w * p.screenD;
      const E = base.clone().add(new THREE.Vector3(o[0] * p.spacing * W0, o[1] * p.spacing * W0, o[2] * p.spacing * W0));
      const rnd = k => seeded(seedBase + i * 17 + k), sign = k => (rnd(k) < 0.5 ? -1 : 1);
      const front = { pos: E.clone(), q: new THREE.Quaternion(), dims: new THREE.Vector3(w, h, d) };
      const startDims = new THREE.Vector3(h * p.startW, h * p.startH, h * p.startD);
      const sw = p.swing;
      const cube = { pos: E.clone().add(new THREE.Vector3(-0.55 * w * sign(12), -0.12 * w, -0.9 * w)), q: quatFromDeg(35 * sign(1), 45 * sign(2), 15 * sign(3)), dims: startDims };
      const swA = { pos: E.clone().add(new THREE.Vector3(0.14 * w * sign(4), 0.05 * w, 0.1 * w)), q: quatFromDeg(0, sw * sign(5), 0), dims: front.dims };
      const swB = { pos: E.clone().add(new THREE.Vector3(-0.06 * w, 0.12 * w * sign(6), 0.08 * w)), q: quatFromDeg(sw * 0.8 * sign(7), 0, 0), dims: front.dims };
      const swC = { pos: E.clone().add(new THREE.Vector3(0.08 * w * sign(8), -0.06 * w, 0.12 * w)), q: quatFromDeg(sw * 0.5 * sign(9), -sw * 0.6 * sign(9), sw * 0.35 * sign(10)), dims: front.dims };
      g.units.push(makeUnit(g, { ...common, index: i, w, E, front, startDims, curveSign: i % 2 ? -1 : 1, keys: [cube, front, swA, swB, front, swC, front, cube] }));
    });
  } else if (cat.motion === 'spin') {
    const n = p.count;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * p.spacing * W0 * 0.35;
      const len = p.length * W0, thin = W0 * 0.006;
      g.units.push(makeUnit(g, { ...common, index: i, w: len, E: base.clone().add(new THREE.Vector3(x, 0, (i % 2 ? 1 : -1) * 0.05 * W0)), dims: new THREE.Vector3(len, thin, thin), phase: i / n }));
    }
  } else if (cat.motion === 'format') buildFormat(g, base, W0, common);
  else if (cat.motion === 'net') buildNet(g, base, W0);
  else if (cat.motion === 'grid') buildGrid(g, base, W0);
  else if (cat.motion === 'dance') buildDance(g, base, W0);
  else if (cat.motion === 'arm') {
    const n = p.count, shrink = n === 1 ? 1 : n === 2 ? 0.8 : 0.68;
    MULTI[n].forEach((o, i) => {
      const len = W0 * 0.55 * p.length * shrink, home = base.clone().add(new THREE.Vector3(o[0] * p.spacing * W0, o[1] * p.spacing * W0 * 0.6, o[2] * p.spacing * W0));
      const d0 = new THREE.Vector3(1, 0.35 * (i % 2 ? -1 : 1), 0.2).normalize(), pivot = home.clone().addScaledVector(d0, -len / 2);
      const q0 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), d0);
      const walk = { len, thick: W0 * 0.065 * p.thickness * shrink, home, seed: 1700 + i * 311, minA: 60, maxA: 60 + 120 * Math.min(1, p.amplitude / 1.8), steps: [{ pivot, dir: d0, q: q0 }] };
      g.units.push(makeUnit(g, { ...common, index: i, w: len, E: home, walk, phase: i * 0.37 }));
    });
  }
  scene.add(g.group);
  schedule(g);
  applyResolution();
  return g;
}
function disposeCategory(id) {
  const g = groups[id];
  if (!g) return;
  g.units.forEach(u => u.meshes.forEach(m => m.material.dispose()));
  g.dyn.forEach(d => d.layers.forEach(l => { l.mesh.material.dispose(); l.mesh.geometry.dispose(); }));
  scene.remove(g.group);
  delete groups[id];
}
function rebuildCategory(id) {
  if (!id) return;
  disposeCategory(id);
  if (state.on.has(id)) {
    groups[id] = buildCategory(id);
    groups[id].t0 = clock; // a rebuilt category starts from its beginning
  }
}
function rebuild() {
  Object.keys(groups).forEach(disposeCategory);
  state.on.forEach(id => { groups[id] = buildCategory(id); });
  emptyEl.hidden = state.on.size > 0;
  clock = 0;
}

/* ---------------------------------------------------------
   Endless fields: software and network patterns repeat without
   end in every direction. Only what the camera can see is drawn,
   and lines fade with distance, so there is never an edge.
   --------------------------------------------------------- */
const FOG = 12;
function fogDyn(g, px, maxSeg, layer) {
  const d = makeDyn(g, px, maxSeg, FOG, layer);
  for (let b = 0; b < FOG; b++) d.alpha[b] = (b + 1) / FOG;
  return d;
}
const fogB = a => (a < 0.5 / FOG ? -1 : Math.min(FOG - 1, Math.max(0, Math.round(a * FOG) - 1)));
function fogRange() { const { D } = stageDims(); return { near: D * 0.55 * state.camDist + D * 0.25, far: D * 1.7 * state.camDist + D * 0.6 }; }
const fogAt = (dist, F) => 1 - THREE.MathUtils.smoothstep(dist, F.near, F.far);
const imod = (a, n) => ((a % n) + n) % n;
const vRay = new THREE.Vector3(), vO = new THREE.Vector3(), vP = new THREE.Vector3();
function planeView(z, far) {
  // the part of the plane at height z the camera can see, as an x/y box
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  vO.copy(camera.position);
  for (const [nx, ny] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]]) {
    vRay.set(nx, ny, 0.5).unproject(camera).sub(vO).normalize();
    let t = Math.abs(vRay.z) > 1e-6 ? (z - vO.z) / vRay.z : -1;
    if (!(t > 0) || t > far) t = far;
    vP.copy(vO).addScaledVector(vRay, t);
    x0 = Math.min(x0, vP.x); x1 = Math.max(x1, vP.x); y0 = Math.min(y0, vP.y); y1 = Math.max(y1, vP.y);
  }
  x0 = Math.max(x0, vO.x - far); x1 = Math.min(x1, vO.x + far); y0 = Math.max(y0, vO.y - far); y1 = Math.min(y1, vO.y + far);
  return { x0, x1, y0, y1 };
}

/* ---------------------------------------------------------
   Digital image & fabrication: one sheet that jumps between
   paper formats: from a small A6 up to A0, to filling the whole
   frame, back down to A5 … It always keeps the 1:√2 ratio and
   turns portrait/landscape as the A series does. A thin slab,
   flat to the viewer: it scales, it does not swing.
   --------------------------------------------------------- */
function buildFormat(g, base, W0, common) {
  // 1–4 sheets; each has its own route through sizes and places
  const p = g.p, n = p.count || 1, shrink = [1, 1, 0.8, 0.7, 0.62][n];
  for (let si = 0; si < n; si++) buildSheet(g, base, W0, common, si, shrink);
}
function buildSheet(g, base, W0, common, si, shrink) {
  const p = g.p, { Ws, Hs } = stageDims(), r = rng(808 + p.steps * 13 + si * 4099);
  const A0 = W0 * 0.78 * p.size * shrink; // long side of the largest sheet
  // aspect ratios (width : height); 'mix' picks a different one for each size
  const RATIOS = [16 / 9, 3 / 2, 4 / 3, 1, 4 / 5, 9 / 16, 2 / 3];
  const ratioOf = () => (p.aspect && p.aspect !== 'mix' ? (([a, b]) => a / b)(p.aspect.split(':').map(Number)) : RATIOS[Math.floor(r() * RATIOS.length)]);
  const sizeOf = k => {
    const ratio = ratioOf();
    if (k === 'full') { // fills the frame, edges just inside it
      const w = Math.min(Ws * 0.72, Hs * 0.72 * ratio);
      return new THREE.Vector3(w, w / ratio, w * 0.012);
    }
    const L = A0 / Math.pow(Math.SQRT2, k); // each step is 1/√2 of the one before
    const w = ratio >= 1 ? L : L * ratio, h = ratio >= 1 ? L / ratio : L;
    return new THREE.Vector3(w, h, Math.max(W0 * 0.012, L * 0.025));
  };
  const pool = si === 0 ? ['full'] : []; // only the first sheet fills the frame
  for (let k = 0; k <= p.steps; k++) pool.push(k);
  const seq = [];
  let prev = null;
  for (let i = 0; i < 10; i++) { // big and small alternate so every change is a real jump
    let k, tries = 0;
    do { k = pool[Math.floor(r() * pool.length)]; tries++; } while (tries < 20 && (k === prev || (prev !== null && typeof k === 'number' && typeof prev === 'number' && Math.abs(k - prev) < 2)));
    seq.push(k); prev = k;
  }
  if (si === 0 && !seq.includes('full')) seq[4] = 'full';
  // where each sheet goes: the full one sits in the middle, smaller ones move out to a
  // corner, an edge or the bottom, as far as they fit inside the view
  const ANCHORS = [[0, 0], [-1, 1], [1, 1], [1, -1], [-1, -1], [0, -1], [0, 1], [-1, 0], [1, 0]];
  const halfW = Ws * 0.3, halfH = Hs * 0.3;
  let prevA = -1;
  const shift = new THREE.Vector3(base.x * 0.4, base.y * 0.4, 0);
  const keys = seq.map(k => {
    const dims = sizeOf(k);
    let ai = 0;
    if (k !== 'full') { do { ai = Math.floor(r() * ANCHORS.length); } while (ai === prevA); }
    prevA = ai;
    const [ax, ay] = ANCHORS[ai];
    const pos = new THREE.Vector3(ax * Math.max(0, halfW - dims.x / 2), ay * Math.max(0, halfH - dims.y / 2), 0).add(shift); // shift: clicking the canvas nudges the whole layout
    let q = new THREE.Quaternion();
    if (k !== 'full') { // set a little into depth and turned slightly, so the sheets read in space
      pos.z = -r() * A0 * 0.45; // pushed back, never toward the camera
      q = quatFromDeg((r() * 2 - 1) * 14, (r() * 2 - 1) * 18, 0);
    }
    return { pos, q, dims };
  });
  keys.push(keys[0]);
  g.units.push(makeUnit(g, { ...common, index: si, w: A0 * 0.5, E: new THREE.Vector3(), keys, curveSign: 1 }));
}
const easeSnap = x => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2); // quick, clean move with no bounce
const lerpRect = (a, b, e) => ({ x0: a.x0 + (b.x0 - a.x0) * e, x1: a.x1 + (b.x1 - a.x1) * e, y0: a.y0 + (b.y0 - a.y0) * e, y1: a.y1 + (b.y1 - a.y1) * e });

/* ---------------------------------------------------------
   Network-based: a cube of 3D crosses (six arms each).
   Signals spread through the cube as waves; where one passes,
   arms stretch until they meet their neighbours and join into
   lines, then pull back and leave gaps. Some crosses turn 90°.
   --------------------------------------------------------- */
function buildNet(g, base, W0) {
  // one tile of crosses; it repeats without end in every direction
  const p = g.p, { Hs } = stageDims(), ny = p.crossCols, cell = (Hs * 1.1 * p.spread) / Math.max(1, ny - 1);
  const nx = Math.max(2, Math.round(ny * 1.6)), nz = ny;
  g.cross = { cell, nx, ny, nz, ctr: new THREE.Vector3(0, 0, 0).lerp(base, 0.25), frustum: new THREE.Frustum(), m4: new THREE.Matrix4(), sph: new THREE.Sphere() };
  g.dArms = fogDyn(g, BRAND.LINE.px, 26000, 1);
  g.update = updateNet;
}
const tor = (a, b, n) => { const d = Math.abs(a - b) % n; return Math.min(d, n - d); };
function waveField(g, gx, gy, gz, T, axis) {
  // travelling spherical fronts on a wrapped tile, so the pattern has no seams
  const p = g.p, C = g.cross, P = p.duration * 2.2, span = Math.max(C.nx, C.ny, C.nz);
  let e = 0;
  for (let s = 0; s < p.packets * 3; s++) {
    if ((s % 3) !== axis) continue;
    const off = seeded(s * 13 + 7) * P, x = (T + off) / P, k = Math.floor(x), age = x - k;
    const ox = seeded(k * 31 + s * 7 + 1) * C.nx, oy = seeded(k * 17 + s * 11 + 3) * C.ny, oz = seeded(k * 23 + s * 5 + 9) * C.nz;
    const d = Math.hypot(tor(gx, ox, C.nx), tor(gy, oy, C.ny), tor(gz, oz, C.nz)), r = age * span * 0.75, w = 1.0, fade = Math.sin(Math.PI * age);
    e += Math.exp(-((d - r) * (d - r)) / (w * w)) * fade;
    e -= 0.55 * Math.exp(-((d - r + 1.6) * (d - r + 1.6)) / (w * w)) * fade; // a trough behind the front opens gaps
  }
  return Math.max(-1, Math.min(1, e));
}
const armC = new THREE.Color(), AX = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], nC = new THREE.Vector3(), nE = new THREE.Vector3(), turnQ = new THREE.Quaternion(), AXES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
function visibleNodes(g) {
  const C = g.cross, fr = fogRange(), cp = camera.position, out = [];
  C.m4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  C.frustum.setFromProjectionMatrix(C.m4);
  const r = Math.ceil(fr.far / C.cell);
  const ci = Math.round((cp.x - C.ctr.x) / C.cell), cj = Math.round((C.ctr.y - cp.y) / C.cell), ck = Math.round((C.ctr.z - cp.z) / C.cell);
  C.sph.radius = C.cell * 0.6;
  for (let k = ck - r; k <= ck + r; k++) for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
    C.sph.center.set(C.ctr.x + i * C.cell, C.ctr.y - j * C.cell, C.ctr.z - k * C.cell);
    const dist = C.sph.center.distanceTo(cp);
    if (dist > fr.far || !C.frustum.intersectsSphere(C.sph)) continue;
    const gx = imod(i, C.nx), gy = imod(j, C.ny), gz = imod(k, C.nz), id = (gz * C.ny + gy) * C.nx + gx;
    const near = THREE.MathUtils.smoothstep(dist, C.cell * 1.2, C.cell * 3.2); // crosses right next to the camera fade out too
    if (near <= 0) continue;
    out.push({ x: C.sph.center.x, y: C.sph.center.y, z: C.sph.center.z, gx, gy, gz, fog: fogAt(dist, fr) * near, turns: seeded(4000 + id) < g.p.turnRate, toff: seeded(5000 + id), axis: Math.floor(seeded(6000 + id) * 3) });
    if (out.length > 4000) return out;
  }
  return out;
}
function crossesAt(g, nodes, T, d, alpha) {
  const p = g.p, C = g.cross, half = C.cell / 2, base = p.gap * half;
  const len = e => (e >= 0 ? base + (half - base) * e : base + (base - half * 0.12) * e);
  nodes.forEach(nd => {
    const b = fogB(alpha * nd.fog);
    if (b < 0) return;
    const L = [0, 1, 2].map(a => len(waveField(g, nd.gx, nd.gy, nd.gz, T, a)));
    let ang = 0;
    if (nd.turns) { const x = T / (p.duration * 3) + nd.toff, k = Math.floor(x); ang = (Math.PI / 2) * (k + THREE.MathUtils.smootherstep(x - k, 0.75, 1)); }
    turnQ.setFromAxisAngle(AXES[nd.axis], ang);
    for (let a = 0; a < 3; a++) AX[a].copy(AXES[a]).applyQuaternion(turnQ);
    const reach = Math.max(L[0], L[1], L[2]);
    // colour runs across the field as a soft wave (no seam where the tile repeats): about a third of it reaches the end colour
    const tri = 1 - Math.abs(2 * ((nd.gx + 0.5 * nd.gz) / C.nx % 1) - 1);
    const c = airy(gcol(g, (tri * 0.9 + ((reach - base) / Math.max(1e-6, half - base)) * 0.1) * p.colorShift, armC), (p.air ?? 0) * 0.7 * (1 - nd.fog));
    nC.set(nd.x, nd.y, nd.z);
    for (let a = 0; a < 3; a++) for (const sg of [1, -1]) { nE.copy(nC).addScaledVector(AX[a], sg * L[a]); dynSeg(d, b, nC, nE, c); }
  });
}
function updateNet(g, T) {
  const p = g.p, Lh = Math.min(6, Math.round(p.echoLength)), dt = BRAND.ECHO.spacing * 2 / p.echoDensity;
  const nodes = visibleNodes(g).sort((a, b) => a.fog - b.fog); // far ones first
  dynBegin(g.dArms);
  for (let k = Lh; k >= 1; k--) crossesAt(g, nodes, T - k * dt, g.dArms, 0.16 * (1 - (k - 1) / Lh) * p.echoOpacity);
  crossesAt(g, nodes, T, g.dArms, 0.95);
  dynEnd(g.dArms);
}

/* ---------------------------------------------------------
   Software-based: a screen of pixel cells that runs a program.
   Every tick the cells switch on or off by a rule (Game of Life,
   or a falling-block game, as in MoMA's software collection).
   Earlier generations slide back in depth: the program's time.
   --------------------------------------------------------- */
function lifeFrames(cols, rows, seed, N) {
  const r = rng(seed), size = cols * rows;
  const fresh = () => { const f = new Uint8Array(size); for (let i = 0; i < size; i++) f[i] = r() < 0.3 ? 1 : 0; return f; };
  let cur = fresh(), since = 0;
  const frames = [cur], seen = new Map();
  for (let i = 1; i < N; i++) {
    const nx = new Uint8Array(size);
    let alive = 0;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      let c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        c += cur[((y + dy + rows) % rows) * cols + ((x + dx + cols) % cols)];
      }
      const v = c === 3 || (c === 2 && cur[y * cols + x]) ? 1 : 0;
      nx[y * cols + x] = v; alive += v;
    }
    const key = nx.join('');
    since++;
    if (alive < size * 0.04 || (seen.has(key) && i - seen.get(key) < 40) || since > 180) { cur = fresh(); seen.clear(); since = 0; } // the program restarts
    else cur = nx;
    seen.set(cur.join(''), i);
    frames.push(cur);
  }
  return frames;
}
const PIECES = [[[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]], [[0, 0], [0, 1], [1, 1], [2, 1]], [[2, 0], [0, 1], [1, 1], [2, 1]]];
function rotations(shape) {
  const out = [], keys = new Set();
  let cells = shape;
  for (let k = 0; k < 4; k++) {
    const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
    const norm = cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const key = JSON.stringify(norm);
    if (!keys.has(key)) { keys.add(key); out.push(norm); }
    cells = cells.map(([x, y]) => [-y, x]);
  }
  return out;
}
function blockFrames(cols, rows, seed, N) {
  const r = rng(seed);
  let board = new Uint8Array(cols * rows);
  const frames = [];
  const fits = (cells, ox, oy, B = board) => cells.every(([x, y]) => { const X = ox + x, Y = oy + y; return X >= 0 && X < cols && Y < rows && (Y < 0 || !B[Y * cols + X]); });
  const snap = (cells, ox, oy) => { const f = board.slice(); if (cells) cells.forEach(([x, y]) => { if (oy + y >= 0) f[(oy + y) * cols + ox + x] = 1; }); frames.push(f); };
  const evaluate = B => {
    let agg = 0, holes = 0, bump = 0, lines = 0, prevH = -1;
    for (let y = 0; y < rows; y++) { let full = true; for (let x = 0; x < cols; x++) if (!B[y * cols + x]) full = false; if (full) lines++; }
    for (let x = 0; x < cols; x++) {
      let h = 0, seen = false;
      for (let y = 0; y < rows; y++) { if (B[y * cols + x]) { if (!seen) { h = rows - y; seen = true; } } else if (seen) holes++; }
      agg += h; if (prevH >= 0) bump += Math.abs(h - prevH); prevH = h;
    }
    return -0.51 * agg + 0.76 * lines * cols / 10 - 0.36 * holes * 2 - 0.18 * bump;
  };
  while (frames.length < N) {
    const rots = rotations(PIECES[Math.floor(r() * PIECES.length)]);
    let best = null;
    rots.forEach((cells, ri) => {
      const w = Math.max(...cells.map(c => c[0])) + 1;
      for (let ox = 0; ox <= cols - w; ox++) {
        if (!fits(cells, ox, 0)) continue;
        let oy = 0;
        while (fits(cells, ox, oy + 1)) oy++;
        const B = board.slice();
        cells.forEach(([x, y]) => { B[(oy + y) * cols + ox + x] = 1; });
        const s = evaluate(B) + r() * 0.05;
        if (!best || s > best.s) best = { s, ri, ox };
      }
    });
    if (!best) { board = new Uint8Array(cols * rows); snap(); snap(); continue; } // game over: the screen clears
    const cells = rots[best.ri], w = Math.max(...cells.map(c => c[0])) + 1;
    let x = Math.floor((cols - w) / 2), y = 0;
    if (!fits(cells, x, y)) x = best.ox;
    snap(cells, x, y);
    while (x !== best.ox && fits(cells, x + Math.sign(best.ox - x), y)) { x += Math.sign(best.ox - x); snap(cells, x, y); }
    while (fits(cells, x, y + 1)) { y++; snap(cells, x, y); }
    cells.forEach(([cx, cy]) => { if (y + cy >= 0) board[(y + cy) * cols + x + cx] = 1; });
    const full = [];
    for (let yy = 0; yy < rows; yy++) { let f = true; for (let xx = 0; xx < cols; xx++) if (!board[yy * cols + xx]) f = false; if (f) full.push(yy); }
    if (full.length) {
      snap();
      full.forEach(yy => board.fill(0, yy * cols, yy * cols + cols)); snap(); // the cleared rows blink out
      const keep = [];
      for (let yy = 0; yy < rows; yy++) if (!full.includes(yy)) keep.push(board.slice(yy * cols, yy * cols + cols));
      board = new Uint8Array(cols * rows);
      keep.forEach((row, k) => board.set(row, (rows - keep.length + k) * cols));
    }
  }
  return frames.slice(0, N);
}
function fillFrames(cols, rows, seed, N) {
  // the screen fills up, then parts of it drop out (blocks, rows, crumbling edges), then it grows back
  const r = rng(seed), size = cols * rows, frames = [];
  let cur = new Uint8Array(size).fill(1), mode = 'hold', t = 0;
  const on = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && cur[y * cols + x];
  while (frames.length < N) {
    frames.push(cur);
    const nx = cur.slice();
    t++;
    if (mode === 'hold') { if (t > 4) { mode = 'erode'; t = 0; } }
    else if (mode === 'erode') {
      const pick = r();
      if (pick < 0.45) { // a block drops out
        const w = 1 + Math.floor(r() * cols * 0.3), h = 1 + Math.floor(r() * rows * 0.4), x0 = Math.floor(r() * cols), y0 = Math.floor(r() * rows);
        for (let y = y0; y < Math.min(rows, y0 + h); y++) for (let x = x0; x < Math.min(cols, x0 + w); x++) nx[y * cols + x] = 0;
      } else if (pick < 0.7) { // a row or a column is cleared
        if (r() < 0.5) { const y = Math.floor(r() * rows); nx.fill(0, y * cols, y * cols + cols); } else { const x = Math.floor(r() * cols); for (let y = 0; y < rows; y++) nx[y * cols + x] = 0; }
      }
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { // loose cells crumble
        if (!cur[y * cols + x]) continue;
        const nb = on(x - 1, y) + on(x + 1, y) + on(x, y - 1) + on(x, y + 1);
        if (nb <= 1 && r() < 0.7) nx[y * cols + x] = 0;
      }
      let alive = 0; for (let i = 0; i < size; i++) alive += nx[i];
      if (alive < size * 0.12 || t > 40) { mode = 'grow'; t = 0; }
    } else { // grow back from what is left
      let alive = 0;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        if (cur[y * cols + x]) { alive++; continue; }
        const nb = on(x - 1, y) + on(x + 1, y) + on(x, y - 1) + on(x, y + 1);
        if ((nb && r() < 0.55) || r() < 0.01) { nx[y * cols + x] = 1; alive++; }
      }
      if (alive >= size) { mode = 'hold'; t = 0; }
    }
    cur = nx;
  }
  return frames;
}
function buildGrid(g, base, W0) {
  // the grid covers the whole frame (and a little past it)
  const p = g.p, { Ws, Hs } = stageDims(), cols = p.cols;
  const W = Ws * 1.08 * p.size, cell = W / cols, rows = Math.max(4, Math.ceil((Hs * 1.08 * p.size) / cell)), H = cell * rows;
  const ctr = new THREE.Vector3(0, 0, 0).lerp(base, 0.25); // stays near the middle so it always fills the frame
  g.grid = {
    cols, rows, cell, W, H, center: ctr, origin: ctr.clone().add(new THREE.Vector3(-W / 2, H / 2, 0)),
    frames: p.rule === 'blocks' ? blockFrames(cols, rows, 77 + cols, 1200) : p.rule === 'life' ? lifeFrames(cols, rows, 4242 + cols, 480) : fillFrames(cols, rows, 1313 + cols, 600),
  };
  g.dCells = fogDyn(g, BRAND.LINE.px, p.voxel ? 36000 : 16000, 1);
  g.update = updateGrid;
}
function updateGrid(g, T) {
  // the program's grid repeats without end; cells far from the camera fade out
  const p = g.p, G = g.grid, F = G.frames.length, gi = Math.floor(Math.max(0, T) / p.tick), hist = Math.min(12, p.history);
  const inset = G.cell * 0.14, s = G.cell - 2 * inset, step = G.cell * p.layerDepth * 1.2, fr = fogRange();
  const v = planeView(G.origin.z - hist * step * 0.5, fr.far);
  let i0 = Math.floor((v.x0 - G.origin.x) / G.cell) - 1, i1 = Math.ceil((v.x1 - G.origin.x) / G.cell) + 1;
  let j0 = Math.floor((G.origin.y - v.y1) / G.cell) - 1, j1 = Math.ceil((G.origin.y - v.y0) / G.cell) + 1;
  const MAXC = 150; // keep the drawn window to a sane size around the middle of the view
  if (i1 - i0 > MAXC) { const m = (i0 + i1) >> 1; i0 = m - MAXC / 2; i1 = m + MAXC / 2; }
  if (j1 - j0 > MAXC) { const m = (j0 + j1) >> 1; j0 = m - MAXC / 2; j1 = m + MAXC / 2; }
  dynBegin(g.dCells);
  const cp = camera.position;
  for (let k = hist; k >= 0; k--) {
    const idx = gi - k;
    if (idx < 0) continue;
    const frame = G.frames[idx % F], z = G.origin.z - k * step;
    const layerA = k === 0 ? 0.95 : 0.5 * (1 - k / (hist + 1)) * p.echoOpacity;
    for (let j = j0; j <= j1; j++) {
      const row = imod(j, G.rows) * G.cols, y1 = G.origin.y - j * G.cell - inset;
      for (let i = i0; i <= i1; i++) {
        if (!frame[row + imod(i, G.cols)]) continue;
        const x0 = G.origin.x + i * G.cell + inset;
        const fog = fogAt(Math.hypot(x0 + s / 2 - cp.x, y1 - s / 2 - cp.y, z - cp.z), fr), b = fogB(layerA * fog);
        if (b < 0) continue;
        const c = airy(gcol(g, (imod(i, G.cols) / G.cols) * 0.6 * p.colorShift + (k / (hist + 1)) * 0.4 * p.colorShift), (p.air ?? 0) * (0.7 * (1 - fog) + 0.5 * k / (hist + 1)));
        if (p.voxel) dynBox(g.dCells, b, x0, y1 - s, z, x0 + s, y1, z - s * 0.8, c);
        else dynRect(g.dCells, b, x0 + s / 2, y1 - s / 2, z, s, s, c);
      }
    }
  }
  dynEnd(g.dCells);
}

function wave(t, s, k) {
  const f1 = 0.5 + seeded(s + k) * 0.9, f2 = 1.1 + seeded(s + k + 50) * 1.3;
  return 0.62 * Math.sin(t * f1 + seeded(s + k + 100) * 6.283) + 0.38 * Math.sin(t * f2 + seeded(s + k + 150) * 6.283);
}
/* Performance: a box that walks end over end. One end stays put as a pivot while the
   other swings through the air; when it lands, the end that moved becomes the new pivot
   and the old pivot swings next. Each swing turns about a different axis. */
function walkStep(u, k) {
  const W = u.walk;
  while (W.steps.length <= k) {
    const s = W.steps[W.steps.length - 1], i = W.steps.length, r = rng(W.seed + i * 7919);
    // try a few swings and keep the one that stays closest to home
    let best = null;
    for (let c = 0; c < 10; c++) {
      const ax = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).projectOnPlane(s.dir).normalize();
      if (ax.lengthSq() < 1e-6) continue;
      const ang = THREE.MathUtils.degToRad(W.minA + r() * (W.maxA - W.minA));
      const nd = s.dir.clone().applyAxisAngle(ax, ang);
      const end = s.pivot.clone().addScaledVector(nd, W.len);
      const mid = s.pivot.clone().addScaledVector(nd, W.len / 2);
      const score = mid.distanceTo(W.home) + r() * W.len * 0.25;
      if (!best || score < best.score) best = { score, ax, ang, nd, end };
    }
    const q = new THREE.Quaternion().setFromAxisAngle(best.ax, best.ang).multiply(s.q);
    s.ax = best.ax; s.ang = best.ang; s.nd = best.nd;
    W.steps.push({ pivot: best.end, dir: best.nd.clone().negate(), q });
  }
  return W.steps[k];
}
const wkQ = new THREE.Quaternion(), wkD = new THREE.Vector3();
function walkState(u, time, out) {
  const p = u.p, W = u.walk, seg = p.duration + p.interval, x = Math.max(0, time + u.phase * seg) / seg;
  const k = Math.floor(x), local = (x - k) * seg, e = local >= p.duration ? 1 : easeInOut(local / p.duration);
  walkStep(u, k + 1);
  const s = W.steps[k];
  wkD.copy(s.dir).applyAxisAngle(s.ax, s.ang * e);
  wkQ.setFromAxisAngle(s.ax, s.ang * e).multiply(s.q);
  out.pos.copy(s.pivot).addScaledVector(wkD, W.len / 2);
  out.q.copy(wkQ);
  out.dims.set(W.len, W.thick, W.thick);
  return out;
}

/* ---------------------------------------------------------
   Performance: dance. Each performer is one ribbon of lines.
   Why a line: when a dance is motion-captured, the body disappears and
     only the paths of its movement remain as data (as in Ghostcatching,
     Kaiser & Eshkar with Bill T. Jones, 1999). What a performance leaves
     for the archive is that trace, so the performer is drawn as it.
   Why a ribbon that twists: Loïe Fuller's Serpentine Dance (1891) turned a
     dancer's spins into spiralling fabric under electric light, one of the
     first media performances. Here a turn of the body rolls the ribbon.
   Why these shapes: Rudolf Laban's trace forms, the basic paths a body
     draws in its kinesphere: circle, spiral, wave, figure of eight.
   Why these places: the score walks the stage clockwise through four places
     (front, right, back, left), one 8-count phrase at each.
   Why this rhythm: a performance follows a score; here the score counts in
     beats (BPM) and 8-count phrases, with an accent on each beat.
   --------------------------------------------------------- */
const FIGURES = ['circle', 'spiral', 'snake', 'eight'];
// The score: four places on the stage, visited in a fixed clockwise order, one 8-count each,
// and at each place always the same figure. 32 counts make one round, then it repeats.
//   front → circle   right → spiral   back → wave   left → figure 8
const SCORE = [{ area: 0, figure: 'circle' }, { area: 1, figure: 'spiral' }, { area: 2, figure: 'snake' }, { area: 3, figure: 'eight' }];
const SCORE_TURN = SCORE.map(x => ({ area: x.area, figure: x.figure, turn: 1 }));
function danceSeq(d, k) { return SCORE_TURN[((k % 4) + 4) % 4]; }
const FIG1 = [0, 0, 0], FIG2 = [0, 0, 0];
const setF = (o, x, y, z) => { o[0] = x; o[1] = y; o[2] = z; return o; };
function figureAt(fig, tau, u, R, turn, o) {
  // the four basic figures; slow, long loops so the ribbon flows instead of jerking
  const TAU = Math.PI * 2;
  if (fig === 'circle') { const a = TAU * tau / 8 * turn; return setF(o, R * Math.cos(a), R * 0.8 * Math.sin(a), R * 0.3 * Math.sin(a * 0.5)); } // one wide loop per 8 counts
  if (fig === 'spiral') { const a = TAU * tau / 6 * turn, rr = R * (0.55 + 0.45 * Math.sin(Math.PI * u)); return setF(o, rr * Math.cos(a), R * 0.7 * Math.sin(TAU * tau / 16), rr * Math.sin(a)); } // flat loops that swell and settle
  if (fig === 'snake') return setF(o, R * 0.35 * Math.sin(TAU * tau / 16), R * 0.6 * Math.sin(TAU * tau / 4), R * 0.7 * Math.sin(TAU * tau / 8) * turn); // a slow wave
  const a = TAU * tau / 8 * turn; return setF(o, R * 1.1 * Math.sin(a), R * 0.7 * Math.sin(a) * Math.cos(a), R * 0.4 * Math.cos(a));  // figure 8 over 8 counts
}
const dvA = new THREE.Vector3(), dvB = new THREE.Vector3(), dvC = new THREE.Vector3(), dvD = new THREE.Vector3();
function danceHead(g, d, T, out) {
  // position of the performer's hand (the ribbon's head) at time T, and the twist angle
  const p = g.p, S = g.stage, beat = 60 / p.bpm, B = T / beat + d.delay;
  const b = Math.floor(B), f = B - b, acc = Math.min(0.9, p.accent);
  const tau = b + f + (acc / (2 * Math.PI)) * Math.sin(2 * Math.PI * f); // accent 0 = an even, flowing pace
  const k = Math.floor(tau / 8), u = (tau - 8 * k) / 8;
  const A = i => S.areas[danceSeq(d, i).area];
  // travel between areas with a continuous Catmull-Rom path, one area per 8 counts
  const P0 = A(k - 1), P1 = A(k), P2 = A(k + 1), P3 = A(k + 2), e = u;
  const cr = (a, b2, c, dd) => 0.5 * (2 * b2 + (-a + c) * e + (2 * a - 5 * b2 + 4 * c - dd) * e * e + (-a + 3 * b2 - 3 * c + dd) * e * e * e);
  out.set(cr(P0.x, P1.x, P2.x, P3.x), cr(P0.y, P1.y, P2.y, P3.y), cr(P0.z, P1.z, P2.z, P3.z));
  const R = S.R, cur = danceSeq(d, k), nxt = danceSeq(d, k + 1);
  const f1 = figureAt(cur.figure, tau, u, R, cur.turn, FIG1), f2 = figureAt(nxt.figure, tau, 0, R, nxt.turn, FIG2);
  const w = THREE.MathUtils.smootherstep(u, 0.4, 1); // the second half of each phrase eases into the next figure
  out.x += f1[0] * (1 - w) + f2[0] * w; out.y += f1[1] * (1 - w) + f2[1] * w; out.z += f1[2] * (1 - w) + f2[2] * w;
  out.x *= d.mirror;
  out.add(d.offset).add(S.o);
  // the body turns a quarter turn on every beat (× twist), so the ribbon rolls with it
  return Math.PI * p.twist * tau * 0.25; // one steady direction, so the twist never jumps
}
function buildDance(g, base, W0) {
  const p = g.p, n = p.count, sp = p.spread;
  // four places around the centre of the stage: front, right, back, left
  const areas = [new THREE.Vector3(0, -W0 * 0.08 * sp, W0 * 0.45 * sp), new THREE.Vector3(W0 * 0.48 * sp, 0, 0), new THREE.Vector3(0, W0 * 0.08 * sp, -W0 * 0.45 * sp), new THREE.Vector3(-W0 * 0.48 * sp, 0, 0)];
  g.stage = { o: base.clone(), areas, R: W0 * 0.3 * p.amplitude };
  g.dancers = [];
  for (let i = 0; i < n; i++) {
    const mode = p.behaviour;
    // canon: each performer starts one place (8 counts) later, so four performers fill all four places at once
    // unison: everyone dances the same score side by side
    // mirror: every second performer dances the score left-right reversed
    const delay = mode === 'canon' ? -i * 8 : 0;
    const offset = mode === 'unison' ? new THREE.Vector3((i - (n - 1) / 2) * W0 * 0.25, 0, 0) : mode === 'mirror' ? new THREE.Vector3(0, 0, (Math.floor(i / 2)) * -W0 * 0.2) : new THREE.Vector3();
    g.dancers.push({ delay, offset, mirror: mode === 'mirror' && i % 2 === 1 ? -1 : 1, hue: n > 1 ? i / (n - 1) : 0 });
  }
  const maxS = 2 + Math.round(p.strands);
  // one opacity per layer: the ribbon fades by colour (toward the background), not in steps, so it never looks chopped
  g.dEdge = makeDyn(g, BRAND.LINE.px, n * 2 * 400 + 8, 1, 2);
  g.dInner = makeDyn(g, BRAND.LINE.linkPx, n * maxS * 400 + 8, 1, 1);
  g.update = updateDance;
}
const rbP = [], rbW = [];
for (let i = 0; i < 402; i++) { rbP.push(new THREE.Vector3()); rbW.push(new THREE.Vector3()); }
const rbT = new THREE.Vector3(), rbN = new THREE.Vector3(), rbB = new THREE.Vector3(), rbUp = new THREE.Vector3(), rbX = new THREE.Vector3(1, 0, 0), rbY = new THREE.Vector3(0, 1, 0);
const rbQ1 = new THREE.Vector3(), rbQ2 = new THREE.Vector3(), rbRoll = new Float64Array(402);
function updateDance(g, T) {
  const p = g.p, beat = 60 / p.bpm, L = Math.min(400, Math.max(8, Math.round((p.ribbon * beat) / 0.012)));
  const dt = (p.ribbon * beat) / L, half = g.stage.R * 0.32 * p.ribbonWidth, m = Math.max(1, Math.round(p.strands));
  [g.dEdge, g.dInner].forEach(dynBegin);
  g.dancers.forEach(d => {
    // sample the path behind the head, and a twisting width vector at each point
    const roll = rbRoll;
    for (let k = 0; k <= L; k++) roll[k] = danceHead(g, d, T - k * dt, rbP[k]);
    for (let k = 0; k <= L; k++) {
      // the ribbon's width follows the turning of the body over time (the roll), not the bends of
      // the path, so it never flips when the path loops back on itself
      const age = k / L, taper = Math.min(1, (1 - age) * 5) * Math.min(1, 0.35 + age * 6), r = roll[k];
      rbW[k].copy(rbY).multiplyScalar(Math.cos(r)).addScaledVector(rbB.set(0.8, 0, 0.6), Math.sin(r)).multiplyScalar(half * taper);
    }
    for (let k = L - 1; k >= 0; k--) { // tail first, so the bright head is drawn on top
      const age = k / L, bk = 0;
      const fade = Math.min(0.97, Math.pow(age, 1.1) / Math.max(0.3, p.echoOpacity) * (0.6 + 0.4 * (p.air ?? 0.5)));
      const c = airy(gcol(g, age * p.colorShift * 0.8 + d.hue * 0.25), fade);
      for (let j = -m; j <= m; j++) {
        const s = j / m;
        rbQ1.copy(rbP[k]).addScaledVector(rbW[k], s);
        rbQ2.copy(rbP[k + 1]).addScaledVector(rbW[k + 1], s);
        dynSeg(Math.abs(j) === m ? g.dEdge : g.dInner, bk, rbQ1, rbQ2, c);
      }
    }
  });
  g.dEdge.alpha[0] = 0.95; g.dInner.alpha[0] = 0.55;
  [g.dEdge, g.dInner].forEach(dynEnd);
}

/* =========================================================
   Motion grammars for box units: every state is a pure function of time
   ========================================================= */
function cycleLength(u) {
  const p = u.p, seg = p.duration + p.interval;
  switch (u.cat.motion) {
    case 'swing': return 7 * seg;
    case 'spin': return p.duration * 4;
    case 'format': return (u.keys.length - 1) * seg;
    default: return seg;
  }
}
function schedule(g) {
  g.units.forEach((u, i) => {
    const p = u.p, C = cycleLength(u);
    if (u.cat.motion === 'spin' || u.cat.motion === 'arm') u.off = 0;
    else if (p.behaviour === 'sequential') u.off = i * p.duration * 0.3;
    else if (p.behaviour === 'sync') u.off = 0;
    else u.off = seeded(u.order * 31 + i + 1) * C;
  });
}

const tmpE = new THREE.Euler();
function sampleKeys(u, time, out, easing, curved) {
  const p = u.p, seg = p.duration + p.interval, C = cycleLength(u), lastSeg = u.keys.length - 2;
  const tt = ((time % C) + C) % C;
  const i = Math.min(lastSeg, Math.floor(tt / seg));
  const local = tt - i * seg;
  const from = u.keys[i], to = u.keys[i + 1];
  const e = local >= p.duration ? 1 : easing(local / p.duration);
  if (curved) {
    const dx = to.pos.x - from.pos.x, dy = to.pos.y - from.pos.y, Ln = Math.hypot(dx, dy) || 1;
    const bend = 0.3 * Ln * u.curveSign * (i % 2 ? -1 : 1);
    const cx = (from.pos.x + to.pos.x) / 2 + (dy / Ln) * bend, cy = (from.pos.y + to.pos.y) / 2 - (dx / Ln) * bend, cz = (from.pos.z + to.pos.z) / 2 + 0.15 * Ln;
    out.pos.set(
      (1 - e) * (1 - e) * from.pos.x + 2 * (1 - e) * e * cx + e * e * to.pos.x,
      (1 - e) * (1 - e) * from.pos.y + 2 * (1 - e) * e * cy + e * e * to.pos.y,
      (1 - e) * (1 - e) * from.pos.z + 2 * (1 - e) * e * cz + e * e * to.pos.z);
  } else out.pos.lerpVectors(from.pos, to.pos, e);
  out.q.slerpQuaternions(from.q, to.q, e);
  out.dims.lerpVectors(from.dims, to.dims, e);
  return out;
}
function sampleState(u, time, out) {
  const p = u.p, motion = u.cat.motion, C = cycleLength(u);
  if (motion === 'swing') {
    sampleKeys(u, time, out, easeInOut, p.path === 'curve');
    if (p.quant) {
      const q = THREE.MathUtils.degToRad(p.quant);
      tmpE.setFromQuaternion(out.q, 'YXZ');
      tmpE.set(Math.round(tmpE.x / q) * q, Math.round(tmpE.y / q) * q, Math.round(tmpE.z / q) * q, 'YXZ');
      out.q.setFromEuler(tmpE);
    }
    return out;
  }
  if (motion === 'arm') return walkState(u, time, out);
  if (motion === 'format') {
    sampleKeys(u, time, out, easeSnap, true); // moves and resizes in one clean sweep
    if (u.g && u.g.follower) out.pos.multiplyScalar(0.3); // following another category: stay close around it
    return out;
  }
  if (motion === 'spin') {
    const ph = time / C + u.phase, a = Math.PI * 2 * ph, tilt = THREE.MathUtils.degToRad(p.tilt);
    out.pos.copy(u.E);
    out.q.setFromEuler(new THREE.Euler(tilt * Math.sin(a), tilt * 0.5 * Math.cos(a), a * p.spin, 'XYZ'));
    out.dims.copy(u.dims);
    return out;
  }
  out.pos.copy(u.E); out.q.identity(); out.dims.copy(u.dims);
  return out;
}

/* =========================================================
   Colours: the category gradient (or white lines)
   ========================================================= */
function colorsFor(u) {
  const key = `${u.p.reverse}|${u.p.lineColor}`;
  if (u._col && u._colKey === key) return u._col;
  let list = catColors(u.cat).map(h => new THREE.Color(h)), stops = u.cat.stops || list.map((_, i) => i / (list.length - 1));
  if (u.p.reverse) { list = list.reverse(); stops = stops.map(x => 1 - x).reverse(); }
  if (u.p.lineColor === 'white') { list = [new THREE.Color('#FFFFFF'), new THREE.Color('#FFFFFF')]; stops = [0, 1]; }
  u._col = { A: list[0], B: list[list.length - 1], list, stops }; u._colKey = key;
  return u._col;
}

/* =========================================================
   Camera
   ========================================================= */
const drag = { yaw: 0, pitch: 0, ty: 0, tp: 0, vy: 0, vp: 0, active: false, last: null, releasedAt: 0, start: null };
function resetView() { drag.ty = drag.tp = drag.vy = drag.vp = 0; }
canvas.addEventListener('pointerdown', e => { drag.active = true; drag.vy = 0; drag.vp = 0; drag.last = [e.clientX, e.clientY]; drag.start = [e.clientX, e.clientY]; drag.yaw0 = drag.ty; drag.pitch0 = drag.tp; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  if (!drag.active) return;
  const dy = -(e.clientX - drag.last[0]) * 0.005, dp = -(e.clientY - drag.last[1]) * 0.005;
  drag.ty += dy; drag.tp = THREE.MathUtils.clamp(drag.tp + dp, -1.2, 1.2);
  drag.vy = drag.vy * 0.5 + dy * 0.5; drag.vp = drag.vp * 0.5 + dp * 0.5; // remembered for the glide after release
  drag.last = [e.clientX, e.clientY];
});
const endDrag = () => { if (drag.active) { drag.active = false; drag.releasedAt = performance.now(); } };
const raycaster = new THREE.Raycaster(), stagePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
function placeAt(clientX, clientY) {
  if (!state.edit || !state.on.has(state.edit)) return;
  const rect = canvas.getBoundingClientRect();
  const nx = ((clientX - rect.left) / rect.width) * 2 - 1, ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
  updateCamera(camTime);
  raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
  const hit = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(stagePlane, hit)) return;
  const { Ws, Hs } = stageDims(), p = P();
  p.posX = THREE.MathUtils.clamp(hit.x / Ws + 0.5, 0.05, 0.95);
  p.posY = THREE.MathUtils.clamp(0.5 - hit.y / Hs, 0.05, 0.95);
  syncSidebar();
  rebuildCategory(state.edit);
  playing = true; updatePlayIcon();
}
canvas.addEventListener('pointerup', e => {
  const moved = drag.start ? Math.hypot(e.clientX - drag.start[0], e.clientY - drag.start[1]) : 99;
  endDrag();
  if (moved < 5) { drag.ty = drag.yaw0; drag.tp = drag.pitch0; drag.vy = drag.vp = 0; placeAt(e.clientX, e.clientY); }
});
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  state.camDist = Math.round(THREE.MathUtils.clamp(state.camDist * Math.exp(e.deltaY * 0.0015), 0.15, 2.5) * 100) / 100;
  syncSidebar();
}, { passive: false });

function orbitPoint(target, yaw, pitch, dist) {
  return new THREE.Vector3(
    target.x + Math.sin(yaw) * Math.cos(pitch) * dist,
    target.y + Math.sin(pitch) * dist,
    target.z + Math.cos(yaw) * Math.cos(pitch) * dist);
}
const camSample = { pos: new THREE.Vector3(), q: new THREE.Quaternion(), dims: new THREE.Vector3() };
let camFront = 0;
function firstUnit() { for (const id of CAT_ORDER) if (groups[id] && groups[id].units.length) return groups[id].units[0]; return null; }

function updateCamera(time) {
  const { Ws, Hs, D } = stageDims();
  const T = new THREE.Vector3(), dist = state.camDist, wRef = Ws * 0.46;
  let pos, look;
  const frontPos = new THREE.Vector3(0, 0, D * dist), frontLook = new THREE.Vector3();
  if (state.camera === 'front') { pos = frontPos.clone(); look = frontLook.clone(); }
  else if (state.camera === 'low') {
    const sway = Math.sin(time * 0.2) * 0.05;
    const tanH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * camera.aspect;
    look = T.clone().add(new THREE.Vector3(-0.2 * wRef, 0.03 * wRef, -0.25 * wRef));
    pos = orbitPoint(T, THREE.MathUtils.degToRad(24) + sway, THREE.MathUtils.degToRad(-19), Math.max(1.9 * wRef, (0.75 * wRef) / tanH) * dist);
  } else if (state.camera === 'side') {
    const drift = Math.sin(time * 0.18) * 0.08;
    pos = orbitPoint(T, THREE.MathUtils.degToRad(78) + drift, THREE.MathUtils.degToRad(-6), 2.2 * wRef * dist);
    look = T.clone().add(new THREE.Vector3(0, 0, -0.15 * wRef));
  } else if (state.camera === 'orbit') {
    pos = orbitPoint(T, THREE.MathUtils.degToRad(35) * Math.sin(time * 0.3), THREE.MathUtils.degToRad(-8), D * 0.75 * dist);
    look = T.clone();
  } else {
    const u = firstUnit();
    const H = u ? sampleState(u, gtime(u.g) - u.off, camSample).pos.clone() : T.clone();
    pos = H.clone().add(new THREE.Vector3(Ws * 0.12, -Hs * 0.18, D * 0.45 * dist));
    look = H.clone().lerp(u ? u.E : T, 0.5);
  }
  if (state.returnFront) {
    const u = firstUnit();
    let resting = false;
    if (u && u.keys) {
      const seg = u.p.duration + u.p.interval, C = cycleLength(u), tt = (((gtime(u.g) - u.off) % C) + C) % C;
      resting = tt - Math.floor(tt / seg) * seg > u.p.duration;
    }
    camFront += ((resting ? 1 : 0) - camFront) * 0.06;
    pos.lerp(frontPos, camFront); look.lerp(frontLook, camFront);
  }
  if (!drag.active && !exporting) { // glide on after release, then settle where it was left
    drag.ty += drag.vy; drag.tp = THREE.MathUtils.clamp(drag.tp + drag.vp, -1.2, 1.2);
    drag.vy *= 0.93; drag.vp *= 0.93;
  }
  if (exporting) { drag.yaw = drag.ty; drag.pitch = drag.tp; }
  else { drag.yaw += (drag.ty - drag.yaw) * 0.14; drag.pitch += (drag.tp - drag.pitch) * 0.14; }
  if (drag.yaw || drag.pitch) {
    const off = pos.clone().sub(look);
    off.applyAxisAngle(new THREE.Vector3(0, 1, 0), drag.yaw);
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), off).normalize();
    off.applyAxisAngle(right, drag.pitch);
    pos = look.clone().add(off);
  }
  const pan = new THREE.Vector3(state.panX * Ws * 0.3, state.panY * Hs * 0.3, 0);
  camera.position.copy(pos.add(pan));
  camera.lookAt(look.add(pan));
  camera.updateMatrixWorld();
}

/* =========================================================
   Frame update: echoes are past states of each box
   ========================================================= */
const sA = { pos: new THREE.Vector3(), q: new THREE.Quaternion(), dims: new THREE.Vector3() };
const sPrev = { pos: new THREE.Vector3(), q: new THREE.Quaternion(), dims: new THREE.Vector3() };
const tmpColor = new THREE.Color(), UP = new THREE.Vector3(0, 1, 0);

/* =========================================================
   Harmony: when several categories are on, they act as one piece
   - one beat: every category's rhythm is stretched so its changes land on the leader's beat
   - one space: objects ride along with the leader's movement; endless fields become a quieter background
   - one palette: each gradient ends on the next category's colour
   ========================================================= */
const harmony = { partner: {}, leader: null };
const FIELDS = new Set(['grid', 'net']);
function naturalPeriod(g) {
  const p = g.p;
  switch (g.cat.motion) {
    case 'swing': case 'format': case 'arm': return p.duration + p.interval;
    case 'spin': return p.duration;
    case 'net': return p.duration * 2.2;
    case 'grid': return p.tick * 8;
    default: return 1;
  }
}
const gtime = g => (clock - g.t0) * g.tscale + (g.phase || 0);
const lead = { pos: new THREE.Vector3(), q: new THREE.Quaternion(), dims: new THREE.Vector3() }, leadOff = new THREE.Vector3();
function setRole(g, role) {
  // the leader draws on top; others sit behind it
  if (g.role === role) return;
  g.role = role;
  const shift = role === 'follow' ? -20000 : 0;
  g.units.forEach(u => u.meshes.forEach((m, i) => { m.renderOrder = shift + u.order * 1000 + (MAX_ECHO - i); }));
  g.dyn.forEach(d => d.layers.forEach((l, b) => { l.mesh.renderOrder = shift - 10000 + g.order * 1000 + b; }));
}
function updateHarmony() {
  const on = [...state.on].filter(id => groups[id]);
  const reset = g => { g.follower = false; g.tscale = 1; g.phase = 0; g.dim = 1; g.echoMul = 1; g.group.position.set(0, 0, 0); g.group.scale.setScalar(1); setRole(g, 'lead'); };
  if (on.length < 2) { on.forEach(id => reset(groups[id])); harmony.leader = null; return; }
  const objects = on.filter(id => !FIELDS.has(groups[id].cat.motion));
  const leaderId = objects[0] || on[0], L = groups[leaderId];
  harmony.leader = leaderId;
  reset(L);
  const beat = naturalPeriod(L), { Ws } = stageDims(), W0 = 0.46 * Ws;
  leadOff.set(0, 0, 0);
  if (L.units.length) { const u = L.units[0]; sampleState(u, gtime(L) - u.off, lead); leadOff.copy(lead.pos).sub(u.E); }
  // objects share the stage side by side, a little smaller, the leader on the left
  const slotted = objects.filter(id => id === leaderId || groups[id].cat.motion !== 'format');
  const nObj = slotted.length, gapX = W0 * (nObj === 2 ? 0.62 : 0.5), k = nObj > 1 ? (nObj === 2 ? 0.78 : 0.66) : 1;
  const slotX = i => (i - (nObj - 1) / 2) * gapX;
  if (nObj > 1) { L.group.scale.setScalar(k); L.group.position.set(slotX(0), 0, 0); }
  let j = 0;
  on.forEach(id => {
    if (id === leaderId) return;
    const g = groups[id], P = naturalPeriod(g);
    const target = P >= beat ? beat * Math.max(1, Math.round(P / beat)) : beat / Math.max(1, Math.round(beat / P));
    g.tscale = P / target;                 // its period fits the leader's beat…
    g.phase = beat * 0.5 * g.tscale;       // …but it moves on the off-beat, answering the leader
    setRole(g, 'follow');
    if (FIELDS.has(g.cat.motion)) { g.follower = false; g.dim = objects.length ? 0.5 : 1; g.echoMul = 1; g.group.position.set(0, 0, 0); return; }
    if (g.cat.motion !== 'format') j++;
    g.follower = true; g.dim = 1;
    g.echoMul = 0.5;                       // its trail is lighter, its outline stays at full colour
    // beside and behind the leader, so the two never sit on top of each other
    // a sheet (digital image) stays behind the leader as its backdrop; other objects take the next slot
    const off = g.cat.motion === 'format' ? new THREE.Vector3(slotX(0), 0, -W0 * 0.5) : new THREE.Vector3(slotX(j), -W0 * 0.05 * j, -W0 * 0.3);
    g.group.scale.setScalar(g.cat.motion === 'format' ? 1 : k);
    g.follow.lerp(off.add(leadOff.clone().multiplyScalar(k * 0.5)), exporting || offline ? 1 : 0.08);
    g.group.position.copy(g.follow);
  });
  on.forEach(id => groups[id].dyn.forEach(d => { d.mul = groups[id].dim; }));
}
function updateUnits() {
  updateHarmony();
  Object.values(groups).forEach(g => {
    g.units.forEach(u => {
      // digital image draws no trail: the sheet simply shrinks and grows (trails belong to moving image)
      const p = u.p, Lh = u.cat.motion === 'format' ? 1 : Math.min(MAX_ECHO, p.echoLength), dt = BRAND.ECHO.spacing / p.echoDensity;
      const focus = camera.position.distanceTo(u.E), fade = p.distanceFade, col = colorsFor(u);
      let havePrev = false;
      for (let k = 0; k < MAX_ECHO; k++) {
        const m = u.meshes[k];
        if (k >= Lh) { m.visible = false; continue; }
        sampleState(u, gtime(g) - u.off - k * dt, sA);
        if (k > 0 && havePrev) {
          const moved = sA.pos.distanceTo(sPrev.pos) / u.w + (1 - Math.abs(sA.q.dot(sPrev.q))) * 40 + sA.dims.distanceTo(sPrev.dims) / u.w;
          if (moved < 0.004) { m.visible = false; continue; }
        }
        sPrev.pos.copy(sA.pos); sPrev.q.copy(sA.q); sPrev.dims.copy(sA.dims); havePrev = true;
        m.visible = true;
        m.position.copy(sA.pos); m.quaternion.copy(sA.q); m.scale.copy(sA.dims);
        const age = k / Lh;
        m.material.color.copy(tmpColor.copy(col.A).lerp(col.B, age * p.colorShift));
        if (k === 0) { m.material.opacity = BRAND.ECHO.headOpacity; continue; }
        const near = THREE.MathUtils.clamp((focus + fade - camera.position.distanceTo(sA.pos)) / fade, 0, 1);
        airy(m.material.color, (p.air ?? 0) * (0.85 * Math.pow(age, 0.7) + 0.35 * (1 - near)));
        m.material.opacity = Math.min(1, BRAND.ECHO.echoBase * Math.pow(1 - age, BRAND.ECHO.falloff)
          * (BRAND.ECHO.nearMin + (1 - BRAND.ECHO.nearMin) * near) * p.echoOpacity * (g.echoMul ?? 1));
      }
    });
    if (g.update) g.update(g, gtime(g));
  });
}

function renderFrame(time) {
  bgCol.set(state.bg);
  renderer.setClearColor(state.bg, 1);
  updateCamera(time);
  updateUnits();
  renderer.render(scene, camera);
}

let last = performance.now(), camTime = 0, timeScale = 1;
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!offline) {
    // while the view is being turned, motion slows to a faint drift
    const turning = drag.active || Math.abs(drag.vy) + Math.abs(drag.vp) > 0.0005;
    timeScale += ((turning ? 0.1 : 1) - timeScale) * (turning ? 0.2 : 0.04);
    if (playing) clock += dt * timeScale;
    camTime += dt * timeScale;
    renderFrame(camTime);
  }
  requestAnimationFrame(loop);
}

/* =========================================================
   Controls
   ========================================================= */
const playBtn = document.getElementById('playBtn');
function updatePlayIcon() {
  document.getElementById('pIcon1').style.display = playing ? '' : 'none';
  document.getElementById('pIcon2').style.display = playing ? '' : 'none';
  document.getElementById('playIcon').style.display = playing ? 'none' : '';
  playBtn.setAttribute('aria-label', t(playing ? 'pause' : 'play'));
}
function togglePlay() { if (recording) return; playing = !playing; updatePlayIcon(); }
function replay() { if (recording) return; clock = 0; playing = true; updatePlayIcon(); }
playBtn.addEventListener('click', togglePlay);
document.getElementById('replayBtn').addEventListener('click', replay);
const CAMS = ['low', 'side', 'orbit', 'fly', 'front'];
window.addEventListener('keydown', e => {
  if (e.target.closest('input, select, textarea')) return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  else if (e.key === 'r' || e.key === 'R') replay();
  else if (e.key === 'c' || e.key === 'C') { state.camera = CAMS[(CAMS.indexOf(state.camera) + 1) % CAMS.length]; resetView(); syncSidebar(); }
});

/* =========================================================
   Export
   ========================================================= */
const toastEl = document.getElementById('toast');
function toast(msg, ms = 2200) { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => { toastEl.hidden = true; }, ms); }
function fileName(ext) {
  const names = CAT_ORDER.filter(id => state.on.has(id)).join('-') || 'empty';
  const d = new Date(), z = n => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`;
  return `material-media_${names}_${stamp}.${ext}`;
}
function download(href, name) { const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
function lockExport(on) {
  ['exportPng', 'exportMp4', 'exportSvg'].forEach(id => { const b = document.getElementById(id); if (b) b.disabled = on; });
  const mp4 = document.getElementById('exportMp4');
  if (mp4) mp4.textContent = on ? t('exporting') : t('exportMp4');
}
const QUALITY = {
  standard: { png: 1, mbps: [16, 40], offline: false },
  high: { png: 2, mbps: [40, 100], offline: true },
  max: { png: 4, mbps: [80, 160], offline: true },
};
function pngScale(W, H) { return Math.max(1, Math.min(QUALITY[state.exportQuality].png, Math.floor(8192 / Math.max(W, H)))); }
function withExportSize(fn, scale = 1) {
  const [W0, H0] = BRAND.EXPORT_SIZES[state.exportSize];
  const W = W0 * scale, H = H0 * scale;
  exporting = true;
  setRenderSize(W, H, 1, false);
  renderFrame(camTime);
  const result = fn(W, H);
  exporting = false;
  resize();
  return result;
}
function guardEmpty() { if (!state.on.size) { toast(t('nothingToExport')); return true; } return false; }

function exportPNG() {
  if (guardEmpty()) return;
  const [W0, H0] = BRAND.EXPORT_SIZES[state.exportSize];
  withExportSize(() => { download(renderer.domElement.toDataURL('image/png'), fileName('png')); }, pngScale(W0, H0));
  toast(t('exported'));
}

async function exportVideo() {
  if (recording || guardEmpty()) return;
  if (QUALITY[state.exportQuality].offline && window.VideoEncoder) {
    const ok = await exportVideoOffline();
    if (ok) return;
  }
  exportVideoRealtime();
}
// High quality: render every frame on its own (no dropped frames), encode with WebCodecs, pack into MP4
async function exportVideoOffline() {
  const [W, H] = BRAND.EXPORT_SIZES[state.exportSize];
  const fps = 60, total = Math.round(state.exportDuration * fps), big = W * H > 1920 * 1080;
  const bitrate = QUALITY[state.exportQuality].mbps[big ? 1 : 0] * 1e6;
  const candidates = [{ codec: big ? 'avc1.640033' : 'avc1.640028', mux: 'avc' }, { codec: 'vp09.00.51.08', mux: 'vp9' }];
  let pick = null;
  for (const c of candidates) {
    try { if ((await VideoEncoder.isConfigSupported({ codec: c.codec, width: W, height: H, bitrate, framerate: fps })).supported) { pick = c; break; } } catch (e) { /* next */ }
  }
  if (!pick) return false;
  let Muxer, ArrayBufferTarget;
  try { ({ Muxer, ArrayBufferTarget } = await import('mp4-muxer')); } catch (e) { return false; }
  recording = true; offline = true; exporting = true; lockExport(true);
  const wasPlaying = playing;
  setRenderSize(W, H, 1, false);
  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: pick.mux, width: W, height: H, frameRate: fps }, fastStart: 'in-memory' });
  let failed = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => { failed = e; } });
  enc.configure({ codec: pick.codec, width: W, height: H, bitrate, framerate: fps, latencyMode: 'quality', bitrateMode: 'variable' });
  const btn = document.getElementById('exportMp4');
  try {
    for (let i = 0; i < total && !failed; i++) {
      clock = i / fps;
      renderFrame(i / fps);
      const frame = new VideoFrame(renderer.domElement, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
      enc.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      if (i % 15 === 0) { if (btn) btn.textContent = `${t('exporting')} ${Math.round((i / total) * 100)}%`; await new Promise(r => setTimeout(r, 0)); }
      while (enc.encodeQueueSize > 8) await new Promise(r => setTimeout(r, 2));
    }
    await enc.flush();
    if (failed) throw failed;
    muxer.finalize();
    const url = URL.createObjectURL(new Blob([muxer.target.buffer], { type: 'video/mp4' }));
    download(url, fileName('mp4'));
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast(pick.mux === 'avc' ? t('exported') : t('vp9Note'), pick.mux === 'avc' ? 2200 : 5000);
  } catch (e) {
    toast(t('exportFailed'), 4000);
  } finally {
    try { enc.close(); } catch (e) { /* closed */ }
    offline = false; recording = false; exporting = false; playing = wasPlaying;
    lockExport(false); resize(); updatePlayIcon();
  }
  return true;
}
function exportVideoRealtime() {
  if (!window.MediaRecorder) return;
  const candidates = ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  const mime = candidates.find(m => MediaRecorder.isTypeSupported(m));
  if (!mime) return;
  const isMp4 = mime.startsWith('video/mp4');
  const [W, H] = BRAND.EXPORT_SIZES[state.exportSize];
  recording = true; lockExport(true);
  setRenderSize(W, H, 1, false);
  clock = 0; playing = true; updatePlayIcon();
  const rec = new MediaRecorder(renderer.domElement.captureStream(60), { mimeType: mime, videoBitsPerSecond: QUALITY[state.exportQuality].mbps[W * H > 1920 * 1080 ? 1 : 0] * 1e6 });
  const chunks = [];
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  rec.onstop = () => {
    const url = URL.createObjectURL(new Blob(chunks, { type: mime.split(';')[0] }));
    download(url, fileName(isMp4 ? 'mp4' : 'webm'));
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    recording = false; lockExport(false); resize();
    toast(isMp4 ? t('exported') : t('mp4Fallback'), isMp4 ? 2200 : 4500);
  };
  rec.start();
  setTimeout(() => rec.stop(), state.exportDuration * 1000);
}

function exportSVG() {
  if (guardEmpty()) return;
  const svg = withExportSize((W, H) => {
    const sc = Math.min(W, H) / BRAND.LINE.basis;
    const v = new THREE.Vector3(), w2 = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
    const toScreen = (src, out) => {
      w2.copy(src).applyMatrix4(camera.matrixWorldInverse);
      if (w2.z > -camera.near) return false;
      out.copy(src).project(camera);
      out.set((out.x + 1) / 2 * W, (1 - out.y) / 2 * H, 0);
      return true;
    };
    const seg = () => `<line x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}"/>`;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n<rect width="100%" height="100%" fill="${state.bg}"/>\n`;
    scene.updateMatrixWorld(true);
    CAT_ORDER.filter(id => groups[id]).forEach(id => {
      const g = groups[id];
      s += `<g id="${id}">\n`;
      g.dyn.forEach((d, di) => d.layers.forEach((l, li) => {
        if (!l.mesh.visible) return;
        let lines = '';
        const hex = (r, gg, bb) => '#' + tmpColor.setRGB(r, gg, bb).getHexString();
        for (let k = 0; k < l.n; k++) {
          const i = k * 6;
          v.set(l.pos[i], l.pos[i + 1], l.pos[i + 2]); const ok1 = toScreen(v, a);
          v.set(l.pos[i + 3], l.pos[i + 4], l.pos[i + 5]); const ok2 = toScreen(v, b);
          if (ok1 && ok2) lines += `<line x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}" stroke="${hex(l.col[i], l.col[i + 1], l.col[i + 2])}"/>`;
        }
        if (lines) s += `<g id="${id}-d${di + 1}-${li + 1}" stroke-opacity="${l.mesh.material.opacity.toFixed(3)}" stroke-width="${(d.px * sc).toFixed(2)}" stroke-linecap="round" fill="none">${lines}</g>\n`;
      }));
      g.units.forEach((u, ui) => {
        for (let i = u.meshes.length - 1; i >= 0; i--) {
          const m = u.meshes[i];
          if (!m.visible) continue;
          let lines = '';
          for (let k = 0; k < UNIT_EDGES.length; k += 6) {
            v.set(UNIT_EDGES[k], UNIT_EDGES[k + 1], UNIT_EDGES[k + 2]).applyMatrix4(m.matrixWorld); const ok1 = toScreen(v, a);
            v.set(UNIT_EDGES[k + 3], UNIT_EDGES[k + 4], UNIT_EDGES[k + 5]).applyMatrix4(m.matrixWorld); const ok2 = toScreen(v, b);
            if (ok1 && ok2) lines += seg();
          }
          if (lines) s += `<g id="${id}-u${ui + 1}-${i === 0 ? 'screen' : `echo-${String(i).padStart(3, '0')}`}" stroke="#${m.material.color.getHexString()}" stroke-opacity="${m.material.opacity.toFixed(3)}" stroke-width="${(BRAND.LINE.px * sc).toFixed(2)}" stroke-linecap="round" fill="none">${lines}</g>\n`;
        }
      });
      s += '</g>\n';
    });
    return s + '</svg>\n';
  });
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  download(url, fileName('svg'));
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast(t('exported'));
}

/* =========================================================
   Start: nothing is drawn until a category is checked
   ========================================================= */
applyLang();
resize();
rebuild();
canvas.style.background = state.bg;
requestAnimationFrame(loop);
window.__mm = {
  state, toggleCategory, setCat, setGlobal,
  get clock() { return clock; }, set clock(v) { clock = v; },
  pause() { playing = false; updatePlayIcon(); }, exportSVG, get groups() { return groups; }, renderFrame,
};
