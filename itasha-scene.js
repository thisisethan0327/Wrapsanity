/* ============================================
   EMWRAPS — Itasha Hero Three.js Scene
   Anime-themed particle background with image-to-particles
   ============================================ */

(function () {
    const canvas = document.getElementById('itasha-canvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    // ---- Anime color palette (Miku-inspired) ----
    const mikuTeal = new THREE.Color(0x39c5bb);  // Miku's signature teal
    const mikuPink = new THREE.Color(0xe8457a);  // accent pink
    const mikuCyan = new THREE.Color(0x66e0f0);  // lighter cyan
    const softWhite = new THREE.Color(0x8899aa);  // soft neutral
    const sakuraPink = new THREE.Color(0xf5a0c0); // sakura blossom

    // =========================================
    // IMAGE-TO-PARTICLES: Load Miku car image
    // =========================================
    const imgParticleGroup = new THREE.Group();
    scene.add(imgParticleGroup);

    // We load the image via an off-screen canvas to sample pixel data
    const img = new Image();
    img.src = 'img/itasha/BMW_340i_Miku/emwraps_1763156665_3765953525617718466_5673697168_BME .jpg';

    img.onerror = function () {
        console.warn('Itasha scene: image failed to load, continuing with ambient particles only.');
    };

    img.onload = function () {
        const sampleCanvas = document.createElement('canvas');
        const ctx = sampleCanvas.getContext('2d');

        // Sample at low resolution for particle density
        const sampleW = 160;
        const sampleH = Math.round(sampleW * (img.height / img.width));
        sampleCanvas.width = sampleW;
        sampleCanvas.height = sampleH;
        ctx.drawImage(img, 0, 0, sampleW, sampleH);

        let imageData;
        try {
            imageData = ctx.getImageData(0, 0, sampleW, sampleH);
        } catch (e) {
            console.warn('Itasha scene: cannot read image pixels (CORS), continuing with ambient particles only.');
            return;
        }
        const data = imageData.data;

        // Sample every Nth pixel, skip dark pixels
        const step = 2;
        const positions = [];
        const colors = [];
        const sizes = [];

        const scaleX = 60;  // spread width in world units
        const scaleY = scaleX * (sampleH / sampleW);

        for (let y = 0; y < sampleH; y += step) {
            for (let x = 0; x < sampleW; x += step) {
                const idx = (y * sampleW + x) * 4;
                const r = data[idx] / 255;
                const g = data[idx + 1] / 255;
                const b = data[idx + 2] / 255;
                const brightness = r * 0.299 + g * 0.587 + b * 0.114;

                // Skip very dark pixels
                if (brightness < 0.15) continue;

                // World position: center the image
                const wx = (x / sampleW - 0.5) * scaleX;
                const wy = -(y / sampleH - 0.5) * scaleY;
                const wz = (Math.random() - 0.5) * 6; // slight depth spread

                positions.push(wx, wy, wz);
                colors.push(r, g, b);
                sizes.push(brightness * 1.8 + 0.3);
            }
        }

        const imgGeo = new THREE.BufferGeometry();
        imgGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        imgGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        imgGeo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        // Store original positions for wave animation
        imgGeo.userData = { originalPositions: new Float32Array(positions) };

        const imgMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uOpacity: { value: 0.0 },
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vAlpha;
                uniform float uTime;

                void main() {
                    vColor = color;
                    vec3 pos = position;

                    // Gentle wave distortion
                    pos.x += sin(uTime * 0.3 + position.y * 0.15) * 0.8;
                    pos.y += cos(uTime * 0.25 + position.x * 0.12) * 0.6;
                    pos.z += sin(uTime * 0.2 + position.x * 0.08 + position.y * 0.08) * 1.0;

                    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (150.0 / -mvPos.z);
                    gl_Position = projectionMatrix * mvPos;

                    vAlpha = smoothstep(60.0, 15.0, -mvPos.z);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                uniform float uOpacity;

                void main() {
                    float d = length(gl_PointCoord - 0.5);
                    if (d > 0.5) discard;

                    float glow = 1.0 - smoothstep(0.0, 0.5, d);
                    glow = pow(glow, 2.5);

                    gl_FragColor = vec4(vColor, glow * vAlpha * uOpacity);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const imgParticles = new THREE.Points(imgGeo, imgMat);
        imgParticles.position.z = -15;
        imgParticleGroup.add(imgParticles);

        // Fade in the image particles
        let fadeIn = 0;
        function fadeInImage() {
            fadeIn += 0.005;
            if (fadeIn < 0.22) {
                imgMat.uniforms.uOpacity.value = fadeIn;
                requestAnimationFrame(fadeInImage);
            } else {
                imgMat.uniforms.uOpacity.value = 0.22;
            }
        }
        setTimeout(fadeInImage, 800);
    };

    // =========================================
    // AMBIENT FLOATING PARTICLES (like index.html)
    // =========================================
    const particleCount = 400;
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

        // Anime-themed palette
        const r = Math.random();
        let col;
        if (r < 0.35) col = mikuTeal;
        else if (r < 0.55) col = mikuPink;
        else if (r < 0.75) col = mikuCyan;
        else if (r < 0.85) col = sakuraPink;
        else col = softWhite;

        colors[i3] = col.r;
        colors[i3 + 1] = col.g;
        colors[i3 + 2] = col.b;

        sizes[i] = Math.random() * 2.5 + 0.3;

        velocities.push({
            x: (Math.random() - 0.5) * 0.012,
            y: (Math.random() - 0.5) * 0.012,
            z: (Math.random() - 0.5) * 0.006,
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

    // =========================================
    // WIREFRAME GEOMETRIC ACCENTS (anime-themed)
    // =========================================
    const shapes = [];
    const shapeConfigs = [
        // Star-like shapes in Miku colors
        { geo: new THREE.IcosahedronGeometry(3, 1), pos: [-25, 10, -20], color: 0x39c5bb },
        { geo: new THREE.OctahedronGeometry(2, 0), pos: [28, -8, -25], color: 0xe8457a },
        { geo: new THREE.TorusGeometry(3, 0.3, 8, 32), pos: [-20, -12, -15], color: 0x39c5bb },
        { geo: new THREE.TetrahedronGeometry(1.5, 0), pos: [22, 15, -18], color: 0x66e0f0 },
        { geo: new THREE.RingGeometry(2, 3, 6), pos: [0, -18, -22], color: 0xf5a0c0 },
        { geo: new THREE.DodecahedronGeometry(1.8, 0), pos: [30, 5, -30], color: 0x39c5bb },
        // Extra decorative shapes
        { geo: new THREE.TorusGeometry(2, 0.2, 6, 24), pos: [-30, 5, -28], color: 0xe8457a },
        { geo: new THREE.OctahedronGeometry(1.5, 0), pos: [-15, 18, -22], color: 0x66e0f0 },
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

    // =========================================
    // CONNECTION LINES
    // =========================================
    const lineMax = 120;
    const lineGeo = new THREE.BufferGeometry();
    const lPos = new Float32Array(lineMax * 6);
    const lCol = new Float32Array(lineMax * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lCol, 3));
    const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // =========================================
    // GRID FLOOR
    // =========================================
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
        color: 0x39c5bb,
        transparent: true,
        opacity: 0.035,
    });
    const grid = new THREE.LineSegments(gridGeo, gridMat);
    grid.position.y = -20;
    scene.add(grid);

    // =========================================
    // INTERACTION
    // =========================================
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

    // =========================================
    // ANIMATE
    // =========================================
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        mX += (tX - mX) * 0.04;
        mY += (tY - mY) * 0.04;

        particleMat.uniforms.uTime.value = t;
        particleMat.uniforms.uMouse.value.set(mX, mY);

        // Update image particle time if loaded
        imgParticleGroup.children.forEach(child => {
            if (child.material && child.material.uniforms && child.material.uniforms.uTime) {
                child.material.uniforms.uTime.value = t;
            }
        });

        // Move ambient particles
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

        // Connection lines (teal-colored)
        let lc = 0;
        const threshold = 10;
        const lpArr = lineGeo.attributes.position.array;
        const lcArr = lineGeo.attributes.color.array;
        const checkCount = Math.min(particleCount, 60);

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
                    // Teal connection color
                    lcArr[li] = 0.22 * a; lcArr[li + 1] = 0.77 * a; lcArr[li + 2] = 0.73 * a;
                    lcArr[li + 3] = 0.22 * a; lcArr[li + 4] = 0.77 * a; lcArr[li + 5] = 0.73 * a;
                    lc++;
                }
            }
        }
        // Clear unused lines
        for (let i = lc * 6; i < lineMax * 6; i++) {
            lpArr[i] = 0;
            lcArr[i] = 0;
        }
        lineGeo.attributes.position.needsUpdate = true;
        lineGeo.attributes.color.needsUpdate = true;

        // Rotate wireframe shapes
        shapes.forEach(s => {
            s.rotation.x += s.userData.rx;
            s.rotation.y += s.userData.ry;
            s.rotation.z += s.userData.rz;
            s.position.y = s.userData.baseY + Math.sin(t * s.userData.floatSpeed + s.userData.floatOffset) * 1.5;
        });

        // Camera parallax from mouse
        camera.position.x += (mX * 3 - camera.position.x) * 0.02;
        camera.position.y += (mY * 2 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        // Fade out on scroll (only active during hero section)
        const heroH = window.innerHeight;
        const scrollFade = 1 - Math.min(scrollY / heroH, 1);
        canvas.style.opacity = scrollFade;

        renderer.render(scene, camera);
    }

    animate();
})();
