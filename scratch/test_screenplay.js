const http = require('http');

function postScreenplay(title, text) {
  const data = JSON.stringify({ text });
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/screenplay',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(options, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`\n=== ${title} ===`);
      console.log('Status:', res.statusCode);
      const json = JSON.parse(body);
      json.screenplay.forEach(sc => {
        console.log(`Scene ${sc.scene_number}: Actor=[${sc.character.type}], Setting=[${sc.setting}], Pose=[${sc.character.pose}], Emotion=[${sc.character.emotion}] -> Title: "${sc.title}"`);
      });
    });
  });

  req.on('error', err => console.error('Req error:', err));
  req.write(data);
  req.end();
}

postScreenplay(
  'Lion King Story',
  'പണ്ട് പണ്ട്, ഒരു വലിയ കാട്ടിൽ ശക്തനായ ഒരു സിംഹരാജാവ് ഭരിച്ചിരുന്നു. കാട്ടിലെ എല്ലാ മൃഗങ്ങളും അയാളെ ഭയപ്പെട്ടിരുന്നു[roar]. ഒരു ദിവസം അവൻ പാറപ്പുറത്തിരുന്ന് കാടിനെ നോക്കി അലറി.'
);

setTimeout(() => {
  postScreenplay(
    'Fisherman Story',
    'പണ്ട് പണ്ട്, പുഴയോരത്തെ ഒരു ചെറിയ ഗ്രാമത്തിൽ ഒരു വയസ്സനായ മീൻപിടുത്തക്കാരൻ താമസിച്ചിരുന്നു. എല്ലാ ദിവസവും രാവിലെ അയാൾ തന്റെ പഴയ വള്ളവുമായി പുഴയിലേക്ക് ഇറങ്ങുമായിരുന്നു. ഒരു ദിവസം പുഴയുടെ ആഴങ്ങളിൽ നിന്ന് വലിയൊരു സ്വർണ്ണ മത്സ്യം പ്രത്യക്ഷപ്പെട്ടു!'
  );
}, 600);

setTimeout(() => {
  postScreenplay(
    'Royal King & Rabbit Story',
    'ഒരു രാജ്യത്ത് നീതിമാനായ ഒരു മഹാരാജാവ് കൊട്ടാരത്തിൽ ഭരണം നടത്തിയിരുന്നു. കാട്ടിൽ നിന്ന് ഒരു ബുദ്ധിമാനായ കുഞ്ഞുമുയൽ രാജാവിനെ കാണാൻ എത്തി.'
  );
}, 1200);
