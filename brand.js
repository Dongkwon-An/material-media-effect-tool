// Material Media — brand constants. Every part of the tool reads from this file.

export const BACKGROUND = '#FFFFFF';

// Background palette: white, light grey, black and the 8 key colours
export const BACKGROUNDS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Light Grey', hex: '#EBEBEB' },
  { name: 'Black', hex: '#000000' },
  { name: 'Material Blue', hex: '#005BD5' },
  { name: 'Material Electric Violet', hex: '#7E00FF' },
  { name: 'Material Hot Magenta', hex: '#F902A5' },
  { name: 'Material Signal Red', hex: '#EB3328' },
  { name: 'Material Tangerine', hex: '#F08F35' },
  { name: 'Material Saffron', hex: '#F8CE47' },
  { name: 'Material Acid Yellow', hex: '#E6E938' },
  { name: 'Material Aqua Mint', hex: '#02FBCA' },
];

export const KEY_COLORS = [
  { id: 'blue', name: 'Material Blue', hex: '#005BD5' },
  { id: 'electric-violet', name: 'Material Electric Violet', hex: '#7E00FF' },
  { id: 'hot-magenta', name: 'Material Hot Magenta', hex: '#F902A5' },
  { id: 'signal-red', name: 'Material Signal Red', hex: '#EB3328' },
  { id: 'tangerine', name: 'Material Tangerine', hex: '#F08F35' },
  { id: 'saffron', name: 'Material Saffron', hex: '#F8CE47' },
  { id: 'acid-yellow', name: 'Material Acid Yellow', hex: '#E6E938' },
  { id: 'aqua-mint', name: 'Material Aqua Mint', hex: '#02FBCA' },
];

export const GRADIENTS = [
  { id: 'blue-mint', name: 'Material Blue Mint', a: '#005BD5', b: '#02FBCA' },
  { id: 'violet-mint', name: 'Material Violet Mint', a: '#7E00FF', b: '#02FBCA' },
  { id: 'magenta-saffron', name: 'Material Magenta Saffron', a: '#F902A5', b: '#F8CE47' },
  { id: 'vermilion-yellow', name: 'Material Vermilion Yellow', a: '#EB3328', b: '#E6E938' },
  { id: 'violet-magenta', name: 'Material Violet Magenta', a: '#7E00FF', b: '#F902A5' },
  { id: 'mint-yellow', name: 'Material Mint Yellow', a: '#02FBCA', b: '#E6E938' },
];

// Screen: a 16:9 slab
export const SCREEN = { aspect: 16 / 9 };

// One line weight for every line, px at a 1080px short side. Locked: not editable in the UI.
export const LINE = { px: 6, linkPx: 3, basis: 1080 };

// Echo opacity = echoBase * (1 - age)^falloff * (nearMin + (1 - nearMin) * near) * Echo Opacity
export const ECHO = { echoBase: 0.24, falloff: 1.0, nearMin: 0.45, headOpacity: 0.85, spacing: 0.04 };

// Shared defaults for every category
const COMMON = {
  posX: 0.5, posY: 0.5, count: 1, spacing: 1, behaviour: 'independent',
  reverse: false, lineColor: 'category',
  echoLength: 160, echoDensity: 2.5, echoOpacity: 1, colorShift: 0.7, distanceFade: 2.6, air: 0.6,
};

/*
  The six media categories. Each one takes its colour, shape and motion rule from how
  works in that category exist and are preserved (the "존재 조건" column of the media list).
  motion: which motion grammar the screens follow (see script.js sampleState)
  flip: run the gradient from b to a, so every category starts on its own colour
  colors / stops: a gradient with more than two colours and where each one sits (network)
  (moving: mint, software: blue, network: saffron, light: signal red, performance: magenta, digital: violet)
*/
export const CATEGORIES = [
  {
    id: 'moving', motion: 'swing', gradient: 'violet-mint', flip: true, camera: 'low',
    name: { ko: '영상·사운드', en: 'Moving Image & Sound' },
    types: { ko: '필름 · 슬라이드 · 단채널 비디오 · 다채널 비디오 설치 · 사운드 아트', en: 'Film · Slide · Single-channel video · Multi-channel installation · Sound art' },
    basis: { ko: '영상 파일·필름 + 재생 장치', en: 'Video file or film + playback device' },
    shape: { ko: '공간에서 펼쳐지는 다양한 스크린', en: 'Many screens unfolding in space' },
    rule: { ko: '스크린이 펼쳐지고 모양이 변화하며, 지나간 장면은 잔상으로 남긴다', en: 'Screens unfold and change shape, leaving past scenes behind as echoes' },
    ref: { ko: '재생되는 스크린과 흐르는 시간', en: 'A playing screen and running time' },
    defaults: { ...COMMON, duration: 2.4, interval: 0.8, swing: 55, path: 'curve', quant: 0, screenW: 1, screenH: 1, screenD: 0.04, startW: 0.55, startH: 0.55, startD: 0.55 },
  },
  {
    id: 'software', motion: 'grid', gradient: 'blue-mint', camera: 'orbit',
    name: { ko: '소프트웨어 기반', en: 'Software-based Art' },
    types: { ko: '소프트웨어·생성형 · AI 기반 · 인터랙티브·센서 · 게임 아트 · 몰입형 XR', en: 'Software / generative · AI-based · Interactive / sensor · Game art · Immersive XR' },
    basis: { ko: '코드 + 실행 환경', en: 'Code + runtime environment' },
    shape: { ko: '화면을 가득 채운 픽셀(셀) 격자', en: 'A grid of pixel cells that fills the frame' },
    rule: { ko: '픽셀들이 정해진 규칙대로 꺼지고 켜진다. 화면이 전체 공간을 가득 채우다 조금씩 비우기를 반복한다', en: 'Pixels switch off and on by a set rule. The screen fills the whole space, then empties bit by bit, again and again' },
    ref: { ko: 'MoMA 소프트웨어 컬렉션: 비디오 게임과 생성 프로그램의 픽셀·틱·규칙 (생명 게임, 블록 게임)', en: "MoMA's software collection: the pixels, ticks and rules of video games and generative programs (Game of Life, block games)" },
    defaults: { ...COMMON, rule: 'fill', cols: 24, tick: 0.12, history: 3, layerDepth: 0.6, voxel: false, size: 1, colorShift: 0.7 },
  },
  {
    id: 'network', motion: 'net', gradient: 'mint-yellow', camera: 'orbit',
    // Saffron → Acid Yellow for the first 70%, Mint only in the last 30%, so it reads yellow and never as Moving Image's mint
    colors: ['#F8CE47', '#E6E938', '#02FBCA'], stops: [0, 0.45, 1],
    name: { ko: '네트워크 기반', en: 'Network-based Art' },
    types: { ko: '넷 아트·웹 · 블록체인·NFT · 로커티브·모바일', en: 'Net art / web · Blockchain / NFT · Locative / mobile' },
    basis: { ko: '서버 + 브라우저 + 네트워크', en: 'Server + browser + network' },
    shape: { ko: '화면을 가득 채운 입체 십자(노드) 격자', en: 'A block of 3D crosses (nodes) filling the frame' },
    rule: { ko: '신호가 지나가면서 선들끼리 이어지고 뻗어나가기를 반복한다', en: 'As signals pass, lines join up and reach out, again and again' },
    ref: { ko: '노드와 링크가 연결되고 끊어지는 네트워크 상태', en: 'A network whose nodes and links connect and drop' },
    defaults: { ...COMMON, crossCols: 4, spread: 1, gap: 0.45, packets: 2, duration: 2.6, turnRate: 0.2, echoLength: 5, echoDensity: 2, colorShift: 1, air: 0.25 },
  },
  {
    id: 'light', motion: 'spin', gradient: 'vermilion-yellow', camera: 'front',
    name: { ko: '라이트·키네틱', en: 'Light & Kinetic Art' },
    types: { ko: '라이트 아트 · 키네틱·로보틱 · 홀로그램·광학', en: 'Light art · Kinetic / robotic · Hologram / optical' },
    basis: { ko: '광원 + 전기·기계 장치', en: 'Light source + electrical or mechanical device' },
    shape: { ko: '한 줄의 빛과 선', en: 'A single line of light' },
    rule: { ko: '선이 360도로 회전하고 움직이며 빛의 움직임을 표현한다', en: 'Lines turn through 360° and move, showing the movement of light' },
    ref: { ko: '광원의 궤적, 회전하는 키네틱 장치', en: 'Trails of light and spinning kinetic devices' },
    defaults: { ...COMMON, count: 3, spacing: 0.6, length: 1.0, spin: 2, tilt: 35, duration: 2.5, echoLength: 220, echoDensity: 3.5, colorShift: 0.9 },
  },
  {
    id: 'performance', motion: 'dance', gradient: 'magenta-saffron', camera: 'orbit',
    name: { ko: '퍼포먼스', en: 'Performance' },
    types: { ko: '미디어 퍼포먼스', en: 'Media performance' },
    basis: { ko: '지시문 + 수행자 + 미디어 요소', en: 'Score + performer + media' },
    shape: { ko: '퍼포머 한 명이 남기는 한 가닥의 리본(선)', en: 'One ribbon of lines for each performer' },
    rule: { ko: '퍼포머가 박자에 맞춰 무대의 구역을 옮겨 다니며 춤추고, 몸이 지나간 자리가 꼬이는 리본으로 남는다', en: 'Performers dance to the beat, moving between areas of the stage; where the body passed stays as a twisting ribbon' },
    ref: { ko: '모션 캡처의 움직임 궤적(Ghostcatching), 로이 풀러의 서펜타인 댄스, 라반의 트레이스 폼, 커닝햄의 무대 공간', en: 'Motion-capture trails (Ghostcatching), Loïe Fuller’s Serpentine Dance, Laban’s trace forms, Cunningham’s stage space' },
    defaults: { ...COMMON, count: 2, behaviour: 'canon', bpm: 84, accent: 0, amplitude: 1.2, twist: 0.6, spread: 1, ribbon: 5, ribbonWidth: 1, strands: 4, echoOpacity: 1, colorShift: 0.8, air: 0.5 },
  },
  {
    id: 'digital', motion: 'format', gradient: 'violet-magenta', camera: 'orbit',
    name: { ko: '디지털 이미지', en: 'Digital Image' },
    types: { ko: '디지털 이미지 · 디지털 그래픽', en: 'Digital image · Digital graphic' },
    basis: { ko: '출력물·실물 + 원본 디지털 파일', en: 'Print or object + source digital file' },
    shape: { ko: '다양한 크기의 판형', en: 'Paper formats in many sizes' },
    rule: { ko: '여러 스크린이 크기를 자유롭게 바꾸어 간다', en: 'Screens change their size freely' },
    ref: { ko: '화면 비율(16:9, 3:2, 4:3, 1:1, 4:5, 9:16)', en: 'Screen aspect ratios (16:9, 3:2, 4:3, 1:1, 4:5, 9:16)' },
    defaults: { ...COMMON, count: 1, aspect: 'mix', steps: 6, duration: 0.9, interval: 0.9, size: 1, echoLength: 16, echoDensity: 3.5, colorShift: 0.7 },
  },
];

export const EXPORT_SIZES = {
  web: [1920, 1080],
  uhd: [3840, 2160],
  square: [1080, 1080],
  portrait: [1080, 1920],
};
