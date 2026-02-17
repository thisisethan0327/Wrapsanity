/* ============================================
   EMWRAPS — Paint Protection Film Page JS
   Cursor, scroll animations, showcase, FAQ
   ============================================ */

// =========================================
// CUSTOM CURSOR
// =========================================
const cursor = document.getElementById('cursor');
const cursorDot = cursor.querySelector('.cursor-dot');
const cursorRing = cursor.querySelector('.cursor-ring');
let cursorX = 0, cursorY = 0;
let cursorTargetX = 0, cursorTargetY = 0;

document.addEventListener('mousemove', (e) => {
    cursorTargetX = e.clientX;
    cursorTargetY = e.clientY;
});

function updateCursor() {
    cursorX += (cursorTargetX - cursorX) * 0.15;
    cursorY += (cursorTargetY - cursorY) * 0.15;
    cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    requestAnimationFrame(updateCursor);
}
updateCursor();

// Hover effects
const hoverTargets = document.querySelectorAll('a, button, .ppf-benefit-card, .ppf-package-card, .ppf-faq-question');
hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// =========================================
// NAVBAR
// =========================================
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// Active nav link
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === id));
        }
    });
}, { rootMargin: '-40% 0px -40% 0px' });

sections.forEach(s => sectionObs.observe(s));

// =========================================
// MOBILE MENU
// =========================================
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
});

mobileLinks.forEach(l => {
    l.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// =========================================
// HERO WORD REVEAL (on load)
// =========================================
function animateHeroWords() {
    const words = document.querySelectorAll('.title-word');
    words.forEach((word, i) => {
        setTimeout(() => {
            word.classList.add('visible');
        }, i * 120 + 200);
    });
}

window.addEventListener('load', () => {
    setTimeout(animateHeroWords, 300);
});

// =========================================
// SCROLL REVEAL ANIMATIONS
// =========================================
const animEls = document.querySelectorAll('[data-animate="reveal"]');

const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = parseInt(entry.target.dataset.delay) || 0;
            setTimeout(() => entry.target.classList.add('animated'), delay);
            revealObs.unobserve(entry.target);
        }
    });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

animEls.forEach(el => revealObs.observe(el));

// =========================================
// CAR SHOWCASE — SCROLL-DRIVEN ANIMATION
// =========================================
(function () {
    const section = document.getElementById('ppf-showcase');
    if (!section) return;

    const carImg = document.getElementById('showcase-car');
    const detailEl = document.getElementById('showcase-detail');
    const topLeft = section.querySelector('.shud-top-left');
    const center = section.querySelector('.shud-center');
    const dataStrip = document.getElementById('shud-data');
    const brackets = section.querySelectorAll('.shud-bracket');
    const progressBar = document.getElementById('showcase-progress-bar');

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    function updateShowcase() {
        const rect = section.getBoundingClientRect();
        const sectionHeight = section.offsetHeight;
        const viewHeight = window.innerHeight;

        const scrolled = -rect.top / (sectionHeight - viewHeight);
        const progress = clamp(scrolled, 0, 1);

        // Progress bar
        if (progressBar) {
            progressBar.style.height = (progress * 100) + '%';
        }

        // Phase 1: Car reveal (0% - 40%)
        const carProgress = clamp(progress / 0.4, 0, 1);
        const carEased = easeOutCubic(carProgress);

        if (carImg) {
            const scale = 1.3 - (0.3 * carEased);
            const opacity = carEased;
            const brightness = 0.4 + (0.4 * carEased);
            carImg.style.transform = `scale(${scale})`;
            carImg.style.opacity = opacity;
            carImg.style.filter = `brightness(${brightness}) contrast(1.1)`;
        }

        // Phase 2: HUD elements (30% - 60%)
        const hudProgress = clamp((progress - 0.3) / 0.3, 0, 1);
        const hudEased = easeOutCubic(hudProgress);

        if (topLeft) {
            topLeft.style.opacity = hudEased;
            topLeft.style.transform = `translateX(${-20 * (1 - hudEased)}px)`;
        }

        const titleProgress = clamp((progress - 0.35) / 0.3, 0, 1);
        const titleEased = easeOutCubic(titleProgress);

        if (center) {
            center.style.opacity = titleEased;
            center.style.transform = `translateY(${30 * (1 - titleEased)}px)`;
        }

        const bracketProgress = clamp((progress - 0.4) / 0.25, 0, 1);
        brackets.forEach(b => {
            b.style.opacity = bracketProgress * 0.5;
        });

        // Phase 3: Data strip + Detail (55% - 85%)
        const dataProgress = clamp((progress - 0.55) / 0.3, 0, 1);
        const dataEased = easeOutCubic(dataProgress);

        if (dataStrip) {
            dataStrip.style.opacity = dataEased;
            dataStrip.style.transform = `translateY(${20 * (1 - dataEased)}px)`;
        }

        const detailProgress = clamp((progress - 0.6) / 0.3, 0, 1);
        const detailEased = easeOutCubic(detailProgress);

        if (detailEl) {
            detailEl.style.opacity = detailEased;
            detailEl.style.transform = `translateX(${40 * (1 - detailEased)}px)`;
        }

        // Phase 4: Final brightness punch (80% - 100%)
        if (carImg && progress > 0.8) {
            const punchProgress = clamp((progress - 0.8) / 0.2, 0, 1);
            const finalBrightness = 0.8 + (0.15 * punchProgress);
            carImg.style.filter = `brightness(${finalBrightness}) contrast(1.1)`;
        }

        requestAnimationFrame(updateShowcase);
    }

    requestAnimationFrame(updateShowcase);
})();

// =========================================
// COUNTER ANIMATION
// =========================================
const counters = document.querySelectorAll('.tele-value[data-count]');

const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = parseInt(entry.target.dataset.count);
            const duration = 2500;
            const start = performance.now();

            function tick(now) {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 4);
                entry.target.textContent = Math.floor(target * eased).toLocaleString();
                if (progress < 1) requestAnimationFrame(tick);
                else entry.target.textContent = target.toLocaleString();
            }

            requestAnimationFrame(tick);
            counterObs.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

counters.forEach(c => counterObs.observe(c));

// =========================================
// FAQ ACCORDION
// =========================================
const faqItems = document.querySelectorAll('.ppf-faq-item');

faqItems.forEach(item => {
    const btn = item.querySelector('.ppf-faq-question');
    btn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close all others
        faqItems.forEach(i => i.classList.remove('active'));
        // Toggle current
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// =========================================
// SMOOTH SCROLL
// =========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
