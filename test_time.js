
function formatTime(secs, fps = 30) {
  if (isNaN(secs) || !isFinite(secs)) return '00:00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatTimeShort(secs) {
  if (!isFinite(secs) || isNaN(secs)) return '00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const expectedSecs = 3 * 3600 + 34 * 60 + 23; // 03:34:23
console.log('Testing 03:34:23 (' + expectedSecs + 's)');
console.log('formatTime:', formatTime(expectedSecs));
console.log('formatTimeShort:', formatTimeShort(expectedSecs));

const symptomSecs = 125; // 02:05
console.log('\nTesting 02:05 (' + symptomSecs + 's)');
console.log('formatTime:', formatTime(symptomSecs));
console.log('formatTimeShort:', formatTimeShort(symptomSecs));
