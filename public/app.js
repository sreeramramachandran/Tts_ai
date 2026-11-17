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

  btnSampleText.addEventListener('click', () => {
    txtMalayalam.value = `പണ്ട് പണ്ട്, പുഴയോരത്തെ ഒരു ചെറിയ ഗ്രാമത്തിൽ ഒരു വയസ്സനായ മീൻപിടുത്തക്കാരൻ താമസിച്ചിരുന്നു. എല്ലാ ദിവസവും രാവിലെ, സൂര്യൻ ഉദിക്കും മുമ്പ്, അയാൾ തന്റെ പഴയ വള്ളവുമായി പുഴയിലേക്ക് ഇറങ്ങുമായിരുന്നു [laugh]. ഒരു ദിവസം പുഴയുടെ ആഴങ്ങളിൽ നിന്ന് വലിയൊരു സ്വർണ്ണ മത്സ്യം പ്രത്യക്ഷപ്പെട്ടു! [whispers] അത് മനുഷ്യന്റെ ശബ്ദത്തിൽ സംസാരിക്കാൻ തുടങ്ങി.`;
    updateCharCount();
    showToast('സാമ്പിൾ സ്റ്റോറി ടെക്സ്റ്റ് ലോഡ് ചെയ്തു! 🎣');
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
      // 1. Generate Voice
      btnVideoText.textContent = '1/3: വോയ്സ് തയ്യാറാക്കുന്നു...';
      const audioData = await generateAudioCore(text);

      // 2. Extract Scenes
      btnVideoText.textContent = '2/3: കഥയിലെ രംഗങ്ങൾ കണ്ടെത്തുന്നു...';
      const scenesRes = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, customApiKey: savedApiKey || '' })
      });

      const scenesData = await scenesRes.json();
      currentScenes = scenesData.scenes || [];
      if (currentScenes.length === 0) {
        currentScenes = [{
          prompt: '2D anime storybook art, scenic Kerala river and forest at sunrise, 16:9',
          subtitle: text
        }];
      }

      // 3. Load 2D Images
      btnVideoText.textContent = '3/3: 2D രംഗങ്ങൾ തയ്യാറാക്കുന്നു...';
      loadedSceneImages = [];
      thumbnailsGrid.innerHTML = '';

      // Immediately start 2D Cartoon Animator loop
      audioResultSection.style.display = 'none';
      const voiceLabel = audioData.fallbackUsed 
        ? `${audioData.fallbackVoice || 'Sobhana'} (Edge Neural Fallback)` 
        : (currentEngine === 'edge' ? `${selectedVoice} (Edge Neural)` : selectedVoice);
      videoVoiceBadge.textContent = `Voice: ${voiceLabel} • 2D Animation (${currentScenes.length} രംഗങ്ങൾ)`;
      videoResultSection.style.display = 'block';
      videoResultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      startCanvasAnimationLoop();
      canvasPlayOverlay.classList.remove('hidden');

      // Populate Scene Thumbnails in background
      for (let i = 0; i < currentScenes.length; i++) {
        const scene = currentScenes[i];
        const imgUrl = `/api/image-proxy?prompt=${encodeURIComponent(scene.prompt)}&subtitle=${encodeURIComponent(scene.subtitle)}&v=${Date.now() + i}`;
        
        loadImagePromise(imgUrl).then(img => {
          loadedSceneImages.push(img);
        }).catch(() => {});

        const thumbCard = document.createElement('div');
        thumbCard.className = 'thumbnail-card';
        thumbCard.innerHTML = `
          <img src="${imgUrl}" alt="Scene ${i+1}">
          <div class="thumbnail-caption">രംഗം ${i+1}: ${scene.subtitle.substring(0, 45)}...</div>
        `;
        thumbnailsGrid.appendChild(thumbCard);
      }

      showToast('2D കാർട്ടൂൺ സ്റ്റോറി വീഡിയോ തയ്യാറായി! Play ചെയ്യുക 🎬', 'success');

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
    if (/പുഴ|തോണി|മീൻ|വള്ളം|കടൽ|തീരം|വെള്ളം|river|boat|canoe|fisherman|water|sea|lake|ocean|stream|shore|fishing/.test(lower)) {
      return 'river';
    }
    if (/കാട്|മരം|തോട്ടം|പച്ചപ്പ്|പ്രകൃതി|മൃഗം|forest|tree|wood|jungle|nature|green|animal|wild/.test(lower)) {
      return 'forest';
    }
    if (/രാത്രി|ചന്ദ്രൻ|നക്ഷത്രം|ഇരുട്ട്|രഹസ്യം|തീ|night|moon|star|dark|midnight|shadow|campfire|fire/.test(lower)) {
      return 'night';
    }
    return 'savannah_hut';
  }

  // --- PREHISTORIC MALLU 2D DOODLE CHARACTER ANIMATOR ---
  function drawDoodleCharacter(ctx, x, y, scale = 1, time = 0, isWalking = true, isTalking = false, isLaughing = false, prop = 'bow') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

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

    // 3. Brown Loincloth
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

    // 5. Crossbody Leather Pouch Sling
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

    // 6. Beaded Necklace
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(neckX + i * 6, neckY + 8 + Math.abs(i) * 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 7. Head (White Circle with bold black outline)
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

    // 8. Afro / Curly Black Hair (Exact Match to Prehistoric Mallu)
    ctx.fillStyle = '#111827';
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
    for (let [cx, cy, cr] of curls) {
      ctx.beginPath();
      ctx.arc(headX + cx, headY + cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 9. Eyes (With Blinking and Laugh Squint)
    const isBlink = Math.floor(time * 3) % 11 === 0;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3.5;

    if (isLaughing) {
      // Squeezed laughing happy eyes ^ ^
      ctx.beginPath();
      ctx.arc(headX - 1, headY - 5, 5, Math.PI * 0.9, 0.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(headX + 16, headY - 4, 5, Math.PI * 0.9, 0.1);
      ctx.stroke();
    } else if (isBlink) {
      // Blinking closed eye slit
      ctx.beginPath();
      ctx.moveTo(headX - 6, headY - 3);
      ctx.lineTo(headX + 4, headY - 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(headX + 11, headY - 2);
      ctx.lineTo(headX + 21, headY - 2);
      ctx.stroke();
    } else {
      // Cute black dots
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(headX - 1, headY - 3, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(headX + 16, headY - 2, 3.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 10. Expressive Mouth
    if (isLaughing) {
      // Big laughing open mouth with red interior and teeth
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(headX + 6, headY + 12, 11, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // White upper teeth
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(headX, headY + 12, 13, 3.5);
    } else if (isTalking) {
      // Animated speech mouth
      const talkCycle = 3 + Math.abs(Math.sin(time * 16)) * 7;
      ctx.fillStyle = '#7f1d1d';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(headX + 6, headY + 13, 6, talkCycle, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Gentle smile line
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(headX + 6, headY + 9, 8, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // 11. Back Arm
    const backArmAngle = isWalking ? Math.sin(walkPhase) * 0.5 : -0.2;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(neckX - 8, neckY + 10);
    ctx.lineTo(neckX - 28 + Math.sin(backArmAngle) * 20, neckY + 38);
    ctx.lineTo(neckX - 32, neckY + 65);
    ctx.stroke();

    // 12. Front Arm & Handheld Prop
    if (prop === 'paddle') {
      ctx.beginPath();
      ctx.moveTo(neckX + 8, neckY + 10);
      ctx.lineTo(neckX + 30, neckY + 40);
      ctx.lineTo(neckX + 45, neckY + 55);
      ctx.stroke();
      // Wooden Paddle
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
    } else if (prop === 'fishing_rod') {
      ctx.beginPath();
      ctx.moveTo(neckX + 8, neckY + 10);
      ctx.lineTo(neckX + 28, neckY + 35);
      ctx.lineTo(neckX + 42, neckY + 42);
      ctx.stroke();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(neckX + 35, neckY + 45);
      ctx.lineTo(neckX + 95, neckY - 20);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(neckX + 95, neckY - 20);
      ctx.lineTo(neckX + 110, neckY + 90);
      ctx.stroke();
    } else {
      // Default: Hunting Bow (Exact Match to Screenshot!)
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

    ctx.restore();
  }

  // --- SCENE 1: SAVANNAH THATCRED HUT (EXACT MATCH TO USER SCREENSHOT) ---
  function drawSavannahHutScene(ctx, time, sceneProgress, isTalking, isLaughing) {
    // Sky Gradient: Muted slate/cyan at top to warm yellow-peach at horizon
    const sky = ctx.createLinearGradient(0, 0, 0, 420);
    sky.addColorStop(0, '#94a3b8');
    sky.addColorStop(0.35, '#cbd5e1');
    sky.addColorStop(0.7, '#fed7aa');
    sky.addColorStop(1, '#fef08a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1280, 720);

    // Morning Stars
    ctx.fillStyle = '#ffffff';
    const stars = [[680, 70, 1.5], [850, 110, 1.5], [1020, 55, 2], [1180, 95, 1.5]];
    for (let [sx, sy, sr] of stars) {
      ctx.globalAlpha = 0.5 + Math.sin(time * 3 + sx) * 0.3;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Semicircular Golden Sun on Horizon
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

    // Horizon line & Savannah Sand
    ctx.fillStyle = '#e7c689';
    ctx.fillRect(0, 420, 1280, 300);

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.lineTo(1280, 420);
    ctx.stroke();

    // Savannah Acacia Tree (Far Right)
    ctx.save();
    ctx.translate(1160, 420);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.quadraticCurveTo(-5, -60, -2, -90);
    ctx.lineTo(-25, -130);
    ctx.moveTo(-2, -90);
    ctx.quadraticCurveTo(5, -115, 25, -135);
    ctx.moveTo(-2, -90);
    ctx.lineTo(0, -140);
    ctx.stroke();

    ctx.fillStyle = '#6b9080';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(-25, -135, 42, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(25, -140, 38, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#84a98c';
    ctx.beginPath();
    ctx.ellipse(0, -146, 50, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Green Cartoon Bushes
    ctx.fillStyle = '#84a98c';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.moveTo(600, 420);
    ctx.quadraticCurveTo(590, 385, 620, 380);
    ctx.quadraticCurveTo(640, 360, 670, 380);
    ctx.quadraticCurveTo(700, 385, 695, 420);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(780, 420);
    ctx.quadraticCurveTo(795, 400, 815, 400);
    ctx.quadraticCurveTo(835, 395, 850, 420);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(1060, 420);
    ctx.quadraticCurveTo(1050, 390, 1080, 385);
    ctx.quadraticCurveTo(1105, 365, 1130, 385);
    ctx.quadraticCurveTo(1155, 390, 1150, 420);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Grass Tufts
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(740, 450); ctx.lineTo(736, 440);
    ctx.moveTo(740, 450); ctx.lineTo(744, 442);
    ctx.moveTo(920, 470); ctx.lineTo(916, 460);
    ctx.moveTo(920, 470); ctx.lineTo(925, 462);
    ctx.moveTo(560, 480); ctx.lineTo(585, 480);
    ctx.moveTo(840, 510); ctx.lineTo(870, 510);
    ctx.stroke();

    // Thatched Mud Hut (Left)
    const wallGrad = ctx.createLinearGradient(0, 350, 360, 640);
    wallGrad.addColorStop(0, '#b07d4b');
    wallGrad.addColorStop(0.4, '#d4a36e');
    wallGrad.addColorStop(1, '#a06e3d');
    ctx.fillStyle = wallGrad;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-20, 640);
    ctx.lineTo(0, 360);
    ctx.quadraticCurveTo(180, 330, 360, 360);
    ctx.lineTo(330, 640);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mud scratch lines
    ctx.strokeStyle = '#8c5e34';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 390); ctx.lineTo(65, 510);
    ctx.moveTo(100, 430); ctx.lineTo(103, 550);
    ctx.moveTo(300, 420); ctx.lineTo(296, 530);
    ctx.stroke();

    // Dark Doorway
    ctx.fillStyle = '#2d1c10';
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(140, 640);
    ctx.lineTo(140, 380);
    ctx.quadraticCurveTo(200, 360, 260, 380);
    ctx.lineTo(260, 640);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Doorway Posts
    ctx.strokeStyle = '#6e4222';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(140, 370); ctx.lineTo(140, 640);
    ctx.moveTo(260, 370); ctx.lineTo(260, 640);
    ctx.stroke();

    // Thatched Conical Straw Roof
    const roofGrad = ctx.createLinearGradient(0, 70, 0, 370);
    roofGrad.addColorStop(0, '#e8bf7a');
    roofGrad.addColorStop(0.6, '#d4a359');
    roofGrad.addColorStop(1, '#b58238');
    ctx.fillStyle = roofGrad;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-40, 370);
    ctx.quadraticCurveTo(170, 50, 390, 370);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Shaggy Overhang Straw Fringe
    ctx.beginPath();
    for (let rx = -40; rx < 380; rx += 20) {
      ctx.quadraticCurveTo(rx + 10, 385, rx + 20, 370);
    }
    ctx.stroke();

    // Thatch hatching
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(50, 190); ctx.lineTo(40, 230);
    ctx.moveTo(90, 140); ctx.lineTo(75, 195);
    ctx.moveTo(150, 120); ctx.lineTo(140, 200);
    ctx.moveTo(210, 130); ctx.lineTo(225, 205);
    ctx.moveTo(270, 160); ctx.lineTo(290, 235);
    ctx.moveTo(110, 250); ctx.lineTo(95, 310);
    ctx.moveTo(210, 240); ctx.lineTo(220, 305);
    ctx.stroke();

    // Character walks out from hut doorway
    const charX = 240 + sceneProgress * 360;
    const charY = 560;
    drawDoodleCharacter(ctx, charX, charY, 1.15, time, true, isTalking, isLaughing, 'bow');
  }

  // --- SCENE 2: KERALA RIVER & CANOE (VALLAM) SCENE ---
  function drawRiverBoatScene(ctx, time, sceneProgress, isTalking, isLaughing) {
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

    ctx.fillStyle = 'rgba(51, 65, 85, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, 395);
    ctx.quadraticCurveTo(320, 335, 680, 395);
    ctx.quadraticCurveTo(980, 345, 1280, 370);
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
    const boatX = 640 + sceneProgress * 80;
    const boatY = 520 + Math.sin(time * 2.5) * 7;
    const boatTilt = Math.cos(time * 2.5) * 0.035;

    ctx.save();
    ctx.translate(boatX, boatY);
    ctx.rotate(boatTilt);

    ctx.fillStyle = 'rgba(7, 89, 133, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 25, 110, 8, 0, 0, Math.PI * 2);
    ctx.fill();

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

    // Character in Canoe
    drawDoodleCharacter(ctx, 0, 12, 1.0, time, false, isTalking, isLaughing, 'paddle');
    ctx.restore();

    // Jumping Golden Fish (The big fish from the story!)
    const fishCycle = (time % 3.5) / 3.5;
    if (fishCycle < 0.6) {
      const p = fishCycle / 0.6;
      const fx = 820 + p * 160;
      const fy = 500 - Math.sin(p * Math.PI) * 110;
      const fAngle = (p - 0.5) * 1.6;

      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(fAngle);

      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(-34, -10);
      ctx.lineTo(-30, 0);
      ctx.lineTo(-34, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(14, -3, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(15, -3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (p < 0.15 || p > 0.85) {
        ctx.fillStyle = '#bae6fd';
        for (let sp = 0; sp < 4; sp++) {
          ctx.beginPath();
          ctx.arc(fx + (sp - 2) * 8, 500 - sp * 3, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // --- SCENE 3: FOREST SCENE ---
  function drawForestScene(ctx, time, sceneProgress, isTalking, isLaughing) {
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
    drawDoodleCharacter(ctx, charX, charY, 1.15, time, true, isTalking, isLaughing, 'bow');
  }

  // --- SCENE 4: NIGHT CAMPFIRE SCENE ---
  function drawNightScene(ctx, time, sceneProgress, isTalking, isLaughing) {
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

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(fireX - 10, fireY);
    ctx.quadraticCurveTo(fireX, fireY - 25 - flicker, fireX + 10, fireY);
    ctx.closePath();
    ctx.fill();

    drawDoodleCharacter(ctx, fireX - 120, 540, 1.15, time, false, isTalking, isLaughing, 'bow');
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
    const isTalking = isPlaying;

    const theme = detectSceneTheme(scene.prompt, subtitle);

    canvasCtx.clearRect(0, 0, 1280, 720);

    if (theme === 'river') {
      drawRiverBoatScene(canvasCtx, currentTime, sceneProgress, isTalking, isLaughing);
    } else if (theme === 'forest') {
      drawForestScene(canvasCtx, currentTime, sceneProgress, isTalking, isLaughing);
    } else if (theme === 'night') {
      drawNightScene(canvasCtx, currentTime, sceneProgress, isTalking, isLaughing);
    } else {
      drawSavannahHutScene(canvasCtx, currentTime, sceneProgress, isTalking, isLaughing);
    }

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
