/*
  Royal Pouch - GitHub Pages / PWA app
  EDITING TIP: Most starter content is in DEFAULT_DATA below.
  You can edit challenges, rules, power ups and funishments in this file or inside the hidden editor.
*/
const STORAGE_KEY = 'royalPouchSave_v1';

const DEFAULT_DATA = {
  players: { his: '', hers: '' },
  coins: { his: 1000, hers: 1000 },
  settings: { timerMin: 120, timerMax: 300, voiceRate: 0.88, voicePitch: 1.04, voiceVolume: 1, voiceName: '', voiceStyle: 'kora', autoSpeak: true, autoSpeakDelay: 2000 },
  secretDoneToday: false,
  progress: {},
  feedback: [],
  history: [],
  rules: [
    'Both players should agree boundaries before starting.',
    'Use Like or Dislike after every main challenge before moving on.',
    'Random challenges do not change linear progress.',
    'Coins, power ups and funishments can be edited in the hidden editor.'
  ],
  categoryIndex: {
    hotWife: 'A confidence and attention path. This category is about feeling good, choosing the mood, and owning the spotlight.',
    tease: 'A playful, mischievous path. This category is about anticipation, little rules, waiting, and keeping the energy fun.',
    queen: 'A leadership path. This category is about taking charge, making decisions, and setting the direction for the round.',
    spicy: 'The bolder path. This category is for more adventurous challenges when the mood is right.'
  },
  challenges: {
    his: {
      easy: [
        'Complete a simple helpful task chosen by the other player.',
        'Give a sincere compliment and earn your reward.',
        'Make drinks or snacks without being asked.'
      ],
      medium: [
        'Complete a timed household task before the timer ends.',
        'Let the other player choose your next challenge.',
        'Do something thoughtful and report back when finished.'
      ],
      hard: [
        'Complete a longer task without complaining.',
        'Hand over one power up to the other player.',
        'Accept a funishment draw if you fail the timer.'
      ],
      extraHard: [
        'Let the other player set the rules for the next round.',
        'Complete two challenges back to back.',
        'Risk double coins: complete the challenge or pay the penalty.'
      ]
    },
    hers: {
      secret: [
        "Go get dressed up and stay like this for the rest of the night. When you're finished, tell him to strip naked for the rest of the night."
      ],
      hotWife: [
        'Choose an outfit or look that makes you feel confident.',
        'Take charge of the mood for the next ten minutes.',
        'Pick one compliment you want to hear and make him say it properly.'
      ],
      tease: [
        'Set a playful rule for the next round.',
        'Make him wait before revealing the next challenge.',
        'Choose a phrase he must repeat before continuing.'
      ],
      queen: [
        'Give one clear instruction and expect it followed.',
        'Choose how coins are awarded this round.',
        'Claim the right to approve the next challenge.'
      ],
      spicy: [
        'Pick a bolder challenge from your editable list.',
        'Increase the timer pressure for the next round.',
        'Choose whether the next reward is coins or a power up.'
      ]
    }
  },
  powerUps: {
    his: [
      'Shield: ignore one funishment|50|Shield activated. The next funishment may be ignored.',
      'Double Coins: next completed challenge pays double|100|Double Coins activated. The next completed challenge earns double coins.',
      'Second Chance: retry one failed timer|75|Second Chance activated. You may retry one failed timer.',
      'Skip Pass: skip one challenge without losing coins|80|Skip Pass activated. One challenge may be skipped safely.',
      'Lucky Draw: 50% chance to keep coins after a skipped challenge|90|Lucky Draw activated. Fortune may still pay out.',
      'Bound Hands: hands stay limited for the next 2 rounds|140|Bound Hands activated for two rounds.',
      'Dress Code: chosen outfit rule for the next 2 rounds|120|Dress Code activated for two rounds.',
      'Extended Service: add 2 minutes to the next timer|70|Extended Service activated. The next timer may be extended.'
    ],
    hers: [
      "Queen Tax: take 10% of his coins for the next 2 turns|100|Queen Tax activated. Ten percent of his coins will move to her pouch for the next two turns.",
      "Royal Claim: instantly move 200 coins from his pouch to hers|150|Royal Claim activated. Two hundred coins move from his pouch to hers now.",
      "Command Token: choose his next category|120|Command Token activated. The Queen chooses his next category.",
      "Coin Magnet: +50% coins this round|90|Coin Magnet activated. Her next reward is boosted.",
      "Royal Decree: set one temporary rule for the next 2 rounds|150|Royal Decree activated for two rounds.",
      "Category Select: choose any category for the next round|110|Category Select activated. The next category is hers to choose.",
      "Favourite Return: replay a previously liked challenge|80|Favourite Return activated. A favourite challenge may return.",
      "Challenge Swap: replace the current challenge with another from the same category|75|Challenge Swap activated. The current challenge may be replaced.",
      "Mystery Box: random reward or penalty|60|Mystery Box activated. Fate decides the prize."
    ]
  },
  inventory: { his: [], hers: [] },
  activePowerUps: { his: [], hers: [] },
  funishments: {
    his: ['Lose 50 coins', 'Do one extra helpful task', 'Opponent chooses your next challenge'],
    hers: ['Lose 50 coins', 'Opponent chooses a light challenge', 'Skip one power up use']
  }
};

let state = load();
let currentScreen = 'home';
let currentView = {};
let powerReturn = 'showHome';
let lockTaps = 0;
let timer = { id:null, total:0, left:0 };
let autoSpeakTimer = null;

const LABELS = {
  his: { easy:'Easy', medium:'Medium', hard:'Hard', extraHard:'Extra Hard' },
  hers: { hotWife:'Hot Wife', tease:'Tease', queen:'Queen', spicy:'Spicy' }
};
const REWARDS = { easy:25, medium:50, hard:100, extraHard:250, secret:50, hotWife:50, tease:50, queen:75, spicy:100 };

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function load(){
  const saved = localStorage.getItem(STORAGE_KEY);
  if(!saved) return clone(DEFAULT_DATA);
  try { return mergeDeep(clone(DEFAULT_DATA), JSON.parse(saved)); }
  catch { return clone(DEFAULT_DATA); }
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function mergeDeep(target, source){
  for(const key in source){
    if(source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) target[key] = mergeDeep(target[key] || {}, source[key]);
    else target[key] = source[key];
  }
  return target;
}
function $(sel){ return document.querySelector(sel); }
function app(){ return $('#app'); }
function toast(msg){
  const div = document.createElement('div'); div.className='toast'; div.textContent=msg; document.body.appendChild(div);
  setTimeout(()=>div.remove(),1800);
}
function nav(active='home'){
  return `<nav class="bottom-nav">
    <button class="${active==='home'?'active':''}" onclick="showHome()">🏠<br>Home</button>
    <button class="${active==='play'?'active':''}" onclick="showHis()">🎲<br>Play</button>
    <button class="${active==='coins'?'active':''}" onclick="showCoins()">🪙<br>Coins</button>
    <button class="${active==='progress'?'active':''}" onclick="showProgress()">📈<br>Progress</button>
  </nav>`;
}
function header(sub=''){
  const title = state.players.his && state.players.hers ? `${state.players.his} & ${state.players.hers}` : 'Royal Pouch';
  return `<div class="topbar"><div class="brand"><div class="logo">👑</div><div class="title"><h1>${title}</h1><p>${sub || 'A private challenge dashboard'}</p></div></div><button class="lock" onclick="lockTap()">🔒</button></div>`;
}

function init(){
  migrateDefaults();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  if(!state.players.his || !state.players.hers) showNameScreen(); else showHome();
}

function migrateDefaults(){
  // Keeps existing saves, but adds any new default power ups introduced in updates.
  state.powerUps = state.powerUps || {his:[], hers:[]};
  for(const side of ['his','hers']){
    state.powerUps[side] = state.powerUps[side] || [];
    const existingNames = new Set(state.powerUps[side].map(x => parsePowerUp(x).name.toLowerCase()));
    for(const raw of DEFAULT_DATA.powerUps[side]){
      const pu = parsePowerUp(raw);
      if(!existingNames.has(pu.name.toLowerCase())) state.powerUps[side].push(raw);
    }
  }
  ensureInventory();
  save();
}

function showNameScreen(){
  currentScreen='names';
  app().innerHTML = `<main class="screen">
    <div class="hero"><h2>Set the players</h2><p>Enter two names to personalise the dashboard, coins and challenge paths.</p></div>
    <div class="form">
      <input class="input" id="hisName" placeholder="His name" value="${escapeHtml(state.players.his)}">
      <input class="input" id="hersName" placeholder="Her name" value="${escapeHtml(state.players.hers)}">
      <button class="primary" onclick="saveNames()">Start</button>
    </div>
  </main>`;
}
function saveNames(){
  state.players.his = $('#hisName').value.trim() || 'His';
  state.players.hers = $('#hersName').value.trim() || 'Hers'; save(); showHome();
}
function showHome(){
  currentScreen='home';
  app().innerHTML = `<main class="screen">${header('Home dashboard')}
    <section class="hero"><h2>Tonight's dashboard</h2><p>${state.players.his}: ${state.coins.his} coins · ${state.players.hers}: ${state.coins.hers} coins</p></section>
    <section class="grid">
      ${card('📜','Rules','View rules','showRules()', 'wide')}
      ${card('🧔','His','4 Categories','showHis()')}
      ${card('👑','Hers','5 Categories','showHers()')}
      ${card('🪙','Coin Pouch','Balances and transactions','showCoins()')}
      ${card('⚡','Power Ups','Shop & inventory','showPowerUps()')}
      ${card('📋','Funishments','Editable consequences','showFunishments()')}
      ${card('📈','Progress','Stats and challenge history','showProgress()')}
    </section>${nav('home')}</main>`;
}
function card(icon,title,desc,onclick,extra=''){
  return `<button class="dash-card ${extra}" onclick="${onclick}"><div class="icon">${icon}</div><h3>${title}</h3>${desc ? `<p>${desc}</p>` : ''}</button>`;
}
function categoryCard(icon,title,onclick,extra=''){
  return `<button class="dash-card category-card ${extra}" onclick="${onclick}"><div class="icon">${icon}</div><h3>${title}</h3></button>`;
}
function showRules(){
  app().innerHTML = `<main class="screen">${header('Rules')}${backBtn()}<div class="stack">${state.rules.map((r,i)=>`<div class="challenge-card"><h2>Rule ${i+1}</h2><p>${escapeHtml(r)}</p></div>`).join('')}</div>${nav()}</main>`;
}
function showHis(){
  currentView={side:'his'};
  app().innerHTML = `<main class="screen">${header(`${state.players.his}'s path`)}${backBtn()}<section class="grid">
    ${categoryCard('🟢','Easy',"openCategory('his','easy')")}
    ${categoryCard('🟡','Medium',"openCategory('his','medium')")}
    ${categoryCard('🟠','Hard',"openCategory('his','hard')")}
    ${categoryCard('🔴','Extra Hard',"openCategory('his','extraHard')")}
    ${categoryCard('🎒','Inventory',"showPowerUps('inventory','his','showHis')")}
    ${categoryCard('🏪','Shop',"showPowerUps('shop','his','showHis')")}
  </section>${nav('play')}</main>`;
}
function showHers(){
  currentView={side:'hers'};
  const firstChallengeBlock = state.secretDoneToday ? '' : `
    <section class="challenge-card secret"><h2>🔒 First Challenge</h2><p>This must be completed before anything else.</p><button class="primary" onclick="openCategory('hers','secret')">Open First Challenge</button></section>`;
  app().innerHTML = `<main class="screen">${header(`${state.players.hers}'s path`)}${backBtn()}
    ${firstChallengeBlock}
    <button class="secondary index-button" onclick="showHersIndex()">📖 Category Index</button>
    <h3 class="section-title">Categories</h3><section class="grid">
    ${categoryCard('💋','Hot Wife',"openCategory('hers','hotWife')")}
    ${categoryCard('👠','Tease',"openCategory('hers','tease')")}
    ${categoryCard('👑','Queen',"openCategory('hers','queen')")}
    ${categoryCard('🌶️','Spicy',"openCategory('hers','spicy')")}
    ${categoryCard('🎒','Inventory',"showPowerUps('inventory','hers','showHers')")}
    ${categoryCard('🏪','Shop',"showPowerUps('shop','hers','showHers')")}
  </section>${nav('play')}</main>`;
}

function showHersIndex(){
  currentView={side:'hers'};
  const idx = state.categoryIndex || DEFAULT_DATA.categoryIndex;
  app().innerHTML = `<main class="screen">${header(`${state.players.hers}'s category index`)}${backBtn('showHers()')}
    <section class="stack">
      <div class="challenge-card"><h2>💋 Hot Wife</h2><p>${escapeHtml(idx.hotWife)}</p></div>
      <div class="challenge-card"><h2>👠 Tease</h2><p>${escapeHtml(idx.tease)}</p></div>
      <div class="challenge-card"><h2>👑 Queen</h2><p>${escapeHtml(idx.queen)}</p></div>
      <div class="challenge-card"><h2>🌶️ Spicy</h2><p>${escapeHtml(idx.spicy)}</p></div>
    </section>${nav('play')}</main>`;
}
function openCategory(side,cat,random=false){
  if(side==='hers' && cat!=='secret' && !state.secretDoneToday){ toast('First challenge first 👑'); return; }
  currentView={side,cat,random};
  renderChallenge(side,cat,random);
}
function getProgressKey(side,cat){ return `${side}_${cat}`; }
function getCurrentIndex(side,cat,random=false){
  const list = state.challenges[side][cat] || [];
  if(random) return Math.floor(Math.random()*Math.max(list.length,1));
  return Math.min(state.progress[getProgressKey(side,cat)] || 0, Math.max(list.length-1,0));
}
function renderChallenge(side,cat,random=false){
  const list = state.challenges[side][cat] || ['No challenge added yet.'];
  const index = getCurrentIndex(side,cat,random);
  const text = list[index] || 'No challenge added yet.';
  const label = cat==='secret'?'First Challenge':LABELS[side][cat];
  const p = state.progress[getProgressKey(side,cat)] || 0;
  const isDone = p >= list.length && !random;
  const randomButton = cat==='secret' ? '' : `<button class="mini" onclick="openCategory('${side}','${cat}',true)">🎲 Random</button>`;
  const feedbackBlock = cat==='secret'
    ? `<p class="small">This opens the rest of her path and is not included in likes/dislikes.</p>`
    : `<h3 class="section-title">Feedback required</h3><div class="button-row"><button class="secondary" id="likeBtn" onclick="recordFeedback('like')">👍 Like</button><button class="secondary" id="dislikeBtn" onclick="recordFeedback('dislike')">👎 Dislike</button></div>`;
  app().innerHTML = `<main class="screen">${header(label)}${backBtn(side==='his'?'showHis()':'showHers()')}
    <section class="challenge-card ${cat==='secret'?'secret':''}">
      <h2>${label}</h2>
      <div class="challenge-meta"><span class="tag">${cat==='secret'?'Intro':(random?'Random':'Linear')}</span><span class="tag">${random ? 'Random pick' : `Progress ${Math.min(p+1,list.length)} / ${list.length}`}</span><span class="tag">Reward ${REWARDS[cat]||50} coins</span></div>
      <p class="challenge-text">${escapeHtml(isDone?'This path is complete. Add more challenges in the hidden editor.':text)}</p>
      <div class="mini-row"><button class="mini" onclick="speakChallenge()">🔊 Read</button><button class="mini" onclick="startRandomTimer()">⏱️ Random Timer</button>${randomButton}</div>
      <div id="timerBox" class="timer-box hidden"><div class="timer-time" id="timerTime">00:00</div><button class="secondary" onclick="stopTimer()">Stop Timer</button></div>
      ${feedbackBlock}
      <div class="button-row" style="margin-top:10px"><button class="primary" onclick="completeChallenge()">✅ Complete</button><button class="ghost" onclick="skipChallenge()">⏭️ Skip</button></div>
    </section>${nav('play')}</main>`;
  currentView.index=index; currentView.text=text; currentView.feedback=null;
  scheduleAutoSpeak();
}
function recordFeedback(type){
  currentView.feedback = type;
  $('#likeBtn')?.classList.toggle('liked', type==='like');
  $('#dislikeBtn')?.classList.toggle('disliked', type==='dislike');
}
function completeChallenge(){ finishChallenge('completed'); }
function skipChallenge(){ finishChallenge('skipped'); }
function finishChallenge(result){
  const {side,cat,index,text,random,feedback} = currentView;
  if(cat!=='secret' && !feedback){ toast('Like or dislike first 👍👎'); return; }
  if(cat!=='secret') state.feedback.push({ date:new Date().toISOString(), side, category:cat, index, text, feedback, result, random:!!random });
  const baseReward = result==='completed' ? (REWARDS[cat]||50) : 0;
  const powerBonus = (cat!=='secret') ? applyActivePowerUpsForTurn(side, result) : 0;
  const totalReward = baseReward + powerBonus;
  state.history.push({ date:new Date().toISOString(), side, category:cat, result, coins: totalReward });
  if(result==='completed') state.coins[side] += totalReward;
  if(side==='hers' && cat==='secret'){
    if(result==='completed') state.secretDoneToday = true;
    save();
    toast(result==='completed' ? 'First Challenge completed' : 'First Challenge still waiting');
    setTimeout(()=> showHers(), 350);
    return;
  }
  if(!random && result==='completed') state.progress[getProgressKey(side,cat)] = (state.progress[getProgressKey(side,cat)] || 0) + 1;
  save(); toast(result==='completed'?'Saved and coins awarded':'Saved');
  setTimeout(()=> renderChallenge(side,cat,false), 350);
}
function speakChallenge(){
  const text = currentView.text || '';
  speakText(text);
}
function scheduleAutoSpeak(){
  if(autoSpeakTimer) clearTimeout(autoSpeakTimer);
  if(!state.settings.autoSpeak) return;
  const delay = Number(state.settings.autoSpeakDelay) || 2000;
  autoSpeakTimer = setTimeout(()=>{
    if(currentView && currentView.text) speakChallenge();
  }, delay);
}
function speakText(rawText){
  if(!('speechSynthesis' in window)){ toast('Speech not supported on this device'); return; }
  speechSynthesis.cancel();
  const text = prepareSpeechText(rawText);
  const u = new SpeechSynthesisUtterance(text);
  const preferred = getPreferredVoice();
  if(preferred) u.voice = preferred;
  u.rate = Number(state.settings.voiceRate) || 0.72;
  u.pitch = Number(state.settings.voicePitch) || 1.02;
  u.volume = Number(state.settings.voiceVolume) || 1;
  speechSynthesis.speak(u);
}
function prepareSpeechText(text=''){
  const style = state.settings.voiceStyle || 'kora';
  let cleaned = String(text).replace(/\s+/g,' ').trim();
  if(style === 'soft'){
    cleaned = cleaned
      .replace(/\.\s+/g,'. ... ')
      .replace(/,\s+/g,', ... ')
      .replace(/!\s+/g,'! ... ')
      .replace(/\?\s+/g,'? ... ');
    cleaned = 'Listen carefully. ... ' + cleaned;
  }
  if(style === 'kora'){
    cleaned = cleaned
      .replace(/\.\s+/g,'.  ')
      .replace(/,\s+/g,',  ')
      .replace(/!\s+/g,'!  ')
      .replace(/\?\s+/g,'?  ');
  }
  return cleaned;
}
function getPreferredVoice(){
  const voices = speechSynthesis.getVoices();
  if(!voices.length) return null;
  if(state.settings.voiceName){
    const saved = voices.find(v=>v.name === state.settings.voiceName);
    if(saved) return saved;
  }
  const english = voices.filter(v => /^en[-_]/i.test(v.lang) || /English/i.test(v.name));
  const ranked = [
    /Google UK English Female/i,
    /Google.*Female/i,
    /English.*Female/i,
    /Samantha|Serena|Karen|Moira|Tessa|Fiona|Victoria|Ava|Susan|Libby|Sonia|Aria|Jenny|Natasha|Zira/i,
    /female/i,
    /en-GB/i,
    /english/i
  ];
  for(const r of ranked){ const found = english.find(v=>r.test(v.name) || r.test(v.lang)) || voices.find(v=>r.test(v.name) || r.test(v.lang)); if(found) return found; }
  return english[0] || voices[0];
}
function voiceOptions(){
  const voices = ('speechSynthesis' in window) ? speechSynthesis.getVoices() : [];
  const current = state.settings.voiceName || '';
  const options = [`<option value="">Auto-pick best female voice</option>`].concat(voices.map(v=>`<option value="${escapeHtml(v.name)}" ${v.name===current?'selected':''}>${escapeHtml(v.name)} · ${escapeHtml(v.lang)}</option>`));
  return options.join('');
}
function startRandomTimer(){
  stopTimer(false);
  const min = state.settings.timerMin || 120, max = state.settings.timerMax || 300;
  const seconds = Math.floor(Math.random()*(max-min+1))+min;
  timer.total=seconds; timer.left=seconds;
  $('#timerBox')?.classList.remove('hidden'); updateTimerDisplay();
  timer.id = setInterval(()=>{ timer.left--; updateTimerDisplay(); if(timer.left<=0){ stopTimer(false); chime(); toast("Time's up"); } },1000);
}
function stopTimer(hide=true){ if(timer.id) clearInterval(timer.id); timer.id=null; if(hide) $('#timerBox')?.classList.add('hidden'); }
function updateTimerDisplay(){ const m=String(Math.floor(timer.left/60)).padStart(2,'0'), s=String(timer.left%60).padStart(2,'0'); const el=$('#timerTime'); if(el) el.textContent=`${m}:${s}`; }
function chime(){ try{ navigator.vibrate?.([200,80,200]); const ctx=new (window.AudioContext||window.webkitAudioContext)(); const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value=880; gain.gain.value=.08; osc.start(); setTimeout(()=>{osc.stop();ctx.close();},450);}catch{} }
function showCoins(){ app().innerHTML=`<main class="screen">${header('Coin pouch')}${backBtn()}<div class="stack">
  <div class="stat"><b>${state.players.his || 'His'}</b><span>${state.coins.his} coins</span></div>
  <div class="stat"><b>${state.players.hers || 'Hers'}</b><span>${state.coins.hers} coins</span></div>
  <section class="challenge-card"><h2>Quick transfer</h2><p class="small">Enter an amount and move coins instantly between pouches.</p>
    <div class="form"><input id="coinTransferAmount" type="number" min="1" step="1" placeholder="Coin amount"></div>
    <div class="button-row"><button class="primary" onclick="transferCoins('his','hers')">Move His → Hers</button><button class="secondary" onclick="transferCoins('hers','his')">Move Hers → His</button></div>
  </section>
  <section class="challenge-card"><h2>Coin history</h2><p class="small">Transfers, rewards, purchases and tax movements are saved here.</p><button class="secondary" onclick="showCoinHistory()">📜 Open Coin History</button></section>
  <div class="button-row"><button class="secondary" onclick="adjustCoins('his',50)">+50 His</button><button class="secondary" onclick="adjustCoins('hers',50)">+50 Hers</button></div></div>${nav('coins')}</main>`; }
function adjustCoins(side,amount){ state.coins[side]+=amount; state.history.push({ date:new Date().toISOString(), side, category:'manual', result:`Manual adjustment ${amount>0?'+':''}${amount}`, coins:amount }); save(); showCoins(); }
function showCoinHistory(){
  const moneyItems = (state.history || []).filter(h => h && (typeof h.coins === 'number' || h.category === 'transfer' || h.category === 'powerup' || h.category === 'manual')).slice().reverse();
  const rows = moneyItems.length ? moneyItems.map(h => {
    const date = h.date ? new Date(h.date).toLocaleString() : 'Unknown date';
    const cat = (h.category || 'coins').replace(/^./, c => c.toUpperCase());
    const amount = typeof h.coins === 'number' ? h.coins : 0;
    const sign = amount > 0 ? '+' : '';
    const result = h.result || '';
    const side = h.side ? String(h.side).replace(/^./, c => c.toUpperCase()) : 'Coins';
    return `<div class="history-item"><div><b>${escapeHtml(cat)}</b><p class="small">${escapeHtml(date)} · ${escapeHtml(side)} · ${escapeHtml(result)}</p></div><span class="tag ${amount<0?'bad':'good'}">${sign}${amount} coins</span></div>`;
  }).join('') : '<div class="challenge-card"><h2>No coin history yet</h2><p class="small">Transfers, rewards and purchases will appear here.</p></div>';
  app().innerHTML = `<main class="screen">${header('Coin history')}<button class="ghost" onclick="showCoins()">← Back to coin pouch</button><div class="stack">${rows}</div><button class="secondary" onclick="clearCoinHistory()">Clear Coin History</button>${nav('coins')}</main>`;
}
function clearCoinHistory(){ if(confirm('Clear coin history only?')){ state.history = (state.history || []).filter(h => !(typeof h.coins === 'number' || h.category === 'transfer' || h.category === 'powerup' || h.category === 'manual')); save(); showCoinHistory(); } }
function transferCoins(from,to){
  const input = $('#coinTransferAmount');
  const amount = Math.floor(Number(input?.value || 0));
  if(!amount || amount < 1){ toast('Enter a coin amount'); return; }
  if(state.coins[from] < amount){ toast('Not enough coins'); return; }
  const moved = moveCoinsBetween(from,to,amount,'Manual Transfer');
  save(); speakText(`${moved} coins moved from ${from === 'his' ? (state.players.his || 'his') : (state.players.hers || 'hers')} to ${to === 'his' ? (state.players.his || 'his') : (state.players.hers || 'hers')}.`); showCoins();
}
function parsePowerUp(raw){
  if(typeof raw === 'object') return raw;
  const [main,cost='50',voice=''] = String(raw).split('|');
  const [name, ...descParts] = main.split(':');
  return { name:(name||'Power Up').trim(), description:(descParts.join(':')||'Custom power up').trim(), cost:Number(cost)||50, voiceText:voice.trim() };
}
function powerList(side){ return (state.powerUps?.[side] || []).map(parsePowerUp); }
function ensureInventory(){ state.inventory = state.inventory || {his:[], hers:[]}; state.inventory.his = state.inventory.his || []; state.inventory.hers = state.inventory.hers || []; state.activePowerUps = state.activePowerUps || {his:[], hers:[]}; }
function showPowerUps(tab='shop', side='his', returnTo='showHome'){
  ensureInventory();
  powerReturn = returnTo || powerReturn || 'showHome';
  const label = side==='his' ? state.players.his : state.players.hers;
  app().innerHTML=`<main class="screen">${header('Power Ups')}${backBtn(powerReturn + '()')}
    <div class="shop-tabs"><button class="${tab==='shop'?'active':''}" onclick="showPowerUps('shop','${side}',powerReturn)">🏪 Shop</button><button class="${tab==='inventory'?'active':''}" onclick="showPowerUps('inventory','${side}',powerReturn)">🎒 Inventory</button><button class="${tab==='active'?'active':''}" onclick="showPowerUps('active','${side}',powerReturn)">✨ Active</button></div>
    <div class="button-row" style="margin-bottom:14px"><button class="secondary ${side==='his'?'liked':''}" onclick="showPowerUps('${tab}','his',powerReturn)">${state.players.his || 'His'}</button><button class="secondary ${side==='hers'?'liked':''}" onclick="showPowerUps('${tab}','hers',powerReturn)">${state.players.hers || 'Hers'}</button></div>
    <section class="hero"><h2>${tab==='shop'?'Power shop':tab==='inventory'?'Inventory':'Active effects'}</h2><p>${label}'s coins: <b>${state.coins[side]}</b>. Power ups read aloud when opened or used.</p></section>
    <div class="stack">${renderPowerUps(tab, side)}</div>${nav()}</main>`;
}
function renderPowerUps(tab, side){
  ensureInventory();
  let list = tab==='shop' ? powerList(side) : (tab==='inventory' ? state.inventory[side].map(parsePowerUp) : state.activePowerUps[side].map(parsePowerUp));
  if(!list.length) return `<div class="challenge-card"><h2>Nothing here yet</h2><p class="small">Buy power ups from the shop or add more in the hidden editor.</p></div>`;
  return list.map((pu,i)=>`<div class="challenge-card"><div class="challenge-meta"><span class="badge">⚡ Power Up</span>${tab==='shop'?`<span class="tag price">${pu.cost} coins</span>`:''}${tab==='active' && pu.remaining ? `<span class="tag">${pu.remaining} turn${pu.remaining===1?'':'s'} left</span>`:''}</div><h2>${escapeHtml(pu.name)}</h2><p>${escapeHtml(pu.description)}</p><div class="card-actions"><button class="secondary" onclick="readPowerUp('${tab}','${side}',${i})">🔊 Read</button>${tab==='shop'?`<button class="primary" onclick="buyPowerUp('${side}',${i})">Buy</button>`:tab==='inventory'?`<button class="primary" onclick="usePowerUp('${side}',${i})">Use</button>`:`<button class="ghost" onclick="clearActivePowerUp('${side}',${i})">Clear</button>`}</div></div>`).join('');
}
function buyPowerUp(side,index){
  ensureInventory(); const pu=powerList(side)[index]; if(!pu) return;
  if(state.coins[side] < pu.cost){ toast('Not enough coins'); return; }
  state.coins[side]-=pu.cost; state.inventory[side].push(pu); state.history.push({ date:new Date().toISOString(), side, category:'powerup', result:`Purchased ${pu.name}`, coins:-pu.cost }); save(); speakText(`${pu.name}. ${pu.description}. Purchased and added to inventory.`); showPowerUps('inventory',side,powerReturn);
}
function usePowerUp(side,index){
  ensureInventory(); const raw=state.inventory[side].splice(index,1)[0]; if(!raw) return;
  const parsed = parsePowerUp(raw);
  const name = (parsed.name || '').toLowerCase();

  // Instant power ups happen immediately and then return to the shop automatically.
  if(name.includes('royal claim')){
    const moved = moveCoinsBetween('his','hers',200,'Royal Claim');
    save();
    speakText((parsed.voiceText || `${parsed.name} activated. ${parsed.description}`) + (moved ? ` ${moved} coins moved.` : ' There were not enough coins to move.'));
    showPowerUps('inventory',side,powerReturn);
    return;
  }

  const active = {...parsed, remaining:getPowerUpDuration(parsed)};
  state.activePowerUps[side].push(active);
  save(); speakText((active.voiceText || `${active.name} activated. ${active.description}`)); showPowerUps('active',side,powerReturn);
}
function moveCoinsBetween(from,to,amount,reason){
  amount = Math.floor(Number(amount)||0);
  if(amount < 1) return 0;
  const available = Math.max(0, Number(state.coins[from]) || 0);
  const moved = Math.min(available, amount);
  if(moved < 1) return 0;
  state.coins[from] -= moved;
  state.coins[to] += moved;
  state.history.push({ date:new Date().toISOString(), side:'coins', category:'powerup', result:`${reason}: ${from} to ${to}`, coins:moved, from, to, amount:moved });
  return moved;
}
function getPowerUpDuration(pu){
  const p = parsePowerUp(pu); const text = `${p.name} ${p.description}`.toLowerCase();
  if(text.includes('queen tax')) return 2;
  const match = text.match(/(\d+)\s*(round|turn)/i);
  return match ? Number(match[1]) : 1;
}
function applyActivePowerUpsForTurn(side, result){
  ensureInventory();
  if(result !== 'completed') return 0;
  let bonusCoins = 0;

  // Current player effects, such as Double Coins and Coin Magnet.
  const currentActive = state.activePowerUps[side] || [];
  const currentRemaining = [];
  for(const raw of currentActive){
    const pu = {...parsePowerUp(raw)};
    const name = (pu.name || '').toLowerCase();
    let consumedTurn = false;
    if(name.includes('double coins')){ bonusCoins += currentBaseReward(); consumedTurn = true; }
    if(name.includes('coin magnet')){ bonusCoins += Math.floor(currentBaseReward() * 0.5); consumedTurn = true; }
    // Queen Tax is handled once globally below so it still fires on his turns too.
    if(name.includes('queen tax')) consumedTurn = false;
    if(consumedTurn){ pu.remaining = (Number(pu.remaining) || getPowerUpDuration(pu)) - 1; }
    if(!consumedTurn || pu.remaining > 0) currentRemaining.push(pu);
  }
  state.activePowerUps[side] = currentRemaining;

  // Hers-only Queen Tax: for the next 2 completed turns, move 10% of his current coins to hers.
  const hersActive = state.activePowerUps.hers || [];
  const hersRemaining = [];
  for(const raw of hersActive){
    const pu = {...parsePowerUp(raw)};
    const name = (pu.name || '').toLowerCase();
    if(name.includes('queen tax')){
      const tax = Math.floor((Number(state.coins.his) || 0) * 0.10);
      const moved = moveCoinsBetween('his','hers',tax,'Queen Tax');
      if(moved > 0) toast(`Queen Tax moved ${moved} coins`);
      pu.remaining = (Number(pu.remaining) || getPowerUpDuration(pu)) - 1;
      if(pu.remaining > 0) hersRemaining.push(pu);
    } else {
      // Avoid deleting other Hers effects when this function runs from His turns.
      if(side !== 'hers') hersRemaining.push(pu);
      else {
        // If this was already processed as current side above, keep the processed version from state.activePowerUps.hers.
      }
    }
  }
  if(side !== 'hers') state.activePowerUps.hers = hersRemaining;
  else {
    // Merge non-tax Hers effects already processed with remaining tax effects.
    const processedNonTax = (state.activePowerUps.hers || []).filter(x => !(parsePowerUp(x).name || '').toLowerCase().includes('queen tax'));
    const remainingTax = hersRemaining.filter(x => (parsePowerUp(x).name || '').toLowerCase().includes('queen tax'));
    state.activePowerUps.hers = [...processedNonTax, ...remainingTax];
  }
  return bonusCoins;
}
function currentBaseReward(){ const cat = currentView?.cat; return REWARDS[cat] || 50; }
function clearActivePowerUp(side,index){ ensureInventory(); const pu=state.activePowerUps[side].splice(index,1)[0]; if(pu) { save(); toast('Returned to shop'); } showPowerUps('active',side,powerReturn); }
function readPowerUp(tab,side,index){
  ensureInventory(); const list = tab==='shop' ? powerList(side) : (tab==='inventory' ? state.inventory[side].map(parsePowerUp) : state.activePowerUps[side].map(parsePowerUp));
  const pu=list[index]; if(pu) speakText(`${pu.name}. ${pu.description}. ${tab==='shop'?`Cost ${pu.cost} coins.`:''}`);
}
function showFunishments(){ listScreen('Funishments', state.funishments); }
function listScreen(title,obj){ app().innerHTML=`<main class="screen">${header(title)}${backBtn()}<h3>${state.players.his}</h3><div class="stack">${obj.his.map(x=>`<div class="stat"><span>${escapeHtml(x)}</span></div>`).join('')}</div><h3>${state.players.hers}</h3><div class="stack">${obj.hers.map(x=>`<div class="stat"><span>${escapeHtml(x)}</span></div>`).join('')}</div>${nav()}</main>`; }
function showProgress(){
  const likes = state.feedback.filter(f=>f.feedback==='like').length, dislikes = state.feedback.filter(f=>f.feedback==='dislike').length;
  app().innerHTML=`<main class="screen">${header('Progress')}${backBtn()}<div class="stack"><div class="stat"><b>Total Likes</b><span>${likes}</span></div><div class="stat"><b>Total Dislikes</b><span>${dislikes}</span></div><div class="stat"><b>Completed/Skipped</b><span>${state.feedback.length}</span></div><div class="challenge-card"><h2>Recent history</h2>${state.history.slice(-8).reverse().map(h=>`<p class="small">${new Date(h.date).toLocaleString()} · ${h.side} · ${h.category} · ${h.result}</p>`).join('') || '<p class="small">No history yet.</p>'}</div></div>${nav('progress')}</main>`;
}
function lockTap(){
  if(currentView.side !== 'his' && currentScreen !== 'admin'){ toast(''); return; }
  lockTaps++; if(lockTaps>=3){ lockTaps=0; showAdmin(); } else toast(`${3-lockTaps} more`);
  setTimeout(()=>lockTaps=0,1500);
}
function showAdmin(){
  currentScreen='admin';
  app().innerHTML=`<main class="screen">${header('Hidden editor')}<button class="ghost" onclick="showHome()">Close editor</button>
  <section class="admin-list">
    ${card('📊','Likes & Dislikes','Hidden analytics','adminAnalytics()','wide')}
    ${card('✏️','Edit Challenges','Paste one challenge per line','adminEditChallenges()','wide')}
    ${card('📖','Edit Category Index','Change Hers category explanations','adminEditCategoryIndex()','wide')}
    ${card('📜','Edit Rules','One rule per line','adminEditRules()','wide')}
    ${card('⚡','Edit Power Ups','Name: description | cost | spoken text','adminEditPowerUps()','wide')}
    ${card('⚙️','Timer & Voice','2–5 min default, speech settings','adminSettings()','wide')}
    ${card('💾','Backup / Restore','Export or import JSON','adminBackup()','wide')}
    ${card('🧹','Reset Progress','Keep content, clear saves','resetProgress()','wide')}
  </section></main>`;
}
function adminAnalytics(){
  const rows = state.feedback.slice().reverse().map(f=>`<div class="stat"><span>${escapeHtml((f.category==='secret'?'First Challenge':(LABELS[f.side]?.[f.category] || f.category))+': '+f.text.slice(0,42))}</span><b>${f.feedback==='like'?'👍':'👎'}</b></div>`).join('') || '<p class="small">No feedback saved yet.</p>';
  app().innerHTML=`<main class="screen">${header('Hidden analytics')}<button class="ghost" onclick="showAdmin()">Back</button><div class="stack">${rows}</div></main>`;
}
function adminEditChallenges(selected='his:easy'){
  const options = getChallengeCategoryOptions(selected);
  app().innerHTML=`<main class="screen">${header('Challenge manager')}<button class="ghost" onclick="showAdmin()">← Back to editor</button>
    <section class="hero"><h2>Add, remove and reorder</h2><p>Edit the live challenge lists from your phone. Changes save straight away.</p></section>
    <div class="form"><label>Category<select id="managerCat" onchange="renderChallengeManager()">${options}</select></label></div>
    <div id="challengeManager" class="stack"></div>
  </main>`;
  renderChallengeManager();
}
function getChallengeCategoryOptions(selected){
  const out=[];
  for(const side of ['his','hers']){
    for(const cat of Object.keys(state.challenges[side])){
      const value=`${side}:${cat}`;
      out.push(`<option value="${value}" ${value===selected?'selected':''}>${escapeHtml(categoryLabel(side,cat))}</option>`);
    }
  }
  return out.join('');
}
function categoryLabel(side,cat){
  const player = side==='his' ? (state.players.his || 'His') : (state.players.hers || 'Hers');
  const label = cat==='secret' ? 'First Challenge' : (LABELS[side]?.[cat] || cat);
  return `${player} — ${label}`;
}
function renderChallengeManager(){
  const val = $('#managerCat')?.value || 'his:easy';
  const [side,cat]=val.split(':');
  const list = state.challenges[side][cat] || [];
  const rows = list.map((text,i)=>{
    const stats = getChallengeStats(side,cat,i);
    return `<div class="challenge-card compact-card"><div class="challenge-meta"><span class="tag">#${i+1}</span><span class="tag">👍 ${stats.likes}</span><span class="tag">👎 ${stats.dislikes}</span><span class="tag">✅ ${stats.completed}</span><span class="tag">⏭️ ${stats.skipped}</span></div>
      <p class="challenge-text manager-text">${escapeHtml(text)}</p>
      <div class="manager-actions">
        <button class="mini" onclick="editChallengeItem('${side}','${cat}',${i})">✏️ Edit</button>
        <button class="mini" onclick="duplicateChallengeItem('${side}','${cat}',${i})">📋 Duplicate</button>
        <button class="mini" onclick="moveChallengeItem('${side}','${cat}',${i},-1)" ${i===0?'disabled':''}>⬆️ Up</button>
        <button class="mini" onclick="moveChallengeItem('${side}','${cat}',${i},1)" ${i===list.length-1?'disabled':''}>⬇️ Down</button>
        <button class="mini danger-mini" onclick="deleteChallengeItem('${side}','${cat}',${i})">🗑️ Delete</button>
      </div></div>`;
  }).join('') || `<div class="challenge-card"><h2>No challenges yet</h2><p class="small">Add the first one below.</p></div>`;
  $('#challengeManager').innerHTML = `${rows}<div class="challenge-card"><h2>➕ Add challenge</h2><div class="form"><textarea id="newChallengeText" placeholder="Type the new challenge here..."></textarea><button class="primary" onclick="addChallengeItem('${side}','${cat}')">Add Challenge</button><button class="secondary" onclick="bulkEditChallenges('${side}','${cat}')">Bulk edit this category</button></div></div>`;
}
function getChallengeStats(side,cat,index){
  const relevant = state.feedback.filter(f=>f.side===side && f.category===cat && Number(f.index)===Number(index));
  return { likes: relevant.filter(f=>f.feedback==='like').length, dislikes: relevant.filter(f=>f.feedback==='dislike').length, completed: relevant.filter(f=>f.result==='completed').length, skipped: relevant.filter(f=>f.result==='skipped').length };
}
function addChallengeItem(side,cat){
  const text = $('#newChallengeText')?.value.trim();
  if(!text){ toast('Type a challenge first'); return; }
  state.challenges[side][cat].push(text); save(); toast('Challenge added'); renderChallengeManager();
}
function editChallengeItem(side,cat,index){
  const old = state.challenges[side][cat][index] || '';
  const updated = prompt('Edit challenge:', old);
  if(updated === null) return;
  const clean = updated.trim();
  if(!clean){ toast('Challenge left unchanged'); return; }
  state.challenges[side][cat][index]=clean; save(); toast('Challenge updated'); renderChallengeManager();
}
function duplicateChallengeItem(side,cat,index){
  const list=state.challenges[side][cat];
  list.splice(index+1,0,list[index]); save(); toast('Duplicated'); renderChallengeManager();
}
function deleteChallengeItem(side,cat,index){
  if(!confirm('Delete this challenge?')) return;
  state.challenges[side][cat].splice(index,1);
  const key=getProgressKey(side,cat);
  state.progress[key]=Math.min(state.progress[key]||0, Math.max(state.challenges[side][cat].length-1,0));
  save(); toast('Deleted'); renderChallengeManager();
}
function moveChallengeItem(side,cat,index,dir){
  const list=state.challenges[side][cat];
  const next=index+dir;
  if(next<0 || next>=list.length) return;
  [list[index],list[next]]=[list[next],list[index]]; save(); renderChallengeManager();
}
function bulkEditChallenges(side,cat){
  app().innerHTML=`<main class="screen">${header('Bulk edit')}<button class="ghost" onclick="adminEditChallenges('${side}:${cat}')">← Back to challenge manager</button><section class="hero"><h2>${escapeHtml(categoryLabel(side,cat))}</h2><p>One challenge per line. This replaces the whole category.</p></section><textarea id="bulkChallengeText">${escapeHtml((state.challenges[side][cat]||[]).join('\n'))}</textarea><button class="primary" onclick="saveBulkChallenges('${side}','${cat}')">Save Bulk Edit</button></main>`;
}
function saveBulkChallenges(side,cat){
  state.challenges[side][cat]=$('#bulkChallengeText').value.split('\n').map(x=>x.trim()).filter(Boolean); save(); toast('Bulk edit saved'); adminEditChallenges(`${side}:${cat}`);
}

function adminEditCategoryIndex(){
  const idx = state.categoryIndex || DEFAULT_DATA.categoryIndex;
  app().innerHTML=`<main class="screen">${header('Edit category index')}<button class="ghost" onclick="showAdmin()">← Back to editor</button>
    <section class="hero"><h2>Hers Category Index</h2><p>These descriptions appear when you tap Category Index on her path.</p></section>
    <div class="form">
      <label>💋 Hot Wife<textarea id="idxHotWife">${escapeHtml(idx.hotWife)}</textarea></label>
      <label>👠 Tease<textarea id="idxTease">${escapeHtml(idx.tease)}</textarea></label>
      <label>👑 Queen<textarea id="idxQueen">${escapeHtml(idx.queen)}</textarea></label>
      <label>🌶️ Spicy<textarea id="idxSpicy">${escapeHtml(idx.spicy)}</textarea></label>
      <button class="primary" onclick="saveCategoryIndex()">Save Category Index</button>
      <button class="secondary" onclick="resetCategoryIndex()">Reset To Defaults</button>
    </div>
  </main>`;
}
function saveCategoryIndex(){
  state.categoryIndex = {
    hotWife: $('#idxHotWife').value.trim() || DEFAULT_DATA.categoryIndex.hotWife,
    tease: $('#idxTease').value.trim() || DEFAULT_DATA.categoryIndex.tease,
    queen: $('#idxQueen').value.trim() || DEFAULT_DATA.categoryIndex.queen,
    spicy: $('#idxSpicy').value.trim() || DEFAULT_DATA.categoryIndex.spicy
  };
  save(); toast('Category index saved'); showAdmin();
}
function resetCategoryIndex(){
  if(!confirm('Reset the category index descriptions?')) return;
  state.categoryIndex = clone(DEFAULT_DATA.categoryIndex);
  save(); toast('Category index reset'); adminEditCategoryIndex();
}

function adminEditPowerUps(){
  const options = ['his','hers'].map(s=>`<option value="${s}">${s}</option>`).join('');
  app().innerHTML=`<main class="screen">${header('Edit power ups')}<button class="ghost" onclick="showAdmin()">Back</button><div class="form"><select id="editPowerSide" onchange="loadPowerSide()">${options}</select><textarea id="editPowerText"></textarea><button class="primary" onclick="savePowerSide()">Save Power Ups</button><p class="small">Format: Name: description | cost | spoken text. One per line.</p></div></main>`; loadPowerSide();
}
function loadPowerSide(){ const s=$('#editPowerSide').value; $('#editPowerText').value=(state.powerUps[s]||[]).map(x=> typeof x==='string'?x:`${x.name}: ${x.description}|${x.cost}|${x.voiceText||''}`).join('\n'); }
function savePowerSide(){ const s=$('#editPowerSide').value; state.powerUps[s]=$('#editPowerText').value.split('\n').map(x=>x.trim()).filter(Boolean); save(); toast('Power ups saved'); }
function adminEditRules(){ app().innerHTML=`<main class="screen">${header('Edit rules')}<button class="ghost" onclick="showAdmin()">Back</button><textarea id="rulesText">${escapeHtml(state.rules.join('\n'))}</textarea><button class="primary" onclick="state.rules=$('#rulesText').value.split('\n').filter(Boolean);save();toast('Rules saved')">Save Rules</button></main>`; }
function adminSettings(){ app().innerHTML=`<main class="screen">${header('Timer & voice')}<button class="ghost" onclick="showAdmin()">Back</button><div class="form"><label>Timer minimum seconds<input class="input" id="tMin" type="number" value="${state.settings.timerMin}"></label><label>Timer maximum seconds<input class="input" id="tMax" type="number" value="${state.settings.timerMax}"></label><label>Auto read challenges<select class="input" id="autoSpeak"><option value="true" ${state.settings.autoSpeak!==false?'selected':''}>On</option><option value="false" ${state.settings.autoSpeak===false?'selected':''}>Off</option></select></label><label>Auto read delay milliseconds<input class="input" id="autoDelay" type="number" min="0" step="500" value="${state.settings.autoSpeakDelay || 2000}"></label><label>Voice<select class="input" id="vName">${voiceOptions()}</select></label><label>Voice style<select class="input" id="vStyle"><option value="kora" ${state.settings.voiceStyle==='kora'?'selected':''}>Kora-style natural</option><option value="soft" ${state.settings.voiceStyle==='soft'?'selected':''}>Soft / slower</option><option value="plain" ${state.settings.voiceStyle==='plain'?'selected':''}>Plain</option></select></label><label>Voice rate<input class="input" id="vRate" type="number" min="0.5" max="1.4" step="0.01" value="${state.settings.voiceRate}"></label><label>Voice pitch<input class="input" id="vPitch" type="number" min="0.5" max="1.5" step="0.01" value="${state.settings.voicePitch}"></label><button class="secondary" onclick="previewVoice()">🔊 Preview Voice</button><button class="secondary" onclick="testAllVoices()">🎙️ Test All Voices</button><button class="primary" onclick="saveSettings()">Save Settings</button><p class="small">Tip: this now tries to pick the same kind of natural phone voice Kora used. Use Test All Voices, then save the one that sounds best.</p></div></main>`; }
function saveSettings(){ state.settings.timerMin=Number($('#tMin').value)||120; state.settings.timerMax=Number($('#tMax').value)||300; state.settings.autoSpeak=$('#autoSpeak').value==='true'; state.settings.autoSpeakDelay=Number($('#autoDelay').value)||2000; state.settings.voiceName=$('#vName').value; state.settings.voiceStyle=$('#vStyle').value; state.settings.voiceRate=Number($('#vRate').value)||.88; state.settings.voicePitch=Number($('#vPitch').value)||1.04; save(); toast('Settings saved'); }
function previewVoice(){ state.settings.voiceName=$('#vName').value; state.settings.voiceStyle=$('#vStyle').value; state.settings.voiceRate=Number($('#vRate').value)||.88; state.settings.voicePitch=Number($('#vPitch').value)||1.04; speakText('Your challenge is ready. Take your time, and follow the instruction carefully.'); }
function testAllVoices(){
  if(!('speechSynthesis' in window)) return toast('Speech not supported');
  const voices = speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang) || /English/i.test(v.name));
  if(!voices.length) return toast('No English voices found yet. Reopen this screen.');
  speechSynthesis.cancel();
  let i = 0;
  function next(){
    if(i >= voices.length){ toast('Voice test finished'); return; }
    const v = voices[i++];
    const u = new SpeechSynthesisUtterance(`${v.name}. Your challenge is ready.`);
    u.voice = v; u.rate = Number($('#vRate')?.value) || .88; u.pitch = Number($('#vPitch')?.value) || 1.04; u.volume = 1;
    u.onend = () => setTimeout(next, 450);
    speechSynthesis.speak(u);
  }
  next();
}
function adminBackup(){ app().innerHTML=`<main class="screen">${header('Backup / restore')}<button class="ghost" onclick="showAdmin()">Back</button><textarea id="backupText">${escapeHtml(JSON.stringify(state,null,2))}</textarea><button class="primary" onclick="navigator.clipboard.writeText($('#backupText').value);toast('Copied')">Copy Backup</button><button class="secondary" onclick="importBackup()">Import From Box</button></main>`; }
function importBackup(){ try{ state=mergeDeep(clone(DEFAULT_DATA), JSON.parse($('#backupText').value)); save(); toast('Imported'); showAdmin(); }catch{ toast('Invalid JSON'); } }
function resetProgress(){ if(confirm('Reset progress, feedback, coins and names? Content stays in code/defaults.')){ localStorage.removeItem(STORAGE_KEY); state=clone(DEFAULT_DATA); showNameScreen(); } }
function backBtn(fn='showHome()'){ return `<button class="ghost" style="margin-bottom:14px" onclick="${fn}">← Back</button>`; }
function escapeHtml(str=''){ return String(str).replace(/[&<>'"]/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[m])); }
window.addEventListener('load', init);
if('speechSynthesis' in window) speechSynthesis.onvoiceschanged = ()=>{ if(currentScreen==='admin' && document.querySelector('#vName')) adminSettings(); };
