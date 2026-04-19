import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  Briefcase, 
  Award, 
  Globe, 
  ExternalLink, 
  FileText, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  Star, 
  Layout, 
  List, 
  Table 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants & Types ---

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbys0KqXde5PLBcyDJJx5FnPpDd5atgkKCwQvZw4VeF_VK2QwPRA3e15uSShOg-6qRhh/exec";
const MASTER_SHEET_URL = "https://docs.google.com/spreadsheets/d/1RmUN_lY358yJS1bu3YbYYk4T3a587O38UkgMIXkjfD4/edit?usp=drivesdk";

interface Criterion {
  id: string;
  label: string;
  weight: number;
  icon: typeof Users;
  color: string;
}

const CRITERIA: Criterion[] = [
  { id: 'leadership', label: 'Leadership & Relationship Building', weight: 25, icon: Users, color: "text-blue-500" },
  { id: 'teaching', label: 'Teaching & Learning', weight: 15, icon: BookOpen, color: "text-green-500" },
  { id: 'admin', label: 'Administration', weight: 25, icon: Briefcase, color: "text-purple-500" },
  { id: 'src', label: 'Scholarly, Research & Creative (SRC)', weight: 20, icon: Award, color: "text-orange-500" },
  { id: 'advancement', label: 'Advancement, Advocacy & Community', weight: 15, icon: Globe, color: "text-cyan-500" }
];

interface Candidate {
  name: string;
  fileUrl: string;
}

const CANDIDATES: Candidate[] = [
  { name: "Agrawal, Sandeep", fileUrl: "https://drive.google.com/drive/folders/1uZGHUYfisYATO4A2M0oBCt0tYTmy0YUk" },
  { name: "Ardern, Chris", fileUrl: "https://drive.google.com/drive/folders/18ZNzvEwv29EtWB0RJ4ksSUJI-wM07Kdp" },
  { name: "Bailey, Annette", fileUrl: "https://drive.google.com/drive/folders/1CBG9-iT3aJPSoJv2a2LxD9vhDv57b0WS" },
  { name: "Blakey, Joan", fileUrl: "https://drive.google.com/drive/folders/1j4vOJWPRStYVUZPqVVp3oP0jY4HecCiw" },
  { name: "Clark-Kazak, Christina", fileUrl: "https://drive.google.com/drive/folders/19xeidQugo4ah-zehBRTKX5TBzzFFSflp" },
  { name: "De Sousa, Christopher", fileUrl: "https://drive.google.com/drive/folders/1nKf-fAKU6Z3rMfKPrgPNCO5O9pyeple9" },
  { name: "Green, Denise", fileUrl: "https://drive.google.com/drive/folders/1o4SVGPj_DS6u2tw-6iOfWv169q1d1C2d" },
  { name: "Green, Ruth", fileUrl: "https://drive.google.com/drive/folders/1RvRScM0W9JXuTbS0pMxtIbm-np7miU-Q" },
  { name: "Lawford, Heather", fileUrl: "https://drive.google.com/drive/folders/1Xj8viKH50t683YStQAWiEflEoWzDKkHq" },
  { name: "MacDonald, Megan", fileUrl: "https://drive.google.com/drive/folders/1F42V1F6Uc4kYFU60PQvqYSlCcWxrLdFl" },
  { name: "Mitra, Raktim", fileUrl: "https://drive.google.com/drive/folders/1PJ_j3drJnpgGKt2k5ysTqjevV1Qmy0to" },
  { name: "Robinson, Pamela", fileUrl: "https://drive.google.com/drive/folders/1LxZonDmYbYAnuNo3U1WTrHtfmQyXmYE_" },
  { name: "Sherman, Paul", fileUrl: "https://drive.google.com/drive/folders/1e3pJzNSlhiIgugOz--mdJCjYObr94MbW" }
];

interface CandidateData {
  experience: "Yes" | "No";
  notes: string;
  total: number;
  leadership: number;
  teaching: number;
  admin: number;
  src: number;
  advancement: number;
}

type Tab = 'evaluation' | 'rankings';
type Status = 'idle' | 'loading' | 'saving' | 'success' | 'error';

// --- Components ---

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('evaluation');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, CandidateData>>({});
  const [status, setStatus] = useState<Status>('loading');

  const loadData = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetch(SCRIPT_URL);
      const cloudData = await response.json();
      const initialScores: Record<string, CandidateData> = {};
      
      CANDIDATES.forEach(c => {
        const existing = cloudData[c.name] || {};
        initialScores[c.name] = {
          experience: (existing.experience as "Yes" | "No") || "No",
          notes: existing.notes || "",
          total: existing.total || 0,
          leadership: existing.leadership || 0,
          teaching: existing.teaching || 0,
          admin: existing.admin || 0,
          src: existing.src || 0,
          advancement: existing.advancement || 0
        };
      });
      setScores(initialScores);
      setStatus('idle');
    } catch (error) {
      console.error("Load error:", error);
      const emptyScores: Record<string, CandidateData> = {};
      CANDIDATES.forEach(c => {
        emptyScores[c.name] = { 
          experience: "No", 
          notes: "", 
          total: 0, 
          leadership: 0, 
          teaching: 0, 
          admin: 0, 
          src: 0, 
          advancement: 0 
        };
      });
      setScores(emptyScores);
      setStatus('idle');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const topFiveNames = useMemo(() => {
    return (Object.entries(scores) as [string, CandidateData][])
      .map(([name, data]) => ({ name, total: data.total || 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .filter(c => c.total > 0)
      .map(c => c.name);
  }, [scores]);

  const sortedCandidates = useMemo(() => {
    return [...CANDIDATES].sort((a, b) => (scores[b.name]?.total || 0) - (scores[a.name]?.total || 0));
  }, [scores]);

  const currentName = CANDIDATES[selectedIdx].name;
  const currentData = scores[currentName] || { 
    experience: "No", 
    notes: "", 
    total: 0, 
    leadership: 0, 
    teaching: 0, 
    admin: 0, 
    src: 0, 
    advancement: 0 
  };
  
  const isTopFive = topFiveNames.includes(currentName);

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 65) return "text-amber-500";
    return "text-rose-500";
  };

  const handleScoreChange = (id: string, val: number) => {
    setScores(prev => {
      const candidatePrev = prev[currentName];
      const updated = { ...candidatePrev, [id]: val };
      // Recalculate total
      const total = CRITERIA.reduce((acc, c) => acc + (updated[c.id as keyof CandidateData] as number || 0), 0);
      return { 
        ...prev, 
        [currentName]: { ...updated, total } 
      };
    });
  };

  const toggleExperience = () => {
    const newVal = currentData.experience === 'Yes' ? 'No' : 'Yes';
    setScores(prev => ({
      ...prev,
      [currentName]: { ...prev[currentName], experience: newVal }
    }));
  };

  const save = async () => {
    setStatus('saving');
    try {
      const formData = new URLSearchParams();
      formData.append('name', currentName);
      formData.append('experience', currentData.experience);
      formData.append('leadership', String(currentData.leadership || 0));
      formData.append('teaching', String(currentData.teaching || 0));
      formData.append('admin', String(currentData.admin || 0));
      formData.append('src', String(currentData.src || 0));
      formData.append('advancement', String(currentData.advancement || 0));
      formData.append('total', String(currentData.total || 0));
      formData.append('notes', currentData.notes || "");

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });
      
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) { 
      console.error("Save failed:", e);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="text-blue-800 mb-6"
        >
          <RefreshCw size={48} />
        </motion.div>
        <h2 className="text-2xl font-black text-blue-900 tracking-tight">Syncing Candidate Data...</h2>
        <p className="text-slate-500 mt-2 font-medium">Connecting to the evaluation database</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* --- HEADER --- */}
      <header className="bg-[#004c9b] text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h1 className="font-black text-xl md:text-2xl tracking-tight">FCS Dean Search</h1>
              <a 
                href={MASTER_SHEET_URL} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all mt-2 group"
              >
                <Table size={14} /> Open Master Spreadsheet
                <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>

            <div className="flex items-center gap-6">
              {activeTab === 'evaluation' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10"
                >
                  {isTopFive && <Star className="text-yellow-400 animate-pulse" size={24} fill="currentColor" />}
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold opacity-60">Live Score</p>
                    <div className={`text-3xl font-black leading-none transition-colors duration-500 ${getScoreColorClass(currentData.total)}`}>
                      {currentData.total}
                    </div>
                  </div>
                </motion.div>
              )}
              <div className="flex bg-black/20 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab('evaluation')} 
                  className={`px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'evaluation' ? 'bg-white text-blue-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
                >
                  <Layout size={18} /> <span className="hidden sm:inline">Evaluation</span>
                </button>
                <button 
                  onClick={() => setActiveTab('rankings')} 
                  className={`px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'rankings' ? 'bg-white text-blue-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
                >
                  <List size={18} /> <span className="hidden sm:inline">Rankings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'evaluation' ? (
            <motion.div 
              key="evaluation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-32"
            >
              {/* LEFT COLUMN: Candidate Info */}
              <div className="lg:col-span-5 space-y-6">
                <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 lg:sticky lg:top-32 transition-all">
                  <div className="mb-6">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Target Candidate</label>
                    <select 
                      value={selectedIdx} 
                      onChange={e => setSelectedIdx(parseInt(e.target.value))} 
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-blue-900 text-lg focus:border-blue-200 focus:outline-none transition-all cursor-pointer hover:bg-slate-100"
                    >
                      {CANDIDATES.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <a 
                      href={CANDIDATES[selectedIdx].fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold flex justify-center items-center gap-3 transition-all transform hover:-translate-y-1 shadow-xl active:scale-[0.98]"
                    >
                      <ExternalLink size={20} /> Review Full Dossier
                    </a>
                    <button 
                      onClick={toggleExperience} 
                      className={`w-full py-4 px-6 rounded-2xl border-2 font-black text-xs flex justify-between items-center transition-all group ${currentData.experience === 'Yes' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                    >
                      <span>QUALIFIED & EXPERIENCED?</span>
                      <span className="text-base flex items-center gap-2">
                        {currentData.experience}
                        {currentData.experience === 'Yes' && <CheckCircle size={18} />}
                      </span>
                    </button>
                  </div>
                  
                  <div className="mt-12 hidden lg:block">
                    <div className="flex items-center gap-3 text-slate-400 mb-4 font-black uppercase tracking-[0.2em] text-[11px]">
                      <FileText size={16} />
                      <span>Quick Notes</span>
                    </div>
                    <textarea 
                      value={currentData.notes} 
                      onChange={e => setScores(p => ({
                        ...p, 
                        [currentName]: {...p[currentName], notes: e.target.value}
                      }))} 
                      placeholder="Summarize candidate alignment..." 
                      className="w-full h-64 p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm focus:bg-white focus:border-blue-200 outline-none transition-all resize-none shadow-inner" 
                    />
                  </div>
                </section>
              </div>

              {/* RIGHT COLUMN: Criteria Scoring */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-6">Evaluation Criteria</h3>
                {CRITERIA.map(c => (
                  <div 
                    key={c.id} 
                    className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 transition-all hover:border-blue-200 group"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 bg-slate-50 rounded-2xl ${c.color} group-hover:scale-110 transition-transform`}>
                          <c.icon size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm md:text-base">{c.label}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Weight Limit: {c.weight}</p>
                        </div>
                      </div>
                      <div className="text-2xl font-black text-blue-800 bg-blue-50 px-5 py-2 rounded-2xl border border-blue-100 shadow-sm">
                        {currentData[c.id as keyof CandidateData] || 0}
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max={c.weight} 
                      value={currentData[c.id as keyof CandidateData] || 0} 
                      onChange={e => handleScoreChange(c.id, parseInt(e.target.value))} 
                      className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-800 transition-all hover:bg-slate-200" 
                    />
                  </div>
                ))}
                
                {/* Mobile Notes Area */}
                <div className="lg:hidden bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 mt-8">
                  <div className="flex items-center gap-3 text-slate-400 mb-4 font-black uppercase tracking-[0.2em] text-[11px]">
                    <FileText size={16} />
                    <span>Qualitative Assessment</span>
                  </div>
                  <textarea 
                    value={currentData.notes} 
                    onChange={e => setScores(p => ({
                      ...p, 
                      [currentName]: {...p[currentName], notes: e.target.value}
                    }))} 
                    placeholder="Summarize candidate alignment..." 
                    className="w-full h-40 p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm outline-none resize-none focus:bg-white focus:border-blue-200 transition-all" 
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            /* RANKINGS TAB */
            <motion.div 
              key="rankings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto space-y-4 pb-20"
            >
              <div className="flex justify-between items-center mb-8 px-4">
                <h2 className="text-2xl font-black text-blue-900 tracking-tight">Consolidated Rankings</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{CANDIDATES.length} Total Applicants</p>
              </div>
              {sortedCandidates.map((c, idx) => {
                const cData = scores[c.name] || { total: 0, experience: "No" };
                const isTop = topFiveNames.includes(c.name);
                return (
                  <motion.div 
                    key={c.name} 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200 flex items-center justify-between hover:border-blue-400 hover:shadow-md transition-all group overflow-hidden relative"
                  >
                    <div className="flex items-center gap-6 relative z-10">
                      <div className={`text-sm font-black w-8 h-8 flex items-center justify-center rounded-full ${idx < 3 ? 'bg-blue-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <button 
                          onClick={() => {
                            setSelectedIdx(CANDIDATES.findIndex(cand => cand.name === c.name));
                            setActiveTab('evaluation');
                          }}
                          className="font-black text-lg text-blue-900 hover:text-blue-700 flex items-center gap-2 group/btn cursor-pointer"
                        >
                          {c.name} 
                          <Layout size={16} className="opacity-0 group-hover/btn:opacity-100 transition-opacity text-slate-400" />
                        </button>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${cData.experience === 'Yes' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                            Qualified: {cData.experience}
                          </span>
                          {isTop && (
                            <span className="flex items-center gap-1 text-yellow-600 font-bold text-[10px] uppercase">
                              <Star size={12} fill="currentColor" /> Top Tier
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`text-3xl font-black tabular-nums transition-colors duration-500 relative z-10 ${getScoreColorClass(cData.total)}`}>
                      {cData.total}
                    </div>
                    
                    {/* Subtle BG wash based on total score */}
                    <div 
                      className="absolute inset-x-0 bottom-0 h-1 transition-all opacity-20 duration-500"
                      style={{ 
                        backgroundColor: cData.total >= 80 ? '#10b981' : cData.total >= 65 ? '#f59e0b' : '#f43f5e',
                        width: `${cData.total}%`
                      }}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- FIXED ACTION BAR --- */}
      {activeTab === 'evaluation' && (
        <footer className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-[60] shadow-2xl">
          <div className="max-w-6xl mx-auto flex justify-center">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={save} 
              disabled={status === 'saving'}
              className={`w-full md:w-auto md:min-w-[400px] py-5 px-12 rounded-[2rem] font-black text-white shadow-2xl flex justify-center items-center gap-3 transition-all text-lg disabled:opacity-70 ${
                status === 'success' ? 'bg-emerald-600 shadow-emerald-200' : 
                status === 'error' ? 'bg-rose-600' :
                'bg-blue-900 hover:bg-blue-800 shadow-blue-200'
              }`}
            >
              <AnimatePresence mode="wait">
                {status === 'saving' ? (
                  <motion.span 
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <RefreshCw className="animate-spin" size={20} /> Syncing with Sheet...
                  </motion.span>
                ) : status === 'success' ? (
                  <motion.span 
                    key="success"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle size={22} /> Successfully Updated
                  </motion.span>
                ) : status === 'error' ? (
                  <motion.span 
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3"
                  >
                    Error Saving
                  </motion.span>
                ) : (
                  <motion.span 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3"
                  >
                    <Save size={22} /> Update Candidate Profile
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </footer>
      )}
    </div>
  );
}
