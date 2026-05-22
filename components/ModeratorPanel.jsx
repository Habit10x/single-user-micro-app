"use client";

import { useState, useEffect, useCallback } from "react";

const C = {
  crimson:       "#6B1A1A",
  crimsonPale:   "#FEF2F2",
  crimsonLight:  "#F5E8E8",
  crimsonBorder: "#FECACA",
  bg:            "#FAFAF8",
  card:          "#FFFFFF",
  border:        "#E8E2DA",
  borderLight:   "#F0EBE3",
  text:          "#1C1C1C",
  textSoft:      "#3D3530",
  muted:         "#6B6672",
  red:           "#DC2626",
};

const SCENARIOS = [
  { id: 1, short: "Project Update",
    text: `Your manager asks: "How's the Horizon project coming along?"`,
    ctx: ["4 of 6 emails done, approved by marketing","Email 3: legal review delay — resolved","On track for next Friday deadline","Design team hasn't replied about header format — if no reply by Tuesday, 3-day delay"] },
  { id: 2, short: "Show Rec.",
    text: `Your friend texts: "Should I watch that crime show you just finished? I have one evening free."`,
    ctx: ["6 episodes. Eps 1–4: gripping, watched all four in one sitting","Eps 5–6: romance subplot takes over, tension drops significantly","Finale reveal satisfying but last 20 min feel rushed","Friend likes crime shows, hates shows that drag"] },
  { id: 3, short: "Missed Meeting",
    text: `Your team lead messages: "You weren't on the call — what happened, and what did you miss?"`,
    ctx: ["Water pipe emergency at 2:50pm — no time to message first","Caught up with colleague: presentation moved to Thursday (no content change)","New expense approval: >₹5k needs 2 managers via new form, starts Monday","Tuesday sync cancelled (public holiday)"] },
  { id: 4, short: "Explain Role",
    text: `A family member asks: "So what is it that you actually do at work? I've never understood."`,
    ctx: ["Role: Business Analyst at a consumer goods company","You find why products underperform and write 2–3 page reports for marketing/ops","Last month: found shelf placement (not pricing) was killing sales in 3 cities","Time: ~60% data, ~30% meetings, ~10% writing"] },
];

export default function ModeratorPanel({ onLogout }) {
  const [instances,     setInstances]     = useState([]);
  const [selectedView,  setSelectedView]  = useState("single");
  const [submissions,   setSubmissions]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeSc,      setActiveSc]      = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  useEffect(() => {
    fetch("/api/moderator/instances")
      .then(r => r.json())
      .then(setInstances)
      .catch(() => {});
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedView === "single"
        ? "/api/moderator/submissions?mode=single"
        : `/api/moderator/submissions?instance_id=${selectedView}`;
      const r = await fetch(url);
      setSubmissions(await r.json());
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedView]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await fetch(`/api/moderator/submissions/${confirmDelete}`, { method: "DELETE" });
      setSubmissions(prev => prev.filter(s => s.id !== confirmDelete));
      setConfirmDelete(null);
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  };

  const scenario    = SCENARIOS.find(s => s.id === activeSc);
  const instanceMeta = selectedView !== "single"
    ? instances.find(i => String(i.id) === selectedView)
    : null;

  // Submissions that have an answer for the active scenario
  const activeAnswers = submissions.filter(
    sub => sub.answers?.[activeSc] || sub.answers?.[String(activeSc)]
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* ── Header ── */}
      <header style={{
        background: C.card, borderBottom: "1px solid " + C.border,
        padding: "0 24px", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50, boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 17, color: C.crimson, letterSpacing: 0.5, fontFamily: "Georgia,serif" }}>
            SHARP
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
            background: C.crimsonPale, color: C.crimson,
            border: "1px solid " + C.crimsonBorder,
            textTransform: "uppercase", letterSpacing: 0.8,
          }}>
            Moderator
          </span>
        </div>
        <button onClick={onLogout} style={{
          background: "none", border: "1px solid " + C.border,
          color: C.muted, fontSize: 12, fontWeight: 600,
          padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
        }}>
          Log out
        </button>
      </header>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "22px 20px 48px" }}>

        {/* ── View selector ── */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 6 }}>
              View
            </div>
            <select
              value={selectedView}
              onChange={e => setSelectedView(e.target.value)}
              style={{
                width: "100%", padding: "10px 13px",
                border: "1.5px solid " + C.border, borderRadius: 8,
                fontSize: 13, color: C.text, background: C.card,
                outline: "none", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <option value="single">Single-user Submissions</option>
              {instances.map(inst => (
                <option key={inst.id} value={String(inst.id)}>
                  Instance: {inst.name} ({inst.user_count} {inst.user_count === 1 ? "user" : "users"})
                </option>
              ))}
            </select>
          </div>
          <button onClick={fetchSubmissions} style={{
            padding: "10px 14px", background: "none",
            border: "1.5px solid " + C.border, borderRadius: 8,
            fontSize: 12, fontWeight: 600, color: C.muted,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Refresh
          </button>
        </div>

        {/* ── Page heading ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "Georgia,serif", margin: 0 }}>
            Community Responses
          </h2>
          {instanceMeta && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: C.crimsonPale, border: "1px solid " + C.crimsonBorder,
              borderRadius: 8, padding: "5px 11px",
              fontSize: 11, fontWeight: 700, color: C.crimson,
            }}>
              Instance: {instanceMeta.name}
            </div>
          )}
        </div>

        {/* ── Scenario pills ── */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 22, paddingBottom: 3 }}>
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => setActiveSc(s.id)} style={{
              padding: "6px 14px", borderRadius: 99, border: "1.5px solid",
              borderColor: activeSc === s.id ? C.crimson : C.border,
              background: activeSc === s.id ? C.crimsonPale : C.card,
              color: activeSc === s.id ? C.crimson : C.muted,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              whiteSpace: "nowrap", flexShrink: 0,
            }}>
              {s.id}. {s.short}
            </button>
          ))}
        </div>

        {/* ── Scenario prompt + context card ── */}
        {scenario && (
          <div style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ padding: "13px 17px", borderBottom: "1px solid " + C.borderLight }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>
                Scenario {scenario.id}
              </div>
              <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, margin: 0, fontStyle: "italic", fontWeight: 500 }}>
                "{scenario.text}"
              </p>
            </div>
            <div style={{ padding: "12px 17px", background: "#FDFCFB" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
                Context
              </div>
              {scenario.ctx.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                  <span style={{ color: C.crimson, fontWeight: 700, fontSize: 12, flexShrink: 0, marginTop: 2 }}>→</span>
                  <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Responses count ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: C.muted }}>
            {loading ? "Loading…" : `${activeAnswers.length} response${activeAnswers.length !== 1 ? "s" : ""}`}
          </span>
          <span style={{ fontSize: 12, color: C.muted }}>
            {!loading && submissions.length > 0 && `${submissions.length} total submission${submissions.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* ── Answer cards ── */}
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: C.muted, fontSize: 13 }}>Loading…</div>
        ) : activeAnswers.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", fontSize: 13, color: C.muted, fontStyle: "italic" }}>
            No responses for this scenario yet.
          </div>
        ) : (
          activeAnswers.map(sub => {
            const answer = sub.answers[activeSc] || sub.answers[String(activeSc)];
            return (
              <div key={sub.id} style={{
                background: C.card, borderRadius: 12,
                padding: "14px 16px", marginBottom: 9, border: "1px solid " + C.border,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 9 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: "#EDE8E3", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.muted,
                  }}>
                    {sub.name[0].toUpperCase()}
                  </div>

                  {/* Name + identifier */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{sub.name}</div>
                    {sub.email && (
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{sub.email}</div>
                    )}
                  </div>

                  {/* Date + delete */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: C.muted }}>
                      {new Date(sub.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <button
                      onClick={() => setConfirmDelete(sub.id)}
                      style={{
                        background: "none", border: "1px solid #FECACA",
                        color: C.red, fontSize: 11, fontWeight: 600,
                        padding: "3px 9px", borderRadius: 6,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Answer text */}
                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.65, margin: "0 0 0 39px" }}>
                  {answer}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      {confirmDelete && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}
          onClick={() => !deleting && setConfirmDelete(null)}
        >
          <div
            style={{ background: C.card, borderRadius: 14, padding: "28px 24px", width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 8 }}>Delete Submission</div>
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 22px", lineHeight: 1.6 }}>
              This will permanently remove this user's entire submission and cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} disabled={deleting} style={{
                flex: 1, padding: "10px", background: "transparent",
                border: "1.5px solid " + C.border, borderRadius: 8,
                fontSize: 13, fontWeight: 600, color: C.muted,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{
                flex: 1, padding: "10px", background: C.red,
                border: "none", borderRadius: 8,
                fontSize: 13, fontWeight: 700, color: "#fff",
                cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.7 : 1, fontFamily: "inherit",
              }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
