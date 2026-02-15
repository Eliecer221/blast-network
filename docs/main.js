// ============================================
// BLAST Network — Cybernetic Interface Logic
// ============================================

(function () {
    'use strict';

    // ─── Multi-language Support ────────────────────────────────
    const translations = {
        es: {
            nav_home: "INICIO",
            nav_ecosystem: "ECOSISTEMA",
            nav_markets: "MERCADOS",
            nav_governance: "GOBERNANZA",
            btn_connect: "CONECTAR WALLET",
            hero_title: "EL FUTURO ES<br><span class='gold-neon'>INMUTABLE</span>",
            hero_subtitle: "Arquitectura diseñada específicamente para finanzas descentralizadas de alta frecuencia y seguridad de activos de grado militar.",
            hero_access: "Acceso de Usuario / Registro",
            hero_input_placeholder: "Email / ID Neural",
            hero_btn_init: "INICIALIZAR ACCESO",
            hero_system_status: "SISTEMA OPERATIVO",
            stats_tps: "TPS",
            stats_blocktime: "TIEMPO BLOQUE",
            stats_nodes: "NODOS",
            markets_title: "MERCADOS <span class='gold-neon'>EN VIVO</span>",
            markets_asset: "ACTIVO",
            markets_price: "PRECIO",
            markets_change: "CAMBIO 24H",
            markets_vol: "VOLUMEN",
            markets_action: "ACCIÓN",
            btn_trade: "OPERAR",
            eco_title: "MÓDULOS <span class='gold-neon'>CENTRALES</span>",
            card_vault_title: "BLAST VAULT",
            card_vault_desc: "Almacenamiento en frío de grado militar. Tus llaves, tu fortaleza.",
            card_pad_title: "BLAST PAD",
            card_pad_desc: "Launchpad premier para proyectos verificados del ecosistema.",
            card_lottery_title: "BLAST LOTTERY",
            card_lottery_desc: "Lotería descentralizada probablemente justa. Gana a lo grande.",
            card_jackpot: "🏆 BOTE: <span id='lottery-jackpot'>0</span> BLAST",
            card_mining_title: "MINERÍA IOT",
            card_mining_desc: "Mina BLAST en dispositivos ESP32/Arduino.",
            btn_download: "DESCARGAR FW",
            footer_copyright: "BLAST NETWORK &copy; 2026",
            footer_system: "● SISTEMA ÓPTIMO",
            nav_referral: "REFERIDOS",
            banner1_title: "MINA BLAST — GANA CRIPTO HOY",
            banner1_desc: "Descarga el firmware para ESP32 y empieza a minar desde cualquier dispositivo IoT.",
            banner1_cta: "EMPEZAR",
            banner2_title: "INVITA AMIGOS — GANA HASTA 25%",
            banner2_desc: "Programa de referidos progresivo por niveles. Sube de nivel y desbloquea mayores recompensas.",
            banner2_cta: "VER PROGRAMA",
            banner3_title: "PROTEGE TUS ACTIVOS — BLAST VAULT",
            banner3_desc: "Seguridad militar con almacenamiento en frío. Tus llaves, tu fortaleza.",
            banner3_cta: "EXPLORAR",
            ref_title: "PROGRAMA DE <span class='gold-neon'>REFERIDOS</span>",
            ref_levels_title: "NIVELES Y RECOMPENSAS",
            ref_lvl1_detail: "Inicio — 0 referidos",
            ref_lvl2_detail: "5+ referidos activos",
            ref_lvl3_detail: "15+ referidos activos",
            ref_lvl4_detail: "50+ referidos activos",
            ref_lvl5_detail: "100+ referidos activos",
            ref_progress_label: "Tu progreso",
            ref_link_title: "TU ENLACE DE REFERIDO",
            ref_note: "💡 Ganas el 25% de las comisiones de transacción (Swap, Bridge, NFT) generadas por tus referidos de por vida.",
            ref_stat_invited: "INVITADOS",
            ref_stat_rewards: "BLAST GANADOS",
            ref_stat_level: "TU NIVEL"
        },
        en: {
            nav_home: "HOME",
            nav_ecosystem: "ECOSYSTEM",
            nav_markets: "MARKETS",
            nav_governance: "GOVERNANCE",
            btn_connect: "CONNECT WALLET",
            hero_title: "THE FUTURE IS<br><span class='gold-neon'>IMMUTABLE</span>",
            hero_subtitle: "Architecture specifically engineered for high-frequency decentralized finance and military-grade asset security.",
            hero_access: "User Access / Sign Up",
            hero_input_placeholder: "Email / Neural ID",
            hero_btn_init: "INITIALIZE ACCESS",
            hero_system_status: "SYSTEM OPERATIONAL",
            stats_tps: "TPS",
            stats_blocktime: "BLOCK TIME",
            stats_nodes: "NODES",
            markets_title: "LIVE <span class='gold-neon'>MARKETS</span>",
            markets_asset: "ASSET",
            markets_price: "PRICE",
            markets_change: "24H CHANGE",
            markets_vol: "VOLUME",
            markets_action: "ACTION",
            btn_trade: "TRADE",
            eco_title: "CORE <span class='gold-neon'>MODULES</span>",
            card_vault_title: "BLAST VAULT",
            card_vault_desc: "Military-grade cold storage. Your keys, your fortress.",
            card_pad_title: "BLAST PAD",
            card_pad_desc: "Premier launchpad for verified ecosystem projects.",
            card_lottery_title: "BLAST LOTTERY",
            card_lottery_desc: "Provably fair decentralized lottery. Win big.",
            card_jackpot: "🏆 JACKPOT: <span id='lottery-jackpot'>0</span> BLAST",
            card_mining_title: "IOT MINING",
            card_mining_desc: "Mine BLAST on ESP32/Arduino devices.",
            btn_download: "DOWNLOAD FW",
            footer_copyright: "BLAST NETWORK &copy; 2026",
            footer_system: "● SYSTEM OPTIMAL",
            nav_referral: "REFERRALS",
            banner1_title: "MINE BLAST — EARN CRYPTO TODAY",
            banner1_desc: "Download the ESP32 firmware and start mining from any IoT device.",
            banner1_cta: "START NOW",
            banner2_title: "INVITE FRIENDS — EARN UP TO 25%",
            banner2_desc: "Progressive referral program with levels. Level up and unlock higher rewards.",
            banner2_cta: "VIEW PROGRAM",
            banner3_title: "SECURE YOUR ASSETS — BLAST VAULT",
            banner3_desc: "Military-grade cold storage security. Your keys, your fortress.",
            banner3_cta: "EXPLORE",
            ref_title: "REFERRAL <span class='gold-neon'>PROGRAM</span>",
            ref_levels_title: "LEVELS & REWARDS",
            ref_lvl1_detail: "Start — 0 referrals",
            ref_lvl2_detail: "5+ active referrals",
            ref_lvl3_detail: "15+ active referrals",
            ref_lvl4_detail: "50+ active referrals",
            ref_lvl5_detail: "100+ active referrals",
            ref_progress_label: "Your progress",
            ref_link_title: "YOUR REFERRAL LINK",
            ref_note: "💡 You earn 25% of transaction fees (Swap, Bridge, NFT) generated by your referrals for life.",
            ref_stat_invited: "INVITED",
            ref_stat_rewards: "BLAST EARNED",
            ref_stat_level: "YOUR LEVEL"
        }
    };

    let currentLang = localStorage.getItem('blast_lang') || 'es';

    function updateLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('blast_lang', lang);

        // Update Toggle Button Text
        const toggleBtn = document.getElementById('lang-toggle');
        if (toggleBtn) toggleBtn.innerText = lang === 'es' ? 'EN' : 'ES'; // Show opposite option or current? Usually show current. Let's show current.
        if (toggleBtn) toggleBtn.innerText = lang.toUpperCase();

        // Update Elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                // Check if it has child elements we need to preserve (like spans in headers)
                // For simplicity, we assume HTML content for headers
                el.innerHTML = translations[lang][key];
            }
        });

        // Special handling for placeholders
        document.querySelectorAll('input[placeholder]').forEach(el => {
            // We'd need to add data-i18n-placeholder to inputs, but for now let's skip or hardcode if needed.
            // Let's add simple check if parent has data-i18n corresponding to input
        });
    }

    window.toggleLanguage = function () {
        const newLang = currentLang === 'es' ? 'en' : 'es';
        updateLanguage(newLang);
    };

    // Initialize on load
    document.addEventListener('DOMContentLoaded', () => {
        updateLanguage(currentLang);
    });

    // ─── Smooth Scroll Navigation ──────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const headerOffset = document.querySelector('.cyber-nav').offsetHeight;
                window.scrollTo({
                    top: targetElement.offsetTop - headerOffset,
                    behavior: 'smooth'
                });

                // Update active state in nav
                document.querySelectorAll('.console-link').forEach(link => link.classList.remove('active'));
                if (this.classList.contains('console-link')) {
                    this.classList.add('active');
                }
            }
        });
    });

    // ─── Intersection Observer for Animations ────────────────
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active'); // General trigger class

                // Trigger counters if Stats Module is visible
                if (entry.target.classList.contains('stats-module')) {
                    startCounters();
                }

                // Animate glitch text
                if (entry.target.querySelector('.cyber-glitch')) {
                    entry.target.querySelector('.cyber-glitch').classList.add('glitch-active');
                }
            }
        });
    }, observerOptions);

    // Observe key elements
    document.querySelectorAll('.hero-interface, .stats-module, .market-row, .cyber-card').forEach(el => {
        observer.observe(el);
    });

    // ─── Digital Counters ──────────────────────────────────────
    let countersStarted = false;
    function startCounters() {
        if (countersStarted) return;
        countersStarted = true;

        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target') || 0;
            const duration = 1500;
            const increment = target / (duration / 16);

            let current = 0;
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current).toLocaleString();
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = target.toLocaleString() + (target > 1000 ? '+' : '');
                }
            };
            updateCounter();
        });
    }

    // ─── Neural Grid Background Effect ────────────────────────
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Only run on desktop to save battery
    if (window.innerWidth > 768) {
        canvas.id = 'neural-canvas';
        Object.assign(canvas.style, {
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: '-1', opacity: '0.4', pointerEvents: 'none'
        });
        document.body.prepend(canvas);

        let nodes = [];
        const NODE_COUNT = 40;
        const CONNECTION_DIST = 150;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        class Node {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }
            draw() {
                ctx.fillStyle = '#ffd700'; // Gold nodes
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < NODE_COUNT; i++) nodes.push(new Node());

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connections
            nodes.forEach((node, i) => {
                node.update();
                node.draw();

                for (let j = i + 1; j < nodes.length; j++) {
                    const other = nodes[j];
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < CONNECTION_DIST) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 215, 0, ${1 - dist / CONNECTION_DIST})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.stroke();
                    }
                }
            });
            requestAnimationFrame(animate);
        }
        animate();
    }

    // ─── Mobile Menu Logic ─────────────────────────────────────
    const menuTrigger = document.querySelector('.menu-trigger');
    const navConsole = document.querySelector('.nav-center-console');

    // Create mobile overlay if it doesn't exist (since we changed structure)
    if (window.innerWidth <= 768) {
        // Simple toggle for now, in a real production app we'd build a full overlay
        if (menuTrigger) {
            menuTrigger.addEventListener('click', () => {
                menuTrigger.classList.toggle('active');
                // For this structure, we might need a dedicated mobile menu container
                // But let's toggle a class on the nav to show links if we add CSS for it
                document.querySelector('.cyber-nav').classList.toggle('mobile-open');

                // Toggle visibility of console links for mobile
                if (navConsole.style.display === 'flex') {
                    navConsole.style.display = 'none';
                } else {
                    navConsole.style.display = 'flex';
                    navConsole.style.flexDirection = 'column';
                    navConsole.style.position = 'absolute';
                    navConsole.style.top = '100%';
                    navConsole.style.left = '0';
                    navConsole.style.width = '100%';
                    navConsole.style.background = 'rgba(5,5,7,0.95)';
                    navConsole.style.padding = '2rem';
                }
            });
        }
    }

    // ─── Referral System Logic ──────────────────────────────────

    // Generate a referral code (simulated for frontend demo)
    function generateReferralCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Initialize referral link on page load
    function initReferral() {
        let refCode = localStorage.getItem('blast_ref_code');
        if (!refCode) {
            refCode = generateReferralCode();
            localStorage.setItem('blast_ref_code', refCode);
        }
        const linkInput = document.getElementById('referral-link-input');
        if (linkInput) {
            linkInput.value = `https://blast.network/?ref=${refCode}`;
        }

        // Check if user arrived via referral link
        const urlParams = new URLSearchParams(window.location.search);
        const incomingRef = urlParams.get('ref');
        if (incomingRef && incomingRef !== refCode) {
            localStorage.setItem('blast_referred_by', incomingRef);
        }
    }

    // Copy referral link to clipboard
    window.copyReferralLink = function () {
        const linkInput = document.getElementById('referral-link-input');
        const copyBtn = document.getElementById('btn-copy-ref');
        if (linkInput) {
            navigator.clipboard.writeText(linkInput.value).then(() => {
                copyBtn.textContent = '✅';
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.textContent = '📋';
                    copyBtn.classList.remove('copied');
                }, 2000);
            }).catch(() => {
                // Fallback for older browsers
                linkInput.select();
                document.execCommand('copy');
                copyBtn.textContent = '✅';
                setTimeout(() => { copyBtn.textContent = '📋'; }, 2000);
            });
        }
    };

    // Observe referral section for animations
    const refSection = document.querySelector('.referral-section');
    if (refSection) {
        observer.observe(refSection);
    }

    // Observe banners for animation
    document.querySelectorAll('.promo-banner').forEach(el => {
        observer.observe(el);
    });

    // Initialize referral on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        initReferral();
    });

})();
