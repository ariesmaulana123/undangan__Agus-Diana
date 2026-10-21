/**
 * MODERN JAVANESE LUXURY WEDDING
 * Diana Putri T. & Agus Hermawan
 * Main Application Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // Target Wedding Date (e.g. 24 October 2026, 08:00 WIB)
  const WEDDING_DATE = new Date('2026-12-05T08:00:00+07:00').getTime();

  // DOM Elements
  const openingCover = document.getElementById('opening-cover');
  const btnOpenInvitation = document.getElementById('btnOpenInvitation');
  const floatingMusicBtn = document.getElementById('floatingMusicBtn');
  const musicIcon = document.getElementById('musicIcon');
  const toastNotification = document.getElementById('toastNotification');
  const guestNameElement = document.getElementById('guestName');
  const rsvpForm = document.getElementById('rsvpForm');
  const wishesListContainer = document.getElementById('wishesList');

  /* ----------------------------------------------------
     1. URL GUEST NAME PARSER
  ---------------------------------------------------- */
  function parseGuestName() {
    const urlParams = new URLSearchParams(window.location.search);
    const guestParam = urlParams.get('to') || urlParams.get('u') || urlParams.get('p') || urlParams.get('nama');
    if (guestParam && guestNameElement) {
      guestNameElement.textContent = decodeURIComponent(guestParam.replace(/\+/g, ' '));
      const rsvpNameInput = document.getElementById('rsvpName');
      if (rsvpNameInput) {
        rsvpNameInput.value = decodeURIComponent(guestParam.replace(/\+/g, ' '));
      }
    }
  }
  parseGuestName();

  /* ----------------------------------------------------
     2. AUDIO INTEGRATION
  ---------------------------------------------------- */
  if (window.WeddingAudio && floatingMusicBtn) {
    window.WeddingAudio.setUIElements(floatingMusicBtn, musicIcon);
  }

  /* ----------------------------------------------------
     3. COVER UNLOCK & REVEAL INNER PAGE
  ---------------------------------------------------- */
  const weddingVideo = document.getElementById('weddingVideo');
  const sectionVideo = document.getElementById('section-video');

  function openInvitation() {
    // 1. Unlock body scroll
    document.body.classList.remove('cover-locked');
    document.body.classList.add('invitation-opened');

    // 2. Animate cover overlay out
    if (openingCover) {
      openingCover.classList.add('cover-opened');
    }

    // 3. Make sure scroll starts cleanly at top (Gambar 2: Section Hero)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // 4. REQUIREMENT 3: Start background music audio immediately
    if (window.WeddingAudio) {
      window.WeddingAudio.play();
    }

    // Video starts paused at 0 until user scrolls down to it
    if (weddingVideo) {
      weddingVideo.pause();
      weddingVideo.currentTime = 0;
    }
  }

  window.bukaUndangan = openInvitation;

  if (btnOpenInvitation) {
    btnOpenInvitation.addEventListener('click', openInvitation);
  }

  /* ----------------------------------------------------
     VIDEO VIEWPORT AUTOPLAY & AUDIO ORCHESTRATION (NO CLASH)
  ---------------------------------------------------- */
  if (weddingVideo && sectionVideo) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!document.body.classList.contains('invitation-opened')) return;

        if (entry.isIntersecting) {
          // User scrolled into video section
          document.body.classList.add('in-video-section');

          // 1. Pause background music so it doesn't clash with video
          if (window.WeddingAudio && window.WeddingAudio.isPlaying) {
            window.WeddingAudio.pause();
          }

          // 2. Play video with sound
          weddingVideo.muted = false;
          weddingVideo.volume = 1.0;
          weddingVideo.play().catch(() => {
            weddingVideo.muted = true;
            weddingVideo.play().catch(() => {});
          });
        } else {
          // User scrolled away from video (back to hero or forward to rest of invitation)
          document.body.classList.remove('in-video-section');

          // 1. Pause video
          weddingVideo.pause();

          // 2. Resume background music automatically
          if (window.WeddingAudio && !window.WeddingAudio.isPlaying) {
            window.WeddingAudio.play();
          }
        }
      });
    }, { threshold: 0.35 });

    videoObserver.observe(sectionVideo);
  }

  if (weddingVideo) {
    // Tap on video to toggle play / pause
    weddingVideo.addEventListener('click', () => {
      if (weddingVideo.paused) {
        if (window.WeddingAudio && window.WeddingAudio.isPlaying) {
          window.WeddingAudio.pause();
        }
        weddingVideo.muted = false;
        weddingVideo.volume = 1.0;
        weddingVideo.play().catch(() => {});
      } else {
        weddingVideo.pause();
        if (window.WeddingAudio && !window.WeddingAudio.isPlaying) {
          window.WeddingAudio.play();
        }
      }
    });

    weddingVideo.addEventListener('play', () => {
      if (!weddingVideo.muted && window.WeddingAudio && window.WeddingAudio.isPlaying) {
        window.WeddingAudio.pause();
      }
    });
  }

  // Unmute video on first user interaction if browser restricted unmuted autoplay
  const autoUnmuteVideo = () => {
    if (weddingVideo && weddingVideo.muted && document.body.classList.contains('in-video-section')) {
      weddingVideo.muted = false;
      weddingVideo.volume = 1.0;
    }
  };
  document.addEventListener('click', autoUnmuteVideo, { passive: true });
  document.addEventListener('touchstart', autoUnmuteVideo, { passive: true });

  /* ----------------------------------------------------
     4. INTERSECTION OBSERVER FOR SCROLL ANIMATIONS
  ---------------------------------------------------- */
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -30px 0px',
    threshold: 0.05
  };

  const animationObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view', 'animated');
        // Unobserve once animated for performance
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-animate], .curtain-reveal').forEach(el => {
    animationObserver.observe(el);
  });

  /* ----------------------------------------------------
     5. LIVE COUNTDOWN TIMER
  ---------------------------------------------------- */
  function initCountdown() {
    const daysEl = document.getElementById('countDays');
    const hoursEl = document.getElementById('countHours');
    const minsEl = document.getElementById('countMins');
    const secsEl = document.getElementById('countSecs');

    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    function updateTimer() {
      const now = new Date().getTime();
      const difference = WEDDING_DATE - now;

      if (difference <= 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minsEl.textContent = '00';
        secsEl.textContent = '00';
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      daysEl.textContent = String(days).padStart(2, '0');
      hoursEl.textContent = String(hours).padStart(2, '0');
      minsEl.textContent = String(minutes).padStart(2, '0');
      secsEl.textContent = String(seconds).padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }
  initCountdown();

  /* ----------------------------------------------------
     6. ADD TO GOOGLE CALENDAR
  ---------------------------------------------------- */
  const btnAddToCalendar = document.getElementById('btnAddToCalendar');
  if (btnAddToCalendar) {
    btnAddToCalendar.addEventListener('click', () => {
      const title = encodeURIComponent("The Wedding of Diana Putri T. & Agus Hermawan");
      const details = encodeURIComponent("Pernikahan Adat Jawa Modern Diana Putri T. & Agus Hermawan. Bertempat di Sasana Joglo Kencana & Grand Joglo Ballroom.");
      const location = encodeURIComponent("Sasana Joglo Kencana, Yogyakarta");
      const startIso = "20261205T010000Z"; // 08:00 WIB is 01:00 UTC
      const endIso = "20261205T140000Z";   // 21:00 WIB is 14:00 UTC

      const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
      window.open(calendarUrl, '_blank');
    });
  }

  /* ----------------------------------------------------
     7. RSVP FORM & WHATSAPP REDIRECT
  ---------------------------------------------------- */
  const DEFAULT_PHONE = '6281234567890'; // Destination WhatsApp number

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('rsvpName').value.trim();
      const guestCount = document.getElementById('rsvpCount').value;
      const status = document.getElementById('rsvpStatus').value;
      const message = document.getElementById('rsvpMessage').value.trim();

      if (!name) {
        showToast('Mohon masukkan nama Anda.');
        return;
      }

      // Save wish locally
      addWishToWall(name, status, message);

      // Format WhatsApp Message
      const waText = 
`*KONFIRMASI KEHADIRAN PERNIKAHAN*
*Diana & Agus Wedding*
----------------------------------------
*Nama:* ${name}
*Jumlah Tamu:* ${guestCount} Orang
*Status Kehadiran:* ${status}
*Ucapan & Doa:* 
"${message || 'Semoga menjadi keluarga sakinah, mawaddah, warahmah.'}"
----------------------------------------
Matur nuwun sanget.`;

      const encodedText = encodeURIComponent(waText);
      const waUrl = `https://api.whatsapp.com/send?phone=${DEFAULT_PHONE}&text=${encodedText}`;

      showToast('Membuka WhatsApp untuk mengirim konfirmasi...');
      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 600);

      rsvpForm.reset();
    });
  }

  /* ----------------------------------------------------
     8. INTERACTIVE WISHES WALL (BUKU TAMU DIGITAL)
  ---------------------------------------------------- */
  const INITIAL_WISHES = [
    {
      name: "Bpk. H. Bambang & Keluarga",
      status: "Hadir",
      message: "Ndherek bingah dhumateng Mas Agus & Mbak Diana. Mugi dados kaluwarga ingkang tansah pinaringan berkah, ayem tentrem, lan sakinah mawaddah warahmah.",
      time: "2 jam yang lalu"
    },
    {
      name: "Siti Rahmawati, S.Ked.",
      status: "Hadir",
      message: "Selamat ya Diana sahabatku! Cantik banget manglingi. Semoga lancar acaranya sampai hari H dan bahagia selamanya bersama suami tercinta.",
      time: "4 jam yang lalu"
    },
    {
      name: "Dimas Arya & Istri",
      status: "Hadir",
      message: "Selamat menempuh hidup baru Mas Agus & Mbak Diana! Semoga selalu rukun dan saling melengkapi dalam setiap langkah perjalanan rumah tangga.",
      time: "Kemarin"
    }
  ];

  function loadWishes() {
    if (!wishesListContainer) return;

    let storedWishes = [];
    try {
      storedWishes = JSON.parse(localStorage.getItem('wedding_wishes_diana_agus')) || [];
    } catch (e) {
      storedWishes = [];
    }

    const allWishes = [...storedWishes, ...INITIAL_WISHES];
    wishesListContainer.innerHTML = '';

    allWishes.forEach(item => {
      renderWishCard(item);
    });
  }

  function renderWishCard(item) {
    const card = document.createElement('div');
    card.className = 'wish-card';

    let badgeClass = 'wish-status-hadir';
    if (item.status.includes('Tidak')) badgeClass = 'wish-status-tidak';
    if (item.status.includes('Pasti') || item.status.includes('Ragu')) badgeClass = 'wish-status-ragu';

    card.innerHTML = `
      <div class="wish-header">
        <span class="wish-author">${escapeHtml(item.name)}</span>
        <span class="wish-status-badge ${badgeClass}">${escapeHtml(item.status)}</span>
      </div>
      <p class="wish-message">${escapeHtml(item.message || 'Ndherek mangayubagya.')}</p>
      <div class="wish-time">${item.time}</div>
    `;

    wishesListContainer.appendChild(card);
  }

  function addWishToWall(name, status, message) {
    const newWish = {
      name: name,
      status: status,
      message: message,
      time: "Baru saja"
    };

    let storedWishes = [];
    try {
      storedWishes = JSON.parse(localStorage.getItem('wedding_wishes_diana_agus')) || [];
    } catch (e) {
      storedWishes = [];
    }

    storedWishes.unshift(newWish);
    try {
      localStorage.setItem('wedding_wishes_diana_agus', JSON.stringify(storedWishes));
    } catch (e) {}

    loadWishes();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  loadWishes();

  /* ----------------------------------------------------
     9. WEDDING GIFT COPY TO CLIPBOARD & QRIS MODAL
  ---------------------------------------------------- */
  document.querySelectorAll('.btn-copy-acc').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const button = e.currentTarget;
      const accNumber = button.getAttribute('data-acc');
      const originalHtml = button.innerHTML;

      const triggerSuccess = () => {
        button.classList.add('copied');
        button.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>✓ Nomor Rekening Tersalin!</span>
        `;
        showToast('Nomor rekening berhasil disalin ke clipboard.');

        setTimeout(() => {
          button.classList.remove('copied');
          button.innerHTML = originalHtml;
        }, 2500);
      };

      if (accNumber) {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(accNumber).then(triggerSuccess).catch(() => {
            fallbackCopy(accNumber, triggerSuccess);
          });
        } else {
          fallbackCopy(accNumber, triggerSuccess);
        }
      }
    });
  });

  function fallbackCopy(text, onSuccess) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast('Gagal menyalin secara otomatis.');
    }
    document.body.removeChild(tempInput);
  }

  // QRIS Modal Controls
  const qrisModal = document.getElementById('qrisModal');
  const btnOpenQris = document.getElementById('btnOpenQris');
  const qrisCloseBtn = document.getElementById('qrisCloseBtn');

  if (qrisModal) {
    if (btnOpenQris) {
      btnOpenQris.addEventListener('click', () => {
        if (typeof qrisModal.showModal === 'function') {
          qrisModal.showModal();
        } else {
          qrisModal.setAttribute('open', '');
        }
      });
    }

    if (qrisCloseBtn) {
      qrisCloseBtn.addEventListener('click', () => {
        if (typeof qrisModal.close === 'function') {
          qrisModal.close();
        } else {
          qrisModal.removeAttribute('open');
        }
      });
    }

    // Light-dismiss fallback for QRIS Dialog per Modern Web Guidance
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      qrisModal.addEventListener('click', (event) => {
        if (event.target !== qrisModal) return;
        const rect = qrisModal.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (isDialogContent) return;
        qrisModal.close();
      });
    }
  }

  function showToast(text) {
    if (!toastNotification) return;
    toastNotification.textContent = text;
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 3200);
  }

  /* ----------------------------------------------------
     10. GALLERY FILTER TABS & LIGHTBOX DIALOG
  ---------------------------------------------------- */
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
  const galleryTabs = document.querySelectorAll('.gallery-filter-btn');
  const lightbox = document.getElementById('galleryLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  // Filter Tabs Handler
  galleryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      galleryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          item.classList.remove('is-hidden');
          item.style.display = '';
        } else {
          item.classList.add('is-hidden');
          item.style.display = 'none';
        }
      });
    });
  });

  // Extract gallery data dynamically
  const galleryData = galleryItems.map(item => {
    const img = item.querySelector('img');
    const captionEl = item.querySelector('.gallery-item-caption');
    return {
      src: img ? img.getAttribute('src') : '',
      alt: img ? img.getAttribute('alt') : 'Foto Pernikahan',
      caption: captionEl ? captionEl.innerHTML : ''
    };
  });

  let currentGalleryIndex = 0;

  function openLightbox(index) {
    if (!lightbox || !lightboxImg || !galleryData[index]) return;
    currentGalleryIndex = index;
    const data = galleryData[index];

    lightboxImg.src = data.src;
    lightboxImg.alt = data.alt;
    if (lightboxCaption) lightboxCaption.innerHTML = data.caption;
    if (lightboxCounter) lightboxCounter.textContent = `${index + 1} / ${galleryData.length}`;

    if (typeof lightbox.showModal === 'function') {
      lightbox.showModal();
    } else {
      lightbox.setAttribute('open', '');
    }
  }

  function closeLightbox() {
    if (!lightbox) return;
    if (typeof lightbox.close === 'function') {
      lightbox.close();
    } else {
      lightbox.removeAttribute('open');
    }
  }

  function nextLightbox() {
    currentGalleryIndex = (currentGalleryIndex + 1) % galleryData.length;
    openLightbox(currentGalleryIndex);
  }

  function prevLightbox() {
    currentGalleryIndex = (currentGalleryIndex - 1 + galleryData.length) % galleryData.length;
    openLightbox(currentGalleryIndex);
  }

  galleryItems.forEach((item, idx) => {
    item.addEventListener('click', () => openLightbox(idx));
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener('click', nextLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', prevLightbox);

  // Light-dismiss fallback for Lightbox Dialog per Modern Web Guidance
  if (lightbox) {
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      lightbox.addEventListener('click', (event) => {
        if (event.target !== lightbox) return;
        const rect = lightbox.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (isDialogContent) return;
        closeLightbox();
      });
    }

    // Touch Swipe Gesture Navigation on Mobile
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diffX = touchEndX - touchStartX;
      if (Math.abs(diffX) > 45) {
        if (diffX < 0) {
          nextLightbox(); // Swiped left -> next
        } else {
          prevLightbox(); // Swiped right -> prev
        }
      }
    }
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.open) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextLightbox();
    if (e.key === 'ArrowLeft') prevLightbox();
  });

  /* ----------------------------------------------------
     10B. FLOATING NAVBAR SCROLL SPY
  ---------------------------------------------------- */
  const navLinks = document.querySelectorAll('.floating-nav-link');
  const sections = Array.from(navLinks).map(link => {
    const id = link.getAttribute('href').replace('#', '');
    return document.getElementById(id);
  }).filter(Boolean);

  if (sections.length > 0) {
    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const currentId = entry.target.id;
          navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${currentId}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    });

    sections.forEach(sec => spyObserver.observe(sec));
  }

  /* ----------------------------------------------------
     11. FLOATING AMBIENT CANVAS PARTICLES (PETALS & GOLD DUST)
  ---------------------------------------------------- */
  function initAmbientParticles() {
    const canvas = document.getElementById('ambientCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 22 : 45;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * (isMobile ? 2.5 : 3.5) + 1,
        speedY: Math.random() * 0.6 + 0.3,
        speedX: (Math.random() - 0.5) * 0.4,
        sway: Math.random() * 2,
        swaySpeed: Math.random() * 0.02 + 0.01,
        opacity: Math.random() * 0.5 + 0.2,
        isPetal: i % 3 === 0, // Jasmine petals vs gold dust
        angle: Math.random() * 360,
        spinSpeed: (Math.random() - 0.5) * 0.03
      });
    }

    function animateParticles() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.y += p.speedY;
        p.sway += p.swaySpeed;
        p.x += Math.sin(p.sway) * 0.5 + p.speedX;
        p.angle += p.spinSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        if (p.isPetal) {
          // Jasmine White Petal
          ctx.beginPath();
          ctx.ellipse(0, 0, p.radius * 2, p.radius, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(250, 248, 245, ${p.opacity * 0.8})`;
          ctx.fill();
        } else {
          // Warm Gold Dust Particle
          ctx.beginPath();
          ctx.arc(0, 0, p.radius * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`;
          ctx.shadowColor = '#D4AF37';
          ctx.shadowBlur = 6;
          ctx.fill();
        }

        ctx.restore();
      });

      requestAnimationFrame(animateParticles);
    }

    requestAnimationFrame(animateParticles);
  }
  initAmbientParticles();

  /* ----------------------------------------------------
     12. LIGHT PARALLAX ON JOGLO (DESKTOP ONLY)
  ---------------------------------------------------- */
  if (window.innerWidth >= 1024) {
    const jogloBg = document.querySelector('.joglo-feature-bg');
    if (jogloBg) {
      window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        jogloBg.style.transform = `scale(1.05) translateY(${scrolled * 0.06}px)`;
      }, { passive: true });
    }
  }
});

