"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const C = {
  crimson:      "#6B1A1A",
  crimsonPale:  "#FEF2F2",
  crimsonBorder:"#FECACA",
  bg:           "#FAFAF8",
  card:         "#FFFFFF",
  border:       "#E8E2DA",
  text:         "#1C1C1C",
  muted:        "#6B6672",
};

export default function LoginForm() {
  const router              = useRouter();
  const [password, setPass] = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoad]  = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!password) { setError("Please enter the admin password."); return; }

    setLoad(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Incorrect password.");
      setLoad(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 20px",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: C.crimson,
          fontFamily: "Georgia,serif", letterSpacing: 1, marginBottom: 4 }}>
          SHARP
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>Admin Panel</div>
      </div>

      <form onSubmit={submit}
        style={{ background: C.card, borderRadius: 16, padding: "32px 28px",
          width: "100%", maxWidth: 380,
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid " + C.border }}>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text,
          fontFamily: "Georgia,serif", margin: "0 0 6px" }}>
          Sign in
        </h2>
        <p style={{ fontSize: 13, color: C.muted, margin: "0 0 24px" }}>
          Enter the admin password to continue.
        </p>

        <label style={{ display: "block", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
            textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 6 }}>
            Password
          </div>
          <input
            type="password"
            value={password}
            autoFocus
            onChange={e => { setPass(e.target.value); setError(""); }}
            placeholder="••••••••"
            style={{ width: "100%", padding: "11px 13px",
              border: "1.5px solid " + (error ? C.crimsonBorder : C.border),
              borderRadius: 8, fontSize: 14, color: C.text,
              background: C.card, outline: "none",
              boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </label>

        {error && (
          <div style={{ background: C.crimsonPale, border: "1px solid " + C.crimsonBorder,
            borderRadius: 8, padding: "9px 13px", marginBottom: 16,
            fontSize: 13, color: C.crimson }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          style={{ width: "100%", padding: "12px",
            background: loading ? "#9B6B6B" : C.crimson,
            color: "#fff", border: "none", borderRadius: 8,
            fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit" }}>
          {loading ? "Signing in…" : "Access Admin →"}
        </button>
      </form>
    </div>
  );
}
