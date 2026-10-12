import React, { useState } from 'react';
import { exportDataAsCSV, exportDataAsJSON, saveWindows } from '../services/storage';
import { SessionWindow, UserSettings } from '../types/poker';
import { Download, FileText, Table, FileSpreadsheet, Printer, Upload, X, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  windows: SessionWindow[];
  onImportSuccess: (importedWindows: SessionWindow[]) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  settings,
  windows,
  onImportSuccess
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadJSON = () => {
    const jsonStr = exportDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stage1_poker_backup_${settings.period_start_shamsi.replace(/\//g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const csvStr = exportDataAsCSV();
    const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stage1_poker_records_${settings.period_start_shamsi.replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadExcel = () => {
    // Generate formatted HTML table for Excel with Persian RTL
    const active = windows.filter(w => w.total_registrations > 0);
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Stage1_Records</x:Name><x:WorksheetOptions><x:DisplayRightToLeft/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          th { background-color: #171923; color: #f3f4f6; font-weight: bold; border: 1px solid #333; }
          td { border: 1px solid #ddd; text-align: right; }
        </style>
      </head>
      <body dir="rtl">
        <table>
          <thead>
            <tr>
              <th>تاریخ شمسی</th>
              <th>پنجره ساعتی</th>
              <th>تعداد ثبت‌نام</th>
              <th>هزینه کل (دلار)</th>
              <th>تعداد صعود</th>
              <th>چیپ‌های کسب‌شده</th>
              <th>رتبه فینال</th>
              <th>جایزه فینال ($)</th>
              <th>سود/زیان ($)</th>
            </tr>
          </thead>
          <tbody>
            ${active.map(w => `
              <tr>
                <td>${w.date_shamsi}</td>
                <td>${w.window_start} - ${w.window_end}</td>
                <td>${w.total_registrations}</td>
                <td>${w.total_cost_usd !== undefined ? w.total_cost_usd.toFixed(2) : ((w.total_cost_cents || 0) / 100).toFixed(2)}</td>
                <td>${w.total_advances}</td>
                <td>${w.total_chips}</td>
                <td>${w.final_result?.rank || '-'}</td>
                <td>${(w.total_prize || 0).toFixed(2)}</td>
                <td>${w.profit_loss.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stage1_poker_report_${settings.period_start_shamsi.replace(/\//g, '-')}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.active_windows && Array.isArray(parsed.active_windows)) {
          // Merge imported windows into existing windows
          const existingMap = new Map<string, SessionWindow>();
          windows.forEach(w => existingMap.set(w.id, w));
          parsed.active_windows.forEach((w: SessionWindow) => existingMap.set(w.id, w));

          const merged = Array.from(existingMap.values());
          saveWindows(merged);
          onImportSuccess(merged);
          setImportStatus('داده‌ها با موفقیت بازیابی شدند.');
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setImportStatus('قالب فایل نامعتبر است.');
        }
      } catch (err) {
        setImportStatus('خطا در خواندن فایل پشتیبان.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-neutral-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 pl-8">
          <div className="p-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-200">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-100">خروجی و پشتیبان‌گیری داده‌ها</h3>
            <p className="text-xs text-neutral-400">دریافت گزارش‌ها در فرمت‌های اکسل، CSV، PDF و JSON</p>
          </div>
        </div>

        {importStatus && (
          <div className="mb-4 p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-amber-400 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Excel Export */}
          <button
            type="button"
            onClick={handleDownloadExcel}
            className="w-full p-3.5 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 rounded-xl flex items-center justify-between text-right transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-200">خروجی اکسل (Excel)</div>
                <div className="text-[11px] text-neutral-400">جدول کامل داده‌ها با فرمت راست‌به‌چپ و فرمول‌ها</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-400" />
          </button>

          {/* CSV Export */}
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="w-full p-3.5 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 rounded-xl flex items-center justify-between text-right transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-200">خروجی CSV</div>
                <div className="text-[11px] text-neutral-400">مناسب برای نرم‌افزارهای تحلیل داده و گوگل شیت</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-400" />
          </button>

          {/* PDF Print Export */}
          <button
            type="button"
            onClick={handlePrintPDF}
            className="w-full p-3.5 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 rounded-xl flex items-center justify-between text-right transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-200">چاپ و ذخیره PDF</div>
                <div className="text-[11px] text-neutral-400">پیش‌نمایش چاپ شکیل گزارش با تم دارک یا خروجی PDF</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-400" />
          </button>

          {/* JSON Full Backup */}
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="w-full p-3.5 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 rounded-xl flex items-center justify-between text-right transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-200">پشتیبان‌گیری کامل (JSON)</div>
                <div className="text-[11px] text-neutral-400">شامل تمامی زیرمراحل، تنظیمات و نتایج فینال</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* Restore Backup Section */}
        <div className="mt-6 pt-5 border-t border-neutral-800">
          <div className="text-xs font-bold text-neutral-300 mb-2 flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-400" />
            <span>بازیابی اطلاعات از فایل پشتیبان (JSON):</span>
          </div>
          <label className="block w-full cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <div className="p-3 bg-neutral-950 hover:bg-neutral-800/70 border border-dashed border-neutral-700 rounded-xl text-center text-xs text-neutral-400 hover:text-neutral-200 transition-colors">
              کلیک برای انتخاب فایل JSON پشتیبان
            </div>
          </label>
        </div>

        <div className="mt-6 pt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
