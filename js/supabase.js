// ==================== SUPABASE GLOBAL CONFIG ====================
const SUPABASE_URL = "https://gydiothkntpejybyjvpx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZGlvdGhrbnRwZWp5YnlqdnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDgyNTQsImV4cCI6MjA3ODE4NDI1NH0.AP5VyYh3rtes888Klm0_kR3mosus19P5RnCPHxJBWj4";

const supabaseClient = typeof supabase !== "undefined"
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// Für andere Scripts global verfügbar machen
window.supabaseClient = supabaseClient;


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
