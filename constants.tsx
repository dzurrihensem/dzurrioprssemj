
import { Bidang } from './types';

export const BIDANG_THEMES: Record<Bidang, string> = {
  [Bidang.PENTADBIRAN]: 'from-red-700 to-blue-900',
  [Bidang.HEM]: 'from-yellow-400 to-blue-800',
  [Bidang.KURIKULUM]: 'from-green-700 to-yellow-500',
  [Bidang.KOKURIKULUM]: 'from-blue-700 to-purple-800',
  [Bidang.KESENIAN]: 'from-yellow-400 to-orange-600',
};

export const BIDANG_HEX_COLORS: Record<Bidang, string> = {
  [Bidang.PENTADBIRAN]: '#b91c1c',
  [Bidang.HEM]: '#fbbf24', 
  [Bidang.KURIKULUM]: '#15803d',
  [Bidang.KOKURIKULUM]: '#1e40af',
  [Bidang.KESENIAN]: '#fbbf24',
};

export const BIDANG_SECONDARY_HEX: Record<Bidang, string> = {
  [Bidang.PENTADBIRAN]: '#1e3a8a',
  [Bidang.HEM]: '#1e3a8a', 
  [Bidang.KURIKULUM]: '#eab308',
  [Bidang.KOKURIKULUM]: '#7e22ce',
  [Bidang.KESENIAN]: '#ea580c',
};

export const BIDANG_SOFT_BG: Record<Bidang, string> = {
  [Bidang.PENTADBIRAN]: 'bg-red-50/70',
  [Bidang.HEM]: 'bg-yellow-50/70',
  [Bidang.KURIKULUM]: 'bg-green-50/70',
  [Bidang.KOKURIKULUM]: 'bg-blue-50/70',
  [Bidang.KESENIAN]: 'bg-orange-50/70',
};

export const BIDANG_BORDERS: Record<Bidang, string> = {
  [Bidang.PENTADBIRAN]: 'border-red-200',
  [Bidang.HEM]: 'border-yellow-300',
  [Bidang.KURIKULUM]: 'border-green-200',
  [Bidang.KOKURIKULUM]: 'border-blue-200',
  [Bidang.KESENIAN]: 'border-orange-200',
};

export const BIDANG_ACCENTS: Record<Bidang, string> = {
  [Bidang.PENTADBIRAN]: 'text-red-700 ring-red-500 border-red-400',
  [Bidang.HEM]: 'text-yellow-700 ring-yellow-500 border-yellow-400',
  [Bidang.KURIKULUM]: 'text-green-700 ring-green-500 border-green-400',
  [Bidang.KOKURIKULUM]: 'text-blue-700 ring-blue-500 border-blue-400',
  [Bidang.KESENIAN]: 'text-orange-700 ring-orange-500 border-orange-400',
};

export const PERINGKAT_OPTIONS = [
  'SEKOLAH',
  'DAERAH',
  'NEGERI',
  'KEBANGSAAN',
  'ANTARABANGSA'
];

export const PENCAPAIAN_OPTIONS = [
  'Johan',
  'Naib Johan',
  'Ketiga',
  'Keempat',
  'Kelima',
  'Anugerah Khas (nyatakan)',
  'Lain-lain (nyatakan)',
  'Tidak berkenaan'
];

export const SUBJECT_FIELDS = [
  'PENTADBIRAN',
  'BIDANG BAHASA',
  'BIDANG SAINS DAN MATEMATIK',
  'BIDANG SAINS KEMASYARAKATAN',
  'BIDANG SENI MUZIK',
  'BIDANG SENI VISUAL',
  'BIDANG SENI TEATER',
  'BIDANG SENI TARI'
];

// PEMETAAN JAWATAN MENGIKUT BIDANG (CONTEXT-BASED)
export const JAWATAN_BY_DEPT: Record<string, string[]> = {
  'PENTADBIRAN': [
    'Pengetua SSEMJ',
    'Penolong Kanan Kurikulum SSEMJ',
    'Penolong Kanan HEM SSEMJ',
    'Penolong Kanan Kokurikulum SSEMJ',
    'Penolong Kanan Kesenian SSEMJ'
  ],
  'BIDANG BAHASA': [
    'GKMP Bahasa SSEMJ',
    'Guru Bahasa Melayu SSEMJ',
    'Guru Bahasa Inggeris SSEMJ'
  ],
  'BIDANG SAINS DAN MATEMATIK': [
    'GKMP Sains dan Matematik SSEMJ',
    'Guru Sains SSEMJ',
    'Guru Matematik SSEMJ'
  ],
  'BIDANG SAINS KEMASYARAKATAN': [
    'GKMP Sains Kemasyarakatan SSEMJ',
    'Guru Pendidikan Islam SSEMJ',
    'Guru Pendidikan Moral SSEMJ',
    'Guru Pendidikan Jasmani SSEMJ'
  ],
  'BIDANG SENI MUZIK': ['Jurulatih Seni Muzik SSEMJ'],
  'BIDANG SENI VISUAL': ['Jurulatih Seni Visual SSEMJ'],
  'BIDANG SENI TEATER': ['Jurulatih Seni Teater SSEMJ'],
  'BIDANG SENI TARI': ['Jurulatih Seni Tari SSEMJ']
};

export const JAWATAN_OPTIONS = [
  ...Object.values(JAWATAN_BY_DEPT).flat(),
  'Lain-lain (nyatakan)'
];

export const REPORTER_DATABASE: Record<string, string[]> = {
  'PENTADBIRAN': [
    'TEE TIAM CHAI',
    'SITI JAUHARA BINTI JAMIAN',
    'MUHAMAD SAFIDZAN BIN SALMAN',
    'KHAIRINA BT WAHLED @ WALID',
    'MAH NYUK YING'
  ],
  'BIDANG SENI MUZIK': [
    'MOHD DZURRI BIN BACHOK',
    'AHMAD NAZRI BIN NORDIN',
    'MUHAMMAD SYAHIR BIN MUHAMMAD JOHRI',
    'NORHAFIZZUL BIN ZULKIFLI',
    'NOOR FAIZ BIN JAFFAR',
    'NOR SOLEHA LAILA BINTI NASIMIN',
    'NIZAM BIN RUSLI',
    'MOHAMMAD HAZIQ BIN MAT RIPING',
    'NAJWA BINTI DAUD'
  ],
  'BIDANG SENI VISUAL': [
    'ROZIDALINA BINTI ABDULLAH',
    'FAEZAH BINTI BAHARI',
    'SITI SALINA BINTI AB GHANI',
    'SITI NASUHA BINTI KHAIRUDDIN',
    'NOR ALISA BINTI JAMALUDDIN',
    'NOOR YUNIZZA BINTI BAHAR',
    'NURUL SYAHIRAH BINTI RAZALI',
    'MUHAMMAD HAIRI BIN ABDUL RAHIM'
  ],
  'BIDANG SENI TEATER': [
    'IZU HANA ZILZA BINTI IMRAN',
    'MOHAMAD NIZAM BIN MOHD YAMIN',
    'SITI BADARIAH BINTI ZAITON',
    'ANIZA BINTI JALAL',
    'SITI FARDOAS IZATI BINTI AHMAD',
    'SITI NURUL NAQUIAH BINTI MOHAMAD ISMAIL',
    'NOR SYAZANA BINTI ABD GHANI'
  ],
  'BIDANG SENI TARI': [
    'MUHAMAD FARIF BIN MARLIAS',
    'KANA ANAK JANA',
    'FAZRIZZAL BIN HUDZURI',
    'MOHD FAUZI BIN AHMAD SELO',
    'AMIRA NATASYA BINTI OTHMAN',
    'NOR HIDAYAH BINTI HAYON'
  ],
  'BIDANG BAHASA': [
    'ARINA IRRISYA BINTI ALIFF ISKANDAR KHOR',
    'MOHAMMAD ISMAIL BIN TAHA',
    'NURUL INZAH BINTI WAN ZIN',
    'ZARAMILA BINTI SALIM',
    'SARAVANAN A/L PALANISAMY',
    'MUHAIDIR BIN MOHAMAD',
    'DALILA AYU BINTI ADAN',
    'AMALINA BINTI GHAZALI',
    'HASYANTI BINTI HASHIM'
  ],
  'BIDANG SAINS DAN MATEMATIK': [
    'MOHD NAJIB BIN JAAFAR',
    'NUREMELIA BINTI MOHAMAD RAWAN',
    'SITI RAHAYU BINTI MESNAI',
    'MAZLITA BINTI MD SALLEH',
    'NURULAIN BINTI NARDIR',
    'SITI NUR HAFIZAH BINTI ABDUL LATIF',
    'NURJANNAH BINTI BERHANNUDIN'
  ],
  'BIDANG SAINS KEMASYARAKATAN': [
    'NURATIKAH BINTI ATAN',
    'NUR AZLIN BINTI JALIL',
    'MUHAMMAD SHAKIFF BIN AMAT BASRI',
    'SITI AKMAL RUHI BT SYEIKH ABDUL GHAFAR',
    'MOHD FIRDAUS BIN MOHD JALIL',
    'MUHAMMAD FAIQ BIN MAT RANI',
    'MAULIDIYA BINTI UMAR LAYEM'
  ]
};

export const DRIVE_FOLDER_IDS: Record<Bidang, string> = {
  [Bidang.PENTADBIRAN]: '1ZTrUzbFDhi18AJaaDq3dZQFNNvkqcQMX',
  [Bidang.KURIKULUM]: '1QfSlCfgQfOT_ipaD6N0LQizdgPx0xY9B',
  [Bidang.KOKURIKULUM]: '1YYdwLwE7i5zoAjm2sxwxKPUZId8ko865',
  [Bidang.HEM]: '1Az9Mi4GYWZtpR4hn68vNJCNSLdKftw4M',
  [Bidang.KESENIAN]: '1v0COhvlERSVS20DgdCumIi4Y-FunuL03',
};
