// Malayalam AI TTS & 2D Story Animation Web App

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  // State
  let selectedVoice = 'Puck';
  let selectedStyle = 'conversational';
  let currentAudioBlob = null;
  let currentAudioUrl = null;
  let currentScenes = [];
  let loadedSceneImages = [];
  let isVideoMode = false;
  let animFrameId = null;

  // DOM Elements
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
  const btnToggleKey = document.getElementById('btnToggleKey');
  const btnSaveApiKey = document.getElementById('btnSaveApiKey');
  const btnRemoveApiKey = document.getElementById('btnRemoveApiKey');
  const apiKeyStatusBadge = document.getElementById('apiKeyStatusBadge');
  const toast = document.getElementById('toast');

  // Particle System for 2D Canvas Atmosphere
  const particles = [];
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * 1280,
      y: Math.random() * 720,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: Math.random() * 0.6 + 0.2,
      opacity: Math.random() * 0.6 + 0.2
    });
  }

  // Load Saved API Key
  function getSavedApiKey() {
    return localStorage.getItem('gemini_api_key') || '';
  }

  function updateApiKeyBadge() {
    const key = getSavedApiKey();
    if (key && key.trim().length > 5) {
      apiKeyStatusBadge.textContent = 'Key Active ✓';
      apiKeyStatusBadge.classList.add('active');
    } else {
      apiKeyStatusBadge.textContent = 'Add Key';
      apiKeyStatusBadge.classList.remove('active');
    }
  }

  updateApiKeyBadge();

  // Voice Selection Handler
  voiceCards.forEach(card => {
    card.addEventListener('click', () => {
      voiceCards.forEach(c => c.classList.remove('active'));
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

  // Character Counter
  function updateCharCount() {
    const len = txtMalayalam.value.trim().length;
    charCount.textContent = `${len} അക്ഷരങ്ങൾ`;
  }

  txtMalayalam.addEventListener('input', updateCharCount);

  // Clear Text
  btnClearText.addEventListener('click', () => {
    txtMalayalam.value = '';
    updateCharCount();
    txtMalayalam.focus();
  });

  // Sample Malayalam Text
  btnSampleText.addEventListener('click', () => {
    txtMalayalam.value = `പണ്ട് പണ്ട്, പുഴയോരത്തെ ഒരു ചെറിയ ഗ്രാമത്തിൽ ഒരു വയസ്സനായ മീൻപിടുത്തക്കാരൻ താമസിച്ചിരുന്നു. എല്ലാ ദിവസവും രാവിലെ, സൂര്യൻ ഉദിക്കും മുമ്പ്, അയാൾ തന്റെ പഴയ വള്ളവുമായി പുഴയിലേക്ക് ഇറങ്ങുമായിരുന്നു [laugh]. ഒരു ദിവസം പുഴയുടെ ആഴങ്ങളിൽ നിന്ന് വലിയൊരു സ്വർണ്ണ മത്സ്യം പ്രത്യക്ഷപ്പെട്ടു! [whispers] അത് മനുഷ്യന്റെ ശബ്ദത്തിൽ രഹസ്യങ്ങൾ സംസാരിക്കാൻ തുടങ്ങി.`;
    updateCharCount();
    showToast('സാമ്പിൾ സ്റ്റോറി ടെക്സ്റ്റ് ലോഡ് ചെയ്തു! 🎣');
  });

  // Settings Modal Handlers
  btnSettings.addEventListener('click', () => {
    inputApiKey.value = getSavedApiKey();
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
    if (key) {
      localStorage.setItem('gemini_api_key', key);
      updateApiKeyBadge();
      settingsModal.style.display = 'none';
      showToast('API കീ വിജയകരമായി സേവ് ചെയ്തു! ✓', 'success');
    } else {
      showToast('ദയവായി സാധുവായ ഒരു API കീ നൽകുക', 'error');
    }
  });

  btnRemoveApiKey.addEventListener('click', () => {
    localStorage.removeItem('gemini_api_key');
    inputApiKey.value = '';
    updateApiKeyBadge();
    showToast('API കീ നീക്കം ചെയ്തു.');
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

  // --- AUDIO GENERATION CORE ---
  async function generateAudioCore(text, savedApiKey) {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        voice: selectedVoice,
        style: selectedStyle,
        customApiKey: savedApiKey
      })
    });

    const data = await response.json();
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

  // --- MODE 1: AUDIO-ONLY GENERATE BUTTON ---
  btnGenerateAudio.addEventListener('click', async () => {
    const text = txtMalayalam.value.trim();
    if (!text) {
      showToast('ദയവായി ശബ്ദമാക്കാനുള്ള മലയാളം ടെക്സ്റ്റ് നൽകുക!', 'error');
      txtMalayalam.focus();
      return;
    }

    const savedApiKey = getSavedApiKey();
    if (!savedApiKey) {
      showToast('ദയവായി ആദ്യം നിങ്ങളുടെ സൗജന്യ Google Gemini API Key നൽകുക!', 'error');
      settingsModal.style.display = 'flex';
      return;
    }

    btnGenerateAudio.disabled = true;
    btnGenerateVideo.disabled = true;
    btnAudioText.textContent = 'വോയ്സ് നിർമ്മിക്കുന്നു...';
    btnAudioIcon.setAttribute('data-lucide', 'loader-2');
    btnAudioIcon.classList.add('lucide-spin');
    if (window.lucide) lucide.createIcons();

    try {
      const data = await generateAudioCore(text, savedApiKey);
      
      // Show Audio Only section
      videoResultSection.style.display = 'none';
      resultVoiceBadge.textContent = `Voice: ${selectedVoice} • ${data.modelUsed || 'Gemini 3.8'}`;
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
      btnAudioText.textContent = '🔊 ഓഡിയോ മാത്രം (Audio Only)';
      btnAudioIcon.setAttribute('data-lucide', 'volume-2');
      btnAudioIcon.classList.remove('lucide-spin');
      if (window.lucide) lucide.createIcons();
    }
  });

  // --- MODE 2: 2D STORY VIDEO GENERATE BUTTON ---
  btnGenerateVideo.addEventListener('click', async () => {
    const text = txtMalayalam.value.trim();
    if (!text) {
      showToast('ദയവായി സ്റ്റോറി ടെക്സ്റ്റ് നൽകുക!', 'error');
      txtMalayalam.focus();
      return;
    }

    const savedApiKey = getSavedApiKey();
    if (!savedApiKey) {
      showToast('ദയവായി ആദ്യം നിങ്ങളുടെ സൗജന്യ Google Gemini API Key നൽകുക!', 'error');
      settingsModal.style.display = 'flex';
      return;
    }

    btnGenerateAudio.disabled = true;
    btnGenerateVideo.disabled = true;
    btnVideoText.textContent = '2D രംഗങ്ങൾ നിർമ്മിക്കുന്നു... (Creating scenes...)';
    btnVideoIcon.setAttribute('data-lucide', 'loader-2');
    btnVideoIcon.classList.add('lucide-spin');
    if (window.lucide) lucide.createIcons();

    try {
      // Step 1: Generate Audio
      btnVideoText.textContent = '1/3: വോയ്സ് തയ്യാറാക്കുന്നു...';
      const audioData = await generateAudioCore(text, savedApiKey);

      // Step 2: Extract 2D Story Scenes
      btnVideoText.textContent = '2/3: കഥയിലെ രംഗങ്ങൾ കണ്ടെത്തുന്നു...';
      const scenesRes = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, customApiKey: savedApiKey })
      });

      const scenesData = await scenesRes.json();
      if (!scenesRes.ok || !scenesData.scenes || scenesData.scenes.length === 0) {
        throw new Error(scenesData.error || 'രംഗങ്ങൾ വേർതിരിക്കാൻ കഴിഞ്ഞില്ല.');
      }

      currentScenes = scenesData.scenes;
      console.log('Scenes generated:', currentScenes);

      // Step 3: Load 2D Images
      btnVideoText.textContent = '3/3: 2D ചിത്രങ്ങൾ വരയ്ക്കുന്നു...';
      loadedSceneImages = [];
      thumbnailsGrid.innerHTML = '';

      for (let i = 0; i < currentScenes.length; i++) {
        const scene = currentScenes[i];
        const imgUrl = `/api/image-proxy?prompt=${encodeURIComponent(scene.prompt)}&seed=${Date.now() + i}`;
        
        const img = await loadImagePromise(imgUrl);
        loadedSceneImages.push(img);

        // Add Thumbnail to UI
        const thumbCard = document.createElement('div');
        thumbCard.className = 'thumbnail-card';
        thumbCard.innerHTML = `
          <img src="${imgUrl}" alt="Scene ${i+1}">
          <div class="thumbnail-caption">രംഗം ${i+1}: ${scene.subtitle.substring(0, 50)}...</div>
        `;
        thumbnailsGrid.appendChild(thumbCard);
      }

      // Hide audio-only, display Video Section
      audioResultSection.style.display = 'none';
      videoVoiceBadge.textContent = `Voice: ${selectedVoice} • 2D Story Animation (${currentScenes.length} രംഗങ്ങൾ)`;
      videoResultSection.style.display = 'block';
      videoResultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Start Canvas Video Loop
      isVideoMode = true;
      startCanvasAnimationLoop();
      canvasPlayOverlay.classList.remove('hidden');

      showToast('2D സ്റ്റോറി വീഡിയോ തയ്യാറായി! Play ക്ലിക്ക് ചെയ്യുക 🎬', 'success');

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
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback: resolve placeholder if network fails
        console.warn('Image load error for:', src);
        resolve(img);
      };
      img.src = src;
    });
  }

  // --- 2D CANVAS MOTION & VIDEO ENGINE ---
  function renderCanvasFrame() {
    if (!loadedSceneImages || loadedSceneImages.length === 0) return;

    const duration = audioElement.duration || 10;
    const currentTime = audioElement.currentTime || 0;
    const progress = Math.min(1, Math.max(0, currentTime / duration));

    // Determine current scene index
    const sceneDuration = duration / loadedSceneImages.length;
    let sceneIndex = Math.floor(currentTime / sceneDuration);
    if (sceneIndex >= loadedSceneImages.length) {
      sceneIndex = loadedSceneImages.length - 1;
    }

    const currentImg = loadedSceneImages[sceneIndex];
    const sceneProgress = (currentTime % sceneDuration) / sceneDuration;

    // Clear Canvas
    canvasCtx.fillStyle = '#000';
    canvasCtx.fillRect(0, 0, 1280, 720);

    // Draw Image with Ken Burns Pan & Zoom Motion Effect
    if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
      const zoom = 1.0 + sceneProgress * 0.08; // Subtle 8% zoom
      const panX = (sceneIndex % 2 === 0 ? -1 : 1) * (sceneProgress * 30);
      const panY = sceneProgress * 15;

      const drawW = 1280 * zoom;
      const drawH = 720 * zoom;
      const drawX = (1280 - drawW) / 2 + panX;
      const drawY = (720 - drawH) / 2 + panY;

      canvasCtx.drawImage(currentImg, drawX, drawY, drawW, drawH);
    } else {
      // Atmospheric fallback gradient
      const grad = canvasCtx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
      canvasCtx.fillStyle = grad;
      canvasCtx.fillRect(0, 0, 1280, 720);
    }

    // Render Floating Atmospheric Particles (Leaves / Mist / Sparks)
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

    // Update Subtitles
    if (currentScenes[sceneIndex]) {
      videoSubtitleText.textContent = currentScenes[sceneIndex].subtitle;
      videoSubtitleOverlay.style.display = 'block';
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

  // Video Play / Pause Controls
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

  // Synchronize Timeline with Video Seek Slider
  audioElement.addEventListener('timeupdate', () => {
    videoSeekSlider.value = Math.floor(audioElement.currentTime);
    videoCurrentTimeDisplay.textContent = formatTime(audioElement.currentTime);

    // Audio-only slider
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

  // --- VIDEO EXPORT (.MP4 / .WEBM) ---
  btnDownloadVideo.addEventListener('click', async () => {
    if (!loadedSceneImages || loadedSceneImages.length === 0 || !audioElement.src) {
      showToast('ഡൗൺലോഡ് ചെയ്യാൻ വീഡിയോ ലഭ്യമല്ല.', 'error');
      return;
    }

    btnDownloadVideo.disabled = true;
    btnDownloadVideoText.textContent = 'വീഡിയോ എക്‌സ്‌പോർട്ട് ചെയ്യുന്നു...';

    try {
      showToast('വീഡിയോ റെക്കോർഡിംഗ് ആരംഭിച്ചു... ദയവായി കാത്തിരിക്കുക 🎥');

      // Setup Canvas Capture Stream (30 FPS)
      const canvasStream = storyCanvas.captureStream(30);

      // Setup Web Audio Stream Destination for flawless audio sync
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioSrc = audioCtx.createMediaElementSource(audioElement);
      const audioDest = audioCtx.createMediaStreamDestination();
      audioSrc.connect(audioDest);
      audioSrc.connect(audioCtx.destination);

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks()
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

      // Restart and play from beginning to record entire video
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

  // Download Audio From Video Section
  btnDownloadAudioFromVideo.addEventListener('click', () => {
    downloadCurrentAudioWav();
  });

  // --- AUDIO-ONLY PLAYER CONTROLS (v1.0) ---
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
    downloadCurrentAudioWav();
  });

  function downloadCurrentAudioWav() {
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
