import React, { useState, useEffect, useCallback } from 'react';
import { Bidang, ReportData, ArchiveItem } from './types';
import { BIDANG_THEMES } from './constants';
import ReportForm from './components/ReportForm';
import { 
  FileText, 
  Archive, 
  Info, 
  CheckCircle2, 
  Trash2, 
  Loader2, 
  Briefcase, 
  Users, 
  BookOpen, 
  Trophy, 
  Palette,
  FileDown,
  Sparkles,
  RefreshCw,
  Zap
} from 'lucide-react';

const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycby6SLD1JtNU63UeIdWkUQBtiyz-lx38_8cIRYE6orP5Rm6m_PcxPpHTZhObyW3QqGvaWw/exec"; 
const STORAGE_KEY = "ssemj_opr_draft";

const INITIAL_REPORT_DATA: ReportData = {
  bidang: Bidang.PENTADBIRAN,
  peringkat: 'SEKOLAH',
  tajuk: '',
  lokasi: '',
  anjuran: '',
  siri: new Date().getFullYear().toString(),
  timingType: 'Single Day',
  startDate: new Date().toISOString().split('T')[0],
  timeOption: 'Specific Time Range',
  objektif: '',
  impak: '',
  penglibatan: '',
  pencapaian: '',
  reporterName: '',
  reporterJawatan: '',
  signature: '',
  logo: '',
  images: [],
};

const App: React.FC = () => {
  const [view, setView] = useState<'form' | 'archive'>('form');
  const [reportData, setReportData] = useState<ReportData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_REPORT_DATA;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [archive, setArchive] = useState<ArchiveItem[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);

  // --- FUNGSI AI SMART SUGGEST (REPAIRED) ---
  const handleGenerateAI = async () => {
    if (!reportData.tajuk) {
      alert("Sila isi Tajuk Program terlebih dahulu!");
      return;
    }

    let key = localStorage.getItem("GEMINI_API_KEY");
    if (!key) {
      key = prompt("Sila masukkan API KEY Gemini anda (Sekali sahaja):");
      if (key) {
        localStorage.setItem("GEMINI_API_KEY", key);
      } else return;
    }

    setIsAIThinking(true);

    try {
      const response = await fetch(GAS_WEBAPP_URL, {
        method: "POST",
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: "generateAI",
          tajuk: reportData.tajuk,
          apiKey: key
        })
      });

      const result = await response.json();
      
      if (result.error) throw new Error(result.error);

      if (result.candidates && result.candidates[0]) {
        const fullText = result.candidates[0].content.parts[0].text;
        
        // Split data secara selamat
        const objPart = fullText.split("[IMPAK]")[0].replace("[OBJEKTIF]", "").trim();
        const impakPart = fullText.split("[IMPAK]")[1]?.trim() || "";

        updateReportData({
          objektif: objPart,
          impak: impakPart
        });
      }
    } catch (err: any) {
      console.error(err);
      alert("Ralat AI: " + err.message);
    } finally {
      setIsAIThinking(false);
    }
  };

  const fetchCentralArchive = useCallback(async () => {
    setIsLoadingArchive(true);
    try {
      const response = await fetch(`${GAS_WEBAPP_URL}?action=getArkib`);
      const data = await response.json();
      if (Array.isArray(data)) {
        const formattedData: ArchiveItem[] = data.map((item: any, index: number) => ({
          id: index.toString(),
          tajuk: item.tajuk,
          bidang: item.bidang as Bidang,
          date: new Date(item.tarikh).toLocaleDateString('ms-MY'),
          driveLink: item.url
        }));
        setArchive(formattedData);
      }
    } catch (error) {
      console.error("Gagal menarik arkib pusat:", error);
    } finally {
      setIsLoadingArchive(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reportData));
  }, [reportData]);

  useEffect(() => {
    fetchCentralArchive();
  }, [fetchCentralArchive]);

  const currentTheme = BIDANG_THEMES[reportData.bidang];

  const updateReportData = (newData: Partial<ReportData>) => {
    setReportData(prev => ({ ...prev, ...newData }));
  };

  const handleReset = () => {
    if (window.confirm("Adakah anda pasti untuk memadam draf ini dan memulakan borang baru?")) {
      setReportData(INITIAL_REPORT_DATA);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const getBidangIcon = (bidang: Bidang) => {
    switch (bidang) {
      case Bidang.PENTADBIRAN: return <Briefcase size={22} />;
      case Bidang.HEM: return <Users size={22} />;
      case Bidang.KURIKULUM: return <BookOpen size={22} />;
      case Bidang.KOKURIKULUM: return <Trophy size={22} />;
      case Bidang.KESENIAN: return <Palette size={22} />;
      default: return <FileText size={22} />;
    }
  };

  const handleSubmit = async () => {
    if (!reportData.tajuk || !reportData.reporterName || reportData.images.length === 0 || !reportData.logo) {
      alert("Sila lengkapkan Tajuk Program, Nama Pelapor, Muat Naik Logo Rasmi dan sekurang-kurangnya satu gambar eviden.");
      return;
    }

    setIsSubmitting(true);
    setIsAnimating(true);
    
    try {
      const response = await fetch(GAS_WEBAPP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(reportData),
      });

      const result = await response.json();
      
      if (result.status === "success") {
        await fetchCentralArchive();
        setTimeout(() => {
          setIsAnimating(false);
          setShowSuccess(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 2000);
        const savedLogo = reportData.logo;
        setReportData({ ...INITIAL_REPORT_DATA, logo: savedLogo });
      } else {
        throw new Error(result.message || "Gagal menjana PDF.");
      }
    } catch (err: any) {
      setIsAnimating(false);
      alert(err.message || "Ralat sambungan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-1000 bg-gradient-to-br ${currentTheme}`}>
      
      {/* PROCESSING ANIMATION OVERLAY */}
      {isAnimating && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="bg-white p-14 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] text-center space-y-8 max-w-sm w-full mx-4 border-b-8 border-indigo-600 animate-in zoom-in-95 scale-110">
             <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 bg-indigo-500/30 rounded-full animate-ping"></div>
                <div className="relative bg-gradient-to-br from-indigo-500 to-indigo-700 w-32 h-32 rounded-full flex items-center justify-center text-white shadow-2xl">
                  <Loader2 size={56} className="animate-spin" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-gray-900 p-3 rounded-2xl shadow-lg animate-bounce">
                  <Sparkles size={20} />
                </div>
             </div>
             <div className="space-y-2">
               <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Memproses OPR</h2>
               <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">DZURRI SEDANG MENYUSUN DAN BANTU JANA PDF ANDA</p>
             </div>
             <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200 shadow-inner">
                <div className="h-full bg-indigo-600 rounded-full animate-progress-flow shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
             </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="text-center mb-12 text-white">
          <div className="inline-block p-6 bg-white rounded-[3rem] mb-6 shadow-[0_25px_50px_rgba(0,0,0,0.2)] border-4 border-white/40 ring-1 ring-black/5 hover:scale-105 transition-transform duration-500">
            {reportData.logo ? (
              <img src={reportData.logo} className="w-32 h-32 object-contain" alt="SSEMJ Logo" />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-gray-50 rounded-2xl text-gray-300 text-[11px] font-black uppercase text-center p-4">Muat Naik Logo</div>
            )}
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-3 drop-shadow-2xl uppercase">
            SSEMJ ONE PAGE REPORT
          </h1>
          <p className="text-sm md:text-base font-bold text-white/90 uppercase tracking-[0.35em] bg-black/20 inline-block px-8 py-2.5 rounded-full backdrop-blur-lg border border-white/10 shadow-xl">
            SISTEM PELAPORAN DIGITAL PANTAS DAN EFISIEN
          </p>

          {/* BUTANG AI SMART SUGGEST - POWER VERSION */}
          {view === 'form' && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleGenerateAI}
                disabled={isAIThinking || isSubmitting}
                className={`group relative overflow-hidden px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] transition-all duration-500 shadow-2xl ${
                  isAIThinking 
                    ? "animate-shimmer text-white scale-95 cursor-wait" 
                    : "bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border-b-4 border-gray-200 hover:border-indigo-800"
                }`}
              >
                {isAIThinking ? (
                  <div className="flex items-center gap-3">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="animate-pulse">AI Sedang Merancang...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Zap size={20} className="text-yellow-400 group-hover:fill-yellow-400" />
                    <span>✨ AI SMART SUGGEST</span>
                    <span className="absolute top-2 right-2 h-2 w-2 bg-yellow-400 rounded-full animate-ping"></span>
                  </div>
                )}
              </button>
            </div>
          )}
        </header>

        <nav className="flex flex-col sm:flex-row justify-center items-center gap-5 mb-10">
          <div className="flex gap-4 p-2 bg-black/10 backdrop-blur-md rounded-[2rem] border border-white/10 shadow-lg">
            <button
              onClick={() => { setView('form'); setShowSuccess(false); }}
              className={`flex items-center gap-3 px-10 py-4 rounded-[1.5rem] font-black transition-all uppercase tracking-widest text-xs ${
                view === 'form' ? 'bg-white text-gray-900 shadow-2xl scale-105' : 'text-white hover:bg-white/10'
              }`}
            >
              <FileText size={18} /> Editor Laporan
            </button>
            <button
              onClick={() => { 
                setView('archive'); 
                setShowSuccess(false);
                fetchCentralArchive();
              }}
              className={`flex items-center gap-3 px-10 py-4 rounded-[1.5rem] font-black transition-all uppercase tracking-widest text-xs ${
                view === 'archive' ? 'bg-white text-gray-900 shadow-2xl scale-105' : 'text-white hover:bg-white/10'
              }`}
            >
              <Archive size={18} /> Arkib Digital
            </button>
          </div>
          {view === 'form' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black transition-all uppercase tracking-widest text-[10px] bg-red-500/20 text-red-200 hover:bg-red-500 hover:text-white border border-red-500/30 backdrop-blur-md shadow-lg"
            >
              <Trash2 size={16} /> Padam Draf
            </button>
          )}
        </nav>

        {showSuccess && (
          <div className="mb-10 animate-in zoom-in duration-700 bg-white/95 backdrop-blur-2xl p-10 rounded-[3.5rem] border-4 border-green-500 shadow-[0_40px_80px_rgba(0,0,0,0.4)] relative">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="bg-green-500 p-7 rounded-[2rem] text-white shadow-2xl scale-110">
                <CheckCircle2 size={48} />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">TAHNIAH, OPR SIAP DIJANA!</h3>
                <p className="text-[11px] font-bold text-gray-500 uppercase mt-2">FAIL TELAH DISIMPAN KE DRIVE & ARKIB PUSAT.</p>
              </div>
              <button 
                onClick={() => { setView('archive'); setShowSuccess(false); fetchCentralArchive(); }}
                className="px-10 py-5 bg-indigo-600 text-white font-black text-xs uppercase rounded-2xl hover:bg-indigo-700 shadow-2xl"
              >
                Ke Arkib Digital
              </button>
            </div>
          </div>
        )}

        <main>
          {view === 'form' ? (
            <ReportForm 
              data={reportData} 
              onChange={updateReportData} 
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          ) : (
            <div className="bg-white/95 backdrop-blur-2xl p-8 md:p-14 rounded-[3.5rem] shadow-2xl border border-white/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <h2 className="text-4xl font-black text-gray-900 flex items-center gap-5 tracking-tighter uppercase">
                  <div className="p-4 bg-indigo-600 rounded-3xl text-white">
                    <Archive size={32} />
                  </div>
                  ARKIB DIGITAL OPR
                </h2>
                <div className="flex items-center gap-4">
                  <button onClick={fetchCentralArchive} disabled={isLoadingArchive} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl">
                    <RefreshCw size={20} className={isLoadingArchive ? "animate-spin" : ""} />
                  </button>
                  <div className="bg-gray-100 px-6 py-3 rounded-2xl">
                    <span className="text-indigo-600 font-black text-lg">{archive.length} REKOD</span>
                  </div>
                </div>
              </div>
              
              {isLoadingArchive ? (
                <div className="text-center py-20 text-gray-400">
                  <Loader2 size={44} className="animate-spin mx-auto mb-4 text-indigo-600" />
                  <p className="font-black uppercase text-xs">Menyambung ke Pangkalan Data...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {archive.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between p-7 bg-white border border-gray-100 rounded-[3rem] hover:shadow-xl transition-all group gap-5">
                      <div className="flex items-center gap-6 w-full">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${BIDANG_THEMES[item.bidang]}`}>
                          {getBidangIcon(item.bidang)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">{item.date} • {item.bidang}</p>
                          <h4 className="text-xl font-black text-gray-900 uppercase truncate">{item.tajuk}</h4>
                        </div>
                      </div>
                      <a href={item.driveLink} target="_blank" rel="noreferrer" className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl hover:bg-indigo-600 transition-all font-black text-[11px] uppercase">
                        <FileDown size={18} /> MUAT TURUN PDF
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="mt-20 text-center text-white/40 text-[10px] font-black uppercase tracking-[0.5em] pb-12">
          &copy; 2026 SEKOLAH SENI MALAYSIA JOHOR • V24.23.AI DZURRI
        </footer>
      </div>
      
      <style>{`
        @keyframes progress-flow {
          0% { width: 0%; margin-left: 0%; }
          30% { width: 50%; margin-left: 0%; }
          60% { width: 50%; margin-left: 50%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-progress-flow { animation: progress-flow 2s cubic-bezier(0.65, 0, 0.35, 1) infinite; }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, #4f46e5, #9333ea, #4f46e5);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default App;
