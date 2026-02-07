import React, { useState, useEffect, useCallback } from 'react';
import { Bidang, ReportData, ArchiveItem } from './types';
import { BIDANG_THEMES } from './constants';
import ReportForm from './components/ReportForm';
import { 
  FileText, 
  Archive, 
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

const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyhYbYu-SX8ZNbH21b_aqYYlMO4nl5VPVxYu_Ls7zmyX7uZDCiKkUD_H19eGp3u2HPgUA/exec"; 
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

  // --- FUNGSI AI SMART SUGGEST (DEEPSEEK VERSION - STABLE) ---
  const handleGenerateAI = async () => {
    if (!reportData.tajuk) {
      alert("Sila isi Tajuk Program terlebih dahulu!");
      return;
    }

    let key = localStorage.getItem("DEEPSEEK_API_KEY");
    if (!key) {
      key = prompt("Sila masukkan API KEY DeepSeek anda (Dapatkan di chat.deepseek.com):");
      if (key) {
        localStorage.setItem("DEEPSEEK_API_KEY", key);
      } else return;
    }

    setIsAIThinking(true);

    try {
      // PANGGIL DEEPSEEK API (Lorong paling stabil masa kini)
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "user",
              content: `Bantu saya tulis objektif program sekolah. Tajuk: ${reportData.tajuk}. Berikan 3 objektif dan 2 impak dalam Bahasa Melayu. Format wajib: [OBJEKTIF] isi teks [IMPAK] isi teks. Tanpa mukadimah.`
            }
          ]
        })
      });

      const result = await response.json();
      
      if (result.error) {
        localStorage.removeItem("DEEPSEEK_API_KEY");
        throw new Error(result.error.message || "API Key DeepSeek tidak sah.");
      }

      const fullText = result.choices[0].message.content;
      const parts = fullText.split(/\[IMPAK\]/i);
      const objText = parts[0].replace(/\[OBJEKTIF\]/i, "").trim();
      const impakText = parts[1] ? parts[1].trim() : "";

      updateReportData({ objektif: objText, impak: impakText });

    } catch (err: any) {
      console.error(err);
      alert("RALAT AI: " + err.message);
    } finally {
      setIsAIThinking(false);
    }
  };

  // ... (Kod fetchCentralArchive & updateReportData sama seperti sebelum ini) ...
  const fetchCentralArchive = useCallback(async () => {
    setIsLoadingArchive(true);
    try {
      const response = await fetch(`${GAS_WEBAPP_URL}?action=getArkib`);
      const data = await response.json();
      if (Array.isArray(data)) {
        const formattedData: ArchiveItem[] = data.map((item: any, index: number) => ({
          id: index.toString(), tajuk: item.tajuk, bidang: item.bidang as Bidang,
          date: new Date(item.tarikh).toLocaleDateString('ms-MY'), driveLink: item.url
        }));
        setArchive(formattedData);
      }
    } catch (error) { console.error(error); } finally { setIsLoadingArchive(false); }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(reportData)); }, [reportData]);
  useEffect(() => { fetchCentralArchive(); }, [fetchCentralArchive]);

  const currentTheme = BIDANG_THEMES[reportData.bidang];
  const updateReportData = (newData: Partial<ReportData>) => { setReportData(prev => ({ ...prev, ...newData })); };
  const handleReset = () => { if (window.confirm("Padam draf?")) { setReportData(INITIAL_REPORT_DATA); localStorage.removeItem(STORAGE_KEY); localStorage.removeItem("DEEPSEEK_API_KEY"); } };

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
      alert("Lengkapkan maklumat wajib!"); return;
    }
    setIsSubmitting(true); setIsAnimating(true);
    try {
      const response = await fetch(GAS_WEBAPP_URL, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(reportData),
      });
      const result = await response.json();
      if (result.status === "success") {
        await fetchCentralArchive();
        setTimeout(() => { setIsAnimating(false); setShowSuccess(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 2000);
        const savedLogo = reportData.logo; setReportData({ ...INITIAL_REPORT_DATA, logo: savedLogo });
      } else { throw new Error(result.message); }
    } catch (err: any) { setIsAnimating(false); alert(err.message); } finally { setIsSubmitting(false); }
  };

  return (
    <div className={`min-h-screen transition-all duration-1000 bg-gradient-to-br ${currentTheme}`}>
      {isAnimating && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-2xl">
          <div className="bg-white p-14 rounded-[3.5rem] shadow-2xl text-center space-y-8 max-w-sm w-full mx-4 border-b-8 border-indigo-600 animate-in zoom-in-95">
             <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 bg-indigo-500/30 rounded-full animate-ping"></div>
                <div className="relative bg-gradient-to-br from-indigo-500 to-indigo-700 w-32 h-32 rounded-full flex items-center justify-center text-white shadow-2xl"><Loader2 size={56} className="animate-spin" /></div>
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-gray-900 p-3 rounded-2xl shadow-lg animate-bounce"><Sparkles size={20} /></div>
             </div>
             <div className="space-y-2">
               <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Memproses OPR</h2>
               <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em]">DZURRI ENGINE SEDANG MENYUSUN PDF</p>
             </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="text-center mb-12 text-white">
          <div className="inline-block p-6 bg-white rounded-[3rem] mb-6 shadow-2xl border-4 border-white/40">
            {reportData.logo ? <img src={reportData.logo} className="w-32 h-32 object-contain" alt="Logo" /> : <div className="w-32 h-32 flex items-center justify-center bg-gray-50 rounded-2xl text-gray-300 text-[10px] font-black uppercase p-4 text-center">MUAT NAIK LOGO</div>}
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-3 uppercase">SSEMJ ONE PAGE REPORT</h1>
          <p className="text-sm md:text-base font-bold text-white/90 uppercase tracking-[0.35em] bg-black/20 inline-block px-8 py-2.5 rounded-full backdrop-blur-lg">V24.23.DEEPSEEK POWERED</p>

          {view === 'form' && (
            <div className="mt-8 flex justify-center">
              <button onClick={handleGenerateAI} disabled={isAIThinking || isSubmitting} className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] transition-all shadow-2xl ${isAIThinking ? "bg-indigo-600 text-white scale-95" : "bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white"}`}>
                {isAIThinking ? <><Loader2 size={20} className="animate-spin" /><span>DEEPSEEK MERANCANG...</span></> : <><Zap size={20} className="text-yellow-400" /><span>✨ DEEPSEEK SMART SUGGEST</span></>}
              </button>
            </div>
          )}
        </header>

        <nav className="flex flex-col sm:flex-row justify-center items-center gap-5 mb-10">
          <div className="flex gap-4 p-2 bg-black/10 backdrop-blur-md rounded-[2rem] border border-white/10 shadow-lg">
            <button onClick={() => setView('form')} className={`px-10 py-4 rounded-[1.5rem] font-black uppercase text-xs ${view === 'form' ? 'bg-white text-gray-900 shadow-2xl scale-105' : 'text-white'}`}><FileText size={18} className="inline mr-2" /> Editor</button>
            <button onClick={() => { setView('archive'); fetchCentralArchive(); }} className={`px-10 py-4 rounded-[1.5rem] font-black uppercase text-xs ${view === 'archive' ? 'bg-white text-gray-900 shadow-2xl scale-105' : 'text-white'}`}><Archive size={18} className="inline mr-2" /> Arkib</button>
          </div>
          {view === 'form' && (
            <button onClick={handleReset} className="flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black transition-all uppercase tracking-widest text-[10px] bg-red-500/20 text-red-200 border border-red-500/30 shadow-lg"><Trash2 size={16} /> Padam Draf</button>
          )}
        </nav>

        {showSuccess && (
          <div className="mb-10 animate-in zoom-in duration-700 bg-white/95 backdrop-blur-2xl p-10 rounded-[3.5rem] border-4 border-green-500 shadow-2xl relative flex flex-col sm:flex-row items-center gap-8">
              <div className="bg-green-500 p-7 rounded-[2rem] text-white shadow-2xl scale-110"><CheckCircle2 size={48} /></div>
              <div className="text-center sm:text-left flex-1"><h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">OPR SIAP!</h3><p className="text-[11px] font-bold text-gray-500 uppercase">Fail tersimpan di Drive.</p></div>
              <button onClick={() => { setView('archive'); setShowSuccess(false); }} className="px-10 py-5 bg-indigo-600 text-white font-black text-xs uppercase rounded-2xl">Ke Arkib</button>
          </div>
        )}

        <main>
          {view === 'form' ? (
            <ReportForm data={reportData} onChange={updateReportData} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          ) : (
            <div className="bg-white/95 backdrop-blur-2xl p-8 md:p-14 rounded-[3.5rem] shadow-2xl border border-white/50">
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <h2 className="text-4xl font-black text-gray-900 flex items-center gap-5 tracking-tighter uppercase"><div className="p-4 bg-indigo-600 rounded-3xl text-white"><Archive size={32} /></div> ARKIB DIGITAL</h2>
                <button onClick={fetchCentralArchive} disabled={isLoadingArchive} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl"><RefreshCw size={20} className={isLoadingArchive ? "animate-spin" : ""} /></button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {archive.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between p-7 bg-white border border-gray-100 rounded-[3rem] hover:shadow-xl transition-all gap-5">
                    <div className="flex items-center gap-6 w-full">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${BIDANG_THEMES[item.bidang]}`}><FileText size={22} /></div>
                      <div className="flex-1 min-w-0"><p className="text-[10px] font-black text-indigo-600 uppercase mb-1">{item.date} • {item.bidang}</p><h4 className="text-xl font-black text-gray-900 uppercase truncate">{item.tajuk}</h4></div>
                    </div>
                    <a href={item.driveLink} target="_blank" rel="noreferrer" className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl hover:bg-indigo-600 transition-all font-black text-[11px] uppercase text-center">MUAT TURUN</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
        <footer className="mt-20 text-center text-white/40 text-[10px] font-black uppercase tracking-[0.5em] pb-12">© 2026 SEKOLAH SENI MALAYSIA JOHOR</footer>
      </div>
    </div>
  );
};

export default App;
