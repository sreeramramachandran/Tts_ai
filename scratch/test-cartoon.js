// Prototype cartoon renderer verification
function testCartoonMath() {
  const t = 1.5;
  const walk = Math.sin(t * 6);
  const bounce = Math.abs(Math.sin(t * 12)) * 5;
  console.log('Walk offset:', walk, 'Bounce:', bounce);
  return true;
}
testCartoonMath();
