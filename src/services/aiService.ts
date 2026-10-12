import { GoogleGenAI } from '@google/genai';
import { AIStrategyInsight, PeriodSummary, SessionWindow, StageConfig, StageId, UserSettings } from '../types/poker';
import { calculateHourlyBreakdown, calculateBuyInCorrelation, calculateSubRoundBreakdown, calculateStreaks } from '../utils/calculations';
import { getStageConfig, getEstimatedFinalPrize, getEstimatedFinalPrizeRange, getBuyInOptions } from '../utils/pokerRules';

export async function generateAIAnalysis(
  settings: UserSettings,
  windows: SessionWindow[],
  summary: PeriodSummary,
  userQuestion?: string,
  explicitStageId?: StageId
): Promise<{ text: string; insights: AIStrategyInsight[] }> {
  const stageId: StageId = explicitStageId || settings.stage_id || 1;
  const stageConfig = getStageConfig(stageId);
  const buyInOptions = getBuyInOptions(stageId);

  const activeWindows = windows.filter(w => w.total_registrations > 0);
  const hourly = calculateHourlyBreakdown(windows);
  const buyInStats = calculateBuyInCorrelation(windows);
  const roundStats = calculateSubRoundBreakdown(windows);
  const streaks = calculateStreaks(windows);

  // Extract user-recorded tournament main round / final metrics
  const qualifierRecords = windows.filter(w => w.final_result?.total_qualifiers && w.final_result.total_qualifiers > 0);
  const prizePoolRecords = windows.filter(w => w.final_result?.total_prize_pool && w.final_result.total_prize_pool > 0);
  const top10Records = windows.filter(w => w.final_result?.top_10_prizes && w.final_result.top_10_prizes.length > 0);

  const avgQualifiers = qualifierRecords.length > 0
    ? Math.round(qualifierRecords.reduce((acc, w) => acc + (w.final_result?.total_qualifiers || 0), 0) / qualifierRecords.length)
    : null;

  const avgPrizePool = prizePoolRecords.length > 0
    ? Number((prizePoolRecords.reduce((acc, w) => acc + (w.final_result?.total_prize_pool || 0), 0) / prizePoolRecords.length).toFixed(1))
    : null;

  const top10PrizesList = top10Records.map(w => w.final_result?.top_10_prizes || []).filter(p => p.length > 0);
  const recordedRank1 = top10PrizesList.map(p => p[0]).filter((v): v is number => typeof v === 'number' && v > 0);
  const avgRank1Prize = recordedRank1.length > 0
    ? Number((recordedRank1.reduce((a, b) => a + b, 0) / recordedRank1.length).toFixed(1))
    : null;

  // Best and worst hours
  const activeHourly = hourly.filter(h => h.total_registrations > 0);
  const bestHour = activeHourly.length > 0
    ? [...activeHourly].sort((a, b) => b.profit_loss - a.profit_loss)[0]
    : null;
  const worstHour = activeHourly.length > 0
    ? [...activeHourly].sort((a, b) => a.profit_loss - b.profit_loss)[0]
    : null;

  // Best sub-round
  const bestRound = [...roundStats].sort((a, b) => b.win_rate - a.win_rate)[0];

  // Try calling Gemini if API key is available
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) || '');

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `شما مربی تخصصی، استراتژیست ارشد و تحلیل‌گر داده‌های آماری تورنمنت‌های پوکر ساعتی هستید.
قوانین و ساختار قطعی و تغییرناپذیر مسابقات (رعایت ۱۰۰٪ این موارد در تک‌تک پاسخ‌ها الزامی است):

۱. ساختار قسمت‌های ۸ گانه مقدماتی در هر ساعت (All-in Shootout):
- در هر ساعت ۸ قسمت مقدماتی متوالی برگزار می‌شود که هر قسمت معمولاً تنها ۲ تا ۵ دقیقه زمان می‌برد.
- نحوه مسابقه: همه بازیکنان میز به‌صورت هم‌زمان چیپ‌های ورودی که ثبت‌نام کرده‌اند (بین ۱,۰۰۰ تا ۵,۰۰۰ چیپ) را در بدو ورود آل‌این (All-in) می‌کنند.
- تنها ۱ نفر از میان تمام بازیکنان آن قسمت برنده دست آل‌این می‌شود و به دور نهایی صعود می‌کند.
- اخطار و خط قرمز تحلیلی اکید: هرگز و تحت هیچ شرایطی نباید بگویی «داشتن استک عمیق به شما اجازه می‌دهد بازیکنان ضعیفی که با ۱۰۰۰ یا ۲۰۰۰ چیپ وارد شده‌اند را تحت فشار (Fold Equity) بگذارید» یا ادعا کنی در قسمت‌های ۸ گانه امکان فولد کردن یا بلوف یا مانور وجود دارد! در قسمت‌های ۸ گانه تمام بازیکنان هم‌زمان آل‌این هستند و کارت‌ها فوراً رو می‌شود؛ بنابراین هیچ امکانی برای فولد کردن وجود ندارد و اصطلاح فولد اکوئیتی در قسمت‌های ۸ گانه کاملاً غلط است. داشتن ۵,۰۰۰ چیپ به جای ۱,۰۰۰ یا ۲,۰۰۰ چیپ صرفاً شانس ریاضی (Equity) شما را برای برنده شدن در دست آل‌این افزایش می‌دهد.

۲. قانون طلایی «یک صعود کافیست» و اندازه استک‌ها:
- اگر بازیکنی حتی در یکی از قسمت‌های ۸ گانه صعود کند، کاملاً کافی است و بلیت ورود به دور نهایی را به دست آورده و دیگر نیازی نیست برای قسمت‌های بعدی آن ساعت ثبت‌نام کند.
- با یک بار صعود، استک نرمال ۳۰,۰۰۰ تا ۵۰,۰۰۰ چیپ به بازیکن تعلق می‌گیرد.
- در دور نهایی (فینال)، مثلاً بین ۷۰ تا ۹۰ نفر صعود کرده‌اند که میانگین چیپ تقریباً تمام آن‌ها برابر و در بازه ۳۰K تا ۵۰K است.
- صعودهای مکرر: بازیکنی که بخواهد چیپ بیشتری نسبت به میزان نرمال داشته باشد، می‌تواند اختیاری در سایر قسمت‌ها هم ثبت‌نام کند و در صورت پیروزی مجدد، چیپ‌هایش تجمیع شده و به ۸۰K یا ۱۰۰K چیپ می‌رسد (تعداد این بازیکنان در فینال کم و انگشت‌شمار است و ثبت‌نام مکرر هزینه پنجره را افزایش می‌دهد).

۳. دور اصلی و فینال (بازی واقعی پوکر تگزاس هولدم):
- بازی اصلی پوکر تگزاس هولدم (No-Limit Texas Hold'em) منحصراً در دور نهایی (ساعت X:35) رخ می‌دهد!
- در دور نهایی است که مهارت واقعی پوکر، مدیریت پوزیشن، خواندن دست حریفان، بت و ریز، فولد اکوئیتی، و لول‌های بلایند برای کسب رتبه‌های برتر و جوایز نقدی به کار گرفته می‌شود.
- جوایز فینال ثابت نیستند و متناسب با تعداد کل صعودکنندگان و استخر جمع‌شده در بازه مشخص نوسان می‌کنند.
`;

      const prompt = `
تحلیل اختصاصی برای ${stageConfig.name_fa} (${stageConfig.name_en}):

مشخصات اقتصادی استیج:
- هزینه ورودی کامل (۵,۰۰۰ چیپ): $${stageConfig.base_buy_in_usd}
- نرخ هر ۱,۰۰۰ چیپ: $${stageConfig.step_buy_in_usd} ${stageId === 2 ? '(نیم دلار)' : stageId === 1 ? '(۵ سنت)' : `($${stageConfig.step_buy_in_usd})`}
- گزینه‌های پرداخت در هر قسمت:
${buyInOptions.map(o => `  * ${o.label} = $${o.usd}`).join('\n')}
- مجموع هزینه در صورت ثبت‌نام در تمام ۸ قسمت: $${(stageConfig.base_buy_in_usd * 8).toFixed(2)}
- بازه تقریبی جایزه نفر اول فینال: ${stageConfig.first_prize_range_fa}
${avgQualifiers ? `- میانگین ثبت‌شده صعودکنندگان فینال در این استیج: ${avgQualifiers} نفر.` : ''}
${avgPrizePool ? `- میانگین استخر جایزه فینال ثبت‌شده در این استیج: $${avgPrizePool}.` : ''}
${avgRank1Prize ? `- میانگین جایزه نفر اول ثبت‌شده بازیکن در این استیج: $${avgRank1Prize}.` : ''}

کارنامه بازیکن در این استیج:
- موجودی اولیه: $${settings.initial_balance} | موجودی فعلی: $${summary.current_balance}
- تارگت روزانه: $${settings.daily_target} | سقف ضرر روزانه: $${settings.max_daily_loss}
- تعداد پنجره‌های فعال: ${summary.active_windows}
- ثبت‌نام‌ها در قسمت‌ها: ${summary.total_registrations} | صعودها: ${summary.total_advances} (نرخ صعود: ${summary.success_rate}%)
- مجموع هزینه: $${summary.total_cost} | مجموع جوایز: $${summary.total_prize} | سود/ضرر: $${summary.profit_loss}
- بیشترین زنجیره برد: ${streaks.maxWinStreak} | بیشترین زنجیره باخت: ${streaks.maxLossStreak}

${userQuestion
  ? `سوال بازیکن:
"${userQuestion}"

پاسخ مربی:
پاسخ دقیق، صمیمی، منطبق بر ساختار آل‌این هم‌زمان ۲ تا ۵ دقیقه‌ای قسمت‌های ۸ گانه، قانون یک صعود کافیست (استک ۳۰K تا ۵۰K)، و بازی واقعی پوکر تگزاس هولدم در فینال با جوایز ${stageConfig.first_prize_range_fa} ارائه شود.`
  : `گزارش جامع استراتژیک برای ${stageConfig.name_fa} شامل مدیریت ثبت‌نام در ۸ قسمت، زمان توقف پس از صعود، و بازی در فینال ارائه کن.`
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.1
        }
      });

      if (response.text) {
        return {
          text: response.text,
          insights: buildFallbackInsights(stageConfig, settings, summary, streaks, bestHour, worstHour, bestRound)
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local heuristic poker engine', err);
    }
  }

  // Deterministic high-precision local poker analytics engine customized per stage
  const generatedInsights = buildFallbackInsights(stageConfig, settings, summary, streaks, bestHour, worstHour, bestRound);
  
  const localAnalysisText = userQuestion
    ? answerStageQuestionHeuristically(userQuestion, stageConfig, settings, summary, windows, streaks, hourly, roundStats, buyInStats, avgQualifiers, avgPrizePool, avgRank1Prize)
    : generateHeuristicReport(stageConfig, settings, summary, streaks, bestHour, worstHour, bestRound, buyInStats, avgQualifiers, avgPrizePool, avgRank1Prize);

  return {
    text: localAnalysisText,
    insights: generatedInsights
  };
}

/**
 * Intelligent deterministic answer generator personalized specifically to the active Stage and user metrics.
 */
function answerStageQuestionHeuristically(
  question: string,
  stageConfig: StageConfig,
  settings: UserSettings,
  summary: PeriodSummary,
  windows: SessionWindow[],
  streaks: { maxWinStreak: number; maxLossStreak: number },
  hourly: any[],
  roundStats: any[],
  buyInStats: any[],
  avgQualifiers: number | null,
  avgPrizePool: number | null,
  avgRank1Prize: number | null
): string {
  const stageId = stageConfig.id;
  const qLower = question.toLowerCase();
  const baseCost = stageConfig.base_buy_in_usd;
  const stepCost = stageConfig.step_buy_in_usd;
  const fullWindowCost = Number((baseCost * 8).toFixed(2));
  const prizeRange = stageConfig.first_prize_range_fa;

  // 0. Dedicated structural question: Fold equity, deep stack, all-in mechanics vs Texas Hold'em
  if (
    qLower.includes('fold') ||
    qLower.includes('equity') ||
    qLower.includes('اکوئیتی') ||
    qLower.includes('فولد') ||
    qLower.includes('بلوف') ||
    qLower.includes('فشار') ||
    qLower.includes('عمیق') ||
    qLower.includes('deep') ||
    qLower.includes('تگزاس') ||
    qLower.includes('شوت') ||
    qLower.includes('آل این') ||
    qLower.includes('آلاین') ||
    qLower.includes('مکانیزم') ||
    qLower.includes('ساختار')
  ) {
    return `### ⚔️ تحلیل ساختاری عمیق: تفکیک آل‌این‌های مقدماتی از فینال تگزاس هولدم در ${stageConfig.name_fa}

۱. **چرا در قسمت‌های ۸ گانه هیچ فولد اکوئیتی (Fold Equity) یا فشاری وجود ندارد؟**
- هر یک از ۸ قسمت مقدماتی معمولاً تنها **۲ تا ۵ دقیقه** طول می‌کشد؛ زیرا کلیه بازیکنان حاضر بر سر میز، چیپ‌های ورودی که ثبت‌نام کرده‌اند (از ۱,۰۰۰ تا ۵,۰۰۰ چیپ) را **در بدو دست به‌صورت هم‌زمان آل‌این (All-in)** می‌کنند!
- در این مسابقات سریع، هیچ مرحله‌ای برای شرط‌بندی پس از فلاپ، تصمیم‌گیری، بلوف یا فولد کردن وجود ندارد. همه بازیکنان در همان ابتدا دست به آل‌این زده‌اند و کارت‌ها بلافاصله باز می‌شوند.
- بنابراین، ورود با ۵,۰۰۰ چیپ (به جای ۱,۰۰۰ یا ۲,۰۰۰ چیپ) اصلاً امکان «تحت فشار گذاشتن حریفان» یا «فولد اکوئیتی» به شما نمی‌دهد، چون هیچ بازیکنی نمی‌تواند فولد کند! سهم ۵,۰۰۰ چیپ صرفاً **اکوئیتی و سهم ریاضی بالاتر در پات آل‌این** را برای برنده شدن دست فراهم می‌کند.
- تنها **یک نفر** از کل میز پیروز آل‌این می‌شود و به دور نهایی صعود می‌کند.

۲. **قانون طلایی «یک صعود کافیست» و استک نرمال فینال:**
- **یک پیروزی ۱۰۰٪ کفایت می‌کند:** بازیکنی که در یکی از این قسمت‌های ۸ گانه برنده شود، به دور اصلی صعود کرده و کار صعودش تمام است. دیگر نیازی نیست برای قسمت‌های بعدی ثبت‌نام کند.
- با هر صعود، چیپ نرمال صعود که حدود **۳۰,۰۰۰ تا ۵۰,۰۰۰ چیپ** است به بازیکن تعلق می‌گیرد.
- در دور نهایی (فینال)، مثلاً بین ۷۰ تا ۹۰ نفر صعود کرده‌اند که **میانگین چیپ تقریباً تمام آن‌ها برابر و در همین بازه ۳۰K تا ۵۰K چیپ است.**

۳. **چه زمانی صعود مجدد و استک‌های ۸۰K یا ۱۰۰K ایجاد می‌شود؟**
- اگر بازیکنی بخواهد چیپی بالاتر از میانگین صعودکنندگان داشته باشد، می‌تواند به صورت اختیاری در سایر قسمت‌ها نیز ثبت‌نام کند.
- در صورت پیروزی در قسمت‌های دیگر، چیپ‌های برنده شده تجمیع شده و استک فینال او به **۸۰,۰۰۰ یا ۱۰۰,۰۰۰ چیپ** می‌رسد.
- با این وجود، تعداد بازیکنانی که چند بار صعود می‌کنند در هر ساعت بسیار اندک است؛ بنابراین در فینال میدان رقابت برای همه یکدست است و ثبت‌نام‌های مکرر صرفاً هزینه پنجره را بالا می‌برد ($${fullWindowCost} برای کل پنجره).

۴. **پوکر واقعی منحصراً در فینال ساعت X:35 رخ می‌دهد:**
- مسابقه واقعی پوکر تگزاس هولدم (No-Limit Texas Hold'em) **منحصراً در دور نهایی** آغاز می‌شود!
- در دور نهایی است که استک‌ها به بازی گرفته می‌شوند و مفاهیمی مثل مهارت بازی پس از فلاپ، موقعیت (Position)، بازی عمیق (Deep Stack)، بلوف، فولد اکوئیتی، و مدیریت لول‌های بلایند ۵ دقیقه‌ای برای تصاحب جوایز برتر (${prizeRange}) سرنوشت‌ساز هستند.`;
  }

  // 1. Question about Buy-in sizing / chips per dollar / paying less money
  if (
    qLower.includes('چیپ') ||
    qLower.includes('ورودی') ||
    qLower.includes('سنت') ||
    qLower.includes('دلار') ||
    qLower.includes('نیم دلار') ||
    qLower.includes('کمتر') ||
    qLower.includes('buy-in') ||
    qLower.includes('پرداخت')
  ) {
    if (stageId === 1) {
      return `### 💡 تحلیل تخصصی ورودی و چیپ در دستیار Stage 1

۱. **مکانیک آل‌این در قسمت‌های مقدماتی:**
- هر قسمت از ۸ قسمت مقدماتی تنها **۲ تا ۵ دقیقه** طول می‌کشد، زیرا تمام بازیکنان هم‌زمان چیپ‌های ورودی خود را آل‌این (All-in Shootout) می‌کنند و تنها **یک برنده** به دور نهایی صعود می‌کند.
- در این مرحله هیچ فازی برای بت، فولد یا فولد اکوئیتی وجود ندارد؛ داشتن **۵,۰۰۰ چیپ (۲۵ سنت)** صرفاً بالاترین شانس ریاضی را برای برنده شدن در دست آل‌این تصادفی میز به شما می‌دهد.
- به ازای هر **۵ سنت (۰.۰۵$)**، شما **۱,۰۰۰ چیپ** در آل‌این دریافت می‌کنید (۵¢ = ۱K، ۱۰¢ = ۲K، ۱۵¢ = ۳K، ۲۰¢ = ۴K، ۲۵¢ = ۵K).

۲. **قانون صعود و اندازه استک فینال:**
- **یک صعود کاملاً کافی است!** با یک بار برنده شدن، استک نرمال **۳۰,۰۰۰ تا ۵۰,۰۰۰ چیپ** را برای دور اصلی کسب می‌کنید.
- از آنجا که میانگین چیپ تمام صعودکنندگان به فینال (حدود ۷۰ تا ۹۰ نفر) تقریباً در همین بازه است، نیازی به ثبت‌نام مجدد در قسمت‌های بعدی نیست مگر اینکه بخواهید با هزینه اضافه برای استک‌های نادر ۸۰K یا ۱۰۰K چیپ ریسک کنید.
- هزینه یک پنجره کامل در صورت ثبت‌نام در تمام ۸ قسمت برابر با **۲.۰۰ دلار** است، در حالی که جایزه نفر اول فینال **${prizeRange}** تخمین زده می‌شود.`;
    }

    if (stageId === 2) {
      return `### 💡 تحلیل تخصصی ورودی و چیپ در دستیار Stage 2

۱. **مکانیک آل‌این در قسمت‌های مقدماتی Stage 2:**
- هر قسمت از ۸ قسمت تنها **۲ تا ۵ دقیقه** طول می‌کشد؛ همه بازیکنان میز هم‌زمان چیپ‌های انتخابی خود را آل‌این می‌کنند و فقط **۱ نفر** صعود می‌کند.
- به ازای **هر نیم دلار (۰.۵۰$)**، **۱,۰۰۰ چیپ** به آل‌این اختصاص می‌یابد و ورودی پایه **۲.۵۰ دلار** معادل ۵,۰۰۰ چیپ است (بیشترین شانس برد آل‌این).
- گزینه‌های پرداخت ثبت‌نام:
  * **۰.۵۰$ (نیم دلار):** ۱,۰۰۰ چیپ
  * **۱.۰۰$:** ۲,۰۰۰ چیپ
  * **۱.۵۰$:** ۳,۰۰۰ چیپ
  * **۲.۰۰$:** ۴,۰۰۰ چیپ
  * **۲.۵۰$:** ۵,۰۰۰ چیپ (پایه کامل با بیشترین سهم از پات آل‌این)

۲. **استراتژی صعود و حفظ بانکرول:**
- **یک بار صعود کافیست:** با یک پیروزی در آل‌این، چیپ نرمال صعود (**۳۰,۰۰۰ الی ۵۰,۰۰۰ چیپ**) را به دست آورده‌اید که با میانگین چیپ تمام صعودکنندگان به فینال برابر است.
- هزینه شرکت در تمام ۸ قسمت معادل **۲۰.۰۰ دلار** است. بنابراین توقف پس از اولین صعود، بهترین راهکار برای مهار هزینه و ذخیره سود است.
- جایزه نفر اول فینال Stage 2 در بازه **${prizeRange}** متغیر است و رقابت اصلی پوکر تگزاس هولدم در فینال رخ می‌دهد.`;
    }

    if (stageId === 3) {
      return `### 💡 تحلیل تخصصی ورودی و چیپ در دستیار Stage 3

۱. **ساختار اقتصادی Stage 3 در آل‌این‌های مقدماتی:**
- هر یک از ۸ قسمت مسابقه شوت‌اوت **۲ تا ۵ دقیقه‌ای** است که در آن تمام بازیکنان آل‌این می‌کنند و تنها یک نفر برنده پات کل میز و بلیت فینال می‌شود.
- ورودی کامل **۱۵.۰۰ دلار** است که **۵,۰۰۰ چیپ** می‌دهد و به ازای **هر ۳ دلار** ۱,۰۰۰ چیپ محاسبه می‌شود.
- هزینه کل ۸ قسمت برابر با **۱۲۰.۰۰ دلار** است.

۲. **مدیریت سرمایه و استراتژی:**
- با کسب یک صعود، بلیت فینال با استک استاندارد ۳۰K تا ۵۰K چیپ تامین شده است. با توجه به هزینه بالای ۱۵ دلاری هر قسمت، ادامه دادن در قسمت‌های بعدی تنها برای استک‌های تجمیعی استثنایی (۸۰K یا ۱۰۰K) است که ریسک هزینه بالایی دارد.
- توصیه هوشمندانه: در صورت ثبت صعود در قسمت‌های ابتدایی، ثبت‌نام را متوقف کرده و انرژی و تمرکز خود را برای بازی اصلی پوکر تگزاس هولدم در فینال با جوایز **${prizeRange}** ذخیره کنید.`;
    }

    // Stage 4
    return `### 💡 تحلیل تخصصی ورودی و چیپ در دستیار Stage 4

۱. **ساختار اقتصادی Stage 4 (سطح حرفه‌ای):**
- مسابقات مقدماتی آل‌این‌های هم‌زمان و برق‌آسای **۲ الی ۵ دقیقه‌ای** هستند که تنها یک نفر از هر میز صعود می‌کند.
- ورودی کامل **۱۰۰.۰۰ دلار** برای **۵,۰۰۰ چیپ** (هر ۱K چیپ ۲۰ دلار) است.
- هزینه شرکت در تمام ۸ قسمت برابر با **۸۰۰.۰۰ دلار** است!

۲. **فرمول انضباطی صعود:**
- **یک صعود کافی است:** به محض صعود، استک نرمال ۳۰K تا ۵۰K چیپ برای فینال تضمین می‌شود. با توجه به هزینه سنگین ۱۰۰ دلاری هر دست، ثبت‌نام در تمام قسمت‌ها هزینه پنجره را بیهوده تا ۸۰۰ دلار بالا می‌برد.
- بازی واقعی پوکر تگزاس هولدم در دور نهایی (فینال ساعت X:35) انجام می‌شود؛ جایی که برای جایزه بزرگ **${prizeRange}** رقابت خواهید کرد.`;
  }

  // 2. Question about 8 parts / participating in all parts vs stopping
  if (
    qLower.includes('۸ قسمت') ||
    qLower.includes('هشت قسمت') ||
    qLower.includes('توقف') ||
    qLower.includes('صعود') ||
    qLower.includes('ادامه') ||
    qLower.includes('قسمت دوم') ||
    qLower.includes('استک')
  ) {
    return `### 🎯 استراتژی ثبت‌نام در ۸ قسمت و قانون طلایی «یک صعود کافیست» در ${stageConfig.name_fa}

۱. **ماهیت قسمت‌های ۸‌گانه (All-in Shootout):**
- هر یک از ۸ قسمت مقدماتی معمولاً تنها **۲ تا ۵ دقیقه** طول می‌کشد؛ زیرا همه بازیکنان پشت میز هم‌زمان چیپ‌های خود را آل‌این می‌کنند و هیچ بازی فولد یا تاکتیکی وجود ندارد. تنها **یک نفر** از هر میز صعود می‌کند و کل چیپ‌های میز را می‌برد.
- با یک بار برنده شدن، بازیکن به چیپ نرمال صعود یعنی حدود **۳۰,۰۰۰ تا ۵۰,۰۰۰ چیپ** می‌رسد.

۲. **قانون طلایی: یک صعود کاملاً کافی است!**
- در دور نهایی (فینال)، مثلاً بین ۷۰ تا ۹۰ نفر صعود کرده‌اند. **میانگین چیپ تمام این افراد تقریباً برابر و در همان بازه ۳۰K تا ۵۰K چیپ است.**
- بنابراین اگر در یکی از قسمت‌ها (مثلاً قسمت ۱ یا ۲) صعود کردید، کار شما انجام شده و هیچ لزومی به ثبت‌نام در قسمت‌های بعدی نیست.
- **توقف بلافاصله پس از صعود** مانع از سوزاندن هزینه‌های اضافی در پنجره می‌شود (صرفه‌جویی تا $${(baseCost * 7).toFixed(2)} در ${stageConfig.name_fa}).

۳. **چه زمانی شرکت در قسمت‌های بعدی معنا دارد؟**
- ثبت‌نام اختیاری در قسمت‌های بعدی فقط برای بازیکنی است که بخواهد استک غیرمعمول و فراتر از نرمال بسازد (مثلاً با ۲ یا ۳ بار صعود به استک ۸۰,۰۰۰ یا ۱۰۰,۰۰۰ چیپ برسد).
- توجه داشته باشید تعداد بازیکنانی که چند بار صعود می‌کنند در هر ساعت بسیار اندک است؛ پس ریسک کردن ورودی‌های بیشتر معمولاً توجیه اقتصادی ندارد مگر اینکه در بانکرول بالا برای چیپ‌لیدری سنگین فینال تلاش کنید.

۴. **قانون توقف ضرر (Stop-Loss در صورت عدم صعود):**
- اگر تا قسمت چهارم هیچ صعودی نداشتید، ثبت‌نام را متوقف کنید یا با حداقل چیپ ($${stepCost}) ادامه دهید تا از باخت هزینه حداکثری پنجره ($${fullWindowCost}) جلوگیری شود.`;
  }

  // 3. Question about final tournament / prizes / ranking / qualifiers / pool
  if (
    qLower.includes('فینال') ||
    qLower.includes('جایزه') ||
    qLower.includes('رتبه') ||
    qLower.includes('پاداش') ||
    qLower.includes('prize') ||
    qLower.includes('رنک') ||
    qLower.includes('شرکت کننده') ||
    qLower.includes('استخر') ||
    qLower.includes('جمع شده')
  ) {
    let statsSection = '';
    if (avgQualifiers || avgPrizePool || avgRank1Prize) {
      statsSection = `\n\n۳. **داده‌های تجربی ثبت‌شده شما در فینال‌های این استیج:**
${avgQualifiers ? `- **میانگین تعداد کل صعودکنندگان به دور اصلی:** **${avgQualifiers} نفر**.` : ''}
${avgPrizePool ? `- **میانگین مبلغ کل استخر جوایز جمع‌شده:** **$${avgPrizePool}**.` : ''}
${avgRank1Prize ? `- **میانگین جایزه نفر اول ثبت‌شده بازیکن از جوایز ۱۰ نفر برتر:** **$${avgRank1Prize}**.` : ''}
- این داده‌های تکمیلی که ثبت نموده‌اید، ارزیابی دقیق‌تری از عمق رقابت، ارزش استخر فینال و جوایز واقعی نفرات برتر در این ساعت در اختیار مربی قرار می‌دهد.`;
    }

    return `### 🏆 ساختار جوایز و دینامیک فینال در ${stageConfig.name_fa}

۱. **بررسی نوسان مبالغ جوایز:**
- همان‌طور که اشاره شد، مبالغ جوایز فینال ثابت نیستند و متناسب با حجم شرکت‌کنندگان صعودکرده و استخر کل جایزه هر ساعت تغییر می‌کنند.
- **بازه حدودی جایزه نفر اول:** **${prizeRange}**.
- جوایز رتبه‌های دوم، سوم و ۱۰ نفر برتر نیز به نسبت حجم استخر بین ۱۰٪ تا ۷۰٪ این بازه توزیع می‌شوند.

۲. **دینامیک استک‌ها و بازی واقعی پوکر تگزاس هولدم در فینال:**
- **بازی واقعی تگزاس هولدم منحصراً در فینال (ساعت X:35) آغاز می‌شود:** برخلاف آل‌این‌های هم‌زمان ۲ تا ۵ دقیقه‌ای مقدماتی، در فینال مهارت پوکر، مدیریت پوزیشن، سایزینگ شرط‌ها، خواندن دست و مدیریت لول‌های بلایند تعیین‌کننده است.
- **استک نرمال فینال (۳۰,۰۰۰ تا ۵۰,۰۰۰ چیپ):** با یک بار برنده شدن در هر میز مقدماتی، شما استک نرمال ۳۰K تا ۵۰K چیپ را به دست می‌آورید. تقریباً تمام صعودکنندگان به فینال (حدود ۷۰ تا ۹۰ نفر) با همین استک بازی می‌کنند و شرایط برابری دارند.
- **استک‌های سنگین (۸۰K الی ۱۰۰K):** تنها بازیکنان انگشت‌شماری که در چند قسمت مختلف برنده شده‌اند با استک‌های عمیق‌تر ۸۰K یا ۱۰۰K وارد می‌شوند که با بازی منظم و هدفمند تگزاس هولدم در لول‌های اولیه فینال می‌توان با آن‌ها رقابت کرد.${statsSection}`;
  }

  // 4. Question about optimal hours / timing
  if (
    qLower.includes('ساعت') ||
    qLower.includes('زمان') ||
    qLower.includes('تایم') ||
    qLower.includes('خلوت') ||
    qLower.includes('شب') ||
    qLower.includes('روز')
  ) {
    const activeH = hourly.filter(h => h.total_registrations > 0);
    const best = activeH.length > 0 ? [...activeH].sort((a, b) => b.profit_loss - a.profit_loss)[0] : null;
    const worst = activeH.length > 0 ? [...activeH].sort((a, b) => a.profit_loss - b.profit_loss)[0] : null;

    return `### ⏰ تحلیل زمان‌بندی طلایی برای ${stageConfig.name_fa}

۱. **وضعیت آماری ساعت‌های ثبت‌شده شما:**
${best ? `- **بهترین پنجره عملکردی:** ساعت **${best.label}** با سود خالص **+$${best.profit_loss}** و نرخ صعود **${best.win_rate}%**.` : '- داده‌های بازی شما در این استیج در حال تکمیل است.'}
${worst && worst.profit_loss < 0 ? `- **پنجره کم‌بازده:** ساعت **${worst.label}** با تراز منفی **$${worst.profit_loss}**؛ توصیه می‌شود در این ساعت با احتیاط بازی کنید.` : ''}

۲. **توصیه استراتژیک بر اساس دینامیک میزها:**
- در تورنمنت‌های ۳-کارت آل‌این، شلوغی میز عامل بسیار تعیین‌کننده‌ای است. در ساعات خلوت‌تر (معمولاً ساعت‌های ظهر و بعدازظهر یا ساعات اولیه بامداد)، میزها با ۶ یا ۷ بازیکن استارت می‌خورند و شانس صعود به ۱۴٪ تا ۱۶٪ می‌رسد.
- در ساعات پیک ترافیک (ساعات ۲۱:۳۰ الی ۲۳:۳۰)، میزها پر و ۹ نفره هستند و شانس برد به ۱۱.۱٪ افت می‌کند؛ در این ساعات انتخاب گزینه‌های ثبت‌نام اقتصادی (${stageId === 2 ? 'نیم دلار' : stageId === 1 ? '۱۵ سنت' : `${stepCost}$`}) بازدهی بهتری دارد.`;
  }

  // 5. Question about bankroll / stop-loss / risk
  if (
    qLower.includes('سرمایه') ||
    qLower.includes('بالانس') ||
    qLower.includes('حد ضرر') ||
    qLower.includes('باخت') ||
    qLower.includes('تیلت') ||
    qLower.includes('ریسک') ||
    qLower.includes('تارگت')
  ) {
    const buyInCount = Math.floor(settings.initial_balance / baseCost);
    return `### 🛡️ مدیریت سرمایه و حد ضرر در ${stageConfig.name_fa}

۱. **مشخصات بانکرول در این استیج:**
- موجودی اولیه کیف‌پول: **$${settings.initial_balance}**
- موجودی فعلی: **$${summary.current_balance}** (سود/زیان: ${summary.profit_loss >= 0 ? '+' : ''}$${summary.profit_loss})
- شما با این سرمایه ظرفیت **${buyInCount} ورودی کامل** را دارید.
- حد مجاز ضرر روزانه تعیین‌شده: **$${settings.max_daily_loss}** | حد مجاز ضرر کل دوره: **$${settings.max_total_loss}**

۲. **قوانین انضباطی مربی:**
- **قانون ۳ پنجره:** اگر در یک روز کاری ۳ پنجره متوالی بدون سود سپری شد، حتماً حداقل ۱ ساعت بازی را متوقف کنید تا از پدیده تیلت (Tilt) و تصمیمات هیجانی جلوگیری شود.
- **حفظ سود روزانه:** به محض رسیدن به تارگت روزانه ($${settings.daily_target})، تعداد پنجره‌های فعال باقیمانده را به نصف کاهش داده و صرفاً روی ساعات طلایی تمرکز کنید.`;
  }

  // Default intelligent answer customized to this stage
  return `### 🤖 پاسخ استراتژیک مربی ${stageConfig.name_fa}

در پاسخ به پرسش شما درباره: «${question}»:

۱. **ارزیابی در بستر اقتصادی ${stageConfig.name_fa}:**
- به یاد داشته باشید که در ${stageConfig.name_fa}، ورودی پایه کامل **$${baseCost}** برای ۵,۰۰۰ چیپ است و هر ۱,۰۰۰ چیپ اضافه با ضریب **$${stepCost}** ${stageId === 2 ? '(نیم دلار)' : ''} محاسبه می‌شود.
- سقف هزینه ۸ قسمت یک پنجره برابر با **$${fullWindowCost}** است؛ بنابراین مدیریت هزینه در هر پنجره مهم‌ترین فاکتور دستیابی به سود پایدار است.

۲. **جوایز فینال و عملکرد آماری:**
- بازه تقریبی جایزه نفر اول فینال: **${prizeRange}** (وابسته به تعداد شرکت‌کنندگان و استخر جمع‌شده).
- نرخ صعود فعلی شما: **${summary.success_rate}%** (${summary.total_advances} صعود از ${summary.total_registrations} ثبت‌نام).
- سود خالص تاکنون: **${summary.profit_loss >= 0 ? '+' : ''}$${summary.profit_loss}**.

۳. **توصیه عملیاتی مربی:**
- با ثبت اطلاعات اختیاری فینال (تعداد صعودکنندگان و استخر جوایز) در جزئیات پنجره‌ها، دقت این تحلیل‌ها در ساعات آینده به‌طور مداوم افزایش می‌یابد.`;
}

function buildFallbackInsights(
  stageConfig: StageConfig,
  settings: UserSettings,
  summary: PeriodSummary,
  streaks: { maxWinStreak: number; maxLossStreak: number },
  bestHour: any,
  worstHour: any,
  bestRound: any
): AIStrategyInsight[] {
  const stageId = stageConfig.id;
  const prizeRange = stageConfig.first_prize_range_fa;

  // Buy-in insight customized per stage
  let buyInContent = '';
  let buyInRecommendation = '';

  if (stageId === 1) {
    buyInContent = 'در قسمت‌های ۸ گانه مقدماتی که هر کدام ۲ تا ۵ دقیقه زمان می‌برند، تمام بازیکنان میز هم‌زمان چیپ‌های ورودی را آل‌این می‌کنند. ورودی پایه ۲۵ سنت (۵K چیپ) بالاترین شانس ریاضی را برای برد آل‌این و صعود به دور نهایی با استک نرمال ۳۰K تا ۵۰K می‌دهد.';
    buyInRecommendation = 'ورود با ورودی کامل ۲۵ سنت برای حداکثر شانس برد آل‌این؛ و توقف ثبت‌نام بلافاصله پس از اولین صعود.';
  } else if (stageId === 2) {
    buyInContent = 'در Stage 2 هر قسمت یک آل‌این هم‌زمان ۲ تا ۵ دقیقه‌ای است. ورودی ۲.۵۰ دلار (۵K چیپ) بیشترین سهم را در پات آل‌این دارد. با یک صعود، استک نرمال ۳۰K تا ۵۰K کسب می‌شود و توقف بعد از آن مانع از سوختن ورودی‌های ۲۰ دلاری کل پنجره می‌گردد.';
    buyInRecommendation = 'یک صعود کاملاً کافیست! متوقف شدن پس از صعود اول برای حفظ کامل سود.';
  } else if (stageId === 3) {
    buyInContent = 'در Stage 3 هر قسمت یک آل‌این سریع ۲ تا ۵ دقیقه‌ای است. یک صعود با ۱۵ دلار برای ورود به فینال تگزاس هولدم با استک نرمال ۳۰K تا ۵۰K کافیست و نیازی به ثبت‌نام در قسمت‌های دیگر نیست.';
    buyInRecommendation = 'توقف قطعی ثبت‌نام به محض ثبت اولین صعود جهت صرفه‌جویی در هزینه ۱۲۰ دلاری پنجره.';
  } else {
    buyInContent = 'در استیج ۱۰۰ دلاری حرفه‌ای، هر قسمت یک آل‌این برق‌آسا است. تنها یک برد استک استاندارد ۳۰K تا ۵۰K را در جمع ۹۰ فینالیست تضمین می‌کند و ثبت‌نام مکرر هزینه پنجره را بیهوده تا ۸۰۰ دلار بالا می‌برد.';
    buyInRecommendation = 'هدف‌گذاری برای یک صعود تک و حفظ بانکرول برای فینال واقعی تگزاس هولدم.';
  }

  const insights: AIStrategyInsight[] = [
    {
      id: `ins_timing_${stageId}`,
      category: 'timing',
      title: `ساعات طلایی در ${stageConfig.name_fa}`,
      content: bestHour
        ? `پنجره ${bestHour.label} با سود خالص $${bestHour.profit_loss} و نرخ صعود ${bestHour.win_rate}% پربازده‌ترین ساعت برای ثبت‌نام در این استیج است.`
        : `پس از ثبت چند پنجره دیگر در ${stageConfig.name_fa}، ساعت‌های خلوت با نرخ صعود بالاتر تفکیک خواهند شد.`,
      recommendation: bestHour ? `تمرکز ویژه روی پنجره ${bestHour.label} و ساعت‌های مجاور` : 'ثبت در ساعات ظهر و خلوت‌تر',
      confidence: bestHour ? 94 : 85,
      created_at: new Date().toISOString()
    },
    {
      id: `ins_buyin_${stageId}`,
      category: 'buyin',
      title: `استراتژی خرید چیپ در ${stageConfig.name_fa}`,
      content: buyInContent,
      recommendation: buyInRecommendation,
      confidence: 90,
      created_at: new Date().toISOString()
    },
    {
      id: `ins_risk_${stageId}`,
      category: 'risk',
      title: `کنترل حد ضرر در ${stageConfig.name_fa}`,
      content: streaks.maxLossStreak > 2
        ? `بیشترین زنجیره باخت شما ${streaks.maxLossStreak} پنجره بوده است. سقف ضرر روزانه این استیج $${settings.max_daily_loss} است؛ در صورت ۲ باخت متوالی، استراحت توصیه می‌شود.`
        : `کنترل ریسک سرمایه زیر سقف مجاز روزانه ($${settings.max_daily_loss}) با موفقیت مدیریت شده است.`,
      recommendation: `قانون یک صعود کافیست: به محض صعود متوقف شوید؛ استک تمام صعودکنندگان در فینال تقریباً برابر است.`,
      confidence: 95,
      created_at: new Date().toISOString()
    },
    {
      id: `ins_forecast_${stageId}`,
      category: 'forecast',
      title: `پیش‌بینی بازدهی و جوایز فینال`,
      content: summary.total_days > 0 && summary.avg_daily_profit !== 0
        ? `با حفظ میانگین روزانه $${summary.avg_daily_profit}، پیش‌بینی می‌شود سود کل دوره به حدود $${(summary.avg_daily_profit * summary.total_days).toFixed(1)} برسد.`
        : `هدف روزانه $${settings.daily_target} و جایزه تقریبی نفر اول فینال ${prizeRange} برآورد می‌شود.`,
      recommendation: `تمرکز بر مهارت واقعی تگزاس هولدم در فینال با استک نرمال ۳۰K تا ۵۰K جهت دستیابی به جوایز برتر (${prizeRange}).`,
      confidence: 86,
      created_at: new Date().toISOString()
    }
  ];

  return insights;
}

function generateHeuristicReport(
  stageConfig: StageConfig,
  settings: UserSettings,
  summary: PeriodSummary,
  streaks: { maxWinStreak: number; maxLossStreak: number },
  bestHour: any,
  worstHour: any,
  bestRound: any,
  buyInStats: any[],
  avgQualifiers: number | null,
  avgPrizePool: number | null,
  avgRank1Prize: number | null
): string {
  const stageId = stageConfig.id;
  const roi = summary.total_cost > 0 ? ((summary.profit_loss / summary.total_cost) * 100).toFixed(1) : '0';
  const isProfitable = summary.profit_loss >= 0;
  const baseCost = stageConfig.base_buy_in_usd;
  const stepCost = stageConfig.step_buy_in_usd;
  const fullCost = (baseCost * 8).toFixed(2);
  const prizeRange = stageConfig.first_prize_range_fa;

  return `### 📊 گزارش تحلیلی هوشمند استراتژی ${stageConfig.name_fa}

#### ۱. بررسی وضعیت کلی و عملکرد مالی
- **موجودی اولیه کیف‌پول این استیج:** $${settings.initial_balance}
- **موجودی فعلی در گردش:** $${summary.current_balance}
- **سود/زیان کل ثبت‌شده:** ${isProfitable ? '+' : ''}$${summary.profit_loss} (بازدهی سرمایه: ${roi}%)
- **تعداد کل ثبت‌نام‌ها در زیرمراحل:** ${summary.total_registrations} بار
- **تعداد صعودهای موفق به فینال:** ${summary.total_advances} بار با نرخ تبدیل **${summary.success_rate}%**
- **میانگین سود هر روز کاری:** $${summary.avg_daily_profit} | تارگت روزانه: $${settings.daily_target}
- **سقف حد ضرر روزانه تعیین‌شده:** $${settings.max_daily_loss} | سقف حد ضرر کل: $${settings.max_total_loss}

#### ۲. کشف الگوهای ساعتی و زمانی (Timing Patterns)
${bestHour ? `- **پنجره طلایی (بهترین عملکرد):** ساعت **${bestHour.label}** با مجموع سود **+$${bestHour.profit_loss}** و نرخ صعود **${bestHour.win_rate}%**.` : '- پنجره‌های ساعتی در حال جمع‌آوری داده‌های تفکیکی هستند.'}
${worstHour && worstHour.profit_loss < 0 ? `- **پنجره پرریسک:** ساعت **${worstHour.label}** با برآیند **$${worstHour.profit_loss}**؛ توصیه می‌شود در این بازه حجم کمتری ثبت‌نام شود.` : ''}

#### ۳. تحلیل تخصصی ساختار قسمت‌های ۸‌گانه و فینال در ${stageConfig.name_fa}
- **مکانیک قسمت‌های ۸‌گانه (All-in Shootout):** هر قسمت ۲ الی ۵ دقیقه طول می‌کشد؛ همه بازیکنان میز هم‌زمان چیپ‌های ورودی را آل‌این می‌کنند و تنها یک برنده کل چیپ‌های میز را می‌برد و صعود می‌کند.
- **هزینه پایه هر قسمت:** $${baseCost} برای دریافت ۵,۰۰۰ چیپ اولیه (بیشترین شانس برد آل‌این).
- **نرخ خرید چیپ کمتر:** به ازای هر **$${stepCost}** ${stageId === 2 ? '(نیم دلار)' : stageId === 1 ? '(۵ سنت)' : ''}، بازیکن ۱,۰۰۰ چیپ دریافت می‌کند.
- **استک نرمال فینال:** با یک بار صعود، استک استاندارد ۳۰K تا ۵۰K چیپ به دست می‌آید که تقریباً با استک تمام صعودکنندگان به دور نهایی برابر است.
- **سقف هزینه پنجره کامل:** ثبت‌نام در تمام ۸ قسمت معادل **$${fullCost}** است.
- **بازه تقریبی جایزه نفر اول فینال:** **${prizeRange}** (با توجه به متغیر بودن شرکت‌کنندگان و مبلغ کل جوایز).
${avgQualifiers ? `- **میانگین شرکت‌کنندگان صعودکرده ثبت‌شده:** ${avgQualifiers} نفر در هر فینال.` : ''}
${avgPrizePool ? `- **میانگین استخر جایزه کل ثبت‌شده:** $${avgPrizePool} دلار.` : ''}
${avgRank1Prize ? `- **میانگین جایزه نفر اول ثبت‌شده بازیکن:** $${avgRank1Prize} دلار.` : ''}
- هزینه متوسط شما به ازای هر صعود تاکنون معادل **$${summary.total_advances > 0 ? (summary.total_cost / summary.total_advances).toFixed(2) : '0.00'}** بوده است.

#### ۴. توصیه‌های عملیاتی مربی برای بیشینه‌سازی سود در ${stageConfig.name_fa}
۱. **اصل طلایی «یک صعود کافیست»:** به محض برنده شدن در هر یک از قسمت‌ها، بلیت فینال با استک نرمال ۳۰K تا ۵۰K تضمین شده است؛ ثبت‌نام در قسمت‌های بعدی را متوقف کنید تا هزینه پنجره ذخیره شود.
۲. **قانون توقف ضرر (Stop-Loss در ساعت):** در پنجره‌هایی که تا قسمت چهارم هیچ صعودی نداشتید، ثبت‌نام را متوقف کنید تا از اتلاف هزینه پنجره جلوگیری شود.
۳. **تمرکز بر بازی واقعی پوکر در دور نهایی:** بازی واقعی No-Limit Texas Hold'em منحصراً در فینال (ساعت X:35) برگزار می‌شود؛ انرژی، مهارت پوزیشن و مدیریت چیپ‌ها را برای دستیابی به جوایز برتر فینال (${prizeRange}) اختصاص دهید.`;
}
