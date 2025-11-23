// assets/js/friends.js
// Supabase-Client kommt aus supabase.js (supabaseClient)

document.addEventListener("DOMContentLoaded", () => {
    // --- DOM-Elemente ---
    const usernameInput = document.getElementById("friendsUsernameInput");
    const saveUsernameBtn = document.getElementById("friendsSaveUsernameBtn");
    const usernameStatus = document.getElementById("friendsUsernameStatus");

    const addInput = document.getElementById("friendsAddInput");
    const addBtn = document.getElementById("friendsAddBtn");
    const addStatus = document.getElementById("friendsAddStatus");

    const incomingList = document.getElementById("friendsIncomingList");
    const outgoingList = document.getElementById("friendsOutgoingList");
    const friendsList = document.getElementById("friendsList");

    if (!usernameInput || !saveUsernameBtn || !supabaseClient) {
        console.warn("Friends-Panel oder SupabaseClient nicht vorhanden.");
        return;
    }

    // ============================
    // Helper: aktueller User
    // ============================
    async function getCurrentUser() {
        const { data, error } = await supabaseClient.auth.getUser();
        if (error || !data?.user) {
            console.error("Kein eingeloggter User:", error);
            throw new Error("Du musst eingeloggt sein.");
        }
        return data.user;
    }

    async function getOrCreateProfile() {
        const user = await getCurrentUser();

        let { data: profile, error } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (error) {
            console.error("Fehler beim Laden des Profils:", error);
            throw error;
        }

        if (!profile) {
            const { data: inserted, error: insertError } = await supabaseClient
                .from("profiles")
                .insert({ id: user.id })
                .select()
                .maybeSingle();

            if (insertError) {
                console.error("Fehler beim Anlegen des Profils:", insertError);
                throw insertError;
            }
            profile = inserted;
        }

        return profile;
    }

    // ============================
    // 1) Eigenen Benutzernamen
    // ============================
    async function loadOwnUsername() {
        try {
            const profile = await getOrCreateProfile();
            if (profile.username) {
                usernameInput.value = profile.username;
                usernameStatus.textContent = `Dein aktueller Benutzername: @${profile.username}`;
                usernameStatus.className = "friends-status-msg ok";
            } else {
                usernameStatus.textContent = "Lege dir einen Benutzernamen fest 😊";
                usernameStatus.className = "friends-status-msg";
            }
        } catch (err) {
            console.error(err);
            usernameStatus.textContent =
                "Konnte Profil nicht laden. Bist du eingeloggt?";
            usernameStatus.className = "friends-status-msg error";
        }
    }

    async function saveUsername() {
        const raw = usernameInput.value.trim();
        if (!raw) {
            usernameStatus.textContent = "Benutzername darf nicht leer sein.";
            usernameStatus.className = "friends-status-msg error";
            return;
        }

        // NICHT mehr toLowerCase erzwingen
        const username = raw;

        try {
            const user = await getCurrentUser();

            // prüfen, ob Name schon vergeben
            const { data: existing, error: checkError } = await supabaseClient
                .from("profiles")
                .select("id")
                .eq("username", username)
                .neq("id", user.id);

            if (checkError) throw checkError;

            if (existing && existing.length > 0) {
                usernameStatus.textContent =
                    "Dieser Benutzername ist schon vergeben. 😢";
                usernameStatus.className = "friends-status-msg error";
                return;
            }

            const { error: updateError } = await supabaseClient
                .from("profiles")
                .update({ username })
                .eq("id", user.id);

            if (updateError) throw updateError;

            usernameStatus.textContent = `Gespeichert ✅ Dein Name ist jetzt @${username}`;
            usernameStatus.className = "friends-status-msg ok";

            // direkt Listen neu laden (falls sich jemand auf dich bezieht)
            refreshAllLists();
        } catch (err) {
            console.error(err);
            usernameStatus.textContent =
                "Fehler beim Speichern des Benutzernamens.";
            usernameStatus.className = "friends-status-msg error";
        }
    }

    saveUsernameBtn.addEventListener("click", saveUsername);

    // ============================
    // 2) Freundesanfrage senden
    // ============================
    async function sendFriendRequest() {
        const targetName = addInput.value.trim();
        addStatus.textContent = "";
        addStatus.className = "friends-status-msg";

        if (!targetName) {
            addStatus.textContent = "Bitte gib einen Benutzernamen ein.";
            addStatus.classList.add("error");
            return;
        }

        try {
            const user = await getCurrentUser();
            const profile = await getOrCreateProfile();

            if (!profile.username) {
                addStatus.textContent =
                    "Du brauchst erst einen eigenen Benutzernamen.";
                addStatus.classList.add("error");
                return;
            }

            if (profile.username === targetName) {
                addStatus.textContent =
                    "Du kannst dir selbst keine Anfrage schicken.";
                addStatus.classList.add("error");
                return;
            }

            // Ziel-Profil mit Username finden
            const { data: targetProfiles, error: tgtErr } = await supabaseClient
                .from("profiles")
                .select("id, username")
                .ilike("username", targetName)  // case-insensitive
                .limit(1);

            if (tgtErr) throw tgtErr;
            if (!targetProfiles || targetProfiles.length === 0) {
                addStatus.textContent = "Kein Nutzer mit diesem Namen gefunden.";
                addStatus.classList.add("error");
                return;
            }

            const targetProfile = targetProfiles[0];

            // Anfrage speichern (unique-Paar verhindert Duplikate)
            const { error: insertErr } = await supabaseClient
                .from("friendships")
                .insert({
                    requester: user.id,
                    addressee: targetProfile.id,
                    status: "pending",
                });

            if (insertErr) {
                if (insertErr.code === "23505") {
                    addStatus.textContent =
                        "Es existiert bereits eine Anfrage oder Freundschaft.";
                } else {
                    console.error(insertErr);
                    addStatus.textContent =
                        "Fehler beim Senden der Anfrage. Versuche es später nochmal.";
                }
                addStatus.classList.add("error");
                return;
            }

            addStatus.textContent = `Anfrage an @${targetProfile.username} gesendet. 💌`;
            addStatus.classList.add("ok");
            addInput.value = "";

            await refreshAllLists();
        } catch (err) {
            console.error(err);
            addStatus.textContent =
                "Es ist ein Fehler aufgetreten. Bist du eingeloggt?";
            addStatus.classList.add("error");
        }
    }

    addBtn.addEventListener("click", sendFriendRequest);

    // ============================
    // 3) Helper für Username-Map
    // ============================
    async function fetchUsernamesMap(ids) {
        const uniqueIds = [...new Set(ids)].filter(Boolean);
        if (uniqueIds.length === 0) return {};

        const { data, error } = await supabaseClient
            .from("profiles")
            .select("id, username")
            .in("id", uniqueIds);

        if (error) {
            console.error("Fehler beim Laden von Usernames:", error);
            return {};
        }

        const map = {};
        data.forEach((row) => {
            map[row.id] = row.username || "Unbekannt";
        });
        return map;
    }

    // ============================
    // 4) Listen: incoming / outgoing / friends
    // ============================
    async function refreshAllLists() {
        await Promise.all([
            loadIncomingRequests(),
            loadOutgoingRequests(),
            loadFriends(),
        ]);
    }

    // ---- eingehende Anfragen ----
    async function loadIncomingRequests() {
        if (!incomingList) return;
        incomingList.innerHTML = "<p class='friends-empty'>Lade…</p>";

        try {
            const user = await getCurrentUser();

            const { data, error } = await supabaseClient
                .from("friendships")
                .select("id, status, requester")
                .eq("addressee", user.id)
                .eq("status", "pending")
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                incomingList.innerHTML =
                    "<p class='friends-empty'>Keine offenen Anfragen.</p>";
                return;
            }

            const requesterIds = data.map((row) => row.requester);
            const usernameMap = await fetchUsernamesMap(requesterIds);

            incomingList.innerHTML = "";
            data.forEach((row) => {
                const username = usernameMap[row.requester] || "Unbekannt";
                const div = document.createElement("div");
                div.className = "friends-item";
                div.innerHTML = `
                    <span><strong>@${username}</strong> möchte mit dir befreundet sein.</span>
                    <div class="friends-actions">
                        <button data-id="${row.id}" data-action="accept">Annehmen</button>
                        <button data-id="${row.id}" data-action="decline">Ablehnen</button>
                    </div>
                `;
                incomingList.appendChild(div);
            });

            incomingList.querySelectorAll("button").forEach((btn) => {
                btn.addEventListener("click", () =>
                    handleIncomingAction(btn.dataset.id, btn.dataset.action)
                );
            });
        } catch (err) {
            console.error(err);
            incomingList.innerHTML =
                "<p class='friends-empty'>Fehler beim Laden der Anfragen.</p>";
        }
    }

    async function handleIncomingAction(friendshipId, action) {
        const newStatus = action === "accept" ? "accepted" : "declined";

        const { error } = await supabaseClient
            .from("friendships")
            .update({ status: newStatus })
            .eq("id", friendshipId);

        if (error) {
            console.error(error);
            return;
        }

        await refreshAllLists();
    }

    // ---- ausgehende Anfragen ----
    async function loadOutgoingRequests() {
        if (!outgoingList) return;
        outgoingList.innerHTML = "<p class='friends-empty'>Lade…</p>";

        try {
            const user = await getCurrentUser();

            const { data, error } = await supabaseClient
                .from("friendships")
                .select("id, status, addressee")
                .eq("requester", user.id)
                .eq("status", "pending")
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                outgoingList.innerHTML =
                    "<p class='friends-empty'>Keine offenen Anfragen.</p>";
                return;
            }

            const addresseeIds = data.map((row) => row.addressee);
            const usernameMap = await fetchUsernamesMap(addresseeIds);

            outgoingList.innerHTML = "";
            data.forEach((row) => {
                const username = usernameMap[row.addressee] || "Unbekannt";
                const div = document.createElement("div");
                div.className = "friends-item";
                div.innerHTML = `
                    <span>Anfrage an <strong>@${username}</strong> – wartet auf Antwort.</span>
                `;
                outgoingList.appendChild(div);
            });
        } catch (err) {
            console.error(err);
            outgoingList.innerHTML =
                "<p class='friends-empty'>Fehler beim Laden der ausgehenden Anfragen.</p>";
        }
    }

    // ---- Freunde ----
    async function loadFriends() {
        if (!friendsList) return;
        friendsList.innerHTML = "<p class='friends-empty'>Lade…</p>";

        try {
            const user = await getCurrentUser();

            const { data, error } = await supabaseClient
                .from("friendships")
                .select("id, requester, addressee, status")
                .eq("status", "accepted")
                .or(`requester.eq.${user.id},addressee.eq.${user.id}`);

            if (error) throw error;

            if (!data || data.length === 0) {
                friendsList.innerHTML =
                    "<p class='friends-empty'>Noch keine Freunde. 😢</p>";
                return;
            }

            // alle "anderen" IDs einsammeln
            const otherIds = data.map((row) =>
                row.requester === user.id ? row.addressee : row.requester
            );
            const usernameMap = await fetchUsernamesMap(otherIds);

            friendsList.innerHTML = "";
            data.forEach((row) => {
                const otherId =
                    row.requester === user.id ? row.addressee : row.requester;
                const username = usernameMap[otherId] || "Unbekannt";

                const div = document.createElement("div");
                div.className = "friends-item";
                div.innerHTML = `<span>@${username}</span>`;
                friendsList.appendChild(div);
            });
        } catch (err) {
            console.error(err);
            friendsList.innerHTML =
                "<p class='friends-empty'>Fehler beim Laden der Freunde.</p>";
        }
    }

    // Initial
    loadOwnUsername();
    refreshAllLists();
});
