// GANZ OBEN
const supabase = window.supabaseClient;
if (!supabase) {
    console.error("Supabase-Client fehlt in games.js");
}

document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("miniGameSelection");
    const stage = document.getElementById("miniGameArea");

    if (!grid || !stage) return;

    let currentUser = null;
    let activeGameChannel = null;   // Supabase-Channel für das laufende Online-Spiel
    let activeGameRole = null;      // "host" oder "guest"
    let activeGameKey = null;       // z.B. "tictactoe"


    const GAME_NAMES = {
        memory: "Memory",
        tictactoe: "Tic Tac Toe",
        connect4: "4 Gewinnt",
    };

    // Cache für Usernamen, damit wir nicht dauernd die DB fragen
    const usernameCache = new Map();

    async function getUsernameById(userId) {
        if (usernameCache.has(userId)) {
            return usernameCache.get(userId);
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", userId)
            .maybeSingle();

        const name = data?.username || "Unbekannt";
        usernameCache.set(userId, name);
        return name;
    }

    function setupInviteRealtime(userId) {
        if (!userId) return;

        supabase
            .channel(`game_invites_for_${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "game_invitations",
                    filter: `to_user=eq.${userId}`
                },
                async (payload) => {
                    const invite = payload.new;
                    if (!invite) return;
                    if (invite.status !== "pending") return;

                    // gameKey = "memory" | "tictactoe" | "connect4"
                    const gameKey = (invite.game || "").trim().toLowerCase();
                    const gameName = GAME_NAMES[gameKey] || "Spiel";

                    // Namen des Einladenden holen
                    const fromName = await getUsernameById(invite.from_user);

                    // Popup beim eingeladenen Spieler anzeigen
                    showIncomingInviteModal(
                        invite.id,   // invitationId
                        gameName,    // "Memory" / "Tic Tac Toe" / "4 Gewinnt"
                        fromName,    // z.B. "Selis"
                        gameKey      // intern: "memory" etc. für startGame()
                    );
                }
            )
            .subscribe();
    }


    window.currentPlayers = { p1: "", p2: "" };

    grid.querySelectorAll(".mini-card").forEach(card => {
        card.addEventListener("click", () => {
            const game = card.dataset.game;
            if (!game) return;
            showModeSelection(game);
        });
    });

    // 🟢 HIER rufen wir gleich setupInviteRealtime auf
    (async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
            console.error("Fehler beim Laden des Users:", error);
            return;
        }
        currentUser = data.user || null;

        if (currentUser) {
            setupInviteRealtime(currentUser.id);   // <--- WICHTIG
        }
    })();


    // ===========================
    // Modus-Auswahl: Solo vs. Mehrspieler
    // ===========================
    function showModeSelection(game) {
        grid.classList.add("hidden");
        stage.classList.remove("hidden");

        const normalized = (game || "").trim().toLowerCase();
        const gameName = GAME_NAMES[normalized] || "Spiel";

        stage.innerHTML = `
            <div class="mini-game-topbar">
                <button class="mini-back-btn">&larr; Zurück</button>
                <span class="mini-game-title">${gameName}</span>
            </div>

            <div class="mini-game-container">
                <div class="mini-mode-select">
                    <h3>${gameName}</h3>
                    <p>Wie möchtest du spielen?</p>
                    <div class="mini-mode-buttons">
                        <button class="mini-mode-btn" data-mode="solo">
                            🧍 Einzelspieler / 2 an einem Gerät
                        </button>
                        <button class="mini-mode-btn" data-mode="multi">
                            👥 Mehrspieler mit Freunden (online)
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Zurück zur Minispiel-Auswahl
        stage.querySelector(".mini-back-btn").addEventListener("click", backToSelection);

        // Buttons für Modus
        stage.querySelectorAll(".mini-mode-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const mode = btn.dataset.mode;
                if (mode === "solo") {
                    // wie bisher: lokale Spieler-Namen
                    showPlayerSetup(game);
                } else if (mode === "multi") {
                    // NEU: Mehrspieler-Setup
                    showMultiplayerSetup(game);
                }
            });
        });
    }

    async function fetchFriendsForMinigames() {
        // Falls currentUser noch nicht da ist, hier nachladen
        if (!currentUser) {
            const { data, error } = await supabase.auth.getUser();
            if (error || !data?.user) {
                console.error("Konnte aktuellen User nicht laden:", error);
                return [];
            }
            currentUser = data.user;
        }

        const userId = currentUser.id;

        // 1) Alle akzeptierten Freundschaften holen
        const { data: friendships, error: fError } = await supabase
            .from("friendships")
            .select("id, requester, addressee, status")
            .eq("status", "accepted")
            .or(`requester.eq.${userId},addressee.eq.${userId}`);

        if (fError) {
            console.error("Fehler beim Laden der Freundschaften:", fError);
            return [];
        }

        if (!friendships || friendships.length === 0) {
            return [];
        }

        // 2) Aus jeder Freundschaft die „andere“ ID ziehen
        const friendIds = new Set();
        for (const row of friendships) {
            if (row.requester === userId && row.addressee) {
                friendIds.add(row.addressee);
            } else if (row.addressee === userId && row.requester) {
                friendIds.add(row.requester);
            }
        }

        if (friendIds.size === 0) return [];

        // 3) Profile der Freunde holen
        const { data: profiles, error: pError } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", Array.from(friendIds));

        if (pError) {
            console.error("Fehler beim Laden der Profil-Daten:", pError);
            return [];
        }

        return (profiles || []).map(p => ({
            id: p.id,
            name: p.username || "Unbekannt",
        }));
    }


    // ===========================
    // Mehrspieler-Setup (Freunde einladen)
    // ===========================
    // ===========================
    // Mehrspieler-Setup (Freunde einladen)
    // ===========================
    async function showMultiplayerSetup(game) {
        grid.classList.add("hidden");
        stage.classList.remove("hidden");

        const normalized = (game || "").trim().toLowerCase();
        const gameName = GAME_NAMES[normalized] || "Spiel";

        // Echte Freunde laden
        const friends = await fetchFriendsForMinigames();
        console.log("Friends in Minigames:", friends);


        stage.innerHTML = `
            <div class="mini-game-topbar">
                <button class="mini-back-btn">&larr; Zurück</button>
                <span class="mini-game-title">${gameName} – Mehrspieler</span>
            </div>

            <div class="mini-game-container">
                <div class="mini-multi-setup">
                    <h3>Freund auswählen 👥</h3>
                    <p>Wen möchtest du zu <strong>${gameName}</strong> einladen?</p>

                    <div class="mini-friend-list">
                        ${friends.length === 0
                ? `<p class="mini-small-hint">Du hast noch keine Freunde in deiner Liste. 🥲</p>`
                : friends
                    .map(
                        f => `
                            <button class="mini-friend-btn" data-friend-id="${f.id}">
                                ${f.name}
                            </button>
                        `
                    )
                    .join("")
            }
                    </div>

                    <p class="mini-small-hint">
                        Einladung wird in Echtzeit bei deinem Freund angezeigt.
                    </p>
                </div>
            </div>
        `;

        stage.querySelector(".mini-back-btn").addEventListener("click", () => {
            showModeSelection(game);
        });

        stage.querySelectorAll(".mini-friend-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const friendId = btn.dataset.friendId;
                const friendName = btn.textContent.trim();
                createMultiplayerLobby(game, friendId, friendName);
            });
        });
    }


    // ===========================
    // Platzhalter: Lobby-Erstellung
    // ===========================
    // ===========================
    // Lobby-Erstellung: Einladung speichern
    // ===========================
    async function createMultiplayerLobby(game, friendId, friendName) {
        const normalized = (game || "").trim().toLowerCase();
        const gameName = GAME_NAMES[normalized] || "Spiel";

        if (!currentUser) {
            console.error("Kein eingeloggter User – kann keine Lobby erstellen.");
            backToSelection();
            return;
        }

        // Einladung in Supabase speichern
        const { data, error } = await supabase
            .from("game_invitations")
            .insert({
                game: normalized,
                from_user: currentUser.id,
                to_user: friendId,
                status: "pending"
            })
            .select("*")
            .single();

        if (error) {
            console.error("Fehler beim Erstellen der Lobby:", error);
            alert("Konnte die Einladung nicht erstellen. Versuch es später nochmal.");
            backToSelection();
            return;
        }

        const myName = await getUsernameById(currentUser.id);
        window.currentPlayers = {
            p1: myName || "Du",
            p2: friendName || "Freund"
        };

        const invitationId = data.id;

        stage.innerHTML = `
            <div class="mini-game-topbar">
                <button class="mini-back-btn">&larr; Abbrechen</button>
                <span class="mini-game-title">${gameName} – Lobby</span>
            </div>

            <div class="mini-game-container">
                <div class="mini-lobby">
                    <h3>Lobby erstellt 🎉</h3>
                    <p>Du hast <strong>${friendName}</strong> eingeladen.</p>

                    <p class="mini-small-hint" id="miniLobbyStatus">
                        Wartet darauf, dass ${friendName} die Einladung annimmt…
                    </p>

                    <button class="mini-start-btn" id="miniLobbyStartBtn" disabled>
                        Warten auf Mitspieler…
                    </button>
                </div>
            </div>
        `;

        stage.querySelector(".mini-back-btn").addEventListener("click", backToSelection);

        // Realtime-Abo für diese Einladung (Status-Update)
        setupInvitationStatusListener(invitationId, normalized);
    }

    function setupInvitationStatusListener(invitationId, game) {
        const statusEl = document.getElementById("miniLobbyStatus");
        const startBtn = document.getElementById("miniLobbyStartBtn");

        const channel = supabase
            .channel(`game_invitation_${invitationId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "game_invitations",
                    filter: `id=eq.${invitationId}`
                },
                payload => {
                    const newRow = payload.new;
                    if (!newRow) return;

                    if (newRow.status === "accepted") {
                        if (statusEl) statusEl.textContent = "Einladung akzeptiert! Du kannst das Spiel starten. 🎉";
                        if (startBtn) {
                            startBtn.disabled = false;
                            startBtn.textContent = "Spiel starten";
                            startBtn.addEventListener("click", () => {
                                // Online-Spiel für beide starten
                                startMultiplayerGame(game, invitationId, "host");
                            }, { once: true });

                        }
                        channel.unsubscribe();
                    } else if (newRow.status === "rejected") {
                        if (statusEl) statusEl.textContent = "Einladung wurde abgelehnt 😭";
                        if (startBtn) {
                            startBtn.disabled = true;
                            startBtn.textContent = "Abgelehnt";
                        }
                        channel.unsubscribe();
                    }
                }
            )
            .subscribe();
    }



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

    // ===========================
    // Online-Spiel starten (beide Geräte)
    // ===========================
    function startMultiplayerGame(gameKey, roomId, role) {
        // 🔥 Sicherstellen, dass die Spielfläche sichtbar ist
        grid.classList.add("hidden");
        stage.classList.remove("hidden");

        // globale Infos setzen
        activeGameKey = (gameKey || "").trim().toLowerCase();
        activeGameRole = role;

        // alten Channel aufräumen, falls noch vorhanden
        if (activeGameChannel) {
            activeGameChannel.unsubscribe();
            activeGameChannel = null;
        }

        // Gemeinsamer Channel pro Einladung
        const channel = supabase.channel(`game_room_${roomId}`, {
            config: {
                broadcast: {
                    ack: true,
                    self: true   // 🔥 eigene Broadcasts auch empfangen
                }
            }
        });
        activeGameChannel = channel;

        // Wenn der andere das Spiel verlässt
        channel.on("broadcast", { event: "game-left" }, () => {
            // Wir bleiben im Channel, zeigen nur Popup + zurück
            showOpponentLeftPopup();
        });


        // Loader kurz anzeigen (optional)
        const loaderName = GAME_NAMES[activeGameKey] || "Spiel";
        stage.innerHTML = `
            <div class="mini-loader">
                <div class="mini-loader-spinner"></div>
                <p>Lade ${loaderName} (Online)…</p>
            </div>
        `;

        // ❗ WICHTIG:
        // UI SOFORT bauen, nicht auf SUBSCRIBED warten
        switch (activeGameKey) {
            case "tictactoe":
                loadTicTacToeMultiplayer(channel, role);
                break;

            case "memory":
                loadMemoryMultiplayer(channel, role);
                break;

            case "connect4":
                loadConnect4Multiplayer(channel, role);
                break;

            default:
                startGame(activeGameKey); // fallback
        }


        // Channel verbinden (Status nur fürs Debuggen)
        channel.subscribe((status) => {
            console.log("Realtime-Status für", `game_room_${roomId}`, ":", status);
        });
    }



    function backToSelection() {
        // Online-Channel schließen, wenn vorhanden
        if (activeGameChannel) {
            try {
                activeGameChannel.send({
                    type: "broadcast",
                    event: "game-left",
                    payload: {}
                });
            } catch (e) {
                console.error("Fehler beim Senden von game-left:", e);
            }

            activeGameChannel.unsubscribe();
            activeGameChannel = null;
            activeGameRole = null;
            activeGameKey = null;
        }

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

    function showOpponentLeftPopup() {
        const overlay = document.createElement("div");
        overlay.className = "mini-result-overlay";
        overlay.innerHTML = `
        <div class="mini-result-card">
            <h3>Spiel beendet 🚪</h3>
            <p>Dein Mitspieler hat das Spiel verlassen. Die Lobby wird geschlossen.</p>
            <button class="mini-result-btn">Okay</button>
        </div>
    `;

        stage.appendChild(overlay);

        overlay.querySelector(".mini-result-btn").addEventListener("click", () => {
            overlay.remove();
            backToSelection();
        });
    }


    // ===========================
    // Memory
    // ===========================
    function loadMemory() {
        const container = renderTopBar("Memory");

        const images = [
            { id: "pic1", src: "assets/Images/minigames/pic1.jpg", alt: "Bild 1" },
            { id: "pic2", src: "assets/Images/minigames/pic2.PNG", alt: "Bild 2" },
            { id: "pic3", src: "assets/Images/minigames/pic3.jpg", alt: "Bild 3" },
            { id: "pic4", src: "assets/Images/minigames/pic4.JPEG", alt: "Bild 4" },
            { id: "pic5", src: "assets/Images/minigames/pic5.PNG", alt: "Bild 5" },
            { id: "pic6", src: "assets/Images/minigames/pic6.PNG", alt: "Bild 6" },
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

    function loadMemoryMultiplayer(channel, role) {
        const container = renderTopBar("Memory – Online");

        const images = [
            { id: "pic1", src: "assets/Images/minigames/pic1.jpg", alt: "Bild 1" },
            { id: "pic2", src: "assets/Images/minigames/pic2.PNG", alt: "Bild 2" },
            { id: "pic3", src: "assets/Images/minigames/pic3.jpg", alt: "Bild 3" },
            { id: "pic4", src: "assets/Images/minigames/pic4.JPEG", alt: "Bild 4" },
            { id: "pic5", src: "assets/Images/minigames/pic5.PNG", alt: "Bild 5" },
            { id: "pic6", src: "assets/Images/minigames/pic6.PNG", alt: "Bild 6" },
            { id: "pic7", src: "assets/Images/minigames/pic7.png", alt: "Bild 7" },
            { id: "pic8", src: "assets/Images/minigames/pic8.jpg", alt: "Bild 8" },
        ];

        const { p1, p2 } = window.currentPlayers || { p1: "Spieler 1", p2: "Spieler 2" };

        // Gemeinsames Deck für beide Clients
        let deck = [];

        // Punkte & Zug
        let scoreP1 = 0;
        let scoreP2 = 0;

        // ❗ WICHTIG: Beide Clients starten mit dem gleichen currentPlayer
        let currentPlayer = "p1"; // p1 beginnt IMMER

        let selected = [];
        let locked = false;

        // --- Deck-Initialisierung ---

        // Handler zuerst registrieren
        channel.on("broadcast", { event: "memory-init" }, (event) => {
            deck = event.payload.deck;
            scoreP1 = 0;
            scoreP2 = 0;
            currentPlayer = "p1";   // Reset: immer p1 startet
            selected = [];
            locked = false;
            renderBoard();
        });

        // Nur Host erstellt das Deck und sendet es
        if (role === "host") {
            const initialDeck = [...images, ...images].sort(() => Math.random() - 0.5);
            channel.send({
                type: "broadcast",
                event: "memory-init",
                payload: { deck: initialDeck }
            });
        }

        // --- UI rendern ---

        function renderBoard() {
            container.innerHTML = `
            <div class="memory-wrapper">
                <div class="memory-header">
                    <div class="memory-info">Finde alle Paare!</div>
                    <div class="memory-turn">
                        Am Zug: ${currentPlayer === "p1" ? p1 : p2}
                    </div>
                </div>

                <div class="memory-grid">
                    ${deck
                    .map(
                        (card, i) => `
                            <div class="memory-card" data-i="${i}">
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

            const restart = container.querySelector(".mini-restart-btn");
            restart.addEventListener("click", () => {
                // Nur Host darf Neustart triggern
                if (role === "host") {
                    const newDeck = [...images, ...images].sort(() => Math.random() - 0.5);
                    channel.send({
                        type: "broadcast",
                        event: "memory-init",
                        payload: { deck: newDeck }
                    });
                }
            });

            connectClicks();
        }

        function updateTurnLabel() {
            const turnEl = container.querySelector(".memory-turn");
            if (turnEl) {
                turnEl.textContent = `Am Zug: ${currentPlayer === "p1" ? p1 : p2}`;
            }
        }

        // --- Klick-Logik ---

        function connectClicks() {
            container.querySelectorAll(".memory-card").forEach(card => {
                card.addEventListener("click", () => {
                    const index = Number(card.dataset.i);

                    // Nur der Spieler am Zug darf Broadcast senden
                    const isMyTurn =
                        (role === "host" && currentPlayer === "p1") ||
                        (role === "guest" && currentPlayer === "p2");

                    if (!isMyTurn || locked) return;

                    channel.send({
                        type: "broadcast",
                        event: "memory-click",
                        payload: { index }
                    });
                });
            });
        }

        // Broadcasts für Züge empfangen
        channel.on("broadcast", { event: "memory-click" }, (event) => {
            const { index } = event.payload || {};
            if (index === undefined) return;
            handleClick(index);
        });

        function handleClick(i) {
            const cards = container.querySelectorAll(".memory-card");
            const card = cards[i];
            if (!card || locked || card.classList.contains("matched") || card.classList.contains("flipped")) {
                return;
            }

            card.classList.add("flipped");
            selected.push({ i, id: deck[i].id });

            if (selected.length < 2) return;

            // Zweite Karte → prüfen
            locked = true;
            const [a, b] = selected;

            if (a.id === b.id) {
                // Match
                cards[a.i].classList.add("matched");
                cards[b.i].classList.add("matched");

                if (currentPlayer === "p1") {
                    scoreP1++;
                } else {
                    scoreP2++;
                }

                selected = [];
                locked = false;

                // Alle Paare gefunden?
                const totalPairs = images.length;
                if (scoreP1 + scoreP2 === totalPairs) {
                    let msg;
                    if (scoreP1 > scoreP2) {
                        msg = `${p1} hat gewonnen! (${scoreP1} : ${scoreP2}) 🎉`;
                    } else if (scoreP2 > scoreP1) {
                        msg = `${p2} hat gewonnen! (${scoreP2} : ${scoreP1}) 🎉`;
                    } else {
                        msg = `Unentschieden! Beide haben ${scoreP1} Paare. 🤝`;
                    }
                    showResultPopup(msg);
                }
            } else {
                // Kein Match → nach kurzer Zeit umdrehen und Zug wechseln
                setTimeout(() => {
                    cards[a.i].classList.remove("flipped");
                    cards[b.i].classList.remove("flipped");
                    selected = [];
                    locked = false;

                    // Zugwechsel (bei BEIDEN Clients gleich)
                    currentPlayer = currentPlayer === "p1" ? "p2" : "p1";
                    updateTurnLabel();
                }, 900);
            }
        }
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
    // Tic Tac Toe – ONLINE
    // ===========================
    function loadTicTacToeMultiplayer(channel, role) {
        const container = renderTopBar("Tic Tac Toe – Online");

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

        // Board-Zustand wird bei beiden Geräten identisch gehalten
        let board = Array(9).fill(null);
        let gameOver = false;

        // Host spielt X, Gast spielt O
        const mySymbol = role === "host" ? "X" : "O";
        const otherSymbol = mySymbol === "X" ? "O" : "X";

        // X (Host) beginnt
        let currentSymbol = "X";

        function nameForSymbol(sym) {
            return sym === "X" ? p1 : p2;
        }

        function updateStatus() {
            if (gameOver) return;
            if (status) {
                status.textContent = `Am Zug: ${nameForSymbol(currentSymbol)} (${currentSymbol})`;
            }
        }

        function isMyTurn() {
            return currentSymbol === mySymbol;
        }

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

        function check(sym) {
            return wins.some(([a, b, c]) => board[a] === sym && board[b] === sym && board[c] === sym);
        }

        function applyMove(index, symbol) {
            if (gameOver) return;
            if (board[index]) return;

            board[index] = symbol;
            const cell = Array.from(cells).find(c => Number(c.dataset.i) === index);
            if (cell) {
                cell.textContent = symbol;
                cell.classList.add(symbol === "X" ? "ttt-x" : "ttt-o");
            }

            if (check(symbol)) {
                const winnerName = nameForSymbol(symbol);
                if (status) status.textContent = `${winnerName} (${symbol}) gewinnt! 🎉`;
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

            // Zug wechseln
            currentSymbol = symbol === "X" ? "O" : "X";
            updateStatus();
        }

        // Klicks: Nur wenn ich dran bin → Broadcast schicken, UI wird durch Broadcast aufgebaut
        cells.forEach(cell => {
            cell.addEventListener("click", () => {
                const i = Number(cell.dataset.i);
                if (!isMyTurn() || gameOver || board[i]) return;

                channel.send({
                    type: "broadcast",
                    event: "ttt-move",
                    payload: { index: i, symbol: mySymbol }
                });
            });
        });

        // Broadcasts empfangen (eigene UND fremde Züge)
        channel.on("broadcast", { event: "ttt-move" }, (event) => {
            const { index, symbol } = event.payload || {};
            if (index === undefined || symbol === undefined) return;
            applyMove(index, symbol);
        });

        // Neustart-Button: einfachen Reset über Broadcast machen
        restartBtn.addEventListener("click", () => {
            if (!mySymbol) return;

            channel.send({
                type: "broadcast",
                event: "ttt-reset",
                payload: {}
            });
        });

        channel.on("broadcast", { event: "ttt-reset" }, () => {
            board = Array(9).fill(null);
            gameOver = false;
            currentSymbol = "X"; // Host beginnt wieder

            cells.forEach(c => {
                c.textContent = "";
                c.classList.remove("ttt-x", "ttt-o");
            });

            if (status) status.textContent = "";
            updateStatus();
        });

        // Initialen Status setzen
        if (status) {
            status.textContent = `Am Zug: ${nameForSymbol(currentSymbol)} (${currentSymbol})`;
        }
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

    function loadConnect4Multiplayer(channel, role) {
        const container = renderTopBar("4 Gewinnt – Online");
        const { p1, p2 } = window.currentPlayers;

        const ROWS = 6;
        const COLS = 7;

        let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

        // Host = rot, Guest = gelb
        const myColor = role === "host" ? "red" : "yellow";
        let currentColor = "red"; // Host beginnt

        container.innerHTML = `
        <div class="c4-turn">Am Zug: <span id="c4turnName">${p1}</span></div>
        <div class="c4-board" id="c4board"></div>
        <div class="mini-restart-row">
            <button class="mini-restart-btn">Neu starten</button>
        </div>
    `;

        const turnEl = container.querySelector("#c4turnName");
        const boardDiv = container.querySelector("#c4board");

        // Board rendern
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement("div");
                cell.classList.add("c4-cell");
                cell.dataset.row = r;
                cell.dataset.col = c;

                cell.addEventListener("click", () => {
                    if (currentColor !== myColor) return; // Nicht dran
                    channel.send({
                        type: "broadcast",
                        event: "c4-move",
                        payload: { col: c, color: myColor }
                    });
                });

                boardDiv.appendChild(cell);
            }
        }

        // DISC PLACEMENT
        function placeDisc(col, color) {
            for (let r = ROWS - 1; r >= 0; r--) {
                if (!board[r][col]) {
                    board[r][col] = color;

                    const cell = boardDiv.children[r * COLS + col];
                    cell.classList.add(color);

                    if (checkWin(r, col)) {
                        const winnerName = color === "red" ? p1 : p2;
                        showResultPopup(`${winnerName} hat gewonnen! 🎉`);
                    }

                    currentColor = color === "red" ? "yellow" : "red";
                    turnEl.textContent = currentColor === "red" ? p1 : p2;
                    return;
                }
            }
        }

        channel.on("broadcast", { event: "c4-move" }, (event) => {
            const { col, color } = event.payload;
            placeDisc(col, color);
        });

        // Neustart
        container.querySelector(".mini-restart-btn").addEventListener("click", () => {
            if (role === "host") {
                channel.send({
                    type: "broadcast",
                    event: "c4-reset",
                    payload: {}
                });
            }
        });

        channel.on("broadcast", { event: "c4-reset" }, () => {
            board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
            Array.from(boardDiv.children).forEach(c => {
                c.classList.remove("red", "yellow");
            });
            currentColor = "red";
            turnEl.textContent = p1;
        });

        // Win Check
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
                checkLine(1, 0) ||
                checkLine(0, 1) ||
                checkLine(1, 1) ||
                checkLine(1, -1)
            );
        }
    }


    function showIncomingInviteModal(invitationId, gameName, fromName, gameKey) {
        // Einfaches Overlay-Modal
        const overlay = document.createElement("div");
        overlay.className = "mini-result-overlay"; // du hast schon ein Overlay-Style

        overlay.innerHTML = `
        <div class="mini-result-card">
            <h3>Spieleinladung 🎮</h3>
            <p><strong>${fromName}</strong> möchte mit dir <strong>${gameName}</strong> spielen.</p>
            <div style="display:flex; gap:0.6rem; justify-content:center; margin-top:0.8rem;">
                <button class="mini-result-btn" data-action="accept">Annehmen</button>
                <button class="mini-result-btn" data-action="reject"
                        style="background:#4b5563; box-shadow:none; color:#e5e7eb;">
                    Ablehnen
                </button>
            </div>
        </div>
    `;

        // ❗Wichtig: tatsächlich einfügen
        document.body.appendChild(overlay);

        overlay.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", async () => {
                const action = btn.dataset.action;

                if (action === "accept") {
                    await supabase
                        .from("game_invitations")
                        .update({ status: "accepted" })
                        .eq("id", invitationId);

                    let myName = "Du";
                    try {
                        const { data: userData, error: userError } = await supabase.auth.getUser();
                        if (!userError && userData?.user?.id) {
                            myName = await getUsernameById(userData.user.id);
                        }
                    } catch (e) {
                        console.error("Konnte eigenen Namen nicht laden:", e);
                    }

                    // 🔥 Host = fromName (p1), Guest = myName (p2)
                    window.currentPlayers = {
                        p1: fromName || "Host",
                        p2: myName || "Gast"
                    };

                    // Online-Spiel starten – Gast-Seite
                    if (gameKey) {
                        startMultiplayerGame(gameKey, invitationId, "guest");
                    }
                } else {
                    await supabase
                        .from("game_invitations")
                        .update({ status: "rejected" })
                        .eq("id", invitationId);
                }

                overlay.remove();
            });
        });
    }

    window.addEventListener("beforeunload", () => {
        if (activeGameChannel) {
            try {
                activeGameChannel.send({
                    type: "broadcast",
                    event: "game-left",
                    payload: {}
                });
                activeGameChannel.unsubscribe();
            } catch (e) {
                console.error("Fehler beim beforeunload game-left:", e);
            }
        }
    });

});
