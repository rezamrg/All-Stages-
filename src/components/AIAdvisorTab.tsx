import React, { useEffect, useState, useMemo } from 'react';
import { AIStrategyInsight, PeriodSummary, SessionWindow, StageConfig, StageId, UserSettings } from '../types/poker';
import { generateAIAnalysis } from '../services/aiService';
import { getStageConfig, STAGE_CONFIGS } from '../utils/pokerRules';
import { Sparkles, Send, Bot, User, RefreshCw, Layers, Award, ShieldAlert, DollarSign, HelpCircle, CheckCircle, Users, Zap, Trophy, CheckCircle2 } from 'lucide-react';

interface AIAdvisorTabProps {
  settings: UserSettings;
  windows: SessionWindow[];
  summary: PeriodSummary;
  stageId?: StageId;
  onSelectStage?: (stageId: StageId) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

const DEFAULT_WELCOME_MESSAGES: Record<StageId, string> = {
  1: 'سلام! من مربی تخصصی هوش مصنوعی Stage 1 هستم. در این استیج هر یک از ۸ قسمت مقدماتی یک مسابقه آل‌این هم‌زمان ۲ تا ۵ دقیقه‌ای است که تنها ۱ نفر برنده شده و با استک نرمال ۳۰K تا ۵۰K به فینال صعود می‌کند. آماده‌ام درباره استراتژی ورود با ۵K چیپ، قانون یک صعود کافیست و فینال تگزاس هولدم با جوایز ۱۰ تا ۱۵ دلاری راهنمایی‌تان کنم.',
  2: 'سلام! من مربی تخصصی هوش مصنوعی Stage 2 هستم. در قسمت‌های ۸ گانه مقدماتی به ازای هر نیم دلار (۰.۵۰$) ۱,۰۰۰ چیپ می‌گیرید و بازی یک آل‌این هم‌زمان چند دقیقه‌ای است. یک صعود برای ورود به فینال کافیست و جوایز فینال تگزاس هولدم بین ۷۰ تا ۱۲۰ دلار در نوسان است. هر سوالی دارید بپرسید.',
  3: 'سلام! من مربی تخصصی هوش مصنوعی Stage 3 هستم. در این استیج ورودی کامل ۱۵ دلار (۵K چیپ) است و هر ۱K چیپ ۳ دلار محاسبه می‌شود. هر قسمت یک آل‌این سریع است که یک صعود برای ورود به جمع صعودکنندگان با استک نرمال کافیست. برای مهار هزینه ۱۲۰ دلاری پنجره و قهرمانی در فینال ۲۰۰ تا ۳۵۰ دلاری در کنارتان هستم.',
  4: 'سلام! من مربی تخصصی هوش مصنوعی Stage 4 هستم؛ استیج حرفه‌ای با ورودی ۱۰۰ دلار برای ۵K چیپ. در آل‌این‌های مقدماتی ۲ تا ۵ دقیقه‌ای، تنها یک برد استک فینال را تامین می‌کند. با توجه به هزینه ۸۰۰ دلاری کل پنجره، انضباط مالی و تمرکز روی بازی اصلی تگزاس هولدم در فینال (جوایز ۸۰۰ تا ۱,۶۰۰ دلار) حیاتی است.'
};

const STAGE_QUICK_QUESTIONS: Record<StageId, string[]> = {
  1: [
    'چرا در مسابقه آل‌این ۲ تا ۵ دقیقه‌ای هیچ فولد اکوئیتی وجود ندارد و فینال تنها محل بازی پوکر تگزاس هولدم است؟',
    'آیا با یک بار صعود و کسب استک نرمال (۳۰K تا ۵۰K) متوقف شوم یا برای استک ۸۰K تا ۱۰۰K ادامه دهم؟',
    'در مسابقه آل‌این ۲ تا ۵ دقیقه‌ای، چرا ورودی کامل ۲۵ سنت (۵K چیپ) صرفاً شانس ریاضی است نه فولد اکوئیتی؟',
    'استراتژی بازی واقعی تگزاس هولدم در فینال Stage 1 (جایزه ۱۰ تا ۱۵ دلار) چیست؟'
  ],
  2: [
    'چرا در قسمت‌های ۸ گانه فولد اکوئیتی وجود ندارد و داشتن ۵K چیپ فشاری روی ۱K چیپ وارد نمی‌کند؟',
    'اگر در قسمت اول یا دوم با استک نرمال ۳۰K تا ۵۰K صعود کردم، چرا توقف ثبت‌نام به نفع من است؟',
    'در فینال تگزاس هولدم، چگونه با استک نرمال ۳۰K تا ۵۰K در برابر استک‌های ۸۰K یا ۱۰۰K بازی کنم؟',
    'با توجه به سقف هزینه ۲۰ دلاری پنجره کامل، چگونه با یک صعود بیشترین سود را ذخیره کنم؟'
  ],
  3: [
    'تفاوت مسابقات شوت‌اوت ۲ تا ۵ دقیقه‌ای با دور اصلی تگزاس هولدم در Stage 3 چیست؟',
    'با توجه به هزینه ۱۵ دلاری هر قسمت، چرا یک صعود تک برای ورود به جمع فینالیست‌ها کافیست؟',
    'در دور نهایی تگزاس هولدم، چگونه با استک نرمال در برابر استک‌های ۸۰K یا ۱۰۰K رقابت کنم؟',
    'بهترین استراتژی توقف ضرر در صورت عدم صعود در ۴ قسمت اول Stage 3 چیست؟'
  ],
  4: [
    'چرا در آل‌این‌های برق‌آسای مقدماتی ۱۰۰ دلاری فولد اکوئیتی معنا ندارد و بازی اصلی در فینال است؟',
    'در استیج ۱۰۰ دلاری، چرا ثبت‌نام در تمام ۸ قسمت (۸۰۰ دلار) توجیه اقتصادی ندارد؟',
    'آیا بعد از اولین پیروزی در آل‌این و کسب بلیت فینال با استک نرمال، ثبت‌نام را کاملاً متوقف کنم؟',
    'استراتژی پوکر تگزاس هولدم در فینال سنگین Stage 4 (جوایز ۸۰۰ تا ۱,۶۰۰ دلار) چیست؟'
  ]
};

export const AIAdvisorTab: React.FC<AIAdvisorTabProps> = ({
  settings,
  windows,
  summary,
  stageId,
  onSelectStage
}) => {
  const currentStageId: StageId = stageId || settings.stage_id || 1;
  const stageConfig: StageConfig = useMemo(() => getStageConfig(currentStageId), [currentStageId]);

  const [loading, setLoading] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string>('');
  const [insights, setInsights] = useState<AIStrategyInsight[]>([]);
  const [question, setQuestion] = useState<string>('');

  // Extract recorded tournament metrics for current stage
  const stageQualifiers = useMemo(() => {
    const records = windows.filter(w => w.final_result?.total_qualifiers && w.final_result.total_qualifiers > 0);
    const pools = windows.filter(w => w.final_result?.total_prize_pool && w.final_result.total_prize_pool > 0);
    if (records.length === 0 && pools.length === 0) return null;

    const avgQ = records.length > 0
      ? Math.round(records.reduce((acc, w) => acc + (w.final_result?.total_qualifiers || 0), 0) / records.length)
      : null;
    const avgPool = pools.length > 0
      ? Math.round(pools.reduce((acc, w) => acc + (w.final_result?.total_prize_pool || 0), 0) / pools.length)
      : null;

    return { avgQ, avgPool, count: Math.max(records.length, pools.length) };
  }, [windows]);

  // Isolated chat histories per stage
  const [chatHistoryByStage, setChatHistoryByStage] = useState<Record<StageId, ChatMessage[]>>(() => {
    return {
      1: [{
        id: 'msg_welcome_1',
        sender: 'ai',
        text: DEFAULT_WELCOME_MESSAGES[1],
        timestamp: 'اکنون'
      }],
      2: [{
        id: 'msg_welcome_2',
        sender: 'ai',
        text: DEFAULT_WELCOME_MESSAGES[2],
        timestamp: 'اکنون'
      }],
      3: [{
        id: 'msg_welcome_3',
        sender: 'ai',
        text: DEFAULT_WELCOME_MESSAGES[3],
        timestamp: 'اکنون'
      }],
      4: [{
        id: 'msg_welcome_4',
        sender: 'ai',
        text: DEFAULT_WELCOME_MESSAGES[4],
        timestamp: 'اکنون'
      }]
    };
  });

  const currentChatMessages = chatHistoryByStage[currentStageId] || [];

  const fetchAnalysis = async (customQ?: string) => {
    setLoading(true);
    try {
      const res = await generateAIAnalysis(settings, windows, summary, customQ, currentStageId);
      if (!customQ) {
        setAiReport(res.text);
      }
      if (res.insights && res.insights.length > 0) {
        setInsights(res.insights);
      }
      if (customQ) {
        setChatHistoryByStage(prev => ({
          ...prev,
          [currentStageId]: [
            ...(prev[currentStageId] || []),
            {
              id: `msg_ai_${Date.now()}`,
              sender: 'ai',
              text: res.text,
              timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
            }
          ]
        }));
      }
    } catch (err) {
      console.error('Failed to run AI analysis for stage', currentStageId, err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when stage changes or settings update
  useEffect(() => {
    fetchAnalysis();
  }, [currentStageId, settings.stage_id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userText = question.trim();
    setQuestion('');

    const newMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistoryByStage(prev => ({
      ...prev,
      [currentStageId]: [...(prev[currentStageId] || []), newMsg]
    }));

    await fetchAnalysis(userText);
  };

  const handleQuickQuestion = (q: string) => {
    setQuestion(q);
  };

  const handleStageTabClick = (sId: StageId) => {
    if (onSelectStage) {
      onSelectStage(sId);
    }
  };

  // Theme styling helpers based on stage
  const themeColors = useMemo(() => {
    switch (currentStageId) {
      case 2:
        return {
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          accent: 'text-emerald-400',
          btn: 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950',
          border: 'border-emerald-500/20',
          glow: 'from-emerald-500/10 to-transparent'
        };
      case 3:
        return {
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          accent: 'text-blue-400',
          btn: 'bg-blue-500 hover:bg-blue-400 text-neutral-950',
          border: 'border-blue-500/20',
          glow: 'from-blue-500/10 to-transparent'
        };
      case 4:
        return {
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          accent: 'text-purple-400',
          btn: 'bg-purple-500 hover:bg-purple-400 text-neutral-950',
          border: 'border-purple-500/20',
          glow: 'from-purple-500/10 to-transparent'
        };
      case 1:
      default:
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          accent: 'text-amber-400',
          btn: 'bg-amber-500 hover:bg-amber-400 text-neutral-950',
          border: 'border-amber-500/20',
          glow: 'from-amber-500/10 to-transparent'
        };
    }
  }, [currentStageId]);

  return (
    <div className="space-y-6">
      {/* Stage Selector Bar inside AI Advisor */}
      <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 px-2 text-xs font-bold text-neutral-300">
          <Layers className="w-4 h-4 text-neutral-400" />
          <span>انتخاب مربی اختصاصی استیج:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1 max-w-2xl">
          {([1, 2, 3, 4] as StageId[]).map((sId) => {
            const cfg = STAGE_CONFIGS[sId];
            const isSelected = currentStageId === sId;
            let activeClass = 'bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:text-neutral-200';
            if (isSelected) {
              if (sId === 1) activeClass = 'bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-md shadow-amber-500/20';
              if (sId === 2) activeClass = 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20';
              if (sId === 3) activeClass = 'bg-blue-500 text-neutral-950 font-bold border-blue-400 shadow-md shadow-blue-500/20';
              if (sId === 4) activeClass = 'bg-purple-500 text-neutral-950 font-bold border-purple-400 shadow-md shadow-purple-500/20';
            }

            return (
              <button
                key={sId}
                type="button"
                onClick={() => handleStageTabClick(sId)}
                className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs border transition-all ${activeClass}`}
              >
                <div className="flex items-center gap-1">
                  <span>{cfg.name_fa}</span>
                  {isSelected && <CheckCircle className="w-3 h-3" />}
                </div>
                <span className={`text-[10px] mt-0.5 font-mono-numbers ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
                  {sId === 1 ? 'پایه ۲۵¢ · ۱۰ تا ۱۵$' : sId === 2 ? 'پایه ۲.۵$ · ۷۰ تا ۱۲۰$' : sId === 3 ? 'پایه ۱۵$ · ۲۰۰ تا ۳۵۰$' : 'پایه ۱۰۰$ · ۸۰۰ تا ۱,۶۰۰$'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Header Banner */}
      <div className={`p-5 bg-neutral-900 border ${themeColors.border} rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-64 h-full bg-gradient-to-l ${themeColors.glow} pointer-events-none`} />

        <div className="flex items-center gap-3 relative z-10">
          <div className={`p-3 rounded-xl border ${themeColors.badge}`}>
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-neutral-100">
                مشاور و استراتژیست هوش مصنوعی {stageConfig.name_fa}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${themeColors.badge}`}>
                {stageConfig.name_en}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              تحلیل اختصاصی {stageConfig.name_fa} · {stageConfig.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchAnalysis()}
          disabled={loading}
          className="relative z-10 flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-xl border border-neutral-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'در حال تحلیل داده‌ها...' : `به‌روزرسانی تحلیل ${stageConfig.name_fa}`}</span>
        </button>
      </div>

      {/* User-Recorded Main Round Metadata Badge (If any recorded) */}
      {stageQualifiers && (
        <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">داده‌های تجربی ثبت‌شده فینال {stageConfig.name_fa}:</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-400 font-mono-numbers text-[11px]">
            {stageQualifiers.avgQ && (
              <span>میانگین صعودکنندگان: <strong className="text-neutral-200">{stageQualifiers.avgQ} نفر</strong></span>
            )}
            {stageQualifiers.avgPool && (
              <span>میانگین استخر جوایز: <strong className="text-emerald-400">${stageQualifiers.avgPool}</strong></span>
            )}
            <span className="text-[10px] text-neutral-500">({stageQualifiers.count} پنجره ثبت‌شده)</span>
          </div>
        </div>
      )}

      {/* Tournament Architecture & Mechanics Explanatory Card */}
      <div className="p-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${themeColors.accent}`} />
            <h3 className="text-xs font-bold text-neutral-200">
              معماری ساختاری تورنمنت: تفکیک آل‌این‌های مقدماتی از بازی اصلی تگزاس هولدم
            </h3>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            قانون طلایی: یک صعود کافیست
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Box 1: 8 Sub-parts */}
          <div className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-amber-400 font-bold">
              <span>۱. قسمت‌های ۸ گانه مقدماتی (All-in Shootout)</span>
              <span className="text-[10px] font-mono-numbers px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">۲ تا ۵ دقیقه</span>
            </div>
            <ul className="text-[11px] text-neutral-300 space-y-1 list-disc list-inside leading-relaxed">
              <li>همه بازیکنان میز هم‌زمان چیپ‌های ورودی (۱K تا ۵K) را در بدو ورود <strong>آل‌این (All-in)</strong> می‌کنند.</li>
              <li><strong>فاقد فاز تصمیمی یا فولد اکوئیتی:</strong> هیچ بازی پس از فلاپ یا فولد کردنی وجود ندارد؛ ۵K چیپ صرفاً سهم ریاضی برد را بالا می‌برد.</li>
              <li>تنها <strong>۱ نفر</strong> از هر میز برنده شده و با استک نرمال <strong>۳۰,۰۰۰ تا ۵۰,۰۰۰ چیپ</strong> به دور نهایی صعود می‌کند.</li>
              <li><strong className="text-emerald-400">یک صعود کافیست:</strong> نیازی به ثبت‌نام در قسمت‌های بعدی نیست مگر برای ساخت استک‌های نادر تجمیعی (۸۰K یا ۱۰۰K).</li>
            </ul>
          </div>

          {/* Box 2: Final Texas Hold'em */}
          <div className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>۲. دور اصلی و فینال (Texas Hold'em واقعی)</span>
              <span className="text-[10px] font-mono-numbers px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">ساعت (X+1):35</span>
            </div>
            <ul className="text-[11px] text-neutral-300 space-y-1 list-disc list-inside leading-relaxed">
              <li><strong>بازی واقعی پوکر تگزاس هولدم منحصراً در فینال رخ می‌دهد</strong> (با مهارت، بت، فولد، پوزیشن و فولد اکوئیتی).</li>
              <li>حدود <strong>۷۰ تا ۹۰ نفر صعودکننده</strong> با استک‌های اولیه تقریباً برابر (۳۰K تا ۵۰K) برای کسب رتبه‌های ۱ تا ۱۰ رقابت می‌کنند.</li>
              <li>تنها تعداد انگشت‌شماری از بازیکنان با استک‌های تجمیعی (۸۰K یا ۱۰۰K) حاضر هستند.</li>
              <li>جوایز نقدی رتبه‌های برتر از استخر متغیر ({stageConfig.first_prize_range_fa} برای نفر اول) تقسیم می‌شود.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4 Strategic Recommendations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((ins) => {
          return (
            <div
              key={ins.id}
              className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <span className={`font-semibold ${themeColors.accent}`}>{ins.title}</span>
                  <span className="font-mono-numbers text-[11px] text-neutral-400">
                    ضریب اطمینان: {ins.confidence}%
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {ins.content}
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 block mb-0.5">توصیه عملیاتی:</span>
                <span className="text-xs font-bold text-neutral-100">
                  {ins.recommendation}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Report */}
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
          <Bot className={`w-4 h-4 ${themeColors.accent}`} />
          <span>گزارش جامع آماری و استراتژیک سیستم برای {stageConfig.name_fa}</span>
        </h3>

        <div className="p-5 bg-neutral-950/70 border border-neutral-800/80 rounded-xl text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans">
          {aiReport || `در حال آماده‌سازی و تحلیل داده‌های استراتژیک ${stageConfig.name_fa}...`}
        </div>
      </div>

      {/* Interactive AI Poker Chat */}
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <Bot className={`w-4 h-4 ${themeColors.accent}`} />
              <span>گفتگوی تعاملی با مربی پوکر اختصاصی {stageConfig.name_fa}</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              پرسش در زمینه خرید چیپ با نرخ {currentStageId === 2 ? 'نیم دلار (۰.۵$)' : currentStageId === 1 ? '۵ سنت' : `${stageConfig.step_buy_in_usd}$`} به ازای هر ۱,۰۰۰ چیپ، مدیریت بالانس، تعداد صعودکنندگان و جوایز فینال ({stageConfig.first_prize_range_fa})
            </p>
          </div>
          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border w-fit ${themeColors.badge}`}>
            مربی فعال: {stageConfig.name_fa}
          </span>
        </div>

        {/* Quick Question Prompts personalized per stage */}
        <div className="space-y-1.5">
          <span className="text-[11px] text-neutral-400 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>پرسش‌های پیشنهادی اختصاصی {stageConfig.name_fa}:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {(STAGE_QUICK_QUESTIONS[currentStageId] || STAGE_QUICK_QUESTIONS[1]).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickQuestion(prompt)}
                className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs text-neutral-300 transition-colors text-right"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat History */}
        {currentChatMessages.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto p-4 bg-neutral-950 rounded-xl border border-neutral-800">
            {currentChatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className={`p-1.5 rounded-lg shrink-0 h-fit ${themeColors.badge}`}>
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-neutral-100 text-neutral-950 font-medium'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-200'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="text-[10px] opacity-60 block mt-1 font-mono-numbers">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="p-1.5 bg-neutral-800 rounded-lg text-neutral-300 shrink-0 h-fit">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Question Input Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`پرسش خود را درباره استراتژی، مدیریت سرمایه و فینال در ${stageConfig.name_fa} بنویسید...`}
            disabled={loading}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-amber-500/50"
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className={`px-5 py-3 font-bold text-xs rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 ${themeColors.btn}`}
          >
            <Send className="w-4 h-4" />
            <span>ارسال</span>
          </button>
        </form>
      </div>
    </div>
  );
};
