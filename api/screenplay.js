// Vercel Serverless Function: /api/screenplay

function detectActor(text = '') {
  const lower = text.toLowerCase();
  if (/സിംഹ\s*രാജാവ്|കാട്ടിലെ രാജാവ്|മൃഗരാജാവ്|lion\s*king/i.test(lower)) return 'lion_king';
  if (/സിംഹം|lion(?!\s*fish)/i.test(lower)) return 'lion_king';
  if (/കടുവ|വ്യാഘ്രം|പുലി|tiger|leopard|panther/i.test(lower)) return 'tiger';
  if (/ആന|ഗജം|കൊമ്പൻ|കാട്ടാന|കരിവീരൻ|elephant/i.test(lower)) return 'elephant';
  if (/മുയൽ|കുഞ്ഞുമുയൽ|rabbit|hare/i.test(lower)) return 'rabbit';
  if (/കുറുക്കൻ|കുറുനരി|ചെന്നായ|fox|wolf/i.test(lower)) return 'fox';
  if (/കുരങ്ങൻ|വാനരൻ|monkey/i.test(lower)) return 'monkey';
  if (/കരടി|bear/i.test(lower)) return 'bear';
  if (/മാൻ|പുള്ളിമാൻ|deer/i.test(lower)) return 'deer';
  if (/പക്ഷി|കിളി|കാക്ക|പ്രാവ്|bird|crow/i.test(lower)) return 'bird';
  if (/രാജാവ്|മഹാരാജാവ്|ചക്രവർത്തി|സുൽത്താൻ|തമ്പുരാൻ|king|emperor/i.test(lower)) return 'king';
  if (/ഡോക്ടർ|വൈദ്യൻ|ആശുപത്രി|doctor/i.test(lower)) return 'doctor';
  if (/അധ്യാപകൻ|മാഷ്|ടീച്ചർ|ഗുരു|teacher/i.test(lower)) return 'teacher';
  if (/വയസ്സനായ|മുത്തശ്ശൻ|മീൻപിടുത്തക്കാരൻ|വൃദ്ധൻ|old\s*man|fisherman/i.test(lower)) return 'old_man';
  if (/വേട്ടക്കാരൻ|hunter/i.test(lower)) return 'hunter';
  if (/കുട്ടി|ബാലൻ|മകൻ|boy|child/i.test(lower)) return 'young_boy';
  if (/പെൺകുട്ടി|സ്ത്രീ|അമ്മ|girl|woman|mother/i.test(lower)) return 'woman';
  return 'man';
}

function detectSetting(text = '', actor = 'man') {
  const lower = text.toLowerCase();
  if (/പാറ|പാറപ്പുറ|മല|കുന്ന്|rock|cliff|mountain|പ്രൈഡ്\s*റോക്ക്/i.test(lower)) {
    return 'jungle_rock';
  }
  if (actor === 'lion_king' && !/പുഴ|കടൽ|തോണി|വള്ളം/i.test(lower)) {
    return 'jungle_rock';
  }
  if (/കൊട്ടാരം|സിംഹാസനം|രാജസദസ്സ്|രാജ്യം|palace|throne|court/i.test(lower) || (actor === 'king' && !/കാട്|പുഴ/i.test(lower))) {
    return 'royal_palace';
  }
  if (/വള്ളം|തോണി|പുഴ|നദി|മീൻ|മത്സ്യം|കടൽ|തീരം|വെള്ളം|river|boat|fish|water/i.test(lower)) {
    return 'river_boat';
  }
  if (/കുടിൽ|വീട്|ഗ്രാമം|താമസിച്ചിരുന്നു|മുറി|house|hut|village/i.test(lower)) {
    return 'thatched_hut';
  }
  if (/കാട്|മരം|തോട്ടം|വനം|മൃഗം|മൃഗങ്ങൾ|forest|jungle|tree/i.test(lower)) {
    return 'forest_jungle';
  }
  if (/രാത്രി|ഇരുട്ട്|ചന്ദ്രൻ|തീ|campfire|night/i.test(lower)) {
    return 'night_campfire';
  }
  return 'forest_jungle';
}

function detectPose(text = '', actor = 'man', setting = 'jungle_rock') {
  const lower = text.toLowerCase();
  if (/\[roar\]|അലറി|ഗർജ്ജ|അട്ടഹസി|roar/i.test(lower)) {
    return 'roaring';
  }
  if (/ഇരുന്നു|വിശ്രമിച്ചു|പാറപ്പുറത്തിരുന്നു|സിംഹാസനത്തിലിരുന്നു|sitting/i.test(lower)) {
    return 'sitting';
  }
  if (/ഞെട്ടി|പേടിച്ചു|ഭയന്നു|അത്ഭുത|surprised|shocked|scared/i.test(lower)) {
    return 'standing_surprised';
  }
  if (setting === 'river_boat') {
    return 'in_boat';
  }
  if (setting === 'jungle_rock' && actor === 'lion_king') {
    return /നടന്നു|ഓടി|ചാടി|വേട്ടയാടി/i.test(lower) ? 'walking' : 'sitting';
  }
  if (/നടന്നു|പോയി|ഇറങ്ങി|യാത്ര|വേട്ടയാടി|walking|running/i.test(lower)) {
    return 'walking';
  }
  return 'standing';
}

function detectEmotion(text = '', actor = 'man', pose = 'standing') {
  const lower = text.toLowerCase();
  if (pose === 'roaring' || /\[roar\]|അലറി|ഗർജ്ജ|ദേഷ്യം|ശക്തനായ/i.test(lower)) {
    return 'fierce';
  }
  if (/\[laugh\]|\[giggle\]|ചിരി|പൊട്ടിച്ചിരി|തമാശ/i.test(lower)) {
    return 'laughing';
  }
  if (/ഞെട്ടി|അത്ഭുത|പ്രത്യക്ഷപ്പെട്ടു|shocked|amazed/i.test(lower)) {
    return 'shocked';
  }
  if (/പേടി|ഭയം|ഭയന്നു|വിറച്ചു|scared/i.test(lower)) {
    return 'scared';
  }
  if (actor === 'lion_king' || actor === 'king') {
    return 'proud';
  }
  return 'happy';
}

function detectObjects(text = '', actor = 'man', setting = 'jungle_rock') {
  const lower = text.toLowerCase();
  const objects = [];
  if (actor === 'lion_king') {
    objects.push('royal_crown', 'golden_mane', 'rocky_cliff');
  } else if (actor === 'king') {
    objects.push('royal_crown', 'golden_scepter', 'royal_throne');
  } else if (actor === 'elephant') {
    objects.push('curved_tusks');
  } else if (actor === 'rabbit') {
    objects.push('carrot');
  }

  if (/വള്ളം|തോണി|boat|canoe/i.test(lower) || setting === 'river_boat') objects.push('wooden_boat');
  if (/സ്വർണ്ണ\s*മത്സ്യം|സ്വർണ്ണമീൻ|മത്സ്യം|golden\s*fish|fish(?!\s*erman)/i.test(lower)) objects.push('golden_fish');
  if (/പാറ|കല്ല്|rock|cliff/i.test(lower) || setting === 'jungle_rock') objects.push('boulders_rocks');
  if (/മരം|വൃക്ഷം|തോട്ടം|tree|forest/i.test(lower) || setting === 'forest_jungle') objects.push('tall_trees');
  if (/കുടിൽ|വീട്|hut|cottage/i.test(lower) || setting === 'thatched_hut') objects.push('thatched_hut');
  if (/തീ|campfire|fire/i.test(lower) || setting === 'night_campfire') objects.push('campfire');
  
  return [...new Set(objects)];
}

function generateSceneTitle(sceneNum, actor, setting, pose, dialogue) {
  if (actor === 'lion_king') {
    if (pose === 'roaring' || /\[roar\]|അലറി|ഗർജ്ജ/.test(dialogue)) {
      return `രംഗം ${sceneNum}: പാറപ്പുറത്തെ സിംഹഗർജ്ജനം [ROAR]`;
    }
    if (sceneNum === 1) return `രംഗം ${sceneNum}: കാട്ടിലെ ശക്തനായ സിംഹരാജാവ്`;
    return `രംഗം ${sceneNum}: സിംഹരാജാവും കാട്ടിലെ മൃഗങ്ങളും`;
  }
  if (actor === 'king') {
    return `രംഗം ${sceneNum}: കൊട്ടാരത്തിലെ മഹാരാജാവ്`;
  }
  if (actor === 'rabbit') {
    return `രംഗം ${sceneNum}: കാട്ടിലെ ബുദ്ധിമാനായ മുയൽ`;
  }
  if (actor === 'elephant') {
    return `രംഗം ${sceneNum}: കാട്ടിലെ വലിയ കൊമ്പനാന`;
  }
  if (setting === 'river_boat') {
    return /സ്വർണ്ണ/i.test(dialogue) ? `രംഗം ${sceneNum}: അത്ഭുത സ്വർണ്ണ മത്സ്യത്തിന്റെ വരവ്` : `രംഗം ${sceneNum}: പഴയ വള്ളത്തിലെ പുഴയാത്ര`;
  }
  if (setting === 'thatched_hut') {
    return `രംഗം ${sceneNum}: തീരത്തെ ഗ്രാമവും കുടിലും`;
  }
  if (setting === 'forest_jungle') {
    return `രംഗം ${sceneNum}: വനത്തിലൂടെയുള്ള യാത്ര`;
  }
  if (setting === 'night_campfire') {
    return `രംഗം ${sceneNum}: രാത്രിയിലെ തീകൂമ്പാരം`;
  }
  return `രംഗം ${sceneNum}: കഥയുടെ തുടക്കം`;
}

function analyzeMalayalamScreenplayLocal(text = '') {
  const sentences = text
    .split(/([.!?।\n]+)/)
    .map(s => s.trim())
    .filter(s => s.length > 5 && !/^[.!?।\n]+$/.test(s));

  if (sentences.length === 0) {
    sentences.push(text.trim() || 'ഒരു മനോഹരമായ കഥ.');
  }

  const mainActor = detectActor(text);
  const numScenes = Math.min(3, Math.max(1, sentences.length));
  const chunkSize = Math.ceil(sentences.length / numScenes);
  const screenplay = [];

  for (let i = 0; i < numScenes; i++) {
    const chunk = sentences.slice(i * chunkSize, (i + 1) * chunkSize);
    const dialogue = chunk.join('. ');

    const localActor = detectActor(dialogue);
    const charType = (localActor !== 'man') ? localActor : mainActor;
    const setting = detectSetting(dialogue, charType);
    const charPose = detectPose(dialogue, charType, setting);
    const charEmotion = detectEmotion(dialogue, charType, charPose);
    const objects = detectObjects(dialogue, charType, setting);

    let charProp = 'none';
    if (setting === 'river_boat') {
      charProp = 'oar';
    } else if (charType === 'hunter') {
      charProp = 'bow';
    } else if (charType === 'old_man') {
      charProp = 'walking_stick';
    } else if (charType === 'king' || charType === 'lion_king') {
      charProp = 'crown';
    } else if (charType === 'rabbit') {
      charProp = 'carrot';
    }

    const title = generateSceneTitle(i + 1, charType, setting, charPose, dialogue);

    let timeOfDay = 'dawn_sunrise';
    const lower = dialogue.toLowerCase();
    if (/രാത്രി|ഇരുട്ട്|അർദ്ധരാത്രി|ചന്ദ്രൻ|night|dark/i.test(lower)) {
      timeOfDay = 'night';
    } else if (/വൈകുന്നേരം|അസ്തമയം|സന്ധ്യ|sunset|evening/i.test(lower)) {
      timeOfDay = 'sunset';
    } else if (/ഉച്ച|വെയിൽ|പകൽ|noon|day/i.test(lower)) {
      timeOfDay = 'daylight';
    }

    screenplay.push({
      scene_number: i + 1,
      title: title,
      dialogue: dialogue,
      subtitle: dialogue,
      prompt: `2D minimalist comic hand-drawn style: ${charType} (${charPose}) in ${setting} with ${objects.join(', ')} at ${timeOfDay}`,
      setting: setting,
      time_of_day: timeOfDay,
      weather: 'clear',
      character: {
        type: charType,
        pose: charPose,
        prop: charProp,
        emotion: charEmotion
      },
      objects: objects,
      animation_notes: `Minimalist 2D hand-drawn animation of ${charType} (${charPose}, ${charEmotion}) in ${setting}.`
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
