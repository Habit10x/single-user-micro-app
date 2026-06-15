"use client";

import { useState, useEffect, useRef } from "react";
import ModeratorPanel from "./ModeratorPanel";

// ─── Design tokens ────────────────────────────────────────────────────────────
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
  tag:          "#F0EBE3",
  tagText:      "#4A3F38",
  green:        "#059669",
  greenPale:    "#ECFDF5",
  greenDark:    "#065F46",
  amber:        "#D97706",
  amberPale:    "#FFFBEB",
  amberDark:    "#92400E",
  red:          "#DC2626",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const DEFAULT_SCENARIOS = [
  { id:1, short:"Project Update", full:"Project Update",
    text:`Your manager asks: "How's the Horizon project coming along?"`,
    ctx:["4 of 6 emails done, approved by marketing","Email 3: legal review delay — resolved","On track for next Friday deadline","Design team hasn't replied about header format — if no reply by Tuesday, 3-day delay"],
    score:8, pf:true,
    headline:"Strong status open — but the risk lands too late",
    worked:"Led with current status and completion count. The resolved delay was handled efficiently in one clause.",
    improve:"The design decision risk is the most time-sensitive item. It should follow the status immediately — not come after a resolved issue that's already done."
  },
  { id:2, short:"Show Rec.", full:"Show Recommendation",
    text:`Your friend texts: "Should I watch that crime show you just finished? I have one evening free."`,
    ctx:["6 episodes. Eps 1–4: gripping, watched all four in one sitting","Eps 5–6: romance subplot takes over, tension drops significantly","Finale reveal satisfying but last 20 min feel rushed","Friend likes crime shows, hates shows that drag"],
    score:5, pf:true,
    headline:"Recommendation is clear but reasoning is entirely generic",
    worked:"Led with a direct yes — that's correct. Overall structure is right.",
    improve:"'Interesting story' describes every show. Use what you actually know: 4 eps in one sitting, then a dip, then a satisfying ending."
  },
  { id:3, short:"Missed Meeting", full:"Missed Meeting",
    text:`Your team lead messages: "You weren't on the call — what happened, and what did you miss?"`,
    ctx:["Water pipe emergency at 2:50pm — no time to message first","Caught up with colleague: presentation moved to Thursday (no content change)","New expense approval: >₹5k needs 2 managers via new form, starts Monday","Tuesday sync cancelled (public holiday)"],
    score:9, pf:false,
    headline:"Near-perfect — every element in the right order",
    worked:"Brief, non-defensive, all updates specific and actionable.",
    improve:"Minor: skipping 'Hi' in the opening would make it even tighter."
  },
  { id:4, short:"Explain Role", full:"Explain Your Role",
    text:`A family member asks: "So what is it that you actually do at work? I've never understood."`,
    ctx:["Role: Business Analyst at a consumer goods company","You find why products underperform and write 2–3 page reports for marketing/ops","Last month: found shelf placement (not pricing) was killing sales in 3 cities","Time: ~60% data, ~30% meetings, ~10% writing"],
    score:4, pf:false,
    headline:"Opens by signalling complexity — opposite of what this needs",
    worked:"Identified the general nature of the work (analytical, reports).",
    improve:"Lead with what you produce and why it matters, then give the shelf-placement example."
  }
];

// Community answers — own:true entries shown separately, NOT in the scrollable list
const COMMUNITY = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const scoreBg  = s => s>=8?C.greenPale  : s>=6?C.amberPale  : C.crimsonPale;
const scoreClr = s => s>=8?C.green      : s>=6?C.amber      : C.red;

// ─── Shared: Tag pill ─────────────────────────────────────────────────────────
const Tag = ({icon, label, highlight}) => (
  <span style={{display:"inline-flex", alignItems:"center", gap:5,
    padding:"5px 12px", borderRadius:99, fontSize:12, fontWeight:500,
    border:"1px solid", borderColor:highlight?C.crimsonBorder:C.border,
    background:highlight?C.crimsonPale:C.tag,
    color:highlight?C.crimson:C.tagText}}>
    {icon&&<span>{icon}</span>} {label}
  </span>
);

// ─── Shared: Top nav ──────────────────────────────────────────────────────────
const TopNav = ({userName, userEmail, onLogout, back}) => (
  <header style={{background:C.card, borderBottom:"1px solid "+C.border,
    padding:"0 20px", height:52, display:"flex", alignItems:"center",
    justifyContent:"space-between", position:"sticky", top:0, zIndex:50,
    boxSizing:"border-box"}}>
    <div style={{display:"flex", alignItems:"center", gap:10}}>
      <span style={{fontWeight:800, fontSize:17, color:C.crimson,
        letterSpacing:0.5, fontFamily:"Georgia,serif"}}>SHARP</span>
      {back && <>
        <span style={{color:C.borderLight}}>|</span>
        <button onClick={back.onClick}
          style={{background:"none", border:"none", color:C.muted,
            fontSize:13, cursor:"pointer", padding:0,
            display:"flex", alignItems:"center", gap:3}}>
          ← {back.label}
        </button>
      </>}
    </div>
    {userName && (
      <div style={{display:"flex", alignItems:"center", gap:8}}>
        <div style={{width:30, height:30, borderRadius:"50%",
          background:C.crimsonLight, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:11, fontWeight:700, color:C.crimson,
          flexShrink:0}}>
          {userName[0].toUpperCase()}
        </div>
        <div>
          <div style={{fontSize:13, fontWeight:600, color:C.text, lineHeight:1.25}}>{userName}</div>
          {userEmail && <div style={{fontSize:11, color:C.muted, lineHeight:1.25}}>{userEmail}</div>}
        </div>
        <button onClick={onLogout}
          style={{background:"none", border:"1px solid "+C.border,
            color:C.muted, fontSize:12, fontWeight:600,
            padding:"5px 10px", borderRadius:7, cursor:"pointer",
            marginLeft:4, fontFamily:"inherit"}}>
          Log out
        </button>
      </div>
    )}
  </header>
);

// ─── App ──────────────────────────────────────────────────────────────────────
// Map a DB scenario row to the component's internal format
function mapDbScenario(s) {
  return {
    id:          s.id,
    short:       s.short_title,
    full:        s.full_title,
    text:        s.prompt,
    ctx:         Array.isArray(s.context) ? s.context : [],
    contextType: s.context_type || "points",
    taskText:    s.task_text    || "",
    score:       s.score        ?? null,
    pf:          s.point_first  ?? true,
    headline:    s.headline     || "",
    worked:      s.what_worked  || "",
    improve:     s.to_improve   || "",
  };
}

export default function SharpApp({ exercise: exerciseProp, scenarios: scenariosProp }) {
  const [screen,      setScreen]      = useState("login");
  const [nameVal,     setNameVal]     = useState("");
  const [emailVal,    setEmailVal]    = useState("");
  const [loginErr,    setLoginErr]    = useState("");
  const [userName,    setUserName]    = useState("");

  const [q,           setQ]           = useState(1);
  const [texts,       setTexts]       = useState({});
  const [fbOpen,         setFbOpen]         = useState(null);
  const [fbReturnScreen, setFbReturnScreen] = useState("results");
  const [otherFb,        setOtherFb]        = useState(null); // { name, result, answer }
  const [insightOpen, setInsightOpen] = useState(null);
  const [commSc,      setCommSc]      = useState(1);
  const [sortBy,      setSortBy]      = useState("best");
  const [userEmail,   setUserEmail]   = useState("");
  const [userAnswers, setUserAnswers] = useState(null); // answers from DB for returning users
  const [loginLoading,setLoginLoading]= useState(false);
  const [loginEnabled,setLoginEnabled]         = useState(true);
  const [instanceLoginEnabled,setInstanceLoginEnabled] = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [sharpResults,    setSharpResults]     = useState({});
  const [synthesisResult, setSynthesisResult]  = useState(null);
  const [timeLeft,    setTimeLeft]    = useState(null);
  const [resultsFbOpen,  setResultsFbOpen]  = useState(false);
  const [resultsScOpen,  setResultsScOpen]  = useState(false);

  const textsRef    = useRef({});
  const doSubmitRef = useRef(null);

  const [isModerator,       setIsModerator]       = useState(false);

  const [instanceId,        setInstanceId]        = useState(null);
  const [instanceName,      setInstanceName]      = useState(null);
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [instUserName,      setInstUserName]      = useState("");
  const [instTeamName,      setInstTeamName]      = useState("");
  const [instPin,           setInstPin]           = useState("");
  const [instErr,           setInstErr]           = useState("");
  const [instLoading,       setInstLoading]       = useState(false);
  const [communityData,     setCommunityData]     = useState(null);

  useEffect(()=>{
    fetch("/api/settings")
      .then(r=>r.json())
      .then(d=>{
        setLoginEnabled(d.login_enabled!==false);
        setInstanceLoginEnabled(d.instance_login_enabled!==false);
      })
      .catch(()=>{});
  },[]);

  useEffect(()=>{ textsRef.current = texts; },[texts]);

  // Active exercise / scenario data — from DB props or hardcoded defaults
  const activeScenarios = (scenariosProp && scenariosProp.length > 0)
    ? scenariosProp.map(mapDbScenario)
    : DEFAULT_SCENARIOS;

  const activeExercise = exerciseProp || {
    id:            null,
    title:         "Articulation-01",
    description:   "This test will help you in your articulation.",
    difficulty:    "Intermediate",
    category:      "Articulation",
    timer_minutes: 5,
  };

  const total      = activeScenarios.length;
  const scenario   = activeScenarios[q-1];

  // Returns the SHARP score (1-10) for a scenario by its position index (1-based), falling back to hardcoded
  const sharpScore   = (pos) => sharpResults[pos]?.score ?? null;
  const displayScore = (pos) => sharpScore(pos) ?? 0;
  const overall = (activeScenarios.reduce((a,_,i)=>a+displayScore(i+1),0)/total).toFixed(1);

  // commSc is a 1-based scenario position within the exercise
  const commSc_obj = activeScenarios[commSc - 1];

  const othersForSc  = COMMUNITY.filter(a=>a.sid===commSc && !a.own);
  // Use real DB answer if available, otherwise fall back to hardcoded sample
  const myAns = userAnswers?.[commSc] || userAnswers?.[String(commSc)]
    ? { id: 0, sid: commSc, name: userName, init: userName?.[0]?.toUpperCase()||"Y",
        own: true, score: sharpResults[commSc]?.score ?? sharpResults[String(commSc)]?.score ?? null,
        answer: userAnswers[commSc] || userAnswers[String(commSc)] }
    : null;
  const othersSorted = [...othersForSc].sort((a,b)=>
    sortBy==="best" ? b.score-a.score : a.id-b.id
  );

  const doLogin = async () => {
    if (emailVal.trim().toLowerCase() === "moderator-habit10x@gmail.com") {
      setIsModerator(true);
      return;
    }
    if (loginEnabled && !nameVal.trim()) { setLoginErr("Please enter your name."); return; }
    if (!emailVal.includes("@")) { setLoginErr("Please enter a valid email."); return; }

    setLoginLoading(true);
    setLoginErr("");

    try {
      const exId = activeExercise.id ? `&exercise_id=${activeExercise.id}` : "";
      const res  = await fetch(`/api/check-submission?email=${encodeURIComponent(emailVal.trim())}${exId}`);
      const data = await res.json();

      if (data.submitted) {
        // Returning user — go straight to results
        setUserName(data.name);
        setUserEmail(emailVal.trim().toLowerCase());
        setUserAnswers(data.answers);
        if (data.sharp_results)    setSharpResults(data.sharp_results);
        if (data.synthesis_result) setSynthesisResult(data.synthesis_result);
        if (activeExercise.id) fetchCommunityData({ exerciseId: activeExercise.id });
        setScreen("results");
      } else if (!loginEnabled) {
        setLoginErr("No account found. New registrations are currently disabled.");
      } else {
        // New user — normal flow
        setUserName(nameVal.trim());
        setUserEmail(emailVal.trim().toLowerCase());
        setScreen("start");
      }
    } catch {
      setLoginErr("Could not connect. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const formatTime = secs => `${Math.floor(secs/60)}:${String(secs%60).padStart(2,"0")}`;

  const doSubmit = async () => {
    if (submitting) return;
    const answers = textsRef.current;
    setSubmitting(true);
    try {
      await fetch("/api/submit", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          email:       instanceId ? null : userEmail,
          name:        userName,
          answers,
          instance_id: instanceId || null,
          exercise_id: activeExercise.id || null,
        }),
      });
      setUserAnswers(answers);
      if (instanceId) await fetchCommunityData({ instanceId });
      else if (activeExercise.id) await fetchCommunityData({ exerciseId: activeExercise.id });
      const scoreRes = await fetch("/api/score-all", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          answers,
          email:         instanceId ? null : userEmail,
          name:          userName,
          instance_id:   instanceId || null,
          exercise_id:   activeExercise.id || null,
          exerciseTitle: activeExercise.title,
          scenarios:     activeScenarios.map(s=>({shortTitle:s.short,text:s.text,ctx:s.ctx})),
        }),
      });
      const scoreData = await scoreRes.json();
      if (scoreData.sharpResults)    setSharpResults(scoreData.sharpResults);
      if (scoreData.synthesisResult) setSynthesisResult(scoreData.synthesisResult);
    } catch {}
    setSubmitting(false);
    setScreen("results");
  };
  doSubmitRef.current = doSubmit;

  // Timer: start when entering answering screen
  useEffect(()=>{
    if (screen==="answering" && activeExercise.timer_minutes > 0)
      setTimeLeft(t => t === null ? activeExercise.timer_minutes * 60 : t);
    if (screen!=="answering" && screen!=="results")
      {} // keep timeLeft while on results so it doesn't restart if they go back (not possible but safe)
  },[screen]);

  // Timer: countdown tick + auto-submit at 0
  useEffect(()=>{
    if (timeLeft === null || screen !== "answering") return;
    if (timeLeft <= 0) { doSubmitRef.current?.(); return; }
    const t = setTimeout(()=>setTimeLeft(s=>s-1), 1000);
    return ()=>clearTimeout(t);
  },[timeLeft, screen]);

  const doLogout = () => {
    setScreen("login");
    setUserName("");
    setUserEmail("");
    setNameVal("");
    setEmailVal("");
    setUserAnswers(null);
    setTexts({});
    setQ(1);
    setLoginErr("");
    setInstanceId(null);
    setInstanceName(null);
    setShowInstanceModal(false);
    setInstUserName("");
    setInstTeamName("");
    setInstPin("");
    setInstErr("");
    setCommunityData(null);
    setSharpResults({});
    setTimeLeft(null);
  };

  const fetchCommunityData = async ({ instanceId, exerciseId }) => {
    try {
      const param = instanceId ? `instance_id=${instanceId}` : `exercise_id=${exerciseId}`;
      const res   = await fetch(`/api/community?${param}`);
      const data  = await res.json();
      setCommunityData(data.submissions || []);
    } catch {}
  };

  const doJoinInstance = async () => {
    if (!instUserName.trim()) { setInstErr("Please enter your name."); return; }
    if (!instTeamName.trim()) { setInstErr("Please enter your team name."); return; }
    if (!/^\d{4}$/.test(instPin)) { setInstErr("PIN must be exactly 4 digits."); return; }

    setInstLoading(true);
    setInstErr("");

    try {
      const res  = await fetch("/api/instance/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: instPin }),
      });
      const data = await res.json();

      if (!res.ok) { setInstErr(data.error || "Invalid PIN."); setInstLoading(false); return; }

      // Check if this user name already submitted in this instance
      const checkRes  = await fetch(
        `/api/check-submission?instance_id=${data.id}&name=${encodeURIComponent(instUserName.trim())}`
      );
      const checkData = await checkRes.json();

      setInstanceId(data.id);
      setInstanceName(data.name);
      setUserName(instUserName.trim());
      setShowInstanceModal(false);

      if (checkData.submitted) {
        setUserAnswers(checkData.answers);
        if (checkData.sharp_results)    setSharpResults(checkData.sharp_results);
        if (checkData.synthesis_result) setSynthesisResult(checkData.synthesis_result);
        await fetchCommunityData({ instanceId: data.id });
        setScreen("results");
      } else {
        setScreen("start");
      }
    } catch {
      setInstErr("Could not connect. Please try again.");
    } finally {
      setInstLoading(false);
    }
  };

  const DemoNav = () => {
    const screens = ["results","community"];
    return (
      <div style={{background:"#111", padding:"10px 20px",
        display:"flex", gap:7, justifyContent:"center",
        flexWrap:"wrap", borderBottom:"2px solid #1e1e1e"}}>
        {screens.map(s=>(
          <button key={s} onClick={()=>setScreen(s)}
            style={{padding:"5px 13px", borderRadius:20, border:"1.5px solid",
              borderColor:screen===s?"#E8A020":"#444",
              background:screen===s?"#E8A020":"transparent",
              color:screen===s?"#111":"#aaa",
              fontSize:10, fontWeight:700,
              cursor:"pointer", textTransform:"capitalize"}}>
            {s}
          </button>
        ))}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTANCE MODAL
  // ═══════════════════════════════════════════════════════════════════════════
  const InstanceModal = () => (
    <div onClick={()=>{setShowInstanceModal(false);setInstErr("");}}
      style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
        display:"flex", alignItems:"center", justifyContent:"center",
        zIndex:300, padding:"20px"}}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:C.card, borderRadius:16, width:"100%", maxWidth:380,
          padding:"28px 26px", boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>

        <h2 style={{fontSize:18, fontWeight:700, color:C.text,
          fontFamily:"Georgia,serif", margin:"0 0 6px"}}>
          Join Parallel Instance
        </h2>
        <p style={{fontSize:13, color:C.muted, margin:"0 0 22px", lineHeight:1.55}}>
          Enter your team name and the 4-digit PIN shared by your administrator.
        </p>

        <label style={{display:"block", marginBottom:16}}>
          <div style={{fontSize:11, fontWeight:700, color:C.muted,
            textTransform:"uppercase", letterSpacing:0.9, marginBottom:6}}>
            Your Name
          </div>
          <input type="text" value={instUserName}
            placeholder="e.g. Priya Sharma"
            onChange={e=>{setInstUserName(e.target.value);setInstErr("");}}
            onKeyDown={e=>e.key==="Enter"&&doJoinInstance()}
            style={{width:"100%", padding:"11px 13px",
              border:"1.5px solid "+C.border, borderRadius:8,
              fontSize:14, color:C.text, background:C.card,
              outline:"none", boxSizing:"border-box", fontFamily:"inherit"}} />
        </label>

        <label style={{display:"block", marginBottom:16}}>
          <div style={{fontSize:11, fontWeight:700, color:C.muted,
            textTransform:"uppercase", letterSpacing:0.9, marginBottom:6}}>
            Team Name
          </div>
          <input type="text" value={instTeamName}
            placeholder="e.g. Team Alpha"
            onChange={e=>{setInstTeamName(e.target.value);setInstErr("");}}
            onKeyDown={e=>e.key==="Enter"&&doJoinInstance()}
            style={{width:"100%", padding:"11px 13px",
              border:"1.5px solid "+C.border, borderRadius:8,
              fontSize:14, color:C.text, background:C.card,
              outline:"none", boxSizing:"border-box", fontFamily:"inherit"}} />
        </label>

        <label style={{display:"block", marginBottom:22}}>
          <div style={{fontSize:11, fontWeight:700, color:C.muted,
            textTransform:"uppercase", letterSpacing:0.9, marginBottom:6}}>
            4-Digit PIN
          </div>
          <input type="text" inputMode="numeric" maxLength={4}
            value={instPin} placeholder="••••"
            onChange={e=>{setInstPin(e.target.value.replace(/\D/g,"").slice(0,4));setInstErr("");}}
            onKeyDown={e=>e.key==="Enter"&&doJoinInstance()}
            style={{width:"100%", padding:"11px 13px",
              border:"1.5px solid "+C.border, borderRadius:8,
              fontSize:22, fontWeight:700, color:C.text,
              background:C.card, outline:"none",
              boxSizing:"border-box", fontFamily:"inherit",
              letterSpacing:8, textAlign:"center"}} />
        </label>

        {instErr && (
          <div style={{background:C.crimsonPale, border:"1px solid "+C.crimsonBorder,
            borderRadius:8, padding:"9px 13px", marginBottom:16,
            fontSize:13, color:C.crimson}}>
            {instErr}
          </div>
        )}

        <button onClick={doJoinInstance} disabled={instLoading}
          style={{width:"100%", padding:"13px", background:C.crimson,
            color:"#fff", border:"none", borderRadius:8,
            fontSize:14, fontWeight:700,
            cursor:instLoading?"not-allowed":"pointer",
            opacity:instLoading?0.7:1, fontFamily:"inherit", marginBottom:8}}>
          {instLoading ? "Verifying…" : "Join Instance →"}
        </button>

        <button onClick={()=>{setShowInstanceModal(false);setInstErr("");}}
          style={{width:"100%", padding:"10px", background:"transparent",
            border:"1.5px solid "+C.border, borderRadius:8,
            fontSize:13, fontWeight:600, color:C.muted,
            cursor:"pointer", fontFamily:"inherit"}}>
          Cancel
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. LOGIN SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  const LoginScreen = () => (
    <div style={{minHeight:"100vh", background:C.bg,
      display:"flex", flexDirection:"column"}}>

      {showInstanceModal && InstanceModal()}

      <TopNav userName={userName} userEmail={userEmail} onLogout={doLogout} />

      <div style={{flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:"24px 20px"}}>

      <div style={{textAlign:"center", marginBottom:36}}>
        <div style={{fontSize:11, fontWeight:700, color:C.muted,
          letterSpacing:3, textTransform:"uppercase", marginBottom:10}}>
          By Habit10x
        </div>
        <div style={{fontSize:42, fontWeight:800, color:C.crimson,
          fontFamily:"Georgia,serif", lineHeight:1.1, marginBottom:12}}>
          Speak Sharp Society
        </div>
        <p style={{fontSize:14, color:C.textSoft, margin:"0 auto", lineHeight:1.7, maxWidth:320, textAlign:"center"}}>
          A global community to practice real conversations,{" "}
          <strong style={{color:C.text}}>speak with impact</strong>,
          {" "}get feedback, and grow every day.
        </p>
      </div>

      <div style={{background:C.card, borderRadius:16, padding:"32px 28px",
        width:"100%", maxWidth:400,
        boxShadow:"0 4px 24px rgba(0,0,0,0.07)", border:"1px solid "+C.border}}>
        <h2 style={{fontSize:22, fontWeight:700, color:C.text,
          fontFamily:"Georgia,serif", margin:"0 0 6px"}}>Welcome</h2>
        <p style={{fontSize:14, color:C.muted, margin:"0 0 26px", lineHeight:1.6}}>
          {loginEnabled
            ? "Enter your details to begin your session."
            : "Enter your email to view your results."}
        </p>

        {!loginEnabled && (
          <div style={{background:C.amberPale, border:"1px solid #FDE68A",
            borderRadius:8, padding:"9px 13px", marginBottom:20,
            fontSize:12, color:C.amberDark, lineHeight:1.55}}>
            New registrations are currently disabled. Only existing users can view their results.
          </div>
        )}

        {loginEnabled && (
          <label style={{display:"block", marginBottom:16}}>
            <div style={{fontSize:11, fontWeight:700, color:C.muted,
              textTransform:"uppercase", letterSpacing:0.9, marginBottom:6}}>
              Full Name
            </div>
            <input type="text" value={nameVal} placeholder="Priya Sharma"
              onChange={e=>{setNameVal(e.target.value);setLoginErr("");}}
              onKeyDown={e=>e.key==="Enter"&&doLogin()}
              style={{width:"100%", padding:"11px 13px",
                border:"1.5px solid "+C.border, borderRadius:8,
                fontSize:14, color:C.text, background:C.card,
                outline:"none", boxSizing:"border-box", fontFamily:"inherit"}} />
          </label>
        )}

        <label style={{display:"block", marginBottom:22}}>
          <div style={{fontSize:11, fontWeight:700, color:C.muted,
            textTransform:"uppercase", letterSpacing:0.9, marginBottom:6}}>
            Email Address
          </div>
          <input type="email" value={emailVal} placeholder="priya@example.com"
            onChange={e=>{setEmailVal(e.target.value);setLoginErr("");}}
            onKeyDown={e=>e.key==="Enter"&&doLogin()}
            style={{width:"100%", padding:"11px 13px",
              border:"1.5px solid "+C.border, borderRadius:8,
              fontSize:14, color:C.text, background:C.card,
              outline:"none", boxSizing:"border-box", fontFamily:"inherit"}} />
        </label>

        {loginErr && (
          <div style={{background:C.crimsonPale, border:"1px solid "+C.crimsonBorder,
            borderRadius:8, padding:"9px 13px", marginBottom:16,
            fontSize:13, color:C.crimson}}>{loginErr}</div>
        )}

        <button onClick={doLogin} disabled={loginLoading}
          style={{width:"100%", padding:"13px", background:C.crimson,
            color:"#fff", border:"none", borderRadius:8,
            fontSize:14, fontWeight:700,
            cursor:loginLoading?"not-allowed":"pointer",
            opacity:loginLoading?0.7:1, fontFamily:"inherit"}}>
          {loginLoading ? "Checking…" : loginEnabled ? "Continue →" : "View Results →"}
        </button>

        {loginEnabled && (
          <p style={{textAlign:"center", fontSize:12, color:C.muted,
            marginTop:18, lineHeight:1.6}}>
            Your answers are saved so you can review them after the session.
          </p>
        )}

        {instanceLoginEnabled && (
        <div style={{marginTop:20, paddingTop:18,
          borderTop:"1px solid "+C.borderLight, textAlign:"center"}}>
          <button onClick={()=>setShowInstanceModal(true)}
            style={{background:"transparent", border:"1.5px solid "+C.border,
              borderRadius:8, padding:"9px 18px", fontSize:13, fontWeight:600,
              color:C.textSoft, cursor:"pointer", fontFamily:"inherit",
              width:"100%"}}>
            🔒 Joining as a team? Enter PIN →
          </button>
        </div>
        )}
      </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. EXERCISE START PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const StartScreen = () => {
    const SvgTarget = () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={C.crimson} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
      </svg>
    );
    const SvgClipboard = () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke={C.crimson} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        <line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/>
      </svg>
    );
    const SvgLock = ({ color="#fff", size=20 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    );
    const SvgPeople = () => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    );
    const SvgClock = () => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    );
    const SvgPerson = () => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    );
    const SvgTag = () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    );

    const customTags = activeExercise.tags
      ? activeExercise.tags.split(",").map(t => t.trim()).filter(Boolean)
      : [];

    const showDefaults = activeExercise.show_default_tags !== false;
    const statItems = [
      ...(showDefaults ? [
        { icon: <SvgPeople/>, label: `${total} Scenario${total!==1?"s":""}` },
        { icon: <SvgClock/>,  label: activeExercise.timer_minutes > 0 ? `${activeExercise.timer_minutes} min` : "No limit" },
      ] : []),
      ...(customTags.length > 0
        ? customTags.map(t => ({ icon: <SvgTag/>, label: t }))
        : (showDefaults ? [{ icon: <SvgPerson/>, label: "Solo" }] : [])
      ),
    ];

    const instructions = [
      "All context is provided. Do not make assumptions beyond what's given.",
      ...(activeExercise.timer_minutes > 0
        ? ["Timed activity — responses auto-submit when the timer ends."]
        : []),
      "Scores and feedback unlock after all scenarios are submitted.",
    ];

    return (
      <div style={{minHeight:"100vh", background:C.bg}}>
        <TopNav userName={userName} userEmail={userEmail} onLogout={doLogout} />

        <div style={{maxWidth:520, margin:"0 auto", padding:"20px 16px 48px"}}>

          {/* ── Hero card ── */}
          <div style={{background:"#8B2020", borderRadius:20, padding:"28px 24px 26px", marginBottom:14}}>
            <div style={{fontSize:11, fontWeight:700, color:"#D4908A",
              letterSpacing:2.5, textTransform:"uppercase", marginBottom:10}}>
              {(activeExercise.category || "Clear Articulation").toUpperCase()}
            </div>
            <h1 style={{fontSize:42, fontWeight:800, color:"#fff",
              fontFamily:"Georgia,serif", margin:"0 0 16px", lineHeight:1.08}}>
              {activeExercise.title}
            </h1>
            {activeExercise.description && (
              <p style={{fontSize:15, color:"rgba(255,255,255,0.85)",
                margin:"0 0 24px", lineHeight:1.75}}>
                {activeExercise.description}
              </p>
            )}
            <div style={{display:"inline-flex", alignItems:"center",
              background:"rgba(201, 58, 58, 0.18)", borderRadius:99, padding:"10px 20px"}}>
              {statItems.map((item, i) => (
                <div key={i} style={{display:"flex", alignItems:"center"}}>
                  {i > 0 && <span style={{color:"rgba(255,255,255,0.2)", margin:"0 14px", fontSize:15}}>|</span>}
                  <span style={{color:"rgba(255,255,255,0.92)", fontSize:13, fontWeight:500,
                    display:"flex", alignItems:"center", gap:7}}>
                    {item.icon}{item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Info card ── */}
          <div style={{background:C.card, borderRadius:16, border:"1px solid "+C.border,
            padding:"22px 20px", marginBottom:12, boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>

            {/* The Task */}
            <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:16}}>
              <div style={{width:40, height:40, borderRadius:"50%", background:C.crimsonPale,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                <SvgTarget/>
              </div>
              <span style={{fontSize:13, fontWeight:800, color:C.text,
                letterSpacing:1.5, textTransform:"uppercase"}}>
                The Task
              </span>
            </div>
            <p style={{fontSize:15, color:C.text, lineHeight:1.8, margin:"0 0 22px"}}>
              {activeExercise.task_description ||
                "You'll be shown a situation and the context around it. Read the situation carefully, then write the clearest response you can — one that communicates the core point directly and specifically."}
            </p>

            <hr style={{border:"none", borderTop:"1px solid "+C.border, margin:"0 0 22px"}}/>

            {/* Instructions */}
            <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:16}}>
              <div style={{width:40, height:40, borderRadius:"50%", background:C.crimsonPale,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                <SvgClipboard/>
              </div>
              <span style={{fontSize:13, fontWeight:800, color:C.text,
                letterSpacing:1.5, textTransform:"uppercase"}}>
                Instructions
              </span>
            </div>
            <ul style={{margin:0, padding:0, listStyle:"none"}}>
              {instructions.map((item, i) => (
                <li key={i} style={{display:"flex", alignItems:"flex-start", gap:11,
                  marginBottom: i < instructions.length-1 ? 14 : 0,
                  fontSize:15, color:C.text, lineHeight:1.65}}>
                  <span style={{width:8, height:8, borderRadius:"50%", background:C.text,
                    flexShrink:0, marginTop:7}}/>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Lock notice ── */}
          <div style={{display:"flex", alignItems:"center", gap:14,
            background:C.crimsonPale, border:"1px solid "+C.crimsonBorder,
            borderRadius:12, padding:"14px 18px", marginBottom:24}}>
            <div style={{width:40, height:40, borderRadius:"50%", background:C.crimson,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
              <SvgLock color="#fff" size={20}/>
            </div>
            <p style={{fontSize:13, color:C.textSoft, margin:0, lineHeight:1.6}}>
              <strong style={{color:C.crimson}}>Scores and community responses</strong>{" "}
              unlock after exercise submission.
            </p>
          </div>

          {/* ── Start button ── */}
          <button onClick={()=>setScreen("answering")}
            style={{width:"100%", padding:"15px", background:C.crimson,
              color:"#fff", border:"none", borderRadius:12, fontSize:15,
              fontWeight:700, cursor:"pointer", fontFamily:"inherit", letterSpacing:0.3}}>
            Start Exercise →
          </button>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. ANSWERING SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  const AnsweringScreen = () => (
    <div style={{minHeight:"100vh", background:C.bg,
      display:"flex", flexDirection:"column"}}>
      <TopNav userName={userName} userEmail={userEmail} onLogout={doLogout} />

      <div style={{background:C.card, borderBottom:"1px solid "+C.border,
        padding:"10px 20px", flexShrink:0}}>
        <div style={{maxWidth:680, margin:"0 auto"}}>
          <div style={{display:"flex", alignItems:"center", marginBottom:8}}>
            <span style={{flex:1, fontSize:12, color:C.muted}}>Scenario {q} of {total}</span>
            <span style={{flex:1, textAlign:"center"}}>
              {activeExercise.timer_minutes > 0 && timeLeft !== null && (
                <span style={{fontSize:14, fontWeight:700, letterSpacing:0.5,
                  fontVariantNumeric:"tabular-nums", color:C.crimson}}>
                  ⏱ {formatTime(timeLeft)}
                </span>
              )}
            </span>
            <span style={{flex:1}}/>
          </div>
          <div style={{display:"flex", gap:5}}>
            {Array.from({length:total},(_,i)=>(
              <div key={i} style={{flex:1, height:4, borderRadius:2,
                background:i<q?C.crimson:C.borderLight}} />
            ))}
          </div>
        </div>
      </div>

      <div style={{flex:1, padding:"24px 20px 100px",
        maxWidth:680, margin:"0 auto", width:"100%", boxSizing:"border-box"}}>

        <div style={{background:C.card, borderRadius:12, border:"1px solid "+C.border,
          overflow:"hidden", marginBottom:18,
          boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
          <div style={{padding:"14px 18px", borderBottom:"1px solid "+C.borderLight}}>
            <div style={{fontSize:10, fontWeight:700, color:C.muted,
              letterSpacing:1.5, textTransform:"uppercase", marginBottom:8}}>
              Scenario {q}
            </div>
            <p style={{fontSize:15, color:C.text, lineHeight:1.7,
              margin:0, fontStyle:"italic", fontWeight:500, whiteSpace:"pre-wrap"}}>
              {scenario.text}
            </p>
          </div>
          <div style={{padding:"14px 18px", background:"#FDFCFB"}}>
            {scenario.ctx.filter(c => c.trim()).length > 0 && (
              <>
                <div style={{fontSize:10, fontWeight:700, color:C.muted,
                  letterSpacing:1.5, textTransform:"uppercase", marginBottom:9}}>
                  What You Know
                </div>
                {scenario.ctx.filter(c => c.trim()).map((c,i,arr)=>(
                  <div key={i} style={{display:"flex", gap:9,
                    marginBottom: i < arr.length - 1 ? 6 : (scenario.taskText ? 14 : 0),
                    alignItems:"flex-start"}}>
                    <span style={{color:C.crimson, fontWeight:700, fontSize:13,
                      flexShrink:0, marginTop:2}}>→</span>
                    <span style={{fontSize:13, color:C.text, lineHeight:1.55}}>{c}</span>
                  </div>
                ))}
              </>
            )}
            {scenario.taskText && (
              <>
                <div style={{fontSize:10, fontWeight:700, color:C.muted,
                  letterSpacing:1.5, textTransform:"uppercase", marginBottom:8}}>
                  Task
                </div>
                <p style={{fontSize:15, color:C.text, lineHeight:1.7,
                  margin:0, fontStyle:"italic", fontWeight:500, whiteSpace:"pre-wrap"}}>
                  {scenario.taskText}
                </p>
              </>
            )}
          </div>
        </div>

        <div style={{marginBottom:12}}>
          <div style={{fontSize:13, fontWeight:600, color:C.text, marginBottom:7}}>
            Your Response
          </div>
          <textarea value={texts[q]||""}
            onChange={e=>setTexts(t=>({...t,[q]:e.target.value}))}
            placeholder="Write your response here..."
            style={{width:"100%", minHeight:150,
              border:"1.5px solid "+C.border, borderRadius:10,
              padding:"13px 15px", fontSize:14, color:C.text,
              fontFamily:"inherit", lineHeight:1.7, resize:"vertical",
              outline:"none", background:C.card, boxSizing:"border-box"}} />
          <div style={{textAlign:"right", fontSize:11, color:C.muted, marginTop:3}}>
            {(texts[q]||"").length} characters
          </div>
        </div>

        <div style={{display:"flex", alignItems:"center", gap:8,
          background:C.tag, borderRadius:8, padding:"9px 13px",
          border:"1px solid "+C.borderLight}}>
          <span>🔒</span>
          <span style={{fontSize:12, color:C.muted}}>
            Scores and community responses unlock after submitting all scenarios
          </span>
        </div>
      </div>

      <div style={{position:"fixed", bottom:0, left:0, right:0,
        background:C.card, borderTop:"1px solid "+C.border,
        padding:"12px 20px", zIndex:40}}>
        <div style={{maxWidth:680, margin:"0 auto",
          display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <button
            onClick={()=>q>1?setQ(q-1):setScreen("start")}
            style={{padding:"10px 20px", borderRadius:8,
              border:"1.5px solid "+C.border, background:C.card,
              color:C.text, fontSize:13, fontWeight:600, cursor:"pointer"}}>
            ← {q>1?"Previous":"Back"}
          </button>
          <div style={{display:"flex", gap:6}}>
            {Array.from({length:total},(_,i)=>(
              <div key={i} style={{width:8, height:8, borderRadius:"50%",
                background: i===q-1?C.crimson : i<q-1?C.crimsonLight : C.borderLight}} />
            ))}
          </div>
          <button
            onClick={async()=>{
              if (q < total) { setQ(q+1); return; }
              await doSubmit();
            }}
            style={{padding:"10px 20px", borderRadius:8, border:"none",
              background:C.crimson, color:"#fff", fontSize:13,
              fontWeight:700, cursor:"pointer"}}>
            {q<total?"Next →":"Submit All →"}
          </button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. SUBMITTING / LOADING SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  const SubmittingScreen = () => (
    <div style={{minHeight:"100vh", background:C.bg, display:"flex",
      flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:20, fontFamily:"inherit"}}>

      <style>{`
        @keyframes sharp-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes sharp-pulse {
          0%,100% { opacity:0.4; transform:scale(0.98); }
          50%      { opacity:1;   transform:scale(1);    }
        }
        @keyframes sharp-bar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes sharp-fade-up {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0);    }
        }
      `}</style>

      {/* Logo */}
      <div style={{textAlign:"center", marginBottom:44,
        animation:"sharp-fade-up 0.5s ease both"}}>
        <div style={{fontSize:36, fontWeight:800, color:C.crimson,
          fontFamily:"Georgia,serif", letterSpacing:1, marginBottom:4}}>SPEAK SHARP</div>
        <div style={{fontSize:13, color:C.muted}}>Gym for Conversation Skills</div>
      </div>

      {/* Spinner */}
      <div style={{width:54, height:54, borderRadius:"50%",
        border:"3.5px solid "+C.crimsonLight,
        borderTopColor:C.crimson,
        animation:"sharp-spin 0.85s linear infinite",
        marginBottom:36}} />

      {/* Labels */}
      <div style={{textAlign:"center",
        animation:"sharp-fade-up 0.5s 0.15s ease both"}}>
        <div style={{fontSize:18, fontWeight:700, color:C.text,
          fontFamily:"Georgia,serif", marginBottom:10}}>
          Analysing your responses…
        </div>
        <div style={{fontSize:13, color:C.muted,
          animation:"sharp-pulse 1.6s ease-in-out infinite"}}>
          Scoring each scenario · Preparing your feedback
        </div>
      </div>

      {/* Progress bar */}
      <div style={{width:220, height:3, background:C.borderLight,
        borderRadius:99, marginTop:40, overflow:"hidden",
        animation:"sharp-fade-up 0.5s 0.2s ease both"}}>
        <div style={{height:"100%", background:C.crimson,
          borderRadius:99, animation:"sharp-bar 2.8s cubic-bezier(0.4,0,0.2,1) forwards"}} />
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. RESULTS SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  const ResultsScreen = () => {
    const didWell = synthesisResult?.whereDidWell
      ? [synthesisResult.whereDidWell]
      : activeScenarios
          .flatMap((_,i) => sharpResults[i+1]?.whatWorked || [])
          .filter(Boolean)
          .slice(0, 4);

    const lostImpact = synthesisResult?.whereLostImpact
      ? [synthesisResult.whereLostImpact]
      : activeScenarios
          .flatMap((_,i) => (sharpResults[i+1]?.impacts || [])
            .filter(imp => imp.level === "high" || imp.level === "medium")
            .map(imp => imp.why || imp.observation)
          )
          .filter(Boolean)
          .slice(0, 4);

    const hasFb = didWell.length > 0 || lostImpact.length > 0;

    const tagline =
      overall >= 9   ? "Precise, structured, and consistently on point."
      : overall >= 7 ? "Strong communicator — minor gaps hold you back."
      : overall >= 5 ? "Clear thinker — but key decisions arrive too late."
      : overall >= 3 ? "Ideas are present — structure and specificity need work."
      :                "Communication needs more focus, direction, and clarity.";

    const Chevron = ({open}) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={C.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{transform:open?"rotate(180deg)":"rotate(0deg)",
          transition:"transform 0.2s", flexShrink:0}}>
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    );

    return (
      <div style={{minHeight:"100vh", background:C.bg}}>
        <TopNav userName={userName} userEmail={userEmail} onLogout={doLogout} />

        <div style={{maxWidth:480, margin:"0 auto", padding:"24px 16px 48px"}}>

          {/* ── Hero score card ── */}
          <div style={{background:C.crimson, borderRadius:20,
            padding:"32px 24px 28px", marginBottom:16, textAlign:"center"}}>
            <div style={{fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.6)",
              letterSpacing:2.5, textTransform:"uppercase", marginBottom:14}}>
              Your Score
            </div>
            <div style={{display:"flex", alignItems:"baseline",
              justifyContent:"center", gap:4, marginBottom:16}}>
              <span style={{fontSize:72, fontWeight:800, color:"#fff",
                fontFamily:"Georgia,serif", lineHeight:1}}>{overall}</span>
              <span style={{fontSize:26, color:"rgba(255,255,255,0.55)",
                fontWeight:500}}>/10</span>
            </div>
            <p style={{fontSize:14, color:"rgba(255,255,255,0.85)", fontStyle:"italic",
              margin:0, lineHeight:1.65, padding:"0 8px"}}>
              "{tagline}"
            </p>
          </div>

          {/* ── Your Feedback ── */}
          <div style={{background:C.card, borderRadius:14, border:"1px solid "+C.border,
            marginBottom:10, overflow:"hidden", boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
            <div onClick={()=>setResultsFbOpen(!resultsFbOpen)}
              style={{padding:"16px 18px", display:"flex", alignItems:"center",
                gap:14, cursor:"pointer"}}>
              <div style={{width:44, height:44, borderRadius:12, background:C.crimsonPale,
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0, fontSize:20}}>💬</div>
              <div style={{flex:1}}>
                <div style={{fontSize:15, fontWeight:700, color:C.text}}>Your Feedback</div>
                <div style={{fontSize:12, color:C.muted, marginTop:2}}>Your communication pattern</div>
              </div>
              <Chevron open={resultsFbOpen} />
            </div>
            {resultsFbOpen && (
              <div style={{borderTop:"1px solid "+C.border, padding:"18px 18px 20px"}}>
                {!hasFb ? (
                  <p style={{fontSize:13, color:C.muted, fontStyle:"italic",
                    textAlign:"center", margin:0}}>
                    Feedback will appear here once scoring is complete.
                  </p>
                ) : (
                  <>
                    {didWell.length > 0 && (
                      <div style={{marginBottom: lostImpact.length > 0 ? 20 : 0}}>
                        <div style={{fontSize:11, fontWeight:700, color:C.green,
                          letterSpacing:1.5, textTransform:"uppercase", marginBottom:12}}>
                          Where you did well
                        </div>
                        {didWell.map((item,i)=>(
                          <div key={i} style={{display:"flex", gap:10,
                            marginBottom: i < didWell.length-1 ? 10 : 0,
                            alignItems:"flex-start"}}>
                            <span style={{width:6, height:6, borderRadius:"50%",
                              background:C.green, flexShrink:0, marginTop:7}}/>
                            <span style={{fontSize:13, color:C.text, lineHeight:1.65}}>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {lostImpact.length > 0 && (
                      <div>
                        <div style={{fontSize:11, fontWeight:700, color:C.crimson,
                          letterSpacing:1.5, textTransform:"uppercase", marginBottom:12}}>
                          Where you lost impact
                        </div>
                        {lostImpact.map((item,i)=>(
                          <div key={i} style={{display:"flex", gap:10,
                            marginBottom: i < lostImpact.length-1 ? 10 : 0,
                            alignItems:"flex-start"}}>
                            <span style={{width:6, height:6, borderRadius:"50%",
                              background:C.crimson, flexShrink:0, marginTop:7}}/>
                            <span style={{fontSize:13, color:C.text, lineHeight:1.65}}>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Scenario Breakdown ── */}
          <div style={{background:C.card, borderRadius:14, border:"1px solid "+C.border,
            marginBottom:10, overflow:"hidden", boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
            <div onClick={()=>setResultsScOpen(!resultsScOpen)}
              style={{padding:"16px 18px", display:"flex", alignItems:"center",
                gap:14, cursor:"pointer"}}>
              <div style={{width:44, height:44, borderRadius:12, background:C.crimsonPale,
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0, fontSize:20}}>📋</div>
              <div style={{flex:1}}>
                <div style={{fontSize:15, fontWeight:700, color:C.text}}>Scenario Breakdown</div>
                <div style={{fontSize:12, color:C.muted, marginTop:2}}>Your score in each scenario</div>
              </div>
              <Chevron open={resultsScOpen} />
            </div>
            {resultsScOpen && (
              <div style={{borderTop:"1px solid "+C.border, padding:"4px 14px 12px"}}>
                {activeScenarios.map((s,i)=>{
                  const pos = i + 1;
                  const sc  = displayScore(pos);
                  return (
                    <div key={s.id} style={{display:"flex", alignItems:"center",
                      gap:11, padding:"10px 4px",
                      borderBottom: i < activeScenarios.length-1
                        ? "1px solid "+C.borderLight : "none"}}>
                      <div style={{width:24, height:24, borderRadius:"50%",
                        background:C.crimsonLight, display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:11, fontWeight:700,
                        color:C.crimson, flexShrink:0}}>
                        {pos}
                      </div>
                      <span style={{flex:1, fontSize:13, color:C.text}}>{s.short}</span>
                      <span style={{background:scoreBg(sc), color:scoreClr(sc),
                        fontWeight:700, fontSize:12, padding:"3px 9px",
                        borderRadius:20, marginRight:4}}>
                        {sc}/10
                      </span>
                      <button onClick={e=>{e.stopPropagation();setFbOpen(pos);setFbReturnScreen("results");setScreen("feedback");}}
                        style={{background:"none", border:"none", color:C.crimson,
                          fontSize:12, fontWeight:600, cursor:"pointer",
                          textDecoration:"underline", padding:0, fontFamily:"inherit"}}>
                        Feedback
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Community Responses ── */}
          <div onClick={()=>setScreen("community")}
            style={{background:C.card, borderRadius:14, border:"1px solid "+C.border,
              padding:"16px 18px", display:"flex", alignItems:"center", gap:14,
              cursor:"pointer", boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}>
            <div style={{width:44, height:44, borderRadius:12, background:C.crimsonPale,
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, fontSize:20}}>👥</div>
            <div style={{flex:1}}>
              <div style={{fontSize:15, fontWeight:700, color:C.text}}>Community Responses</div>
              <div style={{fontSize:12, color:C.muted, marginTop:2}}>See how others answered</div>
            </div>
            <span style={{fontSize:20, color:C.muted, flexShrink:0}}>›</span>
          </div>

        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. FEEDBACK MODAL — full SHARP UI
  // ═══════════════════════════════════════════════════════════════════════════
  const FeedbackModal = () => {
    const pos = fbOpen || 1;
    const s   = activeScenarios[pos - 1] || activeScenarios[0];
    const sd  = sharpResults[pos] || sharpResults[String(pos)] || null;
    const sc  = displayScore(pos);
    const pf  = sd ? sd.pointFirst : s?.pf;

    // Format camelCase dimension name for display
    const fmtDim = d => d.replace(/([A-Z])/g," $1").replace(/^./, c=>c.toUpperCase());

    // Impact card color by level
    const impactStyle = (level) => {
      if (level === "high")   return { bg: C.crimsonPale,  border: C.crimsonBorder, lc: C.crimson };
      if (level === "medium") return { bg: C.amberPale,    border: "#FDE68A",       lc: C.amberDark };
      return                         { bg: C.tag,          border: C.border,        lc: C.muted };
    };

    const confidenceBadge = sd ? {
      HIGH:   { bg: C.greenPale,   color: C.green    },
      MEDIUM: { bg: C.amberPale,   color: C.amber    },
      LOW:    { bg: C.crimsonPale, color: C.crimson  },
    }[sd.scoreConfidence?.toUpperCase()] || {} : null;

    return (
      <div onClick={()=>setScreen(fbReturnScreen)}
        style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.4)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:200, padding:"20px"}}>
        <div onClick={e=>e.stopPropagation()}
          style={{background:C.card, borderRadius:16, width:"100%", maxWidth:500,
            maxHeight:"88vh", overflowY:"auto",
            boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>

          {/* ── Header ── */}
          <div style={{padding:"17px 20px", borderBottom:"1px solid "+C.border,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            position:"sticky", top:0, background:C.card, zIndex:10}}>
            <div>
              <div style={{fontSize:10, color:C.muted, letterSpacing:1.2,
                textTransform:"uppercase", marginBottom:3}}>
                Scenario {pos} · SHARP Feedback
              </div>
              <div style={{fontSize:16, fontWeight:700, color:C.text}}>{s?.full}</div>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:8}}>
              <div style={{textAlign:"right"}}>
                <div style={{background:scoreBg(sc), color:scoreClr(sc),
                  fontWeight:800, fontSize:16, padding:"4px 12px", borderRadius:20}}>
                  {sc}/10
                </div>
                {sd && confidenceBadge && (
                  <div style={{fontSize:9, fontWeight:700, textAlign:"center",
                    marginTop:3, color:confidenceBadge.color,
                    letterSpacing:0.8, textTransform:"uppercase"}}>
                    {sd.scoreConfidence} confidence
                  </div>
                )}
              </div>
              <button onClick={()=>setScreen(fbReturnScreen)}
                style={{background:C.borderLight, border:"none", color:C.muted,
                  width:28, height:28, borderRadius:"50%", cursor:"pointer",
                  fontSize:16, display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0}}>
                ✕
              </button>
            </div>
          </div>

          <div style={{padding:"18px 20px 22px"}}>

            {/* ── Point First badge ── */}
            <div style={{marginBottom:16}}>
              <span style={{display:"inline-flex", alignItems:"center", gap:5,
                background:pf?C.greenPale:C.crimsonPale,
                border:"1px solid "+(pf?C.green:C.crimsonBorder),
                padding:"5px 13px", borderRadius:99,
                fontSize:12, fontWeight:600, color:pf?C.green:C.crimson}}>
                {pf?"✅ Led with the point":"❌ Key point buried"}
              </span>
            </div>

            {sd ? (
              <>
                {/* ── One-liner summary ── */}
                <div style={{background:"#1C1C1C", borderRadius:10,
                  padding:"13px 16px", marginBottom:14}}>
                  <div style={{fontSize:9, fontWeight:700, color:"#888",
                    letterSpacing:1.5, textTransform:"uppercase", marginBottom:5}}>
                    Summary
                  </div>
                  <div style={{fontSize:14, color:"#fff", lineHeight:1.6,
                    fontWeight:600, fontStyle:"italic"}}>
                    {sd.summary ?? sd.oneLiner}
                  </div>
                </div>

                {/* ── Dimension scores ── */}
                {Object.keys(sd.dimensionScores).length > 0 && (
                  <div style={{background:C.bg, borderRadius:10,
                    padding:"13px 16px", marginBottom:14,
                    border:"1px solid "+C.borderLight}}>
                    <div style={{fontSize:9, fontWeight:700, color:C.muted,
                      letterSpacing:1.5, textTransform:"uppercase", marginBottom:12}}>
                      Dimension Scores
                    </div>
                    {Object.entries(sd.dimensionScores).map(([dim, val])=>{
                      const pct = Math.round((val/10)*100);
                      const barColor = val>=8?C.green : val>=6?C.amber : C.red;
                      return (
                        <div key={dim} style={{marginBottom:10}}>
                          <div style={{display:"flex", justifyContent:"space-between",
                            alignItems:"center", marginBottom:4}}>
                            <span style={{fontSize:12, color:C.textSoft, fontWeight:500}}>
                              {fmtDim(dim)}
                            </span>
                            <span style={{fontSize:12, fontWeight:700, color:barColor}}>
                              {val}/10
                            </span>
                          </div>
                          <div style={{height:5, background:C.borderLight, borderRadius:99}}>
                            <div style={{height:"100%", width:pct+"%",
                              background:barColor, borderRadius:99,
                              transition:"width 0.4s ease"}} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── What Worked ── */}
                {sd.whatWorked?.length > 0 && (
                  <div style={{background:C.greenPale, borderRadius:10,
                    padding:"13px 16px", marginBottom:14,
                    border:"1px solid #A7F3D0"}}>
                    <div style={{fontSize:9, fontWeight:700, color:C.greenDark,
                      letterSpacing:1.5, textTransform:"uppercase", marginBottom:8}}>
                      What Worked
                    </div>
                    {sd.whatWorked.map((w,i)=>(
                      <div key={i} style={{display:"flex", gap:8, marginBottom:i<sd.whatWorked.length-1?7:0}}>
                        <span style={{color:C.green, fontWeight:700, flexShrink:0, marginTop:1}}>✓</span>
                        <span style={{fontSize:13, color:C.greenDark, lineHeight:1.6}}>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Impact Cards ── */}
                {sd.impacts?.length > 0 && (
                  <>
                    <div style={{fontSize:9, fontWeight:700, color:C.muted,
                      letterSpacing:1.5, textTransform:"uppercase", marginBottom:9}}>
                      Where Impact Was Lost
                    </div>
                    {sd.impacts.map((card,i)=>{
                      const is = impactStyle(card.level);
                      return (
                        <div key={i} style={{background:is.bg,
                          border:"1px solid "+is.border,
                          borderRadius:10, padding:"12px 15px", marginBottom:9}}>
                          <div style={{display:"flex", alignItems:"center",
                            gap:7, marginBottom:7}}>
                            <span style={{fontSize:9, fontWeight:700, color:is.lc,
                              letterSpacing:1.2, textTransform:"uppercase",
                              border:"1px solid "+is.lc, borderRadius:4,
                              padding:"1px 5px"}}>
                              {card.level}
                            </span>
                          </div>
                          <p style={{fontSize:13, color:C.text, lineHeight:1.6,
                            margin:"0 0 7px", fontWeight:500}}>
                            {card.observation}
                          </p>
                          <p style={{fontSize:12, color:C.textSoft, lineHeight:1.55,
                            margin:"0 0 "+(card.principle?"6px":"0")}}>
                            {card.why}
                          </p>
                          {card.principle && (
                            <p style={{fontSize:11, color:is.lc, fontStyle:"italic",
                              margin:0, lineHeight:1.5, fontWeight:500}}>
                              {card.principle}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            ) : (
              /* Fallback: hardcoded feedback while scoring or if no SHARP data */
              <>
                <div style={{background:"#1C1C1C", borderRadius:10,
                  padding:"12px 15px", marginBottom:9}}>
                  <div style={{fontSize:9, fontWeight:700, color:"#888",
                    letterSpacing:1.5, textTransform:"uppercase", marginBottom:4}}>
                    Summary
                  </div>
                  <div style={{fontSize:13, color:"#fff", lineHeight:1.6, fontWeight:600}}>
                    {s.headline}
                  </div>
                </div>
                <div style={{background:C.greenPale, borderRadius:10,
                  padding:"12px 15px", marginBottom:9}}>
                  <div style={{fontSize:9, fontWeight:700, color:C.greenDark,
                    letterSpacing:1.5, textTransform:"uppercase", marginBottom:4}}>
                    What Worked
                  </div>
                  <div style={{fontSize:13, color:C.greenDark, lineHeight:1.6}}>
                    {s.worked}
                  </div>
                </div>
                <div style={{background:C.amberPale, borderRadius:10,
                  padding:"12px 15px", marginBottom:9}}>
                  <div style={{fontSize:9, fontWeight:700, color:C.amberDark,
                    letterSpacing:1.5, textTransform:"uppercase", marginBottom:4}}>
                    To Improve
                  </div>
                  <div style={{fontSize:13, color:C.amberDark, lineHeight:1.6}}>
                    {s.improve}
                  </div>
                </div>
              </>
            )}

            <button onClick={()=>setScreen(fbReturnScreen)}
              style={{width:"100%", padding:"11px", background:C.crimson,
                color:"#fff", border:"none", borderRadius:10,
                fontSize:13, fontWeight:700, cursor:"pointer", marginTop:5}}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. OTHER FEEDBACK MODAL
  // ═══════════════════════════════════════════════════════════════════════════
  const OtherFeedbackModal = () => {
    if (!otherFb) return null;
    const { name, result, answer } = otherFb;
    const impBg = lvl => lvl==="high" ? {bg:C.crimsonPale, border:C.crimsonBorder}
                       : lvl==="medium" ? {bg:C.amberPale, border:"#FDE68A"}
                       : {bg:C.tag, border:C.border};
    return (
      <div onClick={()=>setOtherFb(null)}
        style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.4)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:200, padding:"20px"}}>
        <div onClick={e=>e.stopPropagation()}
          style={{background:C.card, borderRadius:16, width:"100%", maxWidth:500,
            maxHeight:"88vh", overflowY:"auto",
            boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>

          {/* Header */}
          <div style={{padding:"16px 20px", borderBottom:"1px solid "+C.border,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            position:"sticky", top:0, background:C.card, zIndex:10}}>
            <div>
              <div style={{fontSize:10, color:C.muted, letterSpacing:1.2,
                textTransform:"uppercase", marginBottom:3}}>Feedback</div>
              <div style={{fontSize:15, fontWeight:700, color:C.text}}>{name}</div>
            </div>
            <button onClick={()=>setOtherFb(null)}
              style={{background:C.borderLight, border:"none", color:C.muted,
                width:28, height:28, borderRadius:"50%", cursor:"pointer",
                fontSize:16, display:"flex", alignItems:"center",
                justifyContent:"center", flexShrink:0}}>
              ✕
            </button>
          </div>

          <div style={{padding:"20px"}}>
            {result ? (
              <>
                {/* Score + one-liner */}
                <div style={{textAlign:"center", marginBottom:18}}>
                  <span style={{background:scoreBg(result.score), color:scoreClr(result.score),
                    fontWeight:800, fontSize:22, padding:"6px 20px", borderRadius:30}}>
                    {result.score}/10
                  </span>
                  {result.oneLiner && (
                    <p style={{fontSize:13, color:C.textSoft, margin:"12px 0 0",
                      fontStyle:"italic", lineHeight:1.6}}>"{result.oneLiner}"</p>
                  )}
                </div>

                {/* Their response */}
                <div style={{background:C.bg, borderRadius:10, padding:"12px 14px",
                  marginBottom:18, border:"1px solid "+C.border}}>
                  <div style={{fontSize:10, fontWeight:700, color:C.muted,
                    letterSpacing:1.2, textTransform:"uppercase", marginBottom:7}}>
                    Their Response
                  </div>
                  <p style={{fontSize:13, color:C.text, lineHeight:1.65, margin:0}}>{answer}</p>
                </div>

                {/* What worked */}
                {result.whatWorked?.length > 0 && (
                  <div style={{marginBottom:18}}>
                    <div style={{fontSize:11, fontWeight:700, color:C.green,
                      letterSpacing:1.4, textTransform:"uppercase", marginBottom:10}}>
                      What Worked
                    </div>
                    {result.whatWorked.map((w,i)=>(
                      <div key={i} style={{display:"flex", gap:9,
                        marginBottom:i<result.whatWorked.length-1?9:0,
                        alignItems:"flex-start"}}>
                        <span style={{width:6, height:6, borderRadius:"50%",
                          background:C.green, flexShrink:0, marginTop:7}}/>
                        <span style={{fontSize:13, color:C.text, lineHeight:1.65}}>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Impact cards */}
                {result.impacts?.length > 0 && (
                  <div style={{marginBottom:18}}>
                    <div style={{fontSize:11, fontWeight:700, color:C.crimson,
                      letterSpacing:1.4, textTransform:"uppercase", marginBottom:10}}>
                      Where Impact Was Lost
                    </div>
                    {result.impacts.map((card,i)=>{
                      const st = impBg(card.level);
                      return (
                        <div key={i} style={{background:st.bg, border:"1px solid "+st.border,
                          borderRadius:10, padding:"12px 14px",
                          marginBottom:i<result.impacts.length-1?10:0}}>
                          <p style={{fontSize:13, color:C.text, lineHeight:1.6,
                            margin: card.why ? "0 0 6px" : 0}}>
                            {card.observation}
                          </p>
                          {card.why && (
                            <p style={{fontSize:12, color:C.textSoft,
                              lineHeight:1.55, margin:0}}>{card.why}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <p style={{fontSize:13, color:C.muted, textAlign:"center",
                fontStyle:"italic", margin:"8px 0 16px"}}>
                Feedback not available for this response yet.
              </p>
            )}

            <button onClick={()=>setOtherFb(null)}
              style={{width:"100%", padding:"11px", background:C.crimson,
                color:"#fff", border:"none", borderRadius:10,
                fontSize:13, fontWeight:700, cursor:"pointer"}}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. COMMUNITY SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  const CommunityScreen = () => {
    // Instance users: real DB answers filtered to their instance
    const instOthers = communityData
      ? communityData
          .filter(sub => sub.answers && (sub.answers[commSc] || sub.answers[String(commSc)]))
          .filter(sub => sub.name.toLowerCase() !== userName.toLowerCase())
      : null;

    return (
    <div style={{minHeight:"calc(100vh - 38px)", background:C.bg}}>
      {otherFb && OtherFeedbackModal()}
      <TopNav userName={userName} userEmail={userEmail} onLogout={doLogout}
        back={{label:"Results", onClick:()=>setScreen("results")}} />

      <div style={{maxWidth:680, margin:"0 auto", padding:"22px 20px 48px"}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between",
          flexWrap:"wrap", gap:10, marginBottom:16}}>
          <h2 style={{fontSize:22, fontWeight:700, color:C.text,
            fontFamily:"Georgia,serif", margin:0}}>
            Community Responses
          </h2>
          {instanceName && (
            <div style={{display:"inline-flex", alignItems:"center", gap:5,
              background:C.crimsonPale, border:"1px solid "+C.crimsonBorder,
              borderRadius:8, padding:"5px 11px",
              fontSize:11, fontWeight:700, color:C.crimson}}>
              🔒 Instance: {instanceName}
            </div>
          )}
        </div>

        <div style={{display:"flex", gap:6, overflowX:"auto",
          marginBottom:22, paddingBottom:3}}>
          {activeScenarios.map((s,i)=>{
            const pos = i + 1;
            return (
            <button key={s.id} onClick={()=>setCommSc(pos)}
              style={{padding:"6px 14px", borderRadius:99, border:"1.5px solid",
                borderColor:commSc===pos?C.crimson:C.border,
                background:commSc===pos?C.crimsonPale:C.card,
                color:commSc===pos?C.crimson:C.muted,
                fontSize:12, fontWeight:600, cursor:"pointer",
                whiteSpace:"nowrap", flexShrink:0}}>
              {pos}. {s.short}
            </button>
            );
          })}
        </div>

        {commSc_obj && (
          <div style={{background:C.card, borderRadius:12,
            border:"1px solid "+C.border, overflow:"hidden", marginBottom:14}}>
            <div style={{padding:"13px 17px", borderBottom:"1px solid "+C.borderLight}}>
              <div style={{fontSize:10, fontWeight:700, color:C.muted,
                letterSpacing:1.5, textTransform:"uppercase", marginBottom:7}}>
                Scenario {commSc}
              </div>
              <p style={{fontSize:14, color:C.text, lineHeight:1.7,
                margin:0, fontStyle:"italic", fontWeight:500}}>
                "{commSc_obj.text}"
              </p>
            </div>
            <div style={{padding:"12px 17px", background:"#FDFCFB"}}>
              <div style={{fontSize:10, fontWeight:700, color:C.muted,
                letterSpacing:1.5, textTransform:"uppercase", marginBottom:8}}>
                Context
              </div>
              {commSc_obj.ctx.map((c,i)=>(
                <div key={i} style={{display:"flex", gap:8, marginBottom:5}}>
                  <span style={{color:C.crimson, fontWeight:700, fontSize:12,
                    flexShrink:0, marginTop:2}}>→</span>
                  <span style={{fontSize:12, color:C.text, lineHeight:1.5}}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {myAns && (
          <div style={{background:C.card, borderRadius:12,
            border:"2px solid "+C.crimson, padding:"14px 16px", marginBottom:18}}>
            <div style={{display:"flex", alignItems:"center", gap:9, marginBottom:11}}>
              <span style={{fontSize:18, flexShrink:0}}>🏅</span>
              <div style={{width:30, height:30, borderRadius:"50%",
                background:C.crimsonLight, display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:11, fontWeight:700,
                color:C.crimson, flexShrink:0}}>
                {myAns.init}
              </div>
              <span style={{fontSize:13, fontWeight:700, color:C.text, flex:1}}>
                {myAns.name}
              </span>
              <span style={{fontSize:9, fontWeight:700, background:C.crimsonLight,
                color:C.crimson, padding:"2px 7px", borderRadius:8, marginRight:4}}>
                YOU
              </span>
              {myAns.score !== null && (
                <span style={{background:scoreBg(myAns.score), color:scoreClr(myAns.score),
                  fontWeight:700, fontSize:12, padding:"3px 10px", borderRadius:20, flexShrink:0}}>
                  {myAns.score}/10
                </span>
              )}
            </div>
            <p style={{fontSize:13, color:C.text, lineHeight:1.65, margin:"0 0 12px"}}>
              {myAns.answer}
            </p>
            <div style={{display:"flex", justifyContent:"flex-end"}}>
              <button
                onClick={()=>{setFbOpen(commSc);setFbReturnScreen("community");setScreen("feedback");}}
                style={{background:"none", border:"1px solid "+C.border,
                  color:C.text, fontSize:12, fontWeight:500,
                  padding:"5px 13px", borderRadius:8, cursor:"pointer",
                  fontFamily:"inherit"}}>
                View Feedback →
              </button>
            </div>
          </div>
        )}

        <div style={{display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:12}}>
          <span style={{fontSize:12, color:C.muted}}>
            {(instOthers !== null ? instOthers : othersForSc).length} other responses
          </span>
          {instOthers === null && (
            <div style={{display:"flex", gap:6}}>
              {["best","latest"].map(opt=>(
                <button key={opt} onClick={()=>setSortBy(opt)}
                  style={{padding:"4px 11px", borderRadius:20,
                    border:"1px solid "+C.border,
                    background:sortBy===opt?C.crimson:C.card,
                    color:sortBy===opt?"#fff":C.muted,
                    fontSize:11, fontWeight:600, cursor:"pointer"}}>
                  {opt==="best"?"Best Rated":"Latest"}
                </button>
              ))}
            </div>
          )}
        </div>

        {instOthers !== null ? (
          instOthers.length === 0 ? (
            <div style={{textAlign:"center", padding:"32px 0",
              fontSize:13, color:C.muted, fontStyle:"italic"}}>
              No other responses in your instance yet.
            </div>
          ) : instOthers.map((sub, i) => {
            const subResult = sub.sharp_results?.[commSc] || sub.sharp_results?.[String(commSc)] || null;
            const subAnswer = sub.answers[commSc] || sub.answers[String(commSc)];
            return (
            <div key={i} style={{background:C.card, borderRadius:12,
              padding:"14px 16px", marginBottom:9, border:"1px solid "+C.border}}>
              <div style={{display:"flex", alignItems:"center", gap:9, marginBottom:11}}>
                <div style={{width:30, height:30, borderRadius:"50%",
                  background:"#EDE8E3", display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:10, fontWeight:700,
                  color:C.muted, flexShrink:0}}>
                  {sub.name[0].toUpperCase()}
                </div>
                <span style={{fontSize:13, fontWeight:600, color:C.text, flex:1}}>
                  {sub.name}
                </span>
                {subResult?.score != null && (
                  <span style={{background:scoreBg(subResult.score), color:scoreClr(subResult.score),
                    fontWeight:700, fontSize:12, padding:"3px 10px",
                    borderRadius:20, flexShrink:0}}>
                    {subResult.score}/10
                  </span>
                )}
              </div>
              <p style={{fontSize:13, color:C.text, lineHeight:1.65, margin:"0 0 11px"}}>
                {subAnswer}
              </p>
              <div style={{display:"flex", justifyContent:"flex-end"}}>
                <button
                  onClick={()=>setOtherFb({ name: sub.name, result: subResult, answer: subAnswer })}
                  style={{background:"none", border:"1px solid "+C.border,
                    color:C.text, fontSize:12, fontWeight:500,
                    padding:"5px 13px", borderRadius:8, cursor:"pointer",
                    fontFamily:"inherit"}}>
                  View Feedback →
                </button>
              </div>
            </div>
            );
          })
        ) : (
          othersSorted.map(ans=>(
            <div key={ans.id} style={{background:C.card, borderRadius:12,
              padding:"14px 16px", marginBottom:9, border:"1px solid "+C.border}}>
              <div style={{display:"flex", alignItems:"flex-start",
                gap:9, marginBottom:9}}>
                <div style={{width:30, height:30, borderRadius:"50%",
                  background:"#EDE8E3", display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:10, fontWeight:700,
                  color:C.muted, flexShrink:0}}>
                  {ans.init}
                </div>
                <div style={{flex:1}}>
                  <span style={{fontSize:13, fontWeight:600, color:C.text}}>
                    {ans.name}
                  </span>
                </div>
                <span style={{background:scoreBg(ans.score), color:scoreClr(ans.score),
                  fontWeight:700, fontSize:12, padding:"3px 10px",
                  borderRadius:20, flexShrink:0}}>
                  {ans.score}/10
                </span>
              </div>
              <p style={{fontSize:13, color:C.text, lineHeight:1.65,
                margin:"0 0 11px 39px"}}>
                {ans.answer}
              </p>
              <div style={{display:"flex", justifyContent:"flex-end"}}>
                <button onClick={()=>{setInsightOpen(ans.id);setScreen("insight");}}
                  style={{background:"none", border:"1px solid "+C.border,
                    color:C.text, fontSize:12, fontWeight:500,
                    padding:"5px 13px", borderRadius:8, cursor:"pointer"}}>
                  View Insight →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. INSIGHT MODAL
  // ═══════════════════════════════════════════════════════════════════════════
  const InsightModal = () => {
    const ans = COMMUNITY.find(a=>a.id===insightOpen)||COMMUNITY[0];
    return (
      <div onClick={()=>setScreen("community")}
        style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.38)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:200, padding:"20px"}}>
        <div onClick={e=>e.stopPropagation()}
          style={{background:C.card, borderRadius:16, width:"100%", maxWidth:460,
            maxHeight:"82vh", overflowY:"auto",
            boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>

          <div style={{padding:"15px 19px", borderBottom:"1px solid "+C.border,
            display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <div style={{display:"flex", alignItems:"center", gap:9}}>
              <div style={{width:30, height:30, borderRadius:"50%",
                background:ans.own?C.crimsonLight:"#EDE8E3",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:10, fontWeight:700,
                color:ans.own?C.crimson:C.muted}}>
                {ans.own?(userName?.[0]?.toUpperCase()||"Y"):ans.init}
              </div>
              <div>
                <div style={{fontSize:13, fontWeight:700, color:C.text}}>
                  {ans.own?"Your Answer":ans.name}
                </div>
                <div style={{fontSize:10, color:C.muted}}>AI Insight</div>
              </div>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:8}}>
              <span style={{background:scoreBg(ans.score), color:scoreClr(ans.score),
                fontWeight:700, fontSize:13, padding:"3px 11px", borderRadius:20}}>
                {ans.score}/10
              </span>
              <button onClick={()=>setScreen("community")}
                style={{background:C.borderLight, border:"none", color:C.muted,
                  width:27, height:27, borderRadius:"50%", cursor:"pointer",
                  fontSize:14, display:"flex", alignItems:"center", justifyContent:"center"}}>
                ✕
              </button>
            </div>
          </div>

          <div style={{padding:"17px 19px 21px"}}>
            <div style={{background:"#FDFCFB", borderLeft:"3px solid "+C.crimson,
              padding:"9px 13px", borderRadius:"0 8px 8px 0",
              marginBottom:13, fontSize:13, color:C.text,
              lineHeight:1.65, fontStyle:"italic"}}>
              "{ans.answer}"
            </div>

            {[
              {label:"AI Assessment", text:ans.ih, bg:"#1C1C1C", tc:"#fff",       lc:"#888"},
              {label:"What Works",    text:ans.iw, bg:C.greenPale, tc:C.greenDark, lc:C.greenDark},
              ...(ans.ii!=="Nothing."&&ans.ii!=="Nothing — this is the target."
                ?[{label:"Could Be Better",text:ans.ii,bg:C.amberPale,tc:C.amberDark,lc:C.amberDark}]
                :[])
            ].map(b=>(
              <div key={b.label} style={{background:b.bg, borderRadius:10,
                padding:"11px 14px", marginBottom:9}}>
                <div style={{fontSize:9, fontWeight:700, color:b.lc,
                  letterSpacing:1.5, textTransform:"uppercase", marginBottom:4}}>
                  {b.label}
                </div>
                <div style={{fontSize:13, color:b.tc, lineHeight:1.6,
                  fontWeight:b.bg==="#1C1C1C"?600:400}}>{b.text}</div>
              </div>
            ))}

            <button onClick={()=>setScreen("community")}
              style={{width:"100%", padding:"11px", background:C.crimson,
                color:"#fff", border:"none", borderRadius:10,
                fontSize:13, fontWeight:700, cursor:"pointer", marginTop:4}}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  // userAnswers is non-null as soon as the user has submitted (either just now or from DB)
  const hasSubmitted = userAnswers !== null;

  if (isModerator) {
    return (
      <ModeratorPanel onLogout={() => {
        setIsModerator(false);
        setEmailVal("");
        setNameVal("");
        setLoginErr("");
      }} />
    );
  }

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {userName && !submitting && hasSubmitted && DemoNav()}

      {submitting
        ? SubmittingScreen()
        : <>
            {screen==="login"     && LoginScreen()}
            {screen==="start"     && (hasSubmitted ? ResultsScreen() : StartScreen())}
            {screen==="answering" && (hasSubmitted ? ResultsScreen() : AnsweringScreen())}
            {screen==="results"   && (hasSubmitted ? ResultsScreen()  : StartScreen())}
            {screen==="feedback"  && (hasSubmitted ? <>{fbReturnScreen==="community"?CommunityScreen():ResultsScreen()}{FeedbackModal()}</> : StartScreen())}
            {screen==="community" && (hasSubmitted ? CommunityScreen() : StartScreen())}
            {screen==="insight"   && (hasSubmitted ? <>{CommunityScreen()}{InsightModal()}</> : StartScreen())}
          </>
      }
    </div>
  );
}
