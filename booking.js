/* ============================================
   EMWRAPS — Booking Page JS
   Used by: booking.html
   Cursor, navbar, mobile menu, scroll reveal,
   form validation with SMS consent enforcement
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
const hoverTargets = document.querySelectorAll('a, button, input, select, textarea, .sms-consent-label');
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
// POPULATE VEHICLE YEAR DROPDOWN
// =========================================
const yearSelect = document.getElementById('booking-year');
if (yearSelect) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear + 1; y >= 1990; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
    }
}

// =========================================
// SET MIN DATE ON DATE PICKER
// =========================================
const dateInput = document.getElementById('booking-date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// =========================================
// FORM SUBMISSION WITH SMS CONSENT VALIDATION
// =========================================
const bookingForm = document.getElementById('booking-form');
const smsConsent = document.getElementById('sms-consent');
const smsConsentBlock = document.getElementById('sms-consent-block');

if (bookingForm) {
    // Remove error state when checkbox is checked
    smsConsent.addEventListener('change', () => {
        if (smsConsent.checked) {
            smsConsentBlock.classList.remove('error');
        }
    });

    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validate SMS consent checkbox
        if (!smsConsent.checked) {
            smsConsentBlock.classList.add('error');
            smsConsentBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        smsConsentBlock.classList.remove('error');

        // Check native form validation
        if (!bookingForm.checkValidity()) {
            bookingForm.reportValidity();
            return;
        }

        // Gather form data
        const formData = new FormData(bookingForm);
        const data = Object.fromEntries(formData.entries());

        // Submit button animation
        const submitBtn = document.getElementById('booking-submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const originalText = btnText.textContent;

        btnText.textContent = 'Sending...';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';

        // Simulated form submission (replace with actual backend endpoint)
        setTimeout(() => {
            btnText.textContent = 'Sent ✓';
            submitBtn.style.opacity = '1';

            setTimeout(() => {
                btnText.textContent = originalText;
                submitBtn.disabled = false;
                bookingForm.reset();
                smsConsentBlock.classList.remove('error');
            }, 3000);
        }, 1500);
    });
}

// =========================================
// SMOOTH SCROLL (for same-page anchors)
// =========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
