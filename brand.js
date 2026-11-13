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
    id: 'moving', motion: 'layers', gradient: 'violet-mint', flip: true, camera: 'low', fit: 1,
    name: { ko: '영상·사운드', en: 'Moving Image & Sound' },
    types: { ko: '필름 · 슬라이드 · 단채널 비디오 · 다채널 비디오 설치 · 사운드 아트', en: 'Film · Slide · Single-channel video · Multi-channel installation · Sound art' },
    basis: { ko: '영상 파일·필름 + 재생 장치', en: 'Video file or film + playback device' },
    shape: { ko: '공간에서 펼쳐지는 다양한 스크린', en: 'Many screens unfolding in space' },
    rule: { ko: '여러 크기의 스크린이 공간을 옮겨 다니며 설치되고, 기록물은 레이어로 쌓인다', en: 'Screens of many sizes move through the space and are installed; records stack up as layers' },
    ref: { ko: '재생되는 스크린과 흐르는 시간', en: 'A playing screen and running time' },
    defaults: { ...COMMON, layers: 6, stackGap: 1, size: 1, colorShift: 0.8, echoLength: 14, echoDensity: 2.5, duration: 1.1, interval: 1, swing: 55, path: 'curve', quant: 0, screenW: 1, screenH: 1, screenD: 0.04, startW: 0.55, startH: 0.55, startD: 0.55 },
  },
  {
    id: 'software', motion: 'subpix', gradient: 'blue-mint', camera: 'orbit', fit: 0.75,
    name: { ko: '소프트웨어 기반', en: 'Software-based Art' },
    types: { ko: '소프트웨어·생성형 · AI 기반 · 인터랙티브·센서 · 게임 아트 · 몰입형 XR', en: 'Software / generative · AI-based · Interactive / sensor · Game art · Immersive XR' },
    basis: { ko: '코드 + 실행 환경', en: 'Code + runtime environment' },
    shape: { ko: '화면을 이루는 가장 작은 빛의 점(서브픽셀) 배열', en: 'The arrays of tiny dots of light (sub-pixels) a screen is made of' },
    rule: { ko: 'TV·PC·LCD 화면의 픽셀이 패턴을 이루고, 화면이 전환되거나 꺼지고 켜질 때 물결, 가운데에서 가장자리, 위에서 아래의 방식으로 바뀐다', en: 'The pixels of TV, PC and LCD screens form a pattern; when the screen changes or turns off and on, they change as a wave, from the centre to the edges, or from top to bottom' },
    ref: { ko: '디스플레이 서브픽셀 구조: 슬롯 마스크(TV CRT), 섀도 마스크(PC CRT), XO-1 LCD, 스트라이프 LCD', en: 'Display sub-pixel layouts: slot mask (TV CRT), shadow mask (PC CRT), XO-1 LCD, stripe LCD' },
    defaults: { ...COMMON, transition: 'wave', cols: 10, size: 1, hold: 1.6, duration: 0.9, colorShift: 1, air: 0.4 },
  },
  {
    id: 'network', motion: 'net', gradient: 'mint-yellow', camera: 'orbit', fit: 1,
    // Saffron → Acid Yellow for the first 70%, Mint only in the last 30%, so it reads yellow and never as Moving Image's mint
    colors: ['#F8CE47', '#E6E938', '#02FBCA'], stops: [0, 0.45, 1],
    name: { ko: '네트워크 기반', en: 'Network-based Art' },
    types: { ko: '넷 아트·웹 · 블록체인·NFT · 로커티브·모바일', en: 'Net art / web · Blockchain / NFT · Locative / mobile' },
    basis: { ko: '서버 + 브라우저 + 네트워크', en: 'Server + browser + network' },
    shape: { ko: '화면을 가득 채운 입체 십자(노드) 격자', en: 'A block of 3D crosses (nodes) filling the frame' },
    rule: { ko: '선이 XYZ축을 기준으로 회전하며 연결되고 떨어져 나가다가, 모두 만나 하나의 정육면체 격자 공간을 이룬 뒤 다시 흩어진다', en: 'Lines turn about the X, Y and Z axes, joining and breaking apart, until they all meet in one cubic grid, then scatter again' },
    ref: { ko: '노드와 링크가 연결되고 끊어지는 네트워크 상태', en: 'A network whose nodes and links connect and drop' },
    defaults: { ...COMMON, crossCols: 4, spread: 1, gap: 0.45, packets: 2, duration: 2.6, turnRate: 0.2, echoLength: 5, echoDensity: 2, colorShift: 1, air: 0.25 },
  },
  {
    id: 'light', motion: 'neon', gradient: 'vermilion-yellow', camera: 'orbit', fit: 0.85,
    name: { ko: '라이트·키네틱', en: 'Light & Kinetic Art' },
    types: { ko: '라이트 아트 · 키네틱·로보틱 · 홀로그램·광학', en: 'Light art · Kinetic / robotic · Hologram / optical' },
    basis: { ko: '광원 + 전기·기계 장치', en: 'Light source + electrical or mechanical device' },
    shape: { ko: '은은하게 번지는 빛의 선(광원 튜브)', en: 'Tubes of light with a soft glow' },
    rule: { ko: '빛나는 막대가 공중의 모빌처럼 여러 기울기로 회전한다', en: 'Glowing bars turn at many tilts, like a mobile in the air' },
    ref: { ko: '형광등·네온 튜브 설치, 공중에 매달려 움직이는 키네틱 조각', en: 'Fluorescent and neon tube installations, kinetic sculptures hanging in the air' },
    defaults: { ...COMMON, count: 3, spacing: 1, length: 0.85, spin: 1, tilt: 22, duration: 3, glow: 1, echoLength: 90, echoDensity: 1.4, echoOpacity: 1, colorShift: 0.9 },
  },
  {
    id: 'performance', motion: 'dance', gradient: 'magenta-saffron', camera: 'orbit', fit: 0.8,
    name: { ko: '퍼포먼스', en: 'Performance' },
    types: { ko: '미디어 퍼포먼스', en: 'Media performance' },
    basis: { ko: '지시문 + 수행자 + 미디어 요소', en: 'Score + performer + media' },
    shape: { ko: '퍼포머의 움직임을 표현하는 선형', en: 'Line forms that trace the performers’ movement' },
    rule: { ko: '선이 몸짓처럼 부드럽게 무대를 움직이며, 캐논·유니즌·미러의 세 방식으로 함께 움직인다', en: 'Lines move softly across the stage like gestures, together in three ways: canon, unison and mirror' },
    ref: { ko: '모션 캡처의 움직임 궤적(Ghostcatching), 로이 풀러의 서펜타인 댄스, 라반의 트레이스 폼, 커닝햄의 무대 공간', en: 'Motion-capture trails (Ghostcatching), Loïe Fuller’s Serpentine Dance, Laban’s trace forms, Cunningham’s stage space' },
    defaults: { ...COMMON, count: 4, behaviour: 'canon', bpm: 84, accent: 0, amplitude: 1.2, twist: 0.6, spread: 1, ribbon: 5, ribbonWidth: 1, strands: 4, echoOpacity: 1, colorShift: 0.8, air: 0.5 },
  },
  {
    id: 'digital', motion: 'turn', gradient: 'violet-magenta', camera: 'orbit', fit: 1,
    name: { ko: '디지털 2D 3D 이미지', en: 'Digital 2D/3D Image' },
    types: { ko: '디지털 이미지 · 디지털 그래픽', en: 'Digital image · Digital graphic' },
    basis: { ko: '출력물·실물 + 원본 디지털 파일', en: 'Print or object + source digital file' },
    shape: { ko: '크기가 바뀌는 평면 사각형', en: 'A flat rectangle that changes size' },
    rule: { ko: '평면 이미지가 쌓여 입체가 되고, 다시 평면으로 돌아간다', en: 'A flat image stacks up into a solid, then returns to flat' },
    ref: { ko: '이미지를 이루는 레이어, 평면과 입체를 오가는 디지털 이미지', en: 'The layers an image is made of; digital images moving between flat and solid' },
    defaults: { ...COMMON, count: 1, aspect: 'mix', steps: 4, duration: 0.9, interval: 0.9, layers: 5, stackGap: 1, size: 1, echoLength: 14, echoDensity: 2.5, colorShift: 0.8 },
  },
];

export const EXPORT_SIZES = {
  web: [1920, 1080],
  uhd: [3840, 2160],
  square: [1080, 1080],
  portrait: [1080, 1920],
};
