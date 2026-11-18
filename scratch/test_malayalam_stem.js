console.log('Testing Malayalam word forms:');
const lionStrict = /സിംഹം/;
const lionStem = /സിംഹ/;
const samples = ['സിംഹം', 'സിംഹരാജാവ്', 'സിംഹത്തിന്റെ', 'സിംഹത്തെ', 'സിംഹത്തിന്', 'കാട്ടിലെ രാജാവ്'];

samples.forEach(s => {
  console.log(`${s} -> strict: ${lionStrict.test(s)}, stem: ${lionStem.test(s)}`);
});
