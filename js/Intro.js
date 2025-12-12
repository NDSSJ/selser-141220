document.addEventListener("DOMContentLoaded", () => {
    const introOverlay = document.getElementById("introOverlay");
    if (!introOverlay) return; // auf index.html z.B. gibt es das nicht

    // 🔹 NEU: nur zeigen, wenn Login das Flag gesetzt hat
    const shouldShowIntro = sessionStorage.getItem("showIntro") === "true";
    if (!shouldShowIntro) {
        // Kein Intro gewünscht -> Overlay sofort verstecken und raus
        introOverlay.classList.add("hidden");
        document.body.classList.remove("noscroll");
        return;
    }

    // Intro sanft einblenden
    requestAnimationFrame(() => {
        introOverlay.classList.add("intro-visible");
    });

    // NEU: Intro-Musik holen
    const introAudio = document.getElementById("introMusic");

    // Scrollen der Seite dahinter blockieren
    document.body.classList.add("noscroll");
    window.scrollTo(0, 0);

    // NEU: Musik starten (wenn Browser es erlaubt)
    if (introAudio) {
        introAudio.loop = true;
        introAudio.volume = 0.01; // bisschen leiser
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
        document.body.classList.remove("noscroll");
        return;
    }

    // Die Sätze, die nacheinander erscheinen
    const introSlides = [
        "Hellooo Selissss 💚",
        "Ich habe mir Gedanken gemacht",
        "Und habe etwas kleines für dich gemacht",
        "Was kleines für UNS gemacht",
        "Etwas, wo Erinnerungen festgehalten werden können",
        "Etwas, das uns unterhält",
        "Ich habe mir 2 Monate Mühe gegeben",
        "Ich hoffe ich konnte es verheimlichen",
        "Ich hab mein bestes gegeben",
        "Damit du immer etwas hast, das dich lächeln lässt.",
        "Weil dein Lächeln unbezahlbar ist",
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

        // ✨ 1. Fade-Out starten
        introOverlay.classList.add("fade-out");
        document.body.classList.remove("noscroll");

        // ✨ 2. Flag löschen, damit beim Reload KEIN Intro mehr kommt
        sessionStorage.removeItem("showIntro");

        // ✨ 3. Musik langsam ausfaden
        const introAudio = document.getElementById("introMusic");
        if (introAudio) {
            fadeOutAudio(introAudio, 1800);
        }

        // ✨ 4. Nach dem Fade-Out wirklich entfernen
        setTimeout(() => {
            introOverlay.classList.add("hidden");
            introOverlay.classList.remove("fade-out");
        }, 600); // gleiche Zeit wie in CSS
    }

    // Start-Button zuerst ausblenden
    introStartBtn.classList.remove("visible");

    // ersten Satz anzeigen
    showSlide();

    // alle 4 Sekunden zum nächsten Satz
    timer = setInterval(() => {
        index++;
        if (index >= introSlides.length) {
            clearInterval(timer);
            // Am Ende: Button anzeigen
            introStartBtn.classList.add("visible");
        } else {
            showSlide();
        }
    }, 4000);

    // „Los geht's“ schließt das Intro
    introStartBtn.addEventListener("click", finishIntro);
    const introSkipBtn = document.getElementById("introSkipBtn");
    if (introSkipBtn) {
        introSkipBtn.addEventListener("click", finishIntro);
    }
});
