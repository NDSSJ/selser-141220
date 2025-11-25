// minigames.js
document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("miniGameSelection");
    const stage = document.getElementById("miniGameArea");

    if (!grid || !stage) return;

    // Map für Anzeigenamen
    const GAME_NAMES = {
        memory: "Memory",
        tictactoe: "Tic Tac Toe",
        connect4: "4 Gewinnt",
    };

    // globale Spieler-Namen
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
            showPlayerSetup(game);
        });
    });

    // ===========================
    // Spieler-Setup UI
    // ===========================
    function showPlayerSetup(game) {
        grid.classList.add("hidden");
        stage.classList.remove("hidden");

        const normalized = (game || "").trim().toLowerCase();
        const gameName = GAME_NAMES[normalized] || "Spiel";

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
        const normalized = (game || "").trim().toLowerCase();
        const loaderName = GAME_NAMES[normalized] || "Spiel";

        // Loader anzeigen
        stage.innerHTML = `
            <div class="mini-loader">
                <div class="mini-loader-spinner"></div>
                <p>Lade ${loaderName}…</p>
            </div>
        `;

        setTimeout(() => {
            switch (normalized) {
                case "memory":
                    loadMemory();
                    break;
                case "tictactoe":
                    loadTicTacToe();
                    break;
                case "connect4":
                    loadConnect4Game();
                    break;
                default:
                    console.warn("Unbekanntes Spiel:", game);
                    backToSelection();
            }
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

        let deck = [...images, ...images];
        deck.sort(() => Math.random() - 0.5);

        const { p1, p2 } = window.currentPlayers || { p1: "Spieler 1", p2: "Spieler 2" };

        // 🔥 Random Start
        let currentPlayer = Math.random() < 0.5 ? "p1" : "p2";
        let scoreP1 = 0;
        let scoreP2 = 0;

        container.innerHTML = `
            <div class="memory-wrapper">
                <div class="memory-header">
                    <div class="memory-info">Finde alle Paare!</div>
                    <div class="memory-turn" id="memoryTurn">
                        Am Zug: ${currentPlayer === "p1" ? p1 : p2}
                    </div>
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
            <div class="mini-restart-row">
                <button class="mini-restart-btn">Neu starten</button>
            </div>
        `;

        const cards = container.querySelectorAll(".memory-card");
        const turnEl = container.querySelector("#memoryTurn");
        const infoEl = container.querySelector(".memory-info");
        const restartBtn = container.querySelector(".mini-restart-btn");

        restartBtn.addEventListener("click", loadMemory);

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
            <div class="ttt-status"></div>
            <div class="mini-restart-row">
                <button class="mini-restart-btn">Neu starten</button>
            </div>
        `;

        const cells = container.querySelectorAll(".ttt-cell");
        const status = container.querySelector(".ttt-status");
        const restartBtn = container.querySelector(".mini-restart-btn");

        let board = Array(9).fill(null);
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

        // 🔥 Zufällig X oder O fängt an
        let playerSymbol = Math.random() < 0.5 ? "X" : "O";
        if (status) {
            status.textContent = `Am Zug: ${nameForSymbol(playerSymbol)} (${playerSymbol})`;
        }

        restartBtn.addEventListener("click", loadTicTacToe);

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

    // ===========================
    // 4 GEWINNT
    // ===========================
    function loadConnect4Game() {
        const container = renderTopBar("4 Gewinnt");

        const { p1, p2 } = window.currentPlayers || { p1: "Spieler 1", p2: "Spieler 2" };

        container.innerHTML = `
            <div class="c4-turn">
                Am Zug: <span id="c4turnName"></span>
            </div>
            <div class="c4-board" id="c4board"></div>
            <div class="mini-restart-row">
                <button class="mini-restart-btn">Neu starten</button>
            </div>
        `;

        const turnNameEl = container.querySelector("#c4turnName");
        const boardDiv = container.querySelector("#c4board");
        const restartBtn = container.querySelector(".mini-restart-btn");

        const ROWS = 6;
        const COLS = 7;
        const board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

        // 🔥 Zufällig, wer anfängt
        let current = Math.random() < 0.5 ? "red" : "yellow";
        if (turnNameEl) {
            turnNameEl.textContent = current === "red" ? p1 : p2;
        }

        restartBtn.addEventListener("click", loadConnect4Game);

        // Grid aufbauen
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement("div");
                cell.className = "c4-cell";
                cell.dataset.row = r;
                cell.dataset.col = c;

                cell.addEventListener("click", () => {
                    placeDisc(c);
                });

                boardDiv.appendChild(cell);
            }
        }

        function placeDisc(col) {
            for (let row = ROWS - 1; row >= 0; row--) {
                if (!board[row][col]) {
                    board[row][col] = current;
                    updateCell(row, col, current);

                    if (checkWin(row, col)) {
                        const winnerName = current === "red" ? p1 : p2;
                        showResultPopup(`${winnerName} hat 4 Gewinnt gewonnen! 🎉`);
                        return;
                    }

                    // Spieler wechseln
                    if (current === "red") {
                        current = "yellow";
                        if (turnNameEl) turnNameEl.textContent = p2;
                    } else {
                        current = "red";
                        if (turnNameEl) turnNameEl.textContent = p1;
                    }
                    return;
                }
            }
        }

        function updateCell(row, col, color) {
            const index = row * COLS + col;
            const cell = boardDiv.children[index];
            cell.classList.add(color); // "red" oder "yellow"
        }

        function checkWin(row, col) {
            const color = board[row][col];
            if (!color) return false;

            function countDir(dr, dc) {
                let r = row + dr;
                let c = col + dc;
                let count = 0;

                while (
                    r >= 0 && r < ROWS &&
                    c >= 0 && c < COLS &&
                    board[r][c] === color
                ) {
                    count++;
                    r += dr;
                    c += dc;
                }
                return count;
            }

            function checkLine(dr, dc) {
                return 1 + countDir(dr, dc) + countDir(-dr, -dc) >= 4;
            }

            return (
                checkLine(1, 0) ||  // vertikal
                checkLine(0, 1) ||  // horizontal
                checkLine(1, 1) ||  // diagonal /
                checkLine(1, -1)    // diagonal \
            );
        }
    }
});
