import { useState } from "react";
import { ApiError } from "../lib/api";
import { useStore } from "../store/useStore";

export default function Auth() {
  const login = useStore((s) => s.login);
  const register = useStore((s) => s.register);
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);

    if (!email.trim()) {
      setError("Bitte eine E-Mail angeben.");
      return;
    }

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Anmeldung fehlgeschlagen.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 px-5 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-2 pt-8">
          <div className="label">Konto</div>
          <h1 className="text-4xl font-semibold tracking-tight text-ink-100">Training synchronisieren</h1>
          <p className="text-sm text-ink-300">
            Mit Registrierung bekommt jeder Benutzer ein eigenes Profil und eigene Trainingsdaten auf dem Server.
          </p>
        </div>

        <div className="card p-2 flex rounded-2xl bg-white/5">
          <button
            className={`flex-1 rounded-xl py-3 text-sm font-medium ${mode === "register" ? "bg-accent-500 text-ink-900" : "text-ink-300"}`}
            onClick={() => setMode("register")}
          >
            Registrieren
          </button>
          <button
            className={`flex-1 rounded-xl py-3 text-sm font-medium ${mode === "login" ? "bg-accent-500 text-ink-900" : "text-ink-300"}`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
        </div>

        <div className="card p-5 space-y-4">
          <Field label="E-Mail">
            <input
              type="email"
              className="input"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </Field>

          <Field label="Passwort">
            <input
              type="password"
              className="input"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
            />
          </Field>

          {mode === "register" && (
            <Field label="Passwort wiederholen">
              <input
                type="password"
                className="input"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort erneut eingeben"
              />
            </Field>
          )}

          {error && (
            <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-200">
              {error}
            </div>
          )}

          <button className="btn-primary w-full" disabled={loading} onClick={submit}>
            {loading ? "Bitte warten …" : mode === "register" ? "Konto anlegen" : "Einloggen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <div className="label">{label}</div>
      {children}
    </label>
  );
}
