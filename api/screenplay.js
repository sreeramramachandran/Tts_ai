// Vercel Serverless Function: /api/screenplay

function analyzeMalayalamScreenplayLocal(text = '') {
  const sentences = text
    .split(/([.!?।\n]+)/)
    .map(s => s.trim())
    .filter(s => s.length > 5 && !/^[.!?।\n]+$/.test(s));

  if (sentences.length === 0) {
    sentences.push(text.trim() || 'ഒരു മനോഹരമായ കഥ.');
  }

  const fullLower = text.toLowerCase();
  let mainCharacterType = 'man';
  if (/വയസ്സനായ|മുത്തശ്ശൻ|മീൻപിടുത്തക്കാരൻ|വൃദ്ധൻ|old/.test(fullLower)) {
    mainCharacterType = 'old_man';
  } else if (/വേട്ടക്കാരൻ|hunter/.test(fullLower)) {
    mainCharacterType = 'hunter';
  } else if (/കുട്ടി|ബാലൻ|boy|child/.test(fullLower)) {
    mainCharacterType = 'young_boy';
  } else if (/പെൺകുട്ടി|സ്ത്രീ|അമ്മ|girl|woman/.test(fullLower)) {
    mainCharacterType = 'woman';
  }

  const numScenes = Math.min(3, Math.max(1, sentences.length));
  const chunkSize = Math.ceil(sentences.length / numScenes);
  const screenplay = [];

  for (let i = 0; i < numScenes; i++) {
    const chunk = sentences.slice(i * chunkSize, (i + 1) * chunkSize);
    const dialogue = chunk.join('. ');
    const lower = dialogue.toLowerCase();

    let setting = 'kerala_village';
    if (/വള്ളം|തോണി|പുഴയിലേക്ക്|പുഴയിൽ|തുഴഞ്ഞു|ഇറങ്ങി|കടലിൽ|വലയെറിഞ്ഞു|ആഴങ്ങളിൽ|മീൻ|മത്സ്യം/.test(lower) && i > 0) {
      setting = 'river_boat';
    } else if (/പുഴ|കടൽ|തീരം|തോണി|വള്ളം|മീൻ|മത്സ്യം|വെള്ളം|river|boat|fish/.test(lower)) {
      setting = i === 0 ? 'thatched_hut' : 'river_boat';
    } else if (/കുടിൽ|വീട്|ഗ്രാമം|താമസിച്ചിരുന്നു|മുറി|house|hut|village/.test(lower)) {
      setting = 'thatched_hut';
    } else if (/കാട്|മരം|തോട്ടം|വനം|forest|jungle|tree/.test(lower)) {
      setting = 'forest_jungle';
    } else if (/രാത്രി|ഇരുട്ട്|ചന്ദ്രൻ|തീ|campfire|night/.test(lower)) {
      setting = 'night_campfire';
    } else if (/പാറ|മല|കുന്ന്|rock|mountain/.test(lower)) {
      setting = 'rocky_mountain';
    }

    let timeOfDay = 'dawn_sunrise';
    if (/രാത്രി|ഇരുട്ട്|അർദ്ധരാത്രി|ചന്ദ്രൻ|night|dark/.test(lower)) {
      timeOfDay = 'night';
    } else if (/വൈകുന്നേരം|അസ്തമയം|സന്ധ്യ|sunset|evening/.test(lower)) {
      timeOfDay = 'sunset';
    } else if (/ഉച്ച|വെയിൽ|പകൽ|noon|day/.test(lower)) {
      timeOfDay = 'daylight';
    } else if (/രാവിലെ|സൂര്യൻ ഉദിക്കും|പ്രഭാതം|morning|sunrise/.test(lower)) {
      timeOfDay = 'dawn_sunrise';
    }

    let weather = 'clear';
    if (/മഴ|തുള്ളി|കാറ്റ്|ഇടിമിന്നൽ|rain|storm/.test(lower)) {
      weather = 'rain';
    }

    let charType = mainCharacterType;
    if (/കുട്ടി|ബാലൻ/.test(lower) && mainCharacterType !== 'young_boy') {
      charType = 'young_boy';
    }

    let charPose = 'walking';
    if (setting === 'river_boat') {
      charPose = (/സംസാരിക്കാൻ തുടങ്ങി|പ്രത്യക്ഷപ്പെട്ടു|അത്ഭുത|ഞെട്ടി|പേടിച്ചു|ഭയന്നു/.test(lower)) ? 'standing_surprised' : 'in_boat';
    } else if (/സംസാരിക്കാൻ തുടങ്ങി|പ്രത്യക്ഷപ്പെട്ടു|അത്ഭുത|ഞെട്ടി|പേടിച്ചു|ഭയന്നു|surprised|shocked/.test(lower)) {
      charPose = 'standing_surprised';
    } else if (/ഇരുന്നു|വിശ്രമിച്ചു|തീയുടെ അടുത്ത്|sitting/.test(lower)) {
      charPose = 'sitting';
    } else if (/നടന്നു|പോയി|ഇറങ്ങി|യാത്ര|walking/.test(lower)) {
      charPose = 'walking';
    }

    let charProp = 'none';
    if (setting === 'river_boat') {
      charProp = 'oar';
    } else if (/വില്ല്|അമ്പ്|bow/.test(lower) || charType === 'hunter') {
      charProp = 'bow';
    } else if (/വല|മീൻപിടുത്ത/.test(lower)) {
      charProp = 'fishing_net';
    } else if (/വടി|ഊന്നുവടി|stick/.test(lower) || (charType === 'old_man' && setting !== 'river_boat')) {
      charProp = 'walking_stick';
    } else if (/മഴ|കുട|umbrella/.test(lower)) {
      charProp = 'umbrella';
    }

    let charEmotion = 'happy';
    if (/\[laugh\]|\[giggle\]|ചിരി|പൊട്ടിച്ചിരി|തമാശ/.test(lower)) {
      charEmotion = 'laughing';
    } else if (/സംസാരിക്കാൻ തുടങ്ങി|പ്രത്യക്ഷപ്പെട്ടു|അത്ഭുതം|ഞെട്ടി|ആഴങ്ങളിൽ|shocked|amazed/.test(lower)) {
      charEmotion = 'shocked';
    } else if (/പേടി|ഭയം|ഭയന്നു|വിറച്ചു|scared/.test(lower)) {
      charEmotion = 'scared';
    } else if (/രഹസ്യം|whisper|മന്ത്രിച്ചു/.test(lower)) {
      charEmotion = 'curious';
    }

    const objects = [];
    if (/വള്ളം|തോണി|boat|canoe/.test(lower) || setting === 'river_boat') objects.push('wooden_boat');
    if (/സ്വർണ്ണ\s*മത്സ്യം|മത്സ്യം|സ്വർണ്ണമീൻ|golden\s*fish|fish(?!\s*erman)/i.test(lower) || (/(?<!മീൻപിടുത്ത)മീൻ/.test(lower) && !/മീൻപിടുത്തക്കാര/.test(lower))) {
      objects.push('golden_fish');
    }
    if (/കുടിൽ|വീട്|cottage|hut/.test(lower) || setting === 'thatched_hut') objects.push('thatched_hut');
    if (/പുഴ|കടൽ|വെള്ളം|river|water/.test(lower) || setting === 'river_boat') objects.push('river_water');
    if (/പാറ|കല്ല്|rock|boulder/.test(lower) || setting === 'rocky_mountain') objects.push('boulders_rocks');
    if (/തീ|campfire|fire/.test(lower) || setting === 'night_campfire') objects.push('campfire');
    if (/മരം|വൃക്ഷം|തോട്ടം|tree|forest/.test(lower) || setting === 'forest_jungle') objects.push('tall_trees');
    if (setting === 'kerala_village' || setting === 'thatched_hut' || setting === 'river_boat') objects.push('coconut_palms');

    let title = `രംഗം ${i + 1}`;
    if (setting === 'river_boat') {
      title = objects.includes('golden_fish') ? `രംഗം ${i + 1}: അത്ഭുത സ്വർണ്ണ മത്സ്യത്തിന്റെ വരവ്` : `രംഗം ${i + 1}: പഴയ വള്ളത്തിലെ പുഴയാത്ര`;
    } else if (setting === 'thatched_hut') {
      title = `രംഗം ${i + 1}: പുഴയോരത്തെ ഗ്രാമവും കുടിലും`;
    } else if (setting === 'forest_jungle') {
      title = `രംഗം ${i + 1}: വനത്തിലൂടെയുള്ള യാത്ര`;
    } else if (setting === 'night_campfire') {
      title = `രംഗം ${i + 1}: രാത്രിയിലെ തീകൂമ്പാരം`;
    } else if (setting === 'rocky_mountain') {
      title = `രംഗം ${i + 1}: മലനിരകളും പാറക്കൂട്ടങ്ങളും`;
    } else {
      title = `രംഗം ${i + 1}: കഥയുടെ തുടക്കം`;
    }

    screenplay.push({
      scene_number: i + 1,
      title: title,
      dialogue: dialogue,
      subtitle: dialogue,
      prompt: `2D comic storybook style: ${charType} (${charPose}) in ${setting} with ${objects.join(', ')} at ${timeOfDay}`,
      setting: setting,
      time_of_day: timeOfDay,
      weather: weather,
      character: {
        type: charType,
        pose: charPose,
        prop: charProp,
        emotion: charEmotion
      },
      objects: objects,
      animation_notes: `2D comic animation of ${charType} (${charPose}, ${charEmotion}) in ${setting} with ${objects.join(', ')}.`
    });
  }

  return screenplay;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { text = '' } = req.body || {};
  const screenplay = analyzeMalayalamScreenplayLocal(text);

  return res.status(200).json({
    success: true,
    screenplay: screenplay,
    scenes: screenplay
  });
};
