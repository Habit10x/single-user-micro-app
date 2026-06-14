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

const TIMER_PRESETS = [1, 2, 3, 5, 10, 15, 20, 30];

// ─── Dimension definitions (used by WeightsEditor) ───────────────────────────

const DIMENSIONS = [
  { key: "directness",           label: "Directness",            desc: "Key point arrives first without softening" },
  { key: "specificity",          label: "Specificity",           desc: "Uses concrete, available details" },
  { key: "hierarchy",            label: "Hierarchy",             desc: "Most important item positioned first" },
  { key: "listenerOrientation",  label: "Listener Orientation",  desc: "Shaped for this specific listener" },
  { key: "emotionalCalibration", label: "Emotional Calibration", desc: "Tone fits the relationship & stakes" },
  { key: "economy",              label: "Economy",               desc: "No padding or repetition" },
  { key: "completeness",         label: "Completeness",          desc: "All needed elements present" },
];

function WeightsEditor({ value, onChange }) {
  const active = Object.keys(value).length;
  const total  = Object.values(value).reduce((a, b) => a + (Number(b) || 0), 0);

  const toggle = key => {
    if (key in value) {
      const next = { ...value };
      delete next[key];
      onChange(next);
    } else {
      onChange({ ...value, [key]: 0 });
    }
  };

  const setWeight = (key, v) => {
    onChange({ ...value, [key]: Math.min(100, Math.max(0, Number(v) || 0)) });
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
        {active === 0
          ? "No dimensions selected — algorithm will use its built-in per-scenario weights."
          : "Active dimensions must sum to exactly 100%."}
      </div>
      {DIMENSIONS.map(dim => {
        const enabled = dim.key in value;
        return (
          <div key={dim.key} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 8, marginBottom: 6,
            background: enabled ? C.crimsonPale : C.bg,
            border: "1px solid " + (enabled ? C.crimsonBorder : C.borderLight),
            transition: "background 0.15s",
          }}>
            <input type="checkbox" checked={enabled} onChange={() => toggle(dim.key)}
              style={{ width: 15, height: 15, cursor: "pointer", accentColor: C.crimson, flexShrink: 0 }} />
            <div style={{ flex: 1, opacity: enabled ? 1 : 0.45 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{dim.label}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{dim.desc}</div>
            </div>
            {enabled && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <input type="number" value={value[dim.key]} min={0} max={100}
                  onChange={e => setWeight(dim.key, e.target.value)}
                  style={{ ...inputStyle, width: 62, marginBottom: 0,
                    textAlign: "right", padding: "5px 8px" }} />
                <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>%</span>
              </div>
            )}
          </div>
        );
      })}
      {active > 0 && (
        <div style={{
          display: "flex", justifyContent: "flex-end", alignItems: "center",
          gap: 8, marginTop: 4, padding: "8px 12px", borderRadius: 8,
          background: total === 100 ? C.greenPale : "#FEE2E2",
          border: "1px solid " + (total === 100 ? "#A7F3D0" : "#FECACA"),
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: total === 100 ? C.green : C.red }}>
            Total: {total}%
            {total === 100 ? " ✓" : total < 100 ? ` — add ${100 - total}% more` : ` — remove ${total - 100}%`}
          </span>
        </div>
      )}
    </div>
  );
}

const TimerField = ({ value, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    <Label>Timer</Label>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, color: C.text }}>
        <input type="checkbox" checked={value > 0}
          onChange={e => onChange(e.target.checked ? 5 : 0)}
          style={{ width: 15, height: 15, cursor: "pointer" }} />
        Enable timer
      </label>
      {value > 0 && (
        <select value={value} onChange={e => onChange(+e.target.value)}
          style={{ ...inputStyle, width: "auto", marginBottom: 0, padding: "7px 10px" }}>
          {TIMER_PRESETS.map(m => (
            <option key={m} value={m}>{m} minute{m !== 1 ? "s" : ""}</option>
          ))}
        </select>
      )}
    </div>
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
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{u.name}</span>
                {u.instance_name && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px",
                    borderRadius: 6, background: C.crimsonPale,
                    color: C.crimson, flexShrink: 0 }}>
                    🔒 {u.instance_name}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>{u.email || "Instance user"}</div>
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
  context_type: "points", task_text: "",
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
    setForm({
      ...s,
      context: s.context?.length ? s.context : [""],
      context_type: s.context_type || "points",
      task_text: s.task_text || "",
    });
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

            <TextareaField label="Task Text (optional — shown under 'TASK' heading below context)"
              value={form.task_text} onChange={f("task_text")}
              rows={3} placeholder="Leave empty to hide the Task section…" />

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

// ─── Algorithms Tab ───────────────────────────────────────────────────────────

function AlgorithmsTab() {
  const [algorithms, setAlgorithms] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [mode,       setMode]       = useState("idle"); // "idle" | "view" | "create"
  const [sharpPrompt, setSharpPrompt] = useState("");

  const [name,       setName]       = useState("");
  const [basePrompt, setBasePrompt] = useState("");
  const [weights,    setWeights]    = useState({});
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  const load = useCallback(async () => {
    const data = await fetch("/api/admin/algorithms").then(r => r.json());
    setAlgorithms(data);
    setLoading(false);
    const sharp = data.find(a => a.name === "SHARP");
    if (sharp) setSharpPrompt(sharp.base_prompt);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pick = async algo => {
    const data = await fetch(`/api/admin/algorithms/${algo.id}`).then(r => r.json());
    setSelected(data);
    setMode("view");
  };

  const startCreate = () => {
    setSelected(null);
    setName("");
    setBasePrompt("");
    setWeights({});
    setError("");
    setMode("create");
  };

  const save = async () => {
    setError("");
    if (!name.trim())       { setError("Algorithm name is required."); return; }
    if (!basePrompt.trim()) { setError("Base prompt is required."); return; }
    const activeCount = Object.keys(weights).length;
    if (activeCount > 0) {
      const total = Object.values(weights).reduce((a, b) => a + Number(b), 0);
      if (total !== 100) { setError(`Dimension weights must sum to 100% (currently ${total}%).`); return; }
    }
    setSaving(true);
    const res  = await fetch("/api/admin/algorithms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), base_prompt: basePrompt.trim(), dimension_weights: weights }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to create."); setSaving(false); return; }
    await load();
    setSaving(false);
    await pick(data);
  };

  const isBuiltIn = algo => algo?.name === "SHARP";

  return (
    <div style={{ display: "flex", height: "calc(100vh - 108px)" }}>
      {/* ── Left: list ── */}
      <div style={{ width: 290, flexShrink: 0, borderRight: "1px solid " + C.border,
        display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid " + C.border, flexShrink: 0 }}>
          <Btn onClick={startCreate} style={{ width: "100%" }}>+ New Algorithm</Btn>
        </div>
        {loading
          ? <div style={{ padding: 20, color: C.muted, fontSize: 13 }}>Loading…</div>
          : algorithms.map(algo => (
            <div key={algo.id} onClick={() => pick(algo)}
              style={{ padding: "12px 14px", cursor: "pointer",
                background: selected?.id === algo.id ? C.crimsonPale : "transparent",
                borderLeft: `3px solid ${selected?.id === algo.id ? C.crimson : "transparent"}`,
                borderBottom: "1px solid " + C.borderLight }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: C.text, flex: 1 }}>
                  {algo.name}
                </span>
                {isBuiltIn(algo) && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px",
                    borderRadius: 99, background: C.crimsonLight, color: C.crimson }}>
                    Built-in
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                {algo.exercise_count} exercise{algo.exercise_count !== 1 ? "s" : ""} · {
                  new Date(algo.created_at).toLocaleDateString("en-IN",
                    { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
          ))
        }
      </div>

      {/* ── Right: view / create ── */}
      {mode === "idle" ? (
        <Empty icon="🧠" text="Select an algorithm to view, or create a new one." />
      ) : mode === "create" ? (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "Georgia,serif",
              color: C.text, margin: 0 }}>New Algorithm</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" onClick={() => setMode("idle")}>Cancel</Btn>
              <Btn onClick={save} disabled={saving}>{saving ? "Creating…" : "Create"}</Btn>
            </div>
          </div>

          {error && (
            <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8,
              padding: "10px 14px", fontSize: 13, color: C.red, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <Field label="Algorithm Name" value={name} onChange={setName}
            placeholder="e.g. SHARP v2, Casual Mode, Strict Eval" />

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 5 }}>
              <Label>Base Prompt (System Prompt)</Label>
              {sharpPrompt && (
                <button onClick={() => setBasePrompt(sharpPrompt)}
                  style={{ fontSize: 11, color: C.crimson, fontWeight: 600,
                    background: "none", border: "none", cursor: "pointer",
                    padding: "2px 0", fontFamily: "inherit" }}>
                  Copy from SHARP ↓
                </button>
              )}
            </div>
            <textarea value={basePrompt} onChange={e => setBasePrompt(e.target.value)} rows={18}
              placeholder="Paste your system prompt here. Click 'Copy from SHARP' to start from the built-in prompt."
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6,
                fontFamily: "monospace", fontSize: 12 }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <Label>Dimension Weights</Label>
            <WeightsEditor value={weights} onChange={setWeights} />
          </div>
        </div>
      ) : selected && (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "Georgia,serif",
                  color: C.text, margin: 0 }}>{selected.name}</h2>
                {isBuiltIn(selected) && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px",
                    borderRadius: 99, background: C.crimsonLight, color: C.crimson }}>
                    Built-in
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>
                Created {new Date(selected.created_at).toLocaleDateString("en-IN",
                  { day: "numeric", month: "short", year: "numeric" })}
                {" · "}
                {selected.exercise_count > 0
                  ? `Used by ${selected.exercise_count} exercise${selected.exercise_count !== 1 ? "s" : ""}`
                  : "Not used by any exercise"}
              </div>
            </div>
          </div>

          {/* Weights */}
          <div style={{ marginBottom: 20 }}>
            <Label>Dimension Weights</Label>
            {!selected.dimension_weights || Object.keys(selected.dimension_weights).length === 0 ? (
              <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic", padding: "8px 0" }}>
                Uses built-in per-scenario weights (SHARP default).
              </div>
            ) : (
              <div>
                {DIMENSIONS.filter(d => d.key in selected.dimension_weights).map(d => (
                  <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", borderRadius: 7, marginBottom: 5,
                    background: C.crimsonPale, border: "1px solid " + C.crimsonBorder }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{d.label}</span>
                      <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{d.desc}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.crimson }}>
                      {selected.dimension_weights[d.key]}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Divider />

          {/* Base Prompt */}
          <div style={{ marginBottom: 14 }}>
            <Label>Base Prompt</Label>
            <pre style={{ background: C.bg, border: "1px solid " + C.borderLight,
              borderRadius: 8, padding: "14px 16px", fontSize: 12, lineHeight: 1.65,
              color: C.text, fontFamily: "monospace", whiteSpace: "pre-wrap",
              wordBreak: "break-word", maxHeight: 460, overflowY: "auto", margin: 0 }}>
              {selected.base_prompt || "(no prompt stored)"}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Exercises Tab ────────────────────────────────────────────────────────────

const EMPTY_EXERCISE = {
  title: "", description: "", category: "", task_description: "", timer_minutes: 5, tags: "", show_default_tags: true,
};

function ExercisesTab() {
  const [exercises, setExercises]       = useState([]);
  const [allScenarios, setAllScenarios] = useState([]);
  const [allAlgorithms, setAllAlgorithms] = useState([]);
  const [selected, setSelected]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [mode, setMode]                 = useState("idle"); // "idle" | "create" | "editInfo"
  const [form, setForm]                 = useState(EMPTY_EXERCISE);
  const [saving, setSaving]             = useState(false);
  const [showPicker, setShowPicker]     = useState(false);
  const [defaultExId, setDefaultExId]   = useState(null);
  const [copiedId, setCopiedId]         = useState(null);
  const [settingDefault, setSettingDefault] = useState(false);
  const [sessions,      setSessions]    = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [editingSession, setEditingSession]   = useState(null);
  const [changingAlgo, setChangingAlgo] = useState(false);

  const ef = k => v => setForm(p => ({ ...p, [k]: v }));

  const loadList = useCallback(async () => {
    const [exs, scns, settings, algos] = await Promise.all([
      fetch("/api/admin/exercises").then(r => r.json()),
      fetch("/api/admin/scenarios").then(r => r.json()),
      fetch("/api/admin/settings").then(r => r.json()),
      fetch("/api/admin/algorithms").then(r => r.json()),
    ]);
    setExercises(exs);
    setAllScenarios(scns);
    setAllAlgorithms(algos);
    setDefaultExId(settings.default_exercise_id || null);
    setLoading(false);
  }, []);

  const copyLink = (slug) => {
    const url = `${window.location.origin}/e/${slug}`;
    navigator.clipboard.writeText(url).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
    setCopiedId(slug);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const setAsDefault = async (id) => {
    setSettingDefault(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "default_exercise_id", value: String(id) }),
    });
    setDefaultExId(String(id));
    setSettingDefault(false);
  };

  useEffect(() => { loadList(); }, [loadList]);

  const fetchSessions = async exId => {
    setSessionsLoading(true);
    const data = await fetch(`/api/admin/sessions?exercise_id=${exId}`).then(r => r.json());
    setSessions(data.sessions || []);
    setSessionsLoading(false);
  };

  const pick = async ex => {
    const data = await fetch(`/api/admin/exercises/${ex.id}`).then(r => r.json());
    setSelected(data);
    setMode("idle");
    setShowPicker(false);
    setEditingSession(null);
    fetchSessions(ex.id);
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
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: C.text, flex: 1 }}>{ex.title}</span>
                {String(defaultExId) === String(ex.id) && (
                  <span style={{ fontSize: 10, color: C.crimson, fontWeight: 700 }}>★</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                {ex.tags ? ex.tags + " · " : ""}{ex.scenario_count} scenario{ex.scenario_count !== 1 ? "s" : ""}
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
          <Field label="Category" value={form.category} onChange={ef("category")} placeholder="e.g. Articulation" />
          <TextareaField label="Description" value={form.description} onChange={ef("description")} rows={2} />
          <TextareaField label="Task Description (shown under 'The Task' on instruction page)" value={form.task_description} onChange={ef("task_description")} rows={3} placeholder="e.g. You'll be shown a situation…" />
          <Field label="Tags (comma-separated)" value={form.tags} onChange={ef("tags")}
            placeholder="e.g. Solo, Intermediate, Written" />
          <TimerField value={form.timer_minutes} onChange={ef("timer_minutes")} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <input type="checkbox" id="sdt-create" checked={form.show_default_tags}
              onChange={e => setForm(f => ({ ...f, show_default_tags: e.target.checked }))}
              style={{ width: 16, height: 16, cursor: "pointer" }} />
            <label htmlFor="sdt-create" style={{ fontSize: 13, color: C.text, cursor: "pointer" }}>
              Show default tags (scenario count, timer, Solo)
            </label>
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
              <Field label="Category" value={form.category} onChange={ef("category")} placeholder="e.g. Articulation" />
              <TextareaField label="Description" value={form.description} onChange={ef("description")} rows={2} />
              <TextareaField label="Task Description (shown under 'The Task' on instruction page)" value={form.task_description} onChange={ef("task_description")} rows={3} placeholder="e.g. You'll be shown a situation…" />
              <Field label="Tags (comma-separated)" value={form.tags} onChange={ef("tags")}
                placeholder="e.g. Solo, Intermediate, Written" />
              <TimerField value={form.timer_minutes} onChange={ef("timer_minutes")} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <input type="checkbox" id="sdt-edit" checked={form.show_default_tags}
                  onChange={e => setForm(f => ({ ...f, show_default_tags: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: "pointer" }} />
                <label htmlFor="sdt-edit" style={{ fontSize: 13, color: C.text, cursor: "pointer" }}>
                  Show default tags (scenario count, timer, Solo)
                </label>
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
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {[
                      ...(selected.tags ? selected.tags.split(",").map(t => t.trim()).filter(Boolean) : []),
                      `${selected.timer_minutes} min`,
                    ].map(t => (
                      <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px",
                        borderRadius: 99, background: "#F0EBE3", color: "#4A3F38" }}>
                        {t}
                      </span>
                    ))}
                    {String(defaultExId) === String(selected.id) && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px",
                        borderRadius: 99, background: C.crimsonPale,
                        border: "1px solid " + C.crimsonBorder, color: C.crimson }}>
                        ★ Default
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <Btn variant="ghost" onClick={() => {
                    setForm({
                      title: selected.title, description: selected.description,
                      category: selected.category || "",
                      task_description: selected.task_description || "",
                      timer_minutes: selected.timer_minutes, tags: selected.tags || "",
                      show_default_tags: selected.show_default_tags !== false,
                    });
                    setMode("editInfo");
                  }}>Edit</Btn>
                  <Btn variant="danger" onClick={del}>Delete</Btn>
                </div>
              </div>

              {/* ── Shareable link row ── */}
              <div style={{ background: C.bg, border: "1px solid " + C.borderLight,
                borderRadius: 9, padding: "10px 14px", marginTop: 14,
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ flex: 1, fontSize: 12, color: C.textSoft,
                  fontFamily: "monospace", overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                  {typeof window !== "undefined" ? `${window.location.origin}/e/${selected.slug}` : `/e/${selected.slug}`}
                </span>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => copyLink(selected.slug)}
                    style={{ padding: "5px 13px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit", border: "1.5px solid",
                      borderColor: copiedId === selected.slug ? C.green : C.crimsonBorder,
                      background: copiedId === selected.slug ? C.greenPale : C.crimsonPale,
                      color: copiedId === selected.slug ? C.green : C.crimson }}>
                    {copiedId === selected.slug ? "✓ Copied!" : "Copy Link"}
                  </button>
                  {String(defaultExId) !== String(selected.id) && (
                    <button onClick={() => setAsDefault(selected.id)} disabled={settingDefault}
                      style={{ padding: "5px 13px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                        cursor: settingDefault ? "not-allowed" : "pointer",
                        fontFamily: "inherit", border: "1.5px solid " + C.border,
                        background: "transparent", color: C.textSoft,
                        opacity: settingDefault ? 0.6 : 1 }}>
                      {settingDefault ? "Setting…" : "★ Set as Default"}
                    </button>
                  )}
                  {String(defaultExId) === String(selected.id) && (
                    <span style={{ fontSize: 12, color: C.green, fontWeight: 600,
                      display: "flex", alignItems: "center" }}>
                      ✓ Opens at root URL
                    </span>
                  )}
                </div>
              </div>

              {/* ── Algorithm selector ── */}
              <div style={{ background: C.bg, border: "1px solid " + C.borderLight,
                borderRadius: 9, padding: "10px 14px", marginTop: 10,
                display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.muted,
                  textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0 }}>
                  Algorithm
                </span>
                <select
                  value={selected.algorithm_id ?? ""}
                  disabled={changingAlgo}
                  onChange={async e => {
                    const newId = e.target.value === "" ? null : parseInt(e.target.value);
                    setChangingAlgo(true);
                    await fetch(`/api/admin/exercises/${selected.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ algorithm_id: newId }),
                    });
                    await pick({ id: selected.id });
                    setChangingAlgo(false);
                  }}
                  style={{ ...inputStyle, marginBottom: 0, flex: 1,
                    padding: "6px 10px", cursor: changingAlgo ? "wait" : "pointer",
                    opacity: changingAlgo ? 0.6 : 1 }}>
                  <option value="">— No algorithm (SHARP default) —</option>
                  {allAlgorithms.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                {changingAlgo && (
                  <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>Saving…</span>
                )}
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

          <Divider />

          {/* ── Sessions ── */}
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
              Sessions ({sessions.length})
            </div>
            <button onClick={() => fetchSessions(selected.id)}
              style={{ fontSize: 11, color: C.muted, background: "none", border: "none",
                cursor: "pointer", padding: "3px 6px" }}>
              ↻ Refresh
            </button>
          </div>

          {sessionsLoading ? (
            <div style={{ fontSize: 13, color: C.muted, padding: "12px 0" }}>Loading sessions…</div>
          ) : sessions.length === 0 ? (
            <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic", padding: "12px 0" }}>
              No sessions yet. Sessions are created automatically when the first submission arrives.
            </div>
          ) : (
            sessions.map(sess => {
              const isEditing = editingSession?.id === sess.id;
              return (
                <div key={sess.id} style={{ background: C.card, border: "1px solid " + C.border,
                  borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>

                  {/* Row header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 14px", borderBottom: isEditing ? "1px solid " + C.borderLight : "none" }}>

                    {/* Session number badge */}
                    <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: C.crimsonLight, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.crimson }}>
                      #{sess.session_number}
                    </div>

                    {/* Label + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: C.text,
                        display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        {sess.label || `Session ${sess.session_number}`}
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                          background: sess.status === "active" ? C.greenPale : "#F3F4F6",
                          color: sess.status === "active" ? C.green : C.muted,
                          border: `1px solid ${sess.status === "active" ? "#A7F3D0" : C.border}`,
                        }}>
                          {sess.status === "active" ? "● Active" : "Closed"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 3,
                        display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <span>Started {new Date(sess.started_at).toLocaleDateString("en-IN",
                          { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span>{sess.participant_count} participant{sess.participant_count !== 1 ? "s" : ""}</span>
                        {sess.avg_score != null && <span>Avg score: {sess.avg_score}/10</span>}
                        <span>Gap: {sess.gap_hours}h</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {!isEditing && (
                        <button onClick={() => setEditingSession({ id: sess.id, label: sess.label || "", gap_hours: String(sess.gap_hours) })}
                          style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px",
                            borderRadius: 6, border: "1.5px solid " + C.border,
                            background: "transparent", color: C.textSoft,
                            cursor: "pointer", fontFamily: "inherit" }}>
                          Edit
                        </button>
                      )}
                      {sess.status === "active" && !isEditing && (
                        <button onClick={async () => {
                          if (!window.confirm("Force-close this session? No more submissions will be grouped into it.")) return;
                          await fetch(`/api/admin/sessions/${sess.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ force_closed: true }),
                          });
                          fetchSessions(selected.id);
                        }}
                          style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px",
                            borderRadius: 6, border: "1px solid #FECACA",
                            background: "#FEE2E2", color: C.red,
                            cursor: "pointer", fontFamily: "inherit" }}>
                          Force Close
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && (
                    <div style={{ padding: "12px 14px", background: C.bg }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: 10, marginBottom: 10 }}>
                        <div>
                          <Label>Label</Label>
                          <input value={editingSession.label}
                            onChange={e => setEditingSession(p => ({ ...p, label: e.target.value }))}
                            placeholder={`Session ${sess.session_number}`}
                            style={{ ...inputStyle }} />
                        </div>
                        <div>
                          <Label>Gap Hours</Label>
                          <input type="number" min="0.5" step="0.5"
                            value={editingSession.gap_hours}
                            onChange={e => setEditingSession(p => ({ ...p, gap_hours: e.target.value }))}
                            style={{ ...inputStyle }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn onClick={async () => {
                          const body = {};
                          if (editingSession.label.trim() !== (sess.label || ""))
                            body.label = editingSession.label.trim();
                          const newGap = parseFloat(editingSession.gap_hours);
                          if (!isNaN(newGap) && newGap > 0 && newGap !== parseFloat(sess.gap_hours))
                            body.gap_hours = newGap;
                          if (Object.keys(body).length) {
                            await fetch(`/api/admin/sessions/${sess.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(body),
                            });
                          }
                          setEditingSession(null);
                          fetchSessions(selected.id);
                        }}>Save</Btn>
                        <Btn variant="ghost" onClick={() => setEditingSession(null)}>Cancel</Btn>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Instances Tab ────────────────────────────────────────────────────────────

function InstancesTab() {
  const [instances, setInstances] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [creating,  setCreating]  = useState(false);
  const [newName,   setNewName]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [copied,    setCopied]    = useState(false);

  const load = useCallback(() =>
    fetch("/api/admin/instances").then(r => r.json()).then(d => { setInstances(d); setLoading(false); })
  , []);

  useEffect(() => { load(); }, [load]);

  const pick = async inst => {
    const data = await fetch(`/api/admin/instances/${inst.id}`).then(r => r.json());
    setSelected(data);
    setCreating(false);
  };

  const create = async () => {
    if (!newName.trim()) { alert("Instance name is required."); return; }
    setSaving(true);
    const inst = await fetch("/api/admin/instances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    }).then(r => r.json());
    await load();
    setSaving(false);
    setCreating(false);
    setNewName("");
    await pick(inst);
  };

  const del = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete instance "${selected.name}"? Users in this instance will lose their instance tag, but their submissions remain.`)) return;
    await fetch(`/api/admin/instances/${selected.id}`, { method: "DELETE" });
    await load();
    setSelected(null);
  };

  const copyPin = () => {
    navigator.clipboard.writeText(selected.pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 108px)" }}>
      {/* ── Left: list ── */}
      <div style={{ width: 290, flexShrink: 0, borderRight: "1px solid " + C.border,
        display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid " + C.border, flexShrink: 0 }}>
          <Btn onClick={() => { setCreating(true); setSelected(null); setNewName(""); }}
            style={{ width: "100%" }}>
            + New Instance
          </Btn>
        </div>
        {loading
          ? <div style={{ padding: 20, color: C.muted, fontSize: 13 }}>Loading…</div>
          : instances.length === 0
            ? <div style={{ padding: 20, color: C.muted, fontSize: 13 }}>No instances yet.</div>
            : instances.map(inst => (
              <div key={inst.id} onClick={() => pick(inst)}
                style={{ padding: "12px 14px", cursor: "pointer",
                  background: selected?.id === inst.id ? C.crimsonPale : "transparent",
                  borderLeft: `3px solid ${selected?.id === inst.id ? C.crimson : "transparent"}`,
                  borderBottom: "1px solid " + C.borderLight }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{inst.name}</span>
                  <span style={{ fontSize: 11, color: C.muted, flexShrink: 0 }}>
                    {inst.user_count} user{inst.user_count !== 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>PIN: ••••</div>
              </div>
            ))
        }
      </div>

      {/* ── Right: detail / create ── */}
      {creating ? (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "Georgia,serif",
              color: C.text, margin: 0 }}>New Instance</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost" onClick={() => setCreating(false)}>Cancel</Btn>
              <Btn onClick={create} disabled={saving}>{saving ? "Creating…" : "Create"}</Btn>
            </div>
          </div>
          <Field label="Instance Name" value={newName} onChange={setNewName}
            placeholder="e.g. Team Alpha, Cohort 3…" />
          <div style={{ background: C.amberPale, border: "1px solid #FDE68A",
            borderRadius: 8, padding: "12px 14px", fontSize: 13,
            color: C.amberDark, lineHeight: 1.55 }}>
            A 4-digit PIN will be auto-generated after creation. Share it with the users who should join this instance.
          </div>
        </div>
      ) : !selected ? (
        <Empty icon="🔒" text="Select an instance or create a new one." />
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "Georgia,serif",
                color: C.text, margin: "0 0 4px" }}>
                {selected.name}
              </h2>
              <div style={{ fontSize: 12, color: C.muted }}>
                Created {new Date(selected.created_at).toLocaleDateString("en-IN",
                  { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
            <Btn variant="danger" onClick={del}>Delete</Btn>
          </div>

          {/* PIN card */}
          <div style={{ background: C.card, border: "1.5px solid " + C.crimsonBorder,
            borderRadius: 12, padding: "16px 18px", marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.crimson,
              textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 10 }}>
              Instance PIN — share with participants
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: C.crimson,
                fontFamily: "Georgia,serif", letterSpacing: 10 }}>
                {selected.pin}
              </div>
              <button onClick={copyPin}
                style={{ padding: "7px 14px", borderRadius: 7,
                  border: "1.5px solid " + C.crimsonBorder,
                  background: copied ? C.greenPale : C.crimsonPale,
                  color: copied ? C.green : C.crimson,
                  fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit" }}>
                {copied ? "Copied!" : "Copy PIN"}
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
              Users enter this PIN on the login page to join this instance.
            </div>
          </div>

          {/* Users list */}
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>
            Participants ({selected.users?.length || 0})
          </div>

          {!selected.users?.length ? (
            <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>
              No submissions yet. Share the PIN to get started.
            </div>
          ) : (
            selected.users.map((u, i) => (
              <div key={i} style={{ background: C.card, border: "1px solid " + C.border,
                borderRadius: 8, padding: "10px 14px", marginBottom: 7,
                display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%",
                  background: C.crimsonLight, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 13, fontWeight: 700,
                  color: C.crimson, flexShrink: 0 }}>
                  {u.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    Submitted {new Date(u.submitted_at).toLocaleDateString("en-IN",
                      { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const [loginEnabled,    setLoginEnabled]    = useState(null);
  const [instanceEnabled, setInstanceEnabled] = useState(null);
  const [saving, setSaving] = useState(null); // key being saved

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => {
        setLoginEnabled(d.login_enabled === "true");
        setInstanceEnabled(d.instance_login_enabled !== "false");
      })
      .catch(() => { setLoginEnabled(true); setInstanceEnabled(true); });
  }, []);

  const saveSetting = async (key, value, setter) => {
    setSaving(key);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: String(value) }),
    });
    setter(value);
    setSaving(null);
  };

  if (loginEnabled === null) return <div style={{ padding: 40, color: C.muted }}>Loading…</div>;

  const ToggleCard = ({ title, description, enabled, settingKey, onToggle }) => (
    <div style={{ background: C.card, border: "1px solid " + C.border,
      borderRadius: 12, padding: "20px 22px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 5 }}>
            {title}
          </div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
            {description}
          </div>
        </div>
        <button onClick={onToggle} disabled={saving === settingKey}
          style={{ padding: "9px 22px", borderRadius: 8, border: "none",
            background: enabled ? C.green : C.red,
            color: "#fff", fontWeight: 700, fontSize: 14,
            cursor: saving === settingKey ? "not-allowed" : "pointer",
            opacity: saving === settingKey ? 0.7 : 1, fontFamily: "inherit",
            flexShrink: 0, minWidth: 70 }}>
          {saving === settingKey ? "…" : enabled ? "ON" : "OFF"}
        </button>
      </div>
      <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8,
        background: enabled ? C.greenPale : C.crimsonPale,
        border: "1px solid " + (enabled ? "#A7F3D0" : C.crimsonBorder),
        fontSize: 12, color: enabled ? C.green : C.crimson, fontWeight: 600 }}>
        {enabled ? `✓ ${title} is currently enabled` : `✕ ${title} is currently disabled`}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "28px 24px", maxWidth: 520 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "Georgia,serif",
        color: C.text, margin: "0 0 6px" }}>App Settings</h2>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 28px" }}>
        Manage global settings for the app.
      </p>

      <ToggleCard
        title="Login"
        settingKey="login_enabled"
        enabled={loginEnabled}
        description={loginEnabled
          ? "Users can register with name + email and complete exercises."
          : "Login is OFF — users can only enter their email to view existing results. No new registrations or exercise submissions."}
        onToggle={() => saveSetting("login_enabled", !loginEnabled, setLoginEnabled)}
      />

      <ToggleCard
        title="Parallel Instance (Team Login)"
        settingKey="instance_login_enabled"
        enabled={instanceEnabled}
        description={instanceEnabled
          ? "The 'Join as a team' PIN option is visible on the login page."
          : "The 'Join as a team' PIN option is hidden from the login page."}
        onToggle={() => saveSetting("instance_login_enabled", !instanceEnabled, setInstanceEnabled)}
      />
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
    { key: "users",      label: "Users",      icon: "👥" },
    { key: "exercises",  label: "Exercises",  icon: "📁" },
    { key: "scenarios",  label: "Scenarios",  icon: "📋" },
    { key: "algorithms", label: "Algorithms", icon: "🧠" },
    { key: "instances",  label: "Instances",  icon: "🔒" },
    { key: "settings",   label: "Settings",   icon: "⚙️" },
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
        {tab === "users"      && <UsersTab />}
        {tab === "exercises"  && <ExercisesTab />}
        {tab === "scenarios"  && <ScenariosTab />}
        {tab === "algorithms" && <AlgorithmsTab />}
        {tab === "instances"  && <InstancesTab />}
        {tab === "settings"   && <SettingsTab />}
      </main>
    </div>
  );
}
