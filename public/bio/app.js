/**
 * ====================================================================
 * STANDALONE BIO LINK LOGIC & INTERACTIONS (slat.cc / guns.lol Style)
 * ====================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    const config = typeof BIO_CONFIG !== "undefined" ? BIO_CONFIG : {};

    // Elements
    const splashScreen = document.getElementById("splashScreen");
    const splashTitle = document.getElementById("splashTitle");
    const splashSubtitle = document.getElementById("splashSubtitle");
    const bioCard = document.getElementById("bioCard");
    const profileAvatar = document.getElementById("profileAvatar");
    const displayName = document.getElementById("displayName");
    const profileHandle = document.getElementById("profileHandle");
    const profileBio = document.getElementById("profileBio");
    const badgesRow = document.getElementById("badgesRow");
    const discordTagPill = document.getElementById("discordTagPill");
    const discordTagText = document.getElementById("discordTagText");
    const linksList = document.getElementById("linksList");
    const viewCountText = document.getElementById("viewCountText");
    const toastMessage = document.getElementById("toastMessage");
    const toastText = document.getElementById("toastText");

    // Audio Elements
    const bgAudio = document.getElementById("bgAudio");
    const musicPlayerWidget = document.getElementById("musicPlayerWidget");
    const playerToggleBtn = document.getElementById("playerToggleBtn");
    const playerToggleIcon = document.getElementById("playerToggleIcon");
    const trackTitle = document.getElementById("trackTitle");
    const trackArtist = document.getElementById("trackArtist");
    const volumeBtn = document.getElementById("volumeBtn");
    const volumeIcon = document.getElementById("volumeIcon");

    // =========================================================================
    // 1. POPULATE PROFILE DATA FROM CONFIG.JS
    // =========================================================================
    function initProfile() {
        const p = config.profile || {};

        if (profileAvatar && p.avatar) profileAvatar.src = p.avatar;
        if (displayName && p.displayName) displayName.textContent = p.displayName;
        if (profileHandle && p.handle) profileHandle.textContent = p.handle;
        if (profileBio && p.bio) profileBio.innerHTML = p.bio.replace(/\n/g, "<br>");
        if (discordTagText && p.discordTag) discordTagText.textContent = `Discord: ${p.discordTag}`;

        // Populate Badges
        if (badgesRow && Array.isArray(p.badges)) {
            badgesRow.innerHTML = p.badges.map(b => `
                <div class="badge-pill" style="border-color: ${b.color || '#38bdf8'}44; color: ${b.color || '#38bdf8'};">
                    <i data-lucide="${b.icon || 'shield'}" style="width: 12px; height: 12px;"></i>
                    <span>${b.text}</span>
                </div>
            `).join("");
        }

        // Populate Links
        if (linksList && Array.isArray(config.links)) {
            linksList.innerHTML = config.links.map(link => {
                const color = link.color || "#38bdf8";
                const badgeHtml = link.badge ? `<span class="link-badge" style="border-color: ${color}66; color: ${color};">${link.badge}</span>` : "";
                
                return `
                    <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="bio-link-card" style="--link-color: ${color}; --link-glow: ${color}44;">
                        <div class="link-left">
                            <div class="link-icon-box" style="border-color: ${color}44; color: ${color};">
                                <i data-lucide="${link.icon || 'external-link'}"></i>
                            </div>
                            <div class="link-text-group">
                                <span class="link-title">${link.title}</span>
                                <span class="link-subtitle">${link.subtitle || ''}</span>
                            </div>
                        </div>
                        <div class="link-right">
                            ${badgeHtml}
                            <i data-lucide="chevron-right" class="link-arrow" style="width: 16px; height: 16px;"></i>
                        </div>
                    </a>
                `;
            }).join("");
        }

        // Configure Music Info
        if (config.music) {
            if (trackTitle && config.music.title) trackTitle.textContent = config.music.title;
            if (trackArtist && config.music.artist) trackArtist.textContent = config.music.artist;
            if (bgAudio && config.music.src) {
                bgAudio.src = config.music.src;
                bgAudio.volume = typeof config.music.volume === "number" ? config.music.volume : 0.5;
            }
        }

        // Splash Text
        if (config.theme) {
            if (splashTitle && config.theme.splashText) splashTitle.textContent = config.theme.splashText;
            if (splashSubtitle && config.theme.splashSubtitle) splashSubtitle.textContent = config.theme.splashSubtitle;
        }

        refreshIcons();
    }

    function refreshIcons() {
        if (window.lucide && typeof window.lucide.createIcons === "function") {
            window.lucide.createIcons();
        }
    }

    // =========================================================================
    // 2. CLICK TO ENTER & AUDIO AUTOPLAY ENGINE
    // =========================================================================
    let isEntered = false;
    let isPlaying = false;

    function enterWebsite() {
        if (isEntered) return;
        isEntered = true;

        // Dismiss splash screen with smooth exit
        if (splashScreen) {
            splashScreen.classList.add("hidden");
            setTimeout(() => {
                splashScreen.style.display = "none";
            }, 600);
        }

        // Attempt Audio Autoplay upon user interaction (bypasses browser autoplay restrictions)
        if (bgAudio && config.music && config.music.enabled) {
            bgAudio.play().then(() => {
                setPlayState(true);
            }).catch(err => {
                console.warn("[Bio Link] Audio autoplay waiting for manual play:", err);
                setPlayState(false);
            });
        }
    }

    if (splashScreen) {
        splashScreen.addEventListener("click", enterWebsite);
        splashScreen.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") enterWebsite();
        });
    }

    function setPlayState(playing) {
        isPlaying = playing;
        if (!musicPlayerWidget) return;

        if (playing) {
            musicPlayerWidget.classList.add("playing");
            if (playerToggleIcon) {
                playerToggleIcon.setAttribute("data-lucide", "pause");
            }
        } else {
            musicPlayerWidget.classList.remove("playing");
            if (playerToggleIcon) {
                playerToggleIcon.setAttribute("data-lucide", "play");
            }
        }
        refreshIcons();
    }

    if (playerToggleBtn && bgAudio) {
        playerToggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (bgAudio.paused) {
                bgAudio.play().then(() => setPlayState(true)).catch(() => setPlayState(false));
            } else {
                bgAudio.pause();
                setPlayState(false);
            }
        });
    }

    if (volumeBtn && bgAudio) {
        volumeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            bgAudio.muted = !bgAudio.muted;
            if (volumeIcon) {
                volumeIcon.setAttribute("data-lucide", bgAudio.muted ? "volume-x" : "volume-2");
                refreshIcons();
            }
        });
    }

    // =========================================================================
    // 3. DISCORD COPY INTERACTION & TOAST NOTIFICATION
    // =========================================================================
    let toastTimeout = null;
    function showToast(msg) {
        if (!toastMessage) return;
        if (toastText) toastText.textContent = msg;
        toastMessage.classList.add("show");
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastMessage.classList.remove("show");
        }, 2400);
    }

    if (discordTagPill) {
        discordTagPill.addEventListener("click", (e) => {
            e.stopPropagation();
            const tag = (config.profile && config.profile.discordTag) || "Blacklistxyx";
            navigator.clipboard.writeText(tag).then(() => {
                showToast(`คัดลอก Discord: ${tag} สำเร็จ!`);
            }).catch(() => {
                showToast(`Discord: ${tag}`);
            });
        });
    }

    // =========================================================================
    // 4. VISITOR VIEW COUNTER (Persistent Local Count-Up)
    // =========================================================================
    function initViewCounter() {
        if (!viewCountText) return;
        let count = parseInt(localStorage.getItem("bio_view_count") || "1420", 10);
        count += 1;
        localStorage.setItem("bio_view_count", String(count));

        // Smooth number count-up animation
        const start = Math.max(0, count - 30);
        let current = start;
        const duration = 1200;
        const stepTime = Math.max(20, Math.floor(duration / 30));

        const timer = setInterval(() => {
            current += 1;
            viewCountText.textContent = current.toLocaleString();
            if (current >= count) {
                clearInterval(timer);
                viewCountText.textContent = count.toLocaleString();
            }
        }, stepTime);
    }

    // =========================================================================
    // 5. 3D TILT INTERACTIVE CARD EFFECT
    // =========================================================================
    if (bioCard && window.innerWidth > 768 && (!config.theme || config.theme.tiltEffect !== false)) {
        document.addEventListener("mousemove", (e) => {
            const rect = bioCard.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            const rotateX = (-y / (rect.height / 2)) * 7;
            const rotateY = (x / (rect.width / 2)) * 7;

            bioCard.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
        });

        document.addEventListener("mouseleave", () => {
            bioCard.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
        });
    }

    // =========================================================================
    // 6. CYBER DUST & STARFIELD CANVAS PARTICLES
    // =========================================================================
    function initParticles() {
        const canvas = document.getElementById("particleCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        window.addEventListener("resize", () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const PARTICLE_COUNT = Math.min(80, Math.floor((width * height) / 14000));
        const particles = [];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.45,
                vy: (Math.random() - 0.5) * 0.45,
                size: Math.random() * 2 + 0.6,
                alpha: Math.random() * 0.6 + 0.2
            });
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = "#38bdf8";
                ctx.fill();

                // Connect nearby particles with subtle lines
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 90) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 90) * 0.15})`;
                        ctx.lineWidth = 0.6;
                        ctx.shadowBlur = 0;
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(draw);
        }

        draw();
    }

    // Run Initializers
    initProfile();
    initParticles();
    initViewCounter();
});
