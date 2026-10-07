// =========================================================
// 1. CONFIGURATION & RELATIONSHIP SETUP
// =========================================================
const CONFIG = {
  birthdayName: "Sharanya Mamindlapally",
  creatorName: "Sathwik Mamindlapally",
  birthdayDate: "October 08, 2026 00:00:00",
  musicFile: "assets/birthday.mp3"
}

// Starts empty so ONLY your uploaded photos/videos appear
let galleryItems = Array.from({ length: 26 }, (_, i) => ({
  type: "image",
  src: `assets/photo (${i + 1}).jpeg`,
  title: `Memory ${i + 1}`,
  caption: "Sharanya Mamindlapally ❤️"
}));


// =========================================================
// 2. DOM INITIALIZATION
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  checkUploaderVisibility();
  loadSavedMedia();
  renderGallery();
  initCursor();
  initAmbientParticles();
  initLoader();
  initAudio();
  initCountdown();
  initModals();
  initSurprise();
  initBackToTop();
  initDualUploader();
});

// =========================================================
// 3. PERSISTENCE & STORAGE
// =========================================================
function checkUploaderVisibility() {
  const isLocked = localStorage.getItem("hideUploaderForever");
  const floatingBtn = document.getElementById("floatingUploadContainer");
  if (isLocked === "true" && floatingBtn) {
    floatingBtn.style.display = "none";
  }
}

function loadSavedMedia() {
  const savedHero = localStorage.getItem("customHeroImg");
  if (savedHero) {
    const heroImg = document.getElementById("heroDisplayImg");
    if (heroImg) heroImg.src = savedHero;
  }

  const customGallery = localStorage.getItem("customGalleryItems");
  if (customGallery) {
    try {
      galleryItems = JSON.parse(customGallery);
    } catch (e) {
      console.warn("Could not parse saved gallery", e);
    }
  }
}

function renderGallery() {
  const container = document.getElementById("masonryGallery");
  if (!container) return;

  container.innerHTML = "";

  galleryItems.forEach((item, index) => {
    const itemEl = document.createElement("div");
    itemEl.className = "gallery-item";
    itemEl.setAttribute("data-index", index);

    if (item.type === "video") {
      itemEl.innerHTML = `
        <div class="gallery-thumb-wrapper">
          <span class="media-type-pill video-pill">▶ VIDEO CLIP</span>
          <video src="${item.src}" muted loop playsinline class="gallery-video-thumb"></video>
          <div class="thumb-overlay">
            <span class="zoom-icon">▶</span>
            <span class="thumb-title">${item.title}</span>
          </div>
        </div>
      `;
    } else {
      itemEl.innerHTML = `
        <div class="gallery-thumb-wrapper">
          <img src="${item.src}" alt="${item.title}" class="gallery-img" />
          <div class="thumb-overlay">
            <span class="zoom-icon">+</span>
            <span class="thumb-title">${item.title}</span>
          </div>
        </div>
      `;
    }

    itemEl.addEventListener("click", () => openLightboxAt(index));
    container.appendChild(itemEl);
  });
}

// =========================================================
// 4. IMAGE COMPRESSION (FITS 30 PHOTOS SAFELY)
// =========================================================
function compressImage(file, maxWidth = 1200, quality = 0.78) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/JPEG", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// =========================================================
// 5. DUAL UPLOADER (1 HERO + MULTI GALLERY)
// =========================================================
function initDualUploader() {
  const openBtn = document.getElementById("openUploadModalBtn");
  const modal = document.getElementById("uploadModal");
  const closeBtn = document.getElementById("uploadCloseBtn");
  const lockBtn = document.getElementById("lockAndHideUploaderBtn");

  if (openBtn && modal) openBtn.addEventListener("click", () => openModal(modal));
  if (closeBtn && modal) closeBtn.addEventListener("click", () => closeModal(modal));

  // Lock and hide button permanently
  if (lockBtn) {
    lockBtn.addEventListener("click", () => {
      if (confirm("Are you sure you have added all photos? This will hide the upload button so Sharanya sees a clean site.")) {
        localStorage.setItem("hideUploaderForever", "true");
        const floatingBtn = document.getElementById("floatingUploadContainer");
        if (floatingBtn) floatingBtn.style.display = "none";
        closeModal(modal);
      }
    });
  }

  // Section 1: Main Top Hero Photo Handler
  const heroForm = document.getElementById("heroUploadForm");
  const heroFileInput = document.getElementById("heroFileInput");
  const heroStatusText = document.getElementById("heroStatusText");
  const heroSubmitBtn = document.getElementById("heroSubmitBtn");

  if (heroForm) {
    heroForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!heroFileInput.files || !heroFileInput.files[0]) return;

      const file = heroFileInput.files[0];
      if (heroStatusText) {
        heroStatusText.style.display = "block";
        heroStatusText.textContent = "Setting main photo...";
      }
      if (heroSubmitBtn) heroSubmitBtn.disabled = true;

      const dataUrl = await compressImage(file, 1400, 0.85);
      const heroImg = document.getElementById("heroDisplayImg");
      if (heroImg) heroImg.src = dataUrl;

      try {
        localStorage.setItem("customHeroImg", dataUrl);
      } catch (err) {
        console.warn("Storage full; hero loaded for current session.");
      }

      if (heroStatusText) heroStatusText.textContent = "Main photo updated!";
      if (heroSubmitBtn) heroSubmitBtn.disabled = false;
      setTimeout(() => {
        heroForm.reset();
        if (heroStatusText) heroStatusText.style.display = "none";
      }, 1500);
    });
  }

  // Section 2: Memory Vault Multi-Uploader Handler
  const galleryForm = document.getElementById("galleryUploadForm");
  const galleryFileInput = document.getElementById("galleryFileInput");
  const galleryStatusText = document.getElementById("galleryStatusText");
  const gallerySubmitBtn = document.getElementById("gallerySubmitBtn");

  if (galleryForm) {
    galleryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const files = Array.from(galleryFileInput.files);
      if (!files.length) return;

      if (galleryStatusText) {
        galleryStatusText.style.display = "block";
        galleryStatusText.textContent = `Processing ${files.length} memory item(s)...`;
      }
      if (gallerySubmitBtn) gallerySubmitBtn.disabled = true;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith("video/");

        if (galleryStatusText) {
          galleryStatusText.textContent = `Adding ${i + 1} of ${files.length}: ${file.name}`;
        }

        const dataUrl = await compressImage(file, 1200, 0.78);
        const rawName = file.name.replace(/\.[^/.]+$/, "");
        const cleanTitle = rawName.replace(/[-_]/g, " ");

        galleryItems.push({
          type: isVideo ? "video" : "image",
          src: dataUrl,
          title: cleanTitle || "Our Memory",
          caption: "Sharanya Mamindlapally ❤️"
        });
      }

      try {
        localStorage.setItem("customGalleryItems", JSON.stringify(galleryItems));
      } catch (err) {
        console.warn("Storage full; media active in session.");
      }
      renderGallery();

      if (galleryStatusText) galleryStatusText.textContent = "All memories added to gallery!";
      if (gallerySubmitBtn) gallerySubmitBtn.disabled = false;

      setTimeout(() => {
        galleryForm.reset();
        if (galleryStatusText) galleryStatusText.style.display = "none";
        closeModal(modal);
      }, 1000);
    });
  }
}

// =========================================================
// 6. LIGHTBOX CONTROLLER
// =========================================================
let currentMediaIndex = 0;

function openLightboxAt(index) {
  const modal = document.getElementById("lightboxModal");
  const modalImg = document.getElementById("lightboxImg");
  const modalVideo = document.getElementById("lightboxVideo");
  const modalCaption = document.getElementById("lightboxCaption");

  if (!modal || index < 0 || index >= galleryItems.length) return;
  currentMediaIndex = index;
  const item = galleryItems[currentMediaIndex];

  if (item.type === "video") {
    if (modalImg) modalImg.style.display = "none";
    if (modalVideo) {
      modalVideo.style.display = "block";
      modalVideo.src = item.src;
      modalVideo.play().catch(() => {});
    }
  } else {
    if (modalVideo) {
      modalVideo.pause();
      modalVideo.src = "";
      modalVideo.style.display = "none";
    }
    if (modalImg) {
      modalImg.style.display = "block";
      modalImg.src = item.src;
    }
  }

  if (modalCaption) modalCaption.innerHTML = item.caption || item.title;
  openModal(modal);
}

document.getElementById("lightboxClose")?.addEventListener("click", () => {
  const video = document.getElementById("lightboxVideo");
  if (video) { video.pause(); video.src = ""; }
  closeModal(document.getElementById("lightboxModal"));
});

document.getElementById("lightboxPrev")?.addEventListener("click", () => {
  openLightboxAt((currentMediaIndex - 1 + galleryItems.length) % galleryItems.length);
});

document.getElementById("lightboxNext")?.addEventListener("click", () => {
  openLightboxAt((currentMediaIndex + 1) % galleryItems.length);
});

// =========================================================
// 7. AMBIENT PARTICLES
// =========================================================
function initAmbientParticles() {
  const canvas = document.getElementById("ambientCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = Array.from({ length: 45 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.8 + 0.5,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -(Math.random() * 0.4 + 0.1),
    alpha: Math.random() * 0.5 + 0.2,
    color: Math.random() > 0.6 ? "#e5c185" : "#f472b6"
  }));

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < 0) { p.y = height + 10; p.x = Math.random() * width; }
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

// =========================================================
// 8. CINEMATIC LOADER
// =========================================================
function initLoader() {
  const loader = document.getElementById("cinematicLoader");
  const fill = document.getElementById("loaderProgressFill");
  const enterBtn = document.getElementById("enterBtn");
  const phaseText = document.getElementById("loaderPhaseText");

  if (!loader || !fill || !enterBtn) return;

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 10;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      fill.style.width = "100%";
      setTimeout(() => {
        if (phaseText) phaseText.textContent = "Celebration is ready for Sharanya.";
        enterBtn.removeAttribute("disabled");
      }, 300);
    } else {
      fill.style.width = `${progress}%`;
    }
  }, 90);

  enterBtn.addEventListener("click", () => {
    loader.classList.add("fade-out");
    document.body.classList.remove("loading-active");

    const audio = document.getElementById("bgAudio");
    if (audio) {
      audio.play().then(() => updateAudioBtnState(true)).catch(() => {});
    }
  });
}

// =========================================================
// 9. AUDIO
// =========================================================
function initAudio() {
  const audio = document.getElementById("bgAudio");
  const toggleBtn = document.getElementById("audioToggleBtn");
  if (!audio || !toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().then(() => updateAudioBtnState(true)).catch(console.warn);
    } else {
      audio.pause();
      updateAudioBtnState(false);
    }
  });
}

function updateAudioBtnState(isPlaying) {
  const toggleBtn = document.getElementById("audioToggleBtn");
  if (!toggleBtn) return;

  const playIcon = toggleBtn.querySelector(".audio-icon-play");
  const pauseIcon = toggleBtn.querySelector(".audio-icon-pause");
  const label = toggleBtn.querySelector(".audio-label");

  toggleBtn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
  if (isPlaying) {
    if (playIcon) playIcon.style.display = "none";
    if (pauseIcon) pauseIcon.style.display = "inline-flex";
    if (label) label.textContent = "PAUSE MUSIC";
  } else {
    if (playIcon) playIcon.style.display = "inline-flex";
    if (pauseIcon) pauseIcon.style.display = "none";
    if (label) label.textContent = "PLAY MUSIC";
  }
}

// =========================================================
// 10. COUNTDOWN (OCTOBER 8TH TARGET)
// =========================================================
function initCountdown() {
  const daysEl = document.getElementById("timerDays");
  const hoursEl = document.getElementById("timerHours");
  const minutesEl = document.getElementById("timerMinutes");
  const secondsEl = document.getElementById("timerSeconds");
  const statusEl = document.getElementById("countdownStatus");

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  const targetDate = new Date(CONFIG.birthdayDate).getTime();

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      if (statusEl) statusEl.textContent = `It's October 8th! Happy Birthday to my gorgeous girlfriend Sharanya!`;
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, "0");
    hoursEl.textContent = String(hours).padStart(2, "0");
    minutesEl.textContent = String(minutes).padStart(2, "0");
    secondsEl.textContent = String(seconds).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

// =========================================================
// 11. MODALS CONTROLLER
// =========================================================
function initModals() {
  const noteModal = document.getElementById("noteModal");
  const openNoteBtn = document.getElementById("openNoteBtn");
  const triggerHeartNote = document.getElementById("triggerHeartNote");
  const noteClose = document.getElementById("noteClose");
  const noteUnderstoodBtn = document.getElementById("noteUnderstoodBtn");

  if (noteModal) {
    if (openNoteBtn) openNoteBtn.addEventListener("click", () => openModal(noteModal));
    if (triggerHeartNote) triggerHeartNote.addEventListener("click", () => openModal(noteModal));
    if (noteClose) noteClose.addEventListener("click", () => closeModal(noteModal));
    if (noteUnderstoodBtn) noteUnderstoodBtn.addEventListener("click", () => closeModal(noteModal));
  }

  const overlays = document.querySelectorAll(".modal-overlay");
  overlays.forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        const video = overlay.querySelector("video");
        if (video) { video.pause(); video.src = ""; }
        closeModal(overlay);
      }
    });
  });
}

function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add("active");
  modalEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove("active");
  modalEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

// =========================================================
// 12. SURPRISE & CONFETTI
// =========================================================
function initSurprise() {
  const openBtn = document.getElementById("openSurpriseBtn");
  const heroSurpriseTrigger = document.getElementById("heroSurpriseTrigger");
  const modal = document.getElementById("surpriseModal");
  const closeBtn = document.getElementById("surpriseClose");
  const doneBtn = document.getElementById("surpriseDoneBtn");

  function triggerCelebration() {
    if (modal) openModal(modal);
    fireConfetti();
  }

  if (openBtn) openBtn.addEventListener("click", triggerCelebration);
  if (heroSurpriseTrigger) heroSurpriseTrigger.addEventListener("click", triggerCelebration);
  if (closeBtn) closeBtn.addEventListener("click", () => closeModal(modal));
  if (doneBtn) doneBtn.addEventListener("click", () => closeModal(modal));
}

function fireConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const pieces = Array.from({ length: 140 }, () => ({
    x: width / 2,
    y: height / 2 + 50,
    w: Math.random() * 8 + 4,
    h: Math.random() * 8 + 4,
    vx: (Math.random() - 0.5) * 18,
    vy: (Math.random() - 0.7) * 20,
    rot: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 10,
    color: ["#e5c185", "#f472b6", "#a855f7", "#ffffff", "#ffd166"][Math.floor(Math.random() * 5)],
    opacity: 1
  }));

  let frameCount = 0;
  function updateConfetti() {
    ctx.clearRect(0, 0, width, height);
    for (let p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.vx *= 0.98;
      p.rot += p.rotSpeed;
      if (frameCount > 60) p.opacity -= 0.015;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(p.opacity, 0);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    frameCount++;
    if (frameCount < 160) {
      requestAnimationFrame(updateConfetti);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  }
  requestAnimationFrame(updateConfetti);
}

// =========================================================
// 13. CURSOR & SCROLL UTILITIES
// =========================================================
function initCursor() {
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (!dot || !ring) return;

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;
  let hasMoved = false;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!hasMoved) {
      dot.style.opacity = "1";
      ring.style.opacity = "1";
      hasMoved = true;
    }
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  });

  function renderRing() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(renderRing);
  }
  requestAnimationFrame(renderRing);

  document.querySelectorAll("a, button, .gallery-item, input").forEach((el) => {
    el.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
    el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
  });
}

function initBackToTop() {
  const btn = document.getElementById("backToTopBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
function toggleAudio() {
  const audio = document.getElementById("bgAudio");
  const btn = document.getElementById("musicToggleBtn");
  
  if (!audio) return;

  if (audio.paused) {
    audio.play().then(() => {
      if (btn) btn.innerText = "❚❚ PAUSE MUSIC";
    }).catch(err => {
      console.log("Audio play error:", err);
    });
  } else {
    audio.pause();
    if (btn) btn.innerText = "▶ PLAY MUSIC";
  }
}
function toggleAudio() {
  const audio = document.getElementById("bgAudio");
  const btn = document.getElementById("musicToggleBtn");
  if (!audio) return;

  if (audio.paused) {
    audio.play().then(() => {
      if (btn) btn.innerText = "❚❚ PAUSE MUSIC";
    }).catch(err => {
      console.error("Audio playback error details:", err);
      if (audio.error) {
        console.error("Media Error Code:", audio.error.code, audio.error.message);
      }
    });
  } else {
    audio.pause();
    if (btn) btn.innerText = "▶ PLAY MUSIC";
  }
}