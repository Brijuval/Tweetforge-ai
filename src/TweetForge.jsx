import { useState, useEffect } from "react";

/* ─── DATA ──────────────────────────────────────────────────────────────── */
const INDUSTRIES = ["Technology","Fashion & Beauty","Food & Beverage","Finance & Banking","Health & Wellness","E-commerce / Retail","Travel & Hospitality","Education","Entertainment","Automotive","Sports","FMCG","Other"];
const AUDIENCES  = ["Gen Z (18-24)","Millennials (25-40)","Gen X (41-56)","Parents & Families","Students","Working Professionals","Entrepreneurs","Tech Enthusiasts","Health-conscious Consumers","Luxury Buyers","General Public"];
const TONES = [
  {id:"professional", label:"Professional", icon:"◈", desc:"Formal · Expert"},
  {id:"casual",       label:"Casual",       icon:"◎", desc:"Relaxed · Friendly"},
  {id:"witty",        label:"Witty",        icon:"◐", desc:"Clever · Sharp"},
  {id:"bold",         label:"Bold",         icon:"◆", desc:"Direct · Fearless"},
  {id:"humorous",     label:"Humorous",     icon:"◑", desc:"Funny · Light"},
  {id:"inspirational",label:"Inspirational",icon:"◉", desc:"Uplifting · Vision"},
  {id:"premium",      label:"Premium",      icon:"◇", desc:"Luxury · Refined"},
  {id:"minimal",      label:"Minimal",      icon:"○", desc:"Clean · Simple"},
  {id:"authoritative",label:"Authoritative",icon:"◈", desc:"Confident · Leader"},
  {id:"playful",      label:"Playful",      icon:"◍", desc:"Fun · Energetic"},
  {id:"informative",  label:"Informative",  icon:"◪", desc:"Educational · Clear"},
  {id:"friendly",     label:"Friendly",     icon:"◌", desc:"Warm · Approachable"},
];
const THEMES = ["Product Features","Offers & Deals","Customer Stories","Trends & Culture","Memes","How-to / Tips","Behind the Scenes","Industry News","Motivation","Community","FAQs","Announcements"];
const STYLE_FILTERS = ["All","Promotional","Engaging","Witty","Informative","Inspirational","Question"];
const STYLE_META = {
  promotional:  {color:"#F59E0B", bg:"#FFFBEB", label:"Promotional"},
  engaging:     {color:"#10B981", bg:"#ECFDF5", label:"Engaging"},
  witty:        {color:"#EC4899", bg:"#FDF2F8", label:"Witty"},
  informative:  {color:"#3B82F6", bg:"#EFF6FF", label:"Informative"},
  inspirational:{color:"#8B5CF6", bg:"#F5F3FF", label:"Inspirational"},
  question:     {color:"#F97316", bg:"#FFF7ED", label:"Question"},
};

/* ─── GROQ API CALL ──────────────────────────────────────────────────────── */
async function callGroq(prompt) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Groq API key not found. Please add VITE_GROQ_API_KEY to your .env file.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a senior brand strategist and social media copywriter. You always respond with valid JSON only — no markdown, no explanation, no code fences. Just raw JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content || "";
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    throw new Error("Failed to parse AI response. Please try again.");
  }
}

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
function toggle(arr, v){ return arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v]; }

/* ─── SUBCOMPONENTS ──────────────────────────────────────────────────────── */
function DimBar({ label, value, delay=0 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value * 10), delay + 100);
    return () => clearTimeout(t);
  }, [value, delay]);
  const col = value>=8?"#10B981":value>=6?"#3B82F6":value>=4?"#F59E0B":"#EF4444";
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:12,fontWeight:500,color:"#94A3B8"}}>{label}</span>
        <span style={{fontSize:12,fontWeight:700,color:col}}>{value}<span style={{color:"#CBD5E1",fontWeight:400}}>/10</span></span>
      </div>
      <div style={{height:4,background:"#1E293B",borderRadius:99,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${w}%`,background:`linear-gradient(90deg,${col}99,${col})`,borderRadius:99,transition:"width 0.8s cubic-bezier(.4,0,.2,1)"}}/>
      </div>
    </div>
  );
}

function TweetCard({ tweet, index, globalIndex, onCopy, copied }) {
  const meta = STYLE_META[tweet.style?.toLowerCase()] || STYLE_META.engaging;
  const over = tweet.text.length > 280;
  const near = tweet.text.length > 250;
  return (
    <div
      style={{background:"#FFFFFF",border:"1px solid #F1F5F9",borderRadius:16,padding:"20px 22px",transition:"all 0.2s",animation:`slideUp 0.4s ease ${index*0.05}s both`}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="#E2E8F0";e.currentTarget.style.boxShadow="0 4px 24px rgba(0,0,0,0.06)";e.currentTarget.style.transform="translateY(-1px)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="#F1F5F9";e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none";}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
        <div style={{width:28,height:28,borderRadius:8,background:"#F8FAFC",border:"1px solid #E2E8F0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,fontWeight:700,color:"#94A3B8",marginTop:1}}>
          {String(globalIndex+1).padStart(2,"0")}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,gap:8}}>
            <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,background:meta.bg,color:meta.color,border:`1px solid ${meta.color}22`}}>
              {meta.label}
            </span>
            <button
              onClick={()=>onCopy(tweet.text,index)}
              style={{fontSize:11,padding:"4px 12px",borderRadius:7,border:"1px solid #E2E8F0",background:copied===index?"#ECFDF5":"#FAFAFA",color:copied===index?"#10B981":"#64748B",cursor:"pointer",fontFamily:"inherit",fontWeight:500,transition:"all 0.15s",flexShrink:0}}>
              {copied===index?"✓ Copied":"Copy"}
            </button>
          </div>
          <p style={{margin:0,fontSize:14,lineHeight:1.75,color:"#0F172A",fontFamily:"'Lora',Georgia,serif"}}>{tweet.text}</p>
          {tweet.note && <p style={{margin:"10px 0 0",fontSize:11,color:"#CBD5E1",fontStyle:"italic",lineHeight:1.5}}>{tweet.note}</p>}
          <div style={{marginTop:12,textAlign:"right",fontSize:11,fontWeight:500,color:over?"#EF4444":near?"#F59E0B":"#CBD5E1"}}>
            {tweet.text.length} / 280
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function TweetForge() {
  const [page, setPage] = useState("home");
  const [mode, setMode] = useState(null);
  const [analyzeStep, setAnalyzeStep] = useState("input");
  const [socialPlatform, setSocialPlatform] = useState("Twitter/X");
  const [socialPosts, setSocialPosts] = useState("");
  const [analyzedVoice, setAnalyzedVoice] = useState(null);
  const [loadingText, setLoadingText] = useState("");
  const [result, setResult] = useState(null);
  const [filter, setFilter] = useState("All");
  const [copied, setCopied] = useState(null);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    brandName:"", brandDescription:"", industry:"", targetAudience:"",
    tones:[], themes:[], productInfo:"", objective:"", keyThemes:""
  });
  const [manual, setManual] = useState({ tones:[], themes:[], audience:"", voiceSummary:"" });

  const setF = (k,v) => setForm(p=>({...p,[k]:v}));

  /* ── ANALYZE POSTS ── */
  async function handleAnalyze() {
    if(!socialPosts.trim()){setErr("Paste at least a few posts to analyse.");return;}
    setErr(""); setAnalyzeStep("loading");
    try {
      const data = await callGroq(`Analyse these ${socialPlatform} posts and extract the brand voice profile.

POSTS:
${socialPosts}

Return ONLY this JSON structure with no extra text:
{
  "dominantTones": ["tone1", "tone2"],
  "targetAudience": "description of target audience",
  "contentThemes": ["theme1", "theme2", "theme3"],
  "observations": ["observation1", "observation2", "observation3", "observation4"],
  "dimensions": {
    "professionalism": 7,
    "friendliness": 6,
    "humor": 5,
    "authority": 8,
    "engagement": 7
  }
}`);
      setAnalyzedVoice(data);
      setAnalyzeStep("done");
    } catch(e) {
      console.error(e);
      setErr("Analysis failed: " + e.message);
      setAnalyzeStep("input");
    }
  }

  /* ── GENERATE TWEETS ── */
  async function handleGenerate() {
    if(!form.brandName.trim()){setErr("Brand name is required.");return;}
    setErr(""); setPage("loading");
    const msgs = ["Mapping brand identity…","Calibrating voice profile…","Drafting tweet variations…","Refining tone consistency…","Finalising your 10 tweets…"];
    let i=0; setLoadingText(msgs[0]);
    const iv = setInterval(()=>{ i=Math.min(i+1,msgs.length-1); setLoadingText(msgs[i]); }, 1500);

    let voiceCtx = "";
    if(mode==="social" && analyzedVoice)
      voiceCtx = `Voice extracted from ${socialPlatform} posts — Tones: ${analyzedVoice.dominantTones.join(", ")}; Audience: ${analyzedVoice.targetAudience}; Themes: ${analyzedVoice.contentThemes.join(", ")}; Notes: ${analyzedVoice.observations.join("; ")}`;
    else if(mode==="manual")
      voiceCtx = `Manually defined — Tones: ${manual.tones.join(", ")||"not set"}; Themes: ${manual.themes.join(", ")||"not set"}; Audience: ${manual.audience||"not set"}; Notes: ${manual.voiceSummary||"none"}`;
    else
      voiceCtx = "Infer all voice attributes from the brand details provided.";

    const methodLabel = mode==="social"?"Social Media Analysis":mode==="manual"?"Manual Definition":"AI Inference";

    try {
      const data = await callGroq(`Generate 10 on-brand tweets for the following brand.

Brand Details:
- Name: ${form.brandName}
- Description: ${form.brandDescription||"Not provided"}
- Industry: ${form.industry||"Not specified"}
- Target Audience: ${form.targetAudience||"Not specified"}
- Products/Services: ${form.productInfo||"Not provided"}
- Campaign Objective: ${form.objective||"General brand awareness"}
- Key Topics: ${form.keyThemes||"Not specified"}
- Voice Profile (${methodLabel}): ${voiceCtx}

Tweet Requirements:
- Generate exactly: 2 promotional, 2 engaging, 2 witty, 2 informative, 1 inspirational, 1 question
- Each tweet must be under 280 characters
- Use 1-3 relevant hashtags per tweet
- Use emojis naturally where they fit the brand
- Make every tweet feel authentically on-brand

Return ONLY this JSON structure with no extra text:
{
  "brandVoice": {
    "dominantTones": ["tone1", "tone2", "tone3"],
    "targetAudience": "description",
    "contentThemes": ["theme1", "theme2", "theme3", "theme4"],
    "summary": ["bullet1", "bullet2", "bullet3", "bullet4"],
    "dimensions": {
      "professionalism": 7,
      "friendliness": 6,
      "humor": 5,
      "authority": 8,
      "engagement": 7
    },
    "method": "${methodLabel}"
  },
  "tweets": [
    {"text": "tweet text here", "style": "promotional", "note": "why this works"},
    {"text": "tweet text here", "style": "engaging", "note": "why this works"},
    {"text": "tweet text here", "style": "witty", "note": "why this works"},
    {"text": "tweet text here", "style": "informative", "note": "why this works"},
    {"text": "tweet text here", "style": "promotional", "note": "why this works"},
    {"text": "tweet text here", "style": "engaging", "note": "why this works"},
    {"text": "tweet text here", "style": "witty", "note": "why this works"},
    {"text": "tweet text here", "style": "informative", "note": "why this works"},
    {"text": "tweet text here", "style": "inspirational", "note": "why this works"},
    {"text": "tweet text here", "style": "question", "note": "why this works"}
  ]
}`);
      clearInterval(iv);
      setResult(data); setFilter("All"); setPage("result");
    } catch(e) {
      clearInterval(iv);
      console.error(e);
      setErr("Generation failed: " + e.message);
      setPage("form");
    }
  }

  function copyTweet(text, idx) {
    navigator.clipboard.writeText(text);
    setCopied(idx); setTimeout(()=>setCopied(null), 2000);
  }

  function exportTxt() {
    const lines = [
      `TweetForge Export — ${form.brandName}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Method: ${result.brandVoice.method}`,
      "",
      "── BRAND VOICE ──",
      `Tones: ${result.brandVoice.dominantTones.join(", ")}`,
      `Audience: ${result.brandVoice.targetAudience}`,
      `Themes: ${result.brandVoice.contentThemes.join(", ")}`,
      "",
      "── PERSONALITY ──",
      ...result.brandVoice.summary.map(s=>`• ${s}`),
      "",
      "── TWEETS ──",
      ...result.tweets.map((t,i)=>`\n${i+1}. [${t.style.toUpperCase()}]\n${t.text}\n(${t.text.length}/280 chars)`)
    ];
    const b = new Blob([lines.join("\n")], {type:"text/plain"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `${form.brandName.replace(/\s+/g,"_")}_tweets.txt`;
    a.click();
  }

  function reset() {
    setPage("home"); setMode(null); setAnalyzeStep("input");
    setAnalyzedVoice(null); setSocialPosts(""); setResult(null); setErr("");
    setForm({brandName:"",brandDescription:"",industry:"",targetAudience:"",tones:[],themes:[],productInfo:"",objective:"",keyThemes:""});
    setManual({tones:[],themes:[],audience:"",voiceSummary:""});
  }

  const filteredTweets = (result?.tweets||[]).filter(t=>
    filter==="All" || t.style?.toLowerCase()===filter.toLowerCase()
  );

  /* ─── CSS ─── */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    ::-webkit-scrollbar { width:5px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:#334155; border-radius:99px; }
    .tf-root { min-height:100vh; background:#F8FAFC; font-family:'Outfit',sans-serif; color:#0F172A; }
    .tf-nav { height:58px; background:#FFFFFF; border-bottom:1px solid #F1F5F9; display:flex; align-items:center; justify-content:space-between; padding:0 28px; position:sticky; top:0; z-index:200; }
    .tf-logo { font-weight:800; font-size:18px; letter-spacing:-0.5px; color:#0F172A; display:flex; align-items:center; gap:8px; }
    .tf-logo-dot { width:8px; height:8px; border-radius:50%; background:#6366F1; }
    .tf-hero { background:linear-gradient(135deg,#0F172A 0%,#1E1B4B 50%,#0F172A 100%); padding:80px 24px 90px; text-align:center; position:relative; overflow:hidden; }
    .tf-hero::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 60% 50% at 50% 0%,rgba(99,102,241,0.25) 0%,transparent 70%); }
    .tf-hero-tag { display:inline-flex; align-items:center; gap:7px; background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.3); border-radius:99px; padding:6px 16px; margin-bottom:24px; font-size:12px; font-weight:600; color:#A5B4FC; letter-spacing:0.08em; position:relative; }
    .tf-hero h1 { font-size:clamp(32px,6vw,58px); font-weight:800; line-height:1.1; color:#FFFFFF; letter-spacing:-1.5px; margin-bottom:18px; position:relative; }
    .tf-hero h1 em { font-style:normal; background:linear-gradient(135deg,#818CF8,#C084FC); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .tf-hero p { font-size:16px; color:#94A3B8; max-width:480px; margin:0 auto 36px; line-height:1.7; font-weight:300; position:relative; }
    .tf-hero-cta { display:inline-flex; align-items:center; gap:10px; background:#6366F1; color:#fff; border:none; border-radius:12px; padding:14px 32px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.2s; position:relative; }
    .tf-hero-cta:hover { background:#4F46E5; transform:translateY(-2px); box-shadow:0 12px 32px rgba(99,102,241,0.4); }
    .tf-hero-stats { display:flex; justify-content:center; gap:40px; margin-top:56px; position:relative; }
    .tf-hero-stat-num { font-size:28px; font-weight:800; color:#FFFFFF; letter-spacing:-1px; }
    .tf-hero-stat-label { font-size:12px; color:#64748B; margin-top:3px; }
    .tf-mode-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; }
    .tf-mode-card { background:#FFFFFF; border:1.5px solid #F1F5F9; border-radius:18px; padding:26px; cursor:pointer; transition:all 0.25s; }
    .tf-mode-card:hover { border-color:#6366F1; box-shadow:0 8px 32px rgba(99,102,241,0.12); transform:translateY(-3px); }
    .tf-field { width:100%; padding:11px 14px; border:1.5px solid #E2E8F0; border-radius:10px; font-size:14px; font-family:'Outfit',sans-serif; outline:none; transition:border 0.2s,box-shadow 0.2s; background:#FAFAFA; color:#0F172A; }
    .tf-field:focus { border-color:#6366F1; background:#fff; box-shadow:0 0 0 3px rgba(99,102,241,0.08); }
    .tf-field::placeholder { color:#CBD5E1; }
    select.tf-field { appearance:none; cursor:pointer; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' fill='none'%3E%3Cpath d='M1 1l5 4.5L11 1' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; }
    select.tf-field option { background:#fff; }
    .tf-label { font-size:12px; font-weight:600; color:#374151; margin-bottom:7px; display:block; letter-spacing:0.04em; }
    .tf-hint { font-size:11px; color:#94A3B8; margin-top:5px; }
    .tf-tone-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:8px; }
    .tf-tone-chip { padding:10px 12px; border-radius:10px; border:1.5px solid #E2E8F0; cursor:pointer; background:#FAFAFA; transition:all 0.15s; text-align:left; }
    .tf-tone-chip:hover { border-color:#A5B4FC; background:#EEF2FF; }
    .tf-tone-chip.on { border-color:#6366F1; background:#EEF2FF; }
    .tf-tone-chip-icon { font-size:18px; margin-bottom:4px; color:#6366F1; }
    .tf-tone-chip-label { font-size:12px; font-weight:700; color:#0F172A; }
    .tf-tone-chip.on .tf-tone-chip-label { color:#4338CA; }
    .tf-tone-chip-desc { font-size:10px; color:#94A3B8; margin-top:2px; }
    .tf-theme-chip { padding:7px 14px; border-radius:20px; border:1.5px solid #E2E8F0; cursor:pointer; background:#FAFAFA; font-size:12px; font-weight:500; color:#64748B; transition:all 0.15s; font-family:'Outfit',sans-serif; }
    .tf-theme-chip:hover { border-color:#A5B4FC; color:#4338CA; }
    .tf-theme-chip.on { border-color:#6366F1; background:#EEF2FF; color:#4338CA; font-weight:600; }
    .btn-primary { padding:13px 28px; border:none; border-radius:10px; background:#6366F1; color:#fff; font-size:14px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; transition:all 0.2s; }
    .btn-primary:hover { background:#4F46E5; box-shadow:0 6px 20px rgba(99,102,241,0.35); transform:translateY(-1px); }
    .btn-ghost { padding:9px 18px; border:1.5px solid #E2E8F0; border-radius:9px; background:#fff; font-size:13px; font-weight:600; cursor:pointer; font-family:'Outfit',sans-serif; color:#64748B; transition:all 0.15s; }
    .btn-ghost:hover { border-color:#6366F1; color:#4338CA; background:#F5F3FF; }
    .tf-card { background:#FFFFFF; border:1px solid #F1F5F9; border-radius:20px; padding:32px; }
    .tf-section-label { font-size:10px; font-weight:700; letter-spacing:0.12em; color:#94A3B8; text-transform:uppercase; margin-bottom:4px; }
    .tf-section-title { font-size:22px; font-weight:800; color:#0F172A; letter-spacing:-0.5px; margin-bottom:4px; }
    .tf-sidebar { background:#0F172A; border-radius:20px; padding:26px; color:#fff; }
    .tf-sidebar-label { font-size:10px; font-weight:700; letter-spacing:0.12em; color:#475569; text-transform:uppercase; margin-bottom:10px; }
    .tf-platform-tab { padding:8px 16px; border-radius:8px; border:1.5px solid #E2E8F0; background:#fff; font-size:12px; font-weight:600; cursor:pointer; font-family:'Outfit',sans-serif; color:#64748B; transition:all 0.15s; }
    .tf-platform-tab:hover { border-color:#6366F1; color:#4338CA; }
    .tf-platform-tab.on { border-color:#6366F1; background:#EEF2FF; color:#4338CA; }
    .tf-filter { padding:7px 16px; border-radius:20px; border:1.5px solid #E2E8F0; background:#fff; font-size:12px; font-weight:600; cursor:pointer; font-family:'Outfit',sans-serif; color:#64748B; transition:all 0.15s; }
    .tf-filter:hover { border-color:#6366F1; color:#4338CA; }
    .tf-filter.on { background:#6366F1; border-color:#6366F1; color:#fff; }
    .tf-step-dot { width:8px; height:8px; border-radius:50%; background:#E2E8F0; transition:all 0.3s; }
    .tf-step-dot.on { background:#6366F1; width:24px; border-radius:4px; }
    .tf-loader { width:44px; height:44px; border-radius:50%; border:3px solid #E2E8F0; border-top-color:#6366F1; animation:spin 0.7s linear infinite; }
    .tf-error { background:#FEF2F2; border:1px solid #FECACA; border-radius:10px; padding:11px 16px; font-size:13px; color:#DC2626; font-weight:500; }
    .tf-analysis-card { background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:14px; padding:22px; }
    .tf-divider { border:none; border-top:1px solid #F1F5F9; margin:20px 0; }
    .anim-fade { animation:fadeIn 0.4s ease both; }
    .anim-scale { animation:scaleIn 0.35s ease both; }
    .anim-up { animation:slideUp 0.4s ease both; }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes scaleIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
    @keyframes pulse { 0%,100%{background:#E2E8F0;transform:scale(1)} 50%{background:#6366F1;transform:scale(1.4)} }
    @media(max-width:768px){ .tf-result-grid{grid-template-columns:1fr !important} .tf-hero h1{font-size:30px} }
  `;

  return (
    <div className="tf-root">
      <style>{css}</style>

      {/* ── NAV ── */}
      <nav className="tf-nav">
        <div className="tf-logo">
          <div className="tf-logo-dot"/>
          TweetForge
          <span style={{fontSize:12,fontWeight:400,color:"#94A3B8",marginLeft:4}}>AI</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {page!=="home" && page!=="mode" && (
            <button className="btn-ghost" style={{fontSize:12,padding:"7px 14px"}} onClick={reset}>← Home</button>
          )}
          {page==="result" && (
            <button className="btn-primary" style={{padding:"8px 18px",fontSize:12}} onClick={exportTxt}>⬇ Export</button>
          )}
        </div>
      </nav>

      {/* ── HOME ── */}
      {page==="home" && (
        <div className="anim-fade">
          <div className="tf-hero">
            <div className="tf-hero-tag">✦ AI-POWERED BRAND VOICE ENGINE</div>
            <h1>Generate tweets that sound<br/><em>exactly like your brand</em></h1>
            <p>Three intelligent methods to capture your brand voice — then instantly craft 10 on-brand tweets that resonate.</p>
            <button className="tf-hero-cta" onClick={()=>setPage("mode")}>
              Get Started <span style={{fontSize:16}}>→</span>
            </button>
            <div className="tf-hero-stats">
              {[["3","Analysis Modes"],["10","Tweets Generated"],["5","Voice Dimensions"]].map(([n,l])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <div className="tf-hero-stat-num">{n}</div>
                  <div className="tf-hero-stat-label">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{maxWidth:900,margin:"0 auto",padding:"60px 24px"}}>
            <div style={{textAlign:"center",marginBottom:40}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"#6366F1",textTransform:"uppercase",marginBottom:8}}>How it works</div>
              <div style={{fontSize:"clamp(22px,4vw,32px)",fontWeight:800,letterSpacing:"-0.5px",color:"#0F172A"}}>Three ways to analyse brand voice</div>
            </div>
            <div className="tf-mode-grid">
              {[
                {icon:"📡",color:"#DBEAFE",title:"Social Post Analysis",desc:"Paste real posts from Twitter, Instagram, or LinkedIn. AI extracts tone, themes and voice patterns.",badge:"Highest Accuracy",bc:"#1D4ED8",bb:"#DBEAFE"},
                {icon:"🧠",color:"#EEF2FF",title:"AI Inference",desc:"Describe your brand and let AI infer the voice, tone and audience automatically.",badge:"Fastest",bc:"#4338CA",bb:"#EEF2FF"},
                {icon:"🎛",color:"#FEF3C7",title:"Manual Definition",desc:"Hand-pick your exact tones, content themes and audience for full creative control.",badge:"Full Control",bc:"#92400E",bb:"#FEF3C7"},
              ].map(f=>(
                <div key={f.title} style={{background:"#fff",border:"1px solid #F1F5F9",borderRadius:18,padding:"26px"}}>
                  <div style={{width:48,height:48,borderRadius:14,background:f.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:16}}>{f.icon}</div>
                  <div style={{fontWeight:700,fontSize:15,color:"#0F172A",marginBottom:8}}>{f.title}</div>
                  <div style={{fontSize:13,color:"#64748B",lineHeight:1.65,marginBottom:16}}>{f.desc}</div>
                  <span style={{display:"inline-block",fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:20,background:f.bb,color:f.bc}}>{f.badge}</span>
                </div>
              ))}
            </div>
            <div style={{textAlign:"center",marginTop:40}}>
              <button className="btn-primary" style={{padding:"14px 40px",fontSize:15}} onClick={()=>setPage("mode")}>
                Start Generating Tweets →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE SELECT ── */}
      {page==="mode" && (
        <div style={{maxWidth:800,margin:"0 auto",padding:"48px 24px"}} className="anim-scale">
          <div style={{marginBottom:36}}>
            <div className="tf-section-label" style={{color:"#6366F1"}}>Step 1 of 2</div>
            <div className="tf-section-title">Choose your analysis method</div>
            <p style={{fontSize:14,color:"#64748B",marginTop:8,lineHeight:1.6}}>This determines how TweetForge understands your brand voice before generating tweets.</p>
          </div>
          <div className="tf-mode-grid">
            {[
              {id:"social",icon:"📡",color:"#DBEAFE",title:"Analyse Social Posts",desc:"Paste real posts from Twitter/X, Instagram or LinkedIn. AI extracts your actual voice from existing content.",badge:"📊 Highest accuracy",bc:"#1D4ED8",bb:"#DBEAFE"},
              {id:"inference",icon:"🧠",color:"#EEF2FF",title:"AI Inference",desc:"Just describe your brand. AI will infer your tone, personality and audience through intelligent prompting.",badge:"⚡ Fastest",bc:"#4338CA",bb:"#EEF2FF"},
              {id:"manual",icon:"🎛",color:"#FEF3C7",title:"Manual Definition",desc:"Pick tones, themes and audience yourself. You stay in control of every brand personality setting.",badge:"🎨 Full control",bc:"#92400E",bb:"#FEF3C7"},
            ].map(m=>(
              <div key={m.id} className="tf-mode-card" onClick={()=>{setMode(m.id);setPage(m.id==="social"?"analyze":"form");}}>
                <div style={{width:48,height:48,borderRadius:14,background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:16}}>{m.icon}</div>
                <div style={{fontWeight:700,fontSize:16,color:"#0F172A",marginBottom:8}}>{m.title}</div>
                <div style={{fontSize:13,color:"#64748B",lineHeight:1.65,marginBottom:16}}>{m.desc}</div>
                <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:20,background:m.bb,color:m.bc}}>{m.badge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ANALYZE ── */}
      {page==="analyze" && (
        <div style={{maxWidth:680,margin:"0 auto",padding:"48px 24px"}} className="anim-scale">
          <div style={{display:"flex",gap:8,marginBottom:28}}>
            <div className={`tf-step-dot on`}/><div className="tf-step-dot"/>
          </div>
          <div style={{marginBottom:28}}>
            <div className="tf-section-label" style={{color:"#6366F1"}}>Step 1 of 2 · Social Analysis</div>
            <div className="tf-section-title">Paste your social media posts</div>
            <p style={{fontSize:14,color:"#64748B",marginTop:6,lineHeight:1.6}}>The more posts you provide, the more accurate the voice extraction will be.</p>
          </div>

          {analyzeStep==="input" && (
            <div className="tf-card anim-up" style={{display:"grid",gap:20}}>
              <div>
                <label className="tf-label">Platform</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {["Twitter/X","Instagram","LinkedIn","Facebook","Threads"].map(p=>(
                    <button key={p} className={`tf-platform-tab ${socialPlatform===p?"on":""}`} onClick={()=>setSocialPlatform(p)}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="tf-label">Recent Posts *</label>
                <textarea className="tf-field" rows={10} style={{resize:"vertical",lineHeight:1.7}}
                  placeholder={`Paste 5–15 recent ${socialPlatform} posts here, one per line.\n\nExample:\n"Just dropped our summer drop — built for the bold. 🌊"\n"Your comfort is our obsession. #MadeForYou"`}
                  value={socialPosts} onChange={e=>setSocialPosts(e.target.value)}/>
                <div className="tf-hint">Paste at least 3–5 posts · More posts = better accuracy</div>
              </div>
              {err && <div className="tf-error">⚠ {err}</div>}
              <div style={{display:"flex",gap:10}}>
                <button className="btn-ghost" onClick={()=>setPage("mode")}>← Back</button>
                <button className="btn-primary" style={{flex:1}} onClick={handleAnalyze}>🔬 Analyse Voice from Posts</button>
              </div>
            </div>
          )}

          {analyzeStep==="loading" && (
            <div className="tf-card" style={{textAlign:"center",padding:"60px 32px"}}>
              <div className="tf-loader" style={{margin:"0 auto 20px"}}/>
              <div style={{fontWeight:700,fontSize:17,color:"#0F172A",marginBottom:6}}>Extracting brand voice…</div>
              <div style={{fontSize:13,color:"#94A3B8"}}>Analysing tone patterns, themes and communication style</div>
            </div>
          )}

          {analyzeStep==="done" && analyzedVoice && (
            <div style={{display:"grid",gap:16}} className="anim-up">
              <div style={{background:"#ECFDF5",border:"1px solid #A7F3D0",borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>✅</span>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:"#065F46"}}>Voice extracted from {socialPlatform} posts</div>
                  <div style={{fontSize:12,color:"#047857",marginTop:2}}>This profile will guide your tweet generation</div>
                </div>
              </div>
              <div className="tf-analysis-card">
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
                  <div>
                    <div className="tf-sidebar-label" style={{color:"#94A3B8"}}>Detected Tones</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {analyzedVoice.dominantTones.map(t=>(
                        <span key={t} style={{padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:600,background:"#EEF2FF",color:"#4338CA",border:"1px solid #C7D2FE"}}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="tf-sidebar-label" style={{color:"#94A3B8"}}>Content Themes</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {analyzedVoice.contentThemes.map(t=>(
                        <span key={t} style={{padding:"4px 10px",borderRadius:6,fontSize:11,background:"#F8FAFC",color:"#64748B",border:"1px solid #E2E8F0"}}>#{t.replace(/\s/g,"")}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{marginBottom:16}}>
                  <div className="tf-sidebar-label" style={{color:"#94A3B8"}}>Target Audience</div>
                  <div style={{fontSize:13,color:"#374151"}}>{analyzedVoice.targetAudience}</div>
                </div>
                <div style={{marginBottom:16}}>
                  <div className="tf-sidebar-label" style={{color:"#94A3B8"}}>Voice Dimensions</div>
                  {Object.entries(analyzedVoice.dimensions).map(([k,v],i)=>(
                    <DimBar key={k} label={k.charAt(0).toUpperCase()+k.slice(1)} value={v} delay={i*100}/>
                  ))}
                </div>
                <div>
                  <div className="tf-sidebar-label" style={{color:"#94A3B8"}}>Key Observations</div>
                  {analyzedVoice.observations.map((o,i)=>(
                    <div key={i} style={{display:"flex",gap:8,fontSize:13,color:"#374151",marginBottom:6}}>
                      <span style={{color:"#6366F1",flexShrink:0}}>›</span>{o}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button className="btn-ghost" onClick={()=>{setAnalyzeStep("input");setSocialPosts("");}}>Re-analyse</button>
                <button className="btn-primary" style={{flex:1}} onClick={()=>setPage("form")}>Continue to Brand Details →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FORM ── */}
      {page==="form" && (
        <div style={{maxWidth:700,margin:"0 auto",padding:"48px 24px"}} className="anim-scale">
          {mode==="social" && (
            <div style={{display:"flex",gap:8,marginBottom:28}}>
              <div className="tf-step-dot"/><div className={`tf-step-dot on`}/>
            </div>
          )}
          <div style={{marginBottom:28}}>
            <div className="tf-section-label" style={{color:"#6366F1"}}>
              {mode==="social"?"Step 2 of 2 · Brand Details":mode==="manual"?"Define Your Brand":"Brand Details"}
            </div>
            <div className="tf-section-title">
              {mode==="manual"?"Define your brand & personality":"Tell us about your brand"}
            </div>
            {mode==="social" && analyzedVoice && (
              <div style={{display:"inline-flex",alignItems:"center",gap:8,marginTop:10,padding:"6px 14px",borderRadius:99,background:"#ECFDF5",border:"1px solid #A7F3D0",fontSize:12,fontWeight:600,color:"#065F46"}}>
                ✅ Voice from {socialPlatform} · {analyzedVoice.dominantTones.join(" · ")}
              </div>
            )}
          </div>

          <div className="tf-card" style={{display:"grid",gap:22}}>
            {/* MANUAL personality */}
            {mode==="manual" && (
              <div style={{background:"#FAFAFA",borderRadius:14,border:"1px solid #E2E8F0",padding:22,display:"grid",gap:18}}>
                <div style={{fontWeight:700,fontSize:13,color:"#4338CA"}}>🎛 Brand Personality Settings</div>
                <div>
                  <label className="tf-label">Select Brand Tones *</label>
                  <div className="tf-tone-grid">
                    {TONES.map(t=>(
                      <button key={t.id} className={`tf-tone-chip ${manual.tones.includes(t.label)?"on":""}`} onClick={()=>setManual(p=>({...p,tones:toggle(p.tones,t.label)}))}>
                        <div className="tf-tone-chip-icon">{t.icon}</div>
                        <div className="tf-tone-chip-label">{t.label}</div>
                        <div className="tf-tone-chip-desc">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="tf-label">Select Content Themes *</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {THEMES.map(t=>(
                      <button key={t} className={`tf-theme-chip ${manual.themes.includes(t)?"on":""}`} onClick={()=>setManual(p=>({...p,themes:toggle(p.themes,t)}))}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="tf-label">Target Audience</label>
                  <input className="tf-field" placeholder="e.g., Tech-savvy millennials who love sustainability…" value={manual.audience} onChange={e=>setManual(p=>({...p,audience:e.target.value}))}/>
                </div>
                <div>
                  <label className="tf-label">Voice Notes <span style={{color:"#CBD5E1",fontWeight:400}}>(optional)</span></label>
                  <textarea className="tf-field" rows={2} style={{resize:"vertical"}} placeholder="Any phrases, style rules, or communication notes…" value={manual.voiceSummary} onChange={e=>setManual(p=>({...p,voiceSummary:e.target.value}))}/>
                </div>
              </div>
            )}

            {/* INFERENCE tone hints */}
            {mode==="inference" && (
              <div>
                <label className="tf-label">Tone Hints <span style={{color:"#CBD5E1",fontWeight:400}}>(optional — AI infers if empty)</span></label>
                <div className="tf-tone-grid">
                  {TONES.map(t=>(
                    <button key={t.id} className={`tf-tone-chip ${form.tones.includes(t.label)?"on":""}`} onClick={()=>setF("tones",toggle(form.tones,t.label))}>
                      <div className="tf-tone-chip-icon">{t.icon}</div>
                      <div className="tf-tone-chip-label">{t.label}</div>
                      <div className="tf-tone-chip-desc">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode==="social" && analyzedVoice && (
              <div style={{padding:"14px 18px",background:"#ECFDF5",borderRadius:10,border:"1px solid #A7F3D0",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <span>✅</span>
                <span style={{fontSize:13,fontWeight:600,color:"#065F46"}}>Voice extracted:</span>
                {analyzedVoice.dominantTones.map(t=>(
                  <span key={t} style={{padding:"2px 8px",borderRadius:20,fontSize:11,background:"#fff",color:"#065F46",border:"1px solid #6EE7B7",fontWeight:600}}>{t}</span>
                ))}
              </div>
            )}

            <hr className="tf-divider"/>

            <div>
              <label className="tf-label">Brand Name *</label>
              <input className="tf-field" placeholder="e.g., Nike, Zomato, boAt…" value={form.brandName} onChange={e=>setF("brandName",e.target.value)}/>
            </div>
            <div>
              <label className="tf-label">Brand Description</label>
              <textarea className="tf-field" rows={3} style={{resize:"vertical"}} placeholder="Briefly describe your brand, mission and what makes you unique…" value={form.brandDescription} onChange={e=>setF("brandDescription",e.target.value)}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div>
                <label className="tf-label">Industry</label>
                <select className="tf-field" value={form.industry} onChange={e=>setF("industry",e.target.value)}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="tf-label">Target Audience</label>
                <select className="tf-field" value={form.targetAudience} onChange={e=>setF("targetAudience",e.target.value)}>
                  <option value="">Select audience</option>
                  {AUDIENCES.map(a=><option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="tf-label">Product / Service Details</label>
              <textarea className="tf-field" rows={3} style={{resize:"vertical"}} placeholder="Describe key products, services or offerings…" value={form.productInfo} onChange={e=>setF("productInfo",e.target.value)}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div>
                <label className="tf-label">Campaign Objective</label>
                <input className="tf-field" placeholder="e.g., build brand awareness…" value={form.objective} onChange={e=>setF("objective",e.target.value)}/>
              </div>
              <div>
                <label className="tf-label">Key Topics</label>
                <input className="tf-field" placeholder="e.g., innovation, sustainability" value={form.keyThemes} onChange={e=>setF("keyThemes",e.target.value)}/>
              </div>
            </div>

            {err && <div className="tf-error">⚠ {err}</div>}

            <div style={{display:"flex",gap:10,paddingTop:4}}>
              <button className="btn-ghost" onClick={()=>setPage(mode==="social"?"analyze":"mode")}>← Back</button>
              <button className="btn-primary" style={{flex:1,fontSize:15,padding:14}} onClick={handleGenerate}>
                ✦ Generate 10 On-Brand Tweets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOADING ── */}
      {page==="loading" && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:20}} className="anim-fade">
          <div style={{position:"relative"}}>
            <div className="tf-loader" style={{width:56,height:56,borderWidth:4}}/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>✦</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontWeight:800,fontSize:18,color:"#0F172A",marginBottom:6,letterSpacing:"-0.3px"}}>{loadingText}</div>
            <div style={{fontSize:13,color:"#94A3B8"}}>Crafting content for <strong style={{color:"#6366F1"}}>{form.brandName}</strong></div>
          </div>
          <div style={{display:"flex",gap:6,marginTop:8}}>
            {[0,1,2,3,4].map(i=>(
              <div key={i} style={{width:6,height:6,borderRadius:99,animation:`pulse 1.4s ease ${i*0.2}s infinite`}}/>
            ))}
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {page==="result" && result && (
        <div style={{maxWidth:1160,margin:"0 auto",padding:"36px 24px"}} className="anim-fade">
          <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:24,alignItems:"start"}} className="tf-result-grid">

            {/* Sidebar */}
            <div className="tf-sidebar">
              <div style={{marginBottom:18}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"#334155",textTransform:"uppercase",marginBottom:4}}>Brand Voice Report</div>
                <div style={{fontSize:18,fontWeight:800,color:"#F8FAFC",letterSpacing:"-0.3px"}}>{form.brandName}</div>
              </div>

              <div style={{marginBottom:20,padding:"8px 12px",borderRadius:9,
                background:result.brandVoice.method==="Social Media Analysis"?"rgba(16,185,129,0.15)":result.brandVoice.method==="Manual Definition"?"rgba(245,158,11,0.15)":"rgba(99,102,241,0.15)",
                border:`1px solid ${result.brandVoice.method==="Social Media Analysis"?"rgba(16,185,129,0.3)":result.brandVoice.method==="Manual Definition"?"rgba(245,158,11,0.3)":"rgba(99,102,241,0.3)"}`,
                display:"flex",alignItems:"center",gap:8}}>
                <span>{result.brandVoice.method==="Social Media Analysis"?"📡":result.brandVoice.method==="Manual Definition"?"🎛":"🧠"}</span>
                <span style={{fontSize:11,fontWeight:600,color:result.brandVoice.method==="Social Media Analysis"?"#34D399":result.brandVoice.method==="Manual Definition"?"#FCD34D":"#A5B4FC"}}>
                  {result.brandVoice.method}
                </span>
              </div>

              <div style={{marginBottom:16}}>
                <div className="tf-sidebar-label">Summary</div>
                <div style={{fontSize:12,color:"#94A3B8",lineHeight:1.7}}>{result.brandVoice.summary[0]}</div>
              </div>
              <div style={{marginBottom:16}}>
                <div className="tf-sidebar-label">Brand Tones</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {result.brandVoice.dominantTones.map(t=>(
                    <span key={t} style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,background:"rgba(99,102,241,0.15)",color:"#A5B4FC",border:"1px solid rgba(99,102,241,0.25)"}}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <div className="tf-sidebar-label">Voice Dimensions</div>
                {Object.entries(result.brandVoice.dimensions).map(([k,v],i)=>(
                  <DimBar key={k} label={k.charAt(0).toUpperCase()+k.slice(1)} value={v} delay={i*80}/>
                ))}
              </div>
              <div style={{borderTop:"1px solid #1E293B",paddingTop:16,marginBottom:16}}>
                <div className="tf-sidebar-label">Target Audience</div>
                <div style={{fontSize:12,color:"#94A3B8",lineHeight:1.6}}>{result.brandVoice.targetAudience}</div>
              </div>
              <div style={{marginBottom:16}}>
                <div className="tf-sidebar-label">Content Themes</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {result.brandVoice.contentThemes.map(t=>(
                    <span key={t} style={{padding:"3px 8px",borderRadius:6,fontSize:10,background:"#1E293B",color:"#64748B",border:"1px solid #293548"}}>#{t.replace(/\s/g,"")}</span>
                  ))}
                </div>
              </div>
              <div style={{borderTop:"1px solid #1E293B",paddingTop:16}}>
                <div className="tf-sidebar-label">Personality</div>
                {result.brandVoice.summary.slice(1).map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:8,fontSize:12,color:"#94A3B8",marginBottom:8,lineHeight:1.55}}>
                    <span style={{color:"#6366F1",flexShrink:0}}>›</span>{s}
                  </div>
                ))}
              </div>
            </div>

            {/* Tweets Panel */}
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
                <div>
                  <div style={{fontSize:22,fontWeight:800,color:"#0F172A",letterSpacing:"-0.5px",marginBottom:4}}>Generated Tweets</div>
                  <div style={{fontSize:13,color:"#94A3B8"}}>{result.tweets.length} tweets · {form.brandName}</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-ghost" onClick={()=>{setPage("form");setResult(null);}}>↺ Regenerate</button>
                  <button className="btn-primary" style={{padding:"9px 20px",fontSize:13}} onClick={exportTxt}>⬇ Export</button>
                </div>
              </div>

              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
                {STYLE_FILTERS.map(f=>(
                  <button key={f} className={`tf-filter ${filter===f?"on":""}`} onClick={()=>setFilter(f)}>{f}</button>
                ))}
              </div>

              <div style={{display:"grid",gap:10}}>
                {filteredTweets.length===0 ? (
                  <div style={{textAlign:"center",padding:40,color:"#94A3B8",fontSize:14,background:"#fff",borderRadius:16,border:"1px solid #F1F5F9"}}>
                    No tweets in this category
                  </div>
                ) : filteredTweets.map((tweet,i)=>(
                  <TweetCard key={i} tweet={tweet} index={i} globalIndex={result.tweets.indexOf(tweet)} onCopy={copyTweet} copied={copied}/>
                ))}
              </div>

              <div style={{marginTop:20,padding:"18px 22px",background:"#F8FAFC",borderRadius:14,border:"1px solid #F1F5F9",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:13,color:"#94A3B8"}}>Want different results? Try regenerating or start fresh.</span>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn-ghost" style={{fontSize:12}} onClick={reset}>✦ New Brand</button>
                  <button className="btn-primary" style={{fontSize:12,padding:"9px 20px"}} onClick={handleGenerate}>↺ Regenerate</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}