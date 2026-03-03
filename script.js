// Mobile menu
(() => {
  const toggle = document.querySelector('[data-nav-toggle]');
  const links = document.querySelector('[data-nav-links]');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Đóng menu' : 'Mở menu');
  });

  // Close menu when clicking a link (mobile UX)
  links.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => {
      if (links.classList.contains('is-open')) {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Mở menu');
      }
    });
  });
})();

// Early access form (demo)
(() => {
  const form = document.getElementById('early-access-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get('email') || '');
    const name = String(fd.get('name') || '');
    alert(`Đăng ký thành công!\nTên: ${name}\nEmail: ${email}`);
    form.reset();

    // TODO: Replace with your real submit:
    // - Google Form (via link/QR)
    // - Your API endpoint (fetch POST)
  });
})();

// QR mock (replace with real QR image when you have the form URL)
(() => {
  const grid = document.getElementById('qr-grid');
  if (!grid) return;

  // deterministic pseudo-random based on a fixed seed (so the QR doesn't change each refresh)
  let seed = 20260302;
  function rand() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  const size = 16 * 16;
  for (let i = 0; i < size; i++) {
    const dot = document.createElement('div');
    dot.className = 'qr-dot' + (rand() > 0.52 ? ' on' : '');
    grid.appendChild(dot);
  }

  // Add 3 finder squares (top-left, top-right, bottom-left)
  function finder(x, y) {
    const N = 16;
    const idx = (r, c) => r * N + c;
    for (let r = y; r < y + 5; r++) {
      for (let c = x; c < x + 5; c++) {
        const cell = grid.children[idx(r, c)];
        if (!cell) continue;
        const edge = (r === y || r === y+4 || c === x || c === x+4);
        cell.classList.toggle('on', edge || (r === y+2 && c === x+2));
      }
    }
  }
  finder(0,0);
  finder(11,0);
  finder(0,11);
})();
