const refs = {
  canvas: document.getElementById("game"),
  dayLabel: document.getElementById("day-label"),
  statusLabel: document.getElementById("status-label"),
  bottomLeft: document.getElementById("hud-bottom-left"),
  hintLabel: document.getElementById("hud-hint"),
  soundLabel: document.getElementById("sound-label"),
  actionMeter: document.getElementById("action-meter"),
  actionLabel: document.getElementById("action-label"),
  actionFill: document.getElementById("action-fill"),
  healthFill: document.getElementById("health-fill"),
  healthLabel: document.getElementById("health-label"),
  hungerFill: document.getElementById("hunger-fill"),
  hungerLabel: document.getElementById("hunger-label"),
  hotbar: document.getElementById("hotbar"),
  controlsPanel: document.getElementById("controls-panel"),
  inventoryPanel: document.getElementById("inventory-panel"),
  settingsPanel: document.getElementById("settings-panel"),
  inventoryGrid: document.getElementById("inventory-grid"),
  craftGrid: document.getElementById("craft-grid"),
  settingsMusic: document.getElementById("settings-music"),
  settingsMusicValue: document.getElementById("settings-music-value"),
  settingsSfx: document.getElementById("settings-sfx"),
  settingsSfxValue: document.getElementById("settings-sfx-value"),
  settingsSensitivity: document.getElementById("settings-sensitivity"),
  settingsSensitivityValue: document.getElementById("settings-sensitivity-value"),
  settingsScale: document.getElementById("settings-scale"),
  settingsScaleValue: document.getElementById("settings-scale-value"),
  settingsShowHints: document.getElementById("settings-show-hints"),
  settingsShowSound: document.getElementById("settings-show-sound"),
  deathScreen: document.getElementById("death-screen"),
  deathMessage: document.getElementById("death-message"),
};

const ctx = refs.canvas.getContext("2d");
const TAU = Math.PI * 2;
const NEAR = 0.12;
const FOV = Math.PI / 2.8;
const MIN_PITCH = -(Math.PI / 2 - 0.01);
const MAX_PITCH = Math.PI / 2 - 0.01;
const PLAYER_RADIUS = 0.31;
const PLAYER_HEIGHT = 1.8;
const MAX_BUILD_HEIGHT = 10;
const HOTBAR_SIZE = 7;
const WORLD_LIMIT = 1_000_000_000_000;
const GROUND_RENDER_RADIUS = 24;
const BLOCK_RENDER_RADIUS = 40;
const DAY_DURATION = 40;
const NIGHT_DURATION = 200;
const TRANSITION_DURATION = 6;
const DAY_CYCLE_DURATION = DAY_DURATION + NIGHT_DURATION;
const ENTITY_KEEP_DISTANCE = 82;
const ENTITY_SPAWN_INTERVAL = 1;
const ENTITY_SPAWN_MIN_DISTANCE = 13;
const ENTITY_SPAWN_MAX_DISTANCE = 24;
const MAX_ACTIVE_ENTITIES = 90;
const CRITICAL_HIT_MULTIPLIER = 1.7;
const CRITICAL_HIT_FALL_SPEED = -1.05;
const VILLAGE_CENTER = { x: 0, z: 12 };
const VILLAGE_SAFE_RADIUS = 30;
const DEFAULT_HOTBAR_ITEMS = ["grass", "dirt", "stone", "log", "apple", "pork", "ladder"];
const TYPE_LABELS = {
  pig: "돼지",
  cow: "소",
  sheep: "양",
  villager: "주민",
  ironGolem: "철 골렘",
  slime: "슬라임",
  zombie: "좀비",
  skeleton: "스켈래톤",
  spider: "거미",
  creeper: "크리퍼",
};
const ENTITY_PRESETS = {
  pig: {
    speed: 0.44,
    radius: 1.02,
    height: 1.55,
    kindScale: 1.04,
    hp: 2,
    drops: { pork: 1 },
  },
  cow: {
    speed: 0.38,
    radius: 1.15,
    height: 1.78,
    kindScale: 1.08,
    hp: 3,
    drops: { beef: 1 },
  },
  sheep: {
    speed: 0.32,
    radius: 1,
    height: 1.46,
    hp: 2,
    drops: { wool: 1 },
  },
  villager: {
    speed: 0.58,
    radius: 0.74,
    height: 1.82,
    kindScale: 1.02,
    hp: 4,
    drops: {},
  },
  ironGolem: {
    speed: 0.56,
    radius: 1.08,
    height: 2.6,
    kindScale: 1.12,
    hp: 12,
    drops: {},
  },
  slime: {
    speed: 0.22,
    radius: 0.76,
    height: 0.96,
    hp: 2,
    hostile: true,
    drops: { slimeGel: 1 },
  },
  zombie: {
    speed: 0.34,
    radius: 0.84,
    height: 1.86,
    kindScale: 1.04,
    hp: 4,
    hostile: true,
    drops: {},
  },
  skeleton: {
    speed: 0.32,
    radius: 0.74,
    height: 1.88,
    kindScale: 1,
    hp: 3,
    hostile: true,
    drops: { stick: 1 },
  },
  spider: {
    speed: 0.48,
    radius: 1.02,
    height: 0.84,
    kindScale: 1.08,
    hp: 3,
    hostile: true,
    drops: { wool: 1 },
  },
  creeper: {
    speed: 0.3,
    radius: 0.82,
    height: 1.88,
    kindScale: 1.04,
    hp: 4,
    hostile: true,
    drops: { slimeGel: 1 },
  },
};
const keys = new Set();

const BLOCK_TYPES = {
  grass: {
    label: "잔디 블록",
    hardness: 0.55,
    preferredTool: "shovel",
    palette: { front: "#7f9d4c", side: "#698444", top: "#9dd05e" },
  },
  dirt: {
    label: "흙 블록",
    hardness: 0.75,
    preferredTool: "shovel",
    palette: { front: "#996944", side: "#805638", top: "#b07d51" },
  },
  stone: {
    label: "돌 블록",
    hardness: 1.4,
    preferredTool: "pickaxe",
    palette: { front: "#9da1a6", side: "#7d8188", top: "#c8ccd0" },
  },
  log: {
    label: "통나무",
    hardness: 1.1,
    preferredTool: "axe",
    palette: { front: "#8f6a45", side: "#725233", top: "#b1865f" },
  },
  plank: {
    label: "판자",
    hardness: 0.8,
    preferredTool: "axe",
    palette: { front: "#c69657", side: "#a87942", top: "#dbaf6f" },
  },
  brick: {
    label: "석재 벽돌",
    hardness: 1.65,
    preferredTool: "pickaxe",
    palette: { front: "#b2b6bd", side: "#9296a0", top: "#d4d8de" },
  },
  ladder: {
    label: "등반 작대기",
    hardness: 0.45,
    preferredTool: "axe",
    solid: false,
    climbable: true,
    palette: { front: "#ccb277", side: "#aa8f5a", top: "#e3ca93" },
  },
  bed: {
    label: "침대",
    hardness: 0.7,
    preferredTool: "axe",
    palette: { front: "#c85d66", side: "#9c424c", top: "#f3e6d6" },
  },
};

const ITEM_TYPES = {
  grass: { label: "잔디", category: "block", placeable: true, block: "grass" },
  dirt: { label: "흙", category: "block", placeable: true, block: "dirt" },
  stone: { label: "돌", category: "block", placeable: true, block: "stone" },
  log: { label: "통나무", category: "block", placeable: true, block: "log" },
  plank: { label: "판자", category: "block", placeable: true, block: "plank" },
  brick: { label: "석재 벽돌", category: "block", placeable: true, block: "brick" },
  ladder: { label: "등반 작대기", category: "block", placeable: true, block: "ladder" },
  bed: { label: "침대", category: "block", placeable: true, block: "bed" },
  apple: { label: "사과", category: "food", edible: { hunger: 3, health: 1 } },
  pork: { label: "돼지고기", category: "food", edible: { hunger: 4, health: 2 } },
  beef: { label: "소고기", category: "food", edible: { hunger: 5, health: 2 } },
  stick: { label: "막대기", category: "material", combat: { damage: 1.1, range: 7.2 } },
  pickaxe: {
    label: "곡괭이",
    category: "tool",
    tool: { pickaxe: 2.7 },
    combat: { damage: 1.3, range: 7.2 },
  },
  shovel: {
    label: "삽",
    category: "tool",
    tool: { shovel: 2.5 },
    combat: { damage: 1.2, range: 7.1 },
  },
  axe: {
    label: "도끼",
    category: "tool",
    tool: { axe: 2.6 },
    combat: { damage: 1.7, range: 7.25 },
  },
  knife: {
    label: "칼",
    category: "weapon",
    combat: { damage: 2.2, range: 7.45 },
  },
  spear: {
    label: "창",
    category: "weapon",
    combat: { damage: 2.8, range: 9.3 },
  },
  bandage: {
    label: "붕대",
    category: "utility",
    edible: { hunger: 0, health: 4 },
    consumeVerb: "사용",
  },
  wool: { label: "양털", category: "drop" },
  slimeGel: { label: "슬라임 젤", category: "drop" },
};

const CRAFTING_RECIPES = [
  {
    id: "plank-pack",
    title: "판자 묶음",
    gives: { plank: 4 },
    costs: { log: 1 },
    note: "통나무를 판자로 가공한다",
  },
  {
    id: "brick-pack",
    title: "석재 벽돌",
    gives: { brick: 2 },
    costs: { stone: 3 },
    note: "돌을 정리해 벽돌로 만든다",
  },
  {
    id: "stick-bundle",
    title: "막대기 묶음",
    gives: { stick: 4 },
    costs: { plank: 2 },
    note: "도구 손잡이에 쓰이는 기본 재료",
  },
  {
    id: "ladder-kit",
    title: "등반 작대기",
    gives: { ladder: 2 },
    costs: { stick: 3, plank: 1 },
    note: "설치 후 W/Space로 올라가고 S/Shift로 내려간다",
  },
  {
    id: "bed",
    title: "침대",
    gives: { bed: 1 },
    costs: { wool: 3, plank: 3 },
    note: "양털과 판자로 만드는 설치형 침대",
  },
  {
    id: "pickaxe",
    title: "곡괭이",
    gives: { pickaxe: 1 },
    costs: { stone: 3, stick: 2 },
    note: "돌과 벽돌을 더 빠르게 캔다",
  },
  {
    id: "shovel",
    title: "삽",
    gives: { shovel: 1 },
    costs: { plank: 1, stick: 2 },
    note: "흙과 잔디를 더 빠르게 캔다",
  },
  {
    id: "axe",
    title: "도끼",
    gives: { axe: 1 },
    costs: { plank: 3, stick: 2 },
    note: "통나무와 판자를 더 빠르게 캔다",
  },
  {
    id: "knife",
    title: "칼",
    gives: { knife: 1 },
    costs: { brick: 1, stick: 1 },
    note: "근접 공격 데미지가 올라간다",
  },
  {
    id: "spear",
    title: "창",
    gives: { spear: 1 },
    costs: { brick: 1, stick: 2 },
    note: "더 멀리 있는 적까지 찌를 수 있다",
  },
  {
    id: "bandage",
    title: "붕대",
    gives: { bandage: 1 },
    costs: { wool: 1, slimeGel: 1 },
    note: "우클릭으로 체력을 회복한다",
  },
];

const inputState = {
  inventoryOpen: false,
  settingsOpen: false,
  hotbarEls: [],
  hotbarItems: [...DEFAULT_HOTBAR_ITEMS],
  controlsOpen: true,
  primaryHeld: false,
  miningBlockKey: "",
  miningProgress: 0,
  miningDuration: 0,
  miningLabel: "",
  miningPulseTimer: 0,
  inventorySignature: "",
};

const player = {
  spawn: { x: 0, z: -7.5, yaw: 0.04, pitch: -0.04 },
  x: 0,
  y: 1.72,
  eyeHeight: 1.72,
  feetY: 0,
  z: -7.5,
  yaw: 0.04,
  pitch: -0.04,
  bob: 0,
  velocityY: 0,
  onGround: true,
  maxHealth: 10,
  health: 10,
  maxHunger: 10,
  hunger: 10,
  selectedSlot: 0,
  damageCooldown: 0,
  hungerTimer: 0,
  regenTimer: 0,
  starveTimer: 0,
  stepTimer: 0,
  dead: false,
};

const inventory = Object.fromEntries(
  Object.keys(ITEM_TYPES).map((itemId) => [itemId, 0]),
);

const world = {
  day: 1,
  elapsed: 0,
  score: 0,
  blocks: new Map(),
  particles: [],
  entities: [],
  grassCache: new Map(),
  statusTimer: 0,
  soundTimer: 0,
  lastSound: "최근 소리: 없음",
  targetBlock: null,
  targetEntity: null,
  spawnTimer: 0,
};

const audioState = {
  context: null,
  masterGain: null,
  sfxGain: null,
  started: false,
  muted: false,
  step: 0,
  stepDuration: 60 / 92 / 2,
  nextNoteTime: 0,
  unlockPlayed: false,
  noiseBuffer: null,
  resumePromise: null,
};

const settingsState = {
  musicVolume: 100,
  sfxVolume: 100,
  mouseSensitivity: 100,
  renderScale: 56,
  showHints: true,
  showSoundCaption: true,
};

const MUSIC_PATTERNS = {
  day: [
    { chord: [60, 64, 67], bass: [48, 55], melody: [72, null, 76, null, 79, null, 76, 74] },
    { chord: [55, 59, 62], bass: [43, 50], melody: [71, null, 74, null, 79, null, 74, 71] },
    { chord: [57, 60, 64], bass: [45, 52], melody: [69, null, 72, null, 76, null, 72, 69] },
    { chord: [53, 57, 60], bass: [41, 48], melody: [69, null, 72, null, 76, null, 74, 72] },
  ],
  night: [
    { chord: [57, 60, 64], bass: [45, 52], melody: [69, null, 72, null, 76, null, 72, 69] },
    { chord: [53, 57, 60], bass: [41, 48], melody: [67, null, 72, null, 74, null, 72, 67] },
    { chord: [48, 52, 55], bass: [36, 43], melody: [64, null, 67, null, 71, null, 67, 64] },
    { chord: [55, 59, 62], bass: [43, 50], melody: [67, null, 71, null, 74, null, 71, 67] },
  ],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => min + Math.random() * (max - min);

const mixColor = (left, right, t) => {
  const parse = (hex) => {
    const normalized = hex.replace("#", "");
    const parsed = Number.parseInt(normalized, 16);
    return [
      (parsed >> 16) & 255,
      (parsed >> 8) & 255,
      parsed & 255,
    ];
  };

  const from = parse(left);
  const to = parse(right);
  return `rgb(${
    Math.round(lerp(from[0], to[0], t))
  }, ${
    Math.round(lerp(from[1], to[1], t))
  }, ${
    Math.round(lerp(from[2], to[2], t))
  })`;
};

const getCycleTime = () => world.elapsed % DAY_CYCLE_DURATION;

const getNightAmount = () => {
  const cycle = getCycleTime();
  const sunsetStart = DAY_DURATION - TRANSITION_DURATION;
  const sunriseStart = DAY_CYCLE_DURATION - TRANSITION_DURATION;

  if (cycle < sunsetStart) {
    return 0;
  }
  if (cycle < DAY_DURATION) {
    return (cycle - sunsetStart) / TRANSITION_DURATION;
  }
  if (cycle < sunriseStart) {
    return 1;
  }
  return 1 - (cycle - sunriseStart) / TRANSITION_DURATION;
};

const isNightTime = () => getNightAmount() >= 0.55;
const isHostileSpawnTime = () => {
  const cycle = getCycleTime();
  const sunriseStart = DAY_CYCLE_DURATION - TRANSITION_DURATION;
  return cycle >= DAY_DURATION && cycle < sunriseStart;
};

const shouldClearHostiles = () => {
  const cycle = getCycleTime();
  const sunriseStart = DAY_CYCLE_DURATION - TRANSITION_DURATION;
  return cycle >= sunriseStart || cycle < DAY_DURATION;
};

const isBedtime = () => {
  const cycle = getCycleTime();
  const sunsetStart = DAY_DURATION - TRANSITION_DURATION;
  const sunriseStart = DAY_CYCLE_DURATION - TRANSITION_DURATION;
  return cycle >= sunsetStart && cycle < sunriseStart;
};

const getTimeOfDayLabel = () => {
  const cycle = getCycleTime();
  const sunsetStart = DAY_DURATION - TRANSITION_DURATION;
  const sunriseStart = DAY_CYCLE_DURATION - TRANSITION_DURATION;

  if (cycle >= sunriseStart) {
    return "아침";
  }
  if (cycle >= sunsetStart) {
    return "저녁";
  }
  if (isNightTime()) {
    return "밤";
  }
  return "낮";
};

const getMusicTargetVolume = () => {
  const baseVolume = player.dead ? 0.03 : lerp(0.24, 0.18, getNightAmount());
  return audioState.muted ? 0.0001 : Math.max(0.0001, baseVolume * (settingsState.musicVolume / 100));
};

const getSfxGainLevel = () => 0.68 * (settingsState.sfxVolume / 100);

const applyAudioSettings = () => {
  if (!audioState.context) {
    return;
  }

  if (audioState.sfxGain) {
    audioState.sfxGain.gain.cancelScheduledValues(audioState.context.currentTime);
    audioState.sfxGain.gain.setTargetAtTime(
      getSfxGainLevel(),
      audioState.context.currentTime,
      0.08,
    );
  }

  if (audioState.masterGain) {
    audioState.masterGain.gain.cancelScheduledValues(audioState.context.currentTime);
    audioState.masterGain.gain.setTargetAtTime(
      getMusicTargetVolume(),
      audioState.context.currentTime,
      0.18,
    );
  }
};

const midiToFrequency = (note) => 440 * 2 ** ((note - 69) / 12);

const ensureAudioContext = () => {
  if (!window.AudioContext && !window.webkitAudioContext) {
    return null;
  }

  if (!audioState.context) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    audioState.context = new AudioCtor();
    audioState.masterGain = audioState.context.createGain();
    audioState.sfxGain = audioState.context.createGain();
    audioState.masterGain.gain.value = 0.0001;
    audioState.sfxGain.gain.value = getSfxGainLevel();
    audioState.masterGain.connect(audioState.context.destination);
    audioState.sfxGain.connect(audioState.context.destination);
  }

  if (
    audioState.context.state === "suspended"
    && !audioState.resumePromise
  ) {
    audioState.resumePromise = audioState.context.resume()
      .catch(() => {
        setStatus("브라우저가 음악을 막고 있다");
      })
      .finally(() => {
        audioState.resumePromise = null;
      });
  }

  return audioState.context;
};

const scheduleTone = (
  note,
  startTime,
  duration,
  {
    type = "triangle",
    volume = 0.04,
    attack = 0.02,
    release = 0.18,
    detune = 0,
    filter = 1800,
    output = audioState.masterGain,
  } = {},
) => {
  const context = audioState.context;
  if (!context || !output) {
    return;
  }

  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const lowpass = context.createBiquadFilter();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(midiToFrequency(note), startTime);
  oscillator.detune.setValueAtTime(detune, startTime);

  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(filter, startTime);
  lowpass.Q.setValueAtTime(0.6, startTime);

  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.linearRampToValueAtTime(volume, startTime + attack);
  envelope.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + Math.max(attack + 0.03, duration + release),
  );

  oscillator.connect(lowpass);
  lowpass.connect(envelope);
  envelope.connect(output);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + release + 0.02);
};

const getNoiseBuffer = () => {
  const context = audioState.context;
  if (!context) {
    return null;
  }

  if (!audioState.noiseBuffer) {
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * (0.45 + Math.random() * 0.55);
    }
    audioState.noiseBuffer = buffer;
  }

  return audioState.noiseBuffer;
};

const scheduleNoise = (
  startTime,
  duration,
  {
    volume = 0.05,
    attack = 0.004,
    release = 0.08,
    filter = 1300,
    filterType = "bandpass",
    playbackRate = 1,
    output = audioState.sfxGain,
  } = {},
) => {
  const context = audioState.context;
  const noiseBuffer = getNoiseBuffer();
  if (!context || !output || !noiseBuffer) {
    return;
  }

  const source = context.createBufferSource();
  const envelope = context.createGain();
  const toneFilter = context.createBiquadFilter();

  source.buffer = noiseBuffer;
  source.loop = true;
  source.playbackRate.setValueAtTime(playbackRate, startTime);

  toneFilter.type = filterType;
  toneFilter.frequency.setValueAtTime(filter, startTime);
  toneFilter.Q.setValueAtTime(filterType === "lowpass" ? 0.8 : 1.6, startTime);

  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.linearRampToValueAtTime(volume, startTime + attack);
  envelope.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + Math.max(duration, attack + 0.02) + release,
  );

  source.connect(toneFilter);
  toneFilter.connect(envelope);
  envelope.connect(output);
  source.start(startTime);
  source.stop(startTime + duration + release + 0.04);
};

const getBlockSoundProfile = (blockType) => {
  switch (blockType) {
    case "stone":
    case "brick":
      return { note: 45, noiseFilter: 1180, toneFilter: 920, toneType: "square" };
    case "log":
    case "plank":
    case "bed":
      return { note: 54, noiseFilter: 1680, toneFilter: 1650, toneType: "triangle" };
    case "ladder":
      return { note: 69, noiseFilter: 2500, toneFilter: 2400, toneType: "sine" };
    case "dirt":
    case "grass":
    default:
      return { note: 40, noiseFilter: 900, toneFilter: 1180, toneType: "triangle" };
  }
};

const getSurfaceBlockTypeAt = (x, z) => {
  const cellX = Math.floor(x);
  const cellZ = Math.floor(z);
  const top = getColumnTopAt(cellX, cellZ);
  const block = getBlock(cellX, Math.max(0, top - 1), cellZ);
  return block?.type ?? "grass";
};

const playSoundEffect = (effect, details = {}) => {
  const context = ensureAudioContext();
  if (!context || !audioState.sfxGain) {
    return;
  }

  const time = context.currentTime + 0.01;
  const soundLabels = {
    uiOpen: "인벤토리 여는 소리",
    uiClose: "인벤토리 닫는 소리",
    uiSelect: "장착 소리",
    craft: "제작 소리",
    jump: "점프 소리",
    land: "착지 소리",
    footstep: "발소리",
    swingMiss: "휘두르는 소리",
    entityHit: "타격 소리",
    criticalHit: "크리티컬 소리",
    entityKill: "처치 소리",
    mineTick: "채굴 소리",
    mineBreak: "블록 부서지는 소리",
    placeBlock: "블록 설치 소리",
    eat: "먹는 소리",
    hurt: "피격 소리",
    death: "사망 소리",
    skeletonShot: "화살 소리",
    explosion: "폭발 소리",
    respawn: "부활 소리",
    sleep: "잠드는 소리",
  };
  if (soundLabels[effect]) {
    setSoundCaption(soundLabels[effect]);
  }

  switch (effect) {
    case "uiOpen":
      scheduleTone(76, time, 0.07, { volume: 0.026, filter: 2400, output: audioState.sfxGain });
      scheduleTone(81, time + 0.05, 0.09, {
        volume: 0.022,
        filter: 2800,
        output: audioState.sfxGain,
      });
      break;
    case "uiClose":
      scheduleTone(79, time, 0.07, { volume: 0.022, filter: 2200, output: audioState.sfxGain });
      scheduleTone(74, time + 0.04, 0.08, {
        volume: 0.02,
        filter: 1800,
        output: audioState.sfxGain,
      });
      break;
    case "uiSelect":
      scheduleTone(84, time, 0.05, { volume: 0.018, filter: 2600, output: audioState.sfxGain });
      break;
    case "craft":
      scheduleTone(72, time, 0.08, { volume: 0.024, filter: 2600, output: audioState.sfxGain });
      scheduleTone(76, time + 0.06, 0.09, {
        volume: 0.022,
        filter: 2800,
        output: audioState.sfxGain,
      });
      scheduleTone(79, time + 0.12, 0.12, {
        volume: 0.022,
        filter: 3000,
        output: audioState.sfxGain,
      });
      break;
    case "jump":
      scheduleTone(60, time, 0.09, {
        type: "triangle",
        volume: 0.026,
        attack: 0.005,
        release: 0.12,
        filter: 1500,
        output: audioState.sfxGain,
      });
      break;
    case "land": {
      const profile = getBlockSoundProfile(details.blockType);
      scheduleNoise(time, 0.03, {
        volume: details.hard ? 0.04 : 0.026,
        filter: profile.noiseFilter,
        filterType: "lowpass",
        output: audioState.sfxGain,
      });
      scheduleTone(profile.note - 5, time, 0.05, {
        type: profile.toneType,
        volume: details.hard ? 0.03 : 0.018,
        filter: profile.toneFilter,
        output: audioState.sfxGain,
      });
      break;
    }
    case "footstep": {
      const profile = getBlockSoundProfile(details.blockType);
      scheduleNoise(time, 0.02, {
        volume: details.sprinting ? 0.022 : 0.014,
        filter: profile.noiseFilter,
        output: audioState.sfxGain,
      });
      scheduleTone(profile.note - 10 + Math.round(rand(-1, 1)), time, 0.03, {
        type: profile.toneType,
        volume: details.sprinting ? 0.013 : 0.009,
        filter: profile.toneFilter,
        output: audioState.sfxGain,
      });
      break;
    }
    case "swingMiss":
      scheduleNoise(time, 0.08, {
        volume: 0.026,
        filter: 1700,
        playbackRate: 1.35,
        output: audioState.sfxGain,
      });
      scheduleTone(50, time, 0.06, {
        type: "sine",
        volume: 0.014,
        filter: 1300,
        output: audioState.sfxGain,
      });
      break;
    case "entityHit":
      scheduleNoise(time, 0.04, {
        volume: 0.034,
        filter: 1150,
        playbackRate: 0.9,
        output: audioState.sfxGain,
      });
      scheduleTone(47, time, 0.07, {
        type: "square",
        volume: 0.02,
        filter: 980,
        output: audioState.sfxGain,
      });
      break;
    case "criticalHit":
      scheduleNoise(time, 0.05, {
        volume: 0.048,
        filter: 1650,
        playbackRate: 1.24,
        output: audioState.sfxGain,
      });
      scheduleTone(66, time, 0.06, {
        type: "square",
        volume: 0.026,
        filter: 1600,
        output: audioState.sfxGain,
      });
      scheduleTone(74, time + 0.04, 0.1, {
        type: "triangle",
        volume: 0.024,
        filter: 2200,
        output: audioState.sfxGain,
      });
      break;
    case "entityKill":
      scheduleTone(57, time, 0.09, {
        type: "triangle",
        volume: 0.024,
        filter: 1800,
        output: audioState.sfxGain,
      });
      scheduleTone(64, time + 0.07, 0.14, {
        type: "triangle",
        volume: 0.022,
        filter: 2200,
        output: audioState.sfxGain,
      });
      break;
    case "mineTick": {
      const profile = getBlockSoundProfile(details.blockType);
      scheduleNoise(time, 0.025, {
        volume: 0.026,
        filter: profile.noiseFilter,
        output: audioState.sfxGain,
      });
      scheduleTone(profile.note, time, 0.04, {
        type: profile.toneType,
        volume: 0.018,
        filter: profile.toneFilter,
        output: audioState.sfxGain,
      });
      break;
    }
    case "mineBreak": {
      const profile = getBlockSoundProfile(details.blockType);
      scheduleNoise(time, 0.09, {
        volume: 0.05,
        filter: profile.noiseFilter,
        playbackRate: 0.9,
        output: audioState.sfxGain,
      });
      scheduleTone(profile.note - 2, time, 0.09, {
        type: profile.toneType,
        volume: 0.03,
        filter: profile.toneFilter,
        output: audioState.sfxGain,
      });
      break;
    }
    case "placeBlock": {
      const profile = getBlockSoundProfile(details.blockType);
      scheduleNoise(time, 0.03, {
        volume: 0.024,
        filter: profile.noiseFilter,
        filterType: "lowpass",
        output: audioState.sfxGain,
      });
      scheduleTone(profile.note - 7, time, 0.05, {
        type: profile.toneType,
        volume: 0.017,
        filter: profile.toneFilter,
        output: audioState.sfxGain,
      });
      break;
    }
    case "eat":
      scheduleNoise(time, 0.022, {
        volume: 0.018,
        filter: 2100,
        playbackRate: 1.5,
        output: audioState.sfxGain,
      });
      scheduleTone(67, time, 0.05, {
        type: "triangle",
        volume: 0.012,
        filter: 2000,
        output: audioState.sfxGain,
      });
      scheduleNoise(time + 0.08, 0.018, {
        volume: 0.015,
        filter: 1900,
        playbackRate: 1.4,
        output: audioState.sfxGain,
      });
      break;
    case "hurt":
      scheduleTone(54, time, 0.07, {
        type: "square",
        volume: 0.024,
        filter: 900,
        output: audioState.sfxGain,
      });
      scheduleTone(49, time + 0.05, 0.1, {
        type: "sawtooth",
        volume: 0.02,
        filter: 760,
        output: audioState.sfxGain,
      });
      break;
    case "death":
      scheduleNoise(time, 0.18, {
        volume: 0.045,
        filter: 620,
        filterType: "lowpass",
        playbackRate: 0.7,
        output: audioState.sfxGain,
      });
      scheduleTone(43, time, 0.2, {
        type: "sawtooth",
        volume: 0.028,
        filter: 540,
        output: audioState.sfxGain,
      });
      scheduleTone(36, time + 0.12, 0.24, {
        type: "sine",
        volume: 0.024,
        filter: 400,
        output: audioState.sfxGain,
      });
      break;
    case "skeletonShot":
      scheduleTone(74, time, 0.05, {
        type: "square",
        volume: 0.02,
        filter: 2200,
        output: audioState.sfxGain,
      });
      scheduleNoise(time, 0.022, {
        volume: 0.016,
        filter: 2500,
        playbackRate: 1.8,
        output: audioState.sfxGain,
      });
      break;
    case "explosion":
      scheduleNoise(time, 0.24, {
        volume: 0.085,
        filter: 760,
        filterType: "lowpass",
        playbackRate: 0.65,
        output: audioState.sfxGain,
      });
      scheduleTone(34, time, 0.18, {
        type: "sawtooth",
        volume: 0.036,
        filter: 460,
        output: audioState.sfxGain,
      });
      scheduleTone(29, time + 0.08, 0.22, {
        type: "sine",
        volume: 0.03,
        filter: 320,
        output: audioState.sfxGain,
      });
      break;
    case "respawn":
      scheduleTone(67, time, 0.07, { volume: 0.02, filter: 2200, output: audioState.sfxGain });
      scheduleTone(72, time + 0.06, 0.09, {
        volume: 0.02,
        filter: 2600,
        output: audioState.sfxGain,
      });
      scheduleTone(79, time + 0.12, 0.12, {
        volume: 0.018,
        filter: 2800,
        output: audioState.sfxGain,
      });
      break;
    case "sleep":
      scheduleTone(67, time, 0.12, {
        type: "sine",
        volume: 0.018,
        filter: 1500,
        output: audioState.sfxGain,
      });
      scheduleTone(71, time + 0.1, 0.16, {
        type: "sine",
        volume: 0.016,
        filter: 1400,
        output: audioState.sfxGain,
      });
      scheduleTone(74, time + 0.22, 0.24, {
        type: "triangle",
        volume: 0.015,
        filter: 1800,
        output: audioState.sfxGain,
      });
      break;
    default:
      break;
  }
};

const scheduleMusicStep = (startTime) => {
  const score = isNightTime() ? MUSIC_PATTERNS.night : MUSIC_PATTERNS.day;
  const measure = Math.floor(audioState.step / 8) % score.length;
  const stepInMeasure = audioState.step % 8;
  const phrase = score[measure];
  const stepDuration = audioState.stepDuration;

  if (stepInMeasure === 0) {
    phrase.chord.forEach((note, index) => {
      scheduleTone(note + (index === 0 ? -12 : 0), startTime, stepDuration * 7.4, {
        type: isNightTime() ? "sine" : "triangle",
        volume: isNightTime() ? 0.026 : 0.032,
        attack: 0.05,
        release: 0.4,
        detune: index === 1 ? -4 : index === 2 ? 4 : 0,
        filter: isNightTime() ? 1200 : 1900,
      });
    });
  }

  if (stepInMeasure === 0 || stepInMeasure === 4) {
    const bassNote = phrase.bass[stepInMeasure === 0 ? 0 : 1];
    scheduleTone(bassNote, startTime, stepDuration * 3.2, {
      type: "sine",
      volume: isNightTime() ? 0.042 : 0.05,
      attack: 0.01,
      release: 0.18,
      filter: 520,
    });
  }

  const melodyNote = phrase.melody[stepInMeasure];
  if (melodyNote !== null) {
    scheduleTone(melodyNote, startTime, stepDuration * 0.92, {
      type: "triangle",
      volume: isNightTime() ? 0.03 : 0.038,
      attack: 0.01,
      release: 0.16,
      filter: isNightTime() ? 2000 : 2600,
    });
  }

  if (stepInMeasure % 2 === 1) {
    scheduleTone((phrase.chord[1] ?? phrase.chord[0]) + 12, startTime, stepDuration * 0.45, {
      type: "sine",
      volume: isNightTime() ? 0.011 : 0.014,
      attack: 0.005,
      release: 0.08,
      filter: 2800,
    });
  }
};

const playMusicUnlockTone = (startTime) => {
  scheduleTone(72, startTime, 0.12, {
    type: "triangle",
    volume: 0.05,
    attack: 0.005,
    release: 0.1,
    filter: 2400,
  });
  scheduleTone(76, startTime + 0.08, 0.14, {
    type: "triangle",
    volume: 0.045,
    attack: 0.005,
    release: 0.1,
    filter: 2600,
  });
  scheduleTone(79, startTime + 0.16, 0.2, {
    type: "triangle",
    volume: 0.04,
    attack: 0.005,
    release: 0.12,
    filter: 2800,
  });
};

const startBackgroundMusic = () => {
  try {
    const context = ensureAudioContext();
    if (!context) {
      setStatus("브라우저 오디오 미지원");
      return;
    }

    if (!audioState.started) {
      audioState.started = true;
      audioState.step = 0;
      audioState.nextNoteTime = context.currentTime + 0.05;
    }

    if (!audioState.unlockPlayed) {
      audioState.unlockPlayed = true;
      playMusicUnlockTone(context.currentTime + 0.02);
    }

    audioState.masterGain.gain.cancelScheduledValues(context.currentTime);
    audioState.masterGain.gain.setValueAtTime(audioState.masterGain.gain.value, context.currentTime);
    audioState.masterGain.gain.linearRampToValueAtTime(
      getMusicTargetVolume(),
      context.currentTime + 0.22,
    );

    updateBackgroundMusic();
    setStatus(audioState.muted ? "음악 꺼짐" : "배경음악 재생중");
  } catch {
    setStatus("음악 시작 실패");
  }
};

const updateBackgroundMusic = () => {
  const context = audioState.context;
  if (!audioState.started || !context) {
    return;
  }

  if (
    context.state === "suspended"
    && !audioState.resumePromise
  ) {
    audioState.resumePromise = context.resume()
      .catch(() => {
        setStatus("브라우저가 음악을 막고 있다");
      })
      .finally(() => {
        audioState.resumePromise = null;
      });
  }

  if (audioState.nextNoteTime < context.currentTime - 0.3) {
    audioState.nextNoteTime = context.currentTime + 0.08;
  }

  const targetVolume = getMusicTargetVolume();
  audioState.masterGain.gain.setTargetAtTime(targetVolume, context.currentTime, 0.8);

  while (audioState.nextNoteTime < context.currentTime + 0.7) {
    scheduleMusicStep(audioState.nextNoteTime);
    audioState.nextNoteTime += audioState.stepDuration;
    audioState.step += 1;
  }
};

const toggleMusicMute = () => {
  startBackgroundMusic();
  audioState.muted = !audioState.muted;
  if (!audioState.context || !audioState.masterGain) {
    return;
  }
  const targetVolume = getMusicTargetVolume();
  audioState.masterGain.gain.cancelScheduledValues(audioState.context.currentTime);
  audioState.masterGain.gain.setTargetAtTime(targetVolume, audioState.context.currentTime, 0.12);
  setStatus(audioState.muted ? "음악 꺼짐" : "음악 켜짐");
};

const wrapAngle = (value) => {
  let angle = value;
  while (angle > Math.PI) {
    angle -= TAU;
  }
  while (angle < -Math.PI) {
    angle += TAU;
  }
  return angle;
};

const shade = (hex, amount) => {
  let channels;

  if (hex.startsWith("#")) {
    const normalized = hex.replace("#", "");
    const full = normalized.length === 3
      ? normalized.split("").map((char) => char + char).join("")
      : normalized;
    const parsed = Number.parseInt(full, 16);
    channels = [
      (parsed >> 16) & 255,
      (parsed >> 8) & 255,
      parsed & 255,
    ];
  } else {
    const match = hex.match(/\d+/g);
    channels = match ? match.slice(0, 3).map(Number) : [255, 255, 255];
  }

  const change = (channel) => clamp(channel + amount, 0, 255);
  return `rgb(${change(channels[0])}, ${change(channels[1])}, ${change(channels[2])})`;
};

const keyForBlock = (x, y, z) => `${x},${y},${z}`;

const getBlock = (x, y, z) => world.blocks.get(keyForBlock(x, y, z)) ?? null;
const isSolidBlock = (block) => Boolean(block && BLOCK_TYPES[block.type].solid !== false);
const isClimbableBlock = (block) => Boolean(block && BLOCK_TYPES[block.type].climbable);

const setBlock = (x, y, z, type) => {
  world.blocks.set(keyForBlock(x, y, z), { x, y, z, type });
};

const removeBlock = (x, y, z) => {
  world.blocks.delete(keyForBlock(x, y, z));
};

const addRect = (x0, y0, z0, width, depth, type) => {
  for (let z = z0; z < z0 + depth; z += 1) {
    for (let x = x0; x < x0 + width; x += 1) {
      setBlock(x, y0, z, type);
    }
  }
};

const addColumn = (x, y0, z, height, type) => {
  for (let y = y0; y < y0 + height; y += 1) {
    setBlock(x, y, z, type);
  }
};

const addVolume = (x0, y0, z0, width, height, depth, type) => {
  for (let y = y0; y < y0 + height; y += 1) {
    addRect(x0, y, z0, width, depth, type);
  }
};

const clearVolume = (x0, y0, z0, width, height, depth) => {
  for (let y = y0; y < y0 + height; y += 1) {
    for (let z = z0; z < z0 + depth; z += 1) {
      for (let x = x0; x < x0 + width; x += 1) {
        removeBlock(x, y, z);
      }
    }
  }
};

const spawnMob = (type, x, z, overrides = {}) => {
  const preset = ENTITY_PRESETS[type] ?? {};
  return createEntity(type, x, z, {
    ...preset,
    ...overrides,
    drops: { ...(preset.drops ?? {}), ...(overrides.drops ?? {}) },
  });
};

const carveDoor = (x, z, facing) => {
  if (facing === "north" || facing === "south") {
    for (let y = 0; y < 3; y += 1) {
      removeBlock(x, y, z);
    }
    removeBlock(x - 1, 1, z);
    removeBlock(x + 1, 1, z);
    return;
  }

  for (let y = 0; y < 3; y += 1) {
    removeBlock(x, y, z);
  }
  removeBlock(x, 1, z - 1);
  removeBlock(x, 1, z + 1);
};

const buildHouse = (x0, z0, width, depth, facing, wallType = "brick") => {
  const x1 = x0 + width - 1;
  const z1 = z0 + depth - 1;

  for (let y = 0; y < 4; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      setBlock(x, y, z0, wallType);
      setBlock(x, y, z1, wallType);
    }
    for (let z = z0; z <= z1; z += 1) {
      setBlock(x0, y, z, wallType);
      setBlock(x1, y, z, wallType);
    }
  }

  addColumn(x0, 0, z0, 5, "log");
  addColumn(x1, 0, z0, 5, "log");
  addColumn(x0, 0, z1, 5, "log");
  addColumn(x1, 0, z1, 5, "log");
  addVolume(x0 - 1, 4, z0 - 1, width + 2, 1, depth + 2, "plank");
  clearVolume(x0 + 1, 0, z0 + 1, Math.max(1, width - 2), 4, Math.max(1, depth - 2));

  const middleX = Math.floor((x0 + x1) * 0.5);
  const middleZ = Math.floor((z0 + z1) * 0.5);
  if (facing === "south") {
    carveDoor(middleX, z1, "south");
  } else if (facing === "north") {
    carveDoor(middleX, z0, "north");
  } else if (facing === "east") {
    carveDoor(x1, middleZ, "east");
  } else {
    carveDoor(x0, middleZ, "west");
  }

  removeBlock(x0 + 1, 1, z0);
  removeBlock(x1 - 1, 1, z0);
  removeBlock(x0 + 1, 1, z1);
  removeBlock(x1 - 1, 1, z1);

  if (width >= 5 && depth >= 5) {
    const middleX = Math.floor((x0 + x1) * 0.5);
    const middleZ = Math.floor((z0 + z1) * 0.5);
    let bedX = middleX;
    let bedZ = middleZ;
    if (facing === "south") {
      bedZ = z0 + 1;
    } else if (facing === "north") {
      bedZ = z1 - 1;
    } else if (facing === "east") {
      bedX = x0 + 1;
    } else {
      bedX = x1 - 1;
    }
    setBlock(bedX, 0, bedZ, "bed");
  }
};

const buildWell = (centerX, centerZ) => {
  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (Math.abs(dx) === 1 || Math.abs(dz) === 1) {
        setBlock(centerX + dx, 0, centerZ + dz, "brick");
      }
    }
  }

  addColumn(centerX - 1, 1, centerZ - 1, 3, "log");
  addColumn(centerX + 1, 1, centerZ - 1, 3, "log");
  addColumn(centerX - 1, 1, centerZ + 1, 3, "log");
  addColumn(centerX + 1, 1, centerZ + 1, 3, "log");
  addVolume(centerX - 2, 4, centerZ - 2, 5, 1, 5, "plank");
};

const buildRoad = (x0, z0, x1, z1, width = 3, type = "stone") => {
  const half = Math.floor(width * 0.5);
  if (x0 === x1) {
    const start = Math.min(z0, z1);
    const end = Math.max(z0, z1);
    addRect(x0 - half, 0, start, width, end - start + 1, type);
    return;
  }

  if (z0 === z1) {
    const start = Math.min(x0, x1);
    const end = Math.max(x0, x1);
    addRect(start, 0, z0 - half, end - start + 1, width, type);
  }
};

const buildMarketStall = (x0, z0, width, depth, facing = "south") => {
  const x1 = x0 + width - 1;
  const z1 = z0 + depth - 1;
  addColumn(x0, 0, z0, 3, "log");
  addColumn(x1, 0, z0, 3, "log");
  addColumn(x0, 0, z1, 3, "log");
  addColumn(x1, 0, z1, 3, "log");
  addRect(x0 - 1, 3, z0 - 1, width + 2, depth + 2, "plank");
  if (facing === "south") {
    addVolume(x0, 1, z0, width, 2, 1, "log");
  } else if (facing === "north") {
    addVolume(x0, 1, z1, width, 2, 1, "log");
  } else if (facing === "east") {
    addVolume(x0, 1, z0, 1, 2, depth, "log");
  } else {
    addVolume(x1, 1, z0, 1, 2, depth, "log");
  }
};

const buildFarmPlot = (x0, z0, width, depth) => {
  const x1 = x0 + width - 1;
  const z1 = z0 + depth - 1;
  for (let z = z0; z <= z1; z += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const edge = x === x0 || x === x1 || z === z0 || z === z1;
      setBlock(x, 0, z, edge ? "log" : (x + z) % 3 === 0 ? "grass" : "dirt");
    }
  }

  addColumn(x0 + 1, 0, z1 - 1, 3, "log");
  addColumn(x0 + 3, 0, z1 - 1, 3, "log");
  addRect(x0, 3, z1 - 2, 5, 2, "plank");
};

const buildWatchtower = (centerX, centerZ) => {
  addColumn(centerX - 1, 0, centerZ - 1, 7, "log");
  addColumn(centerX + 1, 0, centerZ - 1, 7, "log");
  addColumn(centerX - 1, 0, centerZ + 1, 7, "log");
  addColumn(centerX + 1, 0, centerZ + 1, 7, "log");
  addRect(centerX - 2, 5, centerZ - 2, 5, 5, "plank");
  addRect(centerX - 3, 7, centerZ - 3, 7, 7, "plank");
  addColumn(centerX - 2, 0, centerZ, 5, "ladder");
  clearVolume(centerX - 1, 5, centerZ - 1, 3, 2, 3);
};

const buildWindmill = (centerX, centerZ) => {
  addVolume(centerX - 1, 0, centerZ - 1, 3, 5, 3, "brick");
  clearVolume(centerX, 1, centerZ, 1, 4, 1);
  addColumn(centerX - 1, 0, centerZ, 5, "ladder");
  addRect(centerX - 2, 5, centerZ - 2, 5, 5, "plank");
  addRect(centerX - 4, 6, centerZ, 9, 1, "plank");
  addRect(centerX, 6, centerZ - 4, 1, 9, "plank");
  addRect(centerX - 3, 7, centerZ - 3, 7, 7, "plank");
  addColumn(centerX, 5, centerZ, 3, "log");
};

const buildShrine = (centerX, centerZ) => {
  addRect(centerX - 2, 0, centerZ - 2, 5, 5, "brick");
  clearVolume(centerX - 1, 1, centerZ - 1, 3, 3, 3);
  addColumn(centerX - 2, 0, centerZ - 2, 4, "log");
  addColumn(centerX + 2, 0, centerZ - 2, 4, "log");
  addColumn(centerX - 2, 0, centerZ + 2, 4, "log");
  addColumn(centerX + 2, 0, centerZ + 2, 4, "log");
  addRect(centerX - 3, 4, centerZ - 3, 7, 7, "plank");
  removeBlock(centerX, 1, centerZ - 2);
  removeBlock(centerX, 2, centerZ - 2);
  setBlock(centerX, 0, centerZ, "bed");
};

const buildVillage = () => {
  buildRoad(0, -10, 0, 36, 3);
  buildRoad(-34, 12, 34, 12, 3);
  buildWell(VILLAGE_CENTER.x, VILLAGE_CENTER.z);

  addColumn(-4, 0, 0, 4, "log");
  addColumn(4, 0, 0, 4, "log");
  addRect(-4, 3, 0, 9, 1, "plank");

  buildHouse(-16, 4, 6, 6, "east");
  buildHouse(10, 4, 6, 6, "west");
  buildHouse(-16, 16, 6, 6, "east");
  buildHouse(10, 16, 6, 6, "west");
  buildHouse(-6, 22, 6, 5, "south");
  buildHouse(-28, 24, 7, 6, "east", "plank");
  buildHouse(20, 24, 7, 6, "west", "plank");

  addColumn(-8, 0, 10, 3, "log");
  addColumn(-5, 0, 10, 3, "log");
  addRect(-9, 3, 9, 6, 3, "plank");

  addColumn(5, 0, 10, 3, "log");
  addColumn(8, 0, 10, 3, "log");
  addRect(4, 3, 9, 6, 3, "plank");

  buildMarketStall(-11, 27, 4, 3, "south");
  buildMarketStall(8, 27, 4, 3, "south");
  buildFarmPlot(-35, 15, 10, 9);
  buildWatchtower(-26, -2);
  buildWatchtower(26, -2);
  buildWindmill(28, 10);
  buildShrine(0, 34);
};

const createInventoryDefaults = () => {
  Object.keys(ITEM_TYPES).forEach((itemId) => {
    inventory[itemId] = 0;
  });
  inventory.grass = 8;
  inventory.dirt = 10;
  inventory.stone = 7;
  inventory.log = 5;
  inventory.apple = 4;
  inventory.pork = 0;
  inventory.beef = 0;
  inventory.stick = 4;
  inventory.pickaxe = 0;
  inventory.shovel = 0;
  inventory.axe = 0;
  inventory.knife = 0;
  inventory.spear = 0;
  inventory.ladder = 6;
  inventory.plank = 0;
  inventory.brick = 0;
  inventory.bandage = 0;
  inventory.wool = 0;
  inventory.slimeGel = 0;
};

const createEntity = (type, x, z, options = {}) => ({
  type,
  x,
  y: 0,
  z,
  yaw: options.yaw ?? rand(-Math.PI, Math.PI),
  targetYaw: options.yaw ?? rand(-Math.PI, Math.PI),
  speed: options.speed ?? rand(0.25, 0.65),
  baseSpeed: options.speed ?? rand(0.25, 0.65),
  radius: options.radius ?? 0.9,
  height: options.height ?? 1.6,
  hop: 0,
  phase: rand(0, TAU),
  moveTimer: rand(1.1, 3.4),
  hitFlash: 0,
  reaction: 0,
  kindScale: options.kindScale ?? 1,
  hp: options.hp ?? 2,
  attackCooldown: 0,
  drops: options.drops ?? {},
  hostile: options.hostile ?? false,
  homeX: options.homeX ?? x,
  homeZ: options.homeZ ?? z,
  roamRadius: options.roamRadius ?? 8,
  dead: false,
});

const modelBox = (cx, cy, cz, w, h, d, palette) => ({
  cx,
  cy,
  cz,
  w,
  h,
  d,
  palette,
});

const MODELS = {
  pig: [
    modelBox(0, 0.86, 0, 1.4, 0.85, 2.1, { front: "#dca0a0", side: "#c98e8e", top: "#ecb7b7" }),
    modelBox(0, 0.98, 1.44, 0.84, 0.72, 0.84, { front: "#e2a8a8", side: "#c78d8d", top: "#efbcbc" }),
    modelBox(0, 0.85, 1.86, 0.42, 0.3, 0.2, { front: "#efb9bf", side: "#d5979d", top: "#f8ced4" }),
    modelBox(-0.46, 0.34, -0.58, 0.28, 0.68, 0.28, { front: "#c26e57", side: "#a85440", top: "#d3846c" }),
    modelBox(0.46, 0.34, -0.58, 0.28, 0.68, 0.28, { front: "#c26e57", side: "#a85440", top: "#d3846c" }),
    modelBox(-0.46, 0.34, 0.62, 0.28, 0.68, 0.28, { front: "#c26e57", side: "#a85440", top: "#d3846c" }),
    modelBox(0.46, 0.34, 0.62, 0.28, 0.68, 0.28, { front: "#c26e57", side: "#a85440", top: "#d3846c" }),
    modelBox(0, 1.42, 1.45, 0.3, 0.15, 0.3, { front: "#f6cccc", side: "#d9aaaa", top: "#ffe3e3" }),
  ],
  cow: [
    modelBox(0, 1.02, 0, 1.55, 1.02, 2.3, { front: "#5a453d", side: "#47352d", top: "#746057" }),
    modelBox(0, 1.08, 1.64, 0.9, 0.82, 0.92, { front: "#60463e", side: "#46312b", top: "#7a6158" }),
    modelBox(-0.5, 0.38, -0.7, 0.24, 0.76, 0.24, { front: "#312721", side: "#221a17", top: "#4f4139" }),
    modelBox(0.5, 0.38, -0.7, 0.24, 0.76, 0.24, { front: "#312721", side: "#221a17", top: "#4f4139" }),
    modelBox(-0.5, 0.38, 0.7, 0.24, 0.76, 0.24, { front: "#312721", side: "#221a17", top: "#4f4139" }),
    modelBox(0.5, 0.38, 0.7, 0.24, 0.76, 0.24, { front: "#312721", side: "#221a17", top: "#4f4139" }),
    modelBox(-0.26, 1.48, 1.98, 0.16, 0.18, 0.16, { front: "#f2e2c2", side: "#dcccae", top: "#fff3da" }),
    modelBox(0.26, 1.48, 1.98, 0.16, 0.18, 0.16, { front: "#f2e2c2", side: "#dcccae", top: "#fff3da" }),
  ],
  sheep: [
    modelBox(0, 1.08, 0, 1.72, 1.08, 2.15, { front: "#efefe4", side: "#d6d6cb", top: "#ffffff" }),
    modelBox(0, 0.96, 1.54, 0.76, 0.72, 0.8, { front: "#c6af95", side: "#a69178", top: "#dfccb7" }),
    modelBox(-0.5, 0.38, -0.62, 0.24, 0.76, 0.24, { front: "#7f6754", side: "#665140", top: "#9e8572" }),
    modelBox(0.5, 0.38, -0.62, 0.24, 0.76, 0.24, { front: "#7f6754", side: "#665140", top: "#9e8572" }),
    modelBox(-0.5, 0.38, 0.62, 0.24, 0.76, 0.24, { front: "#7f6754", side: "#665140", top: "#9e8572" }),
    modelBox(0.5, 0.38, 0.62, 0.24, 0.76, 0.24, { front: "#7f6754", side: "#665140", top: "#9e8572" }),
  ],
  villager: [
    modelBox(0, 1.12, 0, 0.86, 1.2, 0.54, { front: "#8c5b39", side: "#71472b", top: "#ad734c" }),
    modelBox(0, 1.96, 0.02, 0.74, 0.74, 0.74, { front: "#e3bea0", side: "#c49b7f", top: "#f6dcc5" }),
    modelBox(0, 1.76, 0.4, 0.14, 0.18, 0.18, { front: "#c59272", side: "#aa7859", top: "#ddb69a" }),
    modelBox(0, 1.16, 0.18, 0.48, 0.22, 0.18, { front: "#b7a267", side: "#9a864f", top: "#d5c17f" }),
    modelBox(-0.2, 0.42, 0.02, 0.24, 0.92, 0.24, { front: "#5c3ca0", side: "#482d7e", top: "#765abf" }),
    modelBox(0.2, 0.42, 0.02, 0.24, 0.92, 0.24, { front: "#5c3ca0", side: "#482d7e", top: "#765abf" }),
  ],
  ironGolem: [
    modelBox(0, 1.5, 0, 1.3, 1.54, 0.82, { front: "#d7dad3", side: "#bcc0b9", top: "#f0f2ed" }),
    modelBox(0, 2.58, 0.02, 0.88, 0.88, 0.88, { front: "#e5e7e1", side: "#caced0", top: "#ffffff" }),
    modelBox(0, 1.96, 0.48, 0.18, 0.2, 0.2, { front: "#b68d63", side: "#926d49", top: "#d4ab7c" }),
    modelBox(-0.92, 1.34, 0.04, 0.26, 1.42, 0.26, { front: "#b8c08f", side: "#979f72", top: "#d7deb1" }),
    modelBox(0.92, 1.34, 0.04, 0.26, 1.42, 0.26, { front: "#b8c08f", side: "#979f72", top: "#d7deb1" }),
    modelBox(-0.34, 0.42, 0.02, 0.32, 1.08, 0.32, { front: "#8f7560", side: "#715b4b", top: "#aa9078" }),
    modelBox(0.34, 0.42, 0.02, 0.32, 1.08, 0.32, { front: "#8f7560", side: "#715b4b", top: "#aa9078" }),
  ],
  slime: [
    modelBox(0, 0.46, 0, 0.9, 0.9, 0.9, { front: "#6fd464", side: "#54a84f", top: "#95ef84" }),
    modelBox(0, 0.46, 0, 0.6, 0.6, 0.6, { front: "#8cf287", side: "#6ecb68", top: "#b2ffad" }),
  ],
  zombie: [
    modelBox(0, 1.22, 0, 0.86, 1.16, 0.54, { front: "#5b8f67", side: "#476f50", top: "#7bb087" }),
    modelBox(0, 1.98, 0.02, 0.72, 0.72, 0.72, { front: "#6da47b", side: "#527d5d", top: "#8fc297" }),
    modelBox(-0.56, 1.18, 0.04, 0.22, 1.06, 0.22, { front: "#4f7b5a", side: "#3b5d44", top: "#71997b" }),
    modelBox(0.56, 1.18, 0.04, 0.22, 1.06, 0.22, { front: "#4f7b5a", side: "#3b5d44", top: "#71997b" }),
    modelBox(-0.2, 0.44, 0.02, 0.24, 0.88, 0.24, { front: "#3347a1", side: "#27377d", top: "#5569c0" }),
    modelBox(0.2, 0.44, 0.02, 0.24, 0.88, 0.24, { front: "#3347a1", side: "#27377d", top: "#5569c0" }),
  ],
  skeleton: [
    modelBox(0, 1.22, 0, 0.48, 1.14, 0.36, { front: "#d9dadc", side: "#b6b9bf", top: "#f6f7f8" }),
    modelBox(0, 1.98, 0.02, 0.66, 0.66, 0.66, { front: "#efefef", side: "#cbced4", top: "#ffffff" }),
    modelBox(-0.46, 1.18, 0.02, 0.14, 1.08, 0.14, { front: "#ececed", side: "#b9bcc1", top: "#ffffff" }),
    modelBox(0.46, 1.18, 0.02, 0.14, 1.08, 0.14, { front: "#ececed", side: "#b9bcc1", top: "#ffffff" }),
    modelBox(-0.14, 0.46, 0.02, 0.14, 0.92, 0.14, { front: "#ececed", side: "#b9bcc1", top: "#ffffff" }),
    modelBox(0.14, 0.46, 0.02, 0.14, 0.92, 0.14, { front: "#ececed", side: "#b9bcc1", top: "#ffffff" }),
    modelBox(0.72, 1.26, 0.04, 0.08, 1.06, 0.08, { front: "#8f6541", side: "#6d4d31", top: "#b58457" }),
  ],
  spider: [
    modelBox(0, 0.46, -0.08, 1.48, 0.44, 1.22, { front: "#342725", side: "#241917", top: "#4d3b37" }),
    modelBox(0, 0.54, 0.86, 1.02, 0.54, 0.84, { front: "#4a3632", side: "#342420", top: "#664d48" }),
    modelBox(-0.92, 0.34, -0.52, 1.1, 0.08, 0.08, { front: "#201716", side: "#16100f", top: "#3c2b2a" }),
    modelBox(0.92, 0.34, -0.52, 1.1, 0.08, 0.08, { front: "#201716", side: "#16100f", top: "#3c2b2a" }),
    modelBox(-0.96, 0.3, 0.18, 1.16, 0.08, 0.08, { front: "#201716", side: "#16100f", top: "#3c2b2a" }),
    modelBox(0.96, 0.3, 0.18, 1.16, 0.08, 0.08, { front: "#201716", side: "#16100f", top: "#3c2b2a" }),
  ],
  creeper: [
    modelBox(0, 1.12, 0, 0.84, 1.16, 0.56, { front: "#63b95d", side: "#468647", top: "#83d680" }),
    modelBox(0, 1.94, 0.04, 0.74, 0.82, 0.74, { front: "#75cd6f", side: "#569d55", top: "#99ec92" }),
    modelBox(-0.22, 0.32, -0.18, 0.18, 0.66, 0.18, { front: "#4c8b49", side: "#38673a", top: "#6cb268" }),
    modelBox(0.22, 0.32, -0.18, 0.18, 0.66, 0.18, { front: "#4c8b49", side: "#38673a", top: "#6cb268" }),
    modelBox(-0.22, 0.32, 0.24, 0.18, 0.66, 0.18, { front: "#4c8b49", side: "#38673a", top: "#6cb268" }),
    modelBox(0.22, 0.32, 0.24, 0.18, 0.66, 0.18, { front: "#4c8b49", side: "#38673a", top: "#6cb268" }),
  ],
};

const buildHotbar = () => {
  refs.hotbar.innerHTML = Array.from({ length: HOTBAR_SIZE }, (_, index) => `
    <div class="slot" data-index="${index}">
      <span class="slot__key">${index + 1}</span>
      <span class="slot__name"></span>
      <span class="slot__count"></span>
    </div>
  `).join("");

  inputState.hotbarEls = [...refs.hotbar.querySelectorAll(".slot")];
};

const setStatus = (message, duration = 2.3) => {
  refs.statusLabel.textContent = message;
  world.statusTimer = duration;
};

const setSoundCaption = (message, duration = 1.8) => {
  world.lastSound = `최근 소리: ${message}`;
  world.soundTimer = duration;
  refs.soundLabel.textContent = world.lastSound;
};

const isUiBlockingOpen = () => inputState.inventoryOpen || inputState.settingsOpen;

const addItem = (itemId, amount = 1) => {
  inventory[itemId] = (inventory[itemId] ?? 0) + amount;
};

const removeItemCount = (itemId, amount = 1) => {
  inventory[itemId] = Math.max(0, (inventory[itemId] ?? 0) - amount);
};

const getSelectedItemId = () => inputState.hotbarItems[player.selectedSlot] ?? null;
const getSelectedItem = () => ITEM_TYPES[getSelectedItemId()] ?? null;

const getCombatStats = () => {
  const item = getSelectedItem();
  return {
    damage: item?.combat?.damage ?? 1,
    range: item?.combat?.range ?? 7.2,
  };
};

const isCriticalAttack = () =>
  !player.onGround
  && player.velocityY <= CRITICAL_HIT_FALL_SPEED
  && !getClimbBlockAt();

const getMiningDuration = (blockType) => {
  const block = BLOCK_TYPES[blockType];
  const item = getSelectedItem();
  const preferredTool = block.preferredTool;
  const speedBonus = preferredTool ? item?.tool?.[preferredTool] ?? 1 : 1;
  const mismatchPenalty = item?.tool && preferredTool && !item.tool[preferredTool] ? 1.18 : 1;
  return Math.max(0.16, (block.hardness * mismatchPenalty) / speedBonus);
};

const formatItemStack = (entries) =>
  Object.entries(entries)
    .map(([itemId, amount]) => `${ITEM_TYPES[itemId].label} x${amount}`)
    .join(" · ");

const canCraftRecipe = (recipe) =>
  Object.entries(recipe.costs).every(([itemId, amount]) => (inventory[itemId] ?? 0) >= amount);

const craftRecipe = (recipeId) => {
  const recipe = CRAFTING_RECIPES.find((entry) => entry.id === recipeId);
  if (!recipe) {
    return;
  }
  if (!canCraftRecipe(recipe)) {
    setStatus("재료가 부족하다");
    return;
  }

  Object.entries(recipe.costs).forEach(([itemId, amount]) => {
    removeItemCount(itemId, amount);
  });
  Object.entries(recipe.gives).forEach(([itemId, amount]) => {
    addItem(itemId, amount);
  });

  setStatus(`${recipe.title} 제작`);
  playSoundEffect("craft");
  inputState.inventorySignature = "";
};

const equipSelectedSlot = (itemId) => {
  if ((inventory[itemId] ?? 0) <= 0) {
    setStatus("그 아이템은 없다");
    return;
  }

  inputState.hotbarItems[player.selectedSlot] = itemId;
  inputState.inventorySignature = "";
  setStatus(`${ITEM_TYPES[itemId].label} 장착`);
  playSoundEffect("uiSelect");
};

const getSortedInventoryIds = () =>
  Object.keys(ITEM_TYPES).sort((left, right) => {
    const leftCount = inventory[left] ?? 0;
    const rightCount = inventory[right] ?? 0;
    if ((leftCount > 0) !== (rightCount > 0)) {
      return rightCount > 0 ? 1 : -1;
    }
    if (rightCount !== leftCount) {
      return rightCount - leftCount;
    }
    if (ITEM_TYPES[left].category !== ITEM_TYPES[right].category) {
      return ITEM_TYPES[left].category.localeCompare(ITEM_TYPES[right].category, "ko");
    }
    return ITEM_TYPES[left].label.localeCompare(ITEM_TYPES[right].label, "ko");
  });

const getInventorySignature = () => [
  player.selectedSlot,
  inputState.hotbarItems.join(","),
  ...Object.keys(ITEM_TYPES).map((itemId) => `${itemId}:${inventory[itemId] ?? 0}`),
].join("|");

const syncPlayerHeight = () => {
  player.y = player.feetY + player.eyeHeight;
};

const updateActionMeter = (visible, label = "", progress = 0) => {
  refs.actionMeter.classList.toggle("is-hidden", !visible);
  refs.actionMeter.setAttribute("aria-hidden", String(!visible));
  refs.actionLabel.textContent = label;
  refs.actionFill.style.width = `${clamp(progress, 0, 1) * 100}%`;
};

const cancelMining = () => {
  inputState.miningBlockKey = "";
  inputState.miningProgress = 0;
  inputState.miningDuration = 0;
  inputState.miningLabel = "";
  inputState.miningPulseTimer = 0;
  updateActionMeter(false);
};

const isPlayerOverlappingBlock = (x, y, z) => {
  const centerX = x + 0.5;
  const centerZ = z + 0.5;
  return (
    Math.abs(centerX - player.x) < 0.72 &&
    Math.abs(centerZ - player.z) < 0.72 &&
    y < player.feetY + 1.8 &&
    y + 1 > player.feetY
  );
};

const groundColor = (x, z) => {
  const key = `${x}:${z}`;
  if (!world.grassCache.has(key)) {
    const noise = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
    const tone = 108 + Math.floor(noise * 34);
    const red = 88 + Math.floor(noise * 18);
    const blue = 64 + Math.floor(noise * 14);
    world.grassCache.set(key, `rgb(${red}, ${tone}, ${blue})`);
  }
  return world.grassCache.get(key);
};

const seedBlocks = () => {
  world.blocks.clear();

  buildVillage();

  addRect(18, 0, 10, 2, 2, "stone");
  addColumn(19, 1, 10, 2, "stone");
  addColumn(-20, 0, 12, 3, "log");
  addColumn(-19, 0, 12, 2, "log");
  addRect(20, 0, 22, 2, 2, "dirt");
  setBlock(20, 1, 22, "grass");
  setBlock(21, 1, 22, "grass");
  addRect(-22, 0, 22, 2, 2, "dirt");
  setBlock(-22, 1, 22, "grass");
  setBlock(-21, 1, 22, "grass");
};

const seedEntities = () => {
  world.entities = [
    spawnMob("pig", -14.5, -3.4, { yaw: -0.4 }),
    spawnMob("pig", 16.4, 27.8, { kindScale: 0.98 }),
    spawnMob("cow", -22.5, 8.6),
    spawnMob("sheep", 22.6, 5.1),
    spawnMob("villager", -11.5, 7.2, { homeX: -12, homeZ: 9, roamRadius: 11, yaw: 0.8 }),
    spawnMob("villager", 11.5, 8.6, { homeX: 12, homeZ: 9, roamRadius: 11, yaw: -0.6 }),
    spawnMob("villager", -4.2, 25.6, { homeX: -3, homeZ: 24, roamRadius: 10, yaw: 1.2 }),
    spawnMob("villager", 6.8, 27.4, { homeX: 7, homeZ: 26, roamRadius: 9, yaw: -1.1 }),
    spawnMob("ironGolem", 0.8, 15.2, { homeX: 0, homeZ: 14, roamRadius: 20, yaw: 0.2 }),
  ];
};

const isNearVillage = (x, z, extraRadius = 0) =>
  Math.hypot(x - VILLAGE_CENTER.x, z - VILLAGE_CENTER.z) < VILLAGE_SAFE_RADIUS + extraRadius;

const isEntitySpawnClear = (x, z, radius = 0.95) => {
  const samples = [
    [0, 0],
    [-radius, -radius],
    [radius, -radius],
    [-radius, radius],
    [radius, radius],
  ];

  const clearBlocks = samples.every(([offsetX, offsetZ]) => {
    const cellX = Math.floor(x + offsetX);
    const cellZ = Math.floor(z + offsetZ);
    for (let y = 0; y <= 3; y += 1) {
      if (getBlock(cellX, y, cellZ)) {
        return false;
      }
    }
    return true;
  });

  if (!clearBlocks) {
    return false;
  }

  if (Math.hypot(x - player.x, z - player.z) < 4.5) {
    return false;
  }

  return !world.entities.some((entity) =>
    !entity.dead && Math.hypot(entity.x - x, entity.z - z) < entity.radius + radius + 1.2,
  );
};

const spawnTimedMob = () => {
  const mobTypes = isHostileSpawnTime()
    ? ["zombie", "zombie", "skeleton", "spider", "creeper", "slime", "slime"]
    : ["pig", "pig", "cow", "sheep"];

  for (let attempt = 0; attempt < 28; attempt += 1) {
    const distance = rand(ENTITY_SPAWN_MIN_DISTANCE, ENTITY_SPAWN_MAX_DISTANCE);
    const angle = rand(0, TAU);
    const x = player.x + Math.cos(angle) * distance;
    const z = player.z + Math.sin(angle) * distance;

    if (isNearVillage(x, z, 4)) {
      continue;
    }

    if (!isEntitySpawnClear(x, z)) {
      continue;
    }

    const type = mobTypes[Math.floor(rand(0, mobTypes.length))];
    world.entities.push(spawnMob(type, x, z, { kindScale: rand(0.92, 1.12) }));
    if (world.entities.length > MAX_ACTIVE_ENTITIES) {
      let farthestIndex = 0;
      let farthestDistance = -1;
      world.entities.forEach((entity, index) => {
        const distance = Math.hypot(entity.x - player.x, entity.z - player.z);
        if (distance > farthestDistance) {
          farthestDistance = distance;
          farthestIndex = index;
        }
      });
      world.entities.splice(farthestIndex, 1);
    }
    return true;
  }

  return false;
};

const updateSpawner = (dt) => {
  world.spawnTimer += dt;
  while (world.spawnTimer >= ENTITY_SPAWN_INTERVAL) {
    world.spawnTimer -= ENTITY_SPAWN_INTERVAL;
    spawnTimedMob();
  }
};

const resetPlayer = () => {
  player.x = player.spawn.x;
  player.z = player.spawn.z;
  player.yaw = player.spawn.yaw;
  player.pitch = player.spawn.pitch;
  player.feetY = 0;
  player.velocityY = 0;
  player.onGround = true;
  player.health = player.maxHealth;
  player.hunger = player.maxHunger;
  player.bob = 0;
  player.damageCooldown = 0;
  player.hungerTimer = 0;
  player.regenTimer = 0;
  player.starveTimer = 0;
  player.stepTimer = 0;
  player.dead = false;
  syncPlayerHeight();
  cancelMining();
};

const seedWorld = () => {
  seedBlocks();
  seedEntities();
  resetPlayer();
  createInventoryDefaults();
  inputState.hotbarItems = [...DEFAULT_HOTBAR_ITEMS];
  inputState.inventorySignature = "";
  player.selectedSlot = 0;
  world.score = 0;
  world.elapsed = DAY_CYCLE_DURATION - TRANSITION_DURATION * 0.5;
  world.targetBlock = null;
  world.targetEntity = null;
  world.spawnTimer = 0;
};

const resize = () => {
  const pixelRatio = settingsState.renderScale / 100;
  refs.canvas.width = Math.max(540, Math.floor(window.innerWidth * pixelRatio));
  refs.canvas.height = Math.max(304, Math.floor(window.innerHeight * pixelRatio));
  ctx.imageSmoothingEnabled = false;
};

const worldToCamera = (point) => {
  const dx = point.x - player.x;
  const dy = point.y - player.y - player.bob;
  const dz = point.z - player.z;

  const cosYaw = Math.cos(player.yaw);
  const sinYaw = Math.sin(player.yaw);
  const localX = dx * cosYaw - dz * sinYaw;
  const localZ = dx * sinYaw + dz * cosYaw;

  const cosPitch = Math.cos(player.pitch);
  const sinPitch = Math.sin(player.pitch);

  return {
    x: localX,
    y: dy * cosPitch - localZ * sinPitch,
    z: dy * sinPitch + localZ * cosPitch,
  };
};

const project = (point) => {
  const cameraPoint = worldToCamera(point);
  if (cameraPoint.z <= NEAR) {
    return null;
  }

  const focal = (refs.canvas.height * 0.5) / Math.tan(FOV * 0.5);
  return {
    x: refs.canvas.width * 0.5 + (cameraPoint.x * focal) / cameraPoint.z,
    y: refs.canvas.height * 0.5 - (cameraPoint.y * focal) / cameraPoint.z,
    z: cameraPoint.z,
  };
};

const getViewDirection = () => ({
  x: Math.sin(player.yaw) * Math.cos(player.pitch),
  y: Math.sin(player.pitch),
  z: Math.cos(player.yaw) * Math.cos(player.pitch),
});

const isSolidAt = (x, y, z) => isSolidBlock(getBlock(Math.floor(x), Math.floor(y), Math.floor(z)));

const getColumnTopAt = (cellX, cellZ) => {
  let highest = 0;
  for (let y = 0; y <= MAX_BUILD_HEIGHT; y += 1) {
    if (isSolidBlock(getBlock(cellX, y, cellZ))) {
      highest = y + 1;
    }
  }
  return highest;
};

const getGroundPlacementHeightAt = (cellX, cellZ) => {
  let height = 0;
  while (height <= MAX_BUILD_HEIGHT && isSolidBlock(getBlock(cellX, height, cellZ))) {
    height += 1;
  }
  return height;
};

const getColumnSupportBelow = (cellX, cellZ, maxFeetY) => {
  let highest = 0;
  for (let y = 0; y <= MAX_BUILD_HEIGHT; y += 1) {
    if (isSolidBlock(getBlock(cellX, y, cellZ)) && y + 1 <= maxFeetY + 0.001) {
      highest = y + 1;
    }
  }
  return highest;
};

const getClimbBlockAt = (x = player.x, z = player.z, footY = player.feetY) => {
  const cellX = Math.floor(x);
  const cellZ = Math.floor(z);
  const sampleHeights = [0.12, 0.78, 1.38];

  for (const offsetY of sampleHeights) {
    const block = getBlock(cellX, Math.floor(footY + offsetY), cellZ);
    if (isClimbableBlock(block)) {
      return block;
    }
  }

  return null;
};

const getSupportHeightAt = (x, z, maxFeetY = player.feetY + 0.05) => {
  const samples = [
    [0, 0],
    [-0.32, -0.32],
    [0.32, -0.32],
    [-0.32, 0.32],
    [0.32, 0.32],
  ];
  const heights = samples.map(([offsetX, offsetZ]) => {
    const cellX = Math.floor(x + offsetX);
    const cellZ = Math.floor(z + offsetZ);
    return getColumnSupportBelow(cellX, cellZ, maxFeetY);
  });
  const centerHeight = heights[0];
  const uniqueHeights = [...new Set(heights)].sort((left, right) => right - left);

  for (const candidate of uniqueHeights) {
    const supportCount = heights.filter((height) => height >= candidate).length;
    if (centerHeight >= candidate || supportCount >= 3) {
      return candidate;
    }
  }

  return 0;
};

const collidesAt = (x, z, footY = player.feetY) => {
  const samples = [
    [-PLAYER_RADIUS, -PLAYER_RADIUS],
    [PLAYER_RADIUS, -PLAYER_RADIUS],
    [-PLAYER_RADIUS, PLAYER_RADIUS],
    [PLAYER_RADIUS, PLAYER_RADIUS],
  ];

  return samples.some(([offsetX, offsetZ]) =>
    isSolidAt(x + offsetX, footY + 0.1, z + offsetZ) ||
    isSolidAt(x + offsetX, footY + 1.1, z + offsetZ),
  );
};

const resolvePlayerCollision = () => {
  if (!collidesAt(player.x, player.z, player.feetY)) {
    return;
  }

  for (let iteration = 0; iteration < 8; iteration += 1) {
    let moved = false;
    const minCellX = Math.floor(player.x - PLAYER_RADIUS) - 1;
    const maxCellX = Math.floor(player.x + PLAYER_RADIUS) + 1;
    const minCellZ = Math.floor(player.z - PLAYER_RADIUS) - 1;
    const maxCellZ = Math.floor(player.z + PLAYER_RADIUS) + 1;
    const minCellY = Math.max(0, Math.floor(player.feetY));
    const maxCellY = Math.min(MAX_BUILD_HEIGHT, Math.floor(player.feetY + PLAYER_HEIGHT));

    for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
      for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ += 1) {
        for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
          const block = getBlock(cellX, cellY, cellZ);
          if (!isSolidBlock(block)) {
            continue;
          }

          const overlapX = Math.min(player.x + PLAYER_RADIUS, cellX + 1) - Math.max(player.x - PLAYER_RADIUS, cellX);
          const overlapZ = Math.min(player.z + PLAYER_RADIUS, cellZ + 1) - Math.max(player.z - PLAYER_RADIUS, cellZ);
          const overlapY = Math.min(player.feetY + PLAYER_HEIGHT, cellY + 1) - Math.max(player.feetY, cellY);

          if (overlapX <= 0 || overlapZ <= 0 || overlapY <= 0) {
            continue;
          }

          if (overlapX <= overlapZ) {
            player.x += player.x < cellX + 0.5 ? -(overlapX + 0.01) : overlapX + 0.01;
            player.x = clamp(player.x, -WORLD_LIMIT, WORLD_LIMIT);
          } else {
            player.z += player.z < cellZ + 0.5 ? -(overlapZ + 0.01) : overlapZ + 0.01;
            player.z = clamp(player.z, -WORLD_LIMIT, WORLD_LIMIT);
          }
          moved = true;
        }
      }
    }

    if (!moved || !collidesAt(player.x, player.z, player.feetY)) {
      break;
    }
  }
};

const pushPolygon = (polygons, points, fill, stroke = null) => {
  const projected = [];
  let depth = 0;

  for (const point of points) {
    const projection = project(point);
    if (!projection) {
      return;
    }
    projected.push(projection);
    depth += projection.z;
  }

  polygons.push({
    points: projected,
    depth: depth / projected.length,
    fill,
    stroke,
  });
};

const rotateLocalPoint = (point, yaw, scale) => {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  return {
    x: (point.x * cos - point.z * sin) * scale,
    y: point.y * scale,
    z: (point.x * sin + point.z * cos) * scale,
  };
};

const pushBox = (polygons, entity, box) => {
  const hw = box.w * 0.5;
  const hh = box.h * 0.5;
  const hd = box.d * 0.5;

  const localVertices = [
    { x: -hw, y: -hh, z: -hd },
    { x: hw, y: -hh, z: -hd },
    { x: hw, y: hh, z: -hd },
    { x: -hw, y: hh, z: -hd },
    { x: -hw, y: -hh, z: hd },
    { x: hw, y: -hh, z: hd },
    { x: hw, y: hh, z: hd },
    { x: -hw, y: hh, z: hd },
  ];

  const worldVertices = localVertices.map((vertex) => {
    const rotated = rotateLocalPoint(
      { x: vertex.x + box.cx, y: vertex.y + box.cy, z: vertex.z + box.cz },
      entity.yaw,
      entity.kindScale,
    );

    return {
      x: entity.x + rotated.x,
      y: entity.y + rotated.y + entity.hop,
      z: entity.z + rotated.z,
    };
  });

  const faces = [
    { index: [4, 5, 6, 7], fill: box.palette.front, stroke: shade(box.palette.front, -88) },
    { index: [0, 1, 2, 3], fill: shade(box.palette.front, -26), stroke: shade(box.palette.front, -96) },
    { index: [5, 1, 2, 6], fill: box.palette.side, stroke: shade(box.palette.side, -88) },
    { index: [0, 4, 7, 3], fill: shade(box.palette.side, -18), stroke: shade(box.palette.side, -96) },
    { index: [3, 7, 6, 2], fill: box.palette.top, stroke: shade(box.palette.top, -88) },
    { index: [0, 1, 5, 4], fill: shade(box.palette.side, -34), stroke: shade(box.palette.side, -112) },
  ];

  faces.forEach((face) => {
    const flashFill = entity.hitFlash > 0
      ? shade(face.fill, Math.floor(entity.hitFlash * 90))
      : face.fill;
    pushPolygon(
      polygons,
      face.index.map((vertexIndex) => worldVertices[vertexIndex]),
      flashFill,
      face.stroke,
    );
  });
};

const pushStaticBlock = (polygons, block) => {
  const palette = BLOCK_TYPES[block.type].palette;
  const x = block.x;
  const y = block.y;
  const z = block.z;

  if (block.type === "ladder") {
    const pushPrism = (x0, y0, z0, x1, y1, z1, prismPalette) => {
      const vertices = [
        { x: x0, y: y0, z: z0 },
        { x: x1, y: y0, z: z0 },
        { x: x1, y: y1, z: z0 },
        { x: x0, y: y1, z: z0 },
        { x: x0, y: y0, z: z1 },
        { x: x1, y: y0, z: z1 },
        { x: x1, y: y1, z: z1 },
        { x: x0, y: y1, z: z1 },
      ];

      const faces = [
        { index: [4, 5, 6, 7], fill: prismPalette.front, stroke: shade(prismPalette.front, -90) },
        { index: [0, 1, 2, 3], fill: shade(prismPalette.front, -26), stroke: shade(prismPalette.front, -102) },
        { index: [5, 1, 2, 6], fill: prismPalette.side, stroke: shade(prismPalette.side, -90) },
        { index: [0, 4, 7, 3], fill: shade(prismPalette.side, -16), stroke: shade(prismPalette.side, -98) },
        { index: [3, 7, 6, 2], fill: prismPalette.top, stroke: shade(prismPalette.top, -90) },
        { index: [0, 1, 5, 4], fill: shade(prismPalette.side, -36), stroke: shade(prismPalette.side, -110) },
      ];

      faces.forEach((face) => {
        pushPolygon(
          polygons,
          face.index.map((vertexIndex) => vertices[vertexIndex]),
          face.fill,
          face.stroke,
        );
      });
    };

    pushPrism(x + 0.43, y, z + 0.43, x + 0.57, y + 1, z + 0.57, palette);
    pushPrism(x + 0.24, y + 0.18, z + 0.44, x + 0.76, y + 0.26, z + 0.56, palette);
    pushPrism(x + 0.24, y + 0.46, z + 0.44, x + 0.76, y + 0.54, z + 0.56, palette);
    pushPrism(x + 0.24, y + 0.74, z + 0.44, x + 0.76, y + 0.82, z + 0.56, palette);
    return;
  }

  const vertices = [
    { x, y, z },
    { x: x + 1, y, z },
    { x: x + 1, y: y + 1, z },
    { x, y: y + 1, z },
    { x, y, z: z + 1 },
    { x: x + 1, y, z: z + 1 },
    { x: x + 1, y: y + 1, z: z + 1 },
    { x, y: y + 1, z: z + 1 },
  ];

  const faces = [
    { index: [4, 5, 6, 7], fill: palette.front, stroke: shade(palette.front, -90) },
    { index: [0, 1, 2, 3], fill: shade(palette.front, -26), stroke: shade(palette.front, -102) },
    { index: [5, 1, 2, 6], fill: palette.side, stroke: shade(palette.side, -90) },
    { index: [0, 4, 7, 3], fill: shade(palette.side, -16), stroke: shade(palette.side, -98) },
    { index: [3, 7, 6, 2], fill: palette.top, stroke: shade(palette.top, -90) },
    { index: [0, 1, 5, 4], fill: shade(palette.side, -36), stroke: shade(palette.side, -110) },
  ];

  faces.forEach((face) => {
    pushPolygon(
      polygons,
      face.index.map((vertexIndex) => vertices[vertexIndex]),
      face.fill,
      face.stroke,
    );
  });
};

const pushShadow = (polygons, entity) => {
  const radius = entity.radius * entity.kindScale * 0.95;
  const points = [];

  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * TAU;
    points.push({
      x: entity.x + Math.cos(angle) * radius,
      y: 0.03,
      z: entity.z + Math.sin(angle) * radius * 0.68,
    });
  }

  pushPolygon(polygons, points, "rgba(0, 0, 0, 0.14)");
};

const pushGround = (polygons) => {
  const baseX = Math.floor(player.x);
  const baseZ = Math.floor(player.z);
  const radius = GROUND_RENDER_RADIUS;

  for (let z = baseZ + radius; z >= baseZ - radius; z -= 1) {
    for (let x = baseX - radius; x <= baseX + radius; x += 1) {
      const corners = [
        { x, y: 0, z },
        { x: x + 1, y: 0, z },
        { x: x + 1, y: 0, z: z + 1 },
        { x, y: 0, z: z + 1 },
      ];

      const inFront = corners.some((corner) => worldToCamera(corner).z > 0.4);
      if (!inFront) {
        continue;
      }

      pushPolygon(polygons, corners, groundColor(x, z), "rgba(75, 92, 47, 0.12)");
    }
  }
};

const pushEntities = (polygons) => {
  world.entities.forEach((entity) => {
    if (entity.dead) {
      return;
    }
    pushShadow(polygons, entity);
    MODELS[entity.type].forEach((box) => pushBox(polygons, entity, box));
  });
};

const pushBlocks = (polygons) => {
  world.blocks.forEach((block) => {
    const dx = block.x + 0.5 - player.x;
    const dz = block.z + 0.5 - player.z;
    if (dx * dx + dz * dz > BLOCK_RENDER_RADIUS * BLOCK_RENDER_RADIUS) {
      return;
    }
    pushStaticBlock(polygons, block);
  });
};

const drawSky = () => {
  const night = getNightAmount();
  const gradient = ctx.createLinearGradient(0, 0, 0, refs.canvas.height);
  gradient.addColorStop(0, mixColor("#abc1ea", "#091320", night));
  gradient.addColorStop(0.62, mixColor("#abc1ea", "#1a2740", night));
  gradient.addColorStop(0.621, mixColor("#758a4e", "#33453d", night));
  gradient.addColorStop(1, mixColor("#688043", "#1d2a25", night));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, refs.canvas.width, refs.canvas.height);
};

const drawCloud = (x, y, scale) => {
  ctx.fillStyle = `rgba(255, 255, 255, ${lerp(0.2, 0.08, getNightAmount())})`;
  const width = 48 * scale;
  const height = 16 * scale;
  ctx.fillRect(x, y, width, height);
  ctx.fillRect(x + 10 * scale, y - 5 * scale, 34 * scale, height);
};

const drawNightOverlay = () => {
  const night = getNightAmount();
  if (night <= 0) {
    return;
  }

  ctx.fillStyle = `rgba(7, 16, 34, ${night * 0.34})`;
  ctx.fillRect(0, 0, refs.canvas.width, refs.canvas.height);
};

const spawnParticles = (point, amount = 10, tint = "rgba(255, 244, 224, 1)") => {
  for (let index = 0; index < amount; index += 1) {
    world.particles.push({
      x: point.x + rand(-0.35, 0.35),
      y: point.y + rand(-0.2, 0.6),
      z: point.z + rand(-0.35, 0.35),
      vx: rand(-0.8, 0.8),
      vy: rand(0.8, 1.8),
      vz: rand(-0.4, 0.6),
      life: rand(0.35, 0.7),
      maxLife: 0.7,
      size: rand(3, 6),
      tint,
    });
  }
};

const drawParticles = () => {
  world.particles.forEach((particle) => {
    const projected = project(particle);
    if (!projected) {
      return;
    }

    const alpha = particle.life / particle.maxLife;
    const size = Math.max(1, Math.round((particle.size * refs.canvas.height) / (projected.z * 230)));
    const tint = particle.tint.replace(", 1)", `, ${alpha})`);
    ctx.strokeStyle = tint;
    ctx.lineWidth = Math.max(1, size / 2);
    ctx.beginPath();
    ctx.moveTo(projected.x - size, projected.y - size);
    ctx.lineTo(projected.x + size, projected.y + size);
    ctx.moveTo(projected.x + size, projected.y - size);
    ctx.lineTo(projected.x - size, projected.y + size);
    ctx.stroke();
  });
};

const drawTargetOutline = () => {
  if (!world.targetBlock || world.targetBlock.kind !== "block") {
    return;
  }

  const { x, y, z } = world.targetBlock.cell;
  const vertices = [
    project({ x, y, z }),
    project({ x: x + 1, y, z }),
    project({ x: x + 1, y: y + 1, z }),
    project({ x, y: y + 1, z }),
    project({ x, y, z: z + 1 }),
    project({ x: x + 1, y, z: z + 1 }),
    project({ x: x + 1, y: y + 1, z: z + 1 }),
    project({ x, y: y + 1, z: z + 1 }),
  ];

  if (vertices.some((vertex) => vertex === null)) {
    return;
  }

  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];

  ctx.strokeStyle = "rgba(255, 250, 173, 0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  edges.forEach(([from, to]) => {
    ctx.moveTo(vertices[from].x, vertices[from].y);
    ctx.lineTo(vertices[to].x, vertices[to].y);
  });
  ctx.stroke();
};

const render = () => {
  drawSky();
  drawCloud(refs.canvas.width * 0.08, refs.canvas.height * 0.12, 1.08);
  drawCloud(refs.canvas.width * 0.78, refs.canvas.height * 0.09, 0.9);
  drawCloud(refs.canvas.width * 0.28, refs.canvas.height * 0.22, 0.72);

  const polygons = [];
  pushGround(polygons);
  pushBlocks(polygons);
  pushEntities(polygons);
  polygons.sort((left, right) => right.depth - left.depth);

  polygons.forEach((polygon) => {
    ctx.beginPath();
    ctx.moveTo(polygon.points[0].x, polygon.points[0].y);
    for (let index = 1; index < polygon.points.length; index += 1) {
      ctx.lineTo(polygon.points[index].x, polygon.points[index].y);
    }
    ctx.closePath();
    ctx.fillStyle = polygon.fill;
    ctx.fill();

    if (polygon.stroke) {
      ctx.strokeStyle = polygon.stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  drawNightOverlay();
  drawTargetOutline();
  drawParticles();
};

const inferFace = (lastCell, cell, direction) => {
  const face = {
    x: clamp(lastCell.x - cell.x, -1, 1),
    y: clamp(lastCell.y - cell.y, -1, 1),
    z: clamp(lastCell.z - cell.z, -1, 1),
  };

  if (face.x !== 0 || face.y !== 0 || face.z !== 0) {
    return face;
  }

  const absX = Math.abs(direction.x);
  const absY = Math.abs(direction.y);
  const absZ = Math.abs(direction.z);

  if (absX >= absY && absX >= absZ) {
    return { x: direction.x > 0 ? -1 : 1, y: 0, z: 0 };
  }
  if (absY >= absX && absY >= absZ) {
    return { x: 0, y: direction.y > 0 ? -1 : 1, z: 0 };
  }
  return { x: 0, y: 0, z: direction.z > 0 ? -1 : 1 };
};

const raycastBlock = (maxDistance = 6.2) => {
  const direction = getViewDirection();
  let lastCell = {
    x: Math.floor(player.x),
    y: Math.floor(player.y),
    z: Math.floor(player.z),
  };

  for (let distance = 0.18; distance <= maxDistance; distance += 0.05) {
    const point = {
      x: player.x + direction.x * distance,
      y: player.y + direction.y * distance,
      z: player.z + direction.z * distance,
    };

    if (point.y <= 0) {
      return {
        kind: "ground",
        cell: { x: Math.floor(point.x), y: 0, z: Math.floor(point.z) },
        face: { x: 0, y: 1, z: 0 },
        point,
        distance,
      };
    }

    const cell = {
      x: Math.floor(point.x),
      y: Math.floor(point.y),
      z: Math.floor(point.z),
    };
    const block = getBlock(cell.x, cell.y, cell.z);

    if (block) {
      return {
        kind: "block",
        block,
        cell,
        face: inferFace(lastCell, cell, direction),
        point,
        distance,
      };
    }

    lastCell = cell;
  }

  return null;
};

const raycastGround = (maxDistance = 6.2) => {
  const direction = getViewDirection();

  for (let distance = 0.18; distance <= maxDistance; distance += 0.05) {
    const point = {
      x: player.x + direction.x * distance,
      y: player.y + direction.y * distance,
      z: player.z + direction.z * distance,
    };

    if (point.y <= 0) {
      return {
        kind: "ground",
        cell: { x: Math.floor(point.x), y: 0, z: Math.floor(point.z) },
        face: { x: 0, y: 1, z: 0 },
        point,
        distance,
      };
    }
  }

  return null;
};

const raycastEntity = (maxDistance = 7.2) => {
  const centerX = refs.canvas.width * 0.5;
  const centerY = refs.canvas.height * 0.5;
  let best = null;

  world.entities.forEach((entity) => {
    if (entity.dead) {
      return;
    }

    const aimPoint = {
      x: entity.x,
      y: entity.height * 0.62 + entity.hop,
      z: entity.z,
    };
    const projection = project(aimPoint);
    if (!projection) {
      return;
    }

    const screenDistance = Math.hypot(projection.x - centerX, projection.y - centerY);
    const worldDistance = Math.hypot(
      aimPoint.x - player.x,
      aimPoint.y - player.y,
      aimPoint.z - player.z,
    );
    const hitRadius = clamp(
      (entity.radius * refs.canvas.height * 0.52) / projection.z,
      16,
      74,
    );

    if (worldDistance > maxDistance || screenDistance > hitRadius) {
      return;
    }

    const score = worldDistance + screenDistance * 0.02;
    if (!best || score < best.score) {
      best = { entity, score };
    }
  });

  return best;
};

const updateTargeting = () => {
  world.targetBlock = player.dead || isUiBlockingOpen() ? null : raycastBlock();
  world.targetEntity = player.dead || isUiBlockingOpen()
    ? null
    : raycastEntity(getCombatStats().range);
};

const tryMove = (deltaX, deltaZ) => {
  const distance = Math.hypot(deltaX, deltaZ);
  const steps = Math.max(1, Math.ceil(distance / 0.08));
  const stepX = deltaX / steps;
  const stepZ = deltaZ / steps;

  for (let index = 0; index < steps; index += 1) {
    const proposedX = player.x + stepX;
    if (!collidesAt(proposedX, player.z, player.feetY)) {
      player.x = clamp(proposedX, -WORLD_LIMIT, WORLD_LIMIT);
    }

    const proposedZ = player.z + stepZ;
    if (!collidesAt(player.x, proposedZ, player.feetY)) {
      player.z = clamp(proposedZ, -WORLD_LIMIT, WORLD_LIMIT);
    }

    resolvePlayerCollision();
  }
};

const tryJump = () => {
  if (player.dead || isUiBlockingOpen() || !player.onGround) {
    return;
  }

  player.velocityY = 5.35;
  player.onGround = false;
  setStatus("점프");
  playSoundEffect("jump");
};

const updateVerticalPhysics = (dt) => {
  if (player.dead) {
    return;
  }

  const wasOnGround = player.onGround;
  const fallVelocity = player.velocityY;
  const climbBlock = getClimbBlockAt();
  if (climbBlock) {
    const climbingUp = keys.has("KeyW") || keys.has("Space");
    const climbingDown = keys.has("KeyS") || keys.has("ShiftLeft") || keys.has("ShiftRight");
    const climbDirection = (climbingUp ? 1 : 0) - (climbingDown ? 1 : 0);

    player.x = lerp(player.x, climbBlock.x + 0.5, 0.24);
    player.z = lerp(player.z, climbBlock.z + 0.5, 0.24);
    player.velocityY = climbDirection * 3.4;
    player.feetY = clamp(player.feetY + player.velocityY * dt, 0, MAX_BUILD_HEIGHT + 3);
    player.onGround = climbDirection === 0;
    syncPlayerHeight();
    return;
  }

  player.velocityY -= 13.8 * dt;
  const proposedFeetY = player.feetY + player.velocityY * dt;
  let supportHeight = getSupportHeightAt(
    player.x,
    player.z,
    Math.max(player.feetY, proposedFeetY) + 0.05,
  );
  if (supportHeight > player.feetY && collidesAt(player.x, player.z, supportHeight)) {
    supportHeight = player.feetY;
  }

  if (player.velocityY <= 0 && proposedFeetY <= supportHeight) {
    player.feetY = supportHeight;
    player.velocityY = 0;
    player.onGround = true;
    if (!wasOnGround) {
      playSoundEffect("land", {
        blockType: getSurfaceBlockTypeAt(player.x, player.z),
        hard: fallVelocity < -5.4,
      });
    }
  } else {
    player.feetY = clamp(proposedFeetY, 0, MAX_BUILD_HEIGHT + 3);
    player.onGround = false;
  }

  resolvePlayerCollision();
  syncPlayerHeight();
};

const damagePlayer = (amount, source) => {
  if (player.dead || player.damageCooldown > 0) {
    return;
  }

  player.health = Math.max(0, player.health - amount);
  player.damageCooldown = 1.1;
  setStatus(`${source}에게 피해`);
  playSoundEffect(player.health <= 0 ? "death" : "hurt");

  if (player.health <= 0) {
    player.dead = true;
    inputState.inventoryOpen = false;
    inputState.primaryHeld = false;
    refs.deathMessage.textContent = `${source}에게 쓰러졌다`;
    cancelMining();
    document.exitPointerLock();
    setStatus("사망", 999);
  }
};

const killEntity = (entity, { critical = false } = {}) => {
  entity.dead = true;
  world.score += 1;

  Object.entries(entity.drops).forEach(([itemId, amount]) => {
    addItem(itemId, amount);
  });

  spawnParticles(
    { x: entity.x, y: 0.9, z: entity.z },
    critical ? 18 : 14,
    critical ? "rgba(255, 226, 118, 1)" : "rgba(255, 244, 224, 1)",
  );
  setStatus(
    critical
      ? `크리티컬! ${TYPE_LABELS[entity.type]} 처치`
      : `${TYPE_LABELS[entity.type]} 처치`,
  );
  playSoundEffect(critical ? "criticalHit" : "entityKill", { entityType: entity.type });
};

const attackEntity = () => {
  const target = world.targetEntity?.entity ?? null;
  if (!target) {
    setStatus("허공만 쳤다");
    playSoundEffect("swingMiss");
    return;
  }

  const combat = getCombatStats();
  const critical = isCriticalAttack();
  const damage = critical
    ? Math.max(
      Math.ceil(combat.damage + 1),
      Math.round(combat.damage * CRITICAL_HIT_MULTIPLIER),
    )
    : combat.damage;

  target.hp -= damage;
  target.hitFlash = critical ? 1.42 : 1;
  target.reaction = critical ? 0.82 : 0.55;
  target.targetYaw = wrapAngle(player.yaw + Math.PI + rand(-0.45, 0.45));
  target.speed = clamp(target.speed + (critical ? 0.32 : 0.18), 0.3, critical ? 1.28 : 1.1);

  if (target.hp <= 0) {
    killEntity(target, { critical });
    return;
  }

  spawnParticles(
    { x: target.x, y: target.height * 0.55, z: target.z },
    critical ? 14 : 8,
    critical ? "rgba(255, 226, 118, 1)" : "rgba(255, 244, 224, 1)",
  );
  setStatus(
    critical
      ? `크리티컬! ${TYPE_LABELS[target.type]} 강타`
      : `${TYPE_LABELS[target.type]} 타격`,
  );
  playSoundEffect(critical ? "criticalHit" : "entityHit", { entityType: target.type });
};

const finishMiningBlock = (block) => {
  removeBlock(block.x, block.y, block.z);
  addItem(block.type, 1);
  spawnParticles({ x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 }, 12);
  setStatus(`${BLOCK_TYPES[block.type].label} 채굴`);
  playSoundEffect("mineBreak", { blockType: block.type });
  cancelMining();
};

const beginMining = (block) => {
  const blockKey = keyForBlock(block.x, block.y, block.z);
  if (inputState.miningBlockKey === blockKey) {
    return;
  }

  inputState.miningBlockKey = blockKey;
  inputState.miningProgress = 0;
  inputState.miningDuration = getMiningDuration(block.type);
  inputState.miningLabel = `${BLOCK_TYPES[block.type].label} 채굴 중`;
  inputState.miningPulseTimer = 0;
  updateActionMeter(true, inputState.miningLabel, 0);
};

const updateMining = (dt) => {
  if (!inputState.primaryHeld || player.dead || isUiBlockingOpen()) {
    cancelMining();
    return;
  }

  const target = world.targetBlock;
  if (!target || target.kind !== "block") {
    cancelMining();
    return;
  }

  const block = getBlock(target.cell.x, target.cell.y, target.cell.z);
  if (!block) {
    cancelMining();
    return;
  }

  beginMining(block);
  inputState.miningProgress += dt;
  inputState.miningPulseTimer -= dt;
  if (inputState.miningPulseTimer <= 0) {
    playSoundEffect("mineTick", { blockType: block.type });
    inputState.miningPulseTimer = clamp(inputState.miningDuration * 0.18, 0.08, 0.22);
  }
  updateActionMeter(
    true,
    inputState.miningLabel,
    inputState.miningProgress / inputState.miningDuration,
  );

  if (inputState.miningProgress >= inputState.miningDuration) {
    finishMiningBlock(block);
  }
};

const eatSelected = (itemId) => {
  const item = ITEM_TYPES[itemId];
  if (!item?.edible) {
    return false;
  }
  if ((inventory[itemId] ?? 0) <= 0) {
    setStatus("먹을 게 없다");
    return true;
  }
  if (player.hunger >= player.maxHunger && player.health >= player.maxHealth) {
    setStatus("지금은 배부르다");
    return true;
  }

  removeItemCount(itemId, 1);
  player.hunger = clamp(player.hunger + item.edible.hunger, 0, player.maxHunger);
  player.health = clamp(player.health + item.edible.health, 0, player.maxHealth);
  spawnParticles(
    {
      x: player.x + Math.sin(player.yaw) * 0.4,
      y: player.y - 0.15,
      z: player.z + Math.cos(player.yaw) * 0.4,
    },
    7,
    "rgba(255, 228, 150, 1)",
  );
  setStatus(`${item.label} ${item.consumeVerb ?? "먹음"}`);
  playSoundEffect("eat", { itemId });
  return true;
};

const sleepInBed = (target) => {
  if (target?.kind !== "block" || target.block.type !== "bed") {
    return false;
  }

  if (target.distance > 2.15) {
    setStatus("침대가 너무 멀다");
    return true;
  }

  if (!isBedtime()) {
    setStatus("저녁이나 밤에만 잘 수 있다");
    return true;
  }

  const cycleOffset = world.elapsed - getCycleTime();
  world.elapsed = cycleOffset + DAY_CYCLE_DURATION - TRANSITION_DURATION * 0.5;
  world.entities = world.entities.filter((entity) => !entity.hostile);
  world.spawnTimer = 0;
  inputState.primaryHeld = false;
  cancelMining();
  player.damageCooldown = 0;
  player.health = clamp(player.health + 3, 0, player.maxHealth);
  player.hunger = clamp(player.hunger + 2, 0, player.maxHunger);
  setStatus("침대에서 잠들었다");
  playSoundEffect("sleep");
  return true;
};

const placeSelectedBlock = (itemId) => {
  const item = ITEM_TYPES[itemId];
  if (!item?.placeable) {
    setStatus("설치할 수 없는 아이템");
    return;
  }
  if ((inventory[itemId] ?? 0) <= 0) {
    setStatus("블록이 없다");
    return;
  }

  const target = world.targetBlock ?? raycastBlock();
  const groundTarget = raycastGround();
  const groundPlacementTarget = groundTarget ?? (target?.kind === "ground" ? target : null);
  const groundPlacementHeight = groundPlacementTarget
    ? getGroundPlacementHeightAt(groundPlacementTarget.cell.x, groundPlacementTarget.cell.z)
    : null;
  let placeCell = null;
  const preferGroundPlacement = Boolean(groundPlacementTarget && player.pitch > 0.18);
  const canAttachToTop = Boolean(
    target?.kind === "block"
    && target.face.y === 1
    && target.distance <= 1.65,
  );
  const canAttachToSide = Boolean(
    target?.kind === "block"
    && target.face.y !== 1
    && target.distance <= (preferGroundPlacement ? 0.45 : 1.15),
  );
  const attachTarget = canAttachToTop || canAttachToSide ? target : null;

  if (attachTarget) {
    placeCell = {
      x: attachTarget.cell.x + attachTarget.face.x,
      y: attachTarget.cell.y + attachTarget.face.y,
      z: attachTarget.cell.z + attachTarget.face.z,
    };
  } else if (groundPlacementTarget) {
    placeCell = {
      x: groundPlacementTarget.cell.x,
      y: groundPlacementHeight,
      z: groundPlacementTarget.cell.z,
    };
  } else {
    setStatus("바닥이나 가까운 블록을 보고 설치");
    return;
  }

  if (placeCell.y < 0 || placeCell.y > MAX_BUILD_HEIGHT) {
    setStatus("거긴 설치할 수 없다");
    return;
  }

  if (getBlock(placeCell.x, placeCell.y, placeCell.z)) {
    setStatus("이미 막혀 있다");
    return;
  }

  if (isPlayerOverlappingBlock(placeCell.x, placeCell.y, placeCell.z)) {
    setStatus("너무 가까워서 못 둔다");
    return;
  }

  setBlock(placeCell.x, placeCell.y, placeCell.z, item.block);
  removeItemCount(itemId, 1);
  setStatus(`${item.label} 설치`);
  playSoundEffect("placeBlock", { blockType: item.block });
};

const primaryAction = () => {
  if (player.dead || isUiBlockingOpen()) {
    return;
  }

  const target = world.targetBlock;
  if (target?.kind === "block") {
    inputState.primaryHeld = true;
    beginMining(target.block);
    return;
  }

  attackEntity();
};

const secondaryAction = () => {
  if (player.dead || isUiBlockingOpen()) {
    return;
  }

  if (sleepInBed(world.targetBlock)) {
    return;
  }

  const itemId = getSelectedItemId();
  if (!itemId) {
    setStatus("빈 슬롯이다");
    return;
  }
  if (ITEM_TYPES[itemId]?.edible) {
    eatSelected(itemId);
    return;
  }

  placeSelectedBlock(itemId);
};

const updateCamera = (dt) => {
  if (player.dead || isUiBlockingOpen()) {
    return;
  }

  let moveX = 0;
  let moveZ = 0;

  if (keys.has("KeyW")) {
    moveZ += 1;
  }
  if (keys.has("KeyS")) {
    moveZ -= 1;
  }
  if (keys.has("KeyA")) {
    moveX -= 1;
  }
  if (keys.has("KeyD")) {
    moveX += 1;
  }

  const magnitude = Math.hypot(moveX, moveZ) || 1;
  moveX /= magnitude;
  moveZ /= magnitude;

  const sprinting = keys.has("ShiftLeft") || keys.has("ShiftRight");
  const speed = sprinting ? 6.2 : 4.1;
  const sin = Math.sin(player.yaw);
  const cos = Math.cos(player.yaw);
  const deltaX = (moveX * cos + moveZ * sin) * speed * dt;
  const deltaZ = (moveZ * cos - moveX * sin) * speed * dt;
  tryMove(deltaX, deltaZ);

  const moving = Math.abs(moveX) > 0 || Math.abs(moveZ) > 0;
  const bobSpeed = moving ? (sprinting ? 13 : 10) : 4;
  player.bob = moving
    ? Math.sin(world.elapsed * bobSpeed) * (sprinting ? 0.04 : 0.03)
    : lerp(player.bob, 0, 0.08);

  if (moving && player.onGround) {
    player.stepTimer -= dt;
    if (player.stepTimer <= 0) {
      playSoundEffect("footstep", {
        blockType: getSurfaceBlockTypeAt(player.x, player.z),
        sprinting,
      });
      player.stepTimer = sprinting ? 0.22 : 0.31;
    }
  } else {
    player.stepTimer = 0;
  }

  player.hungerTimer += moving ? dt * (sprinting ? 1.3 : 1) : dt * 0.35;
};

const updateEntities = (dt) => {
  updateSpawner(dt);
  const clearHostiles = shouldClearHostiles();
  world.entities = world.entities.filter((entity) =>
    !entity.dead &&
    !(clearHostiles && entity.hostile) &&
    Math.hypot(entity.x - player.x, entity.z - player.z) <= ENTITY_KEEP_DISTANCE,
  );

  world.entities.forEach((entity) => {
    entity.moveTimer -= dt;
    entity.hitFlash = Math.max(0, entity.hitFlash - dt * 2.8);
    entity.reaction = Math.max(0, entity.reaction - dt * 1.2);
    entity.attackCooldown = Math.max(0, entity.attackCooldown - dt);
    const distanceToPlayer = Math.hypot(entity.x - player.x, entity.z - player.z);
    const distanceToHome = Math.hypot(entity.x - entity.homeX, entity.z - entity.homeZ);
    const nearestHostile = !entity.hostile
      ? world.entities.reduce((best, other) => {
        if (other.dead || !other.hostile) {
          return best;
        }
        const distance = Math.hypot(other.x - entity.x, other.z - entity.z);
        if (!best || distance < best.distance) {
          return { entity: other, distance };
        }
        return best;
      }, null)
      : null;
    const hostileActive = entity.hostile && !player.dead;
    let desiredSpeed = entity.baseSpeed;
    let aggressive = false;

    if (hostileActive) {
      if (entity.type === "skeleton" && distanceToPlayer < 14) {
        aggressive = true;
        entity.targetYaw = distanceToPlayer < 5.5
          ? Math.atan2(entity.x - player.x, entity.z - player.z)
          : Math.atan2(player.x - entity.x, player.z - entity.z);
        desiredSpeed = entity.baseSpeed + (distanceToPlayer > 8 ? 0.45 : 0.12);
      } else if (entity.type === "spider" && distanceToPlayer < 12) {
        aggressive = true;
        entity.targetYaw = Math.atan2(player.x - entity.x, player.z - entity.z);
        desiredSpeed = entity.baseSpeed + 0.92;
      } else if (entity.type === "creeper" && distanceToPlayer < 11) {
        aggressive = true;
        entity.targetYaw = Math.atan2(player.x - entity.x, player.z - entity.z);
        desiredSpeed = entity.baseSpeed + 0.56;
      } else if ((entity.type === "zombie" || entity.type === "slime") && distanceToPlayer < 10) {
        aggressive = true;
        entity.targetYaw = Math.atan2(player.x - entity.x, player.z - entity.z);
        desiredSpeed = entity.baseSpeed + 0.62;
      }
    } else if (entity.type === "villager") {
      if (nearestHostile && nearestHostile.distance < 9) {
        aggressive = true;
        entity.targetYaw = Math.atan2(entity.x - nearestHostile.entity.x, entity.z - nearestHostile.entity.z);
        desiredSpeed = entity.baseSpeed + 1.45;
      } else if (distanceToHome > entity.roamRadius) {
        aggressive = true;
        entity.targetYaw = Math.atan2(entity.homeX - entity.x, entity.homeZ - entity.z);
        desiredSpeed = entity.baseSpeed + 0.54;
      }
    } else if (entity.type === "ironGolem") {
      if (nearestHostile && nearestHostile.distance < 16) {
        aggressive = true;
        entity.targetYaw = Math.atan2(
          nearestHostile.entity.x - entity.x,
          nearestHostile.entity.z - entity.z,
        );
        desiredSpeed = entity.baseSpeed + 1.22;
      } else if (distanceToHome > entity.roamRadius) {
        aggressive = true;
        entity.targetYaw = Math.atan2(entity.homeX - entity.x, entity.homeZ - entity.z);
        desiredSpeed = entity.baseSpeed + 0.46;
      }
    }

    if (!aggressive && entity.moveTimer <= 0) {
      if ((entity.type === "villager" || entity.type === "ironGolem") && rand(0, 1) < 0.72) {
        const roamAngle = rand(-Math.PI, Math.PI);
        const roamDistance = rand(1.4, Math.max(2.4, entity.roamRadius * 0.7));
        const targetX = entity.homeX + Math.sin(roamAngle) * roamDistance;
        const targetZ = entity.homeZ + Math.cos(roamAngle) * roamDistance;
        entity.targetYaw = Math.atan2(targetX - entity.x, targetZ - entity.z);
      } else {
        entity.targetYaw = rand(-Math.PI, Math.PI);
      }
      entity.moveTimer = rand(1.6, 4.4);
    }

    entity.speed = lerp(entity.speed, desiredSpeed, dt * (aggressive ? 3.4 : 2.2));

    const deltaYaw = wrapAngle(entity.targetYaw - entity.yaw);
    entity.yaw += deltaYaw * dt * 2.2;

    const proposedX = entity.x + Math.sin(entity.yaw) * (entity.speed + entity.reaction * 1.8) * dt;
    const proposedZ = entity.z + Math.cos(entity.yaw) * (entity.speed + entity.reaction * 1.8) * dt;
    if (isSolidBlock(getBlock(Math.floor(proposedX), 0, Math.floor(proposedZ)))) {
      entity.targetYaw = wrapAngle(entity.yaw + Math.PI * 0.7);
    } else {
      entity.x = clamp(proposedX, -WORLD_LIMIT, WORLD_LIMIT);
      entity.z = clamp(proposedZ, -WORLD_LIMIT, WORLD_LIMIT);
    }

    if (entity.type === "zombie") {
      entity.hop = Math.max(0, Math.sin(world.elapsed * 5 + entity.phase) * 0.03);
      if (hostileActive && distanceToPlayer < 1.4 && entity.attackCooldown <= 0) {
        entity.attackCooldown = 1.15;
        damagePlayer(1, "좀비");
      }
    } else if (entity.type === "skeleton") {
      entity.hop = Math.max(0, Math.sin(world.elapsed * 5.4 + entity.phase) * 0.02);
      if (hostileActive && distanceToPlayer < 14 && distanceToPlayer > 4 && entity.attackCooldown <= 0) {
        entity.attackCooldown = 2.2;
        spawnParticles({ x: player.x, y: player.y - 0.4, z: player.z }, 8, "rgba(241, 244, 255, 1)");
        playSoundEffect("skeletonShot");
        damagePlayer(1, "스켈래톤");
      }
    } else if (entity.type === "spider") {
      entity.hop = Math.abs(Math.sin(world.elapsed * 8 + entity.phase)) * 0.1;
      if (hostileActive && distanceToPlayer < 1.5 && entity.attackCooldown <= 0) {
        entity.attackCooldown = 1;
        damagePlayer(1, "거미");
      }
    } else if (entity.type === "creeper") {
      entity.hop = Math.max(0, Math.sin(world.elapsed * 4 + entity.phase) * 0.03);
      if (hostileActive && distanceToPlayer < 1.85 && entity.attackCooldown <= 0) {
        entity.attackCooldown = 999;
        spawnParticles({ x: entity.x, y: 1.1, z: entity.z }, 24, "rgba(137, 255, 107, 1)");
        playSoundEffect("explosion");
        damagePlayer(3, "크리퍼 폭발");
        entity.dead = true;
      }
    } else if (entity.type === "slime") {
      entity.hop = Math.abs(Math.sin(world.elapsed * (distanceToPlayer < 9 ? 6 : 4) + entity.phase)) * 0.18;
      if (hostileActive && distanceToPlayer < 1.35 && entity.attackCooldown <= 0) {
        entity.attackCooldown = 1.2;
        damagePlayer(1, "슬라임");
      }
    } else if (entity.type === "villager") {
      entity.hop = Math.max(0, Math.sin(world.elapsed * 5.4 + entity.phase) * 0.03);
    } else if (entity.type === "ironGolem") {
      entity.hop = Math.max(0, Math.sin(world.elapsed * 3.2 + entity.phase) * 0.02);
      if (nearestHostile && nearestHostile.distance < 1.9 && entity.attackCooldown <= 0) {
        entity.attackCooldown = 1.35;
        nearestHostile.entity.hp -= 4;
        nearestHostile.entity.hitFlash = 1;
        nearestHostile.entity.reaction = 0.9;
        nearestHostile.entity.targetYaw = wrapAngle(entity.yaw);
        spawnParticles(
          {
            x: nearestHostile.entity.x,
            y: nearestHostile.entity.height * 0.55,
            z: nearestHostile.entity.z,
          },
          12,
          "rgba(242, 244, 232, 1)",
        );
        playSoundEffect("entityHit", { entityType: nearestHostile.entity.type });
        if (nearestHostile.entity.hp <= 0) {
          nearestHostile.entity.dead = true;
          spawnParticles(
            {
              x: nearestHostile.entity.x,
              y: nearestHostile.entity.height * 0.5,
              z: nearestHostile.entity.z,
            },
            16,
            "rgba(224, 226, 212, 1)",
          );
          if (Math.hypot(nearestHostile.entity.x - player.x, nearestHostile.entity.z - player.z) < 14) {
            setStatus(`철 골렘이 ${TYPE_LABELS[nearestHostile.entity.type]} 처치`);
          }
        }
      }
    } else {
      entity.hop = Math.max(0, Math.sin(world.elapsed * 5 + entity.phase) * 0.02);
    }
  });
};

const updateSurvival = (dt) => {
  if (player.dead) {
    return;
  }

  player.damageCooldown = Math.max(0, player.damageCooldown - dt);

  if (player.hungerTimer >= 14) {
    player.hunger = Math.max(0, player.hunger - 1);
    player.hungerTimer = 0;
  }

  if (player.hunger > 6 && player.health < player.maxHealth) {
    player.regenTimer += dt;
    if (player.regenTimer >= 6) {
      player.regenTimer = 0;
      player.health = Math.min(player.maxHealth, player.health + 1);
      player.hunger = Math.max(0, player.hunger - 1);
    }
  } else {
    player.regenTimer = 0;
  }

  if (player.hunger === 0) {
    player.starveTimer += dt;
    if (player.starveTimer >= 4.2) {
      player.starveTimer = 0;
      damagePlayer(1, "굶주림");
    }
  } else {
    player.starveTimer = 0;
  }
};

const updateParticles = (dt) => {
  world.particles = world.particles.filter((particle) => {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.z += particle.vz * dt;
    particle.vy -= 3.6 * dt;
    return particle.life > 0;
  });
};

const renderInventory = () => {
  inputState.hotbarEls.forEach((slot, index) => {
    const itemId = inputState.hotbarItems[index] ?? null;
    slot.classList.toggle("is-active", index === player.selectedSlot);
    slot.classList.toggle("is-empty", !itemId);
    slot.querySelector(".slot__name").textContent = itemId ? ITEM_TYPES[itemId].label : "비어 있음";
    slot.querySelector(".slot__count").textContent = itemId ? inventory[itemId] ?? 0 : "-";
  });

  refs.healthFill.style.width = `${(player.health / player.maxHealth) * 100}%`;
  refs.hungerFill.style.width = `${(player.hunger / player.maxHunger) * 100}%`;
  refs.healthLabel.textContent = `${player.health} / ${player.maxHealth}`;
  refs.hungerLabel.textContent = `${player.hunger} / ${player.maxHunger}`;

  refs.inventoryPanel.classList.toggle("is-hidden", !inputState.inventoryOpen);
  refs.inventoryPanel.setAttribute("aria-hidden", String(!inputState.inventoryOpen));

  refs.controlsPanel.classList.toggle("is-hidden", !inputState.controlsOpen);
  refs.controlsPanel.setAttribute("aria-hidden", String(!inputState.controlsOpen));

  refs.deathScreen.classList.toggle("is-hidden", !player.dead);
  refs.deathScreen.setAttribute("aria-hidden", String(!player.dead));

  if (inputState.inventoryOpen) {
    const signature = getInventorySignature();
    if (inputState.inventorySignature !== signature) {
      refs.inventoryGrid.innerHTML = getSortedInventoryIds().map((itemId) => `
        <button
          type="button"
          class="inventory-item ${itemId === getSelectedItemId() ? "is-selected" : ""}"
          data-item="${itemId}"
        >
          <span>${ITEM_TYPES[itemId].label}</span>
          <span>${inventory[itemId] ?? 0}</span>
        </button>
      `).join("");

      refs.craftGrid.innerHTML = CRAFTING_RECIPES.map((recipe) => `
        <button
          type="button"
          class="recipe-card ${canCraftRecipe(recipe) ? "" : "is-unavailable"}"
          data-recipe="${recipe.id}"
        >
          <span class="recipe-card__title">${recipe.title}</span>
          <span class="recipe-card__give">결과: ${formatItemStack(recipe.gives)}</span>
          <span class="recipe-card__cost">재료: ${formatItemStack(recipe.costs)}</span>
          <span class="recipe-card__note">${recipe.note}</span>
        </button>
      `).join("");

      inputState.inventorySignature = signature;
    }
  } else {
    inputState.inventorySignature = "";
  }
};

const syncSettingsUi = () => {
  refs.settingsPanel.classList.toggle("is-hidden", !inputState.settingsOpen);
  refs.settingsPanel.setAttribute("aria-hidden", String(!inputState.settingsOpen));
  refs.settingsMusic.value = String(settingsState.musicVolume);
  refs.settingsMusicValue.textContent = `${settingsState.musicVolume}%`;
  refs.settingsSfx.value = String(settingsState.sfxVolume);
  refs.settingsSfxValue.textContent = `${settingsState.sfxVolume}%`;
  refs.settingsSensitivity.value = String(settingsState.mouseSensitivity);
  refs.settingsSensitivityValue.textContent = `${settingsState.mouseSensitivity}%`;
  refs.settingsScale.value = String(settingsState.renderScale);
  refs.settingsScaleValue.textContent = `${settingsState.renderScale}%`;
  refs.settingsShowHints.checked = settingsState.showHints;
  refs.settingsShowSound.checked = settingsState.showSoundCaption;
  refs.bottomLeft.classList.toggle(
    "is-hidden",
    !settingsState.showHints && !settingsState.showSoundCaption,
  );
  refs.hintLabel.classList.toggle("is-hidden", !settingsState.showHints);
  refs.soundLabel.classList.toggle("is-hidden", !settingsState.showSoundCaption);
};

const applySettingsControl = (target) => {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target === refs.settingsMusic) {
    settingsState.musicVolume = Number(refs.settingsMusic.value);
    applyAudioSettings();
    setStatus(`음악 ${settingsState.musicVolume}%`);
    return;
  }

  if (target === refs.settingsSfx) {
    settingsState.sfxVolume = Number(refs.settingsSfx.value);
    applyAudioSettings();
    setStatus(`효과음 ${settingsState.sfxVolume}%`);
    return;
  }

  if (target === refs.settingsSensitivity) {
    settingsState.mouseSensitivity = Number(refs.settingsSensitivity.value);
    setStatus(`감도 ${settingsState.mouseSensitivity}%`);
    return;
  }

  if (target === refs.settingsScale) {
    settingsState.renderScale = Number(refs.settingsScale.value);
    resize();
    setStatus(`해상도 ${settingsState.renderScale}%`);
    return;
  }

  if (target === refs.settingsShowHints) {
    settingsState.showHints = refs.settingsShowHints.checked;
    setStatus(settingsState.showHints ? "하단 안내 표시" : "하단 안내 숨김");
    return;
  }

  if (target === refs.settingsShowSound) {
    settingsState.showSoundCaption = refs.settingsShowSound.checked;
    setStatus(settingsState.showSoundCaption ? "최근 소리 표시" : "최근 소리 숨김");
  }
};

const updateHud = () => {
  world.day = 1 + Math.floor(world.elapsed / DAY_CYCLE_DURATION);
  refs.dayLabel.textContent = `${world.day}일차 · ${getTimeOfDayLabel()}`;
  refs.soundLabel.textContent = world.soundTimer > 0 ? world.lastSound : "최근 소리: 없음";
  syncSettingsUi();

  if (world.statusTimer <= 0) {
    if (player.dead) {
      refs.statusLabel.textContent = "죽었다";
    } else if (inputState.settingsOpen) {
      refs.statusLabel.textContent = "설정 열림";
    } else if (inputState.inventoryOpen) {
      refs.statusLabel.textContent = "인벤토리 열림";
    } else if (document.pointerLockElement === refs.canvas) {
      if (world.targetBlock?.kind === "block") {
        refs.statusLabel.textContent = `${BLOCK_TYPES[world.targetBlock.block.type].label} 조준 · 점수 ${world.score}`;
      } else if (world.targetEntity?.entity) {
        refs.statusLabel.textContent = `${TYPE_LABELS[world.targetEntity.entity.type]} 조준 · 점수 ${world.score}`;
      } else {
        refs.statusLabel.textContent = `생존 중 · 점수 ${world.score}`;
      }
    } else {
      refs.statusLabel.textContent = "클릭해서 시작";
    }
  }

  renderInventory();
};

const respawn = () => {
  resetPlayer();
  refs.deathMessage.textContent = "다시 시작";
  setStatus("리스폰");
  playSoundEffect("respawn");
};

const toggleInventory = () => {
  if (player.dead) {
    return;
  }

  if (!inputState.inventoryOpen) {
    inputState.settingsOpen = false;
  }
  inputState.inventoryOpen = !inputState.inventoryOpen;
  keys.clear();

  if (inputState.inventoryOpen) {
    inputState.primaryHeld = false;
    cancelMining();
    document.exitPointerLock();
    setStatus("인벤토리");
    playSoundEffect("uiOpen");
  } else {
    setStatus("닫힘");
    playSoundEffect("uiClose");
  }
};

const toggleSettings = () => {
  if (player.dead) {
    return;
  }

  if (!inputState.settingsOpen) {
    inputState.inventoryOpen = false;
  }
  inputState.settingsOpen = !inputState.settingsOpen;
  keys.clear();
  inputState.primaryHeld = false;
  cancelMining();

  if (inputState.settingsOpen) {
    document.exitPointerLock();
    setStatus("설정");
    playSoundEffect("uiOpen");
  } else {
    setStatus("닫힘");
    playSoundEffect("uiClose");
  }
};

const toggleControls = () => {
  inputState.controlsOpen = !inputState.controlsOpen;
  setStatus(inputState.controlsOpen ? "조작법 표시" : "조작법 숨김");
};

refs.inventoryPanel.addEventListener("click", (event) => {
  const recipeButton = event.target.closest("[data-recipe]");
  if (recipeButton) {
    craftRecipe(recipeButton.dataset.recipe);
    return;
  }

  const itemButton = event.target.closest("[data-item]");
  if (itemButton) {
    equipSelectedSlot(itemButton.dataset.item);
  }
});

refs.settingsPanel.addEventListener("input", (event) => {
  applySettingsControl(event.target);
});

const loop = (now) => {
  if (!loop.lastTime) {
    loop.lastTime = now;
  }

  const dt = Math.min(0.033, (now - loop.lastTime) / 1000);
  loop.lastTime = now;
  world.elapsed += dt;
  if (world.statusTimer > 0) {
    world.statusTimer = Math.max(0, world.statusTimer - dt);
  }
  if (world.soundTimer > 0) {
    world.soundTimer = Math.max(0, world.soundTimer - dt);
  }

  updateCamera(dt);
  updateVerticalPhysics(dt);
  updateEntities(dt);
  updateSurvival(dt);
  updateParticles(dt);
  updateTargeting();
  updateMining(dt);
  updateBackgroundMusic();
  updateHud();
  render();
  requestAnimationFrame(loop);
};

refs.canvas.addEventListener("click", () => {
  void startBackgroundMusic();

  if (player.dead || isUiBlockingOpen()) {
    return;
  }

  if (document.pointerLockElement !== refs.canvas) {
    refs.canvas.requestPointerLock();
  }
});

document.addEventListener("keydown", () => {
  if (!audioState.started || audioState.context?.state === "suspended") {
    void startBackgroundMusic();
  }
});

document.addEventListener("pointerdown", () => {
  if (!audioState.started || audioState.context?.state === "suspended") {
    void startBackgroundMusic();
  }
});

document.addEventListener("mousedown", (event) => {
  if (document.pointerLockElement !== refs.canvas || isUiBlockingOpen() || player.dead) {
    return;
  }

  event.preventDefault();
  if (event.button === 0) {
    inputState.primaryHeld = true;
    primaryAction();
  }
  if (event.button === 2) {
    secondaryAction();
  }
});

document.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    inputState.primaryHeld = false;
    cancelMining();
  }
});

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === refs.canvas) {
    setStatus("생존 시작");
  } else {
    inputState.primaryHeld = false;
    cancelMining();
    if (!isUiBlockingOpen() && !player.dead) {
      setStatus("클릭해서 시작");
    }
  }
});

document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== refs.canvas || isUiBlockingOpen() || player.dead) {
    return;
  }

  const sensitivity = settingsState.mouseSensitivity / 100;
  player.yaw += event.movementX * 0.0025 * sensitivity;
  player.pitch = clamp(player.pitch - event.movementY * 0.0016 * sensitivity, MIN_PITCH, MAX_PITCH);
});

document.addEventListener("keydown", (event) => {
  if (event.code === "KeyM") {
    event.preventDefault();
    toggleMusicMute();
    return;
  }

  if (event.code.startsWith("Digit")) {
    const index = Number(event.code.replace("Digit", "")) - 1;
    if (index >= 0 && index < HOTBAR_SIZE) {
      player.selectedSlot = index;
      inputState.inventorySignature = "";
      const itemId = getSelectedItemId();
      setStatus(itemId ? `${ITEM_TYPES[itemId].label} 선택` : "빈 슬롯 선택");
      return;
    }
  }

  if (event.code === "KeyI") {
    toggleInventory();
    return;
  }

  if (event.code === "KeyO") {
    toggleSettings();
    return;
  }

  if (event.code === "KeyH") {
    toggleControls();
    return;
  }

  if (event.code === "KeyR" && player.dead) {
    respawn();
    return;
  }

  keys.add(event.code);

  if (event.code === "Space") {
    event.preventDefault();
    if (document.pointerLockElement === refs.canvas) {
      tryJump();
    }
  }
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

window.addEventListener("blur", () => {
  keys.clear();
});

window.addEventListener("resize", resize);

buildHotbar();
resize();
seedWorld();
setStatus("클릭해서 시작");
requestAnimationFrame(loop);
