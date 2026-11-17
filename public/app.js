// Malayalam AI TTS & 2D Story Animation Web App

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  // State
  let currentEngine = 'edge'; // Default to Microsoft Edge Neural
  let selectedVoice = 'Sobhana';
  let selectedStyle = 'conversational';
  let currentAudioBlob = null;
  let currentAudioUrl = null;
  let currentScenes = [];
  let currentScreenplay = [];
  let currentScreenplayScriptText = '';
  let loadedSceneImages = [];
  let animFrameId = null;

  // DOM Elements
  const tabEdge = document.getElementById('tabEdge');
  const tabGemini = document.getElementById('tabGemini');
  const edgeVoiceGrid = document.getElementById('edgeVoiceGrid');
  const geminiVoiceGrid = document.getElementById('geminiVoiceGrid');
  const voiceSectionTitle = document.getElementById('voiceSectionTitle');
  const voiceBadgeNotice = document.getElementById('voiceBadgeNotice');
  const voiceCards = document.querySelectorAll('.voice-card');
  const styleChips = document.querySelectorAll('.style-chip');
  const tagButtons = document.querySelectorAll('.tag-insert-btn');
  const txtMalayalam = document.getElementById('txtMalayalam');
  const charCount = document.getElementById('charCount');
  const btnSampleText = document.getElementById('btnSampleText');
  const btnClearText = document.getElementById('btnClearText');
  
  // Generation Buttons
  const btnAnalyzeScreenplay = document.getElementById('btnAnalyzeScreenplay');
  const btnScreenplayText = document.getElementById('btnScreenplayText');
  const btnScreenplayIcon = document.getElementById('btnScreenplayIcon');

  const btnGenerateAudio = document.getElementById('btnGenerateAudio');
  const btnAudioText = document.getElementById('btnAudioText');
  const btnAudioIcon = document.getElementById('btnAudioIcon');

  const btnGenerateVideo = document.getElementById('btnGenerateVideo');
  const btnVideoText = document.getElementById('btnVideoText');
  const btnVideoIcon = document.getElementById('btnVideoIcon');

  // Screenplay Director Board Elements
  const screenplaySection = document.getElementById('screenplaySection');
  const screenplayStatusBadge = document.getElementById('screenplayStatusBadge');
  const screenplayCardsGrid = document.getElementById('screenplayCardsGrid');
  const btnGenerateFromScreenplay = document.getElementById('btnGenerateFromScreenplay');

  // Video Section Elements
  const videoResultSection = document.getElementById('videoResultSection');
  const videoVoiceBadge = document.getElementById('videoVoiceBadge');
  const storyCanvas = document.getElementById('storyCanvas');
  const canvasCtx = storyCanvas.getContext('2d');
  const videoSubtitleOverlay = document.getElementById('videoSubtitleOverlay');
  const videoSubtitleText = document.getElementById('videoSubtitleText');
  const canvasPlayOverlay = document.getElementById('canvasPlayOverlay');
  const btnBigPlay = document.getElementById('btnBigPlay');
  const btnVideoPlayPause = document.getElementById('btnVideoPlayPause');
  const videoPlayIcon = document.getElementById('videoPlayIcon');
  const videoSeekSlider = document.getElementById('videoSeekSlider');
  const videoCurrentTimeDisplay = document.getElementById('videoCurrentTime');
  const videoTotalDurationDisplay = document.getElementById('videoTotalDuration');
  const btnDownloadVideo = document.getElementById('btnDownloadVideo');
  const btnDownloadVideoText = document.getElementById('btnDownloadVideoText');
  const btnDownloadAudioFromVideo = document.getElementById('btnDownloadAudioFromVideo');
  const thumbnailsGrid = document.getElementById('thumbnailsGrid');

  // Audio-Only Result Elements
  const audioResultSection = document.getElementById('audioResultSection');
  const resultVoiceBadge = document.getElementById('resultVoiceBadge');
  const audioElement = document.getElementById('audioElement');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const playIcon = document.getElementById('playIcon');
  const seekSlider = document.getElementById('seekSlider');
  const currentTimeDisplay = document.getElementById('currentTime');
  const totalDurationDisplay = document.getElementById('totalDuration');
  const speedSelector = document.getElementById('speedSelector');
  const waveformAnim = document.getElementById('waveformAnim');
  const btnDownload = document.getElementById('btnDownload');

  // Settings Modal Elements
  const btnSettings = document.getElementById('btnSettings');
  const settingsModal = document.getElementById('settingsModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const inputApiKey = document.getElementById('inputApiKey');
  const inputBackupApiKey = document.getElementById('inputBackupApiKey');
  const btnToggleKey = document.getElementById('btnToggleKey');
  const btnSaveApiKey = document.getElementById('btnSaveApiKey');
  const btnRemoveApiKey = document.getElementById('btnRemoveApiKey');
  const apiKeyStatusBadge = document.getElementById('apiKeyStatusBadge');
  const toast = document.getElementById('toast');

  // Atmospheric Particles for Canvas
  const particles = [];
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * 1280,
      y: Math.random() * 720,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: Math.random() * 0.6 + 0.2
    });
  }

  function getSavedPrimaryApiKey() {
    return localStorage.getItem('gemini_api_key') || '';
  }

  function getSavedBackupApiKey() {
    return localStorage.getItem('gemini_backup_api_key') || '';
  }

  function updateApiKeyBadge() {
    const key = getSavedPrimaryApiKey();
    const backupKey = getSavedBackupApiKey();
    if (key && key.trim().length > 5) {
      if (backupKey && backupKey.trim().length > 5) {
        apiKeyStatusBadge.textContent = '2 Keys Active ✓';
      } else {
        apiKeyStatusBadge.textContent = 'Key Active ✓';
      }
      apiKeyStatusBadge.classList.add('active');
    } else {
      apiKeyStatusBadge.textContent = 'Add Key';
      apiKeyStatusBadge.classList.remove('active');
    }
  }

  updateApiKeyBadge();

  // Engine Switcher Tabs
  if (tabEdge && tabGemini) {
    tabEdge.addEventListener('click', () => {
      tabEdge.classList.add('active');
      tabGemini.classList.remove('active');
      edgeVoiceGrid.style.display = 'grid';
      geminiVoiceGrid.style.display = 'none';
      currentEngine = 'edge';
      selectedVoice = 'Sobhana';
      if (voiceBadgeNotice) voiceBadgeNotice.textContent = '⚡ Edge Neural (Free)';
      
      // Mark Sobhana as active
      document.querySelectorAll('#edgeVoiceGrid .voice-card').forEach(c => c.classList.remove('active'));
      const defaultCard = document.querySelector('#edgeVoiceGrid .voice-card[data-voice="Sobhana"]');
      if (defaultCard) defaultCard.classList.add('active');
    });

    tabGemini.addEventListener('click', () => {
      tabGemini.classList.add('active');
      tabEdge.classList.remove('active');
      geminiVoiceGrid.style.display = 'grid';
      edgeVoiceGrid.style.display = 'none';
      currentEngine = 'gemini';
      selectedVoice = 'Puck';
      if (voiceBadgeNotice) voiceBadgeNotice.textContent = '🌟 Gemini 3.8 Flash';

      // Mark Puck as active
      document.querySelectorAll('#geminiVoiceGrid .voice-card').forEach(c => c.classList.remove('active'));
      const defaultCard = document.querySelector('#geminiVoiceGrid .voice-card[data-voice="Puck"]');
      if (defaultCard) defaultCard.classList.add('active');

      const savedKey = getSavedPrimaryApiKey();
      if (!savedKey) {
        showToast('ഗൂഗിൾ ജെമിനി ഉപയോഗിക്കാൻ API Key നൽകുക', 'info');
        settingsModal.style.display = 'flex';
      }
    });
  }

  // Voice Card Selection
  voiceCards.forEach(card => {
    card.addEventListener('click', () => {
      const parentGrid = card.closest('.voice-grid');
      if (parentGrid) {
        parentGrid.querySelectorAll('.voice-card').forEach(c => c.classList.remove('active'));
      } else {
        voiceCards.forEach(c => c.classList.remove('active'));
      }
      card.classList.add('active');
      selectedVoice = card.getAttribute('data-voice');
    });
  });

  // Style Selection Handler
  styleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      styleChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedStyle = chip.getAttribute('data-style');
    });
  });

  // Tag Insertion at Cursor
  tagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      insertTagAtCursor(tag);
    });
  });

  function insertTagAtCursor(tag) {
    const startPos = txtMalayalam.selectionStart;
    const endPos = txtMalayalam.selectionEnd;
    const currentText = txtMalayalam.value;

    const newText = currentText.substring(0, startPos) + ' ' + tag + ' ' + currentText.substring(endPos);
    txtMalayalam.value = newText;
    txtMalayalam.focus();

    const newCursorPos = startPos + tag.length + 2;
    txtMalayalam.setSelectionRange(newCursorPos, newCursorPos);
    updateCharCount();
  }

  function updateCharCount() {
    const len = txtMalayalam.value.trim().length;
    charCount.textContent = `${len} അക്ഷരങ്ങൾ`;
  }

  txtMalayalam.addEventListener('input', updateCharCount);

  btnClearText.addEventListener('click', () => {
    txtMalayalam.value = '';
    updateCharCount();
    txtMalayalam.focus();
  });

  let sampleStoryIndex = 0;
  const sampleStories = [
    {
      text: `പണ്ട് പണ്ട്, ഒരു വലിയ കാട്ടിൽ ശക്തനായ ഒരു സിംഹരാജാവ് ഭരിച്ചിരുന്നു. കാട്ടിലെ എല്ലാ മൃഗങ്ങളും അയാളെ ഭയപ്പെട്ടിരുന്നു[roar]. ഒരു ദിവസം അവൻ പാറപ്പുറത്തിരുന്ന് കാടിനെ നോക്കി അലറി.`,
      toast: '🦁 സിംഹരാജാവിന്റെ കഥ ലോഡ് ചെയ്തു! (Lion King on Pride Rock)'
    },
    {
      text: `പണ്ട് പണ്ട്, പുഴയോരത്തെ ഒരു ചെറിയ ഗ്രാമത്തിൽ ഒരു വയസ്സനായ മീൻപിടുത്തക്കാരൻ താമസിച്ചിരുന്നു. എല്ലാ ദിവസവും രാവിലെ, സൂര്യൻ ഉദിക്കും മുമ്പ്, അയാൾ തന്റെ പഴയ വള്ളവുമായി പുഴയിലേക്ക് ഇറങ്ങുമായിരുന്നു [laugh]. ഒരു ദിവസം പുഴയുടെ ആഴങ്ങളിൽ നിന്ന് വലിയൊരു സ്വർണ്ണ മത്സ്യം പ്രത്യക്ഷപ്പെട്ടു!`,
      toast: '🎣 മീൻപിടുത്തക്കാരന്റെയും സ്വർണ്ണമത്സ്യത്തിന്റെയും കഥ ലോഡ് ചെയ്തു!'
    },
    {
      text: `ഒരു രാജ്യത്ത് നീതിമാനായ ഒരു മഹാരാജാവ് കൊട്ടാരത്തിൽ ഭരണം നടത്തിയിരുന്നു. കാട്ടിൽ നിന്ന് ഒരു ബുദ്ധിമാനായ കുഞ്ഞുമുയൽ രാജാവിനെ കാണാൻ എത്തി.`,
      toast: '👑 മഹാരാജാവും ബുദ്ധിമാനായ കുഞ്ഞുമുയലും!'
    }
  ];

  btnSampleText.addEventListener('click', () => {
    const s = sampleStories[sampleStoryIndex % sampleStories.length];
    txtMalayalam.value = s.text;
    sampleStoryIndex++;
    updateCharCount();
    showToast(s.toast);
  });

  // Settings Modal Handlers
  btnSettings.addEventListener('click', () => {
    inputApiKey.value = getSavedPrimaryApiKey();
    inputBackupApiKey.value = getSavedBackupApiKey();
    settingsModal.style.display = 'flex';
  });

  btnCloseModal.addEventListener('click', () => {
    settingsModal.style.display = 'none';
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.style.display = 'none';
    }
  });

  btnToggleKey.addEventListener('click', () => {
    inputApiKey.type = inputApiKey.type === 'password' ? 'text' : 'password';
  });

  btnSaveApiKey.addEventListener('click', () => {
    const key = inputApiKey.value.trim();
    const backupKey = inputBackupApiKey.value.trim();
    if (key) {
      localStorage.setItem('gemini_api_key', key);
      if (backupKey) {
        localStorage.setItem('gemini_backup_api_key', backupKey);
      } else {
        localStorage.removeItem('gemini_backup_api_key');
      }
      updateApiKeyBadge();
      settingsModal.style.display = 'none';
      showToast('API കീകൾ വിജയകരമായി സേവ് ചെയ്തു! ✓', 'success');
    } else {
      showToast('ദയവായി സാധുവായ ഒരു API കീ നൽകുക', 'error');
    }
  });

  btnRemoveApiKey.addEventListener('click', () => {
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('gemini_backup_api_key');
    inputApiKey.value = '';
    inputBackupApiKey.value = '';
    updateApiKeyBadge();
    showToast('API കീകൾ നീക്കം ചെയ്തു.');
  });

  function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.style.display = 'block';

    setTimeout(() => {
      toast.style.display = 'none';
    }, 4500);
  }

  function base64ToBlob(base64, mimeType = 'audio/wav') {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  // --- AUDIO SYNTHESIS WITH AUTO-FAILOVER & EDGE NEURAL FALLBACK ---
  async function generateAudioCore(text) {
    // 1. Microsoft Edge Neural Engine (Zero API Key Needed)
    if (currentEngine === 'edge') {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine: 'edge',
          voice: selectedVoice,
          text: text
        })
      });

      const data = await response.json();
      if (!response.ok || !data.audioBase64) {
        throw new Error(data.error || 'Edge വോയ്സ് നിർമ്മിക്കാൻ കഴിഞ്ഞില്ല.');
      }

      const blob = base64ToBlob(data.audioBase64, data.mimeType || 'audio/mpeg');
      currentAudioBlob = blob;
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
      currentAudioUrl = URL.createObjectURL(blob);
      audioElement.src = currentAudioUrl;
      audioElement.load();
      return data;
    }

    // 2. Google Gemini 3.8 Flash Engine
    const primaryKey = getSavedPrimaryApiKey();
    const backupKey = getSavedBackupApiKey();

    if (!primaryKey) {
      settingsModal.style.display = 'flex';
      throw new Error('Google Gemini API Key നൽകുക, അല്ലെങ്കിൽ മുകളിൽ "⚡ Microsoft Edge Neural" തിരഞ്ഞെടുക്കുക!');
    }

    // Try primary key first
    let keyToUse = primaryKey;
    let response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine: 'gemini',
        text: text,
        voice: selectedVoice,
        style: selectedStyle,
        customApiKey: keyToUse
      })
    });

    let data = await response.json();

    // If quota exceeded and backup key exists, auto-switch to backup key!
    if (!response.ok && (data.error?.includes('exceeded your current quota') || data.error?.includes('RESOURCE_EXHAUSTED')) && backupKey) {
      console.log('Primary key quota exceeded, automatically failing over to backup key...');
      showToast('ബാക്കപ്പ് കീയിലേക്ക് തനിയെ സ്വിച്ച് ചെയ്യുന്നു...', 'warning');
      keyToUse = backupKey;

      response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine: 'gemini',
          text: text,
          voice: selectedVoice,
          style: selectedStyle,
          customApiKey: keyToUse
        })
      });
      data = await response.json();
    }

    // If STILL quota exceeded, fall back to Microsoft Edge Neural (Male/Female accordingly)!
    if (!response.ok && (data.error?.includes('exceeded your current quota') || data.error?.includes('RESOURCE_EXHAUSTED'))) {
      const isMale = ['Puck', 'Charon', 'Fenrir'].includes(selectedVoice);
      const fallbackVoice = isMale ? 'Midhun' : 'Sobhana';

      console.log(`Gemini quota reached 10/day! Falling back to Edge Neural (${fallbackVoice})...`);
      showToast(`ഗൂഗിൾ ക്വോട്ട (10/day) തീർന്നു! Edge Neural (${fallbackVoice}) ഉപയോഗിച്ച് നിർമ്മിക്കുന്നു... ⚡`, 'warning');

      const fallbackResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine: 'edge',
          voice: fallbackVoice,
          text: text
        })
      });

      data = await fallbackResponse.json();
      if (!fallbackResponse.ok || !data.audioBase64) {
        throw new Error(data.error || 'ഓഡിയോ നിർമ്മിക്കാൻ കഴിഞ്ഞില്ല.');
      }

      const blob = base64ToBlob(data.audioBase64, data.mimeType || 'audio/mpeg');
      currentAudioBlob = blob;
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
      currentAudioUrl = URL.createObjectURL(blob);
      audioElement.src = currentAudioUrl;
      audioElement.load();
      data.fallbackUsed = true;
      data.fallbackVoice = fallbackVoice;
      return data;
    }

    if (!response.ok) {
      if (data.code === 'MISSING_API_KEY') {
        settingsModal.style.display = 'flex';
      }
      throw new Error(data.error || 'ഓഡിയോ നിർമ്മിക്കാൻ കഴിഞ്ഞില്ല.');
    }

    if (!data.audioBase64) {
      throw new Error('ശൂന്യമായ ഓഡിയോ ഡാറ്റയാണ് ലഭിച്ചത്.');
    }

    const blob = base64ToBlob(data.audioBase64, data.mimeType || 'audio/wav');
    currentAudioBlob = blob;

    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl);
    }
    currentAudioUrl = URL.createObjectURL(blob);
    audioElement.src = currentAudioUrl;
    audioElement.load();

    return data;
  }

  // Helper to map English setting/prop/emotion tags to friendly Malayalam labels
  function getMalayalamSettingLabel(setting) {
    const map = {
      jungle_rock: 'പാറക്കെട്ടും വനവും (Pride Rock Cliff)',
      rocky_mountain: 'പാറക്കെട്ടുകൾ (Rocky Mountain)',
      forest_jungle: 'നിബിഡ വനം (Jungle / Forest)',
      royal_palace: 'രാജകൊട്ടാരം (Royal Palace)',
      thatched_hut: 'തീരത്തെ കുടിൽ (Cottage & Palms)',
      river_boat: 'നദി & വള്ളം (River & Boat)',
      kerala_village: 'കേരള ഗ്രാമം (Kerala Village)',
      night_campfire: 'രാത്രിയിലെ തീ (Night Campfire)'
    };
    return map[setting] || setting || 'വനപ്രദേശം';
  }

  function getMalayalamCharLabel(charObj = {}) {
    const type = charObj.type || 'man';
    if (type === 'lion_king') return 'സിംഹരാജാവ് (The Lion King with Crown)';
    if (type === 'tiger') return 'കടുവ (Striped Tiger)';
    if (type === 'elephant') return 'ആന (Elephant with Tusks)';
    if (type === 'rabbit') return 'മുയൽ (Clever Little Rabbit)';
    if (type === 'fox') return 'കുറുക്കൻ (Cunning Fox)';
    if (type === 'monkey') return 'കുരങ്ങൻ (Playful Monkey)';
    if (type === 'king') return 'മഹാരാജാവ് (King with Crown & Robe)';
    if (type === 'doctor') return 'ഡോക്ടർ (Doctor with Stethoscope)';
    if (type === 'teacher') return 'അധ്യാപകൻ (Teacher)';
    if (type === 'old_man') return 'വയസ്സനായ മീൻപിടുത്തക്കാരൻ (Old Fisherman)';
    if (type === 'hunter') return 'വേട്ടക്കാരൻ (Prehistoric Hunter)';
    if (type === 'young_boy') return 'ചെറുപ്പക്കാരൻ / ബാലൻ (Young Boy)';
    if (type === 'woman') return 'സ്ത്രീ (Woman)';
    return 'കഥാപാത്രം (Character)';
  }

  function getMalayalamPoseEmotionLabel(charObj = {}) {
    const pose = charObj.pose || 'walking';
    const emotion = charObj.emotion || 'happy';
    let poseTxt = 'നടത്തം (Walking)';
    if (pose === 'roaring') poseTxt = 'ഗർജ്ജിക്കുന്നു (Roaring [ROAR]!)';
    if (pose === 'sitting') poseTxt = 'പാറപ്പുറത്തിരിക്കുന്നു (Sitting Proudly)';
    if (pose === 'in_boat') poseTxt = 'വള്ളത്തിൽ തുഴയുന്നു (Rowing in boat)';
    if (pose === 'standing_surprised') poseTxt = 'അതിശയിച്ച് നിൽക്കുന്നു (Shocked / Surprised)';
    if (pose === 'standing') poseTxt = 'നിൽക്കുന്നു (Standing)';

    let emoTxt = 'സന്തോഷം (Happy)';
    if (emotion === 'fierce') emoTxt = 'ഗംഭീര ഗർജ്ജനം (Fierce & Mighty)';
    if (emotion === 'proud') emoTxt = 'രാജകീയ ഭാവം (Regal & Proud)';
    if (emotion === 'laughing') emoTxt = 'ചിരി (Laughing [laugh])';
    if (emotion === 'shocked') emoTxt = 'അമ്പരപ്പ് / ഞെട്ടൽ (Shocked !)';
    if (emotion === 'scared') emoTxt = 'ഭയം (Scared)';
    if (emotion === 'curious') emoTxt = 'കൗതുകം (Curious)';

    return `${poseTxt} • ${emoTxt}`;
  }

  function getMalayalamObjectLabel(obj) {
    const map = {
      royal_crown: 'രാജകിരീടം (Royal Crown)',
      golden_mane: 'സിംഹ സട (Golden Mane)',
      rocky_cliff: 'പാറക്കെട്ട് (Pride Rock Cliff)',
      curved_tusks: 'ആനക്കൊമ്പുകൾ (Tusks)',
      carrot: 'കാരറ്റ് (Carrot)',
      royal_throne: 'സിംഹാസനം (Royal Throne)',
      golden_scepter: 'ചെങ്കോൽ (Royal Scepter)',
      wooden_boat: 'തടി വള്ളം (Wooden Canoe)',
      golden_fish: 'സ്വർണ്ണമത്സ്യം (Golden Fish)',
      thatched_hut: 'പുല്ലുമേഞ്ഞ കുടിൽ (Thatched Hut)',
      river_water: 'പുഴവെള്ളം (River Water)',
      boulders_rocks: 'പാറകൾ (Boulders)',
      campfire: 'തീക്കൂമ്പാരം (Campfire)',
      tall_trees: 'വനവൃക്ഷങ്ങൾ (Trees)',
      coconut_palms: 'തെങ്ങുകൾ (Coconut Palms)',
      walking_stick: 'ഊന്നുവടി (Walking Cane)',
      fishing_net: 'മീൻവല (Fishing Net)',
      oar: 'തുഴ (Wooden Oar)'
    };
    return map[obj] || obj;
  }

  // --- SCRIPT ANALYSIS & SCREENPLAY STORYBOARD ENGINE ---
  async function analyzeAndRenderScreenplay(text) {
    const savedApiKey = getSavedPrimaryApiKey();
    btnAnalyzeScreenplay.disabled = true;
    btnScreenplayText.textContent = 'തിരക്കഥ വിശകലനം ചെയ്യുന്നു...';
    btnScreenplayIcon.setAttribute('data-lucide', 'loader-2');
    btnScreenplayIcon.classList.add('lucide-spin');
    if (window.lucide) lucide.createIcons();

    try {
      const res = await fetch('/api/screenplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, customApiKey: savedApiKey || '' })
      });

      const data = await res.json();
      currentScreenplay = data.screenplay || data.scenes || [];
      if (currentScreenplay.length === 0) {
        currentScreenplay = [{
          scene_number: 1,
          title: 'രംഗം 1: കഥയുടെ തുടക്കം',
          dialogue: text,
          subtitle: text,
          setting: 'thatched_hut',
          character: { type: 'old_man', pose: 'walking', prop: 'walking_stick', emotion: 'happy' },
          objects: ['thatched_hut', 'coconut_palms']
        }];
      }

      currentScenes = currentScreenplay;
      currentScreenplayScriptText = text;

      // Render Cards in #screenplayCardsGrid
      screenplayCardsGrid.innerHTML = '';
      currentScreenplay.forEach(sc => {
        const card = document.createElement('div');
        card.className = 'screenplay-card';

        const objectsHtml = (sc.objects || [])
          .map(obj => `<span class="obj-pill">${getMalayalamObjectLabel(obj)}</span>`)
          .join('');

        card.innerHTML = `
          <div class="screenplay-card-header">
            <span class="scene-num-badge">രംഗം ${sc.scene_number}</span>
            <span class="scene-card-title">${sc.title || `രംഗം ${sc.scene_number}`}</span>
          </div>

          <div class="screenplay-dialogue-box">
            "${sc.dialogue || sc.subtitle}"
          </div>

          <div class="screenplay-meta-grid">
            <div class="meta-item">
              <span class="meta-label"><i data-lucide="user"></i> കഥാപാത്രം (Character)</span>
              <span class="meta-value">${getMalayalamCharLabel(sc.character)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label"><i data-lucide="map-pin"></i> പശ്ചാത്തലം (Setting)</span>
              <span class="meta-value">${getMalayalamSettingLabel(sc.setting)}</span>
            </div>
            <div class="meta-item" style="grid-column: 1 / -1;">
              <span class="meta-label"><i data-lucide="smile"></i> ആക്ഷനും ഭാവവും (Pose & Emotion)</span>
              <span class="meta-value">${getMalayalamPoseEmotionLabel(sc.character)}</span>
            </div>
          </div>

          ${objectsHtml ? `
            <div class="meta-item">
              <span class="meta-label"><i data-lucide="box"></i> രംഗത്തിലെ വസ്തുക്കൾ (Objects)</span>
              <div class="screenplay-objects-row">${objectsHtml}</div>
            </div>
          ` : ''}
        `;
        screenplayCardsGrid.appendChild(card);
      });

      screenplayStatusBadge.textContent = `${currentScreenplay.length} രംഗങ്ങൾ വിശകലനം ചെയ്തു (Ready)`;
      screenplaySection.style.display = 'block';
      screenplaySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (window.lucide) lucide.createIcons();

      return currentScreenplay;
    } catch (err) {
      console.error(err);
      showToast('തിരക്കഥ വിശകലനം ചെയ്യുന്നതിൽ പിശക്: ' + err.message, 'error');
      throw err;
    } finally {
      btnAnalyzeScreenplay.disabled = false;
      btnScreenplayText.textContent = '📋 തിരക്കഥ വിശകലനം (Analyze Screenplay)';
      btnScreenplayIcon.setAttribute('data-lucide', 'scroll-text');
      btnScreenplayIcon.classList.remove('lucide-spin');
      if (window.lucide) lucide.createIcons();
    }
  }

  // --- BUTTON: ANALYZE SCREENPLAY ONLY ---
  btnAnalyzeScreenplay.addEventListener('click', async () => {
    const text = txtMalayalam.value.trim();
    if (!text) {
      showToast('ദയവായി വിശകലനം ചെയ്യാൻ മലയാളം സ്റ്റോറി നൽകുക!', 'error');
      txtMalayalam.focus();
      return;
    }
    await analyzeAndRenderScreenplay(text);
    showToast('കഥയുടെ തിരക്കഥ വിജയകരമായി തയ്യാറാക്കി! താഴെ കാണാം 📋', 'success');
  });

  if (btnGenerateFromScreenplay) {
    btnGenerateFromScreenplay.addEventListener('click', () => {
      btnGenerateVideo.click();
    });
  }

  // --- BUTTON 1: AUDIO ONLY ---
  btnGenerateAudio.addEventListener('click', async () => {
    const text = txtMalayalam.value.trim();
    if (!text) {
      showToast('ദയവായി ശബ്ദമാക്കാനുള്ള മലയാളം ടെക്സ്റ്റ് നൽകുക!', 'error');
      txtMalayalam.focus();
      return;
    }

    if (currentEngine === 'gemini') {
      const savedApiKey = getSavedPrimaryApiKey();
      if (!savedApiKey) {
        showToast('ദയവായി നിങ്ങളുടെ സൗജന്യ Google Gemini API Key നൽകുക, അല്ലെങ്കിൽ അൺലിമിറ്റഡ് ഫ്രീ എൻജിൻ തിരഞ്ഞെടുക്കുക!', 'error');
        settingsModal.style.display = 'flex';
        return;
      }
    }

    btnGenerateAudio.disabled = true;
    btnGenerateVideo.disabled = true;
    btnAudioText.textContent = 'വോയ്സ് നിർമ്മിക്കുന്നു...';
    btnAudioIcon.setAttribute('data-lucide', 'loader-2');
    btnAudioIcon.classList.add('lucide-spin');
    if (window.lucide) lucide.createIcons();

    try {
      const data = await generateAudioCore(text);
      
      videoResultSection.style.display = 'none';
      const engineLabel = data.fallbackUsed 
        ? `${data.fallbackVoice || 'Sobhana'} (Edge Neural Fallback)` 
        : (currentEngine === 'edge' ? `${selectedVoice} • Edge Neural` : `${selectedVoice} • Gemini 3.8 Flash`);
      resultVoiceBadge.textContent = `Voice: ${engineLabel}`;
      audioResultSection.style.display = 'block';
      audioResultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      audioElement.play().catch(() => {});
      showToast('ഓഡിയോ വിജയകരമായി നിർമ്മിച്ചു! 🎧', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'ഒരു പിശക് സംഭവിച്ചു.', 'error');
    } finally {
      btnGenerateAudio.disabled = false;
      btnGenerateVideo.disabled = false;
      btnAudioText.textContent = '🔊 ഓഡിയോ നിർമ്മിക്കുക (Generate Audio)';
      btnAudioIcon.setAttribute('data-lucide', 'volume-2');
      btnAudioIcon.classList.remove('lucide-spin');
      if (window.lucide) lucide.createIcons();
    }
  });

  // --- BUTTON 2: 2D STORY VIDEO ---
  btnGenerateVideo.addEventListener('click', async () => {
    const text = txtMalayalam.value.trim();
    if (!text) {
      showToast('ദയവായി സ്റ്റോറി ടെക്സ്റ്റ് നൽകുക!', 'error');
      txtMalayalam.focus();
      return;
    }

    const savedApiKey = getSavedPrimaryApiKey();
    if (currentEngine === 'gemini' && !savedApiKey) {
      showToast('ദയവായി നിങ്ങളുടെ സൗജന്യ Google Gemini API Key നൽകുക!', 'error');
      settingsModal.style.display = 'flex';
      return;
    }

    btnGenerateAudio.disabled = true;
    btnGenerateVideo.disabled = true;
    btnVideoText.textContent = '2D രംഗങ്ങൾ നിർമ്മിക്കുന്നു...';
    btnVideoIcon.setAttribute('data-lucide', 'loader-2');
    btnVideoIcon.classList.add('lucide-spin');
    if (window.lucide) lucide.createIcons();

    try {
      // 1. Script Analysis & Screenplay First!
      if (!currentScreenplay || currentScreenplay.length === 0 || currentScreenplayScriptText !== text) {
        btnVideoText.textContent = '1/3: തിരക്കഥ വിശകലനം ചെയ്യുന്നു...';
        await analyzeAndRenderScreenplay(text);
      }

      // 2. Generate Voice (TTS preserved 100%)
      btnVideoText.textContent = '2/3: വോയ്സ് തയ്യാറാക്കുന്നു...';
      const audioData = await generateAudioCore(text);

      // 3. Immediately start 2D Cartoon Animator loop matching the Screenplay
      btnVideoText.textContent = '3/3: 2D ആനിമേഷൻ ആരംഭിക്കുന്നു...';
      loadedSceneImages = [];
      thumbnailsGrid.innerHTML = '';

      audioResultSection.style.display = 'none';
      const voiceLabel = audioData.fallbackUsed 
        ? `${audioData.fallbackVoice || 'Sobhana'} (Edge Neural Fallback)` 
        : (currentEngine === 'edge' ? `${selectedVoice} (Edge Neural)` : selectedVoice);
      videoVoiceBadge.textContent = `Voice: ${voiceLabel} • 2D Animation (${currentScenes.length} രംഗങ്ങൾ)`;
      videoResultSection.style.display = 'block';
      videoResultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      startCanvasAnimationLoop();
      canvasPlayOverlay.classList.remove('hidden');

      // Populate Scene Thumbnails directly from the canvas renderer!
      thumbnailsGrid.innerHTML = '';
      for (let i = 0; i < currentScenes.length; i++) {
        const scene = currentScenes[i];
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 480;
        thumbCanvas.height = 270;
        const tCtx = thumbCanvas.getContext('2d');
        tCtx.scale(480 / 1280, 270 / 720);
        const isSceneRoaring = /\[roar\]|അലറി|ഗർജ്ജ|roar/i.test(scene.subtitle || scene.dialogue || '') || scene.character?.pose === 'roaring';
        renderSingleScene(tCtx, 1.5, 0.5, false, false, isSceneRoaring, scene);
        const imgUrl = thumbCanvas.toDataURL('image/jpeg', 0.88);

        const thumbCard = document.createElement('div');
        thumbCard.className = 'thumbnail-card';
        thumbCard.innerHTML = `
          <img src="${imgUrl}" alt="Scene ${i+1}">
          <div class="thumbnail-caption">രംഗം ${i+1}: ${scene.title || scene.subtitle.substring(0, 45)}</div>
        `;
        thumbnailsGrid.appendChild(thumbCard);
      }

      showToast('തിരക്കഥ പ്രകാരമുള്ള 2D കാർട്ടൂൺ വീഡിയോ തയ്യാറായി! Play ചെയ്യുക 🎬', 'success');

    } catch (err) {
      console.error(err);
      showToast(err.message || 'വീഡിയോ നിർമ്മിക്കാൻ കഴിഞ്ഞില്ല.', 'error');
    } finally {
      btnGenerateAudio.disabled = false;
      btnGenerateVideo.disabled = false;
      btnVideoText.textContent = '🎬 2D സ്റ്റോറി വീഡിയോ (2D Video + Audio)';
      btnVideoIcon.setAttribute('data-lucide', 'clapperboard');
      btnVideoIcon.classList.remove('lucide-spin');
      if (window.lucide) lucide.createIcons();
    }
  });

  function loadImagePromise(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      let done = false;

      img.onload = () => {
        if (!done) { done = true; resolve(img); }
      };
      img.onerror = () => {
        if (!done) { done = true; resolve(img); }
      };

      setTimeout(() => {
        if (!done) { done = true; resolve(img); }
      }, 5000);

      img.src = src;
    });
  }

  function detectSceneTheme(prompt = '', subtitle = '') {
    const lower = (prompt + ' ' + subtitle).toLowerCase();
    if (/സിംഹ|lion|പാറ|rock|cliff|mountain/i.test(lower)) {
      return 'jungle_rock';
    }
    if (/കൊട്ടാരം|സിംഹാസനം|രാജാവ്|palace|throne|king/i.test(lower)) {
      return 'royal_palace';
    }
    if (/പുഴ|തോണി|മീൻ|വള്ളം|കടൽ|തീരം|വെള്ളം|river|boat|canoe|fisherman|water|sea|lake|ocean|stream|shore|fishing/.test(lower)) {
      return 'river_boat';
    }
    if (/കാട്|മരം|തോട്ടം|പച്ചപ്പ്|പ്രകൃതി|മൃഗം|forest|tree|wood|jungle|nature|green|animal|wild/.test(lower)) {
      return 'forest_jungle';
    }
    if (/രാത്രി|ചന്ദ്രൻ|നക്ഷത്രം|ഇരുട്ട്|രഹസ്യം|തീ|night|moon|star|dark|midnight|shadow|campfire|fire/.test(lower)) {
      return 'night_campfire';
    }
    return 'jungle_rock';
  }

  // --- PREHISTORIC MALLU & KERALA 2D DOODLE CHARACTER ANIMATOR ---
  function drawDoodleCharacter(ctx, x, y, scale = 1, time = 0, isWalking = true, isTalking = false, isLaughing = false, prop = 'bow', charOptions = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const charType = charOptions.type || charOptions.charType || (prop === 'walking_stick' ? 'old_man' : 'hunter');
    const isOldMan = charType === 'old_man' || charOptions.hasBeard;
    const isSurprised = charOptions.pose === 'standing_surprised' || 
                        charOptions.emotion === 'shocked' || 
                        /shock|surpris|ഞെട്ടി|അത്ഭുത/i.test(charOptions.emotion || '') ||
                        /shock|surpris|ഞെട്ടി|അത്ഭുത/i.test(charOptions.pose || '');

    const actualProp = charOptions.prop || prop || (isOldMan ? 'walking_stick' : 'bow');

    const walkPhase = isWalking ? time * 7 : 0;
    const bodyBob = isWalking ? Math.abs(Math.sin(walkPhase)) * 6 : 0;
    const currentY = -bodyBob;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Back Leg (Trailing)
    const backHipX = 6;
    const backHipY = -70 + currentY;
    const backAngle = isWalking ? -Math.sin(walkPhase) * 0.55 : 0.25;
    const backKneeX = backHipX + Math.sin(backAngle) * 35;
    const backKneeY = backHipY + Math.cos(backAngle) * 35;
    const backFootX = backKneeX + (isWalking ? 22 : 15);
    const backFootY = 0;

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(backHipX, backHipY);
    ctx.lineTo(backKneeX, backKneeY);
    ctx.lineTo(backFootX, backFootY);
    ctx.stroke();

    // 2. Torso Line
    const neckX = -4;
    const neckY = -140 + currentY;
    const hipX = 0;
    const hipY = -75 + currentY;

    ctx.beginPath();
    ctx.moveTo(neckX, neckY);
    ctx.lineTo(hipX, hipY);
    ctx.stroke();

    // 3. Waist Garment (Kerala Mundu for Old Fisherman vs Loincloth for Hunter)
    if (isOldMan || charOptions.cloth === 'mundu') {
      // Traditional Kerala Mundu / Dhoti with Gold Border
      ctx.fillStyle = '#fefce8';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(hipX - 18, hipY - 14);
      ctx.lineTo(hipX + 18, hipY - 14);
      ctx.lineTo(hipX + 22, hipY + 34);
      ctx.lineTo(hipX, hipY + 40);
      ctx.lineTo(hipX - 20, hipY + 32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Gold Kara (Border)
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hipX - 17, hipY + 26);
      ctx.lineTo(hipX + 19, hipY + 28);
      ctx.stroke();
    } else {
      // Brown Prehistoric Loincloth
      ctx.fillStyle = '#8c572a';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(hipX - 16, hipY - 15);
      ctx.lineTo(hipX + 16, hipY - 15);
      ctx.lineTo(hipX + 20, hipY + 15);
      ctx.lineTo(hipX, hipY + 28);
      ctx.lineTo(hipX - 18, hipY + 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 4. Front Leg (Striding Forward)
    const frontHipX = -8;
    const frontHipY = -72 + currentY;
    const frontAngle = isWalking ? Math.sin(walkPhase) * 0.65 : -0.25;
    const frontKneeX = frontHipX + Math.sin(frontAngle) * 38;
    const frontKneeY = frontHipY + Math.cos(frontAngle) * 38;
    const frontFootX = frontKneeX - (isWalking ? 22 : 15);
    const frontFootY = 0;

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(frontHipX, frontHipY);
    ctx.lineTo(frontKneeX, frontKneeY);
    ctx.lineTo(frontFootX, frontFootY);
    ctx.stroke();

    // 5. Crossbody Pouch & Neck Ornament (Only for Hunter)
    if (!isOldMan && charType === 'hunter') {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(neckX + 5, neckY + 10);
      ctx.lineTo(hipX - 20, hipY - 10);
      ctx.stroke();
      // Pouch on Hip
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(hipX - 20, hipY - 8, 12, 14, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Beaded Necklace
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(neckX + i * 6, neckY + 8 + Math.abs(i) * 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // 6. Head (White Circle with bold black outline)
    const headX = neckX;
    const headY = neckY - 35;
    const headR = 32;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 7. Hair (White Curls for Old Man, Black Curls for Young/Hunter)
    const curls = [
      [-22, -22, 10],
      [-14, -32, 11],
      [-2, -36, 12],
      [11, -34, 11],
      [22, -24, 10],
      [-28, -12, 9],
      [-30, 0, 9],
      [-28, 12, 8]
    ];

    if (isOldMan) {
      // Fluffy White Curls for Old Man / Fisherman
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2.5;
      for (let [cx, cy, cr] of curls) {
        ctx.beginPath();
        ctx.arc(headX + cx, headY + cy, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else {
      // Dark Afro / Curly Black Hair (Prehistoric Mallu)
      ctx.fillStyle = '#111827';
      for (let [cx, cy, cr] of curls) {
        ctx.beginPath();
        ctx.arc(headX + cx, headY + cy, cr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 8. White Beard & Mustache (For Old Man / Fisherman)
    if (isOldMan) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3.5;

      // Cute White Mustache
      ctx.beginPath();
      ctx.moveTo(headX - 6, headY + 5);
      ctx.quadraticCurveTo(headX - 14, headY + 14, headX - 2, headY + 11);
      ctx.quadraticCurveTo(headX + 10, headY + 14, headX + 18, headY + 6);
      ctx.quadraticCurveTo(headX + 6, headY + 4, headX - 6, headY + 5);
      ctx.fill();
      ctx.stroke();

      // Fluffy White Beard flowing down from cheeks and chin
      ctx.beginPath();
      ctx.moveTo(headX - 18, headY + 8);
      ctx.quadraticCurveTo(headX - 26, headY + 26, headX - 10, headY + 38);
      ctx.quadraticCurveTo(headX + 6, headY + 46, headX + 22, headY + 36);
      ctx.quadraticCurveTo(headX + 26, headY + 20, headX + 18, headY + 8);
      ctx.quadraticCurveTo(headX + 6, headY + 22, headX - 18, headY + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 9. Eyes (Shocked vs Laughing vs Normal Blinking)
    const isBlink = Math.floor(time * 3) % 11 === 0;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3.5;

    if (isSurprised) {
      // Wide Shocked Eyes (O.O)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headX - 2, headY - 4, 7.5, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(headX + 16, headY - 3, 7.5, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // Small Black Pupils
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(headX - 2, headY - 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(headX + 16, headY - 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (isLaughing) {
      // Squeezed Laughing Happy Eyes ^ ^
      ctx.beginPath();
      ctx.arc(headX - 1, headY - 5, 5, Math.PI * 0.9, 0.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(headX + 16, headY - 4, 5, Math.PI * 0.9, 0.1);
      ctx.stroke();
    } else if (isBlink) {
      // Blinking Closed Eye Slit
      ctx.beginPath();
      ctx.moveTo(headX - 6, headY - 3);
      ctx.lineTo(headX + 4, headY - 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(headX + 11, headY - 2);
      ctx.lineTo(headX + 21, headY - 2);
      ctx.stroke();
    } else {
      // Cute Friendly Black Dots
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(headX - 1, headY - 3, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(headX + 16, headY - 2, 3.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 10. Expressive Mouth
    if (isSurprised) {
      // Shocked Round Open 'O' Mouth
      ctx.fillStyle = '#7f1d1d';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(headX + 6, headY + 12, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    } else if (isLaughing) {
      // Big Laughing Mouth with Red Interior and Upper Teeth
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(headX + 6, headY + 12, 11, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Upper Teeth
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(headX, headY + 12, 13, 3.5);
    } else if (isTalking) {
      // Animated Speech Mouth
      const talkCycle = 3 + Math.abs(Math.sin(time * 16)) * 7;
      ctx.fillStyle = '#7f1d1d';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(headX + 6, headY + 13, 6, talkCycle, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Gentle Smile Line
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(headX + 6, headY + 9, 8, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // 11. Arms & Poses (Surprised Hands Raised vs Walking vs Prop)
    if (isSurprised) {
      // Both arms thrown up in comic shock!
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(neckX - 8, neckY + 10);
      ctx.lineTo(neckX - 26, neckY - 15);
      ctx.lineTo(neckX - 36, neckY - 38);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(neckX + 8, neckY + 10);
      ctx.lineTo(neckX + 26, neckY - 15);
      ctx.lineTo(neckX + 36, neckY - 38);
      ctx.stroke();

      // Floating Animated Comic Exclamation Mark '!'
      const shockBob = Math.sin(time * 9) * 3;
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3;
      ctx.font = '900 36px sans-serif';
      ctx.strokeText('!', headX + 28, headY - 30 + shockBob);
      ctx.fillText('!', headX + 28, headY - 30 + shockBob);

    } else {
      // Back Arm
      const backArmAngle = isWalking ? Math.sin(walkPhase) * 0.5 : -0.2;
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(neckX - 8, neckY + 10);
      ctx.lineTo(neckX - 28 + Math.sin(backArmAngle) * 20, neckY + 38);
      ctx.lineTo(neckX - 32, neckY + 65);
      ctx.stroke();

      // Front Arm & Handheld Prop
      if (actualProp === 'walking_stick') {
        // Holding Wooden Walking Cane (ഊന്നുവടി)
        ctx.beginPath();
        ctx.moveTo(neckX + 8, neckY + 10);
        ctx.lineTo(neckX + 24, neckY + 36);
        ctx.lineTo(neckX + 38, neckY + 46);
        ctx.stroke();

        // Wooden Cane Shaft
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(neckX + 32, neckY + 44);
        ctx.lineTo(neckX + 44, 0); // Touches ground
        ctx.stroke();

        // Curved Cane Grip Handle
        ctx.beginPath();
        ctx.arc(neckX + 27, neckY + 40, 9, -0.3, Math.PI * 1.1, true);
        ctx.stroke();

      } else if (actualProp === 'paddle' || actualProp === 'oar') {
        // Holding Wooden Canoe Paddle
        ctx.beginPath();
        ctx.moveTo(neckX + 8, neckY + 10);
        ctx.lineTo(neckX + 30, neckY + 40);
        ctx.lineTo(neckX + 45, neckY + 55);
        ctx.stroke();

        // Paddle Shaft
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(neckX + 25, neckY - 10);
        ctx.lineTo(neckX + 55, neckY + 100);
        ctx.stroke();

        // Paddle Blade
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(neckX + 55, neckY + 95, 10, 22, 0.3, 0, Math.PI * 2);
        ctx.fill();

      } else if (actualProp === 'fishing_net') {
        // Rolled Fishing Net
        ctx.beginPath();
        ctx.moveTo(neckX + 8, neckY + 10);
        ctx.lineTo(neckX + 28, neckY + 35);
        ctx.lineTo(neckX + 42, neckY + 45);
        ctx.stroke();

        ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(neckX + 36, neckY + 50, 16, 26, 0.2, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

      } else {
        // Default: Hunting Bow
        ctx.beginPath();
        ctx.moveTo(neckX + 8, neckY + 10);
        ctx.lineTo(neckX + 32, neckY + 38);
        ctx.lineTo(neckX + 55, neckY + 45);
        ctx.stroke();

        // Curved Wooden Bow Stave
        ctx.strokeStyle = '#6e4222';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(neckX + 50, neckY + 45, 65, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        // Bowstring
        const bowTopX = neckX + 50 + Math.cos(-Math.PI * 0.45) * 65;
        const bowTopY = neckY + 45 + Math.sin(-Math.PI * 0.45) * 65;
        const bowBotX = neckX + 50 + Math.cos(Math.PI * 0.45) * 65;
        const bowBotY = neckY + 45 + Math.sin(Math.PI * 0.45) * 65;

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bowTopX, bowTopY);
        ctx.lineTo(bowBotX, bowBotY);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // --- ANIMAL & ROYAL ACTOR DRAWING SUITE ---

  // 1. THE LION KING ACTOR (സിംഹരാജാവ് - Golden Mane, Crown, Fangs & Shockwave Roar)
  function drawLionKingActor(ctx, x, y, scale = 1, time = 0, isTalking = false, isRoaring = false, isSitting = true, pose = 'sitting') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const bob = isRoaring ? Math.sin(time * 25) * 3.5 : Math.sin(time * 3) * 1.5;
    const tailSway = Math.sin(time * 3.5) * 12;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Tail (Trailing behind with fluffy amber tuft)
    const tailStartX = -80;
    const tailStartY = -35 + bob;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(tailStartX, tailStartY);
    ctx.bezierCurveTo(tailStartX - 40, tailStartY - 10, tailStartX - 55 + tailSway, tailStartY - 65, tailStartX - 45 + tailSway, tailStartY - 85);
    ctx.stroke();

    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(tailStartX - 45 + tailSway, tailStartY - 88, 12, 18, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Body (Sitting perched on rock vs Walking)
    ctx.fillStyle = '#fef3c7'; // Warm golden cream fur
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    if (isSitting) {
      ctx.moveTo(-90, 0);
      ctx.quadraticCurveTo(-95, -75 + bob, -30, -70 + bob);
      ctx.quadraticCurveTo(20, -68 + bob, 35, 0);
      ctx.lineTo(15, 0);
      ctx.lineTo(12, -40 + bob);
      ctx.lineTo(-20, -40 + bob);
      ctx.lineTo(-25, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rear Haunch Muscle Arc
      ctx.beginPath();
      ctx.arc(-60, -25 + bob, 30, Math.PI * 0.7, Math.PI * 1.8);
      ctx.stroke();

      // Front Paws
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.ellipse(28, 0, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-5, 0, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // Claws marks
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(22, 2); ctx.lineTo(22, -4);
      ctx.moveTo(28, 3); ctx.lineTo(28, -5);
      ctx.moveTo(34, 2); ctx.lineTo(34, -4);
      ctx.moveTo(-11, 2); ctx.lineTo(-11, -4);
      ctx.moveTo(-5, 3); ctx.lineTo(-5, -5);
      ctx.moveTo(1, 2); ctx.lineTo(1, -4);
      ctx.stroke();
    } else {
      const walkPhase = time * 6;
      const l1 = Math.sin(walkPhase) * 15;
      const l2 = -Math.sin(walkPhase) * 15;
      ctx.moveTo(-80, -50 + bob);
      ctx.lineTo(25, -55 + bob);
      ctx.lineTo(30, 0 + l1);
      ctx.lineTo(15, 0 + l1);
      ctx.lineTo(10, -45 + bob);
      ctx.lineTo(-50, -45 + bob);
      ctx.lineTo(-55, 0 + l2);
      ctx.lineTo(-70, 0 + l2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Voluminous Golden Lion Mane
    const maneX = 25;
    const maneY = -95 + bob;
    const maneScale = isRoaring ? 1.15 : 1.0;

    ctx.save();
    ctx.translate(maneX, maneY);
    ctx.scale(maneScale, maneScale);

    ctx.fillStyle = '#f59e0b'; // Golden amber
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;

    const maneTufts = [
      [-18, -35, 26], [12, -45, 28], [42, -32, 26],
      [52, -2, 28], [45, 28, 26], [18, 42, 26],
      [-18, 35, 25], [-35, 8, 26], [-32, -18, 25]
    ];

    ctx.beginPath();
    for (let [tx, ty, tr] of maneTufts) {
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();

    // Lion Head & Muzzle
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Feline Rounded Ears
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(-22, -28, 12, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(22, -28, 12, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Pink Inner Ear
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.arc(-22, -28, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(22, -28, 6, 0, Math.PI * 2);
    ctx.fill();

    // Snout / Muzzle
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.ellipse(8, 8, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Black Nose Triangle
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(4, 2);
    ctx.lineTo(14, 2);
    ctx.lineTo(9, 9);
    ctx.closePath();
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(18, 6); ctx.lineTo(44, 2);
    ctx.moveTo(18, 10); ctx.lineTo(46, 12);
    ctx.moveTo(18, 14); ctx.lineTo(42, 22);
    ctx.moveTo(-2, 6); ctx.lineTo(-24, 2);
    ctx.moveTo(-2, 10); ctx.lineTo(-26, 12);
    ctx.moveTo(-2, 14); ctx.lineTo(-22, 22);
    ctx.stroke();

    // Eyes
    const isBlink = Math.floor(time * 3) % 10 === 0 && !isRoaring;
    if (isRoaring) {
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-8, -12); ctx.lineTo(2, -8);
      ctx.moveTo(22, -12); ctx.lineTo(12, -8);
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(-2, -6, 4, 0, Math.PI * 2);
      ctx.arc(16, -6, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (isBlink) {
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-10, -8); ctx.lineTo(2, -8);
      ctx.moveTo(10, -8); ctx.lineTo(22, -8);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-2, -8, 6.5, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(16, -8, 6.5, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, -8, 3.5, 0, Math.PI * 2);
      ctx.arc(18, -8, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(0, -8, 1.8, 0, Math.PI * 2);
      ctx.arc(18, -8, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mouth & Roar Shockwave Mechanics
    if (isRoaring) {
      ctx.fillStyle = '#7f1d1d';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(9, 20, 16, 20, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(9, 28, 9, 0, Math.PI);
      ctx.fill();

      // Sharp White Fangs
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(1, 10); ctx.lineTo(4, 20); ctx.lineTo(7, 10); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(11, 10); ctx.lineTo(14, 20); ctx.lineTo(17, 10); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3, 30); ctx.lineTo(6, 22); ctx.lineTo(9, 30); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(11, 30); ctx.lineTo(14, 22); ctx.lineTo(17, 30); ctx.closePath();
      ctx.fill(); ctx.stroke();

      // Acoustic Roar Shockwave Rings ) ) )
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4.5;
      const pulse1 = (time * 14) % 35;
      const pulse2 = (time * 14 + 15) % 48;
      const pulse3 = (time * 14 + 30) % 62;

      ctx.beginPath();
      ctx.arc(20, 20, 30 + pulse1, -0.65, 0.65);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(20, 20, 48 + pulse2, -0.75, 0.75);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(20, 20, 68 + pulse3, -0.85, 0.85);
      ctx.stroke();

      ctx.save();
      ctx.font = '900 24px sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 4;
      ctx.strokeText('ROAR!', 55, -30);
      ctx.fillText('ROAR!', 55, -30);
      ctx.restore();

    } else if (isTalking) {
      const talkH = 4 + Math.abs(Math.sin(time * 16)) * 8;
      ctx.fillStyle = '#7f1d1d';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(9, 16, 9, talkH, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    } else {
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(9, 12, 10, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // Shiny Golden Crown on Lion King
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-16, -34);
    ctx.lineTo(-18, -58);
    ctx.lineTo(-4, -44);
    ctx.lineTo(8, -62);
    ctx.lineTo(20, -44);
    ctx.lineTo(34, -58);
    ctx.lineTo(32, -34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(-18, -55, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(8, -59, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.arc(34, -55, 3.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); // mane
    ctx.restore(); // base
  }

  // 2. THE CLEVER RABBIT ACTOR (മുയൽ)
  function drawRabbitActor(ctx, x, y, scale = 1, time = 0, isTalking = false, action = 'hopping') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const hop = Math.abs(Math.sin(time * 5)) * 12;
    const earWiggle = Math.sin(time * 4) * 0.15;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, -28 - hop, 22, 26, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.beginPath();
    ctx.arc(-22, -22 - hop, 8, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.beginPath();
    ctx.arc(8, -54 - hop, 18, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Upright Ears with Pink Interior
    ctx.save();
    ctx.translate(2, -70 - hop);
    ctx.rotate(-0.15 + earWiggle);
    ctx.beginPath();
    ctx.ellipse(0, -22, 7, 24, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(0, -22, 3.5, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(14, -70 - hop);
    ctx.rotate(0.15 - earWiggle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -22, 7, 24, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(0, -22, 3.5, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(14, -56 - hop, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(22, -50 - hop, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, -50 - hop); ctx.lineTo(38, -54 - hop);
    ctx.moveTo(24, -48 - hop); ctx.lineTo(38, -46 - hop);
    ctx.stroke();

    // Carrot in hand
    ctx.fillStyle = '#f97316';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(16, -26 - hop);
    ctx.lineTo(34, -22 - hop);
    ctx.lineTo(18, -14 - hop);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(16, -26 - hop); ctx.lineTo(8, -32 - hop);
    ctx.moveTo(16, -26 - hop); ctx.lineTo(10, -26 - hop);
    ctx.stroke();

    // Paws & Feet
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(8, -2 - hop, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.restore();
  }

  // 3. THE ELEPHANT ACTOR (ആന)
  function drawElephantActor(ctx, x, y, scale = 1, time = 0, isTalking = false, action = 'standing') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const bob = Math.sin(time * 3) * 2;
    const trunkWiggle = Math.sin(time * 3.5) * 10;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.ellipse(0, -65 + bob, 55, 45, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.fillRect(-45, -35 + bob, 22, 35 - bob);
    ctx.strokeRect(-45, -35 + bob, 22, 35 - bob);
    ctx.fillRect(-12, -35 + bob, 22, 35 - bob);
    ctx.strokeRect(-12, -35 + bob, 22, 35 - bob);
    ctx.fillRect(20, -35 + bob, 22, 35 - bob);
    ctx.strokeRect(20, -35 + bob, 22, 35 - bob);

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(45, -80 + bob, 28, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.ellipse(30, -80 + bob, 20, 28, 0.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(52, -88 + bob, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // White Pointed Tusk
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, -72 + bob);
    ctx.quadraticCurveTo(80, -65 + bob, 85, -80 + bob);
    ctx.quadraticCurveTo(75, -70 + bob, 60, -68 + bob);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Trunk
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(65, -78 + bob);
    ctx.quadraticCurveTo(85, -55 + bob, 85 + trunkWiggle, -20);
    ctx.stroke();

    ctx.restore();
  }

  // 4. THE TIGER ACTOR (കടുവ)
  function drawTigerActor(ctx, x, y, scale = 1, time = 0, isTalking = false, action = 'standing') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const bob = Math.sin(time * 3) * 2;
    const tailWag = Math.sin(time * 4) * 10;

    // Orange Body with Black Tiger Stripes
    ctx.fillStyle = '#fb923c';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.ellipse(0, -45 + bob, 50, 30, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Stripes
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(-20, -75 + bob); ctx.lineTo(-12, -45 + bob); ctx.lineTo(-16, -75 + bob); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -75 + bob); ctx.lineTo(6, -45 + bob); ctx.lineTo(2, -75 + bob); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(18, -75 + bob); ctx.lineTo(24, -45 + bob); ctx.lineTo(20, -75 + bob); ctx.fill();

    // Head
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.arc(45, -60 + bob, 24, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Ears
    ctx.beginPath();
    ctx.arc(32, -80 + bob, 8, 0, Math.PI * 2);
    ctx.arc(58, -80 + bob, 8, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Eyes
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(40, -64 + bob, 3, 0, Math.PI * 2);
    ctx.arc(54, -64 + bob, 3, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-45, -45 + bob);
    ctx.quadraticCurveTo(-70, -60 + bob, -65 + tailWag, -90);
    ctx.stroke();

    ctx.restore();
  }

  // 5. THE ROYAL KING ACTOR (മഹാരാജാവ്)
  function drawKingActor(ctx, x, y, scale = 1, time = 0, isTalking = false, action = 'standing') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const bob = Math.sin(time * 3) * 2;

    // Royal Crimson Cape
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-25, -90 + bob);
    ctx.lineTo(25, -90 + bob);
    ctx.lineTo(38, 0);
    ctx.lineTo(-38, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Spotted White Ermine Collar
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(0, -90 + bob, 28, 12, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Head
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(0, -125 + bob, 28, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Royal Beard
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(-16, -118 + bob);
    ctx.lineTo(0, -92 + bob);
    ctx.lineTo(16, -118 + bob);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.beginPath();
    ctx.arc(-8, -128 + bob, 3.5, 0, Math.PI * 2);
    ctx.arc(8, -128 + bob, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Golden Crown
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-18, -145 + bob);
    ctx.lineTo(-20, -165 + bob);
    ctx.lineTo(-8, -152 + bob);
    ctx.lineTo(0, -170 + bob);
    ctx.lineTo(8, -152 + bob);
    ctx.lineTo(20, -165 + bob);
    ctx.lineTo(18, -145 + bob);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Royal Scepter
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(35, -110 + bob);
    ctx.lineTo(35, 0);
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(35, -115 + bob, 9, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.restore();
  }

  // --- UNIFIED SCENE ACTOR DISPATCHER ---
  function drawSceneActor(ctx, charType, x, y, scale, time, isTalking, isLaughing, isRoaring, charConfig = {}) {
    if (charType === 'lion_king') {
      const isSitting = charConfig.pose === 'sitting' || charConfig.pose === 'standing' || !charConfig.pose;
      drawLionKingActor(ctx, x, y, scale, time, isTalking, isRoaring, isSitting, charConfig.pose || 'sitting');
    } else if (charType === 'tiger') {
      drawTigerActor(ctx, x, y, scale, time, isTalking, charConfig.pose || 'standing');
    } else if (charType === 'elephant') {
      drawElephantActor(ctx, x, y, scale, time, isTalking, charConfig.pose || 'standing');
    } else if (charType === 'rabbit') {
      drawRabbitActor(ctx, x, y, scale, time, isTalking, charConfig.pose || 'hopping');
    } else if (charType === 'king') {
      drawKingActor(ctx, x, y, scale, time, isTalking, charConfig.pose || 'standing');
    } else {
      drawDoodleCharacter(ctx, x, y, scale, time, charConfig.pose !== 'sitting', isTalking, isLaughing, charConfig.prop || 'bow', charConfig);
    }
  }

  // --- SCENE: PRIDE ROCK & JUNGLE CLIFF (Lion King Roaring & Ruling) ---
  function drawJungleRockScene(ctx, time, sceneProgress, isTalking, isLaughing, isRoaring, scene = {}) {
    // 1. Clean Warm Paper Canvas
    ctx.fillStyle = '#fdfcf7';
    ctx.fillRect(0, 0, 1280, 720);

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 1248, 688);

    // 2. Distant Horizon with minimal golden sun
    const sunR = 75 + Math.sin(time * 2) * 2;
    ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
    ctx.beginPath();
    ctx.arc(920, 430, sunR + 35, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(920, 430, sunR, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Distant minimal hills with pastel green wash
    ctx.fillStyle = '#bbf7d0';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, 430);
    ctx.quadraticCurveTo(320, 370, 680, 420);
    ctx.quadraticCurveTo(1000, 380, 1280, 410);
    ctx.lineTo(1280, 720);
    ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Savanna Ground Plain
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 430, 1280, 290);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 430);
    ctx.lineTo(1280, 430);
    ctx.stroke();

    // Distant Minimalist Savanna Acacia Tree
    ctx.save();
    ctx.translate(1080, 430);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(5, -45, 0, -80);
    ctx.lineTo(-30, -115);
    ctx.moveTo(0, -80);
    ctx.quadraticCurveTo(20, -100, 35, -120);
    ctx.stroke();

    ctx.fillStyle = '#86efac';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(-30, -120, 42, 12, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(35, -125, 38, 11, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(5, -132, 50, 14, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Flying birds in sky
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    const birdFly = (time * 25) % 1280;
    const birds = [
      [750 + birdFly * 0.4, 180 + Math.sin(time * 4) * 6],
      [790 + birdFly * 0.4, 165 + Math.sin(time * 4 + 1) * 6],
      [825 + birdFly * 0.4, 185 + Math.sin(time * 4 + 2) * 6]
    ];
    for (let [bx, by] of birds) {
      const rx = ((bx - 200) % 1000) + 200;
      ctx.beginPath();
      ctx.arc(rx - 7, by, 7, Math.PI * 1.1, Math.PI * 1.9);
      ctx.arc(rx + 7, by, 7, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }

    // 3. THE MAJESTIC PRIDE ROCK CLIFF PROMONTORY
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-40, 720);
    ctx.lineTo(0, 520);
    ctx.lineTo(540, 390); // Tip of Pride Rock
    ctx.lineTo(460, 480);
    ctx.lineTo(340, 720);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Faceted Rock Shading
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(120, 490);
    ctx.lineTo(540, 390);
    ctx.lineTo(430, 540);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rock Texture Lines
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(220, 470); ctx.lineTo(290, 620);
    ctx.moveTo(330, 440); ctx.lineTo(390, 580);
    ctx.moveTo(430, 420); ctx.lineTo(460, 500);
    ctx.stroke();

    // Tufts of grass on cliff base
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 3;
    const grassTufts = [[40, 515], [180, 480], [310, 445]];
    for (let [gx, gy] of grassTufts) {
      ctx.beginPath();
      ctx.moveTo(gx, gy); ctx.lineTo(gx - 6, gy - 14);
      ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - 18);
      ctx.moveTo(gx, gy); ctx.lineTo(gx + 6, gy - 12);
      ctx.stroke();
    }

    // 4. THE LION KING STANDING / SEATED PROUDLY ATOP THE CLIFF TIP
    const lionX = 460;
    const lionY = 390;
    drawLionKingActor(ctx, lionX, lionY, 1.25, time, isTalking, isRoaring, true, scene.character?.pose || 'sitting');

    // 5. IF OTHER ANIMALS ARE IN DIALOGUE (rabbit, elephant, etc. looking up respectfully)
    const dialogue = (scene.dialogue || scene.subtitle || '').toLowerCase();
    if (/മുയൽ|കുഞ്ഞുമുയൽ|rabbit/i.test(dialogue)) {
      drawRabbitActor(ctx, 780, 580, 1.0, time, false, 'hopping');
    } else if (/ആന|elephant/i.test(dialogue)) {
      drawElephantActor(ctx, 840, 570, 0.9, time, false, 'standing');
    }
  }

  // --- SCENE: ROYAL PALACE HALL (King on Throne) ---
  function drawRoyalPalaceScene(ctx, time, sceneProgress, isTalking, isLaughing, scene = {}) {
    ctx.fillStyle = '#fdfcf7';
    ctx.fillRect(0, 0, 1280, 720);

    // Palace Pillars
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4;
    ctx.fillRect(80, 60, 60, 660);
    ctx.strokeRect(80, 60, 60, 660);
    ctx.fillRect(1140, 60, 60, 660);
    ctx.strokeRect(1140, 60, 60, 660);

    // Arched Ceiling
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.quadraticCurveTo(640, 0, 1280, 80);
    ctx.stroke();

    // Red Carpet
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(540, 720);
    ctx.lineTo(600, 380);
    ctx.lineTo(680, 380);
    ctx.lineTo(740, 720);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ornate Golden Throne
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4;
    ctx.fillRect(580, 240, 120, 160);
    ctx.strokeRect(580, 240, 120, 160);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(595, 270, 90, 120);

    drawKingActor(ctx, 640, 480, 1.25, time, isTalking, 'standing');
  }

  // --- UNIFIED SCENE RENDERER (Used by both Video Player and Thumbnail Generator) ---
  function renderSingleScene(ctx, time, sceneProgress, isTalking, isLaughing, isRoaring, scene = {}) {
    const charConfig = scene.character || {};
    const charType = charConfig.type || (detectSceneTheme(scene.prompt, scene.subtitle) === 'forest' ? 'lion_king' : 'man');
    const setting = scene.setting || (charType === 'lion_king' ? 'jungle_rock' : (charType === 'king' ? 'royal_palace' : 'forest_jungle'));

    if (charType === 'lion_king' || charType === 'tiger' || setting === 'jungle_rock' || setting === 'rocky_mountain') {
      drawJungleRockScene(ctx, time, sceneProgress, isTalking, isLaughing, isRoaring, scene);
    } else if (charType === 'king' || setting === 'royal_palace') {
      drawRoyalPalaceScene(ctx, time, sceneProgress, isTalking, isLaughing, scene);
    } else if (setting === 'river_boat') {
      drawRiverBoatScene(ctx, time, sceneProgress, isTalking, isLaughing, scene);
    } else if (setting === 'night_campfire') {
      drawNightScene(ctx, time, sceneProgress, isTalking, isLaughing, scene);
    } else if (setting === 'forest_jungle') {
      drawForestScene(ctx, time, sceneProgress, isTalking, isLaughing, scene);
    } else if (setting === 'savannah_hut') {
      drawSavannahHutScene(ctx, time, sceneProgress, isTalking, isLaughing, scene);
    } else {
      drawKeralaVillageCottageScene(ctx, time, sceneProgress, isTalking, isLaughing, scene);
    }
  }

  // --- SCENE 1: KERALA VILLAGE & THATCHED COTTAGE (Puzhayorathe Gramam) ---
  function drawKeralaVillageCottageScene(ctx, time, sceneProgress, isTalking, isLaughing, scene = {}) {
    // Dawn Sky Gradient: Lavender/rose at top to warm golden sunrise at horizon
    const sky = ctx.createLinearGradient(0, 0, 0, 440);
    sky.addColorStop(0, '#a5b4fc');
    sky.addColorStop(0.35, '#f472b6');
    sky.addColorStop(0.7, '#fb923c');
    sky.addColorStop(1, '#fef08a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1280, 720);

    // Morning Stars fading out
    ctx.fillStyle = '#ffffff';
    const stars = [[550, 60, 1.5], [780, 90, 1.5], [950, 45, 2], [1120, 80, 1.5]];
    for (let [sx, sy, sr] of stars) {
      ctx.globalAlpha = 0.4 + Math.sin(time * 3 + sx) * 0.3;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Glowing Golden Morning Sun
    const sunR = 85 + Math.sin(time * 2) * 2;
    ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
    ctx.beginPath();
    ctx.arc(920, 420, sunR + 45, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(920, 420, sunR, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Distant Green Kerala Hills
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.quadraticCurveTo(240, 340, 520, 400);
    ctx.quadraticCurveTo(780, 330, 1050, 390);
    ctx.lineTo(1280, 420);
    ctx.lineTo(1280, 720);
    ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.moveTo(0, 430);
    ctx.quadraticCurveTo(320, 370, 720, 425);
    ctx.quadraticCurveTo(1000, 365, 1280, 410);
    ctx.lineTo(1280, 720);
    ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();

    // Ground: Lush Kerala Riverbank & Footpath
    const ground = ctx.createLinearGradient(0, 430, 0, 720);
    ground.addColorStop(0, '#15803d');
    ground.addColorStop(0.5, '#166534');
    ground.addColorStop(1, '#14532d');
    ctx.fillStyle = ground;
    ctx.fillRect(0, 430, 1280, 290);

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 430);
    ctx.lineTo(1280, 430);
    ctx.stroke();

    // Sandy Footpath winding to the river
    ctx.fillStyle = '#d4a373';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(180, 640);
    ctx.quadraticCurveTo(340, 620, 560, 580);
    ctx.quadraticCurveTo(820, 540, 1050, 530);
    ctx.lineTo(1280, 520);
    ctx.lineTo(1280, 580);
    ctx.quadraticCurveTo(860, 600, 600, 650);
    ctx.quadraticCurveTo(380, 710, 200, 720);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // River Water visible on the right edge
    const riverLap = ctx.createLinearGradient(1000, 460, 1280, 720);
    riverLap.addColorStop(0, '#0284c7');
    riverLap.addColorStop(1, '#0369a1');
    ctx.fillStyle = riverLap;
    ctx.beginPath();
    ctx.moveTo(1020, 430);
    ctx.quadraticCurveTo(1140, 460, 1280, 450);
    ctx.lineTo(1280, 720);
    ctx.lineTo(1120, 720);
    ctx.quadraticCurveTo(1060, 580, 1020, 430);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Swaying Coconut Palms along riverbank
    const sway = Math.sin(time * 1.6) * 6;
    function drawPalm(px, py, height, trunkCurve) {
      ctx.save();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + trunkCurve, py - height * 0.5, px + trunkCurve * 1.5 + sway, py - height);
      ctx.stroke();

      const topX = px + trunkCurve * 1.5 + sway;
      const topY = py - height;

      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 8;
      const fronds = [
        [-80, -25, -120, 20],
        [-50, -55, -80, -85],
        [40, -65, 80, -95],
        [75, -35, 120, 10],
        [85, 10, 130, 60]
      ];
      for (let [c1x, c1y, e1x, e1y] of fronds) {
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.quadraticCurveTo(topX + c1x, topY + c1y, topX + e1x, topY + e1y);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawPalm(1160, 440, 220, -25);
    drawPalm(880, 435, 180, 20);

    // Thatched Kerala Cottage (Left)
    const cottageX = 60;
    const cottageY = 360;

    // Clay Wall
    ctx.fillStyle = '#b07d4b';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(cottageX - 20, 640);
    ctx.lineTo(cottageX, cottageY + 30);
    ctx.lineTo(cottageX + 320, cottageY + 30);
    ctx.lineTo(cottageX + 300, 640);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dark Doorway
    ctx.fillStyle = '#1c130d';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(cottageX + 130, 640);
    ctx.lineTo(cottageX + 130, cottageY + 60);
    ctx.quadraticCurveTo(cottageX + 175, cottageY + 45, cottageX + 220, cottageY + 60);
    ctx.lineTo(cottageX + 220, 640);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Thatched Straw Conical Roof
    const roofGrad = ctx.createLinearGradient(0, cottageY - 140, 0, cottageY + 45);
    roofGrad.addColorStop(0, '#e8bf7a');
    roofGrad.addColorStop(0.6, '#d4a359');
    roofGrad.addColorStop(1, '#b58238');
    ctx.fillStyle = roofGrad;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(cottageX - 45, cottageY + 45);
    ctx.quadraticCurveTo(cottageX + 150, cottageY - 150, cottageX + 345, cottageY + 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Thatched Straw Fringe Overhang
    ctx.beginPath();
    for (let rx = cottageX - 45; rx < cottageX + 340; rx += 20) {
      ctx.quadraticCurveTo(rx + 10, cottageY + 60, rx + 20, cottageY + 45);
    }
    ctx.stroke();

    // Character walks out along the path towards the river
    const charX = 220 + sceneProgress * 320;
    const charY = 560;
    const charConfig = scene.character || { type: 'old_man', pose: 'walking', prop: 'walking_stick', emotion: 'happy' };
    drawDoodleCharacter(ctx, charX, charY, 1.15, time, true, isTalking, isLaughing, charConfig.prop || 'walking_stick', charConfig);
  }

  // --- SCENE: SAVANNAH HUT (Prehistoric Hunter) ---
  function drawSavannahHutScene(ctx, time, sceneProgress, isTalking, isLaughing, scene = {}) {
    const sky = ctx.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, '#94a3b8');
    sky.addColorStop(0.35, '#cbd5e1');
    sky.addColorStop(0.7, '#fed7aa');
    sky.addColorStop(1, '#fef08a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1280, 720);

    const sunR = 95 + Math.sin(time * 2) * 2;
    ctx.fillStyle = 'rgba(253, 224, 71, 0.2)';
    ctx.beginPath();
    ctx.arc(960, 420, sunR + 40, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(960, 420, sunR, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e7c689';
    ctx.fillRect(0, 420, 1280, 300);

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.lineTo(1280, 420);
    ctx.stroke();

    const charX = 240 + sceneProgress * 360;
    const charY = 560;
    const charConfig = scene.character || { type: 'hunter', pose: 'walking', prop: 'bow', emotion: 'happy' };
    drawDoodleCharacter(ctx, charX, charY, 1.15, time, true, isTalking, isLaughing, charConfig.prop || 'bow', charConfig);
  }

  // --- SCENE 2: KERALA RIVER, CANOE & SPEAKING GOLDEN FISH ---
  function drawRiverBoatScene(ctx, time, sceneProgress, isTalking, isLaughing, scene = {}) {
    const sky = ctx.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, '#fdba74');
    sky.addColorStop(0.35, '#fb923c');
    sky.addColorStop(0.7, '#f472b6');
    sky.addColorStop(1, '#38bdf8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1280, 720);

    // Sunrise Sun
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(640, 290, 75, 0, Math.PI * 2);
    ctx.fill();

    // Hills
    ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, 370);
    ctx.quadraticCurveTo(250, 300, 500, 360);
    ctx.quadraticCurveTo(720, 310, 950, 330);
    ctx.quadraticCurveTo(1100, 310, 1280, 360);
    ctx.lineTo(1280, 720); ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();

    // River Water
    const water = ctx.createLinearGradient(0, 420, 0, 720);
    water.addColorStop(0, '#0284c7');
    water.addColorStop(0.4, '#0369a1');
    water.addColorStop(1, '#075985');
    ctx.fillStyle = water;
    ctx.fillRect(0, 420, 1280, 300);

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, 420); ctx.lineTo(1280, 420);
    ctx.stroke();

    // Water Ripples
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 3;
    for (let r = 0; r < 5; r++) {
      const ry = 460 + r * 50;
      const rx = (time * 40 + r * 180) % 1350 - 70;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo(rx + 45, ry - 5, rx + 90, ry);
      ctx.stroke();
    }

    // Left Riverbank & Palm
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, 450);
    ctx.quadraticCurveTo(180, 430, 280, 520);
    ctx.lineTo(280, 720); ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();

    const sway = Math.sin(time * 1.5) * 5;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(80, 620);
    ctx.quadraticCurveTo(120, 480, 100 + sway, 340);
    ctx.stroke();

    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 9;
    const px = 100 + sway;
    const py = 340;
    ctx.beginPath();
    ctx.moveTo(px, py); ctx.quadraticCurveTo(px - 50, py - 30, px - 90, py + 10);
    ctx.moveTo(px, py); ctx.quadraticCurveTo(px - 20, py - 55, px - 60, py - 75);
    ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 45, py - 70, px + 85, py - 45);
    ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 55, py - 15, px + 80, py + 35);
    ctx.stroke();

    // Wooden Canoe (Vallam)
    const boatX = 620 + sceneProgress * 70;
    const boatY = 520 + Math.sin(time * 2.5) * 7;
    const boatTilt = Math.cos(time * 2.5) * 0.035;

    ctx.save();
    ctx.translate(boatX, boatY);
    ctx.rotate(boatTilt);

    // Boat Water Shadow
    ctx.fillStyle = 'rgba(7, 89, 133, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 25, 110, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boat Hull
    ctx.fillStyle = '#5c3a1e';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-110, 12);
    ctx.quadraticCurveTo(0, 48, 110, 12);
    ctx.quadraticCurveTo(80, -5, 0, 0);
    ctx.quadraticCurveTo(-80, -5, -110, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#3d2412';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-90, 16);
    ctx.quadraticCurveTo(0, 34, 90, 16);
    ctx.stroke();

    // Character in Canoe (Old Fisherman with White Beard & Mundu)
    const charConfig = scene.character || { type: 'old_man', pose: 'in_boat', prop: 'paddle', emotion: isLaughing ? 'laughing' : 'happy' };
    const charPose = charConfig.pose || 'in_boat';
    const isCharShocked = charConfig.emotion === 'shocked' || charPose === 'standing_surprised';

    drawDoodleCharacter(ctx, 0, 12, 1.0, time, false, isTalking && !isCharShocked, isLaughing, charConfig.prop || 'paddle', charConfig);
    ctx.restore();

    // Speaking Golden Fish (സ്വർണ്ണമത്സ്യം)
    const hasGoldenFish = (scene.objects && scene.objects.includes('golden_fish')) || 
                          /സ്വർണ്ണ\s*മത്സ്യം|മത്സ്യം|സ്വർണ്ണമീൻ|fish/i.test(scene.dialogue || scene.subtitle || '');

    if (hasGoldenFish) {
      const fishX = boatX + 175;
      const fishY = boatY - 10 + Math.sin(time * 3.5) * 8;
      const fishTilt = Math.sin(time * 2) * 0.12;

      ctx.save();
      ctx.translate(fishX, fishY);
      ctx.rotate(fishTilt);

      // Magical Golden Aura & Halo
      ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, Math.PI * 2);
      ctx.fill();

      // Fish Body (Golden Yellow)
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 28, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Fish Swishing Tail
      const tailWiggle = Math.sin(time * 10) * 4;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-24, 0);
      ctx.lineTo(-42, -14 + tailWiggle);
      ctx.lineTo(-36, 0);
      ctx.lineTo(-42, 14 + tailWiggle);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dorsal Fin
      ctx.beginPath();
      ctx.moveTo(-8, -14);
      ctx.quadraticCurveTo(0, -24, 10, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Big Cute Cartoon Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(14, -4, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(15, -4, 3, 0, Math.PI * 2);
      ctx.fill();

      // Speaking Animated Mouth for the Golden Fish!
      const isFishSpeaking = isTalking && (scene.dialogue || '').match(/സംസാരി|പറഞ്ഞു|speak|talk|മത്സ്യം/);
      if (isFishSpeaking) {
        const fishTalk = 2 + Math.abs(Math.sin(time * 16)) * 6;
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(26, 2, 4, fishTalk, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(24, 2, 3, 0.2, Math.PI);
        ctx.stroke();
      }

      ctx.restore();

      // Twinkling Golden Sparkles '✦'
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 20px sans-serif';
      const sp1 = Math.sin(time * 5) * 4;
      const sp2 = Math.cos(time * 5) * 4;
      ctx.fillText('✦', fishX - 30, fishY - 35 + sp1);
      ctx.fillText('✦', fishX + 28, fishY - 25 + sp2);

      // Water Splashes around fish
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(fishX, fishY + 18, 30 + (time * 12 % 18), 7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // --- SCENE 3: FOREST SCENE ---
  function drawForestScene(ctx, time, sceneProgress, isTalking, isLaughing, scene = {}) {
    const sky = ctx.createLinearGradient(0, 0, 0, 720);
    sky.addColorStop(0, '#064e3b');
    sky.addColorStop(0.5, '#047857');
    sky.addColorStop(1, '#6ee7b7');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1280, 720);

    ctx.fillStyle = 'rgba(254, 240, 138, 0.12)';
    ctx.beginPath();
    ctx.moveTo(300, 0); ctx.lineTo(450, 0); ctx.lineTo(750, 720); ctx.lineTo(500, 720);
    ctx.fill();

    ctx.fillStyle = '#022c22';
    ctx.fillRect(160, 0, 70, 720);
    ctx.fillRect(720, 0, 85, 720);
    ctx.fillRect(1040, 0, 95, 720);

    ctx.fillStyle = '#065f46';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.quadraticCurveTo(350, 470, 700, 530);
    ctx.quadraticCurveTo(1000, 480, 1280, 510);
    ctx.lineTo(1280, 720); ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.arc(195, 150, 140, 0, Math.PI * 2);
    ctx.arc(760, 120, 160, 0, Math.PI * 2);
    ctx.arc(1080, 160, 170, 0, Math.PI * 2);
    ctx.fill();

    const charX = 350 + sceneProgress * 400;
    const charY = 540;
    const charConfig = scene.character || { type: 'hunter', pose: 'walking', prop: 'bow', emotion: 'happy' };
    drawDoodleCharacter(ctx, charX, charY, 1.15, time, true, isTalking, isLaughing, charConfig.prop || 'bow', charConfig);
  }

  // --- SCENE 4: NIGHT CAMPFIRE SCENE ---
  function drawNightScene(ctx, time, sceneProgress, isTalking, isLaughing, scene = {}) {
    const sky = ctx.createLinearGradient(0, 0, 0, 720);
    sky.addColorStop(0, '#090a0f');
    sky.addColorStop(0.5, '#1e1b4b');
    sky.addColorStop(1, '#312e81');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1280, 720);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 20; i++) {
      const sx = (i * 67) % 1280;
      const sy = (i * 37) % 360;
      ctx.globalAlpha = 0.4 + Math.sin(time * 2 + i) * 0.4;
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Crescent Moon
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(1000, 160, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(1020, 150, 50, 0, Math.PI * 2);
    ctx.fill();

    // Ground
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.quadraticCurveTo(600, 470, 1280, 500);
    ctx.lineTo(1280, 720); ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Campfire
    const fireX = 640;
    const fireY = 540;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(fireX - 25, fireY + 8); ctx.lineTo(fireX + 25, fireY - 4);
    ctx.moveTo(fireX - 25, fireY - 4); ctx.lineTo(fireX + 25, fireY + 8);
    ctx.stroke();

    const flicker = Math.sin(time * 12) * 5;
    ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
    ctx.beginPath();
    ctx.arc(fireX, fireY - 20, 60 + flicker, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(fireX - 18, fireY);
    ctx.quadraticCurveTo(fireX - 10, fireY - 35 - flicker, fireX, fireY - 45 - flicker);
    ctx.quadraticCurveTo(fireX + 10, fireY - 35 - flicker, fireX + 18, fireY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(fireX - 10, fireY);
    ctx.quadraticCurveTo(fireX, fireY - 25 - flicker, fireX + 10, fireY);
    ctx.closePath();
    ctx.fill();

    const charConfig = scene.character || { type: 'old_man', pose: 'sitting', prop: 'none', emotion: 'calm' };
    drawDoodleCharacter(ctx, fireX - 120, 540, 1.15, time, false, isTalking, isLaughing, charConfig.prop || 'none', charConfig);
  }

  // --- SUBTITLES BURNED DIRECTLY INTO CANVAS ---
  function drawSubtitlesOnCanvas(ctx, subtitleText, canvasW, canvasH) {
    if (!subtitleText || !subtitleText.trim()) return;

    const cleanSub = subtitleText.replace(/\[[^\]]+\]/g, '').replace(/<[^>]+>/g, '').trim();
    if (!cleanSub) return;

    ctx.save();
    ctx.font = 'bold 26px Manjari, "Noto Sans Malayalam", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxW = 1000;
    const words = cleanSub.split(' ');
    const lines = [];
    let curLine = '';

    for (let w of words) {
      const testLine = curLine ? (curLine + ' ' + w) : w;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxW && curLine) {
        lines.push(curLine);
        curLine = w;
      } else {
        curLine = testLine;
      }
    }
    if (curLine) lines.push(curLine);

    const lineHeight = 36;
    const boxH = lines.length * lineHeight + 22;
    const boxW = Math.min(1150, Math.max(...lines.map(l => ctx.measureText(l).width)) + 50);
    const boxX = (canvasW - boxW) / 2;
    const boxY = canvasH - boxH - 25;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(boxX, boxY, boxW, boxH, 14);
    } else {
      ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    for (let i = 0; i < lines.length; i++) {
      const lineY = boxY + 11 + (i + 0.5) * lineHeight;
      ctx.fillText(lines[i], canvasW / 2, lineY);
    }

    ctx.restore();
  }

  // --- 2D CANVAS MOTION & VIDEO ENGINE ---
  function renderCanvasFrame() {
    const duration = audioElement.duration || 10;
    const currentTime = audioElement.currentTime || 0;
    const isPlaying = !audioElement.paused;

    const numScenes = Math.max(1, currentScenes.length);
    const sceneDuration = duration / numScenes;
    let sceneIndex = Math.floor(currentTime / sceneDuration);
    if (sceneIndex >= numScenes) {
      sceneIndex = numScenes - 1;
    }

    const scene = currentScenes[sceneIndex] || { prompt: '', subtitle: txtMalayalam.value };
    const sceneProgress = (currentTime % sceneDuration) / sceneDuration;
    const subtitle = scene.subtitle || '';

    const isLaughing = /\[laugh\]|\[giggle\]|<laugh>|<giggle>/i.test(subtitle) || 
                       (/\[laugh\]|\[giggle\]|<laugh>|<giggle>/i.test(txtMalayalam.value) && (sceneProgress > 0.6 || sceneIndex === numScenes - 1));
    const isRoaring = /\[roar\]|അലറി|ഗർജ്ജ|roar/i.test(subtitle) || 
                      scene.character?.pose === 'roaring' || 
                      scene.character?.emotion === 'fierce';
    const isTalking = isPlaying;

    renderSingleScene(canvasCtx, currentTime, sceneProgress, isTalking, isLaughing, isRoaring, scene);

    // Atmospheric Particles
    canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let p of particles) {
      p.x += p.speedX;
      p.y -= p.speedY;
      if (p.y < 0) { p.y = 720; p.x = Math.random() * 1280; }
      if (p.x < 0) p.x = 1280;
      if (p.x > 1280) p.x = 0;

      canvasCtx.beginPath();
      canvasCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      canvasCtx.fill();
    }

    // Burned-In Subtitles on Canvas for Video Export
    drawSubtitlesOnCanvas(canvasCtx, subtitle, 1280, 720);

    // Also update HTML overlay for accessibility
    if (videoSubtitleText) {
      videoSubtitleText.textContent = subtitle;
    }
  }

  function startCanvasAnimationLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    function loop() {
      renderCanvasFrame();
      animFrameId = requestAnimationFrame(loop);
    }
    loop();
  }

  function toggleVideoPlayback() {
    if (!audioElement.src) return;

    if (audioElement.paused) {
      audioElement.play();
      canvasPlayOverlay.classList.add('hidden');
      videoPlayIcon.setAttribute('data-lucide', 'pause');
    } else {
      audioElement.pause();
      canvasPlayOverlay.classList.remove('hidden');
      videoPlayIcon.setAttribute('data-lucide', 'play');
    }
    if (window.lucide) lucide.createIcons();
  }

  btnBigPlay.addEventListener('click', toggleVideoPlayback);
  btnVideoPlayPause.addEventListener('click', toggleVideoPlayback);
  storyCanvas.addEventListener('click', toggleVideoPlayback);

  // Sync Timeline Sliders
  audioElement.addEventListener('timeupdate', () => {
    videoSeekSlider.value = Math.floor(audioElement.currentTime);
    videoCurrentTimeDisplay.textContent = formatTime(audioElement.currentTime);

    seekSlider.value = Math.floor(audioElement.currentTime);
    currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
  });

  audioElement.addEventListener('loadedmetadata', () => {
    videoTotalDurationDisplay.textContent = formatTime(audioElement.duration);
    videoSeekSlider.max = Math.floor(audioElement.duration);

    totalDurationDisplay.textContent = formatTime(audioElement.duration);
    seekSlider.max = Math.floor(audioElement.duration);
  });

  audioElement.addEventListener('ended', () => {
    canvasPlayOverlay.classList.remove('hidden');
    videoPlayIcon.setAttribute('data-lucide', 'play');
    playIcon.setAttribute('data-lucide', 'play');
    waveformAnim.classList.remove('playing');
    if (window.lucide) lucide.createIcons();
  });

  videoSeekSlider.addEventListener('input', () => {
    audioElement.currentTime = videoSeekSlider.value;
    renderCanvasFrame();
  });

  let sharedAudioCtx = null;
  let sharedAudioSrc = null;
  let sharedAudioDest = null;

  // --- VIDEO EXPORT (.MP4 / .WEBM) ---
  btnDownloadVideo.addEventListener('click', async () => {
    if (!audioElement.src || !currentScenes || currentScenes.length === 0) {
      showToast('ഡൗൺലോഡ് ചെയ്യാൻ വീഡിയോ ലഭ്യമല്ല.', 'error');
      return;
    }

    btnDownloadVideo.disabled = true;
    btnDownloadVideoText.textContent = 'വീഡിയോ എക്‌സ്‌പോർട്ട് ചെയ്യുന്നു...';

    try {
      showToast('വീഡിയോ റെക്കോർഡിംഗ് ആരംഭിച്ചു... കാത്തിരിക്കുക 🎥');

      const canvasStream = storyCanvas.captureStream(30);

      if (!sharedAudioCtx) {
        sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        sharedAudioSrc = sharedAudioCtx.createMediaElementSource(audioElement);
        sharedAudioDest = sharedAudioCtx.createMediaStreamDestination();
        sharedAudioSrc.connect(sharedAudioDest);
        sharedAudioSrc.connect(sharedAudioCtx.destination);
      }
      if (sharedAudioCtx.state === 'suspended') {
        await sharedAudioCtx.resume();
      }

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...sharedAudioDest.stream.getAudioTracks()
      ]);

      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
        ? 'video/mp4;codecs=avc1'
        : (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm');

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      const recordedChunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const videoBlob = new Blob(recordedChunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(videoBlob);

        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = `malayalam_2d_story_${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        btnDownloadVideo.disabled = false;
        btnDownloadVideoText.textContent = '🎬 വീഡിയോ ഡൗൺലോഡ് (.MP4 / .WebM)';
        showToast('വീഡിയോ വിജയകരമായി സേവ് ചെയ്തു! 📥', 'success');
      };

      audioElement.currentTime = 0;
      recorder.start();
      await audioElement.play();

      audioElement.onended = () => {
        recorder.stop();
        audioElement.onended = null;
      };

    } catch (err) {
      console.error(err);
      btnDownloadVideo.disabled = false;
      btnDownloadVideoText.textContent = '🎬 വീഡിയോ ഡൗൺലോഡ് (.MP4 / .WebM)';
      showToast('എക്‌സ്‌പോർട്ട് പരാജയപ്പെട്ടു: ' + err.message, 'error');
    }
  });

  btnDownloadAudioFromVideo.addEventListener('click', () => {
    downloadCurrentAudio();
  });

  // --- AUDIO-ONLY PLAYER CONTROLS ---
  btnPlayPause.addEventListener('click', () => {
    if (!audioElement.src) return;
    if (audioElement.paused) {
      audioElement.play();
    } else {
      audioElement.pause();
    }
  });

  audioElement.addEventListener('play', () => {
    playIcon.setAttribute('data-lucide', 'pause');
    waveformAnim.classList.add('playing');
    videoPlayIcon.setAttribute('data-lucide', 'pause');
    canvasPlayOverlay.classList.add('hidden');
    if (window.lucide) lucide.createIcons();
  });

  audioElement.addEventListener('pause', () => {
    playIcon.setAttribute('data-lucide', 'play');
    waveformAnim.classList.remove('playing');
    videoPlayIcon.setAttribute('data-lucide', 'play');
    canvasPlayOverlay.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  });

  seekSlider.addEventListener('input', () => {
    audioElement.currentTime = seekSlider.value;
  });

  speedSelector.addEventListener('change', () => {
    audioElement.playbackRate = parseFloat(speedSelector.value);
  });

  btnDownload.addEventListener('click', () => {
    downloadCurrentAudio();
  });

  function downloadCurrentAudio() {
    if (!currentAudioBlob) {
      showToast('ഡൗൺലോഡ് ചെയ്യാൻ ഓഡിയോ ലഭ്യമല്ല.', 'error');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `malayalam_voice_${selectedVoice.toLowerCase()}_${timestamp}.wav`;

    const a = document.createElement('a');
    a.href = currentAudioUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast(`ഓഡിയോ സേവ് ചെയ്തു: ${filename} 🎧`, 'success');
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

});
