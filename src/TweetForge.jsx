import { useState, useEffect } from "react";
import './tweetforge.css';
import {
  INDUSTRIES,
  AUDIENCES,
  TONES,
  THEMES,
  STYLE_FILTERS,
} from "./constants/tweetforge";
import { callGroq } from "./lib/groq";
import { toggle } from "./utils/tweetforge";
import DimBar from "./components/DimBar";
import TweetCard from "./components/TweetCard";

/* ─── DATA ──────────────────────────────────────────────────────────────── */
/* data, API, helpers and reusable UI components are extracted into separate modules */

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
  const [errDetails, setErrDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmIndex, setConfirmIndex] = useState(null);
  const [form, setForm] = useState({
    brandName:"", brandDescription:"", industry:"", targetAudience:"",
    tones:[], themes:[], productInfo:"", objective:"", keyThemes:"",
    outputPlatform: "Twitter/X"
  });
  const [manual, setManual] = useState({ tones:[], themes:[], audience:"", voiceSummary:"" });
  // load history
  useEffect(()=>{
    try{
      const raw = localStorage.getItem('tf_history');
      if(raw) setHistory(JSON.parse(raw));
    }catch(e){ console.warn('Failed to load history', e); }
  },[]);

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
      setErrDetails(e?.message||String(e));
      setAnalyzeStep("input");
    }
  }

  /* ── GENERATE TWEETS ── */
  async function handleGenerate() {
    if(!form.brandName.trim()){setErr("Brand name is required.");return;}
    setErr(""); setPage("loading");
    setErrDetails(null);
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
      const platform = form.outputPlatform || socialPlatform || 'Twitter/X';
      const charLimit = platform === 'Twitter/X' ? 280 : platform === 'LinkedIn' ? 1300 : 2200;
      const platformGuidance = platform === 'Twitter/X'
        ? 'Keep it snappy, use hashtags and emojis where appropriate.'
        : platform === 'LinkedIn'
          ? 'Use a professional, insight-driven tone; prefer longer form and data-backed sentences; limit emojis.'
          : 'Make captions visual-forward, use line breaks, 3-10 relevant hashtags, and a strong CTA.';

      // More granular LinkedIn audience guidance and Instagram CTA suggestions
      const audienceHints = {
        'Gen Z (18-24)': 'Speak with fresh, trend-aware language; short paragraphs; visuals or stats that resonate with young creators.',
        'Millennials (25-40)': 'Mix authenticity with value; highlight practicality and sustainability; include concise takeaways.',
        'Gen X (41-56)': 'Emphasise reliability, expertise and long-term value; clear calls-to-action and fewer emojis.',
        'Parents & Families': 'Highlight convenience, safety and family benefits; friendly but authoritative tone.',
        'Students': 'Be relatable and budget-conscious; tips, deals, and short how-tos work well.',
        'Working Professionals': 'Professional insights, productivity tips, and ROI-focused language.',
        'Entrepreneurs': 'Actionable advice, growth metrics, and direct CTAs for tools or resources.',
        'Tech Enthusiasts': 'Use technical details, product differentiators, and early-adopter language.',
        'Health-conscious Consumers': 'Evidence-backed claims, benefits-first copy, and gentle CTAs.',
        'Luxury Buyers': 'Elevate language, focus on craftsmanship, exclusivity, and aspirational imagery.',
        'General Public': 'Clear benefits, simple language, and a friendly approachable tone.'
      };

      let platformSubGuidance = '';
      if(platform === 'LinkedIn'){
        const a = form.targetAudience || '';
        platformSubGuidance = a && audienceHints[a] ? `Audience hint: ${audienceHints[a]}` : 'Audience hint: use professional, insight-driven language for your target segment.';
      }
      if(platform === 'Instagram'){
        const obj = form.objective || '';
        const cta = obj.toLowerCase().includes('sell') || obj.toLowerCase().includes('conversion') ? 'Use CTAs like "Shop now" or "Link in bio".' : obj.toLowerCase().includes('awareness') ? 'Use softer CTAs like "Learn more" or "Discover".' : 'Include a clear CTA (e.g., "Learn more", "Link in bio").';
        platformSubGuidance = `Instagram CTA: ${cta} Prefer short opening hook, line breaks, and 1 strong CTA at the end.`;
      }

      const data = await callGroq(`Generate 10 on-brand posts for the following brand. Platform: ${platform}\n\nBrand Details:\n- Name: ${form.brandName}\n- Description: ${form.brandDescription||"Not provided"}\n- Industry: ${form.industry||"Not specified"}\n- Target Audience: ${form.targetAudience||"Not specified"}\n- Products/Services: ${form.productInfo||"Not provided"}\n- Campaign Objective: ${form.objective||"General brand awareness"}\n- Key Topics: ${form.keyThemes||"Not specified"}\n- Voice Profile (${methodLabel}): ${voiceCtx}\n\nPost Requirements:\n- Generate exactly: 2 promotional, 2 engaging, 2 witty, 2 informative, 1 inspirational, 1 question\n- Platform: ${platform}\n- Each output must be under ${charLimit} characters\n- Tone guidance: ${platformGuidance} ${platformSubGuidance}\n- Use 1-3 relevant hashtags per post (Instagram: 3-10 recommended)\n- Use emojis naturally where they fit the brand\n- Make every post feel authentically on-brand\n\nReturn ONLY this JSON structure with no extra text:\n{\n  "brandVoice": {\n    "dominantTones": ["tone1", "tone2", "tone3"],\n    "targetAudience": "description",\n    "contentThemes": ["theme1", "theme2", "theme3", "theme4"],\n    "summary": ["bullet1", "bullet2", "bullet3", "bullet4"],\n    "dimensions": {\n      "professionalism": 7,\n      "friendliness": 6,\n      "humor": 5,\n      "authority": 8,\n      "engagement": 7\n    },\n    "method": "${methodLabel}",\n    "platform": "${platform}"\n  },\n  "tweets": [\n    {"text": "tweet text here", "style": "promotional", "note": "why this works"},\n    {"text": "tweet text here", "style": "engaging", "note": "why this works"},\n    {"text": "tweet text here", "style": "witty", "note": "why this works"},\n    {"text": "tweet text here", "style": "informative", "note": "why this works"},\n    {"text": "tweet text here", "style": "promotional", "note": "why this works"},\n    {"text": "tweet text here", "style": "engaging", "note": "why this works"},\n    {"text": "tweet text here", "style": "witty", "note": "why this works"},\n    {"text": "tweet text here", "style": "informative", "note": "why this works"},\n    {"text": "tweet text here", "style": "inspirational", "note": "why this works"},\n    {"text": "tweet text here", "style": "question", "note": "why this works"}\n  ]\n}`);
      clearInterval(iv);
      setResult(data); setFilter("All"); setPage("result");
      // Save to history (keep most recent 20)
      try{
        const entry = { brandName: form.brandName, date: new Date().toISOString(), method: data.brandVoice?.method||'Unknown', platform: form.outputPlatform||socialPlatform||'Twitter/X', result: data, formSnapshot: { ...form, manual, analyzedVoice, mode } };
        const next = [entry, ...history].slice(0,20);
        setHistory(next);
        localStorage.setItem('tf_history', JSON.stringify(next));
      }catch(e){ console.warn('Failed saving history', e); }
    } catch(e) {
      clearInterval(iv);
      console.error(e);
      setErr("Generation failed: " + (e.message||String(e)));
      setErrDetails(e?.message||String(e));
      setPage("form");
    }
  }

  function copyAll() {
    if(!result?.tweets) return;
    const txt = result.tweets.map((t,i)=>`${i+1}. (${t.style}) ${t.text}`).join('\n\n');
    navigator.clipboard.writeText(txt);
    setCopied('all'); setTimeout(()=>setCopied(null),2000);
  }

  function clearHistory(){
    setConfirmAction('clear'); setConfirmIndex(null); setConfirmOpen(true);
  }

  function deleteHistoryItem(idx){
    setConfirmAction('delete'); setConfirmIndex(idx); setConfirmOpen(true);
  }

  function executeConfirm(){
    if(confirmAction==='clear'){
      localStorage.removeItem('tf_history'); setHistory([]);
    }else if(confirmAction==='delete'){
      const idx = confirmIndex;
      if(typeof idx==='number'){
        const next = history.slice(); next.splice(idx,1);
        setHistory(next); localStorage.setItem('tf_history', JSON.stringify(next));
      }
    }
    setConfirmOpen(false); setConfirmAction(null); setConfirmIndex(null);
  }

  function cancelConfirm(){ setConfirmOpen(false); setConfirmAction(null); setConfirmIndex(null); }

  function openHistoryItem(item){
    if(!item?.result) return;
    setForm(p=>({...p,brandName:item.brandName}));
    setResult(item.result); setPage('result');
  }

  function restoreHistoryToForm(item){
    if(!item?.formSnapshot){
      // fallback: set basic fields
      setForm(p=>({...p,brandName:item.brandName, outputPlatform:item.platform}));
      setPage('form');
      return;
    }
    const snap = item.formSnapshot;
    setForm(snap);
    if(snap.manual) setManual(snap.manual);
    if(snap.analyzedVoice) setAnalyzedVoice(snap.analyzedVoice);
    if(snap.mode) setMode(snap.mode);
    setPage('form');
  }

  function regenerateFromHistory(item){
    if(!item?.formSnapshot){
      // if no snapshot, try to populate brandName/platform and run
      setForm(p=>({...p,brandName:item.brandName, outputPlatform:item.platform}));
      setTimeout(()=>{ handleGenerate(); }, 120);
      return;
    }
    const snap = item.formSnapshot;
    setForm(snap);
    if(snap.manual) setManual(snap.manual);
    if(snap.analyzedVoice) setAnalyzedVoice(snap.analyzedVoice);
    if(snap.mode) setMode(snap.mode);
    // wait a tick for state to update
    setTimeout(()=>{ handleGenerate(); }, 120);
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

  /* styles moved to src/tweetforge.css */

  return (
    <div className="tf-root">
      {/* styles are imported from src/tweetforge.css */}

      {/* ── NAV ── */}
      <nav className="tf-nav">
        <div className="tf-logo">
          <div className="tf-logo-dot"/>
          TweetForge
          <span style={{fontSize:12,fontWeight:400,color:"#94A3B8",marginLeft:4}}>AI</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="btn-ghost btn-icon" style={{fontSize:12,padding:"7px 14px"}} onClick={()=>setPage('history')}>
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5l3 3"/></svg>
            History
          </button>
          {page!=="home" && page!=="mode" && (
            <button className="btn-ghost" style={{fontSize:12,padding:"7px 14px"}} onClick={reset}>← Home</button>
          )}
          {page==="result" && (
            <button className="btn-primary" style={{padding:"8px 18px",fontSize:12}} onClick={exportTxt}><svg className="icon" viewBox="0 0 24 24" aria-hidden><path d="M12 3v12"/></svg> Export</button>
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
            {/* Features & Testimonials */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginTop:40}}>
              <div className="tf-card">
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <svg className="icon" viewBox="0 0 24 24"><path d="M5 12l4 4L19 7"/></svg>
                  <div style={{fontWeight:800,fontSize:18}}>Feature Highlights</div>
                </div>
                <ul style={{marginTop:12,color:'#64748B',lineHeight:1.9}}>
                  <li>3 analysis modes — Social, AI Inference, Manual</li>
                  <li>Strict JSON outputs for reproducible templates</li>
                  <li>Export, copy and save brand generations locally</li>
                </ul>
              </div>
              <div className="tf-card">
                <div style={{fontWeight:800,fontSize:18,marginBottom:8}}>What marketers say</div>
                <div style={{marginTop:8}}>
                  <div style={{marginBottom:12,display:'flex',gap:10,alignItems:'flex-start'}}>
                    <svg className="icon" viewBox="0 0 24 24"><path d="M7 8h10v6H7z"/></svg>
                    <div>
                      <strong>"Massively sped up our social planning."</strong>
                      <div style={{fontSize:13,color:'#94A3B8'}}>— Priya, Social Lead</div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                    <svg className="icon" viewBox="0 0 24 24"><path d="M7 8h10v6H7z"/></svg>
                    <div>
                      <strong>"On-brand copy in seconds. Lovely UX."</strong>
                      <div style={{fontSize:13,color:'#94A3B8'}}>— Marco, Growth</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* How it works (simple animated steps) */}
            <div style={{marginTop:40,textAlign:'center'}}>
              <div style={{fontWeight:800,fontSize:18,marginBottom:12}}>How it works</div>
              <div style={{display:'flex',justifyContent:'center',gap:20}}>
                {['Analyze','Generate','Export'].map((s,i)=> (
                  <div key={s} style={{width:160,background:'#fff',padding:18,borderRadius:12,boxShadow:'0 6px 20px rgba(2,6,23,0.04)',transform:`translateY(${i%2?6:0}px)`,transition:'transform 0.3s'}}>
                    <div style={{fontSize:22,marginBottom:8}}>✦</div>
                    <div style={{fontWeight:700}}>{s}</div>
                    <div style={{fontSize:13,color:'#94A3B8',marginTop:6}}>Simple step to get results fast</div>
                  </div>
                ))}
              </div>
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
                <label className="tf-label">Output Platform</label>
                <select className="tf-field" value={form.outputPlatform} onChange={e=>setF('outputPlatform', e.target.value)}>
                  <option>Twitter/X</option>
                  <option>LinkedIn</option>
                  <option>Instagram</option>
                </select>
              </div>
              <div>
                <label className="tf-label">Tone Hints (optional)</label>
                <div className="tf-hint">Provide optional tone hints to nudge the AI.</div>
              </div>
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
            {errDetails && (
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <button className="btn-ghost" onClick={handleGenerate}>Retry</button>
                <div style={{fontSize:12,color:'#94A3B8'}}>Details: {String(errDetails).slice(0,120)}</div>
              </div>
            )}

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
        <div style={{minHeight:'60vh',padding:24}}>
          <div style={{fontWeight:800,fontSize:18,marginBottom:12}}>{loadingText}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12}}>
            {[0,1,2,3].map(i=> (
              <div key={i} style={{background:'#fff',borderRadius:12,padding:18,boxShadow:'0 6px 20px rgba(2,6,23,0.04)'}}>
                <div style={{height:14,background:'#E6EEF8',borderRadius:6,marginBottom:10}}/>
                <div style={{height:10,background:'#F1F5F9',borderRadius:6,marginBottom:8}}/>
                <div style={{height:8,background:'#F1F5F9',borderRadius:6,width:'60%'}}/>
              </div>
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
                    <button className="btn-ghost" onClick={copyAll}>{copied==='all'?'✓ Copied All':'Copy All'}</button>
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

        {/* ── HISTORY ── */}
        {page==='history' && (
          <div style={{maxWidth:900,margin:'0 auto',padding:36}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <div>
                <div style={{fontSize:22,fontWeight:800}}>Saved Generations</div>
                <div style={{fontSize:13,color:'#94A3B8'}}>{history.length} items</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className='btn-ghost' onClick={clearHistory}>Clear</button>
                <button className='btn-ghost' onClick={()=>setPage('home')}>Close</button>
              </div>
            </div>
            <div style={{display:'grid',gap:12}}>
              {history.length===0 ? (
                <div style={{padding:24,background:'#fff',borderRadius:12}}>No saved generations yet</div>
              ) : history.map((h,i)=>(
                <div key={i} style={{background:'#fff',padding:14,borderRadius:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:700}}>{h.brandName} <span style={{fontSize:12,color:'#94A3B8',fontWeight:600}}>· {new Date(h.date).toLocaleString()}</span></div>
                    <div style={{fontSize:13,color:'#64748B'}}>{h.method} · {h.platform}</div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button className='btn-ghost' onClick={()=>openHistoryItem(h)}>Open</button>
                    <button className='btn-ghost' onClick={()=>restoreHistoryToForm(h)}>Restore</button>
                    <button className='btn-ghost' onClick={()=>regenerateFromHistory(h)}>Regenerate</button>
                    <button className='btn-ghost' onClick={()=>deleteHistoryItem(i)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ── FOOTER ── */}
        <footer style={{marginTop:40,padding:24,background:'#0F172A',color:'#fff'}}>
          <div style={{maxWidth:1160,margin:'0 auto',display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
            <div style={{minWidth:200}}>
              <div style={{fontWeight:800,fontSize:16}}>TweetForge</div>
              <div style={{fontSize:13,color:'#CBD5E1',marginTop:6}}>Generate on-brand social copy fast.</div>
            </div>
            <div style={{display:'flex',gap:24}}>
              <div>
                <div style={{fontWeight:700}}>Product</div>
                <div style={{fontSize:13,color:'#CBD5E1',marginTop:8}}>Features · Pricing · Docs</div>
              </div>
              <div>
                <div style={{fontWeight:700}}>Company</div>
                <div style={{fontSize:13,color:'#CBD5E1',marginTop:8}}>About · Contact</div>
              </div>
            </div>
          </div>
        </footer>
        {/* Confirmation modal */}
        {confirmOpen && (
          <div className="tf-modal-overlay">
            <div className="tf-modal">
              <h3>{confirmAction==='clear' ? 'Clear all saved generations?' : 'Delete saved generation?'}</h3>
              <p>{confirmAction==='clear' ? 'This will permanently remove all saved generations from your browser.' : 'This will permanently remove this saved generation.'}</p>
              <div className="actions">
                <button className="btn-ghost" onClick={cancelConfirm}>Cancel</button>
                <button className="btn-primary" onClick={executeConfirm}>{confirmAction==='clear' ? 'Clear all' : 'Delete'}</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}