/* ============================================
   WRAPSANITY — Three.js Scene & Interactions
   ============================================ */

// ---- Three.js Animated Background ----
(function () {
    const canvas = document.getElementById('three-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // Colors matching the brand
    const accentColor = new THREE.Color(0xff6b35);
    const pinkColor = new THREE.Color(0xff3d7f);
    const purpleColor = new THREE.Color(0xc850c0);

    // ---- Particle System ----
    const particleCount = 800;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 80;
        positions[i3 + 1] = (Math.random() - 0.5) * 80;
        positions[i3 + 2] = (Math.random() - 0.5) * 40;

        const colorChoice = Math.random();
        let color;
        if (colorChoice < 0.33) color = accentColor;
        else if (colorChoice < 0.66) color = pinkColor;
        else color = purpleColor;

        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;

        sizes[i] = Math.random() * 3 + 0.5;

        velocities.push({
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.01,
        });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for glowing particles
    const particleMaterial = new THREE.ShaderMaterial({
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
                pos.x += sin(uTime * 0.3 + position.y * 0.1) * 1.0;
                pos.y += cos(uTime * 0.2 + position.x * 0.1) * 1.0;
                
                // Mouse influence
                float dist = length(pos.xy - uMouse * 30.0);
                pos.xy += normalize(pos.xy - uMouse * 30.0) * max(0.0, 5.0 - dist) * 0.3;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (200.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
                
                vAlpha = smoothstep(40.0, 10.0, -mvPosition.z);
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;
            
            void main() {
                float dist = length(gl_PointCoord - 0.5);
                if (dist > 0.5) discard;
                
                float glow = 1.0 - smoothstep(0.0, 0.5, dist);
                glow = pow(glow, 2.0);
                
                gl_FragColor = vec4(vColor, glow * vAlpha * 0.6);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // ---- Geometric shapes ----
    const shapes = [];

    // Create floating geometric wireframes
    const shapeConfigs = [
        { geo: new THREE.IcosahedronGeometry(3, 0), pos: [-18, 8, -10], color: 0xff6b35 },
        { geo: new THREE.OctahedronGeometry(2, 0), pos: [20, -6, -15], color: 0xff3d7f },
        { geo: new THREE.TorusGeometry(2.5, 0.5, 8, 24), pos: [-15, -10, -8], color: 0xc850c0 },
        { geo: new THREE.TetrahedronGeometry(2, 0), pos: [16, 12, -12], color: 0xff6b35 },
        { geo: new THREE.DodecahedronGeometry(1.5, 0), pos: [0, -15, -20], color: 0xff3d7f },
        { geo: new THREE.IcosahedronGeometry(2, 0), pos: [25, 0, -18], color: 0xc850c0 },
    ];

    shapeConfigs.forEach((config, i) => {
        const material = new THREE.MeshBasicMaterial({
            color: config.color,
            wireframe: true,
            transparent: true,
            opacity: 0.15,
        });
        const mesh = new THREE.Mesh(config.geo, material);
        mesh.position.set(...config.pos);
        mesh.userData = {
            rotSpeed: {
                x: (Math.random() - 0.5) * 0.005,
                y: (Math.random() - 0.5) * 0.005,
                z: (Math.random() - 0.5) * 0.003,
            },
            floatSpeed: 0.3 + Math.random() * 0.3,
            floatOffset: Math.random() * Math.PI * 2,
            originalY: config.pos[1],
        };
        scene.add(mesh);
        shapes.push(mesh);
    });

    // ---- Connection lines between nearby particles ----
    const lineGeo = new THREE.BufferGeometry();
    const maxLines = 200;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ---- Mouse tracking ----
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;

    document.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // ---- Scroll tracking ----
    let scrollY = 0;
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    });

    // ---- Resize handling ----
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ---- Animation loop ----
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        // Smooth mouse
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        // Update particle shader uniforms
        particleMaterial.uniforms.uTime.value = time;
        particleMaterial.uniforms.uMouse.value.set(mouseX, mouseY);

        // Move particles
        const posArray = particleGeometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            posArray[i3] += velocities[i].x;
            posArray[i3 + 1] += velocities[i].y;
            posArray[i3 + 2] += velocities[i].z;

            // Wrap around
            if (posArray[i3] > 40) posArray[i3] = -40;
            if (posArray[i3] < -40) posArray[i3] = 40;
            if (posArray[i3 + 1] > 40) posArray[i3 + 1] = -40;
            if (posArray[i3 + 1] < -40) posArray[i3 + 1] = 40;
        }
        particleGeometry.attributes.position.needsUpdate = true;

        // Update connection lines
        let lineCount = 0;
        const threshold = 8;
        const lp = lineGeo.attributes.position.array;
        const lc = lineGeo.attributes.color.array;

        for (let i = 0; i < Math.min(particleCount, 100) && lineCount < maxLines; i++) {
            const i3 = i * 3;
            for (let j = i + 1; j < Math.min(particleCount, 100) && lineCount < maxLines; j++) {
                const j3 = j * 3;
                const dx = posArray[i3] - posArray[j3];
                const dy = posArray[i3 + 1] - posArray[j3 + 1];
                const dz = posArray[i3 + 2] - posArray[j3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < threshold) {
                    const li = lineCount * 6;
                    lp[li] = posArray[i3];
                    lp[li + 1] = posArray[i3 + 1];
                    lp[li + 2] = posArray[i3 + 2];
                    lp[li + 3] = posArray[j3];
                    lp[li + 4] = posArray[j3 + 1];
                    lp[li + 5] = posArray[j3 + 2];

                    const alpha = 1 - dist / threshold;
                    lc[li] = 1 * alpha;
                    lc[li + 1] = 0.42 * alpha;
                    lc[li + 2] = 0.21 * alpha;
                    lc[li + 3] = 1 * alpha;
                    lc[li + 4] = 0.42 * alpha;
                    lc[li + 5] = 0.21 * alpha;

                    lineCount++;
                }
            }
        }

        // Clear remaining lines
        for (let i = lineCount * 6; i < maxLines * 6; i++) {
            lp[i] = 0;
            lc[i] = 0;
        }

        lineGeo.attributes.position.needsUpdate = true;
        lineGeo.attributes.color.needsUpdate = true;
        lineGeo.setDrawRange(0, lineCount * 2);

        // Animate shapes
        shapes.forEach((shape) => {
            shape.rotation.x += shape.userData.rotSpeed.x;
            shape.rotation.y += shape.userData.rotSpeed.y;
            shape.rotation.z += shape.userData.rotSpeed.z;
            shape.position.y =
                shape.userData.originalY +
                Math.sin(time * shape.userData.floatSpeed + shape.userData.floatOffset) * 2;
        });

        // Parallax camera movement
        camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
        camera.position.y += (mouseY * 2 - camera.position.y) * 0.02;

        // Scroll-based camera Z
        const scrollFactor = scrollY * 0.005;
        camera.position.z = 30 + scrollFactor;

        // Fade particles based on scroll
        const heroHeight = window.innerHeight;
        const fadeStart = heroHeight * 0.5;
        const fadeEnd = heroHeight * 2;
        let opacity = 1;
        if (scrollY > fadeStart) {
            opacity = Math.max(0.1, 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart));
        }
        particleMaterial.opacity = opacity;
        particles.material.opacity = opacity;

        renderer.render(scene, camera);
    }

    animate();
})();

// ---- Loader ----
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loader').classList.add('loaded');
    }, 2200);
});

// ---- Navbar scroll effect ----
const navbar = document.getElementById('navbar');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScrollY = currentScrollY;
});

// ---- Active nav link on scroll ----
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

const observerOptions = {
    root: null,
    rootMargin: '-40% 0px -40% 0px',
    threshold: 0,
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach((link) => {
                link.classList.toggle('active', link.dataset.section === id);
            });
        }
    });
}, observerOptions);

sections.forEach((section) => sectionObserver.observe(section));

// ---- Mobile Menu ----
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
});

mobileLinks.forEach((link) => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// ---- Scroll Animations ----
const animElements = document.querySelectorAll('[data-animate]');

const animObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const delay = parseInt(entry.target.dataset.delay) || 0;
                setTimeout(() => {
                    entry.target.classList.add('animated');
                }, delay);
                animObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
);

animElements.forEach((el) => animObserver.observe(el));

// ---- Counter Animation ----
const counters = document.querySelectorAll('.stat-number[data-count]');

const counterObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.count);
                const duration = 2000;
                const start = performance.now();

                function updateCounter(currentTime) {
                    const elapsed = currentTime - start;
                    const progress = Math.min(elapsed / duration, 1);

                    // Ease out cubic
                    const eased = 1 - Math.pow(1 - progress, 3);
                    entry.target.textContent = Math.floor(target * eased).toLocaleString();

                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        entry.target.textContent = target.toLocaleString();
                    }
                }

                requestAnimationFrame(updateCounter);
                counterObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.5 }
);

counters.forEach((counter) => counterObserver.observe(counter));

// ---- Gallery Filter ----
const filterBtns = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;

        galleryItems.forEach((item) => {
            if (filter === 'all' || item.dataset.category === filter) {
                item.classList.remove('hidden');
                item.style.animation = 'fadeIn 0.5s ease forwards';
            } else {
                item.classList.add('hidden');
            }
        });
    });
});

// ---- Testimonials Slider ----
const track = document.getElementById('testimonial-track');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const dotsContainer = document.getElementById('slider-dots');
const cards = document.querySelectorAll('.testimonial-card');
let currentSlide = 0;

// Create dots
cards.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.classList.add('slider-dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
});

const dots = document.querySelectorAll('.slider-dot');

function goToSlide(index) {
    currentSlide = index;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
}

prevBtn.addEventListener('click', () => {
    currentSlide = currentSlide === 0 ? cards.length - 1 : currentSlide - 1;
    goToSlide(currentSlide);
});

nextBtn.addEventListener('click', () => {
    currentSlide = currentSlide === cards.length - 1 ? 0 : currentSlide + 1;
    goToSlide(currentSlide);
});

// Auto-slide
let autoSlide = setInterval(() => {
    currentSlide = currentSlide === cards.length - 1 ? 0 : currentSlide + 1;
    goToSlide(currentSlide);
}, 5000);

// Pause on hover
track.addEventListener('mouseenter', () => clearInterval(autoSlide));
track.addEventListener('mouseleave', () => {
    autoSlide = setInterval(() => {
        currentSlide = currentSlide === cards.length - 1 ? 0 : currentSlide + 1;
        goToSlide(currentSlide);
    }, 5000);
});

// ---- Contact Form ----
const contactForm = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Visual feedback
    submitBtn.innerHTML = `
        <span>Sending...</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
            <circle cx="12" cy="12" r="10" stroke-dasharray="30 70"/>
        </svg>
    `;
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    setTimeout(() => {
        submitBtn.innerHTML = `
            <span>Message Sent! ✓</span>
        `;
        submitBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        submitBtn.style.opacity = '1';

        setTimeout(() => {
            submitBtn.innerHTML = `
                <span>Send Message</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
            `;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
            contactForm.reset();
        }, 3000);
    }, 1500);
});

// ---- Smooth scroll for anchor links ----
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ---- CSS animation keyframe for gallery filter ----
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }
    .spin {
        animation: spinAnim 1s linear infinite;
    }
    @keyframes spinAnim {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
