// Verify all cartoon drawing logic in node
const themes = ['hut', 'river', 'forest', 'night'];

function detectStoryTheme(text = '') {
  const lower = text.toLowerCase();
  if (/പുഴ|തോണി|മീൻ|വള്ളം|കടൽ|തീരം|വെള്ളം|river|boat|canoe|fisherman|water|sea|lake|fishing/.test(lower)) {
    return 'river';
  }
  if (/കാട്|മരം|തോട്ടം|പച്ചപ്പ്|പ്രകൃതി|മൃഗം|forest|tree|wood|jungle|nature|green|animal/.test(lower)) {
    return 'forest';
  }
  if (/രാത്രി|ചന്ദ്രൻ|നക്ഷത്രം|ഇരുട്ട്|രഹസ്യം|night|moon|star|dark|midnight/.test(lower)) {
    return 'night';
  }
  return 'hut'; // Default is the Prehistoric Mallu thatched hut scene!
}

console.log('Sample 1 theme:', detectStoryTheme('പണ്ട് പണ്ട് പുഴയോരത്ത് ഒരു വയസ്സനായ മീൻപിടുത്തക്കാരൻ...'));
console.log('Sample 2 theme:', detectStoryTheme('എല്ലാ ദിവസവും രാവിലെ അയാൾ തന്റെ പഴയ വള്ളവുമായി...'));
console.log('Sample 3 theme:', detectStoryTheme('പണ്ട് പണ്ട് ഒരു ഗുഹയിൽ മനുഷ്യർ താമസിച്ചിരുന്നു...'));
