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

    // heutigess Datum als string "YYYY-MM-DD"
    const todayStr = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabaseClient
        .from("daily_messages")
        .select("id, message, date_for")
        .eq("date_for", todayStr)
        .limit(1);


    if (error) {
        console.error(error);
        selectEl.innerHTML = `<option>Fehler beim Laden</option>`;
        textEl.textContent = "Konnte nichts laden.";
        return;
    }

    if (error) {
        console.error(error);
        textEl.textContent = "Konnte nichts laden.";
        if (metaEl) metaEl.textContent = "";
        return;
    }

    const row = data && data.length ? data[0] : null;

    // Optional: Select deaktivieren (falls noch sichtbar)
    selectEl.innerHTML = "";
    selectEl.disabled = true;

    if (!row) {
        textEl.textContent = "Heute gibt es noch keine Nachricht 🙂";
        if (metaEl) metaEl.textContent = "";
        return;
    }

    textEl.textContent = row.message || "–";
    if (metaEl) metaEl.textContent = `Nachricht für: ${row.date_for}`;


    // Wechsel-Handler
    selectEl.onchange = () => {
        const selectedId = selectEl.value;
        const found = data.find((r) => r.id === selectedId);
        textEl.textContent = found ? (found.message || "–") : "–";
        if (metaEl) metaEl.textContent = found ? `Nachricht für: ${found.date_for}` : "";
    };
}