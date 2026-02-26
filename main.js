/* ============================================
   EMWRAPS — Gemini-Inspired Three.js Scene
   Cinematic particles, grid, and HUD interactions
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

// Hover effects for interactive elements
const hoverTargets = document.querySelectorAll('a, button, input, textarea, select, .service-card, .gallery-item, .gallery-showcase-item, .filter-btn, .slider-btn, .social-link');
hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// =========================================
// THREE.JS SCENE
// =========================================
(function () {
    const canvas = document.getElementById('three-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    // Brand colors
    const amber = new THREE.Color(0xe8a845);
    const cyan = new THREE.Color(0x45c8e8);
    const white = new THREE.Color(0x888899);

    // ---- Floating Particles ----
    const particleCount = 600;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 100;
        positions[i3 + 1] = (Math.random() - 0.5) * 100;
        positions[i3 + 2] = (Math.random() - 0.5) * 50 - 10;

        // Mostly amber with some cyan accents
        const r = Math.random();
        let col;
        if (r < 0.6) col = amber;
        else if (r < 0.8) col = cyan;
        else col = white;

        colors[i3] = col.r;
        colors[i3 + 1] = col.g;
        colors[i3 + 2] = col.b;

        sizes[i] = Math.random() * 2 + 0.3;

        velocities.push({
            x: (Math.random() - 0.5) * 0.015,
            y: (Math.random() - 0.5) * 0.015,
            z: (Math.random() - 0.5) * 0.008,
        });
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    pGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
        },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            varying float vAlpha;
            uniform float uTime;
            uniform vec2 uMouse;
            
            void main() {
                vColor = color;
                vec3 pos = position;
                
                // Gentle wave motion
                pos.x += sin(uTime * 0.15 + position.y * 0.05) * 1.5;
                pos.y += cos(uTime * 0.12 + position.x * 0.05) * 1.5;
                pos.z += sin(uTime * 0.1 + position.x * 0.03) * 0.5;
                
                // Mouse repulsion
                vec2 mPos = uMouse * 40.0;
                float dist = length(pos.xy - mPos);
                float repulse = smoothstep(12.0, 0.0, dist);
                pos.xy += normalize(pos.xy - mPos + 0.001) * repulse * 4.0;
                
                vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (180.0 / -mvPos.z);
                gl_Position = projectionMatrix * mvPos;
                
                vAlpha = smoothstep(60.0, 15.0, -mvPos.z);
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;
            
            void main() {
                float d = length(gl_PointCoord - 0.5);
                if (d > 0.5) discard;
                
                float glow = 1.0 - smoothstep(0.0, 0.5, d);
                glow = pow(glow, 3.0);
                
                gl_FragColor = vec4(vColor, glow * vAlpha * 0.4);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const particles = new THREE.Points(pGeo, particleMat);
    scene.add(particles);

    // ---- Grid Floor ----
    const gridSize = 80;
    const gridDiv = 40;
    const gridGeo = new THREE.BufferGeometry();
    const gridVerts = [];
    const step = gridSize / gridDiv;

    for (let i = 0; i <= gridDiv; i++) {
        const x = -gridSize / 2 + i * step;
        gridVerts.push(x, 0, -gridSize / 2, x, 0, gridSize / 2);
    }
    for (let i = 0; i <= gridDiv; i++) {
        const z = -gridSize / 2 + i * step;
        gridVerts.push(-gridSize / 2, 0, z, gridSize / 2, 0, z);
    }

    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridVerts, 3));
    const gridMat = new THREE.LineBasicMaterial({
        color: 0xe8a845,
        transparent: true,
        opacity: 0.04,
    });
    const grid = new THREE.LineSegments(gridGeo, gridMat);
    grid.position.y = -20;
    grid.rotation.x = 0;
    scene.add(grid);

    // ---- Wireframe geometric accents ----
    const shapes = [];
    const shapeConfigs = [
        { geo: new THREE.IcosahedronGeometry(3, 1), pos: [-25, 10, -20], color: 0xe8a845 },
        { geo: new THREE.OctahedronGeometry(2, 0), pos: [28, -8, -25], color: 0x45c8e8 },
        { geo: new THREE.TorusGeometry(3, 0.3, 8, 32), pos: [-20, -12, -15], color: 0xe8a845 },
        { geo: new THREE.TetrahedronGeometry(1.5, 0), pos: [22, 15, -18], color: 0x45c8e8 },
        { geo: new THREE.RingGeometry(2, 3, 6), pos: [0, -18, -22], color: 0xe8a845 },
        { geo: new THREE.DodecahedronGeometry(1.8, 0), pos: [30, 5, -30], color: 0x888899 },
    ];

    shapeConfigs.forEach((cfg) => {
        const mat = new THREE.MeshBasicMaterial({
            color: cfg.color,
            wireframe: true,
            transparent: true,
            opacity: 0.06,
        });
        const mesh = new THREE.Mesh(cfg.geo, mat);
        mesh.position.set(...cfg.pos);
        mesh.userData = {
            rx: (Math.random() - 0.5) * 0.003,
            ry: (Math.random() - 0.5) * 0.003,
            rz: (Math.random() - 0.5) * 0.002,
            floatSpeed: 0.2 + Math.random() * 0.3,
            floatOffset: Math.random() * Math.PI * 2,
            baseY: cfg.pos[1],
        };
        scene.add(mesh);
        shapes.push(mesh);
    });

    // ---- Connection lines ----
    const lineMax = 150;
    const lineGeo = new THREE.BufferGeometry();
    const lPos = new Float32Array(lineMax * 6);
    const lCol = new Float32Array(lineMax * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lCol, 3));
    const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ---- Mouse ----
    let mX = 0, mY = 0, tX = 0, tY = 0;
    document.addEventListener('mousemove', (e) => {
        tX = (e.clientX / window.innerWidth) * 2 - 1;
        tY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    let scrollY = 0;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ---- Animate ----
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        mX += (tX - mX) * 0.04;
        mY += (tY - mY) * 0.04;

        particleMat.uniforms.uTime.value = t;
        particleMat.uniforms.uMouse.value.set(mX, mY);

        // Move particles
        const pa = pGeo.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            pa[i3] += velocities[i].x;
            pa[i3 + 1] += velocities[i].y;
            pa[i3 + 2] += velocities[i].z;
            if (pa[i3] > 50) pa[i3] = -50;
            if (pa[i3] < -50) pa[i3] = 50;
            if (pa[i3 + 1] > 50) pa[i3 + 1] = -50;
            if (pa[i3 + 1] < -50) pa[i3 + 1] = 50;
        }
        pGeo.attributes.position.needsUpdate = true;

        // Connection lines
        let lc = 0;
        const threshold = 10;
        const lpArr = lineGeo.attributes.position.array;
        const lcArr = lineGeo.attributes.color.array;
        const checkCount = Math.min(particleCount, 80);

        for (let i = 0; i < checkCount && lc < lineMax; i++) {
            for (let j = i + 1; j < checkCount && lc < lineMax; j++) {
                const dx = pa[i * 3] - pa[j * 3];
                const dy = pa[i * 3 + 1] - pa[j * 3 + 1];
                const dz = pa[i * 3 + 2] - pa[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < threshold) {
                    const li = lc * 6;
                    const a = 1 - dist / threshold;
                    lpArr[li] = pa[i * 3]; lpArr[li + 1] = pa[i * 3 + 1]; lpArr[li + 2] = pa[i * 3 + 2];
                    lpArr[li + 3] = pa[j * 3]; lpArr[li + 4] = pa[j * 3 + 1]; lpArr[li + 5] = pa[j * 3 + 2];
                    // Amber connection color
                    lcArr[li] = 0.91 * a; lcArr[li + 1] = 0.66 * a; lcArr[li + 2] = 0.27 * a;
                    lcArr[li + 3] = 0.91 * a; lcArr[li + 4] = 0.66 * a; lcArr[li + 5] = 0.27 * a;
                    lc++;
                }
            }
        }
        for (let i = lc * 6; i < lineMax * 6; i++) { lpArr[i] = 0; lcArr[i] = 0; }
        lineGeo.attributes.position.needsUpdate = true;
        lineGeo.attributes.color.needsUpdate = true;
        lineGeo.setDrawRange(0, lc * 2);

        // Shapes
        shapes.forEach(s => {
            s.rotation.x += s.userData.rx;
            s.rotation.y += s.userData.ry;
            s.rotation.z += s.userData.rz;
            s.position.y = s.userData.baseY + Math.sin(t * s.userData.floatSpeed + s.userData.floatOffset) * 2;
        });

        // Grid animation
        grid.rotation.x = -Math.PI / 2 + Math.sin(t * 0.05) * 0.02;
        grid.position.z = -10 + Math.sin(t * 0.1) * 2;

        // Camera
        camera.position.x += (mX * 4 - camera.position.x) * 0.015;
        camera.position.y += (mY * 3 - camera.position.y) * 0.015;
        camera.position.z = 50 + scrollY * 0.008;

        // Fade with scroll
        const fadeStart = window.innerHeight * 0.3;
        const fadeEnd = window.innerHeight * 2.5;
        let op = 1;
        if (scrollY > fadeStart) {
            op = Math.max(0.05, 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart));
        }
        particles.material.opacity = op;

        renderer.render(scene, camera);
    }

    animate();
})();

// =========================================
// LOADER
// =========================================
const loaderFill = document.getElementById('loader-fill');
const loaderPercent = document.getElementById('loader-percent');
let loadProgress = 0;

function animateLoader() {
    loadProgress += (100 - loadProgress) * 0.03 + 0.5;
    if (loadProgress > 100) loadProgress = 100;

    loaderFill.style.width = loadProgress + '%';
    loaderPercent.textContent = Math.floor(loadProgress) + '%';

    if (loadProgress < 99.5) {
        requestAnimationFrame(animateLoader);
    } else {
        loaderFill.style.width = '100%';
        loaderPercent.textContent = '100%';
        setTimeout(() => {
            document.getElementById('loader').classList.add('loaded');
            // Trigger hero animations
            animateHeroWords();
        }, 400);
    }
}

window.addEventListener('load', () => {
    setTimeout(animateLoader, 300);
});

// =========================================
// HERO WORD REVEAL
// =========================================
function animateHeroWords() {
    const words = document.querySelectorAll('.title-word');
    words.forEach((word, i) => {
        setTimeout(() => {
            word.classList.add('visible');
        }, i * 120 + 200);
    });
}

// =========================================
// HUD TIME / FPS
// =========================================
const hudTime = document.getElementById('hud-time');
const hudFps = document.getElementById('hud-fps');
let lastTime = performance.now();
let frameCount = 0;

function updateHUD() {
    // Time
    const now = new Date();
    hudTime.textContent = now.toTimeString().split(' ')[0];

    // FPS
    frameCount++;
    const elapsed = performance.now() - lastTime;
    if (elapsed >= 1000) {
        hudFps.textContent = Math.round(frameCount * 1000 / elapsed) + ' FPS';
        frameCount = 0;
        lastTime = performance.now();
    }

    requestAnimationFrame(updateHUD);
}
updateHUD();

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
// GALLERY FILTER
// =========================================
const filterBtns = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-showcase-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;

        galleryItems.forEach((item, i) => {
            if (filter === 'all' || item.dataset.category === filter) {
                item.classList.remove('hidden');
                item.style.animation = `galleryReveal 0.6s ${i * 0.05}s var(--ease-out) both`;
            } else {
                item.classList.add('hidden');
            }
        });

        // Auto-expand when filtering, collapse when "All"
        const collapse = document.getElementById('gallery-collapse');
        const toggleBtn = document.getElementById('gallery-toggle');
        if (filter !== 'all') {
            collapse.classList.add('expanded');
            toggleBtn.style.display = 'none';
        } else {
            collapse.classList.remove('expanded');
            toggleBtn.style.display = '';
            toggleBtn.setAttribute('aria-expanded', 'false');
            document.getElementById('gallery-toggle-text').textContent = 'See More Projects';
        }
    });
});

// =========================================
// GALLERY SEE MORE TOGGLE
// =========================================
const galleryToggle = document.getElementById('gallery-toggle');
const galleryCollapse = document.getElementById('gallery-collapse');

if (galleryToggle && galleryCollapse) {
    galleryToggle.addEventListener('click', () => {
        const isExpanded = galleryCollapse.classList.toggle('expanded');
        galleryToggle.setAttribute('aria-expanded', isExpanded);
        document.getElementById('gallery-toggle-text').textContent = isExpanded ? 'Show Less' : 'See More Projects';
    });
}

// =========================================
// TESTIMONIALS SLIDER
// =========================================
const track = document.getElementById('testimonial-track');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const dotsBox = document.getElementById('slider-dots');
const cards = document.querySelectorAll('.testimonial-card');
let slide = 0;

cards.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.classList.add('slider-dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goSlide(i));
    dotsBox.appendChild(dot);
});

const dots = document.querySelectorAll('.slider-dot');

function goSlide(i) {
    slide = i;
    track.style.transform = `translateX(-${i * 100}%)`;
    dots.forEach((d, j) => d.classList.toggle('active', j === i));
}

prevBtn.addEventListener('click', () => goSlide(slide === 0 ? cards.length - 1 : slide - 1));
nextBtn.addEventListener('click', () => goSlide(slide === cards.length - 1 ? 0 : slide + 1));

let autoSlide = setInterval(() => goSlide(slide === cards.length - 1 ? 0 : slide + 1), 6000);
track.addEventListener('mouseenter', () => clearInterval(autoSlide));
track.addEventListener('mouseleave', () => {
    autoSlide = setInterval(() => goSlide(slide === cards.length - 1 ? 0 : slide + 1), 6000);
});

// =========================================
// CONTACT FORM
// =========================================
const contactForm = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitBtn.innerHTML = '<span class="btn-text">TRANSMITTING...</span><span class="btn-arrow spin-anim">⟳</span>';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';

    setTimeout(() => {
        submitBtn.innerHTML = '<span class="btn-text">MESSAGE SENT ✓</span>';
        submitBtn.style.opacity = '1';
        submitBtn.style.borderColor = '#45c8e8';
        submitBtn.style.color = '#45c8e8';

        setTimeout(() => {
            submitBtn.innerHTML = '<span class="btn-text">Send Message</span><span class="btn-arrow">→</span><span class="btn-bg"></span>';
            submitBtn.style.borderColor = '';
            submitBtn.style.color = '';
            submitBtn.disabled = false;
            contactForm.reset();
        }, 3000);
    }, 1500);
});

// =========================================
// VIP SEE MORE TOGGLE (MOBILE GRID)
// =========================================
const celebSeeMore = document.getElementById('celebrities-see-more');
const celebCollapse = document.getElementById('celebrities-collapse');
if (celebSeeMore && celebCollapse) {
    celebSeeMore.addEventListener('click', () => {
        const isExpanded = celebCollapse.classList.toggle('expanded');
        celebSeeMore.setAttribute('aria-expanded', isExpanded);
        const textEl = celebSeeMore.querySelector('.see-more-text');
        if (textEl) textEl.textContent = isExpanded ? 'Show Less' : 'See More VIPs';
    });
}

// =========================================
// SHOWCASE SCROLL ANIMATION
// =========================================
(function () {
    const section = document.querySelector('.showcase-section');
    if (!section) return;

    const carImg = document.getElementById('showcase-car');
    const detailImg = document.getElementById('showcase-detail-img');
    const detailEl = document.getElementById('showcase-detail');
    const topLeft = section.querySelector('.shud-top-left');
    const center = section.querySelector('.shud-center');
    const dataStrip = document.getElementById('shud-data');
    const brackets = section.querySelectorAll('.shud-bracket');
    const progressBar = document.getElementById('showcase-progress-bar');
    const carSelector = document.getElementById('car-selector');
    const selectorItems = document.querySelectorAll('.car-selector-item');

    const hudTitle = document.getElementById('shud-title');
    const hudSubtitle = document.getElementById('shud-subtitle');
    const hudMaterial = document.getElementById('shud-material');
    const hudCoverage = document.getElementById('shud-coverage');
    const hudFinish = document.getElementById('shud-finish');
    const hudWarranty = document.getElementById('shud-warranty');

    let currentIndex = 0;
    let isTransitioning = false;

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    selectorItems.forEach(item => {
        item.addEventListener('click', () => {
            const newIndex = parseInt(item.dataset.index);
            if (newIndex === currentIndex || isTransitioning) return;
            isTransitioning = true;
            currentIndex = newIndex;
            selectorItems.forEach(s => s.classList.remove('active'));
            item.classList.add('active');
            carImg.classList.add('crossfade-out');
            setTimeout(() => {
                carImg.src = item.dataset.main;
                carImg.alt = item.dataset.title + ' by EMWRAPS';
                carImg.classList.remove('crossfade-out');
                carImg.classList.add('crossfade-in');
                if (detailImg) detailImg.src = item.dataset.detail;
                if (hudTitle) { hudTitle.textContent = item.dataset.title; hudTitle.classList.add('crossfade'); }
                if (hudSubtitle) { hudSubtitle.textContent = item.dataset.subtitle; hudSubtitle.classList.add('crossfade'); }
                const updates = [[hudMaterial, item.dataset.material], [hudCoverage, item.dataset.coverage], [hudFinish, item.dataset.finish], [hudWarranty, item.dataset.warranty]];
                updates.forEach(([el, val]) => { if (el) { el.textContent = val; el.classList.add('crossfade'); } });
                setTimeout(() => {
                    carImg.classList.remove('crossfade-in');
                    if (hudTitle) hudTitle.classList.remove('crossfade');
                    if (hudSubtitle) hudSubtitle.classList.remove('crossfade');
                    updates.forEach(([el]) => { if (el) el.classList.remove('crossfade'); });
                    isTransitioning = false;
                }, 500);
            }, 400);
        });
    });

    function updateShowcase() {
        const rect = section.getBoundingClientRect();
        const sectionHeight = section.offsetHeight;
        const viewHeight = window.innerHeight;
        const scrolled = -rect.top / (sectionHeight - viewHeight);
        const progress = clamp(scrolled, 0, 1);
        if (progressBar) progressBar.style.height = (progress * 100) + '%';
        if (carSelector) carSelector.classList.toggle('visible', progress > 0.2);
        if (!isTransitioning) {
            const carProgress = clamp(progress / 0.2, 0, 1);
            const carEased = easeOutCubic(carProgress);
            if (carImg) {
                carImg.style.transform = `scale(${1.15 - (0.15 * carEased)})`;
                carImg.style.opacity = 0.15 + (0.85 * carEased);
                carImg.style.filter = `brightness(${0.5 + (0.35 * carEased)}) contrast(1.1)`;
            }
        }
        const hudProgress = clamp((progress - 0.15) / 0.2, 0, 1);
        const hudEased = easeOutCubic(hudProgress);
        if (topLeft) { topLeft.style.opacity = hudEased; topLeft.style.transform = `translateX(${-20 * (1 - hudEased)}px)`; }
        const titleProgress = clamp((progress - 0.2) / 0.2, 0, 1);
        const titleEased = easeOutCubic(titleProgress);
        if (center) { center.style.opacity = titleEased; center.style.transform = `translateY(${30 * (1 - titleEased)}px)`; }
        const bracketProgress = clamp((progress - 0.25) / 0.15, 0, 1);
        brackets.forEach(b => { b.style.opacity = bracketProgress * 0.5; });
        const dataProgress = clamp((progress - 0.3) / 0.2, 0, 1);
        const dataEased = easeOutCubic(dataProgress);
        if (dataStrip) { dataStrip.style.opacity = dataEased; dataStrip.style.transform = `translateY(${20 * (1 - dataEased)}px)`; }
        const detailProgress = clamp((progress - 0.35) / 0.2, 0, 1);
        const detailEased = easeOutCubic(detailProgress);
        if (detailEl) { detailEl.style.opacity = detailEased; detailEl.style.transform = `translateX(${40 * (1 - detailEased)}px)`; }
        if (carImg && progress > 0.5 && !isTransitioning) {
            const punchProgress = clamp((progress - 0.5) / 0.2, 0, 1);
            carImg.style.filter = `brightness(${0.85 + (0.1 * punchProgress)}) contrast(1.1)`;
        }
        requestAnimationFrame(updateShowcase);
    }
    requestAnimationFrame(updateShowcase);
})();

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

// =========================================
// DYNAMIC CSS KEYFRAMES
// =========================================
const dynStyle = document.createElement('style');
dynStyle.textContent = `
    @keyframes galleryReveal {
        from { opacity: 0; transform: scale(0.97) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .spin-anim {
        display: inline-block;
        animation: spinA 1s linear infinite;
    }
    @keyframes spinA {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(dynStyle);

// =========================================
// CELEBRITIES CAROUSEL NAV
// =========================================
(function () {
    const track = document.getElementById('celebrities-track');
    if (!track) return;
    const dots = document.querySelectorAll('.celebrities-nav-dot');
    const cards = track.querySelectorAll('.celebrity-card');

    // Add cursor hover to celebrity cards
    cards.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    // Click dot → scroll to position
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const idx = parseInt(dot.dataset.index);
            const cardWidth = cards[0].offsetWidth + 24; // card width + gap
            track.scrollTo({ left: idx * cardWidth * 2, behavior: 'smooth' });
        });
    });

    // Update active dot on scroll
    track.addEventListener('scroll', () => {
        const scrollPos = track.scrollLeft;
        const maxScroll = track.scrollWidth - track.clientWidth;
        const progress = scrollPos / maxScroll;
        const activeIdx = Math.min(Math.floor(progress * dots.length), dots.length - 1);
        dots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
    });
})();

// =========================================
// DATE PICKER — SET MIN TO TODAY
// =========================================
const dateInput = document.getElementById('preferred-date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);

    // Make the entire date field clickable to open the picker
    dateInput.addEventListener('click', function () {
        if (this.showPicker) {
            this.showPicker();
        }
    });
}

// =========================================
// VEHICLE YEAR / MAKE / MODEL (NHTSA API)
// =========================================
const yearSelect = document.getElementById('vehicle-year');
const makeSelect = document.getElementById('vehicle-make');
const modelSelect = document.getElementById('vehicle-model');

if (yearSelect && makeSelect && modelSelect) {

    // Helper: convert a <select> to a text <input> for manual entry
    function convertToTextInput(selectEl, placeholder) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = selectEl.id;
        input.name = selectEl.name;
        input.placeholder = placeholder;
        selectEl.replaceWith(input);
        return input;
    }

    // Helper: fetch with timeout (5s)
    function fetchWithTimeout(url, ms = 5000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
    }

    // Helper: title-case a make name (e.g. "MERCEDES-BENZ" → "Mercedes-Benz")
    function titleCase(name) {
        return name.split(/(?<=[-\s])|(?=[-\s])/).map(part => {
            if (part === '-' || part === ' ') return part;
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }).join('');
    }

    // Populate years (current year + 1 down to 1990)
    const currentYear = new Date().getFullYear();
    for (let y = currentYear + 1; y >= 2015; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
    }

    const popularMakes = [
        'ACURA', 'ALFA ROMEO', 'ASTON MARTIN', 'AUDI', 'BENTLEY', 'BMW', 'BUGATTI',
        'BUICK', 'CADILLAC', 'CHEVROLET', 'CHRYSLER', 'DODGE', 'FERRARI', 'FIAT',
        'FISKER', 'FORD', 'GENESIS', 'GMC', 'HONDA', 'HYUNDAI', 'INFINITI', 'JAGUAR',
        'JEEP', 'KIA', 'KOENIGSEGG', 'LAMBORGHINI', 'LAND ROVER', 'LEXUS', 'LINCOLN',
        'LOTUS', 'LUCID', 'MASERATI', 'MAYBACH', 'MAZDA', 'MCLAREN', 'MERCEDES-BENZ',
        'MINI', 'MITSUBISHI', 'NISSAN', 'PAGANI', 'POLESTAR', 'PONTIAC', 'PORSCHE',
        'RAM', 'RIVIAN', 'ROLLS-ROYCE', 'SAAB', 'SHELBY', 'SMART', 'SUBARU', 'SUZUKI',
        'TESLA', 'TOYOTA', 'VOLKSWAGEN', 'VOLVO'
    ];

    // Track current select references (may become inputs on fallback)
    let currentMakeEl = makeSelect;
    let currentModelEl = modelSelect;

    // When year changes → fetch makes
    yearSelect.addEventListener('change', async () => {
        // If make was already converted to text input, don't refetch
        if (currentMakeEl.tagName === 'INPUT') return;

        currentMakeEl.innerHTML = '<option value="" disabled selected>Loading makes...</option>';
        currentMakeEl.disabled = true;
        if (currentModelEl.tagName === 'SELECT') {
            currentModelEl.innerHTML = '<option value="" disabled selected>Select make first</option>';
            currentModelEl.disabled = true;
        }

        try {
            const res = await fetchWithTimeout('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json');
            if (!res.ok) throw new Error('API response not ok');
            const data = await res.json();

            let makes = data.Results
                .filter(m => popularMakes.includes(m.MakeName.toUpperCase()))
                .sort((a, b) => a.MakeName.localeCompare(b.MakeName));

            if (makes.length === 0) {
                makes = data.Results.sort((a, b) => a.MakeName.localeCompare(b.MakeName));
            }

            currentMakeEl.innerHTML = '<option value="" disabled selected>Select make</option>';
            makes.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.MakeName;
                opt.textContent = titleCase(m.MakeName);
                currentMakeEl.appendChild(opt);
            });
            currentMakeEl.disabled = false;
        } catch (err) {
            // Fallback: convert make & model to text inputs
            currentMakeEl = convertToTextInput(currentMakeEl, 'e.g. Tesla');
            currentModelEl = convertToTextInput(currentModelEl, 'e.g. Model 3');
        }
    });

    // Event delegation for make changes (works even after DOM swap)
    document.addEventListener('change', async (e) => {
        if (e.target.id !== 'vehicle-make' || e.target.tagName !== 'SELECT') return;

        const year = yearSelect.value;
        const make = e.target.value;

        if (currentModelEl.tagName === 'INPUT') return;

        currentModelEl.innerHTML = '<option value="" disabled selected>Loading models...</option>';
        currentModelEl.disabled = true;

        try {
            const res = await fetchWithTimeout(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`);
            if (!res.ok) throw new Error('API response not ok');
            const data = await res.json();

            const models = data.Results.sort((a, b) => a.Model_Name.localeCompare(b.Model_Name));

            if (models.length === 0) {
                // No models for this combo — fallback to text
                currentModelEl = convertToTextInput(currentModelEl, 'e.g. Model 3');
                return;
            }

            currentModelEl.innerHTML = '<option value="" disabled selected>Select model</option>';
            models.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.Model_Name;
                opt.textContent = m.Model_Name;
                currentModelEl.appendChild(opt);
            });
            // Add "Other" option at end
            const otherOpt = document.createElement('option');
            otherOpt.value = 'other';
            otherOpt.textContent = 'Other (specify in details)';
            currentModelEl.appendChild(otherOpt);
            currentModelEl.disabled = false;
        } catch (err) {
            // Fallback: convert model to text input
            currentModelEl = convertToTextInput(currentModelEl, 'e.g. Model 3');
        }
    });
}
