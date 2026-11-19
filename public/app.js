// Malayalam AI TTS & Talking Avatar / Presenter Studio
// Features: Real-time Audio-Reactive Lip-Sync, Head Movements, Eye Blinking,
// Preset Avatars (News Anchors, Zakia, Storyteller, Lion, Kitty) + Custom Photo Upload

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  // --- STATE ---
  let currentEngine = 'edge'; // Default to Microsoft Edge Neural (100% Free & Unlimited)
  let selectedVoice = 'Sobhana';
  let selectedStyle = 'conversational';
  let currentAudioBlob = null;
  let currentAudioUrl = null;
  let currentStoryText = '';
  let animFrameId = null;

  // Avatar & Studio State
  let currentAvatar = 'anjali'; // 'anjali', 'rahul', 'zakia', 'muthashan', 'lion', 'kitty', 'custom'
  let currentStudioBg = 'newsroom'; // 'newsroom', 'cozy_room', 'nature', 'neon'
  let customAvatarImg = null;
  let customMouthYRatio = 0.65; // 65% from top
  let customMouthScale = 1.0;

  // Ambient Soundscape State (Sanchariyude Diary Kurippukal Style)
  let currentAmbientSound = 'forest'; // 'forest', 'urban', 'rain', 'studio', 'none'
  let ambientVolume = 0.18; // 18% default (subtle background)
  let ambientSourceNode = null;
  let ambientGainNode = null;
  let ambientPreviewTimer = null;
  const ambientBuffersCache = {};

  // Audio Queue & Merger State
  let audioQueue = []; // array of { id, title, blob, duration, voice }
  let fullUnsplitScript = '';

  // Lip-Sync & Animation Variables
  let audioCtx = null;
  let audioSourceNode = null;
  let analyserNode = null;
  let freqDataArray = null;
  let currentMouthOpen = 0.0;
  let targetMouthOpen = 0.0;
  let tickerOffset = 0;

  // --- DOM ELEMENTS ---
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

  // Presenter Studio Elements
  const currentAvatarBadge = document.getElementById('currentAvatarBadge');
  const avatarCards = document.querySelectorAll('.avatar-card');
  const cardCustomAvatar = document.getElementById('cardCustomAvatar');
  const customAvatarDrawer = document.getElementById('customAvatarDrawer');
  const uploadDropzone = document.getElementById('uploadDropzone');
  const avatarFileInput = document.getElementById('avatarFileInput');
  const customPhotoControls = document.getElementById('customPhotoControls');
  const customPhotoImg = document.getElementById('customPhotoImg');
  const mouthCrosshair = document.getElementById('mouthCrosshair');
  const sliderMouthY = document.getElementById('sliderMouthY');
  const valMouthY = document.getElementById('valMouthY');
  const sliderMouthScale = document.getElementById('sliderMouthScale');
  const valMouthScale = document.getElementById('valMouthScale');
  const bgChips = document.querySelectorAll('.studio-bg-chips .bg-chip');
  const ambientChips = document.querySelectorAll('.ambient-chips .bg-chip');
  const sliderAmbientVol = document.getElementById('sliderAmbientVol');
  const valAmbientVol = document.getElementById('valAmbientVol');

  // Generation Buttons
  const btnGenerateAudio = document.getElementById('btnGenerateAudio');
  const btnAudioText = document.getElementById('btnAudioText');
  const btnAudioIcon = document.getElementById('btnAudioIcon');

  const btnGenerateVideo = document.getElementById('btnGenerateVideo');
  const btnVideoText = document.getElementById('btnVideoText');
  const btnVideoIcon = document.getElementById('btnVideoIcon');

  // Video Section Elements
  const videoResultSection = document.getElementById('videoResultSection');
  const videoVoiceBadge = document.getElementById('videoVoiceBadge');
  const storyCanvas = document.getElementById('storyCanvas');
  const canvasCtx = storyCanvas ? storyCanvas.getContext('2d') : null;
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
  const btnAddToQueue = document.getElementById('btnAddToQueue');
  const btnAddToQueueFromVideo = document.getElementById('btnAddToQueueFromVideo');

  // Auto-detected Parts Elements
  const detectedPartsContainer = document.getElementById('detectedPartsContainer');
  const detectedPartsBadge = document.getElementById('detectedPartsBadge');
  const detectedPartsList = document.getElementById('detectedPartsList');

  // Multi-Part Queue Elements
  const audioQueueSection = document.getElementById('audioQueueSection');
  const queueCountBadge = document.getElementById('queueCountBadge');
  const queueDurationBadge = document.getElementById('queueDurationBadge');
  const queueEmptyState = document.getElementById('queueEmptyState');
  const queueClipsList = document.getElementById('queueClipsList');
  const queueFooter = document.getElementById('queueFooter');
  const btnCombineAndDownload = document.getElementById('btnCombineAndDownload');
  const btnCombineText = document.getElementById('btnCombineText');
  const btnPlayAllQueue = document.getElementById('btnPlayAllQueue');
  const iconPlayAll = document.getElementById('iconPlayAll');
  const textPlayAll = document.getElementById('textPlayAll');
  const btnClearQueue = document.getElementById('btnClearQueue');
  const queueFileInput = document.getElementById('queueFileInput');
  const queueFileInputMore = document.getElementById('queueFileInputMore');

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

  // --- 7 GEMINI API KEYS MULTI-POOL STORAGE ---
  function getSavedApiKeysPool() {
    let pool = [];
    const savedPool = localStorage.getItem('gemini_api_keys_pool');
    if (savedPool) {
      try {
        pool = JSON.parse(savedPool);
      } catch (e) {
        pool = [];
      }
    }
    // Migration from old single/dual keys
    if (!Array.isArray(pool) || pool.length === 0) {
      const k1 = localStorage.getItem('gemini_api_key') || '';
      const k2 = localStorage.getItem('gemini_backup_api_key') || '';
      pool = [k1, k2].filter(Boolean);
    }
    // Ensure array has 7 elements
    const cleanPool = [];
    for (let i = 0; i < 7; i++) {
      cleanPool[i] = (pool[i] || '').trim();
    }
    return cleanPool;
  }

  function getActiveApiKeys() {
    return getSavedApiKeysPool().filter(k => k && k.length > 5);
  }

  function getSavedPrimaryApiKey() {
    const active = getActiveApiKeys();
    return active.length > 0 ? active[0] : '';
  }

  function getSavedBackupApiKey() {
    const active = getActiveApiKeys();
    return active.length > 1 ? active[1] : '';
  }

  function saveApiKeysPool(keysArray) {
    const clean = [];
    for (let i = 0; i < 7; i++) {
      clean[i] = (keysArray[i] || '').trim();
    }
    localStorage.setItem('gemini_api_keys_pool', JSON.stringify(clean));
    // Backwards compatibility
    if (clean[0]) localStorage.setItem('gemini_api_key', clean[0]);
    else localStorage.removeItem('gemini_api_key');
    if (clean[1]) localStorage.setItem('gemini_backup_api_key', clean[1]);
    else localStorage.removeItem('gemini_backup_api_key');
    updateApiKeyBadge();
  }

  function updateApiKeyBadge() {
    const active = getActiveApiKeys();
    if (active.length > 0) {
      apiKeyStatusBadge.textContent = `${active.length} / 7 Keys Active ✓`;
      apiKeyStatusBadge.classList.add('active');
    } else {
      apiKeyStatusBadge.textContent = 'Add Key';
      apiKeyStatusBadge.classList.remove('active');
    }
    const keyPoolCountBadge = document.getElementById('keyPoolCountBadge');
    if (keyPoolCountBadge) {
      keyPoolCountBadge.textContent = `${active.length} / 7 സജീവം`;
    }
    const pool = getSavedApiKeysPool();
    for (let i = 1; i <= 7; i++) {
      const dot = document.getElementById(`dotKey${i}`);
      if (dot) {
        if (pool[i - 1] && pool[i - 1].length > 5) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      }
    }
  }

  updateApiKeyBadge();

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.style.display = 'block';

    setTimeout(() => {
      toast.style.display = 'none';
    }, 4500);
  }

  // --- ENGINE SWITCHER (Edge vs Gemini) ---
  if (tabEdge && tabGemini) {
    tabEdge.addEventListener('click', () => {
      tabEdge.classList.add('active');
      tabGemini.classList.remove('active');
      edgeVoiceGrid.style.display = 'grid';
      geminiVoiceGrid.style.display = 'none';
      currentEngine = 'edge';
      selectedVoice = 'Sobhana';
      if (voiceBadgeNotice) voiceBadgeNotice.textContent = '⚡ Edge Neural (100% Free & Unlimited)';

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

      document.querySelectorAll('#geminiVoiceGrid .voice-card').forEach(c => c.classList.remove('active'));
      const defaultCard = document.querySelector('#geminiVoiceGrid .voice-card[data-voice="Puck"]');
      if (defaultCard) defaultCard.classList.add('active');

      const savedKey = getSavedPrimaryApiKey();
      if (!savedKey) {
        showToast('ഗൂഗിൾ ജെമിനി ഉപയോഗിക്കാൻ API Key നൽകുക', 'info');
        openSettingsModal();
      }
    });
  }

  // --- VOICE CARD SELECTION ---
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

  // --- STYLE CHIP SELECTION ---
  styleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      styleChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedStyle = chip.getAttribute('data-style');
    });
  });

  // --- TAG INSERTION ---
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

  function splitScriptIntoParts(fullText) {
    if (!fullText || fullText.length < 150) return [];
    const lines = fullText.split('\n');
    const parts = [];
    let currentHeader = '';
    let currentContent = [];

    for (let line of lines) {
      const trimmed = line.trim();
      const isDivider = trimmed.startsWith('---') || trimmed.startsWith('===');
      const isHeader = /^\[?(ഭാഗം|Part|അദ്ധ്യായം|Chapter|Scene|രംഗം)\s*\d+[^\]]*\]?/i.test(trimmed);

      if (isHeader) {
        if (currentContent.join('').trim().length > 0) {
          parts.push({
            title: currentHeader || `ഭാഗം ${parts.length + 1}`,
            content: currentContent.join('\n').trim()
          });
          currentContent = [];
        }
        currentHeader = trimmed.replace(/^[\[\s]+|[\]\s]+$/g, '');
      } else if (!isDivider) {
        currentContent.push(line);
      }
    }

    if (currentContent.join('').trim().length > 0) {
      parts.push({
        title: currentHeader || `ഭാഗം ${parts.length + 1}`,
        content: currentContent.join('\n').trim()
      });
    }

    if (parts.length >= 2) return parts;

    // Automatic fallback: if text > 2000 chars and has no headers, split into natural ~1600-char parts
    if (fullText.length > 2000) {
      const paragraphs = fullText.split(/\n\s*\n/);
      const autoParts = [];
      let cur = [];
      let curLen = 0;
      for (let p of paragraphs) {
        if (curLen + p.length > 1600 && cur.length > 0) {
          autoParts.push({
            title: `ഭാഗം ${autoParts.length + 1}`,
            content: cur.join('\n\n').trim()
          });
          cur = [];
          curLen = 0;
        }
        cur.push(p);
        curLen += p.length;
      }
      if (cur.length > 0) {
        autoParts.push({
          title: `ഭാഗം ${autoParts.length + 1}`,
          content: cur.join('\n\n').trim()
        });
      }
      if (autoParts.length >= 2) return autoParts;
    }

    return [];
  }

  function updateDetectedPartsUI(text) {
    if (!detectedPartsContainer || !detectedPartsList) return;
    const parts = splitScriptIntoParts(text);
    if (parts.length >= 2) {
      fullUnsplitScript = text;
      detectedPartsBadge.textContent = `${parts.length} ഭാഗങ്ങൾ കണ്ടെത്തി`;
      detectedPartsList.innerHTML = '';

      parts.forEach((p, idx) => {
        const pill = document.createElement('button');
        pill.className = 'part-pill';
        const shortName = p.title.replace(/^\[?ഭാഗം\s*\d+[:\s\-]*/i, '').trim();
        pill.innerHTML = `<i data-lucide="file-audio"></i> <strong>ഭാഗം ${idx + 1}:</strong> ${shortName ? shortName.slice(0, 24) + '...' : ''}`;
        pill.title = p.title;
        pill.addEventListener('click', () => {
          detectedPartsList.querySelectorAll('.part-pill').forEach(b => b.classList.remove('active'));
          pill.classList.add('active');
          txtMalayalam.value = p.content;
          charCount.textContent = `${p.content.length} അക്ഷരങ്ങൾ`;
          showToast(`"${p.title.slice(0, 35)}" തിരഞ്ഞെടുത്തു! ഓഡിയോ നിർമ്മിക്കുക 🎙️`, 'info');
        });
        detectedPartsList.appendChild(pill);
      });

      const fullPill = document.createElement('button');
      fullPill.className = 'part-pill';
      fullPill.innerHTML = `<i data-lucide="file-text"></i> മുഴുവൻ സ്ക്രിപ്റ്റും (Full)`;
      fullPill.addEventListener('click', () => {
        detectedPartsList.querySelectorAll('.part-pill').forEach(b => b.classList.remove('active'));
        fullPill.classList.add('active');
        txtMalayalam.value = fullUnsplitScript;
        charCount.textContent = `${fullUnsplitScript.length} അക്ഷരങ്ങൾ`;
      });
      detectedPartsList.appendChild(fullPill);

      detectedPartsContainer.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    } else {
      detectedPartsContainer.classList.add('hidden');
    }
  }

  function updateCharCount() {
    const text = txtMalayalam.value.trim();
    const len = text.length;
    charCount.textContent = `${len} അക്ഷരങ്ങൾ`;
    updateDetectedPartsUI(text);
  }

  txtMalayalam.addEventListener('input', updateCharCount);
  txtMalayalam.addEventListener('paste', () => {
    setTimeout(updateCharCount, 50);
  });

  btnClearText.addEventListener('click', () => {
    txtMalayalam.value = '';
    updateCharCount();
    txtMalayalam.focus();
  });

  // --- SAMPLE TEXTS ---
  let sampleStoryIndex = 0;
  const sampleStories = [
    {
      text: `അതി മനോഹരിയായിരുന്നു സാക്കിയ. സൌന്ദര്യം മാത്രമല്ല; നല്ല ബുദ്ധിയുമുണ്ടായിരുന്നു അവൾക്ക്. ഏതു കാര്യത്തിലും അവളുടെ അച്ഛൻ അവളുടെ ഉപദേശം തേടുമായിരുന്നു.`,
      toast: '🧕 സാക്കിയയുടെ കഥ ലോഡ് ചെയ്തു! (Zakia Avatar)'
    },
    {
      text: `ഇന്നത്തെ പ്രധാന വാർത്തകളിലേക്ക് സ്വാഗതം. സംസ്ഥാനത്ത് കാലവർഷം കൂടുതൽ ശക്തമാകുമെന്ന് കേന്ദ്ര കാലാവസ്ഥാ വകുപ്പ് മുന്നറിയിപ്പ് നൽകി. മലയോര മേഖലകളിൽ പ്രത്യേക ജാഗ്രതാ നിർദ്ദേശം പുറപ്പെടുവിച്ചിട്ടുണ്ട്.`,
      toast: '📺 മലയാളം ന്യൂസ് ബുള്ളറ്റിൻ ലോഡ് ചെയ്തു! (News Anchor)'
    },
    {
      text: `[whispers] ഹലോ... കേൾക്കാമോ? നിന്റെ കണ്ണുകളിലേക്ക് നോക്കുമ്പോൾ ഞാൻ കാണുന്നത് വെറുമൊരു മുഖമല്ല... എന്റെ ജീവിതത്തിന്റെ മുഴുവൻ വെളിച്ചമാണ്. നിന്റെ സാമീപ്യം എനിക്ക് തരുന്ന സന്തോഷം വാക്കുകൾക്ക് അതീതമാണ്. നീയില്ലാതെ ഒരു നിമിഷം പോലും എനിക്ക് സങ്കൽപ്പിക്കാൻ കഴിയില്ല...`,
      toast: '💖 റൊമാന്റിക് പ്രണയ വരികൾ ലോഡ് ചെയ്തു!'
    },
    {
      text: `പണ്ട് പണ്ട് ഒരു വലിയ കാട്ടിൽ ശക്തനായ ഒരു സിംഹരാജാവ് ഭരിച്ചിരുന്നു. എല്ലാ മൃഗങ്ങളും അയാളുടെ ഗർജ്ജനം കേട്ട് വിറച്ചിരുന്നു [roar].`,
      toast: '🦁 സിംഹരാജാവിന്റെ കഥ ലോഡ് ചെയ്തു! (Lion Narrator)'
    }
  ];

  btnSampleText.addEventListener('click', () => {
    const s = sampleStories[sampleStoryIndex % sampleStories.length];
    txtMalayalam.value = s.text;
    sampleStoryIndex++;
    updateCharCount();
    showToast(s.toast);
  });

  // --- SETTINGS MODAL (7-KEY MULTI-FAILOVER POOL) ---
  function openSettingsModal() {
    const pool = getSavedApiKeysPool();
    for (let i = 1; i <= 7; i++) {
      const input = document.getElementById(`inputApiKey${i}`);
      if (input) input.value = pool[i - 1] || '';
    }
    updateApiKeyBadge();
    settingsModal.style.display = 'flex';
    document.body.classList.add('modal-open');
    if (window.lucide) lucide.createIcons();
  }

  function closeSettingsModal() {
    settingsModal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }

  btnSettings.addEventListener('click', openSettingsModal);
  btnCloseModal.addEventListener('click', closeSettingsModal);

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettingsModal();
    }
  });

  // Toggle eye buttons for all 7 keys
  document.querySelectorAll('.btn-toggle-pool-key').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    });
  });

  // Live dot and count update when typing in modal
  for (let i = 1; i <= 7; i++) {
    const input = document.getElementById(`inputApiKey${i}`);
    if (input) {
      input.addEventListener('input', () => {
        const dot = document.getElementById(`dotKey${i}`);
        if (dot) {
          if (input.value.trim().length > 5) dot.classList.add('active');
          else dot.classList.remove('active');
        }
        let count = 0;
        for (let j = 1; j <= 7; j++) {
          const inp = document.getElementById(`inputApiKey${j}`);
          if (inp && inp.value.trim().length > 5) count++;
        }
        const badge = document.getElementById('keyPoolCountBadge');
        if (badge) badge.textContent = `${count} / 7 സജീവം`;
      });
    }
  }

  // Save all 7 keys
  btnSaveApiKey.addEventListener('click', () => {
    const newKeys = [];
    for (let i = 1; i <= 7; i++) {
      const input = document.getElementById(`inputApiKey${i}`);
      newKeys.push(input ? input.value.trim() : '');
    }
    const active = newKeys.filter(k => k && k.length > 5);
    if (active.length > 0) {
      saveApiKeysPool(newKeys);
      closeSettingsModal();
      showToast(`${active.length} API കീകൾ വിജയകരമായി സേവ് ചെയ്തു! (Auto-Failover Pool സജീവം) 🎉`, 'success');
    } else {
      showToast('ദയവായി സാധുവായ ഒരു API കീ എങ്കിലും നൽകുക', 'error');
    }
  });

  // Remove all keys
  btnRemoveApiKey.addEventListener('click', () => {
    localStorage.removeItem('gemini_api_keys_pool');
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('gemini_backup_api_key');
    for (let i = 1; i <= 7; i++) {
      const input = document.getElementById(`inputApiKey${i}`);
      if (input) input.value = '';
    }
    updateApiKeyBadge();
    showToast('എല്ലാ API കീകളും നീക്കം ചെയ്തു.');
  });

  // --- AVATAR SELECTION LOGIC ---
  const avatarNamesMap = {
    anjali: 'അഞ്ജലി (News Anchor - Female)',
    rahul: 'രാഹുൽ (News Anchor - Male)',
    zakia: 'സാക്കിയ (Smart & Beautiful Girl)',
    muthashan: 'മുത്തശ്ശൻ (Wise Storyteller)',
    lion: 'സിംഹം (Talking Lion Narrator)',
    kitty: 'പൂച്ചക്കുട്ടി (Cute Talking Cat)',
    custom: 'സ്വന്തം ഫോട്ടോ (Custom Upload)'
  };

  avatarCards.forEach(card => {
    card.addEventListener('click', () => {
      avatarCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentAvatar = card.getAttribute('data-avatar');
      currentAvatarBadge.textContent = avatarNamesMap[currentAvatar] || currentAvatar;

      if (currentAvatar === 'custom') {
        customAvatarDrawer.style.display = 'block';
        if (!customAvatarImg) {
          avatarFileInput.click();
        }
      } else {
        customAvatarDrawer.style.display = 'none';
      }
    });
  });

  // Custom Avatar Upload Handlers
  uploadDropzone.addEventListener('click', () => {
    avatarFileInput.click();
  });

  avatarFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        customAvatarImg = img;
        customPhotoImg.src = evt.target.result;
        uploadDropzone.style.display = 'none';
        customPhotoControls.style.display = 'flex';
        showToast('നിങ്ങളുടെ ഫോട്ടോ ലോഡ് ചെയ്തു! ഇനി ചുണ്ടിന്റെ സ്ഥാനം ക്രമീകരിക്കാം 🎯', 'success');
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });

  sliderMouthY.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    customMouthYRatio = val / 100;
    valMouthY.textContent = `${val}%`;
    mouthCrosshair.style.top = `${val}%`;
  });

  sliderMouthScale.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    customMouthScale = val;
    valMouthScale.textContent = `${val.toFixed(1)}x`;
    mouthCrosshair.style.transform = `translate(-50%, -50%) scale(${val})`;
  });

  // Studio Background Handlers
  bgChips.forEach(chip => {
    chip.addEventListener('click', () => {
      bgChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentStudioBg = chip.getAttribute('data-bg');
    });
  });

  // Ambient Soundscape Handlers (Sanchariyude Diary Kurippukal Style)
  ambientChips.forEach(chip => {
    chip.addEventListener('click', () => {
      ambientChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const amb = chip.getAttribute('data-ambient');
      currentAmbientSound = amb;

      // If voice audio is currently playing, transition ambient sound immediately
      if (!audioElement.paused && audioElement.currentTime > 0) {
        startAmbientPlayback();
      } else {
        // Quick 2-second preview so user hears the soundscape
        previewAmbientSound(amb);
      }
    });
  });

  if (sliderAmbientVol && valAmbientVol) {
    sliderAmbientVol.addEventListener('input', (e) => {
      const pct = parseInt(e.target.value, 10);
      valAmbientVol.textContent = `${pct}%`;
      ambientVolume = pct / 100;
      if (ambientGainNode) {
        ambientGainNode.gain.value = ambientVolume;
      }
    });
  }

  // --- AUDIO SYNTHESIS ENGINE (Edge + Gemini) ---
  function base64ToBlob(base64, mimeType = 'audio/wav') {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  async function requestTtsJson(payload) {
    let response;
    try {
      response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (netErr) {
      throw new Error('നെറ്റ്‌വർക്ക് തകരാർ: ' + (netErr.message || 'സെർവറിലേക്ക് കണക്റ്റ് ചെയ്യാൻ കഴിഞ്ഞില്ല.'));
    }

    const rawText = await response.text();
    let data = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (parseErr) {
      const snippet = rawText ? rawText.trim().slice(0, 150) : '';
      throw new Error(`സെർവർ പ്രതികരണ പിശക് (${response.status}): ${snippet || 'ശൂന്യമായ പ്രതികരണം ലഭിച്ചു.'}`);
    }

    return { ok: response.ok, status: response.status, data };
  }

  async function generateAudioCore(text) {
    // 1. Microsoft Edge Neural Engine (100% Free & Unlimited)
    if (currentEngine === 'edge') {
      const res = await requestTtsJson({
        engine: 'edge',
        voice: selectedVoice,
        text: text
      });

      const data = res.data;
      if (!res.ok || !data.audioBase64) {
        throw new Error(data.error || `Edge വോയ്സ് നിർമ്മിക്കാൻ കഴിഞ്ഞില്ല (${res.status}).`);
      }

      const blob = base64ToBlob(data.audioBase64, data.mimeType || 'audio/mpeg');
      currentAudioBlob = blob;
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
      currentAudioUrl = URL.createObjectURL(blob);
      audioElement.src = currentAudioUrl;
      audioElement.load();
      return data;
    }

    // 2. Google Gemini 3.8 Flash Engine with 7-Key Multi-Failover Pool
    const activeKeys = getActiveApiKeys();

    if (activeKeys.length === 0) {
      openSettingsModal();
      throw new Error('Google Gemini API Key നൽകുക, അല്ലെങ്കിൽ മുകളിൽ "⚡ Microsoft Edge Neural" തിരഞ്ഞെടുക്കുക!');
    }

    let res = null;
    let data = null;
    let successfulKeyIndex = -1;

    for (let i = 0; i < activeKeys.length; i++) {
      const keyToUse = activeKeys[i];
      console.log(`[TTS] Attempting Gemini synthesis with Key ${i + 1} of ${activeKeys.length}...`);

      res = await requestTtsJson({
        engine: 'gemini',
        text: text,
        voice: selectedVoice,
        style: selectedStyle,
        customApiKey: keyToUse
      });

      data = res.data;

      // If synthesis succeeded, break out of key loop
      if (res.ok && data.audioBase64) {
        successfulKeyIndex = i;
        break;
      }

      // If this key failed due to quota or server error and more keys are available, notify and continue!
      if (i + 1 < activeKeys.length) {
        console.warn(`Gemini Key ${i + 1} quota/error reached (${res.status})! Auto-switching to Key ${i + 2}...`);
        showToast(`കീ ${i + 1} ക്വോട്ട തീർന്നു. അടുത്ത കീ (${i + 2}/${activeKeys.length})-ലേക്ക് മാറുന്നു... 🔄`, 'warning');
      } else {
        console.warn(`All ${activeKeys.length} Gemini API keys exhausted their quotas!`);
      }
    }

    // Fallback to Edge Neural on ANY failure from Gemini (Quota, Rate limit, API error, or unexpected network glitch)
    if (!res.ok) {
      if (data.code === 'MISSING_API_KEY') {
        settingsModal.style.display = 'flex';
        throw new Error(data.error || 'Google Gemini API Key നൽകുക, അല്ലെങ്കിൽ മുകളിൽ "⚡ Microsoft Edge Neural" തിരഞ്ഞെടുക്കുക!');
      }

      const isMale = ['Puck', 'Charon', 'Fenrir'].includes(selectedVoice);
      const fallbackVoice = isMale ? 'Midhun' : 'Sobhana';

      console.warn(`Gemini error (${res.status}: ${data.error})! Falling back to Edge Neural (${fallbackVoice})...`);
      showToast(`ഗൂഗിൾ ക്വോട്ട / തകരാർ കാരണം Edge Neural (${fallbackVoice}) ഉപയോഗിച്ച് നിർമ്മിക്കുന്നു... ⚡`, 'warning');

      const fallbackRes = await requestTtsJson({
        engine: 'edge',
        voice: fallbackVoice,
        text: text
      });

      data = fallbackRes.data;
      if (!fallbackRes.ok || !data.audioBase64) {
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

    const blob = base64ToBlob(data.audioBase64, data.mimeType || 'audio/wav');
    currentAudioBlob = blob;
    if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = URL.createObjectURL(blob);
    audioElement.src = currentAudioUrl;
    audioElement.load();

    if (successfulKeyIndex >= 0) {
      data.usedKeyIndex = successfulKeyIndex + 1;
    }

    return data;
  }

  let audioDestNode = null;

  // --- REAL AUDIO AMBIENT SOUNDSCAPES (FOREST, URBAN, ROMANTIC, RAIN, STUDIO) ---
  const ambientAudioUrls = {
    forest: 'audio/forest.mp3',
    urban: 'audio/urban.mp3',
    romantic: 'audio/romantic.mp3',
    rain: 'audio/rain.wav',
    studio: 'audio/studio.wav'
  };

  const rawAmbientArrayBuffers = {};

  async function loadAmbientArrayBuffer(type) {
    if (!ambientAudioUrls[type]) return null;
    if (rawAmbientArrayBuffers[type]) return rawAmbientArrayBuffers[type];
    const candidates = [ambientAudioUrls[type], ambientAudioUrls[type].replace('audio/', 'sounds/')];
    for (const url of candidates) {
      try {
        const resp = await fetch(url);
        if (resp.ok) {
          const buf = await resp.arrayBuffer();
          rawAmbientArrayBuffers[type] = buf;
          return buf;
        }
      } catch (_) {}
    }
    return null;
  }

  // Pre-load audio tracks in background for instant playback
  ['forest', 'urban', 'romantic', 'rain', 'studio'].forEach(type => {
    loadAmbientArrayBuffer(type).catch(() => {});
  });

  // Procedural generator for rain, studio, or offline fallback
  function createProceduralAmbientAudioBuffer(type, durationSec = 14, sampleRate = 24000, targetCtx = null) {
    if (type === 'none') return null;
    const ctxToUse = targetCtx || audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const numSamples = Math.floor(durationSec * sampleRate);
    const buffer = ctxToUse.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    if (type === 'rain') {
      let lp = 0;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        lp += 0.14 * (white - lp);
        const rainBed = lp * 0.13 * (1 + 0.08 * Math.sin(t * 0.3));
        const drop = Math.random() < 0.0035 ? (Math.random() * 2 - 1) * 0.11 : 0;
        channelData[i] = rainBed + drop;
      }
    } else if (type === 'studio') {
      let lp = 0;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const white = Math.random() * 2 - 1;
        lp += 0.035 * (white - lp);
        const hum = Math.sin(2 * Math.PI * 60 * t) * 0.007;
        channelData[i] = lp * 0.065 + hum;
      }
    } else {
      let lp = 0;
      for (let i = 0; i < numSamples; i++) {
        const white = Math.random() * 2 - 1;
        lp += 0.02 * (white - lp);
        channelData[i] = lp * 0.04;
      }
    }
    return buffer;
  }

  async function getOrCreateAmbientBuffer(type, targetCtx = null) {
    if (type === 'none') return null;
    const ctx = targetCtx || audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const cacheKey = `${type}_${ctx.sampleRate}`;

    if (ambientBuffersCache[cacheKey]) {
      return ambientBuffersCache[cacheKey];
    }

    // 1. If it's one of the real MP3 tracks (Forest, Urban, Romantic), decode with ctx
    if (ambientAudioUrls[type]) {
      const raw = await loadAmbientArrayBuffer(type);
      if (raw) {
        try {
          // slice(0) ensures the source ArrayBuffer is never detached
          const decoded = await ctx.decodeAudioData(raw.slice(0));
          ambientBuffersCache[cacheKey] = decoded;
          return decoded;
        } catch (e) {
          console.warn(`decodeAudioData failed for ${type}:`, e);
        }
      }
    }

    // 2. Procedural soundscape for rain, studio, or fallback
    const proc = createProceduralAmbientAudioBuffer(type, 14, ctx.sampleRate, ctx);
    ambientBuffersCache[cacheKey] = proc;
    return proc;
  }

  // Alias for backward compatibility
  async function createAmbientAudioBuffer(type, durationSec = 14, sampleRate = 24000, targetCtx = null) {
    return await getOrCreateAmbientBuffer(type, targetCtx);
  }

  async function startAmbientPlayback() {
    if (currentAmbientSound === 'none') return;
    initAudioAnalyser();
    stopAmbientPlayback();

    const buffer = await getOrCreateAmbientBuffer(currentAmbientSound);
    if (!buffer || !audioCtx || !ambientGainNode) return;
    if (audioElement.paused && !isPlayingAll) return;

    ambientSourceNode = audioCtx.createBufferSource();
    ambientSourceNode.buffer = buffer;
    ambientSourceNode.loop = true;
    ambientSourceNode.connect(ambientGainNode);
    ambientSourceNode.start(0);
  }

  function stopAmbientPlayback() {
    if (ambientSourceNode) {
      try {
        ambientSourceNode.stop();
        ambientSourceNode.disconnect();
      } catch (_) {}
      ambientSourceNode = null;
    }
  }

  async function previewAmbientSound(type) {
    if (type === 'none') {
      stopAmbientPlayback();
      return;
    }
    initAudioAnalyser();
    stopAmbientPlayback();

    const buffer = await getOrCreateAmbientBuffer(type);
    if (!buffer || !audioCtx || !ambientGainNode) return;

    ambientSourceNode = audioCtx.createBufferSource();
    ambientSourceNode.buffer = buffer;
    ambientSourceNode.loop = true;
    ambientSourceNode.connect(ambientGainNode);
    ambientSourceNode.start(0);

    if (ambientPreviewTimer) clearTimeout(ambientPreviewTimer);
    ambientPreviewTimer = setTimeout(() => {
      // Only stop preview if the main voice is NOT actively playing
      if (audioElement.paused && !isPlayingAll) {
        stopAmbientPlayback();
      }
    }, 2800);
  }

  function audioBufferToWavBlob(audioBuffer) {
    const numChannels = 1;
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);
    const bitDepth = 16;
    const byteRate = (sampleRate * numChannels * bitDepth) / 8;
    const blockAlign = (numChannels * bitDepth) / 8;
    const dataSize = channelData.length * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    function writeString(offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < channelData.length; i++) {
      let s = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
    return new Blob([buffer], { type: 'audio/wav' });
  }

  async function getMixedAudioBlob() {
    if (!currentAudioBlob) return null;
    if (currentAmbientSound === 'none' || ambientVolume <= 0.001) {
      return currentAudioBlob;
    }

    try {
      const voiceArrayBuf = await currentAudioBlob.arrayBuffer();
      const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
      const voiceBuffer = await tempCtx.decodeAudioData(voiceArrayBuf);
      const duration = voiceBuffer.duration;
      const sampleRate = voiceBuffer.sampleRate;

      const OfflineCtxClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OfflineCtxClass) return currentAudioBlob;

      const offlineCtx = new OfflineCtxClass(1, Math.ceil(duration * sampleRate), sampleRate);

      // 1. Voice Source
      const voiceSource = offlineCtx.createBufferSource();
      voiceSource.buffer = voiceBuffer;
      voiceSource.connect(offlineCtx.destination);
      voiceSource.start(0);

      // 2. Ambient Loop Source
      const ambBuf = await getOrCreateAmbientBuffer(currentAmbientSound, offlineCtx);
      if (ambBuf) {
        const ambSource = offlineCtx.createBufferSource();
        ambSource.buffer = ambBuf;
        ambSource.loop = true;

        const ambGain = offlineCtx.createGain();
        ambGain.gain.value = ambientVolume;

        ambSource.connect(ambGain);
        ambGain.connect(offlineCtx.destination);
        ambSource.start(0);
      }

      const renderedBuffer = await offlineCtx.startRendering();
      tempCtx.close().catch(() => {});
      return audioBufferToWavBlob(renderedBuffer);
    } catch (err) {
      console.warn('Offline mix fallback to raw voice:', err);
      return currentAudioBlob;
    }
  }

  // --- WEB AUDIO API & REAL-TIME LIP-SYNC ENVELOPE ---
  function initAudioAnalyser() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (audioCtx && !audioDestNode) {
      // Dedicated recording destination stream node (prevents duplicate MediaElementSource errors)
      audioDestNode = audioCtx.createMediaStreamDestination();
    }
    if (audioCtx && !ambientGainNode) {
      ambientGainNode = audioCtx.createGain();
      ambientGainNode.gain.value = ambientVolume;
      ambientGainNode.connect(audioCtx.destination);
      if (audioDestNode) ambientGainNode.connect(audioDestNode);
    }
    if (audioCtx && !audioSourceNode) {
      try {
        audioSourceNode = audioCtx.createMediaElementSource(audioElement);
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 128;
        analyserNode.smoothingTimeConstant = 0.45;

        audioSourceNode.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);
        if (audioDestNode) analyserNode.connect(audioDestNode);
        freqDataArray = new Uint8Array(analyserNode.frequencyBinCount);
      } catch (e) {
        console.warn('AudioAnalyser initialization notice:', e);
      }
    }
  }

  function getAudioVolume(currentTime, isPlaying) {
    if (!isPlaying) return 0;
    if (analyserNode && freqDataArray) {
      analyserNode.getByteFrequencyData(freqDataArray);
      let sum = 0;
      const count = Math.min(32, freqDataArray.length);
      for (let i = 2; i < count; i++) {
        sum += freqDataArray[i];
      }
      const avg = sum / (count - 2);
      return Math.min(1.0, avg / 115);
    }
    // Fallback syllable rhythm if Web Audio node isn't ready
    const beat = Math.sin(currentTime * 16) * Math.cos(currentTime * 8);
    return Math.max(0, beat * 0.7);
  }

  // --- BUTTON: AUDIO ONLY ---
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
        showToast('ദയവായി Google Gemini API Key നൽകുക, അല്ലെങ്കിൽ അൺലിമിറ്റഡ് ഫ്രീ എൻജിൻ തിരഞ്ഞെടുക്കുക!', 'error');
        openSettingsModal();
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
      currentStoryText = text;

      videoResultSection.style.display = 'none';
      const keySuffix = data.usedKeyIndex ? ` (Key ${data.usedKeyIndex})` : '';
      const engineLabel = data.fallbackUsed 
        ? `${data.fallbackVoice || 'Sobhana'} (Edge Neural Fallback)` 
        : (currentEngine === 'edge' ? `${selectedVoice} • Edge Neural` : `${selectedVoice} • Gemini 3.8 Flash${keySuffix}`);
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
      btnAudioText.textContent = '🔊 ഓഡിയോ നിർമ്മിക്കുക (Audio Only)';
      btnAudioIcon.setAttribute('data-lucide', 'volume-2');
      btnAudioIcon.classList.remove('lucide-spin');
      if (window.lucide) lucide.createIcons();
    }
  });

  // --- BUTTON: TALKING AVATAR VIDEO ---
  btnGenerateVideo.addEventListener('click', async () => {
    const text = txtMalayalam.value.trim();
    if (!text) {
      showToast('ദയവായി മലയാളം ടെക്സ്റ്റ് നൽകുക!', 'error');
      txtMalayalam.focus();
      return;
    }

    const savedApiKey = getSavedPrimaryApiKey();
    if (currentEngine === 'gemini' && !savedApiKey) {
      showToast('ദയവായി Google Gemini API Key നൽകുക!', 'error');
      openSettingsModal();
      return;
    }

    btnGenerateAudio.disabled = true;
    btnGenerateVideo.disabled = true;
    btnVideoText.textContent = 'അവതാരക വീഡിയോ തയ്യാറാക്കുന്നു...';
    btnVideoIcon.setAttribute('data-lucide', 'loader-2');
    btnVideoIcon.classList.add('lucide-spin');
    if (window.lucide) lucide.createIcons();

    try {
      // 1. Generate Voice
      const audioData = await generateAudioCore(text);
      currentStoryText = text;

      // 2. Initialize Web Audio API for real-time lip-sync
      initAudioAnalyser();

      // 3. Show Video Section
      audioResultSection.style.display = 'none';
      const keySuffix = audioData.usedKeyIndex ? ` (Key ${audioData.usedKeyIndex})` : '';
      const voiceLabel = audioData.fallbackUsed 
        ? `${audioData.fallbackVoice || 'Sobhana'} (Edge Neural Fallback)` 
        : (currentEngine === 'edge' ? `${selectedVoice} (Edge Neural)` : `${selectedVoice}${keySuffix}`);
      const avatarName = avatarNamesMap[currentAvatar] || 'Presenter';
      videoVoiceBadge.textContent = `${avatarName} • Voice: ${voiceLabel}`;
      videoResultSection.style.display = 'block';
      videoResultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // 4. Start Canvas Animation Loop
      startAvatarAnimationLoop();
      canvasPlayOverlay.classList.remove('hidden');

      showToast('ടോക്കിംഗ് അവതാരക വീഡിയോ തയ്യാറായി! Play ചെയ്യുക 🎬', 'success');

    } catch (err) {
      console.error(err);
      showToast(err.message || 'വീഡിയോ നിർമ്മിക്കാൻ കഴിഞ്ഞില്ല.', 'error');
    } finally {
      btnGenerateAudio.disabled = false;
      btnGenerateVideo.disabled = false;
      btnVideoText.textContent = '🎬 ടോക്കിംഗ് അവതാരക വീഡിയോ (Talking Avatar Video)';
      btnVideoIcon.setAttribute('data-lucide', 'clapperboard');
      btnVideoIcon.classList.remove('lucide-spin');
      if (window.lucide) lucide.createIcons();
    }
  });

  // --- CANVAS ANIMATION LOOP & PLAYBACK ---
  function startAvatarAnimationLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    function loop() {
      renderAvatarFrame();
      animFrameId = requestAnimationFrame(loop);
    }
    loop();
  }

  function toggleVideoPlayback() {
    if (!audioElement.src) return;

    initAudioAnalyser();

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

  // Sync Video Controls with Audio Element
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

  audioElement.addEventListener('play', () => {
    startAmbientPlayback();
  });

  audioElement.addEventListener('pause', () => {
    stopAmbientPlayback();
  });

  audioElement.addEventListener('ended', () => {
    stopAmbientPlayback();
    canvasPlayOverlay.classList.remove('hidden');
    videoPlayIcon.setAttribute('data-lucide', 'play');
    playIcon.setAttribute('data-lucide', 'play');
    waveformAnim.classList.remove('playing');
    if (window.lucide) lucide.createIcons();
  });

  videoSeekSlider.addEventListener('input', (e) => {
    audioElement.currentTime = e.target.value;
  });

  // Audio-Only Player Controls
  btnPlayPause.addEventListener('click', () => {
    if (!audioElement.src) return;
    initAudioAnalyser();
    if (audioElement.paused) {
      audioElement.play();
      playIcon.setAttribute('data-lucide', 'pause');
      waveformAnim.classList.add('playing');
    } else {
      audioElement.pause();
      playIcon.setAttribute('data-lucide', 'play');
      waveformAnim.classList.remove('playing');
    }
    if (window.lucide) lucide.createIcons();
  });

  seekSlider.addEventListener('input', (e) => {
    audioElement.currentTime = e.target.value;
  });

  speedSelector.addEventListener('change', (e) => {
    audioElement.playbackRate = parseFloat(e.target.value);
  });

  btnDownload.addEventListener('click', async () => {
    if (!currentAudioBlob) return;
    try {
      showToast('ഓഡിയോ ഡൗൺലോഡ് ചെയ്യുന്നു... ⏳');
      const finalBlob = await getMixedAudioBlob();
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `malayalam_voice_${selectedVoice}_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error(err);
      showToast('ഡൗൺലോഡ് പരാജയപ്പെട്ടു.', 'error');
    }
  });

  btnDownloadAudioFromVideo.addEventListener('click', async () => {
    if (!currentAudioBlob) return;
    try {
      showToast('ഓഡിയോ ഡൗൺലോഡ് ചെയ്യുന്നു... ⏳');
      const finalBlob = await getMixedAudioBlob();
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `malayalam_audio_${selectedVoice}_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error(err);
      showToast('ഡൗൺലോഡ് പരാജയപ്പെട്ടു.', 'error');
    }
  });

  // --- AUDIO CLIPS QUEUE & MERGER (SANCHARI EPISODES & PARTS) ---
  function formatMinutesSeconds(sec) {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  async function addCurrentAudioToQueue() {
    if (!currentAudioBlob) {
      showToast('ആദ്യം ഒരു ഓഡിയോ നിർമ്മിക്കുക!', 'warning');
      return;
    }

    // Try finding title from current story text
    let title = 'ഭാഗം ' + (audioQueue.length + 1);
    const headerMatch = currentStoryText.match(/^\[?(ഭാഗം|Part)\s*\d+[^\]\n]*\]?/i);
    if (headerMatch) {
      title = headerMatch[0].replace(/^[\[\s]+|[\]\s]+$/g, '').slice(0, 50);
    } else {
      const firstSentence = currentStoryText.split(/[.!?\n]/)[0].trim();
      if (firstSentence) title = firstSentence.slice(0, 45);
    }

    // Calculate duration
    let dur = audioElement.duration || 0;
    if (!dur || isNaN(dur)) {
      try {
        const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ab = await currentAudioBlob.arrayBuffer();
        const decoded = await tempCtx.decodeAudioData(ab);
        dur = decoded.duration;
        tempCtx.close().catch(() => {});
      } catch (_) {
        dur = 30;
      }
    }

    const item = {
      id: 'clip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: title,
      blob: currentAudioBlob,
      duration: dur,
      voice: selectedVoice
    };

    audioQueue.push(item);
    renderQueueUI();
    showToast(`"${title}" ക്യൂവിലേക്ക് ചേർത്തു! (ആകെ: ${audioQueue.length} ക്ലിപ്പുകൾ) 🎵`, 'success');

    // Scroll to queue section smoothly
    if (audioQueueSection) {
      audioQueueSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function renderQueueUI() {
    if (!queueCountBadge || !queueClipsList) return;
    const totalCount = audioQueue.length;
    const totalDuration = audioQueue.reduce((acc, c) => acc + (c.duration || 0), 0);

    queueCountBadge.textContent = `${totalCount} ക്ലിപ്പുകൾ`;
    queueDurationBadge.textContent = `${formatMinutesSeconds(totalDuration)} മിനിറ്റ്`;

    if (totalCount === 0) {
      queueEmptyState.classList.remove('hidden');
      queueClipsList.classList.add('hidden');
      queueFooter.classList.add('hidden');
      queueClipsList.innerHTML = '';
      return;
    }

    queueEmptyState.classList.add('hidden');
    queueClipsList.classList.remove('hidden');
    queueFooter.classList.remove('hidden');
    queueClipsList.innerHTML = '';

    audioQueue.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'queue-clip-card';
      card.innerHTML = `
        <div class="queue-clip-left">
          <span class="clip-index-badge">${index + 1}</span>
          <button class="clip-play-btn" data-id="${item.id}" title="ഈ ക്ലിപ്പ് കേൾക്കുക">
            <i data-lucide="play" class="clip-play-icon"></i>
          </button>
          <div class="clip-info">
            <span class="clip-title" title="${item.title}">${item.title}</span>
            <span class="clip-meta">
              <span>⏱️ ${formatMinutesSeconds(item.duration)}</span>
              <span>• 🎙️ ${item.voice || selectedVoice}</span>
            </span>
          </div>
        </div>
        <button class="clip-delete-btn" data-id="${item.id}" title="ഈ ക്ലിപ്പ് മാറ്റുക">
          <i data-lucide="trash-2"></i>
        </button>
      `;

      card.querySelector('.clip-play-btn').addEventListener('click', () => {
        playSingleQueueItem(item);
      });

      card.querySelector('.clip-delete-btn').addEventListener('click', () => {
        audioQueue = audioQueue.filter(q => q.id !== item.id);
        renderQueueUI();
        showToast('ക്ലിപ്പ് നീക്കം ചെയ്തു.', 'info');
      });

      queueClipsList.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  let activeQueuePreviewAudio = null;
  function playSingleQueueItem(item) {
    if (activeQueuePreviewAudio) {
      activeQueuePreviewAudio.pause();
      activeQueuePreviewAudio = null;
      document.querySelectorAll('.clip-play-btn i').forEach(ic => ic.setAttribute('data-lucide', 'play'));
      if (window.lucide) lucide.createIcons();
    }

    const url = URL.createObjectURL(item.blob);
    const audio = new Audio(url);
    activeQueuePreviewAudio = audio;

    const btn = document.querySelector(`.clip-play-btn[data-id="${item.id}"] i`);
    if (btn) btn.setAttribute('data-lucide', 'pause');
    if (window.lucide) lucide.createIcons();

    audio.play();
    audio.onended = () => {
      if (btn) btn.setAttribute('data-lucide', 'play');
      if (window.lucide) lucide.createIcons();
      activeQueuePreviewAudio = null;
      URL.revokeObjectURL(url);
    };
  }

  let isPlayingAll = false;
  let currentAllIndex = 0;
  let playAllAudio = null;

  function stopPlayAll() {
    isPlayingAll = false;
    if (playAllAudio) {
      playAllAudio.pause();
      playAllAudio = null;
    }
    stopAmbientPlayback();
    if (iconPlayAll) iconPlayAll.setAttribute('data-lucide', 'play-circle');
    if (textPlayAll) textPlayAll.textContent = 'എല്ലാം കേൾക്കുക (Play All)';
    if (window.lucide) lucide.createIcons();
  }

  function playAllQueue() {
    if (audioQueue.length === 0) return;
    if (isPlayingAll) {
      stopPlayAll();
      return;
    }

    isPlayingAll = true;
    currentAllIndex = 0;
    if (iconPlayAll) iconPlayAll.setAttribute('data-lucide', 'pause-circle');
    if (textPlayAll) textPlayAll.textContent = 'നിർത്തുക (Pause)';
    if (window.lucide) lucide.createIcons();

    startAmbientPlayback();

    function playNext() {
      if (!isPlayingAll || currentAllIndex >= audioQueue.length) {
        stopPlayAll();
        return;
      }

      const item = audioQueue[currentAllIndex];
      const url = URL.createObjectURL(item.blob);
      playAllAudio = new Audio(url);
      playAllAudio.play();

      playAllAudio.onended = () => {
        URL.revokeObjectURL(url);
        currentAllIndex++;
        setTimeout(playNext, 600); // 0.6s pause between parts
      };
    }

    playNext();
  }

  async function handleQueueFileUpload(files) {
    if (!files || files.length === 0) return;
    showToast(`${files.length} ഫയലുകൾ പ്രോസസ്സ് ചെയ്യുന്നു... ⏳`);

    for (const file of files) {
      try {
        const ab = await file.arrayBuffer();
        const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
        const decoded = await tempCtx.decodeAudioData(ab.slice(0));
        const dur = decoded.duration;
        tempCtx.close().catch(() => {});

        audioQueue.push({
          id: 'clip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          title: file.name.replace(/\.[^/.]+$/, ''),
          blob: file,
          duration: dur,
          voice: 'Uploaded Audio'
        });
      } catch (e) {
        console.warn('Could not decode file:', file.name, e);
      }
    }

    renderQueueUI();
    showToast(`ക്ലിപ്പുകൾ ചേർത്തു! ആകെ: ${audioQueue.length} എണ്ണം 🎵`, 'success');
  }

  async function combineAndDownloadQueue() {
    if (audioQueue.length === 0) return;
    btnCombineAndDownload.disabled = true;
    btnCombineText.textContent = 'എല്ലാ ഭാഗങ്ങളും കൂട്ടിയിണക്കുന്നു... ⏳';

    try {
      showToast('എല്ലാ ഭാഗങ്ങളും കൂട്ടിയിണക്കുന്നു... ⏳');
      const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
      const decodedBuffers = [];
      let totalSpeechDuration = 0;
      const pauseBetweenClips = 0.6; // 0.6 second natural breath between episodes/parts

      for (const item of audioQueue) {
        const arrayBuf = await item.blob.arrayBuffer();
        const decoded = await tempCtx.decodeAudioData(arrayBuf);
        decodedBuffers.push(decoded);
        totalSpeechDuration += decoded.duration;
      }

      const totalDuration = totalSpeechDuration + (decodedBuffers.length - 1) * pauseBetweenClips;
      const sampleRate = decodedBuffers[0].sampleRate || 24000;
      const OfflineCtxClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const offlineCtx = new OfflineCtxClass(1, Math.ceil(totalDuration * sampleRate), sampleRate);

      // Schedule all speech buffers sequentially
      let currentTime = 0;
      for (let i = 0; i < decodedBuffers.length; i++) {
        const buf = decodedBuffers[i];
        const source = offlineCtx.createBufferSource();
        source.buffer = buf;
        source.connect(offlineCtx.destination);
        source.start(currentTime);
        currentTime += buf.duration + pauseBetweenClips;
      }

      // Layer ambient background soundscape across the entire combined duration if active!
      if (currentAmbientSound !== 'none' && ambientVolume > 0.001) {
        const ambBuf = await getOrCreateAmbientBuffer(currentAmbientSound, offlineCtx);
        if (ambBuf) {
          const ambSource = offlineCtx.createBufferSource();
          ambSource.buffer = ambBuf;
          ambSource.loop = true;
          const ambGain = offlineCtx.createGain();
          ambGain.gain.value = ambientVolume;
          ambSource.connect(ambGain);
          ambGain.connect(offlineCtx.destination);
          ambSource.start(0);
        }
      }

      const rendered = await offlineCtx.startRendering();
      tempCtx.close().catch(() => {});

      const masterBlob = audioBufferToWavBlob(rendered);
      const url = URL.createObjectURL(masterBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `malayalam_master_audio_${audioQueue.length}_parts_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 6000);

      showToast(`വിജയകരം! ${audioQueue.length} ഭാഗങ്ങൾ ചേർത്ത ഫുൾ ഓഡിയോ ഡൗൺലോഡ് ആയി 🎉`, 'success');
    } catch (err) {
      console.error('Audio merge error:', err);
      showToast('ഓഡിയോകൾ കൂട്ടിച്ചേർക്കാൻ കഴിഞ്ഞില്ല: ' + err.message, 'error');
    } finally {
      btnCombineAndDownload.disabled = false;
      btnCombineText.textContent = '📥 എല്ലാ ഭാഗങ്ങളും ഒന്നിച്ച് ഡൗൺലോഡ് ചെയ്യുക (Combine & Download Full Audio)';
    }
  }

  // Bind Queue Buttons
  if (btnAddToQueue) btnAddToQueue.addEventListener('click', addCurrentAudioToQueue);
  if (btnAddToQueueFromVideo) btnAddToQueueFromVideo.addEventListener('click', addCurrentAudioToQueue);
  if (btnCombineAndDownload) btnCombineAndDownload.addEventListener('click', combineAndDownloadQueue);
  if (btnPlayAllQueue) btnPlayAllQueue.addEventListener('click', playAllQueue);
  if (btnClearQueue) {
    btnClearQueue.addEventListener('click', () => {
      audioQueue = [];
      stopPlayAll();
      renderQueueUI();
      showToast('ലിസ്റ്റ് ക്ലിയർ ചെയ്തു.', 'info');
    });
  }
  if (queueFileInput) queueFileInput.addEventListener('change', (e) => handleQueueFileUpload(e.target.files));
  if (queueFileInputMore) queueFileInputMore.addEventListener('change', (e) => handleQueueFileUpload(e.target.files));

  // Robust MediaRecorder MIME type negotiator (Prevents Safari/iOS SyntaxError)
  function getBestSupportedVideoMimeType() {
    if (typeof MediaRecorder === 'undefined') return '';

    const candidates = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm'
    ];

    for (const type of candidates) {
      try {
        if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(type)) {
          return type;
        }
      } catch (e) {}
    }

    return '';
  }

  // --- VIDEO EXPORT (.MP4 / .WEBM) ---
  btnDownloadVideo.addEventListener('click', async () => {
    if (!audioElement.src) {
      showToast('ഡൗൺലോഡ് ചെയ്യാൻ വീഡിയോ ലഭ്യമല്ല.', 'error');
      return;
    }

    btnDownloadVideo.disabled = true;
    btnDownloadVideoText.textContent = 'വീഡിയോ എക്സ്പോർട്ട് ചെയ്യുന്നു...';

    try {
      showToast('വീഡിയോ റെക്കോർഡിംഗ് ആരംഭിച്ചു... കാത്തിരിക്കുക 🎥');

      initAudioAnalyser();

      const canvasStream = storyCanvas.captureStream ? storyCanvas.captureStream(30) : null;
      if (!canvasStream) {
        throw new Error('Canvas recording is not supported on this browser.');
      }

      // Mix audio from dedicated AudioContext stream destination (no duplicate element source conflict)
      let audioTracks = [];
      if (audioDestNode && audioDestNode.stream) {
        audioTracks = audioDestNode.stream.getAudioTracks();
      }

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioTracks
      ]);

      const mimeType = getBestSupportedVideoMimeType();
      let recorder;
      try {
        recorder = mimeType ? new MediaRecorder(combinedStream, { mimeType }) : new MediaRecorder(combinedStream);
      } catch (mimeErr) {
        console.warn('MediaRecorder with mimeType failed, falling back to browser default:', mimeErr);
        recorder = new MediaRecorder(combinedStream);
      }

      const recordedChunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const actualType = recorder.mimeType || mimeType || 'video/mp4';
        const fileExt = actualType.includes('webm') ? 'webm' : 'mp4';
        const videoBlob = new Blob(recordedChunks, { type: actualType });
        const videoUrl = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = `malayalam_talking_avatar_${selectedVoice}_${Date.now()}.${fileExt}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        btnDownloadVideo.disabled = false;
        btnDownloadVideoText.textContent = '🎬 വീഡിയോ ഡൗൺലോഡ് (.MP4 / .WebM)';
        showToast('വീഡിയോ വിജയകരമായി സേവ് ചെയ്തു! 📥', 'success');
      };

      audioElement.currentTime = 0;
      recorder.start();
      audioElement.play();

      audioElement.onended = () => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
        audioElement.onended = null;
      };
    } catch (err) {
      console.error(err);
      btnDownloadVideo.disabled = false;
      btnDownloadVideoText.textContent = '🎬 വീഡിയോ ഡൗൺലോഡ് (.MP4 / .WebM)';
      showToast('എക്സ്പോർട്ട് പരാജയപ്പെട്ടു: ' + err.message, 'error');
    }
  });

  function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // =========================================================================
  // --- CORE TALKING AVATAR & BACKGROUND RENDERER (1280 x 720 HD) ---
  // =========================================================================

  function renderAvatarFrame() {
    if (!canvasCtx) return;

    const currentTime = audioElement.currentTime || 0;
    const isPlaying = !audioElement.paused;

    // 1. Audio-Reactive Lip Sync Volume Extraction
    const volume = getAudioVolume(currentTime, isPlaying);
    if (volume > 0.04) {
      targetMouthOpen = Math.min(1.0, (volume - 0.03) * 2.3);
    } else {
      targetMouthOpen = 0.0;
    }
    // Smooth damping so mouth flaps naturally like human speech
    currentMouthOpen += (targetMouthOpen - currentMouthOpen) * 0.45;

    // 2. Eye Blinking (Natural blink every ~3.5 seconds)
    const blinkCycle = currentTime % 3.6;
    let blinkProgress = 0.0;
    if (blinkCycle < 0.16) {
      blinkProgress = Math.sin((blinkCycle / 0.16) * Math.PI);
    }

    // 3. Natural Micro-movements (Head tilt, nod, breathing)
    const headTilt = Math.sin(currentTime * 2.0) * 1.6; // gentle tilt (degrees)
    const headNod = currentMouthOpen * 4.0 + Math.sin(currentTime * 3.5) * 1.5; // nod on emphasis
    const breathingY = Math.sin(currentTime * 1.4) * 2.5;

    // 4. Draw Background Studio
    drawStudioBackground(canvasCtx, currentStudioBg, currentTime, currentStoryText);

    // 5. Draw Avatar Presenter
    drawPresenterAvatar(
      canvasCtx,
      currentAvatar,
      currentTime,
      currentMouthOpen,
      blinkProgress,
      headTilt,
      headNod,
      breathingY,
      isPlaying
    );

    // 6. Draw News Desk (if Newsroom)
    if (currentStudioBg === 'newsroom') {
      drawNewsDeskOverlay(canvasCtx, currentTime);
    }

    // 7. Draw Live Malayalam Breaking News Ticker / Subtitles
    drawNewsTickerOverlay(canvasCtx, currentStoryText, currentTime, currentStudioBg);
  }

  // --- STUDIO BACKGROUNDS ---
  function drawStudioBackground(ctx, bgType, time, storyText) {
    if (bgType === 'newsroom') {
      // 1. Deep Royal Blue Broadcast Studio Wall
      const wallGrad = ctx.createLinearGradient(0, 0, 0, 720);
      wallGrad.addColorStop(0, '#0a1128');
      wallGrad.addColorStop(0.65, '#001845');
      wallGrad.addColorStop(1, '#001233');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, 1280, 720);

      // Studio LED Accent Columns
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fillRect(80, 0, 120, 560);
      ctx.fillRect(1080, 0, 120, 560);

      // Center Digital Video Wall
      const videoWall = ctx.createLinearGradient(260, 40, 1020, 480);
      videoWall.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      videoWall.addColorStop(1, 'rgba(2, 6, 23, 0.98)');
      ctx.fillStyle = videoWall;
      ctx.fillRect(260, 40, 760, 460);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(260, 40, 760, 460);

      // Rotating Wireframe 3D World Globe
      const globeX = 640;
      const globeY = 240;
      const globeR = 120;
      const rot = time * 0.4;

      ctx.save();
      ctx.beginPath();
      ctx.arc(globeX, globeY, globeR, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(globeX - globeR, globeY - globeR, globeR * 2, globeR * 2);

      // Globe Grid Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.5;
      for (let i = -3; i <= 3; i++) {
        const offX = ((rot * 60 + i * 40) % (globeR * 2)) - globeR;
        ctx.beginPath();
        ctx.ellipse(globeX + offX, globeY, Math.abs(offX) * 0.6 + 10, globeR, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let lat = -2; lat <= 2; lat++) {
        ctx.beginPath();
        ctx.ellipse(globeX, globeY + lat * 35, globeR * Math.cos((lat * 35) / globeR), 15, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Studio Spotlight Cones
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(180, 0);
      ctx.lineTo(520, 520);
      ctx.lineTo(340, 520);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(1100, 0);
      ctx.lineTo(760, 520);
      ctx.lineTo(940, 520);
      ctx.closePath();
      ctx.fill();

    } else if (bgType === 'cozy_room') {
      // Warm Storyteller Library Room
      const wallGrad = ctx.createLinearGradient(0, 0, 1280, 720);
      wallGrad.addColorStop(0, '#2d150b');
      wallGrad.addColorStop(1, '#1a0b06');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, 1280, 720);

      // Wooden Bookshelf (Left & Right)
      ctx.fillStyle = '#451a03';
      ctx.fillRect(40, 40, 240, 580);
      ctx.fillRect(1000, 40, 240, 580);

      // Books rows
      const bookColors = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#ca8a04'];
      for (let shelf = 0; shelf < 4; shelf++) {
        const sy = 80 + shelf * 130;
        ctx.fillStyle = '#271003';
        ctx.fillRect(40, sy + 95, 240, 12);
        ctx.fillRect(1000, sy + 95, 240, 12);

        for (let b = 0; b < 7; b++) {
          ctx.fillStyle = bookColors[(shelf + b) % bookColors.length];
          ctx.fillRect(55 + b * 30, sy + 15, 24, 80);
          ctx.fillRect(1015 + b * 30, sy + 15, 24, 80);
        }
      }

      // Warm Vintage Desk Lamp Glow
      const lampGlow = ctx.createRadialGradient(280, 360, 20, 280, 360, 380);
      lampGlow.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
      lampGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lampGlow;
      ctx.fillRect(0, 0, 1280, 720);

    } else if (bgType === 'nature') {
      // Kerala Palms & Riverfront
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 420);
      skyGrad.addColorStop(0, '#fdba74');
      skyGrad.addColorStop(0.5, '#fef08a');
      skyGrad.addColorStop(1, '#bbf7d0');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1280, 420);

      // Rising Sun
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(640, 320, 70, Math.PI, 0);
      ctx.fill();

      // Tranquil Water
      const waterGrad = ctx.createLinearGradient(0, 420, 0, 720);
      waterGrad.addColorStop(0, '#0284c7');
      waterGrad.addColorStop(1, '#075985');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, 420, 1280, 300);

      // Swaying Coconut Palms (Left and Right)
      const sway = Math.sin(time * 1.5) * 8;
      ctx.strokeStyle = '#3f2e18';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(120, 440);
      ctx.quadraticCurveTo(150 + sway, 200, 180 + sway, 60);
      ctx.stroke();

      ctx.fillStyle = '#15803d';
      for (let a = 0; a < 6; a++) {
        const rad = (a * 60 * Math.PI) / 180;
        ctx.beginPath();
        ctx.ellipse(180 + sway + Math.cos(rad) * 60, 60 + Math.sin(rad) * 35, 75, 20, rad, 0, Math.PI * 2);
        ctx.fill();
      }

    } else {
      // Modern Neon / Podcast Studio
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 1280, 720);

      // Neon Rim Strips
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 25;
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 4;
      ctx.strokeRect(100, 60, 1080, 480);

      ctx.shadowColor = '#06b6d4';
      ctx.strokeStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(180, 540);
      ctx.lineTo(1100, 540);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  // --- NEWS DESK OVERLAY ---
  function drawNewsDeskOverlay(ctx, time) {
    const deskY = 510;

    // Curved Modern News Anchor Desk
    const deskGrad = ctx.createLinearGradient(0, deskY, 0, 660);
    deskGrad.addColorStop(0, '#1e293b');
    deskGrad.addColorStop(0.4, '#0f172a');
    deskGrad.addColorStop(1, '#020617');
    ctx.fillStyle = deskGrad;

    ctx.beginPath();
    ctx.moveTo(180, 720);
    ctx.lineTo(240, deskY);
    ctx.quadraticCurveTo(640, deskY - 24, 1040, deskY);
    ctx.lineTo(1100, 720);
    ctx.closePath();
    ctx.fill();

    // Sleek Cyan Edge Highlight on Desk
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(240, deskY);
    ctx.quadraticCurveTo(640, deskY - 24, 1040, deskY);
    ctx.stroke();

    // Professional Broadcast Condenser Mic on Desk
    const micX = 760;
    const micY = deskY - 30;

    // Mic Stand
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(micX, deskY + 10);
    ctx.lineTo(micX - 10, micY + 15);
    ctx.stroke();

    // Mic Capsule
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(micX - 18, micY - 25, 16, 35, 6);
    ctx.fill();
    ctx.stroke();

    // Red "ON AIR" LED Ring
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillRect(micX - 18, micY + 6, 16, 4);
    ctx.shadowBlur = 0;
  }

  // --- LIVE MALAYALAM BREAKING NEWS TICKER ---
  function drawNewsTickerOverlay(ctx, storyText, time, bgType) {
    const tickerY = 650;
    const tickerH = 70;

    // Ticker Background Bar
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, tickerY, 1280, tickerH);

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, tickerY);
    ctx.lineTo(1280, tickerY);
    ctx.stroke();

    // Red "BREAKING NEWS" / "ലൈവ് വാർത്ത" Badge
    const badgeW = 210;
    const badgeGrad = ctx.createLinearGradient(0, tickerY, badgeW, tickerY);
    badgeGrad.addColorStop(0, '#dc2626');
    badgeGrad.addColorStop(1, '#b91c1c');
    ctx.fillStyle = badgeGrad;
    ctx.fillRect(0, tickerY, badgeW, tickerH);

    // Flashing Red LIVE Dot
    const dotAlpha = 0.5 + Math.sin(time * 6) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${dotAlpha})`;
    ctx.beginPath();
    ctx.arc(32, tickerY + 35, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('ലൈവ് വാർത്ത', 50, tickerY + 42);

    // Scrolling Malayalam News Text
    const displayText = storyText.replace(/\[.*?\]/g, '').trim() || 'വാർത്തകൾ ഇവിടെ തത്സമയം സംപ്രേഷണം ചെയ്യുന്നു...';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';

    ctx.save();
    ctx.beginPath();
    ctx.rect(badgeW + 15, tickerY, 1280 - (badgeW + 15), tickerH);
    ctx.clip();

    ctx.fillStyle = '#f8fafc';
    tickerOffset += 1.8;
    const textWidth = ctx.measureText(displayText).width;
    const startX = 1280 - (tickerOffset % (textWidth + 1280));
    ctx.fillText(displayText, startX, tickerY + 43);

    ctx.restore();
  }

  // --- DISPATCHER: DRAW PRESENTER AVATAR ---
  function drawPresenterAvatar(ctx, avatarType, time, mouthOpen, blinkProgress, headTilt, headNod, breathingY, isPlaying) {
    const centerX = 640;
    const centerY = 370 + breathingY;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Apply gentle conversational head sway & nod
    ctx.rotate((headTilt * Math.PI) / 180);
    ctx.translate(0, headNod);

    if (avatarType === 'anjali') {
      drawAnjaliAvatar(ctx, 0, 0, mouthOpen, blinkProgress, isPlaying);
    } else if (avatarType === 'rahul') {
      drawRahulAvatar(ctx, 0, 0, mouthOpen, blinkProgress, isPlaying);
    } else if (avatarType === 'zakia') {
      drawZakiaAvatar(ctx, 0, 0, mouthOpen, blinkProgress, isPlaying);
    } else if (avatarType === 'muthashan') {
      drawMuthashanAvatar(ctx, 0, 0, mouthOpen, blinkProgress, isPlaying);
    } else if (avatarType === 'lion') {
      drawLionAvatar(ctx, 0, 0, mouthOpen, blinkProgress, isPlaying);
    } else if (avatarType === 'kitty') {
      drawKittyAvatar(ctx, 0, 0, mouthOpen, blinkProgress, isPlaying);
    } else if (avatarType === 'custom' && customAvatarImg) {
      drawCustomPhotoAvatar(ctx, 0, 0, mouthOpen, blinkProgress, isPlaying);
    } else {
      drawAnjaliAvatar(ctx, 0, 0, mouthOpen, blinkProgress, isPlaying);
    }

    ctx.restore();
  }

  // --- ARTICULATED MOUTH DRAWING HELPER ---
  function drawArticulatedMouth(ctx, x, y, width, height, mouthOpen, lipColor = '#b91c1c') {
    ctx.save();
    ctx.translate(x, y);

    const openAmt = Math.max(0, Math.min(1.0, mouthOpen));
    const halfW = (width * 0.5);
    const mouthH = Math.max(2, openAmt * height);

    if (openAmt > 0.04) {
      // 1. Mouth Cavity (Dark interior)
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(-halfW, 0);
      ctx.bezierCurveTo(-halfW * 0.5, -mouthH * 0.35, halfW * 0.5, -mouthH * 0.35, halfW, 0);
      ctx.bezierCurveTo(halfW * 0.6, mouthH, -halfW * 0.6, mouthH, -halfW, 0);
      ctx.closePath();
      ctx.fill();

      // 2. Upper Teeth
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      const teethW = halfW * 0.7;
      const teethH = Math.min(mouthH * 0.45, 9);
      ctx.moveTo(-teethW, -1);
      ctx.lineTo(teethW, -1);
      ctx.lineTo(teethW * 0.85, teethH);
      ctx.lineTo(-teethW * 0.85, teethH);
      ctx.closePath();
      ctx.fill();

      // 3. Tongue
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      const tongueH = mouthH * 0.45;
      ctx.ellipse(0, mouthH - tongueH * 0.4, halfW * 0.45, tongueH * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Upper Lip with Cupid's Bow
    ctx.fillStyle = lipColor;
    ctx.beginPath();
    ctx.moveTo(-halfW - 2, 0);
    ctx.bezierCurveTo(-halfW * 0.5, -5 - openAmt * 2, -2, -7 - openAmt * 2, 0, -4 - openAmt * 2);
    ctx.bezierCurveTo(2, -7 - openAmt * 2, halfW * 0.5, -5 - openAmt * 2, halfW + 2, 0);
    ctx.bezierCurveTo(halfW * 0.5, -1, -halfW * 0.5, -1, -halfW - 2, 0);
    ctx.closePath();
    ctx.fill();

    // 5. Lower Lip
    ctx.fillStyle = lipColor;
    ctx.beginPath();
    ctx.moveTo(-halfW, 0);
    ctx.bezierCurveTo(-halfW * 0.5, mouthH + 5 + openAmt * 2, halfW * 0.5, mouthH + 5 + openAmt * 2, halfW, 0);
    ctx.bezierCurveTo(halfW * 0.5, mouthH, -halfW * 0.5, mouthH, -halfW, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // --- AVATAR 1: ANJALI (FEMALE NEWS ANCHOR) ---
  function drawAnjaliAvatar(ctx, x, y, mouthOpen, blinkProgress) {
    ctx.save();
    ctx.translate(x, y);

    // Torso & Professional News Blazer
    ctx.fillStyle = '#831843'; // Deep Burgundy Blazer
    ctx.beginPath();
    ctx.moveTo(-160, 240);
    ctx.lineTo(-90, 75);
    ctx.lineTo(-40, 75);
    ctx.lineTo(-25, 140);
    ctx.lineTo(0, 160);
    ctx.lineTo(25, 140);
    ctx.lineTo(40, 75);
    ctx.lineTo(90, 75);
    ctx.lineTo(160, 240);
    ctx.closePath();
    ctx.fill();

    // White Blouse Neckline
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-25, 75);
    ctx.lineTo(0, 125);
    ctx.lineTo(25, 75);
    ctx.closePath();
    ctx.fill();

    // Gold Pearl Necklace
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 75, 26, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Neck
    ctx.fillStyle = '#fbb695';
    ctx.fillRect(-22, 35, 44, 45);

    // Long Dark Layered Hair (Back)
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(0, -20, 85, 105, 0, 0, Math.PI * 2);
    ctx.fill();

    // Face Oval
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(0, -10, 56, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden Pearl Stud Earrings
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-56, -6, 6, 0, Math.PI * 2);
    ctx.arc(56, -6, 6, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrows
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-38, -36);
    ctx.quadraticCurveTo(-22, -42, -8, -36);
    ctx.moveTo(8, -36);
    ctx.quadraticCurveTo(22, -42, 38, -36);
    ctx.stroke();

    // Eyes with Real-Time Blinking
    drawRealisticEyes(ctx, -24, 24, -22, blinkProgress, '#451a03');

    // Nose
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-2, 2);
    ctx.lineTo(4, 2);
    ctx.stroke();

    // Front Hair Bangs & Waves
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(-58, -30);
    ctx.quadraticCurveTo(-30, -78, 0, -68);
    ctx.quadraticCurveTo(30, -78, 58, -30);
    ctx.quadraticCurveTo(45, -55, 0, -52);
    ctx.quadraticCurveTo(-45, -55, -58, -30);
    ctx.fill();

    // Articulated Lip-Sync Mouth
    drawArticulatedMouth(ctx, 0, 22, 32, 22, mouthOpen, '#e11d48');

    ctx.restore();
  }

  // --- AVATAR 2: RAHUL (MALE NEWS ANCHOR) ---
  function drawRahulAvatar(ctx, x, y, mouthOpen, blinkProgress) {
    ctx.save();
    ctx.translate(x, y);

    // Torso: Dark Formal Charcoal Suit
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-170, 240);
    ctx.lineTo(-95, 80);
    ctx.lineTo(-45, 80);
    ctx.lineTo(-30, 160);
    ctx.lineTo(0, 180);
    ctx.lineTo(30, 160);
    ctx.lineTo(45, 80);
    ctx.lineTo(95, 80);
    ctx.lineTo(170, 240);
    ctx.closePath();
    ctx.fill();

    // Light Blue Shirt
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.moveTo(-30, 80);
    ctx.lineTo(0, 150);
    ctx.lineTo(30, 80);
    ctx.closePath();
    ctx.fill();

    // Maroon Red Necktie
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(-8, 85);
    ctx.lineTo(8, 85);
    ctx.lineTo(12, 175);
    ctx.lineTo(0, 190);
    ctx.lineTo(-12, 175);
    ctx.closePath();
    ctx.fill();

    // Neck
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-24, 35, 48, 50);

    // Face Oval (Strong Jawline)
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.moveTo(-52, -30);
    ctx.lineTo(-50, 15);
    ctx.lineTo(-28, 52);
    ctx.lineTo(28, 52);
    ctx.lineTo(50, 15);
    ctx.lineTo(52, -30);
    ctx.quadraticCurveTo(0, -90, -52, -30);
    ctx.closePath();
    ctx.fill();

    // Well-Groomed Hair
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-56, -20);
    ctx.quadraticCurveTo(-40, -85, 0, -82);
    ctx.quadraticCurveTo(45, -85, 56, -20);
    ctx.quadraticCurveTo(45, -60, 0, -58);
    ctx.quadraticCurveTo(-45, -60, -56, -20);
    ctx.fill();

    // Defined Eyebrows
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-40, -32);
    ctx.lineTo(-10, -35);
    ctx.moveTo(10, -35);
    ctx.lineTo(40, -32);
    ctx.stroke();

    // Eyes with Blinking
    drawRealisticEyes(ctx, -24, 24, -20, blinkProgress, '#1c1917');

    // Nose
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-3, 6);
    ctx.lineTo(4, 6);
    ctx.stroke();

    // Articulated Mouth
    drawArticulatedMouth(ctx, 0, 26, 30, 20, mouthOpen, '#b91c1c');

    ctx.restore();
  }

  // --- AVATAR 3: ZAKIA (SMART & BEAUTIFUL MALAYALAM GIRL) ---
  function drawZakiaAvatar(ctx, x, y, mouthOpen, blinkProgress) {
    ctx.save();
    ctx.translate(x, y);

    // Traditional Elegant Kerala Attire with Gold Zari
    ctx.fillStyle = '#0284c7'; // Royal Peacock Blue Kurti
    ctx.beginPath();
    ctx.moveTo(-160, 240);
    ctx.lineTo(-85, 80);
    ctx.lineTo(-35, 80);
    ctx.lineTo(0, 130);
    ctx.lineTo(35, 80);
    ctx.lineTo(85, 80);
    ctx.lineTo(160, 240);
    ctx.closePath();
    ctx.fill();

    // Kasavu Gold Border on Dress
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-35, 80);
    ctx.lineTo(0, 130);
    ctx.lineTo(35, 80);
    ctx.stroke();

    // Neck
    ctx.fillStyle = '#fbb695';
    ctx.fillRect(-20, 35, 40, 48);

    // Long Flowing Dark Hair with Side Swept Braid
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.ellipse(0, -15, 88, 108, 0, 0, Math.PI * 2);
    ctx.fill();

    // Beautiful Fragrant Jasmine Flowers (മുല്ലപ്പൂ) in Hair
    ctx.fillStyle = '#fefce8';
    for (let f = 0; f < 5; f++) {
      ctx.beginPath();
      ctx.arc(-55 + f * 10, -50 + Math.sin(f) * 6, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Face Oval
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(0, -6, 54, 68, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kerala Traditional Jimikki / Jhumka Earrings
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-54, 4, 8, 0, Math.PI * 2);
    ctx.arc(54, 4, 8, 0, Math.PI * 2);
    ctx.fill();

    // Elegant Bindi / Pottu on Forehead
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(0, -32, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Striking Almond Shaped Eyes (കാന്തമുള്ള കണ്ണുകൾ)
    drawRealisticEyes(ctx, -23, 23, -18, blinkProgress, '#451a03');

    // Nose
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(-2, 4);
    ctx.lineTo(3, 4);
    ctx.stroke();

    // Articulated Mouth with Friendly Intelligent Smile
    drawArticulatedMouth(ctx, 0, 23, 30, 20, mouthOpen, '#db2777');

    ctx.restore();
  }

  // --- AVATAR 4: MUTHASHAN (WISE ELDER STORYTELLER) ---
  function drawMuthashanAvatar(ctx, x, y, mouthOpen, blinkProgress) {
    ctx.save();
    ctx.translate(x, y);

    // Traditional White Kerala Shawl / Melmundu
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-165, 240);
    ctx.lineTo(-90, 80);
    ctx.lineTo(0, 100);
    ctx.lineTo(90, 80);
    ctx.lineTo(165, 240);
    ctx.closePath();
    ctx.fill();

    // Gold Kara (Border) on Shawl
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-165, 225);
    ctx.lineTo(165, 225);
    ctx.stroke();

    // Neck
    ctx.fillStyle = '#fcd34d';
    ctx.fillRect(-22, 35, 44, 48);

    // Silver / Grey Hair
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.ellipse(0, -20, 80, 95, 0, 0, Math.PI * 2);
    ctx.fill();

    // Face Oval with Gentle Age Contours
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(0, -8, 55, 68, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spectacles / Glasses (കണ്ണട)
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-22, -18, 14, 0, Math.PI * 2);
    ctx.arc(22, -18, 14, 0, Math.PI * 2);
    ctx.moveTo(-8, -18);
    ctx.lineTo(8, -18);
    ctx.stroke();

    // Kind Wrinkled Eyes
    drawRealisticEyes(ctx, -22, 22, -18, blinkProgress, '#451a03');

    // Kind White Moustache
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.ellipse(-14, 14, 18, 8, -0.2, 0, Math.PI * 2);
    ctx.ellipse(14, 14, 18, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Articulated Mouth
    drawArticulatedMouth(ctx, 0, 24, 28, 20, mouthOpen, '#991b1b');

    ctx.restore();
  }

  // --- AVATAR 5: LION KING (TALKING LION NARRATOR) ---
  function drawLionAvatar(ctx, x, y, mouthOpen) {
    ctx.save();
    ctx.translate(x, y);

    // Fluffy Amber / Golden Lion Mane
    ctx.fillStyle = '#b45309';
    for (let m = 0; m < 14; m++) {
      const a = (m * Math.PI * 2) / 14;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 88, Math.sin(a) * 88, 38, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lion Head Face
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 75, 75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Royal Golden Crown on Head
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-45, -70);
    ctx.lineTo(-45, -110);
    ctx.lineTo(-20, -85);
    ctx.lineTo(0, -118);
    ctx.lineTo(20, -85);
    ctx.lineTo(45, -110);
    ctx.lineTo(45, -70);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lion Ears
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(-55, -65, 18, 0, Math.PI * 2);
    ctx.arc(55, -65, 18, 0, Math.PI * 2);
    ctx.fill();

    // Lion Eyes
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-28, -18, 12, 0, Math.PI * 2);
    ctx.arc(28, -18, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-28, -18, 6, 0, Math.PI * 2);
    ctx.arc(28, -18, 6, 0, Math.PI * 2);
    ctx.fill();

    // Lion Snout & Whiskers
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, 16, 38, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(-12, 6);
    ctx.lineTo(12, 6);
    ctx.lineTo(0, 16);
    ctx.closePath();
    ctx.fill();

    // Articulated Lion Fangs Mouth
    drawArticulatedMouth(ctx, 0, 28, 42, 30, mouthOpen, '#991b1b');

    ctx.restore();
  }

  // --- AVATAR 6: KITTY (CUTE TALKING CAT) ---
  function drawKittyAvatar(ctx, x, y, mouthOpen) {
    ctx.save();
    ctx.translate(x, y);

    // Cat Face
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(0, 0, 75, 68, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pointed Ears
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(-60, -30);
    ctx.lineTo(-45, -95);
    ctx.lineTo(-10, -55);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(60, -30);
    ctx.lineTo(45, -95);
    ctx.lineTo(10, -55);
    ctx.closePath();
    ctx.fill();

    // Big Cute Anime Eyes
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(-26, -14, 14, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(26, -14, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-29, -18, 5, 0, Math.PI * 2);
    ctx.arc(23, -18, 5, 0, Math.PI * 2);
    ctx.fill();

    // Rosy Pink Cheeks
    ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
    ctx.beginPath();
    ctx.arc(-45, 8, 12, 0, Math.PI * 2);
    ctx.arc(45, 8, 12, 0, Math.PI * 2);
    ctx.fill();

    // Cute Pink Nose
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(0, 8, 5, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-35, 12); ctx.lineTo(-75, 6);
    ctx.moveTo(-35, 16); ctx.lineTo(-75, 18);
    ctx.moveTo(35, 12); ctx.lineTo(75, 6);
    ctx.moveTo(35, 16); ctx.lineTo(75, 18);
    ctx.stroke();

    // Articulated Mouth
    drawArticulatedMouth(ctx, 0, 20, 26, 18, mouthOpen, '#e11d48');

    ctx.restore();
  }

  // --- AVATAR 7: CUSTOM USER-UPLOADED PHOTO WITH LIP-SYNC ---
  function drawCustomPhotoAvatar(ctx, x, y, mouthOpen) {
    if (!customAvatarImg) return;

    ctx.save();
    ctx.translate(x, y);

    const frameW = 340;
    const frameH = 420;
    const frameX = -frameW / 2;
    const frameY = -frameH / 2;

    // Stylish Portrait Card Shadow & Border
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 4;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, 18);
    ctx.clip();

    // Draw the User's Uploaded Photo centered inside frame
    const imgRatio = customAvatarImg.width / customAvatarImg.height;
    const frameRatio = frameW / frameH;
    let sW, sH, sX, sY;

    if (imgRatio > frameRatio) {
      sH = customAvatarImg.height;
      sW = customAvatarImg.height * frameRatio;
      sX = (customAvatarImg.width - sW) / 2;
      sY = 0;
    } else {
      sW = customAvatarImg.width;
      sH = customAvatarImg.width / frameRatio;
      sX = 0;
      sY = (customAvatarImg.height - sH) / 2;
    }

    ctx.drawImage(customAvatarImg, sX, sY, sW, sH, frameX, frameY, frameW, frameH);
    ctx.restore();

    ctx.strokeRect(frameX, frameY, frameW, frameH);
    ctx.shadowBlur = 0;

    // Overlay Articulated Lip-Sync Mouth at user-calibrated mouth position
    const mouthPosX = 0;
    const mouthPosY = frameY + frameH * customMouthYRatio;
    const mouthW = 38 * customMouthScale;
    const mouthH = 26 * customMouthScale;

    drawArticulatedMouth(ctx, mouthPosX, mouthPosY, mouthW, mouthH, mouthOpen, '#b91c1c');

    ctx.restore();
  }

  // --- EYE BLINK RENDERER ---
  function drawRealisticEyes(ctx, leftX, rightX, eyeY, blinkProgress, irisColor = '#451a03') {
    const eyeR = 7;
    const blinkH = Math.max(1, eyeR * (1 - blinkProgress));

    [leftX, rightX].forEach(ex => {
      ctx.save();
      ctx.translate(ex, eyeY);

      if (blinkProgress > 0.85) {
        // Eyelid Closed Line
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 2, eyeR, 0.2, Math.PI - 0.2);
        ctx.stroke();
      } else {
        // Eye White
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, eyeR + 3, blinkH, 0, 0, Math.PI * 2);
        ctx.fill();

        // Iris
        ctx.fillStyle = irisColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, eyeR * 0.75, blinkH * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // White Sparkle Catchlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2, -2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }
});
