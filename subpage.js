/* ============================================
   EMWRAPS — Subpage Shared JS
   Matches PPF/Fleet animation system exactly
   Used by: vinyl.html, itasha.html, aftermarket.html, ceramic.html
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

// Hover effects — include all interactive + card elements
const hoverTargets = document.querySelectorAll('a, button, .sub-benefit-card, .sub-service-card, .sub-package-card, .sub-faq-question, .sub-gallery-item');
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
// COUNTER ANIMATION (telemetry stats)
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
const faqItems = document.querySelectorAll('.sub-faq-item');

faqItems.forEach(item => {
    const btn = item.querySelector('.sub-faq-question');
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
