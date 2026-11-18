const screenplayMod = require('../api/screenplay.js');

const stories = [
  "പണ്ട് പണ്ട് ഒരു വലിയ കാട്ടിൽ ശക്തനായ ഒരു സിംഹരാജാവ് ഭരിച്ചിരുന്നു. എല്ലാ മൃഗങ്ങളും സിംഹത്തെ ഭയപ്പെട്ടിരുന്നു.",
  "സിംഹം വലിയ പാറപ്പുറത്തു കയറി നിന്ന് കാട് കുലുങ്ങുന്ന വിധത്തിൽ ഉറക്കെ അലറി[roar].",
  "ഒരു കാട്ടിൽ ഒരു സിംഹവും ഒരു ചെറിയ മുയലും ഉണ്ടായിരുന്നു. മുയലിന്റെ ബുദ്ധി സിംഹത്തിന്റെ ജീവനെടുത്തു."
];

stories.forEach((story, idx) => {
  console.log(`\n=== Story ${idx + 1} ===`);
  console.log(story);
  const result = screenplayMod.analyzeMalayalamScreenplayLocal(story);
  console.log(JSON.stringify(result, null, 2));
});
