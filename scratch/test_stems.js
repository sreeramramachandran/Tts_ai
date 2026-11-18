function detectActorStem(text = '') {
  const lower = text.toLowerCase();
  if (/സിംഹ|മൃഗരാജാവ്|കാട്ടിലെ രാജാവ്|lion/i.test(lower)) return 'lion_king';
  if (/കടുവ|വ്യാഘ്ര|പുലി|tiger|leopard/i.test(lower)) return 'tiger';
  if (/ആന|ഗജ|കൊമ്പൻ|കാട്ടാന|elephant/i.test(lower)) return 'elephant';
  if (/മുയൽ|rabbit/i.test(lower)) return 'rabbit';
  if (/കുറുക്ക|കുറുനരി|ചെന്നായ|fox/i.test(lower)) return 'fox';
  if (/കുരങ്ങ|വാനര|monkey/i.test(lower)) return 'monkey';
  if (/കരടി|bear/i.test(lower)) return 'bear';
  if (/മാൻ|മാനി|deer/i.test(lower)) return 'deer';
  if (/പക്ഷി|കിളി|കാക്ക|bird/i.test(lower)) return 'bird';
  if (/രാജാ|ചക്രവർത്തി|സുൽത്താൻ|king/i.test(lower)) return 'king';
  if (/ഡോക്ട|വൈദ്യ|doctor/i.test(lower)) return 'doctor';
  if (/അധ്യാപ|മാഷ്|ടീച്ച|teacher/i.test(lower)) return 'teacher';
  if (/മീൻപിടുത്ത|വയസ്സ|മുത്തശ്ശ|വൃദ്ധ|fisherman/i.test(lower)) return 'old_man';
  if (/വേട്ട|hunter/i.test(lower)) return 'hunter';
  if (/കുട്ടി|ബാല|boy/i.test(lower)) return 'young_boy';
  if (/പെൺകുട്ടി|സ്ത്രീ|അമ്മ|girl|woman/i.test(lower)) return 'woman';
  return 'man';
}

const testPhrases = [
  'ഒരു സിംഹത്തിന്റെ കഥ',
  'കാട്ടിലെ സിംഹം',
  'സിംഹത്തെ എല്ലാവരും ഭയന്നു',
  'സിംഹരാജാവ് പാറപ്പുറത്ത് ഇരുന്നു',
  'കാട്ടിലെ രാജാവ് ഉറങ്ങി',
  'കടുവയുടെ കാട്',
  'ആന വരുന്നു',
  'മുയലിന്റെ ബുദ്ധി'
];

testPhrases.forEach(p => {
  console.log(`"${p}" -> ${detectActorStem(p)}`);
});
