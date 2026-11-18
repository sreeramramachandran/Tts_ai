function detectActorMorph(text = '') {
  const lower = text.toLowerCase();
  // Lion: matches സിംഹം, സിംഹത്തിന്റെ, സിംഹത്തെ, സിംഹരാജാവ്, മൃഗരാജാവ്, കാട്ടിലെ രാജാവ്, lion
  if (/സിംഹ|മൃഗരാജാവ്|കാട്ടിലെ\s*രാജാവ്|lion/i.test(lower)) return 'lion_king';
  // Tiger: matches കടുവ, കടുവയുടെ, വ്യാഘ്രം, പുലി, പുലിയുടെ
  if (/കടുവ|വ്യാഘ്ര|പുലി|tiger|leopard/i.test(lower)) return 'tiger';
  // Elephant: matches ആന, ആനയുടെ, ആനയെ, ഗജം, കൊമ്പൻ, കൊമ്പന്റെ, കാട്ടാന
  if (/ആന|ഗജ|കൊമ്പ[ൻന]|കാട്ടാന|elephant/i.test(lower)) return 'elephant';
  // Rabbit: matches മുയൽ, മുയലിന്റെ, മുയലിനെ, മുയലുകൾ (handles chillu-L -> la)
  if (/മുയ[ൽല]|rabbit/i.test(lower)) return 'rabbit';
  // Fox: matches കുറുക്കൻ, കുറുക്കന്റെ, കുറുനരി, ചെന്നായ
  if (/കുറുക്ക[ൻന]|കുറുനരി|ചെന്നായ|fox/i.test(lower)) return 'fox';
  // Monkey: matches കുരങ്ങൻ, കുരങ്ങന്റെ, കുരങ്ങനെ, വാനരൻ
  if (/കുരങ്ങ[ൻന]|വാനര|monkey/i.test(lower)) return 'monkey';
  // Bear: matches കരടി, കരടിയുടെ, കരടിയെ
  if (/കരടി|bear/i.test(lower)) return 'bear';
  // Deer: matches മാൻ, മാനിന്റെ, മാനിനെ, പുള്ളിമാൻ
  if (/മാ[ൻന]|മാനി|deer/i.test(lower)) return 'deer';
  // King: matches രാജാവ്, രാജാവിന്റെ, രാജാവിനെ, ചക്രവർത്തി, സുൽത്താൻ
  if (/രാജാ[വവി]|ചക്രവർത്തി|സുൽത്താൻ|king/i.test(lower)) return 'king';
  // Doctor: matches ഡോക്ടർ, ഡോക്ടറുടെ, വൈദ്യൻ
  if (/ഡോക്ട|വൈദ്യ|doctor/i.test(lower)) return 'doctor';
  // Teacher: matches അധ്യാപകൻ, അധ്യാപകന്റെ, മാഷ്, ടീച്ചർ
  if (/അധ്യാപ|മാഷ്|ടീച്ച|teacher/i.test(lower)) return 'teacher';
  // Old fisherman: matches മീൻപിടുത്തക്കാരൻ, വയസ്സനായ, മുത്തശ്ശൻ, വൃദ്ധൻ
  if (/മീൻപിടുത്ത|വയസ്സ|മുത്തശ്ശ|വൃദ്ധ|fisherman/i.test(lower)) return 'old_man';
  // Hunter: matches വേട്ടക്കാരൻ, വേട്ടക്കാരന്റെ, വേട്ടയാടി
  if (/വേട്ട|hunter/i.test(lower)) return 'hunter';
  // Young child: matches കുട്ടി, കുട്ടിയുടെ, ബാലൻ, ബാലന്റെ
  if (/കുട്ടി|ബാല[ൻന]|boy/i.test(lower)) return 'young_boy';
  // Woman: matches പെൺകുട്ടി, സ്ത്രീ, അമ്മ
  if (/പെൺകുട്ടി|സ്ത്രീ|അമ്മ|girl|woman/i.test(lower)) return 'woman';
  return 'man';
}

const tests = [
  ['ഒരു സിംഹത്തിന്റെ കഥ', 'lion_king'],
  ['കാട്ടിലെ രാജാവ് അലറി', 'lion_king'],
  ['സിംഹത്തെ കണ്ട കുറുക്കൻ', 'lion_king'],
  ['സിംഹരാജാവ് പാറപ്പുറത്തിരുന്നു', 'lion_king'],
  ['മുയലിന്റെ ബുദ്ധി', 'rabbit'],
  ['കുഞ്ഞുമുയൽ ചാടി', 'rabbit'],
  ['കുരങ്ങന്റെ കളി', 'monkey'],
  ['ആനയുടെ തുമ്പിക്കൈ', 'elephant'],
  ['കൊമ്പന്റെ വരവ്', 'elephant'],
  ['രാജാവിന്റെ കൊട്ടാരം', 'king'],
  ['വേട്ടക്കാരന്റെ അമ്പ്', 'hunter']
];

let allPassed = true;
tests.forEach(([input, expected]) => {
  const actual = detectActorMorph(input);
  const ok = actual === expected;
  console.log(`${ok ? '✓' : '✗'} "${input}" -> got "${actual}", expected "${expected}"`);
  if (!ok) allPassed = false;
});
console.log('All tests passed:', allPassed);
