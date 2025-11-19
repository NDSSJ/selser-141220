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