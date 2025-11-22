(() => {
    const panel = document.getElementById("panel-locked");
    if (!panel) return;

    const imgEl = document.getElementById("lockedImage");
    const textEl = document.getElementById("lockedText");
    const restartBtn = document.getElementById("lockedRestartBtn");
    const startBtn = document.getElementById("lockedStartBtn");

    const timelineEl = document.getElementById("lockedTimeline");
    let timelineItems = [];

    let running = false;
    let index = 0;
    let timer = null;
    let isPaused = false;

    // 🔊 Musik für Kurzfilm
    const musicEl = document.getElementById("lockedMusic");
    const lockedVolumeSlider = document.getElementById("lockedVolume");
    const DEFAULT_LOCKED_VOLUME = 0.2;

    // Slider-Startwert auch optisch anpassen
    if (lockedVolumeSlider) {
        lockedVolumeSlider.value = DEFAULT_LOCKED_VOLUME;
    }



    function startLockedMusic() {
        if (!musicEl) return;

        // nur neu starten, wenn sie wirklich am Anfang ist oder pausiert ist
        if (musicEl.currentTime === 0 || musicEl.paused) {
            musicEl.currentTime = 0;
        }

        // Lautstärke vom Slider oder Default
        if (lockedVolumeSlider) {
            musicEl.volume = Number(lockedVolumeSlider.value || DEFAULT_LOCKED_VOLUME);
        } else {
            musicEl.volume = DEFAULT_LOCKED_VOLUME;
        }

        musicEl.muted = false;

        musicEl.play().catch((err) => {
            console.warn("LockedMusic konnte nicht gestartet werden:", err);
        });
    }

    function pauseLockedMovie() {
        if (!running || isPaused) return;

        isPaused = true;
        clearTimeout(timer);

        if (musicEl && !musicEl.paused) {
            musicEl.pause();
        }
    }

    function resumeLockedMovie() {
        if (!running || !isPaused) return;

        isPaused = false;

        // Musik wieder starten
        if (musicEl && musicEl.paused) {
            musicEl.play().catch(() => { });
        }

        // aktuelle Szene erneut zeigen → neuer Timer
        showScene(index);
    }


    function stopLockedMovie() {
        running = false;
        isPaused = false;
        clearTimeout(timer);
        clearAnim();

        if (imgEl) {
            imgEl.classList.add("hidden");
            imgEl.style.opacity = "0";
        }
        if (textEl) {
            textEl.textContent = "";
            textEl.style.opacity = "0";
        }

        stopLockedMusic();      // mit Fade-Out

        updateTimeline(-1);
        index = 0;
    }


    function fadeOutMusic(audio, duration = 1500) {
        if (!audio) return;

        const steps = 30;
        const stepTime = duration / steps;
        const volumeStep = audio.volume / steps;

        let i = 0;

        const fadeInterval = setInterval(() => {
            i++;

            audio.volume = Math.max(0, audio.volume - volumeStep);

            if (i >= steps) {
                clearInterval(fadeInterval);
                audio.pause();
                audio.currentTime = 0;
                // Lautstärke wieder auf Slider/Default setzen
                audio.volume = lockedVolumeSlider
                    ? Number(lockedVolumeSlider.value || DEFAULT_LOCKED_VOLUME)
                    : DEFAULT_LOCKED_VOLUME;
            }
        }, stepTime);
    }

    if (lockedVolumeSlider && musicEl) {
        lockedVolumeSlider.addEventListener("input", () => {
            musicEl.volume = Number(lockedVolumeSlider.value || DEFAULT_LOCKED_VOLUME);
        });
    }



    // Standarddauer, wenn in der Szene nichts angegeben ist
    const SCENE_DURATION = 4000;

    const lockedScenes = [
        { type: "text", text: "Hello Selis", duration: 4000 },
        { type: "text", text: "5 Jahre sind es mittlerweile...,", duration: 4000 },
        { type: "text", text: "5 lange Jahre, die sich dennoch so kurz anfühlten", duration: 4000 },
        { type: "text", text: "Weil jeder Moment mit dir so schön war, dass die Zeit verflog.", duration: 4000 },
        { type: "text", text: "5 Jahre", duration: 4000 },
        { type: "text", text: "die ich gerne wieder von vorn erleben würde", duration: 4000 },
        { type: "text", text: "mit allen Höhen", duration: 4000 },
        { type: "text", text: "sowie Tiefen", duration: 4000 },
        { type: "text", text: "Versuch diesen Kurzfilm als kleinen Rückblick zu sehen", duration: 4000 },
        { type: "text", text: "Als Rückblick auf unsere wunderschöne Zeit zusammen", duration: 4000 },
        { type: "text", text: "Als Erinnerung, welche Momente wir schon geteilt haben", duration: 4000 },
        { type: "text", text: "Und vorallem als Beweis, für so viel Liebe, die wir füreinander empfinden", duration: 4000 },
        { type: "text", text: "Lass uns Anfangen...", duration: 4000 },
        { type: "text", text: "", duration: 4000 },
        { type: "text", text: "Spät im Jahr 2020...", duration: 4000 },
        { type: "text", text: "Abitur Zeit ist vorbei", duration: 4000 },
        { type: "text", text: "Sercan lag im Bett, unmotiviert wie immer", duration: 4000 },
        { type: "image", src: "assets/Images/Szene1.png", duration: 3000 },
        { type: "text", text: "Plötzlich klingelte sein Handy", duration: 4000 },
        { type: "text", text: "Ein Tag wie jeder andere, aber eine Nachricht welche ihn immer veränderte", duration: 4000 },
        { type: "text", text: "Langsam nahm er sein Handy in die Hand und las die Nachricht", duration: 4000 },
        { type: "text", text: "'Von wem ist denn die Nachricht jetzt?'", duration: 4000 },
        { type: "image", src: "assets/Images/Szene2.png", duration: 4000 },
        { type: "text", text: "'Delinayim?' Er freute sich riesig, ein lächeln breitete sich auf seinem Gesicht aus", duration: 4000 },
        { type: "image", src: "assets/Images/Szene3.png", duration: 4000 },
        { type: "text", text: "Sie schrieb ihm das übliche, das was beide immer taten als beste Freunde", duration: 4000 },
        { type: "image", src: "assets/Images/Szene4.png", duration: 4000 },
        { type: "text", text: "Glücklich las er die Nachricht, jetzt wird Supernatural geschaut", duration: 4000 },
        { type: "image", src: "assets/Images/Szene5.png", duration: 4000 },
        { type: "text", text: "So lagen beide in getrennten Betten, Hunderte sogar Tausende Kilometer entfernt", duration: 4000 },
        { type: "text", text: "Aber im Herzen waren sie am selben Ort", duration: 4000 },
        { type: "image", src: "assets/Images/Szene6.png", duration: 4000 },
        { type: "text", text: "Und so zog sich das ganze über Wochen und Monate", duration: 4000 },
        { type: "text", text: "Wochen und Monate voller Nachrichten, Anrufe und Videochats", duration: 4000 },
        { type: "text", text: "Wochen und Monate voller Lachen, Spaß und Liebe", duration: 4000 },
        { type: "text", text: "Aber auch Wochen und Monate voller trauriger Momente", duration: 4000 },
        { type: "text", text: "Aber ist es nicht das, was beide so stark gemacht hat?", duration: 4000 },
        { type: "text", text: "", duration: 4000 },
        { type: "text", text: "", duration: 4000 },
        { type: "text", text: "14.12.2020", duration: 4000 },
        { type: "text", text: "4:59", duration: 4000 },
        { type: "text", text: "Nach Stunden langem schreiben", duration: 4000 },
        { type: "text", text: "Nach Stunden langem Audios austausch", duration: 4000 },
        { type: "text", text: "Nach Stunden langem zögern", duration: 4000 },
        { type: "text", text: "Kam endlich die Frage", duration: 4000 },
        { type: "text", text: "Eine Frage, welche beide verändern sollte", duration: 4000 },
        { type: "text", text: "Für den Moment war es schwer", duration: 4000 },
        { type: "text", text: "Doch für beide war es das Richtige...", duration: 4000 },
        { type: "image", src: "assets/Images/Szene7.png", duration: 4000, },
        { type: "text", text: "'Willst du eine Anspielung? Ich liebe dich Selinay, willst du meine Freundin sein, erstmal inoffiziell bis wir uns treffen'", duration: 4000 },
        { type: "text", text: "Das war der genaue Wortlaut.", duration: 4000 },
        { type: "text", text: "Und die Antwort?", duration: 4000 },
        { type: "image", src: "assets/Images/Szene8.png", duration: 4000 },
        { type: "text", text: "'Omg sercan ja ich will deine Freundin sein", duration: 4000 },
        { type: "text", text: "Liebe ist was wunderschönes, oder nicht?", duration: 4000 },
        { type: "text", text: "Die ersten Momente waren geheim, doch es dauert nicht lange bis die Familien davon erfuhren", duration: 4000 },
        { type: "text", text: "" },
        { type: "text", text: "Eine kalte Jahreszeit begann", duration: 4000 },
        { type: "text", text: "Sie hatten keine andere Wahl als sich draußen zu treffen", duration: 4000 },
        { type: "text", text: "So gingen sie spazieren, im Schnee", duration: 4000 },
        { type: "image", src: "assets/Images/Szene9.png", duration: 4000 },
        { type: "text", text: "Nach einer Weile wollten sie sich erholen...", duration: 4000 },
        { type: "text", text: "auf einer Bank, auf DER Bank", duration: 4000 },
        { type: "image", src: "assets/Images/Szene10.png", duration: 4000 },
        { type: "text", text: "Ein unvergesslicher Moment...", duration: 4000 },
        { type: "text", text: "Zwei Omis sagten 'Ihr seid aber süß zusammen!'", duration: 4000 },
        { type: "image", src: "assets/Images/Szene11.png", duration: 4000 },
        { type: "text", text: "Sie redeten und lachten", duration: 4000 },
        { type: "text", text: "Doch etwas fehlte...", duration: 4000 },
        { type: "text", text: "Ein Ort, eine Bank, ein Treffen", duration: 4000 },
        { type: "text", text: "Wird er es tun?", duration: 4000 },
        { type: "text", text: "verunsichert fragte er plötzlich", duration: 4000 },
        { type: "image", src: "assets/Images/Szene12.png", duration: 4000 },
        { type: "text", text: "Ein Moment, auf den Selinay wartete", duration: 4000 },
        { type: "text", text: "Und so passierte es", duration: 4000 },
        { type: "image", src: "assets/Images/Szene13.png", duration: 4000 },
        { type: "text", text: "Der erste Kuss", duration: 4000 },
        { type: "text", text: "", duration: 4000 },
        { type: "text", text: "Monate vergingen", duration: 4000 },
        { type: "text", text: "14.02.2021", duration: 4000 },
        { type: "text", text: "Der Tag, an dem sie sich morgen im Auto den Arsch abfroren", duration: 4000 },
        { type: "text", text: "Stundenlang nur die beiden", duration: 4000 },
        { type: "text", text: "Zwei verliebte und Geschenke", duration: 4000 },
        { type: "image", src: "assets/Images/Szene14.png", duration: 4000 },
        { type: "text", text: "Nach paar Problemen mit dem Auto, war der erste Valentinstag somit vorbei und der erste Geburtstag stand bevor", duration: 4000 },
        { type: "text", text: "08.04.2021", duration: 4000 },
        { type: "text", text: "Die beiden wollten Zeit für sich haben", duration: 4000 },
        { type: "text", text: "Mieteten einen Raum für ein paar Stunden", duration: 4000 },
        { type: "text", text: "Sercan hatte noch keine Ahnung was passieren würde", duration: 4000 },
        { type: "text", text: "Er ging Selinay was zu trinken holen, weil sie durstig wurde", duration: 4000 },
        { type: "text", text: "Als er zurückkam, hatte Selinay schon alles vorbereitet", duration: 4000 },
        { type: "image", src: "assets/Images/Szene15.png", duration: 4000 },
        { type: "text", text: "Das erste Partner Armband", duration: 4000 },
        { type: "text", text: "Ein wunderschöner Tag", duration: 4000 },
        { type: "text", text: "Danke", duration: 4000 },
        { type: "text", text: "Es vergingen wieder Monate", duration: 4000 },
        { type: "text", text: "Monate der liebe", duration: 4000 },
        { type: "text", text: "bis zum...", duration: 4000 },
        { type: "text", text: "13.07.2021", duration: 4000 },
        { type: "text", text: "Ein kleines Date, Kino am Abend" },
        { type: "text", text: "Sehr bescheiden für den Anfang, aber eine Sache war anders für Sercan", duration: 4000 },
        { type: "text", text: "Es war seine erste Torte jemals, die er machen ließ und jemanden schenkte", duration: 4000 },
        { type: "image", src: "assets/Images/Szene16.png", duration: 4000 },
        { type: "text", text: "Zwei Bären symbolisch für Sercan und Selinay", duration: 4000 },
        { type: "text", text: "Selinay bewahrte die Figuren noch lange danach auf", duration: 4000 },
        { type: "text", text: "In den ganzen 5 Jahren gab es natürlich so einige Momente...", duration: 4000 },
        { type: "text", text: "Das erste Mal Kirmes", duration: 3000 },
        { type: "image", src: "assets/Images/Szene17.png", duration: 3000 },
        { type: "image", src: "assets/Images/Szene18.png", duration: 3000 },
        { type: "image", src: "assets/Images/Szene21.png", duration: 3000 },
        { type: "text", text: "Sercan's Führerschein", duration: 3000 },
        { type: "image", src: "assets/Images/Szene20.png", duration: 3000 },
        { type: "text", text: "Erstes Mal Picknicken", duration: 3000 },
        { type: "image", src: "assets/Images/Szene19.png", duration: 3000 },
        { type: "text", text: "Erstmal mal Weihnachtsmarkt", duration: 3000 },
        { type: "image", src: "assets/Images/Szene22.png", duration: 3000 },
        { type: "text", text: "Und unendlich weitere Treffen", duration: 3000 },
        { type: "image", src: "assets/Images/Szene23.png", duration: 2000 },
        { type: "image", src: "assets/Images/Szene24.png", duration: 2000 },
        { type: "image", src: "assets/Images/Szene25.png", duration: 2000 },
        { type: "image", src: "assets/Images/Szene26.png", duration: 2000 },
        { type: "image", src: "assets/Images/Szene27.png", duration: 2000 },
        { type: "image", src: "assets/Images/Szene28.png", duration: 2000 },
        { type: "image", src: "assets/Images/Szene29.png", duration: 2000 },
        { type: "image", src: "assets/Images/Szene30.png", duration: 2000 },
        { type: "image", src: "assets/Images/Szene31.png", duration: 2000 },
        { type: "image", src: "assets/Images/Szene32.png", duration: 2000 },
        { type: "text", text: "Und es kommt noch so viel mehr...", duration: 5000 },
        { type: "text", text: "Das war's bis jetzt", duration: 5000 },
        { type: "text", text: "To be continued...?", duration: 5000 },
        { type: "text", text: "END", duration: 10000000 },
    ];

    // ==== Timeline aufbauen ====
    function buildTimeline() {
        if (!timelineEl) return;

        timelineEl.innerHTML = "";
        timelineItems = lockedScenes.map((scene, i) => {
            const item = document.createElement("div");
            item.className = "locked-timeline-item";
            item.dataset.index = i;

            // Klick auf einen Balken: zu dieser Szene springen
            item.addEventListener("click", () => {
                // wenn Film noch nicht läuft, starten wir ihn
                running = true;

                // aktuelles Timeout abbrechen
                clearTimeout(timer);

                // Index setzen & Szene anzeigen
                index = i;
                showScene(index);
            });

            timelineEl.appendChild(item);
            return item;
        });
    }

    // aktuelle Szene markieren
    function updateTimeline(currentIndex) {
        if (!timelineItems.length) return;

        timelineItems.forEach((el, i) => {
            el.classList.toggle("active", i === currentIndex);
            el.classList.toggle("past", i < currentIndex);
        });
    }


    function clearAnim() {
        if (imgEl) {
            imgEl.classList.remove("locked-show", "locked-fade-out");
        }
        if (textEl) {
            textEl.classList.remove("locked-show", "locked-fade-out");
        }
    }


    function showScene(i) {
        const scene = lockedScenes[i];
        if (!scene || !textEl || !imgEl) return;

        clearAnim();

        // Timeline aktualisieren (falls du sie drin hast)
        if (typeof updateTimeline === "function") {
            updateTimeline(i);
        }

        // Basis-Reset: alles erstmal "weg"
        imgEl.classList.add("hidden");
        imgEl.style.opacity = "0";
        textEl.style.opacity = "0";
        textEl.textContent = "";

        if (scene.type === "text") {
            // Nur Text anzeigen → weich reinfaden
            textEl.textContent = scene.text || "";
            textEl.classList.add("locked-show");
        } else if (scene.type === "image") {
            // Bild anzeigen → weich reinfaden
            imgEl.src = scene.src || "";
            imgEl.classList.remove("hidden");
            imgEl.classList.add("locked-show");

            // optional: wenn du Bild + Text gleichzeitig willst
            if (scene.text) {
                textEl.textContent = scene.text;
                textEl.classList.add("locked-show");
            } else {
                textEl.textContent = "";
            }
        }

        const delay = scene.duration || SCENE_DURATION;
        clearTimeout(timer);
        timer = setTimeout(nextScene, delay);
    }



    function nextScene() {
        if (isPaused) return;
        if (textEl) textEl.classList.add("locked-fade-out");
        if (imgEl) imgEl.classList.add("locked-fade-out");

        setTimeout(() => {
            index++;
            if (index >= lockedScenes.length) {
                // Film zu Ende
                clearTimeout(timer);
                running = false;
                stopLockedMusic();   // 🎵 am Ende Musik aus
            } else {
                showScene(index);
            }
        }, 650); // sollte zur lockedFadeOut-Dauer passen
    }


    function startLockedMovie() {
        if (running && !isPaused) return; // läuft bereits normal

        running = true;
        isPaused = false;

        // Start immer von vorne
        index = 0;

        buildTimeline();
        updateTimeline(index);

        startLockedMusic();
        showScene(index);
    }




    function stopLockedMovie() {
        running = false;
        clearTimeout(timer);
        clearAnim();
        stopLockedMusic();   // 🎵 Musik stoppen
    }


    function stopLockedMovieImmediate() {
        running = false;
        clearTimeout(timer);
        clearAnim();

        if (musicEl) {
            musicEl.pause();
            musicEl.currentTime = 0;
            if (lockedVolumeSlider) {
                musicEl.volume = Number(lockedVolumeSlider.value || DEFAULT_LOCKED_VOLUME);
            } else {
                musicEl.volume = DEFAULT_LOCKED_VOLUME;
            }
        }
    }

    function restartLockedMovie() {
        running = false;
        isPaused = false;
        clearTimeout(timer);
        clearAnim();
        index = 0;

        if (musicEl) {
            musicEl.pause();
            musicEl.currentTime = 0;
            musicEl.volume = lockedVolumeSlider
                ? Number(lockedVolumeSlider.value || DEFAULT_LOCKED_VOLUME)
                : DEFAULT_LOCKED_VOLUME;
        }

        if (stopBtn) {
            stopBtn.textContent = "Stoppen";
        }

        startLockedMovie();
    }




    if (restartBtn) {
        restartBtn.addEventListener("click", restartLockedMovie);
    }

    const stopBtn = document.getElementById("lockedStopBtn");
    if (stopBtn) {
        stopBtn.addEventListener("click", () => {
            // Film wurde noch nie gestartet → nichts tun
            if (!running && index === 0) return;

            if (!isPaused) {
                // aktuell läuft → pausieren
                pauseLockedMovie();
                stopBtn.textContent = "Fortsetzen";
            } else {
                // aktuell pausiert → weiterlaufen
                resumeLockedMovie();
                stopBtn.textContent = "Stoppen";
            }
        });
    }



    // Start-Button: Film starten + Button verstecken
    if (startBtn) {
        startBtn.addEventListener("click", () => {
            startBtn.classList.add("hidden");   // Button verschwindet
            restartLockedMovie();               // Film von vorne starten
        });
    }


    // Panel-Wechsel: wenn man wegklickt, Film stoppen
    const obs = new MutationObserver(() => {
        if (!panel.classList.contains("active")) {
            stopLockedMovie();
        }
    });

    obs.observe(panel, { attributes: true, attributeFilter: ["class"] });

})();

// ==================== Passwort-Schutz für Kurzfilm ====================
(() => {
    const panel = document.getElementById("panel-locked");
    if (!panel) return;

    const overlay = document.getElementById("lockedOverlay");
    const pwInput = document.getElementById("lockedPassword");
    const unlockBtn = document.getElementById("lockedUnlockBtn");
    const errorEl = document.getElementById("lockedError");
    const startBtn = document.getElementById("lockedStartBtn");

    const movieApi = window.__lockedMovie || null;

    if (!overlay || !pwInput || !unlockBtn) return;

    // ❗ HIER: dein Passwort
    const KURZFILM_PASSWORD = "14122020";

    function unlock() {
        const val = (pwInput.value || "").trim();
        if (val === KURZFILM_PASSWORD) {
            overlay.style.display = "none";
            if (errorEl) errorEl.textContent = "";

            if (startBtn) {
                startBtn.classList.remove("hidden");
                startBtn.disabled = false;
                startBtn.textContent = "Kurzfilm starten";
            }
        } else {
            if (errorEl) errorEl.textContent = "Falsches Passwort 🥹";
        }
    }

    unlockBtn.addEventListener("click", unlock);

    pwInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            unlock();
        }
    });
})();