// minigames.js
document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("miniGameSelection");
    const stage = document.getElementById("miniGameArea");

    if (!grid || !stage) return;

    // globale Spieler (werden beim Start über das Formular gesetzt)
    window.currentPlayers = {
        p1: "",
        p2: "",
    };

    // ===========================
    // Auswahl-Klicks
    // ===========================
    grid.querySelectorAll(".mini-card").forEach(card => {
        card.addEventListener("click", () => {
            const game = card.dataset.game;
            if (!game) return;

            // statt prompt: schönes Setup-Formular im Panel
            showPlayerSetup(game);
        });
    });

    // ===========================
    // Spieler-Setup UI
    // ===========================
    function showPlayerSetup(game) {
        grid.classList.add("hidden");
        stage.classList.remove("hidden");

        const gameName = game === "memory" ? "Memory" : "Tic Tac Toe";

        stage.innerHTML = `
            <div class="mini-game-topbar">
                <button class="mini-back-btn">&larr; Zurück</button>
                <span class="mini-game-title">${gameName} – Spieler wählen</span>
            </div>

            <div class="mini-game-container">
                <div class="mini-player-setup">
                    <p>Gib eure Namen ein 💕</p>
                    <input id="miniPlayer1" type="text" placeholder="Spieler 1" value="${window.currentPlayers.p1}">
                    <input id="miniPlayer2" type="text" placeholder="Spieler 2" value="${window.currentPlayers.p2}">
                    <button class="mini-start-btn">Spiel starten</button>
                </div>
            </div>
        `;

        // Zurück zur Auswahl
        stage.querySelector(".mini-back-btn").addEventListener("click", backToSelection);

        // Start-Button
        stage.querySelector(".mini-start-btn").addEventListener("click", () => {
            const name1Input = stage.querySelector("#miniPlayer1");
            const name2Input = stage.querySelector("#miniPlayer2");

            const name1 = (name1Input.value || "Spieler 1").trim();
            const name2 = (name2Input.value || "Spieler 2").trim();

            window.currentPlayers = { p1: name1, p2: name2 };

            // jetzt normal Spiel starten (mit Loader)
            startGame(game);
        });
    }

    // ===========================
    // Spiel starten / zurück
    // ===========================
    function startGame(game) {
        // Loader in den Stage-Bereich setzen
        stage.innerHTML = `
            <div class="mini-loader">
                <div class="mini-loader-spinner"></div>
                <p>Lade ${game === "memory" ? "Memory" : "Tic Tac Toe"}…</p>
            </div>
        `;

        setTimeout(() => {
            if (game === "memory") loadMemory();
            if (game === "tictactoe") loadTicTacToe();
        }, 600);
    }

    function backToSelection() {
        stage.innerHTML = "";
        stage.classList.add("hidden");
        grid.classList.remove("hidden");
    }

    // Topbar + Container für ein Spiel
    function renderTopBar(title) {
        stage.innerHTML = `
            <div class="mini-game-topbar">
                <button class="mini-back-btn">&larr; Zurück</button>
                <span class="mini-game-title">${title}</span>
            </div>
            <div class="mini-game-container" id="miniGameContainer"></div>
        `;

        stage.querySelector(".mini-back-btn").addEventListener("click", backToSelection);
        return document.getElementById("miniGameContainer");
    }

    // ===========================
    // Ergebnis-Popup
    // ===========================
    function showResultPopup(message) {
        const overlay = document.createElement("div");
        overlay.className = "mini-result-overlay";
        overlay.innerHTML = `
            <div class="mini-result-card">
                <h3>Spiel beendet 🎉</h3>
                <p>${message}</p>
                <button class="mini-result-btn">Okay</button>
            </div>
        `;

        stage.appendChild(overlay);

        overlay.querySelector(".mini-result-btn").addEventListener("click", () => {
            overlay.remove();
        });
    }

    // ===========================
    // Memory
    // ===========================
    function loadMemory() {
        const container = renderTopBar("Memory");

        // ---- HIER deine eigenen Bilder eintragen ----
        const images = [
            { id: "pic1", src: "assets/Images/minigames/pic1.jpg", alt: "Bild 1" },
            { id: "pic2", src: "assets/Images/minigames/pic2.png", alt: "Bild 2" },
            { id: "pic3", src: "assets/Images/minigames/pic3.jpg", alt: "Bild 3" },
            { id: "pic4", src: "assets/Images/minigames/pic4.jpeg", alt: "Bild 4" },
            { id: "pic5", src: "assets/Images/minigames/pic5.png", alt: "Bild 5" },
            { id: "pic6", src: "assets/Images/minigames/pic6.png", alt: "Bild 6" },
            { id: "pic7", src: "assets/Images/minigames/pic7.png", alt: "Bild 7" },
            { id: "pic8", src: "assets/Images/minigames/pic8.jpg", alt: "Bild 8" },
        ];
        // --------------------------------------------

        // Doppeltes Deck erzeugen (jede Karte 2×)
        let deck = [...images, ...images];
        deck.sort(() => Math.random() - 0.5);

        const { p1, p2 } = window.currentPlayers || { p1: "Spieler 1", p2: "Spieler 2" };
        let currentPlayer = "p1";
        let scoreP1 = 0;
        let scoreP2 = 0;

        container.innerHTML = `
        <div class="memory-wrapper">
            <div class="memory-header">
                <div class="memory-info">Finde alle Paare!</div>
                <div class="memory-turn" id="memoryTurn">Am Zug: ${p1}</div>
            </div>

            <div class="memory-grid">
                ${deck
                .map(
                    (card, i) => `
                    <div class="memory-card" data-index="${i}" data-id="${card.id}">
                        <div class="memory-card-inner">
                            <div class="memory-card-front"></div>
                            <div class="memory-card-back">
                                <img src="${card.src}" alt="${card.alt}">
                            </div>
                        </div>
                    </div>`
                )
                .join("")}
            </div>
        </div>
    `;

        const cards = container.querySelectorAll(".memory-card");
        const turnEl = container.querySelector("#memoryTurn");
        const infoEl = container.querySelector(".memory-info");

        function updateTurnLabel() {
            if (!turnEl) return;
            turnEl.textContent = `Am Zug: ${currentPlayer === "p1" ? p1 : p2}`;
        }

        let first = null,
            second = null,
            locked = false;
        let matches = 0;

        cards.forEach(card => {
            card.addEventListener("click", () => {
                if (locked || card.classList.contains("matched") || card === first) return;

                card.classList.add("flipped");

                if (!first) {
                    first = card;
                    return;
                }

                second = card;
                locked = true;

                const i1 = first.dataset.index;
                const i2 = second.dataset.index;

                // WICHTIG: jetzt vergleichen wir über die id
                if (deck[i1].id === deck[i2].id) {
                    first.classList.add("matched");
                    second.classList.add("matched");

                    if (currentPlayer === "p1") {
                        scoreP1++;
                    } else {
                        scoreP2++;
                    }

                    first = second = null;
                    locked = false;
                    matches++;

                    if (matches === images.length) {
                        if (infoEl) infoEl.textContent = "Alle Paare gefunden! 🎉";

                        let msg;
                        if (scoreP1 > scoreP2) {
                            msg = `${p1} hat gewonnen (${scoreP1} : ${scoreP2}) 🎉`;
                        } else if (scoreP2 > scoreP1) {
                            msg = `${p2} hat gewonnen (${scoreP2} : ${scoreP1}) 🎉`;
                        } else {
                            msg = `Unentschieden! Beide haben ${scoreP1} Paare. 🤝`;
                        }

                        showResultPopup(msg);
                    }
                } else {
                    setTimeout(() => {
                        first.classList.remove("flipped");
                        second.classList.remove("flipped");
                        first = second = null;
                        locked = false;

                        currentPlayer = currentPlayer === "p1" ? "p2" : "p1";
                        updateTurnLabel();
                    }, 700);
                }
            });
        });
    }


    // ===========================
    // Tic Tac Toe
    // ===========================
    function loadTicTacToe() {
        const container = renderTopBar("Tic Tac Toe");

        const { p1, p2 } = window.currentPlayers || { p1: "Spieler 1", p2: "Spieler 2" };

        container.innerHTML = `
            <div class="ttt-board">
                ${Array(9)
                .fill(0)
                .map((_, i) => `<div class="ttt-cell" data-i="${i}"></div>`)
                .join("")}
            </div>
            <div class="ttt-status">Am Zug: ${p1} (X)</div>
        `;

        const cells = container.querySelectorAll(".ttt-cell");
        const status = container.querySelector(".ttt-status");

        let board = Array(9).fill(null);
        let playerSymbol = "X"; // X = p1, O = p2
        let gameOver = false;

        const wins = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];

        function nameForSymbol(sym) {
            return sym === "X" ? p1 : p2;
        }

        function check(sym) {
            return wins.some(([a, b, c]) => board[a] === sym && board[b] === sym && board[c] === sym);
        }

        cells.forEach(cell => {
            cell.addEventListener("click", () => {
                const i = Number(cell.dataset.i);
                if (gameOver || board[i]) return;

                board[i] = playerSymbol;
                cell.textContent = playerSymbol;
                cell.classList.add(playerSymbol === "X" ? "ttt-x" : "ttt-o");

                if (check(playerSymbol)) {
                    const winnerName = nameForSymbol(playerSymbol);
                    if (status) status.textContent = `${winnerName} (${playerSymbol}) gewinnt! 🎉`;
                    gameOver = true;
                    showResultPopup(`${winnerName} hat gewonnen! 🎉`);
                    return;
                }

                if (board.every(v => v !== null)) {
                    if (status) status.textContent = "Unentschieden!";
                    gameOver = true;
                    showResultPopup("Unentschieden! 🤝");
                    return;
                }

                // Spieler wechseln
                playerSymbol = playerSymbol === "X" ? "O" : "X";
                const nextName = nameForSymbol(playerSymbol);
                if (status) status.textContent = `Am Zug: ${nextName} (${playerSymbol})`;
            });
        });
    }
});
