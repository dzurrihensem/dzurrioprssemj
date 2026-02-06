
/**
 * SSEMJ OPR ENGINE - V24.16 (ULTIMATE OVERFLOW PROTECTION)
 * 1. FIXED LAYOUT: Menggunakan 'table-layout: fixed' dengan penentuan lebar (width) eksplisit.
 * 2. AGGRESSIVE WRAPPING: Menggunakan 'word-wrap: break-word' terus pada elemen TD.
 * 3. DYNAMIC FONT: Font mengecil secara automatik berdasarkan jumlah aksara.
 * 4. MALAY TIME FIX: Memastikan 'All Day' dipaparkan sebagai 'SEPANJANG HARI'.
 * 5. MANUAL BR: Menukar \n kepada <br> untuk mengelakkan overflow CSS.
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Had limit aksara untuk keselamatan layout satu muka surat
    data.objektif = (data.objektif || "").substring(0, 500);
    data.impak = (data.impak || "").substring(0, 500);
    
    const folderMappingFinal = {
      "Pentadbiran": "1ZTrUzbFDhi18AJaaDq3dZQFNNvkqcQMX",
      "Kurikulum": "1QfSlCfgQfOT_ipaD6N0LQizdgPx0xY9B",
      "Kokurikulum": "1YYdwLwE7i5zoAjm2sxwxKPUZId8ko865",
      "HEM": "1Az9Mi4GYWZtpR4hn68vNJCNSLdKftw4M",
      "Kesenian": "1v0COhvlERSVS20DgdCumIi4Y-FunuL03"
    };

    const themes = {
      "Pentadbiran": { primary: "#b91c1c", secondary: "#1e3a8a", gradient: "linear-gradient(to right, #b91c1c, #1e3a8a)" },
      "HEM": { primary: "#fbbf24", secondary: "#1e3a8a", gradient: "linear-gradient(to right, #fbbf24, #1e3a8a)" },
      "Kurikulum": { primary: "#15803d", secondary: "#eab308", gradient: "linear-gradient(to right, #15803d, #eab308)" },
      "Kokurikulum": { primary: "#1e40af", secondary: "#7e22ce", gradient: "linear-gradient(to right, #1e40af, #7e22ce)" },
      "Kesenian": { primary: "#fbbf24", secondary: "#ea580c", gradient: "linear-gradient(to right, #fbbf24, #ea580c)" }
    };

    const theme = themes[data.bidang] || themes["Pentadbiran"];
    const targetFolderId = folderMappingFinal[data.bidang] || "root";
    const logoDataUri = data.logo || "";

    // Fungsi Dinamik Font (Lebih Granular)
    const getFontSize = (text) => {
      const len = (text || "").length;
      if (len > 450) return "6.5pt";
      if (len > 350) return "7.5pt";
      if (len > 250) return "8.5pt";
      return "9.5pt";
    };

    const getTitleFontSize = (text) => {
      const len = (text || "").length;
      if (len > 120) return "8.5pt";
      if (len > 80) return "10pt";
      return "12.5pt";
    };

    const getMetaFontSize = (text) => {
      const len = (text || "").length;
      if (len > 40) return "5pt";
      if (len > 25) return "6pt";
      return "8pt";
    };

    // Terjemahan Masa
    let timeValue = "";
    if (data.timeOption === 'Specific Time Range') {
      timeValue = (data.startTime || '00:00') + ' - ' + (data.endTime || '00:00');
    } else if (data.timeOption === 'All Day') {
      timeValue = "SEPANJANG HARI";
    } else if (data.timeOption === 'Throughout Program') {
      timeValue = "SEPANJANG PROGRAM";
    } else {
      timeValue = data.timeOption.toUpperCase();
    }

    // Pembersihan teks dan manual line breaks
    const cleanObjektif = (data.objektif || "").replace(/\n/g, '<br>');
    const cleanImpak = (data.impak || "").replace(/\n/g, '<br>');

    const htmlTemplate = `
    <html>
      <head>
        <style>
          @page { size: A4 portrait; margin: 0; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; padding: 0; 
            background-color: #ffffff;
            width: 595pt; 
            color: #1e293b;
          }
          .main-container {
            width: 565pt; 
            margin: 0 auto;
            padding: 12pt 0;
            position: relative;
            height: 812pt;
          }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          td { vertical-align: top; overflow: hidden; }
          
          /* KAWALAN OVERFLOW AGRESIF UNTUK PDF ENGINE */
          .wrap-td {
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-all;
            overflow: hidden;
          }

          .meta-label { font-size: 5.5pt; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 0.5pt; }
          .meta-box {
            background-color: #ffffff; 
            border: 1.5pt solid ${theme.primary}; 
            border-radius: 8pt; 
            padding: 2pt 4pt; 
            text-align: center;
            height: 32pt;
            display: table-cell;
            vertical-align: middle;
            width: 100pt;
            word-wrap: break-word;
          }
          .meta-value { font-weight: 800; color: #0f172a; text-transform: uppercase; line-height: 1.0; }

          .logo-box {
            width: 60pt; height: 60pt; background-color: #ffffff;
            text-align: center; display: table-cell; vertical-align: middle;
          }
          .logo-img { max-width: 55pt; max-height: 55pt; width: auto; height: auto; }
        </style>
      </head>
      <body>
        <div style="width: 100%; height: 10pt; background: ${theme.gradient};"></div>
        <div class="main-container">
          
          <!-- Header -->
          <table style="margin-bottom: 8pt; table-layout: fixed;">
            <tr>
              <td style="width: 70pt;">
                <div class="logo-box">
                  ${logoDataUri ? `<img src="${logoDataUri}" class="logo-img" />` : `<div style="width:55pt; height:55pt; background:#f1f5f9; border-radius:8pt;"></div>`}
                </div>
              </td>
              <td style="padding-left: 8pt; vertical-align: middle;">
                <div style="color: ${theme.secondary}; font-weight: 900; font-size: 19pt; text-transform: uppercase; line-height: 1.1;">Sekolah Seni Malaysia Johor</div>
                <div style="color: ${theme.primary}; font-size: 10.5pt; font-weight: bold; letter-spacing: 2.5pt; text-transform: uppercase; margin-top: 1pt;">ONE PAGE REPORT (OPR)</div>
              </td>
              <td style="width: 95pt; text-align: right; vertical-align: middle;">
                <div style="border: 2.5pt solid ${theme.primary}; border-radius: 9pt; width: 75pt; float: right; padding: 5pt; text-align: center;">
                  <div style="font-size: 6pt; font-weight: bold; color: #94a3b8;">SIRI</div>
                  <div style="font-size: 18pt; font-weight: 900; color: ${theme.primary};">${data.siri || '2026'}</div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Tajuk -->
          <table style="border: 2.5pt solid ${theme.primary}; border-radius: 12pt; border-collapse: separate; margin-bottom: 8pt; width: 100%; table-layout: fixed; overflow: hidden;">
            <tr>
              <td class="wrap-td" style="padding: 10pt 18pt; background-color: #ffffff; width: 400pt;">
                <div style="font-size: 5.5pt; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 1pt;">Program / Aktiviti / Peristiwa</div>
                <div style="font-size: ${getTitleFontSize(data.tajuk)}; font-weight: 900; color: #0f172a; text-transform: uppercase; line-height: 1.2;">${data.tajuk}</div>
              </td>
              <td style="width: 140pt; background: ${theme.gradient}; color: #ffffff; text-align: center; padding: 8pt; vertical-align: middle;">
                <div style="font-size: 6.5pt; font-weight: bold; opacity: 0.9;">KATEGORI BIDANG</div>
                <div style="font-size: 13pt; font-weight: 900; font-style: italic;">${data.bidang.toUpperCase()}</div>
              </td>
            </tr>
          </table>

          <!-- Metadata Grid -->
          <table style="margin-bottom: 12pt; table-layout: fixed;">
            <tr>
              <td style="padding: 2.5pt;"><div class="meta-box"><div class="meta-label">Tarikh</div><div class="meta-value wrap-td" style="font-size: ${getMetaFontSize(data.startDate)}">${data.startDate}</div></div></td>
              <td style="padding: 2.5pt;"><div class="meta-box"><div class="meta-label">Masa</div><div class="meta-value wrap-td" style="font-size: ${getMetaFontSize(timeValue)}">${timeValue}</div></div></td>
              <td style="padding: 2.5pt;"><div class="meta-box"><div class="meta-label">Peringkat</div><div class="meta-value wrap-td" style="font-size: ${getMetaFontSize(data.peringkat || 'SEKOLAH')}">${data.peringkat || 'SEKOLAH'}</div></div></td>
              <td style="padding: 2.5pt;"><div class="meta-box"><div class="meta-label">Tempat</div><div class="meta-value wrap-td" style="font-size: ${getMetaFontSize(data.lokasi)}">${data.lokasi}</div></div></td>
              <td style="padding: 2.5pt;"><div class="meta-box"><div class="meta-label">Pencapaian</div><div class="meta-value wrap-td" style="font-size: ${getMetaFontSize(data.pencapaian || 'BERJAYA')}">${data.pencapaian || 'BERJAYA'}</div></div></td>
            </tr>
          </table>

          <!-- Kandungan Utama -->
          <table style="width: 100%; table-layout: fixed;">
            <tr>
              <td style="width: 320pt; padding-right: 12pt;">
                
                <!-- Objektif -->
                <table style="width: 308pt; margin-bottom: 8pt; table-layout: fixed;">
                  <tr><td style="background: ${theme.gradient}; color: #ffffff; font-size: 8pt; font-weight: bold; padding: 5pt 15pt; border-radius: 7pt 7pt 0 0; text-transform: uppercase;">Objektif Program</td></tr>
                  <tr><td class="wrap-td" style="border: 1.8pt solid ${theme.primary}; border-top: 0; padding: 10pt 15pt; background-color: #ffffff; height: 140pt; overflow: hidden; vertical-align: top;">
                    <div style="font-size: ${getFontSize(data.objektif)}; line-height: 1.4; color: #334155; width: 278pt;">${cleanObjektif}</div>
                  </td></tr>
                </table>
                
                <!-- Impak -->
                <table style="width: 308pt; margin-bottom: 8pt; table-layout: fixed;">
                  <tr><td style="background: linear-gradient(to right, ${theme.secondary}, ${theme.primary}); color: #ffffff; font-size: 8pt; font-weight: bold; padding: 5pt 15pt; border-radius: 7pt 7pt 0 0; text-transform: uppercase;">Impak & Rumusan</td></tr>
                  <tr><td class="wrap-td" style="border: 1.8pt solid ${theme.secondary}; border-top: 0; padding: 10pt 15pt; background-color: #ffffff; height: 140pt; overflow: hidden; vertical-align: top;">
                    <div style="font-size: ${getFontSize(data.impak)}; line-height: 1.4; color: #334155; width: 278pt;">${cleanImpak}</div>
                  </td></tr>
                </table>
                
                <!-- Sasaran & Anjuran -->
                <div style="background-color: #0f172a; border-left: 5pt solid ${theme.primary}; border-radius: 9pt; color: #ffffff; padding: 8pt 16pt; margin-top: 5pt; width: 308pt;">
                  <div style="font-size: 6pt; font-weight: bold; color: #94a3b8; text-transform: uppercase;">SASARAN & PENGLIBATAN</div>
                  <div class="wrap-td" style="font-size: 8.5pt; font-weight: 800; text-transform: uppercase; margin-top: 1pt; line-height: 1.1; width: 276pt;">${data.penglibatan || 'TIADA'}</div>
                </div>
                <div style="background: ${theme.gradient}; border-radius: 9pt; color: #ffffff; padding: 8pt 16pt; margin-top: 5pt; width: 308pt;">
                  <div style="font-size: 6pt; font-weight: bold; opacity: 0.85; text-transform: uppercase;">ANJURAN / URUSETIA</div>
                  <div class="wrap-td" style="font-size: 8.5pt; font-weight: 800; text-transform: uppercase; margin-top: 1pt; line-height: 1.1; width: 276pt;">${data.anjuran || 'UNIT SSEMJ'}</div>
                </div>
              </td>
              
              <!-- Gambar -->
              <td style="width: 245pt;">
                <div style="background-color: #f8fafc; border: 1.5pt solid #e2e8f0; border-radius: 12pt; padding: 10pt; height: 460pt;">
                  <div style="text-align: center; margin-bottom: 6pt; font-size: 7.5pt; font-weight: 900; color: ${theme.primary}; text-transform: uppercase; letter-spacing: 1pt;">Laporan Bergambar Program</div>
                  ${data.images.slice(0, 4).map(img => `<img src="${img}" style="width: 100%; height: 104pt; object-fit: cover; border-radius: 8pt; border: 1.5pt solid #e2e8f0; margin-bottom: 6pt; display: block;" />`).join('')}
                </div>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <div style="position: absolute; bottom: 0pt; left: 0; right: 0;">
            <table style="width: 100%; table-layout: fixed;">
              <tr>
                <td>
                  <div style="font-size: 7pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 2pt;">Disediakan Oleh:</div>
                  ${data.signature ? `<img src="${data.signature}" style="height: 38pt; max-width: 200pt;" />` : '<div style="height: 38pt;"></div>'}
                  <div style="width: 260pt; height: 2pt; background: ${theme.gradient}; margin-bottom: 4pt;"></div>
                  <div style="font-size: 10pt; font-weight: 900; text-transform: uppercase; color: #0f172a;">${data.reporterName}</div>
                  <div style="font-size: 8pt; font-weight: bold; color: ${theme.primary}; text-transform: uppercase;">${data.reporterJawatan}</div>
                </td>
                <td style="text-align: right; vertical-align: bottom; padding-bottom: 5pt;">
                  <div style="font-size: 7pt; font-weight: bold; color: #cbd5e1; letter-spacing: 1.5pt; text-transform: uppercase;">SSEMJ OPR V24.16 • SOVEREIGN FINAL</div>
                  <div style="font-size: 6pt; color: #cbd5e1; margin-top: 2pt;">HAKCIPTA DZURRI @ 2026</div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </body>
    </html>
    `;

    const blob = Utilities.newBlob(htmlTemplate, "text/html", "temp.html");
    const pdfBlob = blob.getAs("application/pdf").setName(`OPR_${data.bidang}_${data.tajuk.substring(0,30)}.pdf`);

    const folder = DriveApp.getFolderById(targetFolderId);
    const file = folder.createFile(pdfBlob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      fileUrl: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("SSEMJ OPR Engine V24.16 is Online.");
}
