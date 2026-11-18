function detectActorRobust(text = '') {
  const lower = text.toLowerCase();

  // 1. Lion / Lion King: Check FIRST before human king
  if (/സിംഹ|മൃഗരാജാവ്|കാട്ടിലെ\s*രാജാവ്|lion/i.test(lower)) return 'lion_king';

  // 2. Tiger
  if (/കടുവ|വ്യാഘ്ര|പുലി(?!പ്പ)|tiger|leopard/i.test(lower)) return 'tiger';

  // 3. Elephant (ensure ആനന്ദം 'joy' is NOT mistaken for elephant)
  if (/(?<![എ])ആന(?!ന്ദ)|ഗജ[ംമ]|കൊമ്പ[ൻന]|കാട്ടാന|കരിവീര|elephant/i.test(lower)) return 'elephant';

  // 4. Rabbit (മുയൽ, മുയലിന്റെ, മുയലിനെ, മുയലുകൾ)
  if (/മുയ[ൽല]|rabbit/i.test(lower)) return 'rabbit';

  // 5. Fox
  if (/കുറുക്ക[ൻന]|കുറുനരി|ചെന്നായ|fox/i.test(lower)) return 'fox';

  // 6. Monkey
  if (/കുരങ്ങ[ൻന]|വാനര|monkey/i.test(lower)) return 'monkey';

  // 7. Bear
  if (/കരടി|bear/i.test(lower)) return 'bear';

  // 8. Deer: Explicit deer words only (never match നീതിമാനായ, ബുദ്ധിമാനായ, സമാധാനം)
  if (/പുള്ളിമാ[ൻന]|കലമാ[ൻന]|കസ്തൂരിമാ[ൻന]|മാൻകുട്ടി|\bമാൻ\b|മാനി[ൽന]|deer/i.test(lower)) return 'deer';

  // 9. Human King (checked after lion_king)
  if (/മഹാരാജാ|രാജാ[വവി]|ചക്രവർത്തി|സുൽത്താൻ|തമ്പുരാ[ൻന]|king/i.test(lower)) return 'king';

  // 10. Bird
  if (/പക്ഷി|കിളി|കാക്ക|പ്രാവ്|bird|crow/i.test(lower)) return 'bird';

  // 11. Professions
  if (/ഡോക്ട|വൈദ്യ|ആശുപത്രി|doctor/i.test(lower)) return 'doctor';
  if (/അധ്യാപ|മാഷ്|ടീച്ച|ഗുരു|teacher/i.test(lower)) return 'teacher';

  // 12. Old Fisherman / Old Man
  if (/മീൻപിടുത്ത|വയസ്സ|മുത്തശ്ശ|വൃദ്ധ|fisherman|old\s*man/i.test(lower)) return 'old_man';

  // 13. Hunter
  if (/വേട്ട|hunter/i.test(lower)) return 'hunter';

  // 14. Child / Boy
  if (/കുട്ടി|ബാല[ൻന]|മകൻ|boy|child/i.test(lower)) return 'young_boy';

  // 15. Woman
  if (/പെൺകുട്ടി|സ്ത്രീ|അമ്മ|girl|woman|mother/i.test(lower)) return 'woman';

  return 'man';
}

const tests = [
  ['പണ്ട് പണ്ട്, ഒരു വലിയ കാട്ടിൽ ശക്തനായ ഒരു സിംഹരാജാവ് ഭരിച്ചിരുന്നു.', 'lion_king'],
  ['കാട്ടിലെ രാജാവ് ഉറങ്ങി', 'lion_king'],
  ['ഒരു സിംഹത്തിന്റെ കഥ', 'lion_king'],
  ['സിംഹത്തെ എല്ലാവരും ഭയന്നു', 'lion_king'],
  ['ഒരു രാജ്യത്ത് നീതിമാനായ ഒരു മഹാരാജാവ് കൊട്ടാരത്തിൽ ഭരണം നടത്തിയിരുന്നു.', 'king'],
  ['കുഞ്ഞുമുയൽ ആനന്ദത്തോടെ കാട്ടിലൂടെ നടന്നു', 'rabbit'],
  ['ആനന്ദത്തോടെ പാട്ടുപാടി', 'man'],
  ['വലിയൊരു ആന നടന്നു വന്നു', 'elephant'],
  ['മുയലിന്റെ ബുദ്ധി', 'rabbit'],
  ['വയസ്സനായ മീൻപിടുത്തക്കാരൻ വള്ളത്തിൽ പോയി', 'old_man']
];

tests.forEach(([input, expected]) => {
  const actual = detectActorRobust(input);
  const ok = actual === expected;
  console.log(`${ok ? '✓' : '✗'} "${input}" -> got "${actual}", expected "${expected}"`);
});
