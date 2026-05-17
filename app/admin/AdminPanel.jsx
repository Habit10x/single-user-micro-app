"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Design tokens (matches main app) ────────────────────────────────────────
const C = {
  crimson:      "#6B1A1A",
  crimsonDark:  "#521414",
  crimsonPale:  "#FEF2F2",
  crimsonLight: "#F5E8E8",
  crimsonBorder:"#FECACA",
  bg:           "#FAFAF8",
  card:         "#FFFFFF",
  border:       "#E8E2DA",
  borderLight:  "#F0EBE3",
  text:         "#1C1C1C",
  textSoft:     "#3D3530",
  muted:        "#6B6672",
  green:        "#059669",
  greenPale:    "#ECFDF5",
  amber:        "#D97706",
  amberPale:    "#FFFBEB",
  amberDark:    "#92400E",
  red:          "#DC2626",
};

const scoreBg  = s => s >= 8 ? C.greenPale  : s >= 6 ? C.amberPale  : C.crimsonPale;
const scoreClr = s => s >= 8 ? C.green      : s >= 6 ? C.amber      : C.red;

// ─── Shared UI primitives ────────────────────────────────────────────────────

const Label = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
    textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 5 }}>
    {children}
  </div>
);

const inputStyle = {
  width: "100%", padding: "9px 11px", border: "1.5px solid " + C.border,
  borderRadius: 7, fontSize: 13, color: C.text, background: C.card,
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

const Field = ({ label, value, onChange, type = "text", ...rest }) => (
  <div style={{ marginBottom: 14 }}>
    <Label>{label}</Label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      style={inputStyle} {...rest} />
  </div>
);

const TextareaField = ({ label, value, onChange, rows = 3 }) => (
  <div style={{ marginBottom: 14 }}>
    <Label>{label}</Label>
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 14 }}>
    <Label>{label}</Label>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, cursor: "pointer" }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Btn = ({ children, onClick, variant = "primary", disabled, style: extra }) => {
  const base = {
    padding: "8px 16px", borderRadius: 7, fontSize: 13, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", border: "none",
    opacity: disabled ? 0.6 : 1, fontFamily: "inherit", ...extra,
  };
  const variants = {
    primary:  { background: C.crimson,      color: "#fff" },
    ghost:    { background: "transparent",   color: C.text, border: "1.5px solid " + C.border },
    danger:   { background: "#FEE2E2",       color: C.red,  border: "1px solid #FECACA" },
    success:  { background: C.greenPale,     color: C.green,border: "1px solid #A7F3D0" },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>{children}</button>;
};

const ScoreBadge = ({ score }) => (
  <span style={{ background: scoreBg(score), color: scoreClr(score),
    fontWeight: 700, fontSize: 11, padding: "2px 9px", borderRadius: 20 }}>
    {score}/10
  </span>
);

// Dynamic context-points editor
const ContextEditor = ({ value, onChange }) => (
  <div>
    {value.map((item, i) => (
      <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <input value={item} onChange={e => { const n=[...value]; n[i]=e.target.value; onChange(n); }}
          placeholder={`Context point ${i + 1}`}
          style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
        <button onClick={() => onChange(value.filter((_, j) => j !== i))}
          style={{ background: "#FEE2E2", border: "none", borderRadius: 6,
            color: C.red, fontWeight: 700, padding: "0 10px", cursor: "pointer", fontSize: 16 }}>
          ×
        </button>
      </div>
    ))}
    <button onClick={() => onChange([...value, ""])}
      style={{ marginTop: 4, background: "none", border: "1.5px dashed " + C.border,
        color: C.muted, borderRadius: 7, padding: "6px 14px",
        fontSize: 12, cursor: "pointer", width: "100%" }}>
      + Add point
    </button>
  </div>
);

const Divider = () => <hr style={{ border: "none", borderTop: "1px solid " + C.border, margin: "20px 0" }} />;

const Empty = ({ icon, text }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", color: C.muted, gap: 10 }}>
    <div style={{ fontSize: 36 }}>{icon}</div>
    <div style={{ fontSize: 13 }}>{text}</div>
  </div>
);

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => { setUsers(d); setLoading(false); });
  }, []);

  if (loading) return <div style={{ padding: 40, color: C.muted }}>Loading users…</div>;
  if (!users.length) return (
    <div style={{ padding: 60, textAlign: "center", color: C.muted }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
      No submissions yet.
    </div>
  );

  return (
    <div style={{ padding: "20px 24px", maxWidth: 800 }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
        {users.length} total submission{users.length !== 1 ? "s" : ""}
      </div>
      {users.map(u => (
        <div key={u.id} style={{ background: C.card, border: "1px solid " + C.border,
          borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", cursor: "pointer" }}
            onClick={() => setExpanded(expanded === u.id ? null : u.id)}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: C.crimsonLight, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 14, fontWeight: 700, color: C.crimson }}>
              {u.name[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{u.name}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{u.email}</div>
            </div>
            <div style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>
              {new Date(u.submitted_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
            </div>
            <span style={{ color: C.muted, fontSize: 11 }}>{expanded === u.id ? "▲" : "▼"}</span>
          </div>

          {expanded === u.id && (
            <div style={{ padding: "0 16px 16px", borderTop: "1px solid " + C.borderLight }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                textTransform: "uppercase", letterSpacing: 0.9, margin: "12px 0 10px" }}>
                Submitted Answers
              </div>
              {Object.entries(u.answers).length === 0
                ? <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>No answers recorded.</div>
                : Object.entries(u.answers).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.crimson,
                      textTransform: "uppercase", marginBottom: 4 }}>
                      Scenario {k}
                    </div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.65,
                      background: C.bg, borderRadius: 7, padding: "8px 11px",
                      border: "1px solid " + C.borderLight }}>
                      {v || <em style={{ color: C.muted }}>No answer submitted</em>}
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Scenarios Tab ────────────────────────────────────────────────────────────

const EMPTY_SCENARIO = {
  short_title: "", full_title: "", prompt: "", context: [""],
  score: 7, point_first: true, headline: "", what_worked: "", to_improve: "",
};

function ScenariosTab() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(EMPTY_SCENARIO);
  const [mode, setMode]           = useState("idle"); // "idle" | "create" | "edit"
  const [saving, setSaving]       = useState(false);

  const f = k => v => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(() =>
    fetch("/api/admin/scenarios").then(r => r.json()).then(d => { setScenarios(d); setLoading(false); })
  , []);

  useEffect(() => { load(); }, [load]);

  const pick = s => {
    setSelected(s);
    setForm({ ...s, context: s.context?.length ? s.context : [""] });
    setMode("edit");
  };

  const newScenario = () => { setSelected(null); setForm(EMPTY_SCENARIO); setMode("create"); };

  const save = async () => {
    if (!form.short_title.trim() || !form.prompt.trim()) {
      alert("Short title and prompt are required."); return;
    }
    setSaving(true);
    const url  = mode === "create" ? "/api/admin/scenarios" : `/api/admin/scenarios/${selected.id}`;
    const method = mode === "create" ? "POST" : "PUT";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    await load();
    setSaving(false);
    setMode("idle");
    setSelected(null);
  };

  const del = async s => {
    if (!window.confirm(`Delete "${s.short_title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/scenarios/${s.id}`, { method: "DELETE" });
    await load();
    if (selected?.id === s.id) { setSelected(null); setMode("idle"); }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 108px)" }}>
      {/* ── Left: list ── */}
      <div style={{ width: 290, flexShrink: 0, borderRight: "1px solid " + C.border,
        display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid " + C.border, flexShrink: 0 }}>
          <Btn onClick={newScenario} style={{ width: "100%" }}>+ New Scenario</Btn>
        </div>
        {loading
          ? <div style={{ padding: 20, color: C.muted, fontSize: 13 }}>Loading…</div>
          : scenarios.map(s => (
            <div key={s.id} onClick={() => pick(s)}
              style={{ padding: "11px 14px", cursor: "pointer",
                background: selected?.id === s.id ? C.crimsonPale : "transparent",
                borderLeft: `3px solid ${selected?.id === s.id ? C.crimson : "transparent"}`,
                borderBottom: "1px solid " + C.borderLight }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{s.short_title}</span>
                <ScoreBadge score={s.score} />
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.full_title}
              </div>
            </div>
          ))
        }
      </div>

      {/* ── Right: form ── */}
      {mode === "idle"
        ? <Empty icon="📋" text="Select a scenario to edit, or create a new one." />
        : (
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text,
                fontFamily: "Georgia,serif", margin: 0 }}>
                {mode === "create" ? "New Scenario" : `Edit: ${selected?.short_title}`}
              </h2>
              <div style={{ display: "flex", gap: 8 }}>
                {mode === "edit" && <Btn variant="danger" onClick={() => del(selected)}>Delete</Btn>}
                <Btn variant="ghost" onClick={() => { setMode("idle"); setSelected(null); }}>Cancel</Btn>
                <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Short Title (used in tabs)" value={form.short_title} onChange={f("short_title")} />
              <Field label="Full Title" value={form.full_title} onChange={f("full_title")} />
            </div>

            <TextareaField label="Prompt (the question/situation)" value={form.prompt}
              onChange={f("prompt")} rows={3} />

            <div style={{ marginBottom: 14 }}>
              <Label>Context Points</Label>
              <ContextEditor value={form.context?.length ? form.context : [""]}
                onChange={f("context")} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 14 }}>
              <Field label="Score (1–10)" type="number" value={form.score}
                onChange={v => f("score")(Math.min(10, Math.max(1, +v)))} min={1} max={10} />
              <div style={{ marginBottom: 14 }}>
                <Label>Point First?</Label>
                <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                  {[true, false].map(v => (
                    <label key={String(v)}
                      style={{ display: "flex", alignItems: "center", gap: 6,
                        cursor: "pointer", fontSize: 13 }}>
                      <input type="radio" checked={form.point_first === v}
                        onChange={() => f("point_first")(v)} />
                      {v ? "Yes" : "No"}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Divider />
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
              textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 14 }}>
              Feedback Fields
            </div>

            <Field label="Headline (one-line summary)" value={form.headline} onChange={f("headline")} />
            <TextareaField label="What Worked" value={form.what_worked} onChange={f("what_worked")} />
            <TextareaField label="To Improve" value={form.to_improve} onChange={f("to_improve")} />
          </div>
        )
      }
    </div>
  );
}

// ─── Exercises Tab ────────────────────────────────────────────────────────────

const EMPTY_EXERCISE = {
  title: "", description: "", difficulty: "Intermediate",
  category: "Articulation", timer_minutes: 5,
};

function ExercisesTab() {
  const [exercises, setExercises]       = useState([]);
  const [allScenarios, setAllScenarios] = useState([]);
  const [selected, setSelected]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [mode, setMode]                 = useState("idle"); // "idle" | "create" | "editInfo"
  const [form, setForm]                 = useState(EMPTY_EXERCISE);
  const [saving, setSaving]             = useState(false);
  const [showPicker, setShowPicker]     = useState(false);

  const ef = k => v => setForm(p => ({ ...p, [k]: v }));

  const loadList = useCallback(async () => {
    const [exs, scns] = await Promise.all([
      fetch("/api/admin/exercises").then(r => r.json()),
      fetch("/api/admin/scenarios").then(r => r.json()),
    ]);
    setExercises(exs);
    setAllScenarios(scns);
    setLoading(false);
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const pick = async ex => {
    const data = await fetch(`/api/admin/exercises/${ex.id}`).then(r => r.json());
    setSelected(data);
    setMode("idle");
    setShowPicker(false);
  };

  const createExercise = async () => {
    if (!form.title.trim()) { alert("Title is required."); return; }
    setSaving(true);
    const ex = await fetch("/api/admin/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, timer_minutes: +form.timer_minutes }),
    }).then(r => r.json());
    await loadList();
    setSaving(false);
    setMode("idle");
    await pick(ex);
  };

  const saveEdit = async () => {
    if (!form.title.trim()) { alert("Title is required."); return; }
    setSaving(true);
    await fetch(`/api/admin/exercises/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, timer_minutes: +form.timer_minutes }),
    });
    await loadList();
    await pick({ id: selected.id });
    setSaving(false);
    setMode("idle");
  };

  const del = async () => {
    if (!window.confirm(`Delete "${selected.title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/exercises/${selected.id}`, { method: "DELETE" });
    await loadList();
    setSelected(null);
  };

  const addScenario = async scenarioId => {
    await fetch(`/api/admin/exercises/${selected.id}/scenarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
    setShowPicker(false);
    await pick({ id: selected.id });
  };

  const removeScenario = async scenarioId => {
    await fetch(`/api/admin/exercises/${selected.id}/scenarios`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
    await pick({ id: selected.id });
  };

  const linkedIds    = new Set(selected?.scenarios?.map(s => s.id) || []);
  const canAdd       = allScenarios.filter(s => !linkedIds.has(s.id));

  return (
    <div style={{ display: "flex", height: "calc(100vh - 108px)" }}>
      {/* ── Left: exercise list ── */}
      <div style={{ width: 290, flexShrink: 0, borderRight: "1px solid " + C.border,
        display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid " + C.border, flexShrink: 0 }}>
          <Btn onClick={() => { setMode("create"); setForm(EMPTY_EXERCISE); setSelected(null); }}
            style={{ width: "100%" }}>
            + New Exercise
          </Btn>
        </div>
        {loading
          ? <div style={{ padding: 20, color: C.muted, fontSize: 13 }}>Loading…</div>
          : exercises.map(ex => (
            <div key={ex.id} onClick={() => pick(ex)}
              style={{ padding: "12px 14px", cursor: "pointer",
                background: selected?.id === ex.id ? C.crimsonPale : "transparent",
                borderLeft: `3px solid ${selected?.id === ex.id ? C.crimson : "transparent"}`,
                borderBottom: "1px solid " + C.borderLight }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{ex.title}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                {ex.difficulty} · {ex.category} · {ex.scenario_count} scenario{ex.scenario_count !== 1 ? "s" : ""}
              </div>
            </div>
          ))
        }
      </div>

      {/* ── Right: detail / create form ── */}
      {mode === "create" ? (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "Georgia,serif",
              color: C.text, margin: 0 }}>New Exercise</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" onClick={() => setMode("idle")}>Cancel</Btn>
              <Btn onClick={createExercise} disabled={saving}>{saving ? "Creating…" : "Create"}</Btn>
            </div>
          </div>
          <Field label="Title" value={form.title} onChange={ef("title")} placeholder="e.g. Articulation-02" />
          <TextareaField label="Description" value={form.description} onChange={ef("description")} rows={2} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 14 }}>
            <SelectField label="Difficulty" value={form.difficulty} onChange={ef("difficulty")}
              options={["Beginner","Intermediate","Advanced"]} />
            <Field label="Category" value={form.category} onChange={ef("category")} />
            <Field label="Timer (min)" type="number" value={form.timer_minutes} onChange={ef("timer_minutes")} min={1} />
          </div>
        </div>
      ) : !selected ? (
        <Empty icon="📁" text="Select an exercise or create a new one." />
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* Exercise info header */}
          {mode === "editInfo" ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "Georgia,serif",
                  color: C.text, margin: 0 }}>Edit Exercise</h2>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" onClick={() => setMode("idle")}>Cancel</Btn>
                  <Btn onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
                </div>
              </div>
              <Field label="Title" value={form.title} onChange={ef("title")} />
              <TextareaField label="Description" value={form.description} onChange={ef("description")} rows={2} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 14 }}>
                <SelectField label="Difficulty" value={form.difficulty} onChange={ef("difficulty")}
                  options={["Beginner","Intermediate","Advanced"]} />
                <Field label="Category" value={form.category} onChange={ef("category")} />
                <Field label="Timer (min)" type="number" value={form.timer_minutes}
                  onChange={ef("timer_minutes")} min={1} />
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "Georgia,serif",
                    color: C.text, margin: "0 0 6px" }}>
                    {selected.title}
                  </h2>
                  {selected.description && (
                    <p style={{ fontSize: 13, color: C.muted, margin: "0 0 10px" }}>
                      {selected.description}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[selected.difficulty, selected.category, `${selected.timer_minutes} min`].map(t => (
                      <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px",
                        borderRadius: 99, background: "#F0EBE3", color: "#4A3F38" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <Btn variant="ghost" onClick={() => {
                    setForm({
                      title: selected.title, description: selected.description,
                      difficulty: selected.difficulty, category: selected.category,
                      timer_minutes: selected.timer_minutes,
                    });
                    setMode("editInfo");
                  }}>Edit</Btn>
                  <Btn variant="danger" onClick={del}>Delete</Btn>
                </div>
              </div>
            </>
          )}

          <Divider />

          {/* Linked scenarios */}
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
              Scenarios ({selected.scenarios?.length || 0})
            </div>
            {!showPicker && (
              <Btn variant="ghost" onClick={() => setShowPicker(true)}
                style={{ fontSize: 12, padding: "5px 12px" }}>
                + Add Scenario
              </Btn>
            )}
          </div>

          {selected.scenarios?.length === 0 && (
            <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic",
              padding: "12px 0", marginBottom: 12 }}>
              No scenarios linked yet.
            </div>
          )}

          {selected.scenarios?.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", background: C.card,
              border: "1px solid " + C.border, borderRadius: 8, marginBottom: 7 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: C.crimsonLight, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.crimson }}>
                {i + 1}
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: C.text }}>
                {s.short_title}
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 400, marginLeft: 6 }}>
                  {s.full_title}
                </span>
              </span>
              <ScoreBadge score={s.score} />
              <button onClick={() => removeScenario(s.id)}
                style={{ background: "none", border: "none", color: C.muted,
                  cursor: "pointer", fontSize: 13, padding: "2px 6px" }}
                title="Remove from exercise">
                ✕
              </button>
            </div>
          ))}

          {/* Scenario picker */}
          {showPicker && (
            <div style={{ border: "1.5px solid " + C.crimsonBorder, borderRadius: 10,
              background: C.crimsonPale, padding: "14px 16px", marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.crimson }}>
                  Add scenario to this exercise
                </div>
                <Btn variant="ghost" onClick={() => setShowPicker(false)}
                  style={{ fontSize: 11, padding: "3px 10px" }}>
                  Cancel
                </Btn>
              </div>
              {canAdd.length === 0
                ? <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>
                    All scenarios are already linked.
                  </div>
                : canAdd.map(s => (
                  <div key={s.id} onClick={() => addScenario(s.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px", background: C.card,
                      border: "1px solid " + C.border, borderRadius: 7,
                      marginBottom: 6, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.crimson}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: C.text }}>
                      {s.short_title}
                      <span style={{ fontSize: 11, color: C.muted, fontWeight: 400, marginLeft: 6 }}>
                        {s.full_title}
                      </span>
                    </span>
                    <ScoreBadge score={s.score} />
                    <span style={{ fontSize: 11, color: C.crimson, fontWeight: 600 }}>+ Add</span>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [tab, setTab] = useState("users");
  const router        = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const tabs = [
    { key: "users",     label: "Users",     icon: "👥" },
    { key: "exercises", label: "Exercises", icon: "📁" },
    { key: "scenarios", label: "Scenarios", icon: "📋" },
  ];

  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      background: C.bg, minHeight: "100vh" }}>

      {/* Header */}
      <header style={{ background: C.card, borderBottom: "1px solid " + C.border,
        padding: "0 24px", height: 52, display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 17, color: C.crimson,
            letterSpacing: 0.5, fontFamily: "Georgia,serif" }}>SHARP</span>
          <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>Admin Panel</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>
            ← Back to App
          </a>
          <button onClick={logout}
            style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px",
              borderRadius: 7, border: "1.5px solid " + C.border,
              background: "transparent", color: C.muted,
              cursor: "pointer", fontFamily: "inherit" }}>
            Log out
          </button>
        </div>
      </header>

      {/* Tab nav */}
      <div style={{ background: C.card, borderBottom: "1px solid " + C.border,
        padding: "0 24px", display: "flex", gap: 4 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "12px 18px", border: "none", background: "none",
              borderBottom: `2px solid ${tab === t.key ? C.crimson : "transparent"}`,
              color: tab === t.key ? C.crimson : C.muted,
              fontWeight: tab === t.key ? 700 : 500,
              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6 }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ background: C.bg }}>
        {tab === "users"     && <UsersTab />}
        {tab === "exercises" && <ExercisesTab />}
        {tab === "scenarios" && <ScenariosTab />}
      </main>
    </div>
  );
}
