window.E64 = window.E64 || {};
window.E64.initCursor = function() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  var cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  cursor.innerHTML = '<svg viewBox="0 0 32 32" fill="none" stroke="#F5C518" stroke-width="2.5" stroke-linecap="round"><circle cx="13" cy="13" r="8" fill="rgba(245,197,24,0.08)"/><line x1="19" y1="19" x2="27" y2="27"/><circle cx="13" cy="13" r="2" fill="#F5C518"/></svg>';
  document.body.appendChild(cursor);

  var mouseX = 0, mouseY = 0, curX = 0, curY = 0;

  document.addEventListener('mousemove', function(e) { mouseX = e.clientX; mouseY = e.clientY; });
  document.addEventListener('mouseleave', function() { cursor.classList.add('hidden'); });
  document.addEventListener('mouseenter', function() { cursor.classList.remove('hidden'); });

  (function tick() {
    curX += (mouseX - curX) * 0.25;
    curY += (mouseY - curY) * 0.25;
    cursor.style.transform = 'translate(' + curX + 'px,' + curY + 'px) translate(-50%,-50%)';
    requestAnimationFrame(tick);
  })();

  var SEL = 'a,button,.game-card,.tab-btn,.folder-tab,.cctv-tab,.stamp,.gloss,.polaroid,.vote-buttons button,.quiz-option,.memo-card,.token,.lewis-3d,[role="button"],[data-hoverable]';
  document.addEventListener('mouseover', function(e) {
    if (e.target.closest && e.target.closest(SEL)) cursor.classList.add('hover');
  });
  document.addEventListener('mouseout', function(e) {
    if (e.target.closest && e.target.closest(SEL)) cursor.classList.remove('hover');
  });
};
