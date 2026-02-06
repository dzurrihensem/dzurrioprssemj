
export enum Bidang {
  PENTADBIRAN = 'Pentadbiran',
  HEM = 'HEM',
  KURIKULUM = 'Kurikulum',
  KOKURIKULUM = 'Kokurikulum',
  KESENIAN = 'Kesenian'
}

export type TimingType = 'Single Day' | 'Date Range';
export type TimeOption = 'Specific Time Range' | 'All Day' | 'Throughout Program';

export interface ReportData {
  bidang: Bidang;
  peringkat: string;
  tajuk: string;
  lokasi: string;
  anjuran: string;
  siri: string;
  timingType: TimingType;
  startDate: string;
  endDate?: string;
  timeOption: TimeOption;
  startTime?: string;
  endTime?: string;
  objektif: string;
  impak: string;
  penglibatan: string;
  pencapaian: string;
  reporterName: string;
  reporterJawatan: string;
  signature: string;
  logo: string; // Base64 Logo Rasmi
  images: string[];
}

export interface ArchiveItem {
  id: string;
  tajuk: string;
  bidang: Bidang;
  date: string;
  driveLink: string;
}
