import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter,useNavigate,useLocation,Link} from "react-router-dom";
import axios from "axios";
import "./styles.css";

const api=axios.create({baseURL:import.meta.env.VITE_API_URL||"http://127.0.0.1:8000/api"});
api.interceptors.request.use(c=>{const t=localStorage.getItem("access");if(t)c.headers.Authorization=`Bearer ${t}`;return c});

const roles=["Generative AI Engineer","Machine Learning Engineer","Data Scientist","Full Stack AI Engineer"];

function Layout({children}){
 const nav=useNavigate();
 return <div className="app-shell"><aside className="sidebar">
   <div className="brand"><div className="brand-mark">✦</div><div><b>RoleRush</b><span>AI Career Copilot</span></div></div>
   <nav>
    <Link className="nav-item" to="/">⌂ <span>Dashboard</span></Link>
    <Link className="nav-item" to="/resume">◈ <span>Resume AI</span></Link>
    <Link className="nav-item" to="/interview">◉ <span>Mock Interview</span></Link><Link className="nav-item" to="/voice-interview">🎙 <span>Voice Interview</span></Link>
    <Link className="nav-item" to="/jobs">⌁ <span>Job Matches</span></Link><Link className="nav-item" to="/jd">⌕ <span>JD Match</span></Link><Link className="nav-item" to="/tracker">▣ <span>Applications</span></Link>
    <Link className="nav-item" to="/plans">◆ <span>Plans & Billing</span></Link>
   </nav>
   <div className="sidebar-bottom"><div className="secure">🔒 <span>Your data stays private</span></div><button className="logout" onClick={()=>{localStorage.clear();nav("/login")}}>Sign out</button></div>
 </aside><main className="content"><header className="topbar"><div className="mobile-brand">RoleRush</div><div className="top-actions"><span className="status-dot">●</span> AI systems online <div className="avatar">U</div></div></header>{children}</main></div>
}

function Login(){
 const nav=useNavigate(); const [f,setF]=useState({username:"",password:""}); const [err,setErr]=useState("");
 return <div className="auth-page"><div className="auth-card"><div className="brand centered"><div className="brand-mark">✦</div><div><b>RoleRush</b><span>AI Career Copilot</span></div></div><h1>Welcome back</h1><p className="muted">Continue building your AI-ready career.</p>
 <input placeholder="Username" value={f.username} onChange={e=>setF({...f,username:e.target.value})}/><input type="password" placeholder="Password" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/>
 {err&&<div className="error">{err}</div>}<button className="primary wide" onClick={async()=>{try{const r=await api.post("/auth/login/",f);localStorage.setItem("access",r.data.access);nav("/")}catch(e){setErr(e.response?.data?.detail||"Login failed")}}}>Sign in</button>
 <p className="auth-switch">New here? <Link to="/register">Create your account</Link></p></div></div>
}

function Register(){
 const nav=useNavigate();const [f,setF]=useState({username:"",email:"",password:""});const [err,setErr]=useState("");
 return <div className="auth-page"><div className="auth-card"><div className="brand centered"><div className="brand-mark">✦</div><div><b>RoleRush</b><span>AI Career Copilot</span></div></div><h1>Create your account</h1><p className="muted">Get your resume, interview and job strategy in one place.</p>
 {Object.keys(f).map(k=><input key={k} type={k==="password"?"password":"text"} placeholder={k==="email"?"Email address":k[0].toUpperCase()+k.slice(1)} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/>)}{err&&<div className="error">{err}</div>}
 <button className="primary wide" onClick={async()=>{try{const r=await api.post("/auth/register/",f);localStorage.setItem("access",r.data.access);nav("/")}catch(e){setErr(JSON.stringify(e.response?.data||"Registration failed"))}}}>Create account</button>
 <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p></div></div>
}

function Dashboard(){
 const [m,setM]=useState({});const [s,setS]=useState({});const [c,setC]=useState([]);
 useEffect(()=>{Promise.all([api.get("/me/"),api.get("/career/stats/"),api.get("/challenges/")]).then(([a,b,d])=>{setM(a.data);setS(b.data);setC(d.data)})},[]);
 const pct=m.resume_limit?Math.min(100,m.resumes_used/m.resume_limit*100):0;
 return <><div className="page-head"><div><p className="eyebrow">YOUR HQ</p><h1>Build a career that hits different.</h1><p className="muted">One place to level up your resume, interview game and job search.</p></div><Link className="primary" to="/resume">Level up resume →</Link></div>
 <div className="rush-hero"><div><span className="pill">ROLERUSH · AI COPILOT</span><h2>Your career, but on turbo.</h2><p>Get instant feedback, practice your target role and turn applications into a trackable pipeline.</p></div><div className="xp-box"><small>CAREER XP</small><strong>{s.xp||0}</strong><span>🔥 {s.streak||0} day momentum</span></div></div>
 <div className="stat-grid"><div className="stat-card"><span>Resume readiness</span><b>{s.latest_score||"—"}<small>/100</small></b><div className="bar"><i style={{width:`${s.latest_score||0}%`}}/></div></div><div className="stat-card"><span>Interview average</span><b>{s.average_interview_score||"—"}<small>/100</small></b><p>{s.average_interview_score?"Keep practicing to climb higher.":"Take your first mock interview."}</p></div><div className="stat-card"><span>Applications tracked</span><b>{s.application_count||0}</b><p>Save jobs and move them through your pipeline.</p></div><div className="stat-card"><span>Plan credits</span><b>{m.resumes_used||0}<small>/{m.resume_limit||0}</small></b><div className="bar"><i style={{width:`${pct}%`}}/></div></div></div>
 <div className="section-title"><h2>Daily quests</h2><span>Earn XP while you improve</span></div><div className="quest-grid">{c.map(x=><div className="quest-card" key={x.id}><span className="quest-type">{x.category}</span><h3>{x.title}</h3><p>{x.prompt}</p><b>+{x.xp} XP</b></div>)}</div>
 <div className="section-title"><h2>Quick boosts</h2><span>High-impact actions</span></div><div className="workflow"><Link className="workflow-card" to="/jd"><span>01</span><h3>Paste a job description</h3><p>See your match score and skill gaps.</p><b>→</b></Link><Link className="workflow-card" to="/interview"><span>02</span><h3>Beat the interview bot</h3><p>Practice until your score moves.</p><b>→</b></Link><Link className="workflow-card" to="/tracker"><span>03</span><h3>Track your applications</h3><p>Never lose a follow-up again.</p><b>→</b></Link></div></>
}
function Resume(){
 const [file,setFile]=useState();const [role,setRole]=useState(roles[0]);const [out,setOut]=useState(null);const [loading,setLoading]=useState(false);const [err,setErr]=useState("");
 return <><div className="page-head"><div><p className="eyebrow">RESUME INTELLIGENCE</p><h1>Make your resume work harder.</h1><p className="muted">ATS scoring, skill gaps and role-specific recommendations.</p></div></div>
 <div className="two-col"><div className="card upload-card"><h2>Upload resume</h2><p className="muted">PDF, DOCX or TXT · Keep it under 10 MB.</p><label className="dropzone"><input type="file" accept=".pdf,.docx,.txt" onChange={e=>setFile(e.target.files[0])}/><div className="upload-icon">↑</div><b>{file?file.name:"Choose a resume"}</b><span>{file?"Ready to analyze":"Drag and drop or browse files"}</span></label><label className="field-label">Target role</label><select value={role} onChange={e=>setRole(e.target.value)}>{roles.map(r=><option key={r}>{r}</option>)}</select>{err&&<div className="error">{err}</div>}<button className="primary wide" disabled={!file||loading} onClick={async()=>{setLoading(true);setErr("");try{const d=new FormData();d.append("file",file);d.append("role",role);const r=await api.post("/resumes/",d);setOut(r.data.analysis)}catch(e){setErr(e.response?.data?.detail||"Analysis failed")}finally{setLoading(false)}}}>{loading?"Analyzing…":"Analyze resume"}</button></div>
 {out?<div className="card results"><div className="score-ring"><strong>{out.overall_score}</strong><span>/100</span></div><div><p className="eyebrow">OVERALL FIT</p><h2>{out.role_match}</h2><p className="muted">Your resume has been evaluated against the selected role.</p></div><div className="metric"><span>ATS score</span><b>{out.ats_score}/100</b></div><div className="result-block"><h3>Detected skills</h3><div className="tags">{(out.skills_found||[]).map(s=><span key={s}>{s}</span>)}</div></div><div className="result-block"><h3>Priority gaps</h3><p>{(out.missing_keywords||[]).join(" · ")||"No major keyword gaps detected."}</p></div><div className="result-block"><h3>Next improvements</h3><ul>{(out.improvements||[]).map(s=><li key={s}>{s}</li>)}</ul></div></div>:<div className="card empty-results"><div className="empty-icon">✦</div><h2>Your analysis appears here</h2><p className="muted">Upload your latest resume to get a role-specific readiness report.</p></div>}</div></>
}

function Interview(){
 const [role,setRole]=useState(roles[0]);const [i,setI]=useState(null);const [idx,setIdx]=useState(0);const [a,setA]=useState("");const [score,setScore]=useState(null);const [loading,setLoading]=useState(false);const [err,setErr]=useState("");
 async function start(){setLoading(true);setErr("");try{const r=await api.post("/interviews/start/",{role});setI(r.data);setIdx(0);setScore(null)}catch(e){setErr(e.response?.data?.detail||"Could not start interview")}finally{setLoading(false)}}
 async function submit(){if(!a.trim())return;setLoading(true);try{await api.post(`/interviews/${i.id}/answer/`,{question_index:idx,answer:a});setA("");if(idx+1<i.questions.length)setIdx(idx+1);else{const r=await api.post(`/interviews/${i.id}/finish/`);setScore(r.data)}}catch(e){setErr(e.response?.data?.detail||"Could not submit answer")}finally{setLoading(false)}}
 return <><div className="page-head"><div><p className="eyebrow">INTERVIEW LAB</p><h1>Practice like the real interview.</h1><p className="muted">Role-specific technical, behavioral and system-design questions.</p></div></div>
 {!i?<div className="card interview-start"><div className="round-icon">◉</div><h2>Choose your target role</h2><p className="muted">The interview questions will adapt to this role.</p><select value={role} onChange={e=>setRole(e.target.value)}>{roles.map(r=><option key={r}>{r}</option>)}</select>{err&&<div className="error">{err}</div>}<button className="primary" onClick={start} disabled={loading}>{loading?"Preparing interview…":"Start interview →"}</button><div className="feature-row"><span>✓ 5 questions</span><span>✓ Technical + behavioral</span><span>✓ Final scorecard</span></div></div>
 :score?<div className="card scorecard"><p className="eyebrow">INTERVIEW COMPLETE</p><div className="big-score">{score.overall}<small>/100</small></div><h2>Interview readiness score</h2><div className="score-grid">{[["Technical",score.technical],["Communication",score.communication],["Structure",score.answer_structure]].map(x=><div key={x[0]}><span>{x[0]}</span><b>{x[1]||0}</b><div className="bar"><i style={{width:`${x[1]||0}%`}}/></div></div>)}</div><div className="result-block"><h3>Recommended focus</h3><ul>{(score.improvements||[]).map(x=><li key={x}>{x}</li>)}</ul></div><Link className="primary" to="/jobs">Find matching jobs →</Link></div>
 :<div className="card interview-box"><div className="progress-head"><span>Question {idx+1} of {i.questions.length}</span><span>{Math.round((idx/i.questions.length)*100)}%</span></div><div className="bar"><i style={{width:`${((idx+1)/i.questions.length)*100}%`}}/></div><p className="question-type">{i.questions[idx].type}</p><h2>{i.questions[idx].question}</h2><textarea value={a} onChange={e=>setA(e.target.value)} placeholder="Write your answer with context, actions and measurable results…"/><div className="interview-actions"><Link className="secondary" to="/voice-interview">🎙 Voice mode</Link><button className="primary" onClick={submit} disabled={loading||!a.trim()}>{loading?"Evaluating…":idx+1<i.questions.length?"Submit & continue":"Finish interview"}</button></div></div>}</>
}

function VoiceInterview(){
 const [role,setRole]=useState(roles[0]);
 const [interview,setInterview]=useState(null);
 const [idx,setIdx]=useState(0);
 const [listening,setListening]=useState(false);
 const [transcript,setTranscript]=useState("");
 const [score,setScore]=useState(null);
 const [err,setErr]=useState("");
 const recognitionRef=React.useRef(null);

 const supported=typeof window!=="undefined" &&
   ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

 function speak(text){
   if(!("speechSynthesis" in window)) return;
   window.speechSynthesis.cancel();
   const u=new SpeechSynthesisUtterance(text);
   u.rate=0.96;
   window.speechSynthesis.speak(u);
 }

 async function start(){
   setErr(""); setScore(null); setTranscript("");
   try{
     const r=await api.post("/interviews/start/",{role});
     setInterview(r.data); setIdx(0);
     setTimeout(()=>speak(r.data.questions?.[0]?.question||""),250);
   }catch(e){setErr(e.response?.data?.detail||"Could not start interview.")}
 }

 function beginListening(){
   if(!supported){setErr("Speech recognition is not available in this browser. Use Chrome or Edge, or switch to text mode.");return}
   const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
   const recognition=new SR();
   recognition.lang="en-IN";
   recognition.interimResults=true;
   recognition.continuous=false;
   recognition.onstart=()=>setListening(true);
   recognition.onend=()=>setListening(false);
   recognition.onerror=()=>{setListening(false);setErr("Microphone/speech recognition stopped. Please try again.");};
   recognition.onresult=(event)=>{
     let finalText="";
     for(let i=event.resultIndex;i<event.results.length;i++){
       finalText+=event.results[i][0].transcript;
     }
     setTranscript(finalText);
   };
   recognitionRef.current=recognition;
   recognition.start();
 }

 function stopListening(){recognitionRef.current?.stop();setListening(false)}

 async function submitVoice(){
   if(!interview || !transcript.trim()) return;
   setErr("");
   try{
     await api.post(`/interviews/${interview.id}/voice/`,{
       transcript,question_index:idx
     });
     if(idx+1<interview.questions.length){
       const next=idx+1;
       setIdx(next); setTranscript("");
       setTimeout(()=>speak(interview.questions[next].question),200);
     }else{
       const r=await api.post(`/interviews/${interview.id}/finish/`);
       setScore(r.data);
       speak(`Interview complete. Your score is ${r.data.overall} out of 100.`);
     }
   }catch(e){setErr(e.response?.data?.detail||"Could not submit voice answer.")}
 }

 if(!interview) return <><div className="page-head"><div><p className="eyebrow">VOICE INTERVIEW LAB</p><h1>Talk it out. Get better.</h1><p className="muted">A browser-native voice interview with speech recognition and spoken AI prompts.</p></div></div>
 <div className="card voice-card">
   {score?<><p className="eyebrow">VOICE INTERVIEW COMPLETE</p><div className="big-score">{score.overall}<small>/100</small></div><h2>Interview readiness</h2><div className="score-grid">{[["Technical",score.technical],["Communication",score.communication],["Structure",score.answer_structure]].map(x=><div key={x[0]}><span>{x[0]}</span><b>{x[1]||0}</b><div className="bar"><i style={{width:`${x[1]||0}%`}}/></div></div>)}</div><Link className="primary" to="/jobs">Find matching jobs →</Link></>
   :<><div className="voice-top"><span>Question {idx+1} / {interview.questions.length}</span><span className="pill">VOICE MODE</span></div><div className="bar"><i style={{width:`${((idx+1)/interview.questions.length)*100}%`}}/></div><p className="question-type">{interview.questions[idx].type}</p><h2 className="voice-question">{interview.questions[idx].question}</h2><div className={`mic-orb ${listening?"listening":""}`}><span>🎙</span></div><p className="voice-status">{listening?"Listening… speak naturally":"Tap the microphone and answer out loud"}</p><div className="voice-transcript">{transcript||"Your transcript will appear here…"}</div>{err&&<div className="error">{err}</div>}<div className="interview-actions"><button className={listening?"secondary":"primary"} onClick={listening?stopListening:beginListening}>🎙 {listening?"Stop listening":"Start speaking"}</button><button className="secondary" onClick={()=>speak(interview.questions[idx].question)}>🔊 Repeat question</button><button className="primary" onClick={submitVoice} disabled={!transcript.trim()}>Submit answer →</button></div><p className="muted small">Voice processing: browser STT → RoleRush scoring API. No vendor lock-in.</p></>}
 </div></>
}

function Jobs(){
 const [jobs,setJobs]=useState([]);useEffect(()=>{api.get("/jobs/").then(r=>setJobs(r.data)).catch(()=>{})},[]);
 return <><div className="page-head"><div><p className="eyebrow">JOB MATCHES</p><h1>Opportunities worth your time.</h1><p className="muted">Matches are ready for company and role-specific job feeds.</p></div></div><div className="jobs-toolbar"><span>{jobs.length} opportunities</span><span className="pill">MATCH ENGINE</span></div>{jobs.length?<div className="jobs-list">{jobs.map(j=><div className="job-card" key={j.id}><div className="company-logo">{(j.company||"?")[0]}</div><div className="job-main"><h2>{j.title}</h2><p>{j.company} · {j.location||"India"} {j.remote?"· Remote":""}</p><div className="tags">{(j.skills||[]).map(s=><span key={s}>{s}</span>)}</div></div><a className="secondary" href={j.apply_url||"#"} target="_blank" rel="noreferrer">View job ↗</a></div>)}</div>:<div className="card empty-results"><div className="empty-icon">⌁</div><h2>No jobs loaded yet</h2><p className="muted">Add company/job feed data through Django admin or connect a job API.</p></div>}</>
}

function JDMatch(){
 const [jd,setJd]=useState("");const [role,setRole]=useState(roles[0]);const [out,setOut]=useState(null);const [letter,setLetter]=useState("");const [loading,setLoading]=useState(false);
 async function analyze(){setLoading(true);try{const r=await api.post("/jd/analyze/",{job_description:jd,role});setOut(r.data)}finally{setLoading(false)}}
 async function cover(){const r=await api.post("/cover-letter/",{role,company:"Target company"});setLetter(r.data.cover_letter)}
 return <><div className="page-head"><div><p className="eyebrow">JD MATCH LAB</p><h1>Know your odds before you apply.</h1><p className="muted">Paste a job description and get a practical gap report.</p></div></div><div className="two-col"><div className="card"><h2>Job description</h2><select value={role} onChange={e=>setRole(e.target.value)}>{roles.map(r=><option key={r}>{r}</option>)}</select><textarea value={jd} onChange={e=>setJd(e.target.value)} placeholder="Paste the job description here…"/><button className="primary wide" onClick={analyze} disabled={!jd||loading}>{loading?"Matching…":"Check my match →"}</button></div>{out?<div className="card results"><div className="big-score">{out.match_score}<small>/100</small></div><h2>{out.recommendation}</h2><div className="result-block"><h3>Matched keywords</h3><div className="tags">{out.matched_keywords.map(x=><span key={x}>{x}</span>)}</div></div><div className="result-block"><h3>Priority gaps</h3><div className="tags">{out.missing_keywords.map(x=><span key={x}>{x}</span>)}</div></div><button className="secondary" onClick={cover}>Draft cover letter</button>{letter&&<textarea value={letter} readOnly/>}</div>:<div className="card empty-results"><div className="empty-icon">⌕</div><h2>Match report</h2><p className="muted">Your fit score and missing skills will appear here.</p></div>}</div></>
}
function Tracker(){
 const [items,setItems]=useState([]);const [form,setForm]=useState({company:"",role:"",status:"saved"});const load=()=>api.get("/applications/").then(r=>setItems(r.data));useEffect(load,[]);
 async function add(){await api.post("/applications/",form);setForm({company:"",role:"",status:"saved"});load()}
 return <><div className="page-head"><div><p className="eyebrow">APPLICATION OS</p><h1>Turn job hunting into a pipeline.</h1><p className="muted">Track what you saved, applied to and where you are in the process.</p></div></div><div className="card add-application"><input placeholder="Company" value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/><input placeholder="Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}/><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{["saved","applied","interview","offer","rejected"].map(x=><option key={x}>{x}</option>)}</select><button className="primary" onClick={add}>Add application</button></div><div className="pipeline">{["saved","applied","interview","offer"].map(status=><div className="pipeline-col" key={status}><h3>{status}</h3>{items.filter(x=>x.status===status).map(x=><div className="mini-job" key={x.id}><b>{x.role}</b><span>{x.company}</span></div>)}</div>)}</div></>
}

function Plans(){
 const [plans,setPlans]=useState([]);const [busy,setBusy]=useState(false);const [msg,setMsg]=useState("");
 useEffect(()=>{api.get("/plans/").then(r=>setPlans(r.data))},[]);
 async function buy(p){setBusy(true);setMsg("");try{const r=await api.post("/payments/create-order/",{plan_id:p.id});if(!window.Razorpay){setMsg("Razorpay Checkout is not loaded. Add the Razorpay script to index.html, then try again.");return}const options={key:r.data.key_id,order_id:r.data.order.id,currency:"INR",name:"RoleRush",description:`${p.name} plan`,handler:async response=>{const v=await api.post("/payments/verify/",response);setMsg(`Payment successful. You are now on ${v.data.plan}.`);}};new window.Razorpay(options).open()}catch(e){setMsg(e.response?.data?.detail||"Payment could not be started.")}finally{setBusy(false)}}
 return <><div className="page-head"><div><p className="eyebrow">PLANS & BILLING</p><h1>Invest in your next opportunity.</h1><p className="muted">More analysis credits. More practice. Less guesswork.</p></div></div>{msg&&<div className="success">{msg}</div>}<div className="pricing-grid">{plans.map((p,n)=><div className={`price-card ${p.name==="PRO"?"featured":""}`} key={p.id}>{p.name==="PRO"&&<span className="popular">MOST POPULAR</span>}<p className="eyebrow">{p.name}</p><h2>₹{p.price}<small>{p.price?" / plan":""}</small></h2><p className="muted">{p.name==="FREE"?"Start exploring your career fit.":p.name==="PRO"?"For serious interview preparation.":"For high-volume career preparation."}</p><div className="plan-feature">✓ {p.resume_limit} resume analyses</div><div className="plan-feature">✓ {p.interview_limit} mock interviews</div><div className="plan-feature">✓ Role-specific scoring</div><button className={p.name==="PRO"?"primary wide":"secondary wide"} disabled={busy||p.price===0} onClick={()=>buy(p)}>{p.price===0?"Current free plan":busy?"Opening checkout…":`Choose ${p.name}`}</button></div>)}</div><div className="trust-row"><span>🔒 Secure checkout</span><span>↻ Upgrade anytime</span><span>✓ Payment verification</span></div></>
}

function App(){const loc=useLocation();const publicPage=["/login","/register"].includes(loc.pathname);if(!localStorage.getItem("access")&&!publicPage)return <Login/>;let page=loc.pathname==="/resume"?<Resume/>:loc.pathname==="/interview"?<Interview/>:loc.pathname==="/voice-interview"?<VoiceInterview/>:loc.pathname==="/jobs"?<Jobs/>:loc.pathname==="/jd"?<JDMatch/>:loc.pathname==="/tracker"?<Tracker/>:loc.pathname==="/plans"?<Plans/>:loc.pathname==="/register"?<Register/>:loc.pathname==="/login"?<Login/>:<Dashboard/>;return publicPage?page:<Layout>{page}</Layout>}
createRoot(document.getElementById("root")).render(<BrowserRouter><App/></BrowserRouter>);
