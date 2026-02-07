import React, { useState, useEffect, useCallback } from 'react';
import { Bidang, ReportData, ArchiveItem } from './types';
import { BIDANG_THEMES } from './constants';
import ReportForm from './components/ReportForm';
import { 
  FileText, Archive, CheckCircle2, Trash2, Loader2, Briefcase, 
  Users, BookOpen, Trophy, Palette, Sparkles, RefreshCw, Zap 
} from 'lucide-react';

// PASTIKAN URL GAS CIKGU BETUL
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

  // --- FUNGSI AI TERBARU (HANYA PANGGIL GAS) ---
  const handleGenerateAI = async () => {
    if (!reportData.tajuk) {
      alert("Sila isi Tajuk Program dulu Bor!");
      return;
    }

    let key = localStorage.getItem("DEEPSEEK_API_KEY");
    if (!key) {
      key = prompt("Masukkan API KEY DeepSeek anda:");
      if (key) localStorage.setItem("DEEPSEEK_API_KEY", key);
      else return;
    }

    setIsAIThinking(true);

    try {
      const response = await fetch(GAS_WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "generateAI",
          tajuk: reportData.tajuk,
          apiKey: key
        })
      });

      const rawText = await response.text();
      let result;
      try {
        result = JSON.parse(rawText);
      } catch (e) {
        throw new Error("Respon GAS bukan JSON: " + rawText);
      }

      if (result.error) throw new Error(JSON.stringify(result.error));

      // Baca content dari DeepSeek
      if (result.choices && result.choices[0]?.message?.content) {
        const aiText = result.choices[0].message.content;
        const parts = aiText.split(/\[IMPAK\]/i);
        
        updateReportData({
          objektif: parts[0].replace(/\[OBJEKTIF\]/i, "").trim(),
          impak: parts[1] ? parts[1].trim() : ""
        });
      } else {
        throw new Error("Format AI tak betul atau baki kredit habis.");
      }
    } catch (err: any) {
      alert("RALAT AI: " + err.message);
      localStorage.removeItem("DEEPSEEK_API_KEY"); // Reset key jika ralat
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
    } catch (error) { console.error(error); } finally { setIsLoadingArchive(false); }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(reportData)); }, [reportData]);
  useEffect(() => { fetchCentralArchive(); }, [fetchCentralArchive]);

  const updateReportData = (newData: Partial<ReportData>) => {
    setReportData(prev => ({ ...prev, ...newData }));
  };

  const handleReset = () => {
    if (window.confirm("Padam draf & API Key?")) {
      setReportData(INITIAL_REPORT_DATA);
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleSubmit = async () => {
    if (!reportData.tajuk || !reportData.reporterName || reportData.images.length === 0) {
      alert("Lengkapkan tajuk, nama & gambar!");
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
        setShowSuccess(true);
        setReportData({ ...INITIAL_REPORT_DATA, logo: reportData.logo });
      }
    } catch (err) { alert("Gagal hantar."); } finally { setIsSubmitting(false); setIsAnimating(false); }
  };

  const currentTheme = BIDANG_THEMES[reportData.bidang];

  return (
    <div className={`min-h-screen transition-all bg-gradient-to-br ${currentTheme} p-4 md:p-12`}>
      {isAnimating && <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center text-white font-bold">MENJANA PDF...</div>}
      
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md rounded-[2rem] p-6 shadow-2xl border border-white/20">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-black text-white uppercase">SSEMJ OPR V24.23</h1>
          <button 
            onClick={handleGenerateAI}
            disabled={isAIThinking}
            className="mt-6 flex items-center gap-2 mx-auto bg-white text-indigo-600 px-8 py-4 rounded-full font-black text-xs uppercase shadow-xl hover:scale-105 transition-all"
          >
            {isAIThinking ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
            {isAIThinking ? "AI Sedang Menulis..." : "Generate AI (DeepSeek)"}
          </button>
        </header>

        <nav className="flex justify-center gap-4 mb-8">
          <button onClick={() => setView('form')} className={`px-6 py-2 rounded-xl font-bold ${view === 'form' ? 'bg-white text-gray-900' : 'text-white border'}`}>EDITOR</button>
          <button onClick={() => setView('archive')} className={`px-6 py-2 rounded-xl font-bold ${view === 'archive' ? 'bg-white text-gray-900' : 'text-white border'}`}>ARKIB</button>
          <button onClick={handleReset} className="px-6 py-2 bg-red-500/20 text-red-200 rounded-xl font-bold"><Trash2 size={16}/></button>
        </nav>

        {view === 'form' ? (
          <ReportForm data={reportData} onChange={updateReportData} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        ) : (
          <div className="bg-white p-6 rounded-3xl">
            {archive.map(item => (
              <div key={item.id} className="border-b py-4 flex justify-between items-center text-gray-800">
                <span className="font-bold uppercase text-sm">{item.tajuk}</span>
                <a href={item.driveLink} target="_blank" className="text-indigo-600 font-bold text-xs">PDF</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
