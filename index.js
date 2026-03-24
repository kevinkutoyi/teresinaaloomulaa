/* =============================================================
   TRIBUTE PAGE — SCRIPTS
   tribute.js
   ============================================================= */

/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
let tributes = JSON.parse(localStorage.getItem('tributes') || '[]');
let sortNewest = true;
let galleryImages = [];

/* ══════════════════════════════════════════
   INIT — run after DOM is ready
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initCharCounter();
  initPortraitUpload();
  initGalleryUpload();
  initLightbox();
  render();
});

/* ══════════════════════════════════════════
   CHAR COUNTER
══════════════════════════════════════════ */
function initCharCounter() {
  const tributeEl = document.getElementById('tribute');
  const countEl   = document.getElementById('count');
  tributeEl.addEventListener('input', () => {
    countEl.textContent = tributeEl.value.length;
  });
}

/* ══════════════════════════════════════════
   PORTRAIT UPLOAD
══════════════════════════════════════════ */
function initPortraitUpload() {
  document.getElementById('portrait-input').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const display = document.getElementById('portrait-display');
      display.innerHTML = `<img class="hero-portrait" src="${e.target.result}" alt="Memorial portrait"/>`;
    };
    reader.readAsDataURL(file);
  });
}

/* ══════════════════════════════════════════
   EDITABLE NAME & YEARS
══════════════════════════════════════════ */
function editName() {
  const el  = document.getElementById('memorial-name');
  const val = prompt('Enter the name of the person being honoured:', el.textContent);
  if (val && val.trim()) el.textContent = val.trim();
}

function editYears() {
  const el  = document.getElementById('memorial-years');
  const val = prompt('Enter the years (e.g. 1945 — 2024):', el.textContent);
  if (val && val.trim()) el.textContent = val.trim();
}

/* ══════════════════════════════════════════
   GALLERY
══════════════════════════════════════════ */
function initGalleryUpload() {
  bindGalleryInput();
}

function bindGalleryInput() {
  const input = document.getElementById('gallery-input');
  if (!input) return;
  input.addEventListener('change', function () {
    Array.from(this.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        galleryImages.push(e.target.result);
        renderGallery();
      };
      reader.readAsDataURL(file);
    });
  });
}

function renderGallery() {
  const grid = document.getElementById('gallery-grid');

  const placeholderSvg = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>`;

  const addTile = `
    <div class="gallery-item gallery-add">
      <label for="gallery-input">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        Add Photo
      </label>
      <input type="file" id="gallery-input" accept="image/*" multiple/>
    </div>`;

  const totalSlots = Math.max(3, galleryImages.length);
  let html = '';

  for (let i = 0; i < totalSlots; i++) {
    if (i < galleryImages.length) {
      html += `
        <div class="gallery-item" onclick="openLightbox('${galleryImages[i]}')">
          <img src="${galleryImages[i]}" alt="Memory photo ${i + 1}"/>
          <div class="overlay"><span class="overlay-label">View</span></div>
        </div>`;
    } else {
      html += `
        <div class="gallery-item">
          <div class="gallery-placeholder">${placeholderSvg}<span>Memory</span></div>
        </div>`;
    }
  }

  grid.innerHTML = html + addTile;
  bindGalleryInput(); // re-bind after DOM rebuild
}

/* ══════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════ */
function initLightbox() {
  document.getElementById('lightbox').addEventListener('click', function (e) {
    if (e.target === this || e.target.closest('.lightbox-close')) {
      this.classList.remove('open');
    }
  });
}

function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('open');
}

/* ══════════════════════════════════════════
   SUBMIT TRIBUTE
══════════════════════════════════════════ */
function submitTribute() {
  const name     = document.getElementById('name').value.trim();
  const relation = document.getElementById('relation').value.trim();
  const message  = document.getElementById('tribute').value.trim();

  if (!name)    return shake('name');
  if (!message) return shake('tribute');

  const entry = {
    id: Date.now(),
    name,
    relation: relation || 'Friend',
    message,
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    likes: 0,
    liked: false
  };

  tributes.unshift(entry);
  save();
  render();

  // Reset form
  document.getElementById('name').value     = '';
  document.getElementById('relation').value = '';
  document.getElementById('tribute').value  = '';
  document.getElementById('count').textContent = '0';

  showToast('Tribute posted — thank you ✦');
  document.getElementById('tributes-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ══════════════════════════════════════════
   RENDER TRIBUTES
══════════════════════════════════════════ */
function render() {
  const grid   = document.getElementById('tributes-grid');
  const empty  = document.getElementById('empty-state');
  const sorted = [...tributes].sort((a, b) => sortNewest ? b.id - a.id : a.id - b.id);

  document.getElementById('tribute-count').textContent =
    tributes.length === 1 ? '1 tribute shared' : `${tributes.length} tributes shared`;

  if (!sorted.length) {
    grid.innerHTML = '';
    grid.appendChild(empty);
    return;
  }

  if (empty.parentNode === grid) grid.removeChild(empty);

  grid.innerHTML = sorted.map((t, i) => `
    <div class="tribute-card" style="animation-delay:${i * 0.06}s">
      <div class="tribute-card-inner">
        <div class="tribute-avatar">${getInitials(t.name)}</div>
        <div class="tribute-card-content">
          <p class="tribute-body">${escHtml(t.message)}</p>
          <div class="tribute-footer">
            <div class="tribute-author">
              <span class="tribute-name">${escHtml(t.name)}</span>
              <span class="tribute-relation">${escHtml(t.relation)}</span>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
              <span class="tribute-date">${t.date}</span>
              <button class="heart-btn ${t.liked ? 'liked' : ''}" onclick="toggleLike(${t.id})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="${t.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                ${t.likes || ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════
   LIKE
══════════════════════════════════════════ */
function toggleLike(id) {
  const t = tributes.find((x) => x.id === id);
  if (!t) return;
  t.liked  = !t.liked;
  t.likes  = (t.likes || 0) + (t.liked ? 1 : -1);
  save();
  render();
}

/* ══════════════════════════════════════════
   SORT
══════════════════════════════════════════ */
function toggleSort() {
  sortNewest = !sortNewest;
  document.getElementById('sort-btn').textContent = sortNewest ? 'Newest First' : 'Oldest First';
  render();
}

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function save() {
  localStorage.setItem('tributes', JSON.stringify(tributes));
}

function escHtml(s) {
  return s
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

function getInitials(name) {
  return name.trim().split(/\s+/).map((w) => w[0].toUpperCase()).slice(0, 2).join('');
}

function shake(id) {
  const el = document.getElementById(id);
  el.style.borderColor = '#e57373';
  el.focus();
  el.style.animation = 'none';
  void el.offsetHeight; // force reflow
  el.style.animation = 'shakeInput 0.4s ease';
  setTimeout(() => { el.style.borderColor = ''; el.style.animation = ''; }, 1200);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}