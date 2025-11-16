// ==================== SUPABASE GLOBAL CONFIG ====================
const SUPABASE_URL = "https://gydiothkntpejybyjvpx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZGlvdGhrbnRwZWp5YnlqdnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDgyNTQsImV4cCI6MjA3ODE4NDI1NH0.AP5VyYh3rtes888Klm0_kR3mosus19P5RnCPHxJBWj4";

const supabaseClient = typeof supabase !== "undefined"
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// ============== AUTH: SIGNUP ==============
async function signUpWithEmailAndUsername(email, username, password) {
    if (!supabaseClient) throw new Error("Supabase nicht geladen");

    // username bei der Registrierung direkt mitschicken
    const { data: signUpData, error: signUpErr } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: { username }   // landet in new.raw_user_meta_data
        }
    });

    if (signUpErr) throw signUpErr;

    // WICHTIG: kein extra INSERT mehr hier!
    return signUpData;
}


// ============== AUTH: LOGIN (Email ODER Username) ==============
async function signInByEmailOrUsername(identity, password) {
    if (!supabaseClient) throw new Error("Supabase nicht geladen");

    let emailToUse = identity;

    // wenn kein @ drin ist → wir denken, es ist username → email aus profiles holen
    if (!identity.includes("@")) {
        const { data, error } = await supabaseClient
            .from("profiles")
            .select("email")
            .eq("username", identity)
            .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("Kein Account mit diesem Benutzernamen gefunden.");
        emailToUse = data.email;
    }

    const { data: loginData, error: loginErr } = await supabaseClient.auth.signInWithPassword({
        email: emailToUse,
        password
    });

    if (loginErr) throw loginErr;
    return loginData;
}

// ============== AUTH: SEITE SCHÜTZEN (home.html) ==============
async function protectPageIfNeeded() {
    if (!supabaseClient) return;
    if (!document.body.classList.contains("needs-auth")) return;

    const { data } = await supabaseClient.auth.getSession();
    const session = data?.session;
    if (!session) {
        window.location.href = "index.html";
        return;
    }

    // <--- HIER: global merken
    window.currentUser = session.user;

    const { data: profile } = await supabaseClient
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .maybeSingle();

    console.log("eingeloggt als:", profile?.username || session.user.email);
}


// direkt beim Laden prüfen
document.addEventListener("DOMContentLoaded", protectPageIfNeeded);

// ============== AUTH: EVENTS FÜR index.html ==============
document.addEventListener("DOMContentLoaded", () => {
    // Elemente nur auf der Login-Seite vorhanden
    const loginIdentity = document.getElementById("loginIdentity");
    const loginPassword = document.getElementById("loginPassword");
    const loginBtn = document.getElementById("loginBtn");
    const loginMsg = document.getElementById("loginMsg");

    const regEmail = document.getElementById("regEmail");
    const regUsername = document.getElementById("regUsername");
    const regPassword = document.getElementById("regPassword");
    const signupBtn = document.getElementById("signupBtn");
    const signupMsg = document.getElementById("signupMsg");

    // Enter auf den LOGIN-Feldern => Login auslösen
    if (loginIdentity && loginPassword && loginBtn) {
        [loginIdentity, loginPassword].forEach(inp => {
            inp.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    loginBtn.click();
                }
            });
        });
    }

    // Enter auf den SIGNUP-Feldern => Signup auslösen (optional)
    if (regEmail && regUsername && regPassword && signupBtn) {
        [regEmail, regUsername, regPassword].forEach(inp => {
            inp.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    signupBtn.click();
                }
            });
        });
    }


    // LOGIN
    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            loginMsg.textContent = "";
            try {
                await signInByEmailOrUsername(loginIdentity.value.trim(), loginPassword.value.trim());
                // Nach Login → Intro anzeigen statt direkt Seite öffnen
                sessionStorage.setItem("showIntro", "true");
                window.location.href = "home.html";
            } catch (err) {
                console.error(err);
                loginMsg.textContent = err.message || "Login fehlgeschlagen.";
            }
        });
    }

    // SIGNUP
    if (signupBtn) {
        signupBtn.addEventListener("click", async () => {
            signupMsg.textContent = "";
            try {
                await signUpWithEmailAndUsername(
                    regEmail.value.trim(),
                    regUsername.value.trim(),
                    regPassword.value.trim()
                );
                signupMsg.textContent = "Account erstellt! Schau ggf. in deine E-Mail.";
            } catch (err) {
                console.error(err);
                signupMsg.textContent = err.message || "Registrierung fehlgeschlagen.";
            }
        });
    }
});


async function supabaseLogout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
}


//--------------------------------------------------------------- Sidebar ein-/ausklappen ---------------------------------------------------
const sidebar = document.getElementById("sidebar");
const globalToggle = document.getElementById("sidebarToggle");
const mobileToggle = document.getElementById("mobileSidebarToggle");

if (globalToggle && sidebar) {
    globalToggle.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
    });
}

if (mobileToggle && sidebar) {
    mobileToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}



/* === Panels wechseln (wie Tabs) === */
const menuItems = document.querySelectorAll(".menu-item");
const panels = document.querySelectorAll(".panel");

menuItems.forEach((item) => {
    item.addEventListener("click", () => {
        // aktives Menü markieren
        menuItems.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");

        // Panels umschalten
        const target = item.getAttribute("data-target");
        panels.forEach((p) => p.classList.remove("active"));
        document.getElementById(target).classList.add("active");
    });
});

// ===== Slideshow-Referenzen (falls noch nicht vorhanden) =====
// ===== Referenzen =====
const slides = document.querySelectorAll(".slide");
let current = 0;

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const rightTitle = document.getElementById("rightTitle");
const rightBody = document.getElementById("rightBody");

// ===== Funktion: nur rechter Text wechselt =====
function updateRightText(index) {
    const s = slides[index];
    if (!s) return;

    rightTitle.textContent = s.dataset.rightTitle || "Zusatzinfo";
    rightBody.textContent = s.dataset.right || "";
}

// ===== Slideshow-Funktionen =====
function showSlide(index) {
    slides.forEach(sl => sl.classList.remove("active"));
    slides[index].classList.add("active");
    updateRightText(index);   // <- nur rechte Seite aktualisieren
}

function goNext() {
    current = (current + 1) % slides.length;
    showSlide(current);
}

function goPrev() {
    current = (current - 1 + slides.length) % slides.length;
    showSlide(current);
}

// ===== Buttons =====
if (nextBtn) nextBtn.addEventListener("click", goNext);
if (prevBtn) prevBtn.addEventListener("click", goPrev);

// ===== Tastatursteuerung (optional) =====
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goPrev();
});

// ===== Startzustand =====
updateRightText(current);

// ----------------------------------------------------- AB HIER IST PLATZHALTER 2 DAS HERZ ----------------------------------------------

// ===== Herz-„Fäden“-Animation (Platzhalter 2) =====
(() => {
    const panel = document.getElementById("panel-platzhalter2");
    const canvas = document.getElementById("heartCanvas");
    if (!panel || !canvas) return;

    const ctx = canvas.getContext("2d");
    let rafId = null;
    let running = false;

    const W = canvas.width;
    const H = canvas.height;
    const CX = W / 2;
    const CY = H / 2;

    // Herz-Parameterkurve (klassisch)
    function hx(k) { return 16 * Math.pow(Math.sin(k), 3); }
    function hy(k) {
        return 13 * Math.cos(k) - 5 * Math.cos(2 * k) - 2 * Math.cos(3 * k) - Math.cos(4 * k);
    }

    // Einstellungen für den Look
    const scale = 20;   // Größe des Herzens
    const rays = 128;     // wie viele Fäden pro Frame
    const speed = 0.00018;  // wie schnell die Fäden wachsen / Phasenrotation
    let t = 0;      // Zeit/Phase
    let grow = 0;      // Wachstum von 0->1 (Herz „entsteht“)

    // weiches Ausfaden: halbtransparent übermalen statt hard clear
    function fadeBackground() {
        ctx.fillStyle = "rgba(83, 60, 72, 0.38)";
        // je kleiner, desto längere Spuren
    }

    function drawFrame() {
        fadeBackground();

        ctx.save();
        // (0,0) in die Mitte und y-Achse invertieren (wie bei Turtle)
        ctx.translate(CX, CY - 40);
        ctx.scale(1, -1);

        // „Strahlen“ zeichnen
        ctx.lineCap = "round";
        ctx.shadowColor = "rgba(230, 22, 84, 0.75)";
        ctx.shadowBlur = 12;

        for (let i = 0; i < rays; i++) {
            // fächerförmig gleichmäßig über die Kurve verteilt
            const k = (i / rays) * Math.PI * 2 + t;

            const x = hx(k) * scale;
            const y = hy(k) * scale;

            // Länge des Fadens (0..1). Erst wächst alles (grow), dann „atmet“ leicht
            const pulse = 0.03 * Math.sin(t * 4);
            const len = Math.max(0, Math.min(1, grow + pulse));

            ctx.beginPath();
            ctx.strokeStyle = "rgba(214, 36, 95, 0.86)";  // Rot
            ctx.lineWidth = 2;

            // vom Zentrum bis zu einem Anteil der Zielposition
            ctx.moveTo(0, 0);
            ctx.lineTo(x * len, y * len);
            ctx.stroke();
        }

        ctx.restore();

        // Zeit voranschreiten lassen
        t += speed;
        // Herz wachsen lassen bis voll (1)
        if (grow < 1) grow = Math.min(1, grow + 0.012);

        rafId = requestAnimationFrame(drawFrame);
    }

    function start() {
        if (running) return;
        running = true;
        // Reset für neuen Eintritt – Herz „entsteht“ jedes Mal neu
        ctx.clearRect(0, 0, W, H);
        t = 0;
        grow = 0;
        rafId = requestAnimationFrame(drawFrame);
    }

    function stop() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
    }

    // Start/Stop abhängig davon, ob das Panel sichtbar (active) ist
    const obs = new MutationObserver(() => {
        if (panel.classList.contains("active")) start();
        else stop();
    });
    obs.observe(panel, { attributes: true, attributeFilter: ["class"] });

    // Falls „Platzhalter 2“ schon aktiv ist (z. B. beim Reload)
    if (panel.classList.contains("active")) start();
})();

// ===== Eingabe -> Popup =====-----------------------------------------------------------

// 1) Hier definierst du, WAS gelten soll.
//    Groß/Kleinschreibung egal (wir vergleichen in lowercase).
// ===== Eingabe -> Popup + Loader =====
const SECRET_A = "sercan";   // dein Name 1
const SECRET_B = "selinay";     // dein Name 2

const form = document.getElementById("heartForm");
const fieldA = document.getElementById("fieldA");
const fieldB = document.getElementById("fieldB");
const modal = document.getElementById("loveModal");
const closeBt = document.getElementById("closeModal");
const loader = document.getElementById("loader");

function openModal() { modal.classList.remove("hidden"); }
function closeModal() { modal.classList.add("hidden"); }
function showLoader() { loader.classList.remove("hidden"); }
function hideLoader() { loader.classList.add("hidden"); }

// ===== Allgemeines Popup für Essen & Date-Ideen =====
const popupModal = document.getElementById("popupModal");
const popupText = document.getElementById("popupText");
const popupClose = document.getElementById("popupClose");

function showPopup(msg) {
    if (!popupModal || !popupText) return;
    popupText.textContent = msg;
    popupModal.classList.remove("hidden");
}

function hidePopup() {
    if (!popupModal) return;
    popupModal.classList.add("hidden");
}

if (popupClose) popupClose.addEventListener("click", hidePopup);
popupModal?.addEventListener("click", (e) => {
    if (e.target === popupModal) hidePopup();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hidePopup();
});


function matchesSecret() {
    const a = (fieldA.value || "").trim().toLowerCase();
    const b = (fieldB.value || "").trim().toLowerCase();
    return a === SECRET_A && b === SECRET_B;
}


if (form) {
    form.addEventListener("submit", e => {
        e.preventDefault();

        if (matchesSecret()) {
            startLoveSequence();
        } else {
            openPopup("Es geht hier nicht um andere");
        }
    });
}

function openPopup(message) {
    const modal = document.getElementById("popupModal");
    const text = document.getElementById("popupText");
    if (!modal || !text) return;

    text.textContent = message;
    modal.classList.remove("hidden");
}



function startLoveSequence() {
    showLoader();

    const bar = document.getElementById("progressBar");
    const txt = document.getElementById("progressText");
    let percent = 1;
    bar.style.width = "1%";
    txt.textContent = "1%";

    // Fortschrittsanimation – ca. 5 Sekunden bis 99 %
    const duration = 5000;      // ms
    const interval = 50;        // alle 50 ms aktualisieren
    const steps = duration / interval;
    const increment = 98 / steps; // von 1 % → 99 %

    const timer = setInterval(() => {
        percent += increment;
        if (percent >= 99) {
            percent = 99;
            clearInterval(timer);
            setTimeout(() => {
                hideLoader();
                openModal();
            }, 400); // kleine Verzögerung nach 99 %
        }
        bar.style.width = percent.toFixed(0) + "%";
        txt.textContent = Math.floor(percent) + "%";
    }, interval);
}


// Modal schließen
if (closeBt) closeBt.addEventListener("click", closeModal);
modal?.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

function createHeartParticles() {
    const container = document.getElementById('heartParticles');
    if (!container) return;

    container.innerHTML = ""; // falls Intro neu gezeigt wird

    const points = 140;      // Anzahl der Herzchen
    const scale = 32;         // Größe des Herzens

    for (let i = 0; i < points; i++) {
        const t = (Math.PI * 2 * i) / points;

        // klassische Herz-Gleichung
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y =
            13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t);

        const dot = document.createElement('div');
        dot.className = 'heart-dot';

        // Position ins CSS schieben (werden in der Animation benutzt)
        dot.style.setProperty('--tx', (x * scale).toString());
        dot.style.setProperty('--ty', (-y * scale).toString()); // minus, weil y oben/unten invertiert ist

        // random Delay, damit es lebendiger wirkt
        dot.style.animationDelay = (Math.random() * 2).toFixed(2) + 's';

        container.appendChild(dot);
    }
}


// ========================================================= Glücksrad ==========================================================
const wheelCanvas = document.getElementById("wheelCanvas");
if (wheelCanvas) {
    const ctx = wheelCanvas.getContext("2d");
    const spinBtn = document.getElementById("spinBtn");
    const result = document.getElementById("wheelResult");

    // 12 Felder – kannst du beliebig umbenennen
    let sectors = [
        "Sercan kriegt Kuss 😘",
        "Umarmunggggg 🤗",
        "Massage for you 💆",
        "Filmabend 🎬",
        "Selis kriegt Kuss 😘",
        "Kriegst ein Matcha 🥤",
        "Du wirst gekitzelt 😂",
        "Date dieses Wochenende 👩‍❤️‍👨",
        "EIN ALTIN 🥇",
        "Du schuldest mir was 😉",
        "Ich singe für dich 🎤",
        "Dummes Foto für Sticker 🤳",
        "Hi",
        "bye"
    ];

    const numSectors = sectors.length;
    const arc = (2 * Math.PI) / numSectors;
    let currentAngle = 0;
    let spinning = false;

    function drawWheel() {
        const w = wheelCanvas.width;
        const h = wheelCanvas.height;
        const cx = w / 2 - 40;
        const cy = h / 2;
        const r = Math.min(cx, cy) - 20;

        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < numSectors; i++) {
            const angle = currentAngle + i * arc;
            ctx.beginPath();
            ctx.fillStyle = i % 2 === 0 ? "#ff1e6a" : "#ff4d8f";
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, angle, angle + arc);
            ctx.fill();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "#fff";
            ctx.font = "18px sans-serif";
            ctx.fillText(sectors[i], r - 20, 6);
            ctx.restore();
        }

        // Mittelpunkt
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
        ctx.fillStyle = "#fff";
        ctx.fill();

        // Pfeil
        const arrowDist = r + 45;
        const arrowWidth = 28;
        const arrowHeight = 40;

        ctx.beginPath();
        ctx.moveTo(cx + arrowDist - arrowHeight, cy);
        ctx.lineTo(cx + arrowDist, cy - arrowWidth / 2);
        ctx.lineTo(cx + arrowDist, cy + arrowWidth / 2);
        ctx.closePath();
        ctx.fillStyle = "#10a329";
        ctx.shadowColor = "#10a329";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawWheel();

    // Wenn heute schon gedreht wurde, Hinweis anzeigen
    if (alreadySpunToday()) {
        result.textContent = "Heute schon gedreht 🥹 – morgen wieder!";
    }


    // ---- Daily-Spin-Helper ----
    function alreadySpunToday() {
        const last = localStorage.getItem("wheelLastSpin");
        if (!last) return false;

        const today = new Date().toISOString().slice(0, 10); // z.B. "2025-11-08"
        return last === today;
    }

    function markSpunToday() {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem("wheelLastSpin", today);
    }



    function spinWheel() {
        // 1) prüfen ob heute schon gedreht
        if (alreadySpunToday()) {
            result.textContent = "Heute schon gedreht 🥹 – morgen wieder!";
            return;
        }

        if (spinning) return;
        spinning = true;
        result.textContent = "Dreht...";

        // Zufällige Endrotation
        const extraSpins = 3 + Math.random() * 3; // 3–6 Runden
        const targetAngle = currentAngle + extraSpins * 2 * Math.PI + Math.random() * 2 * Math.PI;

        const duration = 4000; // 4 Sekunden
        const start = performance.now();

        function animate(time) {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // smooth
            currentAngle = targetAngle * ease;
            drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                spinning = false;
                // Ergebnis berechnen
                const deg = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                const index = Math.floor(numSectors - (deg / arc)) % numSectors;
                const prizeText = sectors[index];

                // 2) Ergebnis anzeigen
                result.textContent = "→ " + prizeText;

                // 3) merken, dass heute gedreht wurde
                markSpunToday();
            }
        }

        requestAnimationFrame(animate);
    }


    if (spinBtn) {
        spinBtn.addEventListener("click", spinWheel);
    }
}


// ===================== "Wer hat das gesagt?" =====================
(() => {
    const textEl = document.getElementById("quizText");
    const resultEl = document.getElementById("quizResult");
    const yearInput = document.getElementById("guessYear");
    const checkBtn = document.getElementById("checkQuote");
    const nextBtn = document.getElementById("nextQuote");

    if (!textEl) return;

    // HIER deine Karten – jetzt MIT note 👇
    const quotes = [
        {
            text: "Rate mal wer etwas zu spät kommt",
            author: "selinay",
            year: "2019",
            note: "Das hast zwar du geschrieben, aber meine Antwort war: Du kannst direkt auch raten haha"
        },
        {
            text: "Die Aufgaben die ich kann wirst du schon abschreiben können",
            author: "selinay",
            year: "2019",
            note: "Ich hatte Angst in Chemie nicht abschreiben zu können"
        },
        {
            text: "Guten Morgen willst du vorbei kommen?",
            author: "selinay",
            year: "2019",
            note: "Ich wünschte es wäre in einem anderen Kontext, aber du hast mich nur zum lernen gerufen"
        },
        {
            text: "Hast du irgendwas wichtiges aufgeschrieben",
            author: "sercan",
            year: "2019",
            note: "Hab dich wieder mal nach Schulstoff gefragt weil ich nicht da war"
        },
        {
            text: "Schön positiv denken",
            author: "selinay",
            year: "2020",
            note: "Eine Selinay die versucht mich aufzumuntern nach einer schlechten Chemie Klausur"
        },
        {
            text: "Ich bewerbe mich auch für Jura undso einfach hahaha",
            author: "sercan",
            year: "2020",
            note: "Bewerbungen für Uni Studiengang (Hab mich niemals für Jura beworben leider)"
        },
        {
            text: "Egal ich schenke dir einfach wieder ein Ring aus einem Radiergummi und einer Büroklammer",
            author: "sercan",
            year: "2020",
            note: "Du hast mir zu spät gesagt dass es sich bei dem Treffen in deinem Garten um deinen Geburtstag handelt. Meine Spontane Idee war dann das"
        },
        {
            text: "Das ist echt Dorf türkisch was die sprechen",
            author: "selinay",
            year: "2019",
            note: "DAS HAST DU ZU DEINER EIGENEN MAMA GESAGT!!!! DU HAST ANGEFANGEN"
        },
        {
            text: "Jetzt haben wir genuuuuug Bilder",
            author: "selinay",
            year: "2020",
            note: "JAAA DU HAST ES SELBER GESAGT! Das war nachdem wir zusammen Bilder in deinem Garten gemacht haben"
        },
        {
            text: "2 Tonnen Makeup klärt schon",
            author: "selinay",
            year: "2020",
            note: "Wir hatten damals den Plan dich mit Cagatay Ulusoy zu verkuppeln. Jetzt ist dein Freund sogar noch geiler"
        },
        {
            text: "Ok reicht von mir aus genug genervt du tust mir auch leid grad",
            author: "selinay",
            year: "2020",
            note: "Da waren wir noch nicht zusammen, jetzt hör ich sowas niemals HAHAHAHHA"
        },
        {
            text: "Wenn du morgen nicht kommst, bin ich auch nicht dabei",
            author: "sercan",
            year: "2020",
            note: "Anca Beraber kanca beraber. Ich bin nirgendwo wo meine süße Maus nicht auch ist!"
        },
        {
            text: "Ich hasse niemanden, hass ist ein starker Begriff",
            author: "sercan",
            year: "2020",
            note: "Will den Kontext nicht geben, aber ich bin NICHT Goethe. Ich hasse z.B. Ju..."
        },
        {
            text: "Merk dir eins, wenn ich dich jemals anlügen sollte, allah belami versin",
            author: "sercan",
            year: "2020",
            note: "Du hast gefragt ob Berkant Gefühle für Kaley hat und ich meinte nein HAHAHAHHA, daraufhin hast du mir erstmal nicht geglaubt"
        },
        {
            text: "Ich weiß wann du Geburtstag hast, soll ich aus Favoriten raus tun als Beweis?",
            author: "sercan",
            year: "2020",
            note: "Ich hab safe nur gehofft dass du nein sagst, konnte mir niemals deinen Geburtstag merken HAHAHAHA"
        },
        {
            text: "Wichtige Sachen haben einen extra Platz in meinem Hirn",
            author: "sercan",
            year: "2020",
            note: "Habe mich an deinen Geburtstag erinnert + daran, dass ich dir den Radiergummi Ring schenken wollte (Hab es aber am Ende nicht getan HAHAHAH)"
        },
        {
            text: "Du hast mich echt zum Lachen gebracht",
            author: "sercan",
            year: "2020",
            note: "Kann sein erstes Mal dass ich wegen dir gelacht habe HAHAHAHHA, wir waren Supernatural am gucken und du hast nen Witz gebracht"
        },
        {
            text: "Ich will dich noch behalten",
            author: "selinay",
            year: "2020",
            note: "Du hast mich behalten... Du hast was süßes gesagt, ich meinte mein Herz schmilzt. Daraufhin hast du gesagt dass du mich noch behalten willst"
        },
        {
            text: "NEINNNN Was mache ich ohne dich",
            author: "selinay",
            year: "2020",
            note: "Du warst schon flirty. Das war so mitte Oktober, da stand jemand schon bisschen auf mich, du hast das öfter gesagt zu der Zeit"
        },
        {
            text: "Ey ohne witz mach nicht so... ich will dich nicht verlieren...",
            author: "sercan",
            year: "2020",
            note: "Hatten gestritten wegen etwas kleinem, wir waren zu süß damals"
        },
        {
            text: "Ich kann es nicht glauben dass ich es dir gerade geschickt habe",
            author: "selinay",
            year: "2020",
            note: "Du hast mir Editierte Fotos geschickt wie du mit kurzen Haaren aussehen würdest, du meintest das ist komisch das einem Jungen zu schicken. Ich war so verliebt, die Fotos waren wow"
        },
        {
            text: "Wir werden alt",
            author: "sercan",
            year: "2021",
            note: "schon vor 4 Jahren gesagt weil wir morgens noch müde waren nach dem aufstehen HAHAHAHHA guck uns heute mal an 24/7 müde"
        },
        {
            text: "Ich will Lasagne",
            author: "selinay",
            year: "2021",
            note: "Was für Kontext, du hast das einfach so um 0Uhr rausgehauen HAHAHAHAHHA"
        },
        {
            text: "Sana ceza vermek istiyorum",
            author: "selinay",
            year: "2022",
            note: "Mommy? HAHAHAHHA Ich war lange draußen und hab nicht geantwortet dann warst du unnormal sauer, hat was wenn ich das gerade so wieder lese oh"
        },
        {
            text: "Dann gucken wir Saw 1",
            author: "selinay",
            year: "2022",
            note: " JA DAS HAST DU GESAGT!!!! Mit 20 warst du weniger schisser als jetzt!"
        },
        {
            text: "Ich würde kein Tattoo machen wenn wir nur ein Paar sind",
            author: "sercan",
            year: "2021",
            note: "Ja guuuut, die Meinung hat sich geändert HAHAHAH"
        },
        {
            text: "Komm Discord",
            author: "sercan",
            year: "2019",
            note: "Ganz frühe Gaming-Zeit 😎"
        },
        {
            text: "Komm Discord",
            author: "sercan",
            year: "2019",
            note: "Ganz frühe Gaming-Zeit 😎"
        },
    ];

    let order = quotes.map((_, i) => i).sort(() => Math.random() - 0.5);
    let pos = 0;

    function loadCurrent() {
        const card = quotes[order[pos]];
        textEl.textContent = card.text;
        resultEl.innerHTML = ""; // wichtig: leeren
        yearInput.value = "";
        document
            .querySelectorAll("input[name='guessPerson']")
            .forEach(r => (r.checked = false));
    }

    loadCurrent();

    checkBtn.addEventListener("click", () => {
        const card = quotes[order[pos]];
        const chosenRadio = document.querySelector("input[name='guessPerson']:checked");
        const guessedYear = (yearInput.value || "").trim();

        if (!chosenRadio || !guessedYear) {
            resultEl.textContent = "Erst Person UND Jahr wählen 🥺";
            resultEl.style.color = "#ffb4c7";
            return;
        }

        const okPerson = chosenRadio.value === card.author;
        const okYear = guessedYear === card.year;

        let message = "";
        if (okPerson && okYear) {
            message = "Richtiiiig 🥳";
            resultEl.style.color = "#10a329";
        } else if (okPerson && !okYear) {
            message = `Person stimmt ✅, Jahr war ${card.year}.`;
            resultEl.style.color = "#fbbf24";
        } else if (!okPerson && okYear) {
            message = `Jahr stimmt ✅, aber das war ${card.author === "selinay" ? "Selinay" : "Sercan"}.`;
            resultEl.style.color = "#fbbf24";
        } else {
            message = `Beides falsch 😅 → richtig: ${card.author === "selinay" ? "Selinay" : "Sercan"} (${card.year})`;
            resultEl.style.color = "#ffb4c7";
        }

        // hier packen wir den Kontext drunter
        resultEl.innerHTML = `
      <div>${message}</div>
      <div style="margin-top:.4rem; color:#ddd; font-size:.85rem;">
        Kontext: ${card.note}
      </div>
    `;
    });

    nextBtn.addEventListener("click", () => {
        pos++;
        if (pos >= order.length) {
            order = quotes.map((_, i) => i).sort(() => Math.random() - 0.5);
            pos = 0;
        }
        loadCurrent();
    });
})();

const songCards = document.querySelectorAll(".song-card");
const audioPlayer = document.getElementById("audio-player");
const volumeSlider = document.getElementById("volume");

if (songCards && audioPlayer) {
    let currentSrc = null;

    // falls Regler existiert: initial setzen
    if (volumeSlider) {
        audioPlayer.volume = volumeSlider.value; // 1 am Anfang
        volumeSlider.addEventListener("input", () => {
            audioPlayer.volume = volumeSlider.value;
        });
    }

    songCards.forEach(card => {
        card.addEventListener("click", () => {
            const src = card.dataset.audio;
            if (!src) return;

            // gleicher Song + läuft → pausieren
            if (currentSrc === src && !audioPlayer.paused) {
                audioPlayer.pause();
                card.classList.remove("playing");
                currentSrc = null;
                return;
            }

            audioPlayer.src = src;
            audioPlayer.play();
            currentSrc = src;

            // Optik
            songCards.forEach(c => c.classList.remove("playing"));
            card.classList.add("playing");
        });
    });

    // wenn Song zu Ende
    audioPlayer.addEventListener("ended", () => {
        songCards.forEach(c => c.classList.remove("playing"));
        currentSrc = null;
    });
}

// ==================== LOVE COUNTDOWNS ====================
(() => {
    const cards = document.querySelectorAll(".countdown-card-love");
    if (!cards.length) return;

    // Hier trägst du eure Daten ein
    // Monat ist 0-basiert (0=Jan, 1=Feb, 11=Dez)
    const eventDates = {
        valentine: { month: 1, day: 14 },        // 14. Februar
        anniversary: { month: 11, day: 14 },     // 14. Dezember (14122020 😏)
        "her-bday": { month: 6, day: 13 },       // TODO: anpassen!
        "his-bday": { month: 3, day: 8 }         // TODO: anpassen!
    };

    function nextDate(month, day) {
        const now = new Date();
        const year = now.getFullYear();
        let target = new Date(year, month, day, 0, 0, 0);

        // wenn dieses Jahr schon vorbei → nächstes Jahr
        if (target.getTime() < now.getTime()) {
            target = new Date(year + 1, month, day, 0, 0, 0);
        }
        return target;
    }

    function updateCountdowns() {
        const now = new Date().getTime();

        cards.forEach(card => {
            const key = card.getAttribute("data-event");
            const cfg = eventDates[key];
            if (!cfg) return;

            const target = nextDate(cfg.month, cfg.day).getTime();
            const diff = target - now;

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            card.querySelector(".days").textContent = String(days).padStart(2, "0");
            card.querySelector(".hours").textContent = String(hours).padStart(2, "0");
            card.querySelector(".minutes").textContent = String(minutes).padStart(2, "0");
            card.querySelector(".seconds").textContent = String(seconds).padStart(2, "0");

            // wenn genau heute:
            if (days === 0 && hours === 0 && minutes === 0 && seconds >= 0) {
                const note = card.querySelector(".love-note");
                if (note) note.textContent = "Heute ist es soweit!!! 💓";
            }
        });
    }

    updateCountdowns();
    setInterval(updateCountdowns, 1000);
})();

// ==================== TAGESNACHRICHT ====================
async function loadDailyMessages() {
    if (!supabaseClient) return;

    const selectEl = document.getElementById("dailyMsgSelect");
    const textEl = document.getElementById("dailyMsgText");
    const metaEl = document.getElementById("dailyMsgMeta");

    if (!selectEl || !textEl) return;

    // UI erstmal leeren
    selectEl.innerHTML = "";
    textEl.textContent = "Lade ...";
    if (metaEl) metaEl.textContent = "";

    const { data, error } = await supabaseClient
        .from("daily_messages")
        .select("id, message, date_for")
        .order("date_for", { ascending: false });

    if (error) {
        console.error(error);
        selectEl.innerHTML = `<option>Fehler beim Laden</option>`;
        textEl.textContent = "Konnte nichts laden.";
        return;
    }

    if (!data || data.length === 0) {
        selectEl.innerHTML = `<option>Keine Nachrichten vorhanden</option>`;
        textEl.textContent = "Noch keine Nachricht hinterlegt 🙂";
        return;
    }

    // heutigess Datum als string "YYYY-MM-DD"
    const todayStr = new Date().toISOString().slice(0, 10);

    // Optionen bauen
    data.forEach((row) => {
        const opt = document.createElement("option");
        opt.value = row.id;
        opt.textContent = row.date_for; // z.B. 2025-12-15
        selectEl.appendChild(opt);
    });

    // versuchen: Eintrag für heute finden
    const todaysMsg = data.find((row) => row.date_for === todayStr);

    // das Objekt, das wir anzeigen wollen
    const toShow = todaysMsg ? todaysMsg : data[0];

    // im select auswählen
    selectEl.value = toShow.id;

    // Text anzeigen
    textEl.textContent = toShow.message || "–";
    if (metaEl) metaEl.textContent = `Nachricht für: ${toShow.date_for}`;

    // Wechsel-Handler
    selectEl.onchange = () => {
        const selectedId = selectEl.value;
        const found = data.find((r) => r.id === selectedId);
        textEl.textContent = found ? (found.message || "–") : "–";
        if (metaEl) metaEl.textContent = found ? `Nachricht für: ${found.date_for}` : "";
    };
}



// ====================== ESSEN-ZETTEL (mit Kategorien + löschen) ======================
async function loadEssenZettel(category = "hauptspeise") {
    if (!supabaseClient || !window.currentUser) return;

    const { data, error } = await supabaseClient
        .from("essen_zettel")
        .select("id, text, category")
        .eq("owner", window.currentUser.id)
        .eq("category", category)
        .order("created_at", { ascending: false });

    const listEl = document.getElementById("essenList");
    if (!listEl) return;

    listEl.innerHTML = "";

    if (error) {
        listEl.innerHTML = "<li>Fehler beim Laden.</li>";
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        listEl.innerHTML = "<li>Keine Zettel in dieser Kategorie 💭</li>";
        return;
    }

    data.forEach(row => {
        const li = document.createElement("li");
        li.style.background = "rgba(0,0,0,.25)";
        li.style.padding = ".3rem .5rem";
        li.style.borderRadius = "8px";
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.gap = ".5rem";

        const textSpan = document.createElement("span");
        textSpan.textContent = row.text;

        const delBtn = document.createElement("button");
        delBtn.textContent = "✖";
        delBtn.style.background = "transparent";
        delBtn.style.border = "none";
        delBtn.style.color = "#fca5a5";
        delBtn.style.cursor = "pointer";
        delBtn.style.fontSize = "1rem";
        delBtn.addEventListener("click", () => deleteEssenZettel(row.id, category));

        li.appendChild(textSpan);
        li.appendChild(delBtn);
        listEl.appendChild(li);
    });
}

async function addEssenZettel(text) {
    const msgEl = document.getElementById("essenAddMsg");
    const catEl = document.getElementById("essenCategory");
    const category = catEl ? catEl.value : "hauptspeise";

    if (!supabaseClient || !window.currentUser) {
        if (msgEl) msgEl.textContent = "Nicht eingeloggt.";
        return;
    }
    if (!text) {
        if (msgEl) msgEl.textContent = "Bitte etwas eingeben.";
        return;
    }

    const { error } = await supabaseClient
        .from("essen_zettel")
        .insert([{
            text,
            owner: window.currentUser.id,
            category
        }]);

    if (error) {
        console.error(error);
        if (msgEl) msgEl.textContent = "Fehler beim Speichern.";
        return;
    }

    if (msgEl) msgEl.textContent = "Gespeichert ✅";
    document.getElementById("essenInput").value = "";
    loadEssenZettel(category);
}

async function drawEssenZettel() {
    const outEl = document.getElementById("essenDrawMsg");
    const catEl = document.getElementById("essenDrawCategory");
    const category = catEl ? catEl.value : "hauptspeise";

    if (!supabaseClient || !window.currentUser) {
        if (outEl) outEl.textContent = "Nicht eingeloggt.";
        return;
    }

    const { data, error } = await supabaseClient
        .from("essen_zettel")
        .select("id, text")
        .eq("owner", window.currentUser.id)
        .eq("category", category);

    if (error) {
        console.error(error);
        if (outEl) outEl.textContent = "Fehler beim Ziehen.";
        return;
    }

    if (!data || data.length === 0) {
        if (outEl) outEl.textContent = "In dieser Kategorie ist noch nichts 👀";
        return;
    }

    const random = data[Math.floor(Math.random() * data.length)];
    outEl.textContent = "→ " + random.text;
    showPopup("Heute essen wir: " + random.text);

}

async function deleteEssenZettel(id, category = "hauptspeise") {
    if (!supabaseClient || !window.currentUser) return;

    const { error } = await supabaseClient
        .from("essen_zettel")
        .delete()
        .eq("id", id)
        .eq("owner", window.currentUser.id);

    if (error) {
        console.error(error);
        return;
    }

    loadEssenZettel(category);
}

document.addEventListener("DOMContentLoaded", () => {
    const addBtn = document.getElementById("essenAddBtn");
    const drawBtn = document.getElementById("essenDrawBtn");
    const drawCat = document.getElementById("essenDrawCategory");

    if (addBtn) {
        addBtn.addEventListener("click", () => {
            const val = document.getElementById("essenInput").value.trim();
            addEssenZettel(val);
        });
    }

    // Enter-Taste im Essen-Eingabefeld => Speichern
    const essenInput = document.getElementById("essenInput");
    if (essenInput && addBtn) {
        essenInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                addBtn.click();
            }
        });
    }


    if (drawBtn) {
        drawBtn.addEventListener("click", () => {
            drawEssenZettel();
        });
    }

    // wenn die Kategorie rechts gewechselt wird => Liste neu laden
    if (drawCat) {
        drawCat.addEventListener("change", () => {
            loadEssenZettel(drawCat.value);
        });
    }

    // initial laden (nachdem protectPageIfNeeded gelaufen ist)
    if (document.getElementById("panel-essen")) {
        setTimeout(() => {
            const startCat = drawCat ? drawCat.value : "hauptspeise";
            loadEssenZettel(startCat);
        }, 500);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    loadDailyMessages();
});

// ====================== DATE-IDEEN (ohne Kategorien) ======================
async function loadDateIdeen() {
    if (!supabaseClient || !window.currentUser) return;

    const listEl = document.getElementById("dateList");
    if (!listEl) return;

    const { data, error } = await supabaseClient
        .from("date_ideen")
        .select("id, text")
        .eq("owner", window.currentUser.id)
        .order("created_at", { ascending: false });

    listEl.innerHTML = "";

    if (error) {
        console.error(error);
        listEl.innerHTML = "<li>Fehler beim Laden.</li>";
        return;
    }

    if (!data || data.length === 0) {
        listEl.innerHTML = "<li>Noch keine Date-Ideen 💭</li>";
        return;
    }

    data.forEach(row => {
        const li = document.createElement("li");
        li.style.background = "rgba(0,0,0,.25)";
        li.style.padding = ".3rem .5rem";
        li.style.borderRadius = "8px";
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.gap = ".5rem";

        const textSpan = document.createElement("span");
        textSpan.textContent = row.text;

        const delBtn = document.createElement("button");
        delBtn.textContent = "✖";
        delBtn.style.background = "transparent";
        delBtn.style.border = "none";
        delBtn.style.color = "#fca5a5";
        delBtn.style.cursor = "pointer";
        delBtn.addEventListener("click", () => deleteDateIdee(row.id));

        li.appendChild(textSpan);
        li.appendChild(delBtn);
        listEl.appendChild(li);
    });
}

async function addDateIdee(text) {
    const msgEl = document.getElementById("dateAddMsg");

    if (!supabaseClient || !window.currentUser) {
        if (msgEl) msgEl.textContent = "Nicht eingeloggt.";
        return;
    }
    if (!text) {
        if (msgEl) msgEl.textContent = "Bitte etwas eingeben.";
        return;
    }

    const { error } = await supabaseClient
        .from("date_ideen")
        .insert([{
            text,
            owner: window.currentUser.id
        }]);

    if (error) {
        console.error(error);
        if (msgEl) msgEl.textContent = "Fehler beim Speichern.";
        return;
    }

    if (msgEl) msgEl.textContent = "Gespeichert ✅";
    const input = document.getElementById("dateInput");
    if (input) input.value = "";
    loadDateIdeen();
}

async function drawDateIdee() {
    const outEl = document.getElementById("dateDrawMsg");
    if (!supabaseClient || !window.currentUser) {
        if (outEl) outEl.textContent = "Nicht eingeloggt.";
        return;
    }

    const { data, error } = await supabaseClient
        .from("date_ideen")
        .select("id, text")
        .eq("owner", window.currentUser.id);

    if (error) {
        console.error(error);
        if (outEl) outEl.textContent = "Fehler beim Ziehen.";
        return;
    }

    if (!data || data.length === 0) {
        if (outEl) outEl.textContent = "Noch nichts gespeichert 👀";
        return;
    }

    const random = data[Math.floor(Math.random() * data.length)];
    outEl.textContent = "→ " + random.text;
    showPopup("Eure Date-Idee: " + random.text);

}

async function deleteDateIdee(id) {
    if (!supabaseClient || !window.currentUser) return;

    const { error } = await supabaseClient
        .from("date_ideen")
        .delete()
        .eq("id", id)
        .eq("owner", window.currentUser.id);

    if (error) {
        console.error(error);
        return;
    }

    loadDateIdeen();
}

// Events verdrahten
document.addEventListener("DOMContentLoaded", () => {
    const addBtn = document.getElementById("dateAddBtn");
    const drawBtn = document.getElementById("dateDrawBtn");

    if (addBtn) {
        addBtn.addEventListener("click", () => {
            const val = document.getElementById("dateInput").value.trim();
            addDateIdee(val);
        });
    }

    // Enter-Taste im Date-Ideen-Eingabefeld => Speichern
    const dateInput = document.getElementById("dateInput");
    if (dateInput && addBtn) {
        dateInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                addBtn.click();
            }
        });
    }


    if (drawBtn) {
        drawBtn.addEventListener("click", () => {
            drawDateIdee();
        });
    }

    // beim Laden schon mal ziehen
    if (document.getElementById("panel-date-ideen")) {
        setTimeout(() => {
            loadDateIdeen();
        }, 500);
    }
});

// ====================== GESCHENKWÜNSCHE ======================
async function loadGiftWishes() {
    if (!supabaseClient || !window.currentUser) return;

    const listEl = document.getElementById("giftList");
    if (!listEl) return;

    const { data, error } = await supabaseClient
        .from("gift_wishes")
        .select("id, title, link, image_url")
        .eq("owner", window.currentUser.id)
        .order("created_at", { ascending: false });

    listEl.innerHTML = "";

    if (error) {
        console.error(error);
        listEl.innerHTML = "<li>Fehler beim Laden.</li>";
        return;
    }

    if (!data || data.length === 0) {
        listEl.innerHTML = "<li>Noch keine Wünsche 🥺</li>";
        return;
    }

    data.forEach(row => {
        const li = document.createElement("li");
        li.style.background = "rgba(0,0,0,.25)";
        li.style.padding = ".5rem .6rem";
        li.style.borderRadius = "10px";
        li.style.display = "flex";
        li.style.gap = ".6rem";
        li.style.alignItems = "center";
        li.style.justifyContent = "space-between";

        const left = document.createElement("div");
        left.style.display = "flex";
        left.style.gap = ".6rem";
        left.style.alignItems = "center";

        if (row.image_url) {
            const img = document.createElement("img");
            img.src = row.image_url;
            img.alt = row.title || "Geschenk";
            img.style.width = "52px";
            img.style.height = "52px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "10px";
            left.appendChild(img);
        }

        const textWrap = document.createElement("div");

        const titleEl = document.createElement("div");
        titleEl.textContent = row.title || "(ohne Name)";
        titleEl.style.fontWeight = "600";
        textWrap.appendChild(titleEl);

        if (row.link) {
            const linkEl = document.createElement("a");
            linkEl.href = row.link;
            linkEl.target = "_blank";
            linkEl.rel = "noopener";
            linkEl.textContent = "Link öffnen";
            linkEl.style.fontSize = ".8rem";
            linkEl.style.color = "#93c5fd";
            textWrap.appendChild(linkEl);
        }

        left.appendChild(textWrap);

        const delBtn = document.createElement("button");
        delBtn.textContent = "✖";
        delBtn.style.background = "transparent";
        delBtn.style.border = "none";
        delBtn.style.color = "#fca5a5";
        delBtn.style.cursor = "pointer";
        delBtn.style.fontSize = "1rem";
        delBtn.addEventListener("click", () => deleteGiftWish(row.id));

        li.appendChild(left);
        li.appendChild(delBtn);
        listEl.appendChild(li);
    });
}

async function addGiftWish() {
    const msgEl = document.getElementById("giftAddMsg");
    const titleEl = document.getElementById("giftTitle");
    const linkEl = document.getElementById("giftLink");
    const fileEl = document.getElementById("giftImage");

    if (!supabaseClient || !window.currentUser) {
        if (msgEl) msgEl.textContent = "Nicht eingeloggt.";
        return;
    }

    const title = titleEl?.value.trim();
    const link = linkEl?.value.trim();

    if (!title) {
        if (msgEl) msgEl.textContent = "Bitte einen Namen eingeben.";
        return;
    }

    msgEl.textContent = "Speichere ...";

    let imageUrl = null;
    const file = fileEl?.files[0];

    if (file) {
        const path = `${window.currentUser.id}/${Date.now()}_${file.name}`;

        const { data: uploadData, error: uploadErr } = await supabaseClient
            .storage
            .from("gift-images")
            .upload(path, file);

        if (uploadErr) {
            console.error(uploadErr);
            msgEl.textContent = "Fehler beim Hochladen des Bildes.";
            return;
        }

        const { data: publicUrlData } = supabaseClient
            .storage
            .from("gift-images")
            .getPublicUrl(uploadData.path);

        imageUrl = publicUrlData?.publicUrl || null;
    }

    const { error } = await supabaseClient
        .from("gift_wishes")
        .insert([{
            owner: window.currentUser.id,
            title,
            link: link || null,
            image_url: imageUrl
        }]);

    if (error) {
        console.error(error);
        msgEl.textContent = "Fehler beim Speichern.";
        return;
    }

    msgEl.textContent = "Gespeichert ✅";
    if (titleEl) titleEl.value = "";
    if (linkEl) linkEl.value = "";
    if (fileEl) fileEl.value = "";
    loadGiftWishes();
}

async function deleteGiftWish(id) {
    if (!supabaseClient || !window.currentUser) return;

    const { error } = await supabaseClient
        .from("gift_wishes")
        .delete()
        .eq("id", id)
        .eq("owner", window.currentUser.id);

    if (error) {
        console.error(error);
        return;
    }

    loadGiftWishes();
}


// ==================== INTRO-SEQUENZ NACH LOGIN ====================
document.addEventListener("DOMContentLoaded", () => {
    const introOverlay = document.getElementById("introOverlay");
    if (!introOverlay) return; // auf index.html z.B. gibt es das nicht

    // NEU: Intro-Musik holen
    const introAudio = document.getElementById("introMusic");

    introOverlay.classList.remove("hidden");

    // Scrollen der Seite dahinter blockieren
    document.body.classList.add("noscroll");
    window.scrollTo(0, 0);

    // NEU: Musik starten (wenn Browser es erlaubt)
    if (introAudio) {
        introAudio.loop = true;
        introAudio.volume = 0.05; // bisschen leiser
        introAudio.play().catch(() => {
            // viele Browser blocken Autoplay – ist nicht schlimm, dann bleibt es halt leise
        });
    }

    function fadeOutAudio(audio, duration = 1500) {
        const fadeSteps = 30;
        const fadeInterval = duration / fadeSteps;
        const fadeAmount = audio.volume / fadeSteps;

        let fadeTimer = setInterval(() => {
            if (audio.volume - fadeAmount > 0) {
                audio.volume -= fadeAmount;
            } else {
                audio.volume = 0;
                audio.pause();
                clearInterval(fadeTimer);
            }
        }, fadeInterval);
    }


    createHeartParticles();

    const introText = document.getElementById("introText");
    const introStartBtn = document.getElementById("introStartBtn");


    if (!introText || !introStartBtn) {
        introOverlay.classList.add("hidden");
        return;
    }

    // Die Sätze, die nacheinander erscheinen
    const introSlides = [
        "Hellooo Selissss 💚",
        "Ich hab etwas für dich gemacht",
        "Eine kleine eigene Welt für dich, für uns, mit Sachen, die nur wir beide nutzen können.",
        "Damit du immer etwas hast, das dich lächeln lässt.",
        "Weil du für mich das Wichtigste bist, herseyimsin",
        "Also Selis, bist du bereit alles zu sehen?🥹"
    ];

    let index = 0;
    let timer = null;

    function showSlide() {
        // Animation neu triggern
        introText.classList.remove("show");
        void introText.offsetWidth; // force reflow
        introText.textContent = introSlides[index];
        introText.classList.add("show");
    }

    function finishIntro() {
        if (timer) clearInterval(timer);
        introOverlay.classList.add("hidden");
        document.body.classList.remove("noscroll");
        sessionStorage.removeItem("showIntro");



        // NEU: Musik stoppen
        const introAudio = document.getElementById("introMusic");
        if (introAudio) {
            fadeOutAudio(introMusic, 1800);
        }
    }


    // Start-Button zuerst ausblenden
    introStartBtn.classList.remove("visible");

    // ersten Satz anzeigen
    showSlide();

    // alle 5 Sekunden zum nächsten Satz
    timer = setInterval(() => {
        index++;
        if (index >= introSlides.length) {
            clearInterval(timer);
            // Am Ende: Button anzeigen
            introStartBtn.classList.add("visible");
        } else {
            showSlide();
        }
    }, 6000); // 5 Sekunden

    // „Los geht's“ schließt das Intro
    introStartBtn.addEventListener("click", finishIntro);
    const introSkipBtn = document.getElementById("introSkipBtn");
    if (introSkipBtn) {
        introSkipBtn.addEventListener("click", finishIntro);
    }


});




// ==================== Wahrheit oder Pflicht ====================
const wopData = {
    classic: {
        truth: [
            "Was war dein peinlichster Moment?",
            "Hast du jemals etwas gestohlen?",
            "Wen würdest du gern einmal küssen?",
            "Was war dein schlimmster Albtraum?",
            "Welche Eigenschaft nervt dich an dir selbst?"
        ],
        dare: [
            "Singe laut ein Lied deiner Wahl.",
            "Mach 10 Liegestütze.",
            "Schicke einer Person ein Kompliment per Nachricht.",
            "Imitiere eine berühmte Person für 20 Sekunden.",
            "Mach ein lustiges Selfie und zeig es!"
        ]
    },
    couple: {
        truth: [
            "Wann hast du dich das erste Mal zu mir hingezogen gefühlt?",
            "Was war dein erster Gedanke heute Morgen?",
            "Was liebst du am meisten an mir?",
            "Wofür bist du mir besonders dankbar?",
            "Welche meiner Eigenschaften macht dich verrückt?"
        ],
        dare: [
            "Gib mir einen Kuss, wo ich es nicht erwarte 😘",
            "Umarme mich für 30 Sekunden ohne zu reden.",
            "Sag mir 3 Dinge, die du an mir liebst.",
            "Mach mir ein ernst gemeintes Kompliment.",
            "Flüster mir etwas Romantisches ins Ohr."
        ]
    },
    spicy: {
        truth: [
            "Was war dein wildester Gedanke in der letzten Zeit? 😏",
            "Was turnt dich am meisten an?",
            "Was würdest du tun, wenn wir jetzt komplett allein wären?",
            "Was war dein peinlichster Moment beim Küssen?",
            "Welche Fantasie würdest du gern ausleben?",
            "Was an mir findest du unwiderstehlich?",
            "Womit könnte ich dich sofort um den Finger wickeln?",
            "Hast du jemals von uns in einer heißen Situation geträumt? Erzähle davon!",
            "Was ist das Verrückteste, was du je im Schlafzimmer gemacht hast?",
            "Gibt es etwas, das du schon immer mal mit mir ausprobieren wolltest?",


        ],
        dare: [
            "Flüster mir dein Lieblingswort auf eine sexy Art ins Ohr 😈",
            "Sag mir 3 Dinge, die du an meinem Körper magst.",
            "Mach 10 Sekunden lang einen sexy Blickkontakt ohne zu lachen.",
            "Sag mir etwas, das du dir mit mir vorstellen könntest 😘",
            "Berühre meine Hand auf die verführerischste Weise, die dir einfällt.",
            "Gib mir einen Kuss, der mich umhaut 😍",
            "Beschreibe mir in 3 Worten, wie du mich findest.",
            "Mach mir ein Kompliment, das mich erröten lässt.",
            "Zeig mir deinen verführerischsten Tanz für 15 Sekunden.",
            "Sag mir, was du als Nächstes mit mir machen möchtest 😉",

        ]
    }
};

function setupWahrheitOderPflicht() {
    const categorySelect = document.getElementById("wopCategory");
    const truthBtn = document.getElementById("truthBtn");
    const dareBtn = document.getElementById("dareBtn");
    const questionEl = document.getElementById("wopQuestion");

    function randomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function showQuestion(type) {
        const cat = categorySelect.value;
        const list = wopData[cat][type];
        const q = randomItem(list);
        questionEl.textContent = q;
        questionEl.classList.remove("animate");
        void questionEl.offsetWidth; // animation reset
        questionEl.classList.add("animate");
    }

    truthBtn.onclick = () => showQuestion("truth");
    dareBtn.onclick = () => showQuestion("dare");
}

document.addEventListener("DOMContentLoaded", setupWahrheitOderPflicht);

document.addEventListener("DOMContentLoaded", () => {
    const giftAddBtn = document.getElementById("giftAddBtn");
    if (giftAddBtn) {
        giftAddBtn.addEventListener("click", addGiftWish);
    }

    const giftTitle = document.getElementById("giftTitle");
    if (giftTitle && giftAddBtn) {
        giftTitle.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                giftAddBtn.click();
            }
        });
    }

    // nach Login + currentUser: Liste laden
    if (document.getElementById("panel-gifts")) {
        setTimeout(() => {
            loadGiftWishes();
        }, 500);
    }
});




