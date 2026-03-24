/* =============================================================
   TRIBUTE PAGE — SCRIPTS
   tribute.js
   ============================================================= */

/* ══════════════════════════════════════════
   STATE  (loaded from localStorage on boot)
══════════════════════════════════════════ */
let tributes      = JSON.parse(localStorage.getItem('tributes')      || '[]');
let galleryImages = JSON.parse(localStorage.getItem('galleryImages') || '[]');
let sortNewest    = true;

/* ══════════════════════════════════════════
   STORAGE HELPERS
══════════════════════════════════════════ */
function saveTributes()      { localStorage.setItem('tributes',      JSON.stringify(tributes));      }
function saveGallery()       { localStorage.setItem('galleryImages', JSON.stringify(galleryImages)); }
function savePortrait(src)   { localStorage.setItem('portrait',      src);                          }
function saveName(val)       { localStorage.setItem('memorialName',  val);                          }
function saveYears(val)      { localStorage.setItem('memorialYears', val);                          }

/* ══════════════════════════════════════════
   INIT — run after DOM is ready
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  restorePageState();
  initCharCounter();
  initPortraitUpload();
  initGalleryUpload();
  initLightbox();
  render();
});

/* ══════════════════════════════════════════
   RESTORE ALL SAVED STATE ON PAGE LOAD
══════════════════════════════════════════ */
function restorePageState() {
  // Portrait
  const savedPortrait = localStorage.getItem('portrait');
  if (savedPortrait) {
    document.getElementById('portrait-display').innerHTML =
      `<img class="hero-portrait" src="${savedPortrait}" alt="Memorial portrait"/>`;
  }

  // Name & years
  const savedName  = localStorage.getItem('memorialName');
  const savedYears = localStorage.getItem('memorialYears');
  if (savedName)  document.getElementById('memorial-name').textContent  = savedName;
  if (savedYears) document.getElementById('memorial-years').textContent = savedYears;

  // Gallery — render tiles from saved images
  if (galleryImages.length > 0) renderGallery();
}

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
      const src     = e.target.result;
      const display = document.getElementById('portrait-display');
      display.innerHTML = `<img class="hero-portrait" src="${src}" alt="Memorial portrait"/>`;
      savePortrait(src);   // persist to localStorage
      showToast('Portrait saved ✦');
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
  if (val && val.trim()) {
    el.textContent = val.trim();
    saveName(val.trim());
  }
}

function editYears() {
  const el  = document.getElementById('memorial-years');
  const val = prompt('Enter the years (e.g. 1945 — 2024):', el.textContent);
  if (val && val.trim()) {
    el.textContent = val.trim();
    saveYears(val.trim());
  }
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
  // Remove old listener by replacing the element clone trick
  const fresh = input.cloneNode(true);
  input.parentNode.replaceChild(fresh, input);
  fresh.addEventListener('change', function () {
    const files = Array.from(this.files);
    let loaded  = 0;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        galleryImages.push(e.target.result);
        loaded++;
        if (loaded === files.length) {
          saveGallery();          // persist entire gallery array
          renderGallery();
          showToast(`${files.length === 1 ? 'Photo' : files.length + ' photos'} added to gallery ✦`);
        }
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

  // Show at least 3 slots; grow as more images are added
  const totalSlots = Math.max(3, galleryImages.length);
  let html = '';

  for (let i = 0; i < totalSlots; i++) {
    if (i < galleryImages.length) {
      // Real uploaded photo — show delete button on hover
      html += `
        <div class="gallery-item" data-index="${i}">
          <img src="${galleryImages[i]}" alt="Memory photo ${i + 1}" onclick="openLightbox(${i})"/>
          <div class="overlay">
            <span class="overlay-label" onclick="openLightbox(${i})">View</span>
            <button class="gallery-delete-btn" onclick="deleteGalleryPhoto(event, ${i})" title="Remove photo">✕</button>
          </div>
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

/* ── Delete a gallery photo ── */
function deleteGalleryPhoto(e, index) {
  e.stopPropagation();
  if (!confirm('Remove this photo from the gallery?')) return;
  galleryImages.splice(index, 1);
  saveGallery();
  renderGallery();
  showToast('Photo removed');
}

/* ══════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════ */
let lightboxIndex = 0;

function initLightbox() {
  document.getElementById('lightbox').addEventListener('click', function (e) {
    if (e.target === this || e.target.closest('.lightbox-close')) {
      this.classList.remove('open');
    }
  });
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')      lb.classList.remove('open');
    if (e.key === 'ArrowRight')  navigateLightbox(1);
    if (e.key === 'ArrowLeft')   navigateLightbox(-1);
  });
}

function openLightbox(index) {
  lightboxIndex = index;
  document.getElementById('lightbox-img').src = galleryImages[index];
  document.getElementById('lightbox').classList.add('open');
}

function navigateLightbox(dir) {
  lightboxIndex = (lightboxIndex + dir + galleryImages.length) % galleryImages.length;
  document.getElementById('lightbox-img').src = galleryImages[lightboxIndex];
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
  saveTributes();
  render();

  // Reset form
  document.getElementById('name').value        = '';
  document.getElementById('relation').value    = '';
  document.getElementById('tribute').value     = '';
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
  t.liked = !t.liked;
  t.likes = (t.likes || 0) + (t.liked ? 1 : -1);
  saveTributes();
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
  void el.offsetHeight;
  el.style.animation = 'shakeInput 0.4s ease';
  setTimeout(() => { el.style.borderColor = ''; el.style.animation = ''; }, 1200);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}
