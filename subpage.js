/* ============================================
   EMWRAPS — Subpage Shared JavaScript
   Used by: vinyl.html, itasha.html, aftermarket.html, ceramic.html
   ============================================ */

(function () {
    'use strict';

    /* ---- Custom Cursor ---- */
    const cursor = document.getElementById('cursor');
    if (cursor && window.matchMedia('(pointer:fine)').matches) {
        const dot = cursor.querySelector('.cursor-dot');
        const ring = cursor.querySelector('.cursor-ring');
        let mx = 0, my = 0, cx = 0, cy = 0;

        document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

        (function moveCursor() {
            cx += (mx - cx) * 0.15;
            cy += (my - cy) * 0.15;
            if (dot) { dot.style.transform = `translate(${mx}px, ${my}px)`; }
            if (ring) { ring.style.transform = `translate(${cx}px, ${cy}px)`; }
            requestAnimationFrame(moveCursor);
        })();

        // Hover states
        const hoverTargets = 'a, button, .sub-gallery-item, .sub-service-card, .sub-package-card, .sub-faq-question';
        document.querySelectorAll(hoverTargets).forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
        });
    }

    /* ---- Navbar ---- */
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (navbar) {
            navbar.classList.toggle('scrolled', y > 50);
            navbar.classList.toggle('nav-hidden', y > lastScroll && y > 200);
        }
        lastScroll = y;
    }, { passive: true });

    /* ---- Mobile Menu ---- */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }

    /* ---- Scroll Animations ---- */
    const animateEls = document.querySelectorAll('[data-animate]');
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = parseInt(entry.target.dataset.delay || 0);
                    setTimeout(() => entry.target.classList.add('animated'), delay);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        animateEls.forEach(el => obs.observe(el));
    } else {
        animateEls.forEach(el => el.classList.add('animated'));
    }

    /* ---- FAQ Accordion ---- */
    document.querySelectorAll('.sub-faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.sub-faq-item');
            const isActive = item.classList.contains('active');

            // Close others
            document.querySelectorAll('.sub-faq-item.active').forEach(other => {
                if (other !== item) other.classList.remove('active');
            });

            item.classList.toggle('active', !isActive);
        });
    });

    /* ---- Smooth Scroll ---- */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const id = link.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* ---- Active Nav Highlighting ---- */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    if (sections.length && navLinks.length) {
        const navObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(link => {
                        link.classList.toggle('active', link.dataset.section === entry.target.id);
                    });
                }
            });
        }, { threshold: 0.3 });
        sections.forEach(sec => navObs.observe(sec));
    }

})();
