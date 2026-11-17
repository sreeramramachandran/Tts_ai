// Malayalam AI TTS - Client Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // State
  let selectedVoice = 'Puck';
  let selectedStyle = 'conversational';
  let currentAudioBlob = null;
  let currentAudioUrl = null;

  // DOM Elements
  const voiceCards = document.querySelectorAll('.voice-card');
  const styleChips = document.querySelectorAll('.style-chip');
  const tagButtons = document.querySelectorAll('.tag-insert-btn');
  const txtMalayalam = document.getElementById('txtMalayalam');
  const charCount = document.getElementById('charCount');
  const btnSampleText = document.getElementById('btnSampleText');
  const btnClearText = document.getElementById('btnClearText');
  
  const btnGenerate = document.getElementById('btnGenerate');
  const btnGenerateText = document.getElementById('btnGenerateText');
  const btnGenerateIcon = document.getElementById('btnGenerateIcon');

  const resultSection = document.getElementById('resultSection');
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

  // Sample Malayalam Text Loader (with emotion tags & laughter)
  btnSampleText.addEventListener('click', () => {
    txtMalayalam.value = `പ്രാചീന എൽഡോണിയ എന്ന ഭൂമിയിൽ, ആകാശങ്ങൾ തിളങ്ങുകയും കാടുകൾ കാറ്റിനോട് രഹസ്യങ്ങൾ പറയുകയും ചെയ്തിടത്ത്, സെഫിറോസ് എന്ന ഒരു ഡ്രാഗൺ ജീവിച്ചിരുന്നു. [sarcastically] എല്ലാം കത്തിച്ച് നശിപ്പിക്കുന്ന തരത്തിലുള്ളവനല്ല കേട്ടോ... [giggles] പക്ഷേ അവൻ സ്നേഹപൂർവ്വവും അതിബുദ്ധിമാനുമായിരുന്നു! [laugh] അവൻ കൂട്ടുകാരോട് തമാശകൾ പറഞ്ഞ് പൊട്ടിച്ചിരിക്കുമായിരുന്നു. [whispers] അവൻ കടന്നുപോകുമ്പോൾ പക്ഷികളും മൗനമാകുകയായിരുന്നു.`;
    updateCharCount();
    showToast('സാമ്പിൾ ടെക്സ്റ്റ് ലോഡ് ചെയ്തു! [laugh] ടാഗ് ശ്രദ്ധിക്കൂ.');
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
    if (inputApiKey.type === 'password') {
      inputApiKey.type = 'text';
    } else {
      inputApiKey.type = 'password';
    }
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

  // Toast Notification
  function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.style.display = 'block';

    setTimeout(() => {
      toast.style.display = 'none';
    }, 4000);
  }

  // Base64 to Blob helper
  function base64ToBlob(base64, mimeType = 'audio/wav') {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  // Generate Audio Action
  btnGenerate.addEventListener('click', async () => {
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

    // UI Loading State
    btnGenerate.disabled = true;
    btnGenerateText.textContent = 'വോയ്സ് നിർമ്മിക്കുന്നു... (Creating audio...)';
    btnGenerateIcon.setAttribute('data-lucide', 'loader-2');
    btnGenerateIcon.classList.add('lucide-spin');
    if (window.lucide) lucide.createIcons();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          voice: selectedVoice,
          style: selectedStyle,
          customApiKey: savedApiKey
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'MISSING_API_KEY') {
          showToast('Google Gemini API Key നൽകുക!', 'error');
          settingsModal.style.display = 'flex';
          return;
        }
        throw new Error(data.error || 'ഓഡിയോ നിർമ്മിക്കാൻ കഴിഞ്ഞില്ല.');
      }

      if (!data.audioBase64) {
        throw new Error('ശൂന്യമായ ഓഡിയോ ഡാറ്റയാണ് ലഭിച്ചത്.');
      }

      // Process Audio Blob
      const blob = base64ToBlob(data.audioBase64, data.mimeType || 'audio/wav');
      currentAudioBlob = blob;

      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }
      currentAudioUrl = URL.createObjectURL(blob);

      audioElement.src = currentAudioUrl;
      audioElement.load();

      // Update Result View
      resultVoiceBadge.textContent = `Voice: ${selectedVoice} • ${data.modelUsed || 'Gemini 3.8'}`;
      resultSection.style.display = 'block';
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      // Auto play
      audioElement.play().catch(e => {
        console.log('Autoplay prevented by browser, tap play to start.');
      });

      showToast('ഓഡിയോ വിജയകരമായി നിർമ്മിച്ചു! 🎧', 'success');

    } catch (err) {
      console.error(err);
      if (err.name === 'AbortError') {
        showToast('ഓഡിയോ നിർമ്മിക്കാൻ സമയം കൂടുതൽ എടുത്തു. വീണ്ടും ശ്രമിക്കുക.', 'error');
      } else {
        showToast(err.message || 'ഒരു പിശക് സംഭവിച്ചു.', 'error');
      }
    } finally {
      btnGenerate.disabled = false;
      btnGenerateText.textContent = 'വോയ്സ് നിർമ്മിക്കുക (Generate Audio)';
      btnGenerateIcon.setAttribute('data-lucide', 'play');
      btnGenerateIcon.classList.remove('lucide-spin');
      if (window.lucide) lucide.createIcons();
    }
  });

  // Custom Audio Player Listeners
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
    if (window.lucide) lucide.createIcons();
  });

  audioElement.addEventListener('pause', () => {
    playIcon.setAttribute('data-lucide', 'play');
    waveformAnim.classList.remove('playing');
    if (window.lucide) lucide.createIcons();
  });

  audioElement.addEventListener('ended', () => {
    playIcon.setAttribute('data-lucide', 'play');
    waveformAnim.classList.remove('playing');
    seekSlider.value = 0;
    currentTimeDisplay.textContent = '00:00';
    if (window.lucide) lucide.createIcons();
  });

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  audioElement.addEventListener('loadedmetadata', () => {
    totalDurationDisplay.textContent = formatTime(audioElement.duration);
    seekSlider.max = Math.floor(audioElement.duration);
  });

  audioElement.addEventListener('timeupdate', () => {
    seekSlider.value = Math.floor(audioElement.currentTime);
    currentTimeDisplay.textContent = formatTime(audioElement.currentTime);
  });

  seekSlider.addEventListener('input', () => {
    audioElement.currentTime = seekSlider.value;
  });

  speedSelector.addEventListener('change', () => {
    audioElement.playbackRate = parseFloat(speedSelector.value);
  });

  // Download Audio
  btnDownload.addEventListener('click', () => {
    if (!currentAudioBlob) {
      showToast('ഡൗൺലോഡ് ചെയ്യാൻ ഓഡിയോ ലഭ്യമല്ല.', 'error');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `malayalam_voice_${selectedVoice.toLowerCase()}_${timestamp}.wav`;

    const downloadLink = document.createElement('a');
    downloadLink.href = currentAudioUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    showToast(`ഡൗൺലോഡ് ആരംഭിച്ചു: ${filename} 📥`, 'success');
  });

});
