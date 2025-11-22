const songCards = document.querySelectorAll(".song-card");
const audioPlayer = document.getElementById("audio-player");
const volumeSlider = document.getElementById("volume");
const togglePlayBtn = document.getElementById("togglePlay");

if (songCards.length && audioPlayer) {
    let currentSrc = null;
    let currentCard = null;

    // Lautstärke initial setzen & regeln
    if (volumeSlider) {
        audioPlayer.volume = volumeSlider.value; // "1" am Anfang
        volumeSlider.addEventListener("input", () => {
            audioPlayer.volume = volumeSlider.value;
        });
    }

    // Song-Card Klick
    songCards.forEach(card => {
        card.addEventListener("click", () => {
            const src = card.dataset.audio;
            if (!src) return;

            // gleicher Song wie aktuell
            if (currentSrc === src) {
                if (audioPlayer.paused) {
                    // ▶ Fortsetzen
                    audioPlayer.play();
                    card.classList.add("playing");
                    if (togglePlayBtn) {
                        togglePlayBtn.disabled = false;
                        togglePlayBtn.textContent = "⏸ Pause";
                    }
                } else {
                    // ⏸ Pausieren
                    audioPlayer.pause();
                    card.classList.remove("playing");
                    if (togglePlayBtn) {
                        togglePlayBtn.disabled = false;
                        togglePlayBtn.textContent = "▶ Fortsetzen";
                    }
                }
                return;
            }

            // Neuer Song
            audioPlayer.src = src;
            audioPlayer.play();
            currentSrc = src;
            currentCard = card;

            // Optik aktualisieren
            songCards.forEach(c => c.classList.remove("playing"));
            card.classList.add("playing");

            if (togglePlayBtn) {
                togglePlayBtn.disabled = false;
                togglePlayBtn.textContent = "⏸ Pause";
            }
        });
    });

    // Globaler Play/Pause-Button
    if (togglePlayBtn) {
        togglePlayBtn.addEventListener("click", () => {
            // kein aktueller Song → nichts tun
            if (!currentSrc) return;

            if (audioPlayer.paused) {
                // ▶ Fortsetzen
                audioPlayer.play();
                if (currentCard) currentCard.classList.add("playing");
                togglePlayBtn.textContent = "⏸ Pause";
            } else {
                // ⏸ Pausieren
                audioPlayer.pause();
                if (currentCard) currentCard.classList.remove("playing");
                togglePlayBtn.textContent = "▶ Fortsetzen";
            }
        });

        // Anfangszustand
        togglePlayBtn.disabled = true;
        togglePlayBtn.textContent = "▶ Start";
    }

    // wenn Song zu Ende ist
    audioPlayer.addEventListener("ended", () => {
        songCards.forEach(c => c.classList.remove("playing"));
        currentSrc = null;
        currentCard = null;

        if (togglePlayBtn) {
            togglePlayBtn.disabled = true;
            togglePlayBtn.textContent = "▶ Start";
        }
    });
}
