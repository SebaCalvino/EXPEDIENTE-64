export function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  cursor.innerHTML = `
    <svg viewBox="0 0 32 32" fill="none" stroke="#F5C518" stroke-width="2.5" stroke-linecap="round">
      <circle cx="13" cy="13" r="8" fill="rgba(245,197,24,0.08)"/>
      <line x1="19" y1="19" x2="27" y2="27"/>
      <circle cx="13" cy="13" r="2" fill="#F5C518"/>
    </svg>`;
  document.body.appendChild(cursor);

  let mouseX = 0, mouseY = 0;
  let curX = 0, curY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.addEventListener('mouseleave', () => cursor.classList.add('hidden'));
  document.addEventListener('mouseenter', () => cursor.classList.remove('hidden'));

  const tick = () => {
    curX += (mouseX - curX) * 0.25;
    curY += (mouseY - curY) * 0.25;
    cursor.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  };
  tick();

  const HOVERABLES = 'a, button, .game-card, .tab-btn, .folder-tab, .cctv-tab, .stamp, .gloss, .polaroid, .vote-buttons button, .quiz-option, .memo-card, .token, .lewis-3d, [role="button"], [data-hoverable]';

  document.addEventListener('mouseover', e => {
    if (e.target.closest(HOVERABLES)) cursor.classList.add('hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(HOVERABLES)) cursor.classList.remove('hover');
  });
}
