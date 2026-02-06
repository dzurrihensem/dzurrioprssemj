
import React, { useState } from 'react';
import { Bidang, ReportData, TimingType, TimeOption } from '../types';
import { Sparkles, Image as ImageIcon, Plus, Trash2, Send, Loader2, Eye, X, Upload, Filter } from 'lucide-react';
import SignaturePad from './SignaturePad';
import { generateIdeas } from '../services/geminiService';
import { 
  BIDANG_SOFT_BG, 
  BIDANG_BORDERS, 
  BIDANG_ACCENTS, 
  PERINGKAT_OPTIONS, 
  BIDANG_HEX_COLORS, 
  BIDANG_SECONDARY_HEX,
  PENCAPAIAN_OPTIONS,
  REPORTER_DATABASE,
  SUBJECT_FIELDS,
  JAWATAN_BY_DEPT
} from '../constants';

interface ReportFormProps {
  data: ReportData;
  onChange: (data: Partial<ReportData>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const ReportForm: React.FC<ReportFormProps> = ({ data, onChange, onSubmit, isSubmitting }) => {
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isAddingNewName, setIsAddingNewName] = useState(false);
  const [selectedStaffDept, setSelectedStaffDept] = useState<string>('');

  const softBg = BIDANG_SOFT_BG[data.bidang];
  const borderCol = BIDANG_BORDERS[data.bidang];
  const accentClasses = BIDANG_ACCENTS[data.bidang];
  const hexPrimary = BIDANG_HEX_COLORS[data.bidang];
  const hexSecondary = BIDANG_SECONDARY_HEX[data.bidang];
  
  const pdfGradient = `linear-gradient(90deg, ${hexPrimary} 0%, ${hexSecondary} 100%)`;
  const pdfGradientRev = `linear-gradient(90deg, ${hexSecondary} 0%, ${hexPrimary} 100%)`;

  const getPreviewFontSize = (text: string) => {
    const len = text.length;
    if (len > 400) return '8pt';
    if (len > 250) return '9pt';
    return '9.5pt';
  };

  const getTitleFontSize = (text: string) => {
    const len = (text || "").length;
    if (len > 120) return '9pt';
    if (len > 80) return '11pt';
    return '13pt';
  };

  const getMetaFontSize = (text: string) => {
    const len = (text || "").length;
    if (len > 35) return '5.5pt';
    if (len > 25) return '6.5pt';
    if (len > 15) return '7.5pt';
    return '9pt';
  };

  const getSmallBoxFontSize = (text: string) => {
    const len = (text || "").length;
    if (len > 60) return '7pt';
    if (len > 40) return '8.5pt';
    return '10.5pt';
  };

  const getTimeDisplay = () => {
    if (data.timeOption === 'Specific Time Range') {
      return `${data.startTime || '00:00'} - ${data.endTime || '00:00'}`;
    }
    if (data.timeOption === 'All Day') return 'SEPANJANG HARI';
    if (data.timeOption === 'Throughout Program') return 'SEPANJANG PROGRAM';
    return '';
  };

  const handleNameSelect = (val: string) => {
    if (val === 'ADD_NEW') {
      setIsAddingNewName(true);
      onChange({ reporterName: '', reporterJawatan: '' });
      return;
    }

    setIsAddingNewName(false);
    let autoJawatan = '';

    // Cari dalam database jawatan mengikut nama
    for (const [dept, names] of Object.entries(REPORTER_DATABASE)) {
      if (names.includes(val)) {
        // Mapping auto untuk nama sedia ada
        const deptJawatans = JAWATAN_BY_DEPT[dept] || [];
        if (dept === 'PENTADBIRAN') {
           if (val === 'TEE TIAM CHAI') autoJawatan = 'Pengetua SSEMJ';
           else if (val === 'SITI JAUHARA BINTI JAMIAN') autoJawatan = 'Penolong Kanan Kurikulum SSEMJ';
           else if (val === 'MUHAMAD SAFIDZAN BIN SALMAN') autoJawatan = 'Penolong Kanan HEM SSEMJ';
           else if (val === 'KHAIRINA BT WAHLED @ WALID') autoJawatan = 'Penolong Kanan Kokurikulum SSEMJ';
           else if (val === 'MAH NYUK YING') autoJawatan = 'Penolong Kanan Kesenian SSEMJ';
        } else {
           autoJawatan = deptJawatans[0] || '';
        }
        break;
      }
    }

    onChange({ 
      reporterName: val, 
      reporterJawatan: autoJawatan || data.reporterJawatan 
    });
  };

  const compressImage = (base64Str: string, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 0.95);
      onChange({ logo: compressed });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const files = Array.from(fileList) as File[];
    const availableSlots = 4 - data.images.length;
    if (files.length === 0) return;
    if (files.length > availableSlots) {
      alert(`Anda hanya boleh menambah ${availableSlots} lagi gambar untuk memenuhi had 4 imej.`);
      files.splice(availableSlots);
    }
    const readerPromises = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const compressed = await compressImage(reader.result as string);
          resolve(compressed);
        };
        reader.readAsDataURL(file);
      });
    });
    const newImages = await Promise.all(readerPromises);
    onChange({ images: [...data.images, ...newImages] });
  };

  const removeImage = (index: number) => {
    const newImages = [...data.images];
    newImages.splice(index, 1);
    onChange({ images: newImages });
  };

  const handleAIRequest = async (type: 'objektif' | 'impak') => {
    if (!data.tajuk) {
      alert("Sila masukkan Tajuk Program terlebih dahulu untuk rujukan AI.");
      return;
    }
    setAiLoading(type);
    try {
      const suggestion = await generateIdeas(data.tajuk, type);
      onChange({ [type]: suggestion });
    } catch (err: any) {
      alert(err.message || "AI sedang berehat sebentar. Sila cuba lagi.");
    } finally {
      setAiLoading(null);
    }
  };

  const inputBase = `w-full p-4 rounded-3xl border bg-white text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-opacity-20 transition-all duration-300 outline-none shadow-sm`;

  // Filter jawatan berdasarkan unit yang dipilih
  const getFilteredJawatans = () => {
    if (selectedStaffDept && JAWATAN_BY_DEPT[selectedStaffDept]) {
      return [...JAWATAN_BY_DEPT[selectedStaffDept], 'Lain-lain (nyatakan)'];
    }
    // Jika tiada filter, tunjuk semua kategori
    return Object.values(JAWATAN_BY_DEPT).flat().concat(['Lain-lain (nyatakan)']);
  };

  return (
    <div className="space-y-10 bg-white/95 backdrop-blur-2xl p-6 md:p-14 rounded-[3.5rem] shadow-2xl border border-white/50 relative overflow-hidden">
      
      {/* Identiti Korporat */}
      <section className={`p-6 md:p-12 rounded-[3rem] border-2 ${softBg} ${borderCol} space-y-6 transition-all duration-700`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-3 h-10 rounded-full ${accentClasses.split(' ')[2].replace('border-', 'bg-')}`}></div>
          <h3 className={`text-2xl font-black ${accentClasses.split(' ')[0]} uppercase tracking-tight`}>0. Identiti Korporat</h3>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-10 p-8 bg-white/60 rounded-[2.5rem] border-2 border-dashed border-gray-200 shadow-inner">
          <div className="w-36 h-36 shrink-0 bg-white rounded-3xl border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden group">
             {data.logo ? (
               <img src={data.logo} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" alt="Logo" />
             ) : (
               <div className="text-gray-300 flex flex-col items-center">
                 <Upload size={40} />
                 <span className="text-[9px] font-black mt-3 text-center px-4 uppercase tracking-widest">Klik Upload Logo</span>
               </div>
             )}
          </div>
          <div className="flex-1 space-y-5 text-center md:text-left">
            <div>
              <h4 className="font-black text-gray-900 uppercase tracking-tighter text-xl">Logo Rasmi Jabatan</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mt-1">
                Logo sedia ada SSEMJ boleh digunakan atau muat naik logo unit/jabatan spesifik.
              </p>
            </div>
            <label className={`inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gray-900 text-white font-black text-[11px] uppercase tracking-widest cursor-pointer hover:bg-indigo-600 transition-all shadow-2xl hover:scale-105 active:scale-95`}>
              <Upload size={16} /> Pilih Fail Imej
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
        </div>
      </section>

      {/* Maklumat Asas */}
      <section className={`p-6 md:p-12 rounded-[3rem] border-2 ${softBg} ${borderCol} space-y-8 transition-all duration-700`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-6">
           <div className="flex items-center gap-4">
            <div className={`w-3 h-10 rounded-full ${accentClasses.split(' ')[2].replace('border-', 'bg-')}`}></div>
            <h3 className={`text-2xl font-black ${accentClasses.split(' ')[0]} uppercase tracking-tight`}>1. Maklumat Asas</h3>
          </div>
          <div className="w-full md:w-40">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] block mb-2">Tahun / Siri</label>
            <input
              type="text"
              placeholder="2026"
              value={data.siri}
              onChange={(e) => onChange({ siri: e.target.value })}
              className={`${inputBase} ${borderCol} text-center font-black text-2xl border-2`}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Kategori Bidang</label>
            <select
              value={data.bidang}
              onChange={(e) => onChange({ bidang: e.target.value as Bidang })}
              className={`${inputBase} ${borderCol} font-black cursor-pointer text-gray-900 border-2`}
            >
              {Object.values(Bidang).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Peringkat Pelaksanaan</label>
            <select
              value={data.peringkat}
              onChange={(e) => onChange({ peringkat: e.target.value })}
              className={`${inputBase} ${borderCol} font-bold cursor-pointer border-2`}
            >
              {PERINGKAT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Tajuk Rasmi Program / Aktiviti</label>
          <input
            type="text"
            placeholder="CONTOH: PROGRAM PEMANTAPAN KREATIVITI SENI VISUAL 2026"
            value={data.tajuk}
            onChange={(e) => onChange({ tajuk: e.target.value })}
            className={`${inputBase} ${borderCol} font-black uppercase text-2xl placeholder-gray-200 border-2 py-6`}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Lokasi / Tempat Aktiviti</label>
            <input
              type="text"
              placeholder="Cth: Dewan Seri Seni / Google Meet"
              value={data.lokasi}
              onChange={(e) => onChange({ lokasi: e.target.value })}
              className={`${inputBase} ${borderCol} border-2`}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Penganjur / Urusetia</label>
            <input
              type="text"
              placeholder="Cth: Unit HEM & Lembaga Pengawas"
              value={data.anjuran}
              onChange={(e) => onChange({ anjuran: e.target.value })}
              className={`${inputBase} ${borderCol} border-2`}
            />
          </div>
        </div>
      </section>

      {/* Tarikh & Masa */}
      <section className={`p-6 md:p-12 rounded-[3rem] border-2 ${softBg} ${borderCol} space-y-8 transition-all duration-700`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-3 h-10 rounded-full ${accentClasses.split(' ')[2].replace('border-', 'bg-')}`}></div>
          <h3 className={`text-2xl font-black ${accentClasses.split(' ')[0]} uppercase tracking-tight`}>2. Penjadualan</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Format Tarikh</label>
            <select
              value={data.timingType}
              onChange={(e) => onChange({ timingType: e.target.value as TimingType })}
              className={`${inputBase} ${borderCol} border-2`}
            >
              <option value="Single Day">Satu Hari Sahaja</option>
              <option value="Date Range">Julat (Mula - Tamat)</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1 space-y-3">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">{data.timingType === 'Single Day' ? 'Tarikh' : 'Mula'}</label>
              <input
                type="date"
                value={data.startDate}
                onChange={(e) => onChange({ startDate: e.target.value })}
                className={`${inputBase} ${borderCol} border-2`}
              />
            </div>
            {data.timingType === 'Date Range' && (
              <div className="flex-1 space-y-3">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Tamat</label>
                <input
                  type="date"
                  value={data.endDate}
                  onChange={(e) => onChange({ endDate: e.target.value })}
                  className={`${inputBase} ${borderCol} border-2`}
                />
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Format Masa</label>
            <select
              value={data.timeOption}
              onChange={(e) => onChange({ timeOption: e.target.value as TimeOption })}
              className={`${inputBase} ${borderCol} border-2`}
            >
              <option value="Specific Time Range">Masa Spesifik</option>
              <option value="All Day">Sepanjang Hari</option>
              <option value="Throughout Program">Sepanjang Program</option>
            </select>
          </div>
          {data.timeOption === 'Specific Time Range' && (
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex-1 space-y-3">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Mula</label>
                <input
                  type="time"
                  value={data.startTime}
                  onChange={(e) => onChange({ startTime: e.target.value })}
                  className={`${inputBase} ${borderCol} border-2`}
                />
              </div>
              <div className="flex-1 space-y-3">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Tamat</label>
                <input
                  type="time"
                  value={data.endTime}
                  onChange={(e) => onChange({ endTime: e.target.value })}
                  className={`${inputBase} ${borderCol} border-2`}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Kandungan Laporan */}
      <section className={`p-6 md:p-12 rounded-[3rem] border-2 ${softBg} ${borderCol} space-y-10 transition-all duration-700`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-3 h-10 rounded-full ${accentClasses.split(' ')[2].replace('border-', 'bg-')}`}></div>
          <h3 className={`text-2xl font-black ${accentClasses.split(' ')[0]} uppercase tracking-tight`}>3. Kandungan Laporan</h3>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 gap-4">
            <div className="flex flex-col">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">Objektif Utama Program</label>
              <span className={`text-[10px] font-bold ${data.objektif.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                {data.objektif.length} / 500 AKSARA
              </span>
            </div>
            <button
              onClick={() => handleAIRequest('objektif')}
              disabled={!!aiLoading}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[11px] font-black tracking-widest transition-all duration-300 shadow-xl w-full sm:w-auto
                ${aiLoading === 'objektif' 
                  ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed animate-pulse' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0'
                }`}
            >
              {aiLoading === 'objektif' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-yellow-400" />}
              {aiLoading === 'objektif' ? 'MENJANA...' : 'AI SMART SUGGEST'}
            </button>
          </div>
          <textarea
            rows={5}
            maxLength={500}
            value={data.objektif}
            onChange={(e) => onChange({ objektif: e.target.value })}
            placeholder="Terangkan objektif pelaksanaan program dengan tepat (Maksimum 500 aksara)..."
            className={`${inputBase} ${borderCol} resize-none font-medium leading-relaxed text-gray-700 border-2 p-6 shadow-inner`}
          />
        </div>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 gap-4">
            <div className="flex flex-col">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">Impak & Keberhasilan</label>
              <span className={`text-[10px] font-bold ${data.impak.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                {data.impak.length} / 500 AKSARA
              </span>
            </div>
            <button
              onClick={() => handleAIRequest('impak')}
              disabled={!!aiLoading}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[11px] font-black tracking-widest transition-all duration-300 shadow-xl w-full sm:w-auto
                ${aiLoading === 'impak' 
                  ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed animate-pulse' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0'
                }`}
            >
              {aiLoading === 'impak' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-yellow-400" />}
              {aiLoading === 'impak' ? 'MENJANA...' : 'AI SMART SUGGEST'}
            </button>
          </div>
          <textarea
            rows={5}
            maxLength={500}
            value={data.impak}
            onChange={(e) => onChange({ impak: e.target.value })}
            placeholder="Rumuskan keberhasilan dan kejayaan program (Maksimum 500 aksara)..."
            className={`${inputBase} ${borderCol} resize-none font-medium leading-relaxed text-gray-700 border-2 p-6 shadow-inner`}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Sasaran & Penglibatan</label>
            <input
              type="text"
              placeholder="Cth: 120 Murid & 10 Guru"
              value={data.penglibatan}
              onChange={(e) => onChange({ penglibatan: e.target.value })}
              className={`${inputBase} ${borderCol} border-2`}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Pencapaian Utama</label>
            <select
              value={data.pencapaian.includes('(') ? data.pencapaian.split(' (')[0] + ' (nyatakan)' : data.pencapaian}
              onChange={(e) => onChange({ pencapaian: e.target.value })}
              className={`${inputBase} ${borderCol} font-bold border-2`}
            >
              <option value="">-- Pilih Pencapaian --</option>
              {PENCAPAIAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {(data.pencapaian.includes('nyatakan') || data.pencapaian.includes('Lain-lain') || data.pencapaian.includes('Anugerah Khas')) && (
              <input
                type="text"
                placeholder="Sila nyatakan pencapaian..."
                value={data.pencapaian.includes('(') ? data.pencapaian.split(' (')[1]?.replace(')', '') || '' : ''}
                onChange={(e) => {
                  const base = data.pencapaian.split(' (')[0];
                  onChange({ pencapaian: `${base} (${e.target.value})` });
                }}
                className={`${inputBase} ${borderCol} border-2 mt-2 animate-in slide-in-from-top-2`}
              />
            )}
          </div>
        </div>
      </section>

      {/* Eviden Visual */}
      <section className={`p-6 md:p-12 rounded-[3rem] border-2 ${softBg} ${borderCol} space-y-8 transition-all duration-700`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-10 rounded-full ${accentClasses.split(' ')[2].replace('border-', 'bg-')}`}></div>
            <h3 className={`text-2xl font-black ${accentClasses.split(' ')[0]} uppercase tracking-tight flex items-center gap-4`}>
              <ImageIcon size={28} /> 4. Eviden Bergambar
            </h3>
          </div>
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest bg-white px-6 py-2 rounded-full shadow-md border border-gray-100 text-center">
            {data.images.length} / 4 GAMBAR
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {data.images.map((img, idx) => (
            <div key={idx} className={`relative aspect-[4/3] bg-white border-2 ${borderCol} rounded-[2rem] overflow-hidden group shadow-2xl ring-4 ring-white`}>
              <img src={img} alt={`Eviden ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <button
                  onClick={() => removeImage(idx)}
                  className="p-5 bg-red-600 text-white rounded-full shadow-2xl hover:bg-red-500 hover:scale-110 active:scale-95 transition-all"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            </div>
          ))}
          {data.images.length < 4 && (
            <label className={`aspect-[4/3] border-4 border-dashed ${borderCol} rounded-[2rem] flex flex-col items-center justify-center cursor-pointer bg-white/40 hover:bg-white hover:border-solid transition-all shadow-inner group relative overflow-hidden`}>
              <Plus size={40} className={accentClasses.split(' ')[0]} />
              <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>
      </section>

      {/* Pengesahan */}
      <section className={`p-6 md:p-12 rounded-[3rem] border-2 ${softBg} ${borderCol} space-y-10 transition-all duration-700`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-3 h-10 rounded-full ${accentClasses.split(' ')[2].replace('border-', 'bg-')}`}></div>
          <h3 className={`text-2xl font-black ${accentClasses.split(' ')[0]} uppercase tracking-tight`}>5. Pengesahan & Tandatangan</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            {/* TAPISAN BAHAGIAN/UNIT */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4 flex items-center gap-2">
                <Filter size={12} /> Tapis Mengikut Bahagian / Unit Pelapor
              </label>
              <select
                value={selectedStaffDept}
                onChange={(e) => setSelectedStaffDept(e.target.value)}
                className={`${inputBase} ${borderCol} font-bold text-gray-900 border-2 bg-indigo-50/20`}
              >
                <option value="">-- Semua Bahagian --</option>
                {SUBJECT_FIELDS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Nama Penuh Pelapor</label>
              {!isAddingNewName ? (
                <select
                  value={data.reporterName}
                  onChange={(e) => handleNameSelect(e.target.value)}
                  className={`${inputBase} ${borderCol} font-black text-gray-900 border-2 py-5 ring-offset-2 ring-indigo-500/20 focus:ring-4`}
                >
                  <option value="">-- Pilih Nama Pelapor --</option>
                  <option value="ADD_NEW" className="font-bold text-indigo-600">➕ TAMBAH NAMA (DAFTAR BARU)</option>
                  {Object.entries(REPORTER_DATABASE)
                    .filter(([bidang]) => !selectedStaffDept || bidang === selectedStaffDept)
                    .map(([bidang, names]) => (
                    <optgroup key={bidang} label={bidang}>
                      {names.map(name => <option key={name} value={name}>{name}</option>)}
                    </optgroup>
                  ))}
                </select>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Daftar Guru Baru</span>
                    <button onClick={() => setIsAddingNewName(false)} className="text-[9px] font-bold text-gray-400 hover:text-red-500 underline">Batal</button>
                  </div>
                  <input
                    type="text"
                    placeholder="NAMA PENUH ANDA"
                    value={data.reporterName}
                    onChange={(e) => onChange({ reporterName: e.target.value.toUpperCase() })}
                    className={`${inputBase} ${borderCol} uppercase font-black text-gray-900 border-2`}
                  />
                </div>
              )}
            </div>

            {/* JAWATAN DINAMIK BERASASKAN FILTER */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Jawatan & Unit Jabatan</label>
              <select
                value={data.reporterJawatan.includes('(') ? 'Lain-lain (nyatakan)' : data.reporterJawatan}
                onChange={(e) => onChange({ reporterJawatan: e.target.value })}
                className={`${inputBase} ${borderCol} font-bold border-2 py-5 ${data.reporterJawatan ? 'bg-indigo-50/30' : ''}`}
              >
                <option value="">-- Pilih Jawatan --</option>
                {getFilteredJawatans().map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {(data.reporterJawatan === 'Lain-lain (nyatakan)' || data.reporterJawatan.includes('(')) && (
                <input
                  type="text"
                  placeholder="SILA NYATAKAN JAWATAN ANDA"
                  value={data.reporterJawatan.includes('(') ? data.reporterJawatan.split(' (')[1].replace(')', '') : ''}
                  onChange={(e) => onChange({ reporterJawatan: `Lain-lain (${e.target.value.toUpperCase()})` })}
                  className={`${inputBase} ${borderCol} border-2 mt-2 animate-in slide-in-from-top-2 uppercase font-black text-indigo-600`}
                />
              )}
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4 text-center md:text-left block">Tandatangan Digital Pelapor</label>
            <SignaturePad 
              onSave={(sig) => onChange({ signature: sig })} 
              initialValue={data.signature} 
              borderColorClass={borderCol}
            />
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="pt-12 flex flex-col items-center gap-8">
        <div className="w-full flex flex-col md:flex-row gap-6 max-w-4xl">
          <button
            onClick={() => setShowPreview(true)}
            className="flex-1 flex items-center justify-center gap-4 py-8 bg-white text-gray-900 border-4 border-gray-900 font-black rounded-[2.5rem] shadow-2xl hover:bg-gray-50 active:scale-95 transition-all uppercase tracking-[0.3em] text-[11px]"
          >
            <Eye size={24} /> Pratonton OPR
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-[1.4] flex items-center justify-center gap-4 py-8 bg-gray-900 text-white font-black rounded-[2.5rem] shadow-2xl hover:scale-[1.03] active:scale-95 transition-all uppercase tracking-[0.3em] text-[11px] ring-8 ring-gray-900/10 disabled:bg-gray-400"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
            {isSubmitting ? 'Menjana Fail PDF...' : 'Sahkan & Hantar'}
          </button>
        </div>
      </div>

      {/* Full Preview Modal Code (Unchanged) */}
      {showPreview && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-4 md:p-12 overflow-y-auto">
          <div className="bg-white w-full max-w-[950px] rounded-[4rem] overflow-hidden shadow-2xl animate-in zoom-in-90 duration-700">
            <div className="px-10 py-6 bg-gray-50 flex justify-between items-center border-b border-gray-100">
               <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">OPR Engine V24.16 • Digital Preview</span>
               <button onClick={() => setShowPreview(false)} className="p-4 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-[1.5rem] transition-all shadow-xl">
                <X size={24} />
              </button>
            </div>
            <div className="bg-gray-900 p-0 overflow-y-auto max-h-[75vh] flex justify-center py-12">
               {/* Modal Content - Unchanged from existing logic for brevity */}
               <div style={{ width: '595pt', height: '842pt', background: '#fff', padding: '0', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', height: '14pt', background: pdfGradient }}></div>
                <div style={{ width: '565pt', margin: '0 auto', paddingTop: '15pt', fontFamily: 'Arial, sans-serif', color: '#0f172a', position: 'relative', height: '805pt' }}>
                  <table style={{ width: '100%', marginBottom: '10pt' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '75pt', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ width: '70pt', height: '70pt', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                            {data.logo ? (
                               <img src={data.logo} style={{ maxWidth: '65pt', maxHeight: '65pt', width: 'auto', height: 'auto', display: 'block' }} alt="Logo" />
                            ) : (
                               <div style={{ width: '60pt', height: '60pt', background: '#f1f5f9', borderRadius: '10pt' }}></div>
                            )}
                          </div>
                        </td>
                        <td style={{ paddingLeft: '12pt', verticalAlign: 'middle' }}>
                          <h1 style={{ color: hexSecondary, fontWeight: '900', fontSize: '22pt', textTransform: 'uppercase', margin: 0, lineHeight: 1.1 }}>Sekolah Seni Malaysia Johor</h1>
                          <div style={{ color: hexPrimary, fontSize: '12pt', fontWeight: 'bold', letterSpacing: '3.5pt', textTransform: 'uppercase', marginTop: '5pt' }}>ONE PAGE REPORT (OPR)</div>
                        </td>
                        <td style={{ width: '110pt', textAlign: 'right', verticalAlign: 'middle' }}>
                          <table style={{ border: `2.5pt solid ${hexPrimary}`, borderRadius: '12pt', width: '90pt', float: 'right' }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: '8pt', textAlign: 'center' }}>
                                  <div style={{ fontSize: '7.5pt', fontWeight: 'bold', color: '#94a3b8' }}>SIRI</div>
                                  <div style={{ fontSize: '22pt', fontWeight: '900', color: hexPrimary }}>{data.siri || '2026'}</div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table style={{ width: '100%', border: `2.5pt solid ${hexPrimary}`, borderRadius: '14pt', marginBottom: '12pt', borderCollapse: 'separate', overflow: 'hidden' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12pt 20pt', background: '#fff' }}>
                          <div style={{ fontSize: '7pt', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '3pt' }}>Program / Aktiviti / Peristiwa</div>
                          <div style={{ fontSize: getTitleFontSize(data.tajuk), fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', lineHeight: '1.2' }}>{data.tajuk || 'PENAMAAN TAJUK PROGRAM ANDA'}</div>
                        </td>
                        <td style={{ width: '145pt', background: pdfGradient, color: '#fff', textAlign: 'center', padding: '12pt', verticalAlign: 'middle' }}>
                          <div style={{ fontSize: '15pt', fontWeight: '900', fontStyle: 'italic' }}>{data.bidang.toUpperCase()}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table style={{ width: '100%', marginBottom: '15pt' }}>
                    <tbody>
                      <tr>
                        {[
                          { l: 'Tarikh', v: data.startDate },
                          { l: 'Masa', v: getTimeDisplay() },
                          { l: 'Peringkat', v: data.peringkat || 'SEKOLAH' },
                          { l: 'Tempat', v: data.lokasi || 'LOKASI' },
                          { l: 'Pencapaian', v: data.pencapaian || 'BERJAYA' }
                        ].map((item, i) => (
                          <td key={i} style={{ padding: '3.5pt' }}>
                            <div style={{ backgroundColor: '#fff', border: `1.5pt solid ${hexPrimary}`, borderRadius: '10pt', padding: '6pt 4pt', textAlign: 'center', height: '36pt', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                              <div style={{ fontSize: '6pt', fontWeight: 'bold', color: '#64748b' }}>{item.l.toUpperCase()}</div>
                              <div style={{ fontSize: getMetaFontSize(item.v), fontWeight: '800', color: '#0f172a' }}>{item.v}</div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                  <table style={{ width: '100%', tableLayout: 'fixed' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '320pt', paddingRight: '15pt', verticalAlign: 'top' }}>
                          <table style={{ width: '100%', marginBottom: '10pt' }}>
                            <tbody>
                              <tr>
                                <td style={{ background: pdfGradient, color: '#fff', fontSize: '9pt', fontWeight: 'bold', padding: '7pt 18pt', borderRadius: '10pt 10pt 0 0', textTransform: 'uppercase' }}>Objektif Program</td>
                              </tr>
                              <tr>
                                <td style={{ border: `2pt solid ${hexPrimary}`, borderTop: '0', padding: '12pt 18pt', background: '#fff', height: '140pt' }}>
                                  <div style={{ fontSize: getPreviewFontSize(data.objektif), lineHeight: '1.5', color: '#334155' }}>{data.objektif || 'Kandungan objektif...'}</div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <table style={{ width: '100%', marginBottom: '10pt' }}>
                            <tbody>
                              <tr>
                                <td style={{ background: pdfGradientRev, color: '#fff', fontSize: '9pt', fontWeight: 'bold', padding: '7pt 18pt', borderRadius: '10pt 10pt 0 0', textTransform: 'uppercase' }}>Impak & Rumusan</td>
                              </tr>
                              <tr>
                                <td style={{ border: `2pt solid ${hexSecondary}`, borderTop: '0', padding: '12pt 18pt', background: '#fff', height: '140pt' }}>
                                  <div style={{ fontSize: getPreviewFontSize(data.impak), lineHeight: '1.5', color: '#334155' }}>{data.impak || 'Kandungan impak...'}</div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <div style={{ background: '#0f172a', color: '#fff', borderRadius: '12pt', borderLeft: `6pt solid ${hexPrimary}`, padding: '10pt 18pt', marginTop: '8pt' }}>
                            <div style={{ fontSize: '7pt', fontWeight: 'bold', color: '#94a3b8' }}>SASARAN & PENGLIBATAN</div>
                            <div style={{ fontSize: '10.5pt', fontWeight: '800', marginTop: '2pt' }}>{data.penglibatan || 'TIADA'}</div>
                          </div>
                        </td>
                        <td style={{ width: '245pt', verticalAlign: 'top' }}>
                          <div style={{ background: '#f8fafc', border: '1.5pt solid #e2e8f0', borderRadius: '18pt', padding: '15pt', height: '465pt' }}>
                            <div style={{ textAlign: 'center', marginBottom: '10pt', fontSize: '8.5pt', fontWeight: '900', color: hexPrimary, textTransform: 'uppercase' }}>Laporan Bergambar Program</div>
                            {data.images.slice(0, 4).map((img, idx) => (
                              <img key={idx} src={img} style={{ width: '100%', height: '105pt', objectFit: 'cover', borderRadius: '12pt', border: `1.5pt solid #e2e8f0`, marginBottom: '8pt', display: 'block' }} alt={`G${idx+1}`} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ position: 'absolute', bottom: '0pt', left: '0', right: '0' }}>
                    <table style={{ width: '100%' }}>
                      <tbody>
                        <tr>
                          <td>
                            <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Disediakan Oleh:</div>
                            {data.signature && <img src={data.signature} style={{ height: '35pt', maxWidth: '240pt' }} alt="Sign" />}
                            <div style={{ width: '280pt', height: '2.5pt', background: pdfGradient, marginBottom: '6pt' }}></div>
                            <div style={{ fontSize: '10.5pt', fontWeight: '900', textTransform: 'uppercase' }}>{data.reporterName || 'NAMA PELAPOR'}</div>
                            <div style={{ fontSize: '8pt', fontWeight: 'bold', color: hexPrimary, textTransform: 'uppercase' }}>{data.reporterJawatan || 'JAWATAN'}</div>
                          </td>
                          <td style={{ textAlign: 'right', verticalAlign: 'bottom', paddingBottom: '10pt' }}>
                            <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#cbd5e1' }}>SSEMJ OPR V24.16 • SOVEREIGN FINAL</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-10 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row gap-8">
              <button onClick={() => setShowPreview(false)} className="flex-1 py-7 border-4 border-gray-200 text-gray-500 font-black rounded-3xl hover:bg-white transition-all uppercase tracking-[0.25em] text-[11px]">Kembali Ke Editor</button>
              <button onClick={() => { setShowPreview(false); onSubmit(); }} disabled={isSubmitting} className="flex-[1.5] py-7 bg-black text-white font-black rounded-3xl shadow-2xl hover:scale-[1.03] transition-all uppercase tracking-[0.25em] text-[11px] flex items-center justify-center gap-5 disabled:bg-gray-400">
                {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Menjana Fail PDF...</> : <><Send size={20} /> Sahkan & Jana OPR</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportForm;
