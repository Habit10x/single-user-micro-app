"use client";

import { useState, useEffect } from "react";

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
const SCENARIOS = [
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
const COMMUNITY = [
  { id:1, sid:1, name:"Priya N.",  init:"PN", own:false, score:9,
    answer:"Horizon is on track for Friday. 4 of 6 emails done — legal review on Email 3 resolved. One urgent item: design team needs to decide on header format by Tuesday or we slip 3 days.",
    ih:"Every required element, tight sequence.", iw:"Status first, specific count, resolved item cleaned up, risk named with deadline and consequence.", ii:"Nothing — this is what 9/10 looks like." },
  { id:2, sid:1, name:"Marcus T.", init:"MT", own:false, score:5,
    answer:"Project's going well — nearly done with the emails. Had a small delay with legal but that's sorted. Should be done by Friday assuming the design team gets back to us.",
    ih:"The risk is buried in a conditional at the end.", iw:"Status is broadly communicated.", ii:"'Assuming the design team gets back to us' is the entire risk in disguise. Name it explicitly." },
  { id:3, sid:1, name:"You",       init:"Yo", own:true,  score:8,
    answer:"The Horizon project is on track for next Friday. We've completed 4 of 6 emails — Email 3 needed an extra legal review but that's resolved. One open item: design team needs to decide on header format by Tuesday or we risk a 3-day delay.",
    ih:"Strong — risk sequencing is the one fix.", iw:"Opened with status. Specific count. Resolved delay handled efficiently in one clause.", ii:"Move the design risk directly after status. Resolved issues are past — open risks are now." },
  { id:4, sid:1, name:"Arun K.",   init:"AK", own:false, score:9,
    answer:"On track for next Friday. 4 emails complete, one legal review resolved. Design team needs to confirm header format by Tuesday — if not, we slip 3 days.",
    ih:"Tightest version in the group.", iw:"Every sentence is load-bearing. Status → resolved → live risk with consequence.", ii:"Nothing — this is the target." },
  { id:5, sid:2, name:"Fatima R.", init:"FR", own:false, score:9,
    answer:"Watch it — but go in knowing it's two different shows. Eps 1–4 are gripping; I did all four in one sitting. Eps 5–6 slow right down when romance takes over. The finale reveal lands but the last 20 min rush. Given you hate shows that drag — stick through the dip.",
    ih:"Leads with recommendation, sets expectation, uses specific detail.", iw:"The 'two different shows' framing prepares the friend perfectly.", ii:"Nothing." },
  { id:6, sid:2, name:"You",       init:"Yo", own:true,  score:5,
    answer:"Yes definitely watch it! It's really good and I think you'll enjoy it. The story is interesting and the characters are well developed. Some parts are slow but overall it's worth it I think.",
    ih:"Recommendation is clear but evidence is generic.", iw:"Led with yes — correct.", ii:"'Interesting story' says nothing. Use specifics: 4 eps in one sitting, then a dip, then a satisfying ending." },
];

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
export default function SharpApp() {
  const [screen,      setScreen]      = useState("login");
  const [nameVal,     setNameVal]     = useState("");
  const [emailVal,    setEmailVal]    = useState("");
  const [loginErr,    setLoginErr]    = useState("");
  const [userName,    setUserName]    = useState("");

  const [q,           setQ]           = useState(1);
  const [texts,       setTexts]       = useState({});
  const [fbOpen,      setFbOpen]      = useState(null);
  const [insightOpen, setInsightOpen] = useState(null);
  const [commSc,      setCommSc]      = useState(1);
  const [sortBy,      setSortBy]      = useState("best");
  const [userEmail,   setUserEmail]   = useState("");
  const [userAnswers, setUserAnswers] = useState(null); // answers from DB for returning users
  const [loginLoading,setLoginLoading]= useState(false);
  const [loginEnabled,setLoginEnabled]= useState(true);
  const [submitting,  setSubmitting]  = useState(false);

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
      .then(d=>setLoginEnabled(d.login_enabled!==false))
      .catch(()=>{});
  },[]);

  const total      = SCENARIOS.length;
  const scenario   = SCENARIOS[q-1];
  const overall    = (SCENARIOS.reduce((a,s)=>a+s.score,0)/total).toFixed(1);
  const commSc_obj = SCENARIOS.find(s=>s.id===commSc);

  const othersForSc  = COMMUNITY.filter(a=>a.sid===commSc && !a.own);
  // Use real DB answer if available, otherwise fall back to hardcoded sample
  const myAns = userAnswers?.[commSc] || userAnswers?.[String(commSc)]
    ? { id: 0, sid: commSc, name: userName, init: userName?.[0]?.toUpperCase()||"Y",
        own: true, score: null,
        answer: userAnswers[commSc] || userAnswers[String(commSc)],
        ih: null, iw: null, ii: null }
    : COMMUNITY.find(a=>a.sid===commSc && a.own);
  const othersSorted = [...othersForSc].sort((a,b)=>
    sortBy==="best" ? b.score-a.score : a.id-b.id
  );

  const doLogin = async () => {
    if (loginEnabled && !nameVal.trim()) { setLoginErr("Please enter your name."); return; }
    if (!emailVal.includes("@")) { setLoginErr("Please enter a valid email."); return; }

    setLoginLoading(true);
    setLoginErr("");

    try {
      const res  = await fetch(`/api/check-submission?email=${encodeURIComponent(emailVal.trim())}`);
      const data = await res.json();

      if (data.submitted) {
        // Returning user — go straight to results
        setUserName(data.name);
        setUserEmail(emailVal.trim().toLowerCase());
        setUserAnswers(data.answers); // keyed by scenario id string e.g. {"1":"...","2":"..."}
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
  };

  const fetchCommunityData = async (instId) => {
    try {
      const res  = await fetch(`/api/community?instance_id=${instId}`);
      const data = await res.json();
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
        await fetchCommunityData(data.id);
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
    const screens = ["results","community","feedback","insight"];
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

      <div style={{textAlign:"center", marginBottom:28}}>
        <div style={{fontSize:13, color:C.muted}}>Communication Skills Practice</div>
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
      </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. EXERCISE START PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const StartScreen = () => (
    <div style={{minHeight:"100vh", background:C.bg}}>
      <TopNav userName={userName} userEmail={userEmail} onLogout={doLogout} />

      <div style={{maxWidth:700, margin:"0 auto", padding:"0 20px 48px"}}>
        <div style={{width:"100%", aspectRatio:"16/6", background:"#E8D5D5",
          borderRadius:16, margin:"28px 0 26px", overflow:"hidden",
          display:"flex", alignItems:"center", justifyContent:"center",
          position:"relative"}}>
          <div style={{fontSize:72, opacity:0.35}}>🎯</div>
          <div style={{position:"absolute", inset:0,
            background:"linear-gradient(to bottom,transparent 55%,rgba(250,250,248,0.5))"}}/>
        </div>

        <div style={{marginBottom:10}}>
          <Tag label="PRACTICE EXERCISE" />
        </div>

        <h1 style={{fontSize:36, fontWeight:800, color:C.crimson,
          fontFamily:"Georgia,serif", margin:"0 0 12px", lineHeight:1.15}}>
          Articulation-01
        </h1>
        <p style={{fontSize:15, color:C.textSoft, margin:"0 0 20px", lineHeight:1.65}}>
          This test will help you in your articulation.
        </p>

        <div style={{display:"flex", flexWrap:"wrap", gap:8, marginBottom:26}}>
          <Tag icon="📊" label="Intermediate" />
          <Tag icon="🎙" label="Articulation" />
          <Tag icon="📋" label={`${total} Scenarios`} />
          <Tag icon="⏱" label="5 Minute Timer" highlight />
        </div>

        <hr style={{border:"none", borderTop:"1px solid "+C.border, margin:"0 0 28px"}} />

        <h2 style={{fontSize:24, fontWeight:700, color:C.text,
          fontFamily:"Georgia,serif", margin:"0 0 20px"}}>
          Guidelines
        </h2>
        {[
          "Read the scenarios carefully.",
          "Answer in detail.",
          "Try to be natural.",
          "Scores and feedback unlock after all scenarios are submitted.",
        ].map((g,i)=>(
          <div key={i} style={{display:"flex", gap:14, marginBottom:14,
            alignItems:"flex-start"}}>
            <div style={{width:26, height:26, borderRadius:"50%", flexShrink:0,
              background:C.crimsonLight, display:"flex", alignItems:"center",
              justifyContent:"center", fontSize:12, fontWeight:700,
              color:C.crimson, marginTop:1}}>
              {i+1}
            </div>
            <span style={{fontSize:15, color:C.text, lineHeight:1.6, paddingTop:2}}>{g}</span>
          </div>
        ))}

        <hr style={{border:"none", borderTop:"1px solid "+C.border, margin:"28px 0"}} />

        <div style={{textAlign:"center"}}>
          <button onClick={()=>setScreen("answering")}
            style={{background:C.crimson, color:"#fff", border:"none",
              borderRadius:10, padding:"14px 44px", fontSize:15, fontWeight:700,
              cursor:"pointer", fontFamily:"inherit", letterSpacing:0.3}}>
            Start Exercise →
          </button>
        </div>
      </div>
    </div>
  );

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
          <div style={{display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:8}}>
            <span style={{fontSize:12, color:C.muted}}>Scenario {q} of {total}</span>
            <span style={{fontSize:12, color:C.muted}}>Clear Articulation</span>
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
              margin:0, fontStyle:"italic", fontWeight:500}}>
              "{scenario.text}"
            </p>
          </div>
          <div style={{padding:"14px 18px", background:"#FDFCFB"}}>
            <div style={{fontSize:10, fontWeight:700, color:C.muted,
              letterSpacing:1.5, textTransform:"uppercase", marginBottom:9}}>
              What You Know
            </div>
            {scenario.ctx.map((c,i)=>(
              <div key={i} style={{display:"flex", gap:9, marginBottom:6,
                alignItems:"flex-start"}}>
                <span style={{color:C.crimson, fontWeight:700, fontSize:13,
                  flexShrink:0, marginTop:2}}>→</span>
                <span style={{fontSize:13, color:C.text, lineHeight:1.55}}>{c}</span>
              </div>
            ))}
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
              setSubmitting(true);
              try {
                await fetch("/api/submit", {
                  method:"POST",
                  headers:{"Content-Type":"application/json"},
                  body: JSON.stringify({
                    email:       instanceId ? null : userEmail,
                    name:        userName,
                    answers:     texts,
                    instance_id: instanceId || null,
                  }),
                });
                setUserAnswers(texts);
                if (instanceId) await fetchCommunityData(instanceId);
              } catch { /* non-fatal — still show results */ }
              setSubmitting(false);
              setScreen("results");
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
          fontFamily:"Georgia,serif", letterSpacing:1, marginBottom:4}}>SHARP</div>
        <div style={{fontSize:13, color:C.muted}}>Communication Skills Practice</div>
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
  const ResultsScreen = () => (
    <div style={{minHeight:"calc(100vh - 38px)", background:C.bg}}>
      <TopNav userName={userName} userEmail={userEmail} onLogout={doLogout} />

      <div style={{maxWidth:640, margin:"0 auto", padding:"28px 20px 48px"}}>
        <div style={{textAlign:"center", marginBottom:28}}>
          <div style={{width:60, height:60, borderRadius:"50%",
            background:C.greenPale, border:"2px solid "+C.green,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:26, margin:"0 auto 12px"}}>✓</div>
          <h1 style={{fontSize:24, fontWeight:700, color:C.text,
            fontFamily:"Georgia,serif", margin:"0 0 5px"}}>
            Exercise Complete
          </h1>
          <p style={{fontSize:14, color:C.muted, margin:0}}>
            Clear Articulation · {total} Scenarios
          </p>
          {userAnswers && (
            <div style={{marginTop:10, fontSize:12, color:C.muted,
              background:C.amberPale, border:"1px solid #FDE68A",
              borderRadius:8, padding:"7px 14px", display:"inline-block"}}>
              You've already submitted this exercise. Results are read-only.
            </div>
          )}
        </div>

        <div style={{background:C.crimson, borderRadius:14,
          padding:"22px 24px", marginBottom:22, textAlign:"center", color:"#fff"}}>
          <div style={{fontSize:11, letterSpacing:2,
            textTransform:"uppercase", opacity:0.7, marginBottom:5}}>
            Your Score
          </div>
          <div style={{display:"flex", alignItems:"baseline",
            justifyContent:"center", gap:4}}>
            <span style={{fontSize:54, fontWeight:800,
              fontFamily:"Georgia,serif", lineHeight:1}}>{overall}</span>
            <span style={{fontSize:20, opacity:0.65}}>/10</span>
          </div>
        </div>

        <div style={{marginBottom:22}}>
          <div style={{fontSize:11, fontWeight:700, color:C.muted,
            letterSpacing:1.5, textTransform:"uppercase", marginBottom:11}}>
            Scenario Breakdown
          </div>
          {SCENARIOS.map((s,i)=>(
            <div key={s.id} style={{background:C.card,
              border:"1px solid "+C.border, borderRadius:10,
              padding:"12px 15px", marginBottom:7,
              display:"flex", alignItems:"center", gap:11}}>
              <div style={{width:24, height:24, borderRadius:"50%",
                background:C.crimsonLight, display:"flex",
                alignItems:"center", justifyContent:"center",
                fontSize:11, fontWeight:700, color:C.crimson, flexShrink:0}}>
                {i+1}
              </div>
              <span style={{flex:1, fontSize:14, fontWeight:500, color:C.text}}>
                {s.short}
              </span>
              <span style={{background:scoreBg(s.score), color:scoreClr(s.score),
                fontWeight:700, fontSize:12, padding:"3px 10px",
                borderRadius:20, marginRight:5}}>
                {s.score}/10
              </span>
              <button onClick={()=>{setFbOpen(s.id);setScreen("feedback");}}
                style={{background:"none", border:"none", color:C.crimson,
                  fontSize:12, fontWeight:600, cursor:"pointer",
                  textDecoration:"underline", padding:0, fontFamily:"inherit"}}>
                Feedback
              </button>
            </div>
          ))}
        </div>

        <div style={{background:C.card, border:"1px solid "+C.border,
          borderRadius:14, padding:"20px 20px", textAlign:"center"}}>
          <div style={{fontSize:20, marginBottom:7}}>🎉</div>
          <div style={{fontSize:16, fontWeight:700, color:C.text, marginBottom:5}}>
            Community Responses Unlocked
          </div>
          <p style={{fontSize:13, color:C.muted, margin:"0 0 16px", lineHeight:1.6}}>
            See how other participants answered each scenario.
          </p>
          <button onClick={()=>setScreen("community")}
            style={{background:C.crimson, color:"#fff", border:"none",
              borderRadius:8, padding:"12px 24px", fontSize:14,
              fontWeight:700, cursor:"pointer", width:"100%"}}>
            Explore Community Responses →
          </button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. FEEDBACK MODAL
  // ═══════════════════════════════════════════════════════════════════════════
  const FeedbackModal = () => {
    const s = SCENARIOS.find(s=>s.id===fbOpen)||SCENARIOS[0];
    return (
      <div onClick={()=>setScreen("results")}
        style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.4)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:200, padding:"20px"}}>
        <div onClick={e=>e.stopPropagation()}
          style={{background:C.card, borderRadius:16, width:"100%", maxWidth:480,
            maxHeight:"85vh", overflowY:"auto",
            boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>

          <div style={{padding:"17px 20px", borderBottom:"1px solid "+C.border,
            display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:10, color:C.muted, letterSpacing:1.2,
                textTransform:"uppercase", marginBottom:3}}>
                Scenario {s.id} · Feedback
              </div>
              <div style={{fontSize:16, fontWeight:700, color:C.text}}>{s.full}</div>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:9}}>
              <span style={{background:scoreBg(s.score), color:scoreClr(s.score),
                fontWeight:700, fontSize:15, padding:"4px 12px", borderRadius:20}}>
                {s.score}/10
              </span>
              <button onClick={()=>setScreen("results")}
                style={{background:C.borderLight, border:"none", color:C.muted,
                  width:28, height:28, borderRadius:"50%", cursor:"pointer",
                  fontSize:16, display:"flex", alignItems:"center", justifyContent:"center"}}>
                ✕
              </button>
            </div>
          </div>

          <div style={{padding:"18px 20px 22px"}}>
            <div style={{marginBottom:14}}>
              <span style={{display:"inline-flex", alignItems:"center", gap:5,
                background:s.pf?C.greenPale:C.crimsonPale,
                padding:"4px 12px", borderRadius:99,
                fontSize:12, fontWeight:600, color:s.pf?C.green:C.crimson}}>
                {s.pf?"✅":"❌"} Point First: {s.pf?"Yes":"No"}
              </span>
            </div>

            {[
              {label:"Summary",    text:s.headline, bg:"#1C1C1C", tc:"#fff",      lc:"#888"},
              {label:"What Worked",text:s.worked,   bg:C.greenPale, tc:C.greenDark, lc:C.greenDark},
              {label:"To Improve", text:s.improve,  bg:C.amberPale, tc:C.amberDark, lc:C.amberDark},
            ].map(b=>(
              <div key={b.label} style={{background:b.bg, borderRadius:10,
                padding:"12px 15px", marginBottom:9}}>
                <div style={{fontSize:9, fontWeight:700, color:b.lc,
                  letterSpacing:1.5, textTransform:"uppercase", marginBottom:4}}>
                  {b.label}
                </div>
                <div style={{fontSize:13, color:b.tc, lineHeight:1.6,
                  fontWeight:b.bg==="#1C1C1C"?600:400}}>
                  {b.text}
                </div>
              </div>
            ))}

            <button onClick={()=>setScreen("results")}
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
  // 6. COMMUNITY SCREEN
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
          {SCENARIOS.map(s=>(
            <button key={s.id} onClick={()=>setCommSc(s.id)}
              style={{padding:"6px 14px", borderRadius:99, border:"1.5px solid",
                borderColor:commSc===s.id?C.crimson:C.border,
                background:commSc===s.id?C.crimsonPale:C.card,
                color:commSc===s.id?C.crimson:C.muted,
                fontSize:12, fontWeight:600, cursor:"pointer",
                whiteSpace:"nowrap", flexShrink:0}}>
              {s.id}. {s.short}
            </button>
          ))}
        </div>

        {commSc_obj && (
          <div style={{background:C.card, borderRadius:12,
            border:"1px solid "+C.border, overflow:"hidden", marginBottom:14}}>
            <div style={{padding:"13px 17px", borderBottom:"1px solid "+C.borderLight}}>
              <div style={{fontSize:10, fontWeight:700, color:C.muted,
                letterSpacing:1.5, textTransform:"uppercase", marginBottom:7}}>
                Scenario {commSc_obj.id}
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
            <div style={{display:"flex", alignItems:"center",
              justifyContent:"space-between", marginBottom:9}}>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <div style={{width:30, height:30, borderRadius:"50%",
                  background:C.crimsonLight, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:11, fontWeight:700, color:C.crimson}}>
                  {userName?.[0]?.toUpperCase()||"Y"}
                </div>
                <span style={{fontSize:13, fontWeight:700, color:C.text}}>
                  Your Answer
                </span>
                <span style={{fontSize:9, fontWeight:700,
                  background:C.crimsonLight, color:C.crimson,
                  padding:"2px 7px", borderRadius:8}}>YOU</span>
              </div>
              <div style={{display:"flex", alignItems:"center", gap:7}}>
                {myAns.score !== null && (
                  <span style={{background:scoreBg(myAns.score), color:scoreClr(myAns.score),
                    fontWeight:700, fontSize:12, padding:"3px 10px", borderRadius:20}}>
                    {myAns.score}/10
                  </span>
                )}
                {myAns.ih && (
                  <button onClick={()=>{setInsightOpen(myAns.id);setScreen("insight");}}
                    style={{background:C.crimson, border:"none", color:"#fff",
                      fontSize:11, fontWeight:600, padding:"5px 11px",
                      borderRadius:7, cursor:"pointer"}}>
                    My Feedback →
                  </button>
                )}
              </div>
            </div>
            <p style={{fontSize:13, color:C.text, lineHeight:1.65, margin:0}}>
              {myAns.answer}
            </p>
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
          ) : instOthers.map((sub, i) => (
            <div key={i} style={{background:C.card, borderRadius:12,
              padding:"14px 16px", marginBottom:9, border:"1px solid "+C.border}}>
              <div style={{display:"flex", alignItems:"center",
                gap:9, marginBottom:9}}>
                <div style={{width:30, height:30, borderRadius:"50%",
                  background:"#EDE8E3", display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:10, fontWeight:700,
                  color:C.muted, flexShrink:0}}>
                  {sub.name[0].toUpperCase()}
                </div>
                <span style={{fontSize:13, fontWeight:600, color:C.text}}>
                  {sub.name}
                </span>
              </div>
              <p style={{fontSize:13, color:C.text, lineHeight:1.65,
                margin:"0 0 0 39px"}}>
                {sub.answers[commSc] || sub.answers[String(commSc)]}
              </p>
            </div>
          ))
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
            {screen==="feedback"  && (hasSubmitted ? <>{ResultsScreen()}{FeedbackModal()}</> : StartScreen())}
            {screen==="community" && (hasSubmitted ? CommunityScreen() : StartScreen())}
            {screen==="insight"   && (hasSubmitted ? <>{CommunityScreen()}{InsightModal()}</> : StartScreen())}
          </>
      }
    </div>
  );
}
