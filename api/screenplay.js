// Vercel Serverless Function: /api/screenplay

function detectActor(text = '') {
  const lower = text.toLowerCase();
  // 1. Lion / Lion King: Matches സിംഹം, സിംഹത്തിന്റെ, സിംഹത്തെ, സിംഹത്തിന്, സിംഹരാജാവ്, മൃഗരാജാവ്, കാട്ടിലെ രാജാവ്, lion
  if (/സിംഹ|മൃഗരാജാവ്|കാട്ടിലെ\s*രാജാവ്|lion/i.test(lower)) return 'lion_king';
  // 2. Tiger: Matches കടുവ, കടുവയുടെ, വ്യാഘ്രം, പുലി
  if (/കടുവ|വ്യാഘ്ര|പുലി(?!പ്പ)|tiger|leopard/i.test(lower)) return 'tiger';
  // 3. Elephant: Matches ആന, ആനയുടെ, ഗജം, കൊമ്പൻ, കാട്ടാന (Ensures ആനന്ദം 'joy' is not mistaken for elephant)
  if (/(?<![എ])ആന(?!ന്ദ)|ഗജ[ംമ]|കൊമ്പ[ൻന]|കാട്ടാന|കരിവീര|elephant/i.test(lower)) return 'elephant';
  // 4. Rabbit: Matches മുയൽ, മുയലിന്റെ, മുയലിനെ, മുയലുകൾ (handles chillu-L -> la)
  if (/മുയ[ൽല]|rabbit/i.test(lower)) return 'rabbit';
  // 5. Fox: Matches കുറുക്കൻ, കുറുക്കന്റെ, കുറുനരി, ചെന്നായ
  if (/കുറുക്ക[ൻന]|കുറുനരി|ചെന്നായ|fox/i.test(lower)) return 'fox';
  // 6. Monkey: Matches കുരങ്ങൻ, കുരങ്ങന്റെ, വാനരൻ
  if (/കുരങ്ങ[ൻന]|വാനര|monkey/i.test(lower)) return 'monkey';
  // 7. Bear: Matches കരടി, കരടിയുടെ
  if (/കരടി|bear/i.test(lower)) return 'bear';
  // 8. Human King: Checked BEFORE deer/other modifiers (so നീതിമാനായ രാജാവ് is king)
  if (/മഹാരാജാ|രാജാ[വവി]|ചക്രവർത്തി|സുൽത്താൻ|തമ്പുരാ[ൻന]|king/i.test(lower)) return 'king';
  // 9. Deer: Explicit deer words only (never match നീതിമാനായ, ബുദ്ധിമാനായ, സമാധാനം)
  if (/പുള്ളിമാ[ൻന]|കലമാ[ൻന]|കസ്തൂരിമാ[ൻന]|മാൻകുട്ടി|\bമാൻ\b|മാനി[ൽന]|deer/i.test(lower)) return 'deer';
  // 10. Bird: Matches പക്ഷി, കിളി, കാക്ക, പ്രാവ്
  if (/പക്ഷി|കിളി|കാക്ക|പ്രാവ്|bird|crow/i.test(lower)) return 'bird';
  // 11. Professions
  if (/ഡോക്ട|വൈദ്യ|ആശുപത്രി|doctor/i.test(lower)) return 'doctor';
  if (/അധ്യാപ|മാഷ്|ടീച്ച|ഗുരു|teacher/i.test(lower)) return 'teacher';
  // 12. Old fisherman: Matches മീൻപിടുത്തക്കാരൻ, വയസ്സനായ, മുത്തശ്ശൻ, വൃദ്ധൻ
  if (/മീൻപിടുത്ത|വയസ്സ|മുത്തശ്ശ|വൃദ്ധ|fisherman|old\s*man/i.test(lower)) return 'old_man';
  // 13. Hunter
  if (/വേട്ട|hunter/i.test(lower)) return 'hunter';
  // 14. Young boy: Matches കുട്ടി, കുട്ടിയുടെ, ബാലൻ, ബാലന്റെ
  if (/കുട്ടി|ബാല[ൻന]|മകൻ|boy|child/i.test(lower)) return 'young_boy';
  // 15. Woman: Matches പെൺകുട്ടി, സ്ത്രീ, അമ്മ
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
  // Roaring: matches അലറി, അലറുന്നു, അലറും, ഗർജ്ജിച്ചു, ഗർജ്ജനം, ഗർജ്ജിക്കുന്നു, [roar]
  if (/\[roar\]|അലറ|ഗർജ്ജ|അട്ടഹസി|റോർ|roar/i.test(lower)) {
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
  if (pose === 'roaring' || /\[roar\]|അലറ|ഗർജ്ജ|ദേഷ്യം|ശക്തനായ/i.test(lower)) {
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

module.exports.analyzeMalayalamScreenplayLocal = analyzeMalayalamScreenplayLocal;

