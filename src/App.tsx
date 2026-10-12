import React, { useMemo, useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { HourlyWindowTab } from './components/HourlyWindowTab';
import { DailyReportTab } from './components/DailyReportTab';
import { AdvancedStatsTab } from './components/AdvancedStatsTab';
import { AIAdvisorTab } from './components/AIAdvisorTab';
import { DocumentationTab } from './components/DocumentationTab';
import { QuickRegisterModal } from './components/QuickRegisterModal';
import { WindowDetailsModal } from './components/WindowDetailsModal';
import { DateRangeModal } from './components/DateRangeModal';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { EditBalanceModal } from './components/EditBalanceModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { StageDrawer } from './components/StageDrawer';

import { SessionWindow, StageId, UserSettings } from './types/poker';
import { 
  DEFAULT_SETTINGS_BY_STAGE,
  getAllStagesSettings,
  loadActiveStage,
  loadSettings, 
  loadWindows, 
  resetAllData,
  resetAllStagesData,
  resetFinancialsAndPlays,
  resetFinancialsPreservingAnalytics,
  saveActiveStage,
  saveSettings, 
  saveSingleWindow, 
  saveWindows 
} from './services/storage';
import { 
  calculateDailyRecord, 
  calculatePeriodSummary 
} from './utils/calculations';
import { 
  generateJalaliDateRange, 
  jalaliStrToGregorianStr 
} from './utils/jalali';
import { getStageConfig } from './utils/pokerRules';

export default function App() {
  const [activeStageId, setActiveStageId] = useState<StageId>(() => loadActiveStage());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings(loadActiveStage()));
  const [windows, setWindows] = useState<SessionWindow[]>(() => loadWindows(loadSettings(loadActiveStage()), loadActiveStage()));
  const [activeTab, setActiveTab] = useState<'dashboard' | 'hourly' | 'daily' | 'analytics' | 'ai' | 'docs'>('dashboard');

  // Modals state
  const [isStageDrawerOpen, setIsStageDrawerOpen] = useState(false);
  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState(false);
  const [quickRegisterDefaultDate, setQuickRegisterDefaultDate] = useState<string | undefined>();
  const [quickRegisterDefaultHour, setQuickRegisterDefaultHour] = useState<number | undefined>();

  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [isWindowDetailsOpen, setIsWindowDetailsOpen] = useState(false);
  const [selectedWindowForDetails, setSelectedWindowForDetails] = useState<SessionWindow | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isEditBalanceOpen, setIsEditBalanceOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Available dates based on currently configured start and end date (user can edit freely!)
  const availableDates = useMemo(() => {
    return generateJalaliDateRange(settings.period_start_shamsi, settings.period_end_shamsi);
  }, [settings.period_start_shamsi, settings.period_end_shamsi]);

  // Aggregate daily records with cumulative profit/loss
  const dailyRecords = useMemo(() => {
    let runningCumulative = 0;
    return availableDates.map((dateShamsi) => {
      const gDateStr = jalaliStrToGregorianStr(dateShamsi);
      const rec = calculateDailyRecord(dateShamsi, gDateStr, windows, runningCumulative);
      runningCumulative = rec.cumulative_profit_loss;
      return rec;
    });
  }, [availableDates, windows]);

  // Overall period summary
  const periodSummary = useMemo(() => {
    return calculatePeriodSummary(settings, windows, availableDates);
  }, [settings, windows, availableDates]);

  // Stage Switch Handler
  const handleSelectStage = (newStageId: StageId) => {
    setActiveStageId(newStageId);
    saveActiveStage(newStageId);
    const newSettings = loadSettings(newStageId);
    setSettings(newSettings);
    const newWindows = loadWindows(newSettings, newStageId);
    setWindows(newWindows);
  };

  // Handlers
  const handleSaveInitialBalance = (newBalance: number, currency: 'USD' | 'TOMAN', exchangeRate: number) => {
    const updatedSettings: UserSettings = {
      ...settings,
      initial_balance: newBalance,
      currency,
      exchange_rate: exchangeRate
    };
    setSettings(updatedSettings);
    saveSettings(updatedSettings, activeStageId);
  };

  const handleConfirmReset = (targetStageId: StageId, newInitialBalance: number) => {
    // CRITICAL: Resets active profit & loss to 0, updates initial balance, and 100% PRESERVES all play history,
    // tournament registrations, advances, ranks, chips, qualifiers, and prizes for analytics.
    const result = resetFinancialsPreservingAnalytics(targetStageId, newInitialBalance);
    if (targetStageId === activeStageId) {
      setSettings(result.settings);
      setWindows([...result.windows]);
    }
  };

  const handleSaveDateRange = (newStart: string, newEnd: string) => {
    const updatedSettings: UserSettings = {
      ...settings,
      period_start_shamsi: newStart,
      period_end_shamsi: newEnd
    };
    setSettings(updatedSettings);
    saveSettings(updatedSettings, activeStageId);
    const updatedWindows = loadWindows(updatedSettings, activeStageId);
    setWindows(updatedWindows);
  };

  const handleSaveWindow = (updatedWin: SessionWindow) => {
    const all = saveSingleWindow(updatedWin, activeStageId);
    setWindows([...all]);
  };

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings, activeStageId);
  };

  const handleImportSuccess = (imported: SessionWindow[]) => {
    setWindows([...imported]);
  };

  const openQuickRegister = (date?: string, hour?: number) => {
    setQuickRegisterDefaultDate(date || availableDates[0]);
    setQuickRegisterDefaultHour(hour !== undefined ? hour : 18);
    setIsQuickRegisterOpen(true);
  };

  const openWindowDetails = (win: SessionWindow) => {
    setSelectedWindowForDetails(win);
    setIsWindowDetailsOpen(true);
  };

  const activeStageConfig = getStageConfig(activeStageId);

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-neutral-100 flex flex-col antialiased">
      {/* Top Bar with Stage Dropdown and Action Controls */}
      <Navbar
        activeStageId={activeStageId}
        onOpenStageDrawer={() => setIsStageDrawerOpen(true)}
        onSelectStage={handleSelectStage}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenQuickRegister={() => openQuickRegister()}
        onOpenDateRange={() => setIsDateRangeOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenReset={() => setIsResetConfirmOpen(true)}
        onOpenEditBalance={() => setIsEditBalanceOpen(true)}
        periodLabel={`${settings.period_start_shamsi.slice(5)} الی ${settings.period_end_shamsi.slice(5)}`}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            settings={settings}
            windows={windows}
            dailyRecords={dailyRecords}
            summary={periodSummary}
            onOpenQuickRegister={openQuickRegister}
            onOpenWindowDetails={openWindowDetails}
            onOpenDateRange={() => setIsDateRangeOpen(true)}
            onOpenEditBalance={() => setIsEditBalanceOpen(true)}
            onOpenReset={() => setIsResetConfirmOpen(true)}
            onOpenFinancialReset={() => setIsResetConfirmOpen(true)}
            onOpenStageDrawer={() => setIsStageDrawerOpen(true)}
          />
        )}

        {activeTab === 'hourly' && (
          <HourlyWindowTab
            settings={settings}
            windows={windows}
            availableDates={availableDates}
            onOpenWindowDetails={openWindowDetails}
            onOpenQuickRegister={openQuickRegister}
          />
        )}

        {activeTab === 'daily' && (
          <DailyReportTab
            settings={settings}
            dailyRecords={dailyRecords}
            summary={periodSummary}
            windows={windows}
            onOpenWindowDetails={openWindowDetails}
            onOpenDateRange={() => setIsDateRangeOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <AdvancedStatsTab
            settings={settings}
            windows={windows}
            summary={periodSummary}
          />
        )}

        {activeTab === 'ai' && (
          <AIAdvisorTab
            settings={settings}
            windows={windows}
            summary={periodSummary}
            stageId={activeStageId}
            onSelectStage={handleSelectStage}
          />
        )}

        {activeTab === 'docs' && (
          <DocumentationTab />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-6 px-4 text-center text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>{activeStageConfig.name_fa} — طراحی اختصاصی با تم دارک، تفکیک کامل داده‌ها و تقویم شمسی</span>
          <span className="text-[11px] text-neutral-500 font-mono-numbers">
            {activeStageConfig.description}
          </span>
        </div>
      </footer>

      {/* Modals & Slide-out Drawers */}
      <StageDrawer
        isOpen={isStageDrawerOpen}
        onClose={() => setIsStageDrawerOpen(false)}
        activeStageId={activeStageId}
        onSelectStage={handleSelectStage}
        onOpenFinancialReset={(sId) => {
          handleSelectStage(sId);
          setIsResetConfirmOpen(true);
        }}
        stageSettingsMap={getAllStagesSettings()}
      />

      <QuickRegisterModal
        isOpen={isQuickRegisterOpen}
        onClose={() => setIsQuickRegisterOpen(false)}
        stageId={activeStageId}
        availableDates={availableDates}
        windows={windows}
        defaultDate={quickRegisterDefaultDate}
        defaultHour={quickRegisterDefaultHour}
        onSaveWindow={handleSaveWindow}
      />

      <WindowDetailsModal
        isOpen={isWindowDetailsOpen}
        onClose={() => setIsWindowDetailsOpen(false)}
        window={selectedWindowForDetails}
        stageId={activeStageId}
        onSaveWindow={handleSaveWindow}
      />

      <DateRangeModal
        isOpen={isDateRangeOpen}
        onClose={() => setIsDateRangeOpen(false)}
        settings={settings}
        onSave={handleSaveDateRange}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onResetData={() => {
          setIsSettingsOpen(false);
          setIsResetConfirmOpen(true);
        }}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        settings={settings}
        windows={windows}
        onImportSuccess={handleImportSuccess}
      />

      <EditBalanceModal
        isOpen={isEditBalanceOpen}
        onClose={() => setIsEditBalanceOpen(false)}
        settings={settings}
        onSave={handleSaveInitialBalance}
      />

      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        activeStageId={activeStageId}
        settings={settings}
        summary={periodSummary}
        onConfirmReset={handleConfirmReset}
      />
    </div>
  );
}
