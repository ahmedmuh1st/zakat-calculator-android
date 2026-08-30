// Curated offline Zakat FAQ, no AI, no network, zero running cost.
// Answers follow widely accepted positions (AAOIFI Shariah Standard 35,
// Saudi Permanent Committee, mainstream contemporary fiqh). They are
// guidance, not fatwa, complex cases belong with a trusted scholar.

export interface FaqItem {
  id: string;
  category: FaqCategory;
  q: { en: string; ar: string };
  a: { en: string; ar: string };
  /** extra search keywords (both languages, lowercase) */
  keywords: string[];
}

export type FaqCategory =
  | "basics"
  | "cash"
  | "gold"
  | "stocks"
  | "business"
  | "property"
  | "debts"
  | "family"
  | "payment";

export const FAQ_CATEGORIES: { id: FaqCategory; en: string; ar: string }[] = [
  { id: "basics", en: "Basics", ar: "الأساسيات" },
  { id: "cash", en: "Cash & Salary", ar: "النقد والراتب" },
  { id: "gold", en: "Gold & Silver", ar: "الذهب والفضة" },
  { id: "stocks", en: "Stocks & Investments", ar: "الأسهم والاستثمارات" },
  { id: "business", en: "Business", ar: "التجارة" },
  { id: "property", en: "Real Estate", ar: "العقارات" },
  { id: "debts", en: "Debts & Dues", ar: "الديون والمستحقات" },
  { id: "family", en: "Family & Personal", ar: "الأسرة والشخصي" },
  { id: "payment", en: "Paying Zakat", ar: "إخراج الزكاة" },
];

export const FAQ_ITEMS: FaqItem[] = [
  // Basics
  {
    id: "what-is-nisab",
    category: "basics",
    q: { en: "What is the Nisab and how is it set?", ar: "ما هو النصاب وكيف يُحدَّد؟" },
    a: {
      en: "The Nisab is the minimum wealth that makes Zakat due. The Prophet ﷺ set it at 85 grams of gold or 595 grams of silver. If your zakatable wealth stays at or above this value for a full lunar year, you pay 2.5%. The silver standard gives a lower threshold and includes more payers, many scholars consider it safer for the poor's right; the gold standard is more common today.",
      ar: "النصاب هو الحد الأدنى من المال الذي تجب فيه الزكاة، وقد حدّده النبي ﷺ بـ85 جراماً من الذهب أو 595 جراماً من الفضة. إذا بلغ مالك الزكوي هذا الحد واستمر حولاً هجرياً كاملاً وجبت فيه الزكاة بنسبة 2.5%. نصاب الفضة أقل قيمةً فيدخل به عدد أكبر من المزكّين، ويراه كثير من العلماء أحوط؛ ومعيار الذهب هو الأكثر استعمالاً اليوم.",
    },
    keywords: ["nisab", "threshold", "minimum", "نصاب", "حد"],
  },
  {
    id: "what-is-hawl",
    category: "basics",
    q: { en: "What is the Hawl (Zakat year)?", ar: "ما هو الحول؟" },
    a: {
      en: "The Hawl is one full lunar (Hijri) year of continuous ownership above the Nisab. Pick the Hijri date your wealth first reached the Nisab, that becomes your annual Zakat day. You pay on what you own on that day; money that came and went during the year doesn't need separate tracking, as most scholars count what remains on the anniversary.",
      ar: "الحول هو مرور سنة هجرية كاملة على ملكك للنصاب. اختر التاريخ الهجري الذي بلغ فيه مالك النصاب أول مرة، فيصبح يوم زكاتك السنوي. تزكّي ما تملكه في ذلك اليوم، ولا يلزم تتبّع ما دخل وخرج أثناء السنة، لأن العبرة عند أكثر العلماء بما يبقى يوم تمام الحول.",
    },
    keywords: ["hawl", "year", "lunar", "anniversary", "حول", "سنة"],
  },
  {
    id: "rate-why",
    category: "basics",
    q: { en: "Why 2.5%? Is it always that rate?", ar: "لماذا 2.5%؟ وهل هي النسبة دائماً؟" },
    a: {
      en: "2.5% (a quarter of a tenth) is the rate fixed by the Sunnah for money, gold, silver and trade goods. Different rates apply to other wealth: crops are 10% (rain-fed), 5% (irrigated at cost) or 7.5% (mixed), and livestock has its own schedule. This app applies the correct rate per category automatically.",
      ar: "نسبة 2.5% (ربع العشر) ثابتة بالسنة في النقود والذهب والفضة وعروض التجارة. وتختلف في غيرها: الزروع عشر (10%) فيما سُقي بلا مؤنة، ونصف العشر (5%) فيما سُقي بمؤنة، و7.5% فيما سُقي بهما، وللأنعام أنصبة خاصة. يطبّق التطبيق النسبة الصحيحة لكل فئة تلقائياً.",
    },
    keywords: ["rate", "percentage", "2.5", "نسبة", "ربع العشر"],
  },
  {
    id: "lunar-vs-solar",
    category: "basics",
    q: { en: "Can I use the Gregorian calendar instead of Hijri?", ar: "هل يمكن اعتماد التقويم الميلادي بدل الهجري؟" },
    a: {
      en: "The Hawl is a lunar year by default. If you must use the solar (Gregorian) year for accounting, scholars allow it provided you adjust the rate upward to about 2.577% to compensate for the ~11 extra days. The cleaner practice is to keep a fixed Hijri date, this app counts it for you.",
      ar: "الأصل أن الحول سنة هجرية. فإن اضطررت لاعتماد السنة الميلادية في حساباتك أجازها العلماء بشرط رفع النسبة إلى نحو 2.577% تعويضاً عن الأيام الإحدى عشرة الزائدة تقريباً. والأفضل تثبيت تاريخ هجري, والتطبيق يعدّه لك.",
    },
    keywords: ["gregorian", "solar", "calendar", "ميلادي", "تقويم"],
  },
  {
    id: "who-must-pay",
    category: "basics",
    q: { en: "Who must pay Zakat? Do children pay?", ar: "على من تجب الزكاة؟ وهل تجب في مال الصغير؟" },
    a: {
      en: "Every Muslim who owns the Nisab for a full Hawl must pay, regardless of age or sanity according to the majority (Maliki, Shafi'i, Hanbali): the guardian pays from a child's or incapacitated person's wealth. The Hanafi school exempts children. Paying from a child's wealth is the safer, majority-backed practice.",
      ar: "تجب الزكاة على كل مسلم ملك النصاب وحال عليه الحول. وعند جمهور العلماء (المالكية والشافعية والحنابلة) تجب في مال الصبي والمجنون ويخرجها الولي، خلافاً للحنفية. والإخراج من مال الصغير هو الأحوط وقول الجمهور.",
    },
    keywords: ["children", "child", "minor", "who", "صغير", "طفل", "ولي"],
  },
  // Cash & Salary
  {
    id: "salary",
    category: "cash",
    q: { en: "How do I pay Zakat on my salary?", ar: "كيف أزكّي راتبي؟" },
    a: {
      en: "You don't zakat the salary itself, you zakat what remains of it. The practical method: on your fixed Zakat day, pay 2.5% on everything in your accounts, regardless of when each riyal arrived. This 'snapshot' method is endorsed by contemporary scholars because it is simple and always errs in the poor's favor.",
      ar: "الزكاة ليست على الراتب نفسه بل على ما يتبقى منه. والطريقة العملية: في يوم زكاتك الثابت زكِّ كل ما في حساباتك بنسبة 2.5% بغضّ النظر عن وقت دخول كل مبلغ. هذه طريقة «الجرد السنوي» التي أفتى بها العلماء المعاصرون لسهولتها ولأنها أحظّ للفقراء.",
    },
    keywords: ["salary", "income", "monthly", "راتب", "دخل"],
  },
  {
    id: "end-of-service",
    category: "cash",
    q: { en: "Is Zakat due on my end-of-service benefits (EOS)?", ar: "هل تجب الزكاة في مكافأة نهاية الخدمة؟" },
    a: {
      en: "Not while it sits with your employer, you lack full ownership (milk tamm): you cannot access it and the amount isn't settled until you leave. Once paid out, it joins your cash and you zakat whatever remains of it on your next Zakat day. This is the position of the Saudi Permanent Committee and mainstream contemporary fiqh.",
      ar: "لا زكاة فيها ما دامت عند جهة العمل، لعدم تمام الملك: فلا تستطيع التصرف فيها ولا يتحدد مقدارها إلا عند انتهاء الخدمة. فإذا قُبضت انضمت إلى نقودك وزكّيت ما يبقى منها في يوم زكاتك القادم. وهذا ما أفتت به اللجنة الدائمة وعليه عامة المعاصرين.",
    },
    keywords: ["end of service", "eos", "gratuity", "benefits", "نهاية الخدمة", "مكافأة"],
  },
  {
    id: "savings-goal",
    category: "cash",
    q: { en: "I'm saving for a house/marriage, is that money exempt?", ar: "أدّخر لشراء بيت أو للزواج: هل يُعفى هذا المال؟" },
    a: {
      en: "No. Cash saved for any future purpose, a home, marriage, education, Hajj, remains zakatable as long as it is in your ownership on your Zakat day. The intention to spend it later does not remove Zakat; only actually spending it does.",
      ar: "لا. النقود المدّخرة لأي غرض مستقبلي, بيت أو زواج أو دراسة أو حج, تبقى زكوية ما دامت في ملكك يوم زكاتك. فنية الإنفاق لاحقاً لا تُسقط الزكاة، وإنما يسقطها الإنفاق الفعلي.",
    },
    keywords: ["saving", "house", "marriage", "hajj", "ادخار", "زواج", "بيت"],
  },
  {
    id: "bank-interest",
    category: "cash",
    q: { en: "My bank account earned interest, do I zakat it?", ar: "حسابي البنكي فيه فوائد ربوية: هل أزكّيها؟" },
    a: {
      en: "Interest (riba) is not yours to keep or zakat, scholars require disposing of it entirely to general charity (without expecting reward), separate from Zakat. Zakat is calculated on your principal only. Moving to Islamic banking avoids the issue.",
      ar: "الفوائد الربوية لا تُملك شرعاً فلا تُزكّى، بل يجب التخلص منها كاملة في وجوه الخير العامة (بلا نية أجر) منفصلةً عن الزكاة. وتُحسب زكاتك على رأس مالك فقط. والتحول إلى المصرفية الإسلامية يجنّبك ذلك.",
    },
    keywords: ["interest", "riba", "bank", "فوائد", "ربا"],
  },
  {
    id: "multi-currency",
    category: "cash",
    q: { en: "I hold several currencies: how do I combine them?", ar: "أملك عملات متعددة: كيف أجمعها؟" },
    a: {
      en: "Convert everything to one base currency at the exchange rate of your Zakat day, sum it with your other zakatable wealth, compare to the Nisab, and pay 2.5% of the total. This app does the conversion automatically with live rates.",
      ar: "تُحوَّل جميع العملات إلى عملتك الأساسية بسعر الصرف يوم الزكاة، وتُجمع مع بقية أموالك الزكوية، وتُقارن بالنصاب، ثم تُخرج 2.5% من المجموع. والتطبيق يجري التحويل تلقائياً بالأسعار الحية.",
    },
    keywords: ["currency", "dollar", "exchange", "عملة", "دولار", "صرف"],
  },
  // Gold & Silver
  {
    id: "wife-jewelry",
    category: "gold",
    q: { en: "Is Zakat due on my wife's gold jewellery she wears?", ar: "هل تجب الزكاة في ذهب زوجتي الذي تلبسه؟" },
    a: {
      en: "Scholars differ. The Hanafi school (and the Saudi Permanent Committee) require Zakat on all gold reaching the Nisab, worn or not. The majority (Maliki, Shafi'i, Hanbali) exempt jewellery in normal personal use. Paying is the safer opinion; if you follow the majority, gold kept for storage or investment is still zakatable by consensus.",
      ar: "مسألة خلافية: فالحنفية (ومعهم اللجنة الدائمة في السعودية) يوجبون الزكاة في كل ذهب بلغ النصاب ولو كان ملبوساً، والجمهور (المالكية والشافعية والحنابلة) لا يوجبونها في الحلي المستعمل استعمالاً معتاداً. والإخراج أحوط، ومع الأخذ بقول الجمهور يبقى الذهب المدّخر أو المعدّ للاستثمار زكوياً باتفاق.",
    },
    keywords: ["jewellery", "jewelry", "wife", "worn", "حلي", "زوجة", "ملبوس"],
  },
  {
    id: "gold-karat",
    category: "gold",
    q: { en: "How do I zakat 18k or 21k gold?", ar: "كيف أزكّي ذهب عيار 18 أو 21؟" },
    a: {
      en: "Zakat applies to the pure gold content. Multiply the weight by purity: 24k = 100%, 21k = 87.5%, 18k = 75%. Then value the pure grams at today's gold price and pay 2.5%. This app handles the karat math when you enter gold items.",
      ar: "الزكاة على الذهب الخالص. اضرب الوزن في نسبة العيار: عيار 24 = 100%، وعيار 21 = 87.5%، وعيار 18 = 75%، ثم قوّم الجرامات الخالصة بسعر اليوم وأخرج 2.5%. والتطبيق يتولى حساب العيار عند إدخال الذهب.",
    },
    keywords: ["karat", "21", "18", "purity", "عيار"],
  },
  {
    id: "gold-below-nisab",
    category: "gold",
    q: { en: "My gold alone is below Nisab: do I still pay?", ar: "ذهبي وحده دون النصاب: فهل أزكّيه؟" },
    a: {
      en: "Gold is combined with your cash, trade goods and other monetary wealth. If the combined total reaches the Nisab, you pay Zakat on all of it, including the gold. Gold is only exempt if your entire zakatable pool stays under the Nisab.",
      ar: "يُضمّ الذهب إلى النقود وعروض التجارة وسائر الأموال الزكوية، فإذا بلغ المجموع النصاب زكّيت الجميع ومنه الذهب. ولا يُعفى الذهب إلا إذا بقي مجموع أموالك الزكوية كلها دون النصاب.",
    },
    keywords: ["combine", "below", "pool", "ضم", "دون النصاب"],
  },
  // Stocks & Investments
  {
    id: "stocks-long-term",
    category: "stocks",
    q: { en: "How do I zakat stocks I hold long-term?", ar: "كيف أزكّي أسهماً أحتفظ بها للاستثمار الطويل؟" },
    a: {
      en: "Two accepted methods: (1) the simple, safer route, pay 2.5% on the full market value each Zakat day; (2) the analytical route, pay 2.5% only on your share of the company's zakatable (liquid) assets, if you can obtain that ratio from its financials. Dividends received join your cash. Day-trading positions are always zakated at full market value.",
      ar: "طريقتان معتبرتان: الأولى، وهي الأسهل والأحوط، إخراج 2.5% من كامل القيمة السوقية كل يوم زكاة. والثانية تحليلية: إخراج 2.5% من نصيبك من الموجودات الزكوية (السائلة) للشركة إن أمكنك معرفة نسبتها من قوائمها المالية. والأرباح الموزعة تنضم إلى نقودك. أما أسهم المضاربة السريعة فتُزكّى بكامل قيمتها السوقية اتفاقاً.",
    },
    keywords: ["stocks", "shares", "long term", "investment", "أسهم", "استثمار"],
  },
  {
    id: "esop",
    category: "stocks",
    q: { en: "Do my employee stock options (ESOP) count?", ar: "هل تدخل أسهم الموظفين (ESOP) في الزكاة؟" },
    a: {
      en: "Unvested options or shares: no Zakat, you lack full ownership and could forfeit them. Once vested and yours to sell, they are zakatable like any stock: 2.5% of market value on your Zakat day (or the zakatable-assets method for long-term holdings). Restricted shares you own but cannot yet sell resemble a strong receivable: many scholars say zakat them each year; a valid minority view defers to one year's Zakat when they become sellable.",
      ar: "الأسهم أو الخيارات غير المستحقة (unvested): لا زكاة فيها لعدم تمام الملك ولاحتمال سقوطها. فإذا استُحقّت وصارت قابلة للبيع زُكّيت كسائر الأسهم: 2.5% من القيمة السوقية يوم زكاتك. أما الأسهم المملوكة الممنوعة من البيع مؤقتاً فهي أشبه بالدَّين المرجوّ: فيزكّيها كل سنة عند كثير من العلماء، وذهب بعضهم إلى زكاتها لسنة واحدة عند إمكان البيع.",
    },
    keywords: ["esop", "options", "vested", "employee shares", "rsu", "أسهم الموظفين", "خيارات"],
  },
  {
    id: "funds-etf",
    category: "stocks",
    q: { en: "What about mutual funds, ETFs and index funds?", ar: "ماذا عن الصناديق الاستثمارية والمؤشرات؟" },
    a: {
      en: "Treat them like stocks: the practical default is 2.5% of the fund units' market value on your Zakat day. Some Shariah-compliant funds publish a per-unit zakatable ratio, if available, you may use it. Money-market and sukuk funds are essentially cash-like: zakat full value.",
      ar: "حكمها حكم الأسهم: والأصل العملي إخراج 2.5% من القيمة السوقية للوحدات يوم زكاتك. وبعض الصناديق الشرعية تنشر نسبة الموجودات الزكوية لكل وحدة، فإن توفرت جاز اعتمادها. أما صناديق النقد والصكوك فهي في حكم النقد: تُزكّى بكامل قيمتها.",
    },
    keywords: ["fund", "etf", "index", "صندوق", "مؤشر"],
  },
  {
    id: "crypto",
    category: "stocks",
    q: { en: "Is cryptocurrency zakatable?", ar: "هل تجب الزكاة في العملات الرقمية؟" },
    a: {
      en: "Contemporary bodies that permit holding crypto treat it as monetary wealth or trade goods: pay 2.5% of market value on your Zakat day, converted to your currency. Staked or locked tokens you still own remain zakatable. If you consider crypto impermissible to hold, the way out is to exit, not to skip Zakat while holding.",
      ar: "الهيئات المعاصرة التي تجيز تملّك العملات الرقمية تعاملها معاملة النقود أو عروض التجارة: 2.5% من القيمة السوقية يوم زكاتك بعملتك. والعملات المجمّدة (staking) المملوكة لك تبقى زكوية. ومن يرى حرمة تملكها فالمخرج التخلص منها لا ترك زكاتها مع بقائها.",
    },
    keywords: ["crypto", "bitcoin", "بيتكوين", "عملات رقمية"],
  },
  {
    id: "retirement",
    category: "stocks",
    q: { en: "Do retirement/pension savings (GOSI, pension funds) count?", ar: "هل تجب الزكاة في مدخرات التقاعد (التأمينات، صناديق التقاعد)؟" },
    a: {
      en: "Mandatory schemes you cannot access (like GOSI contributions) carry no Zakat until amounts are actually received, then they join your cash. Voluntary plans you control and could withdraw (even with penalty) are zakatable yearly on the accessible value, per the stronger contemporary view.",
      ar: "الاشتراكات الإلزامية التي لا يمكنك التصرف فيها (كالتأمينات الاجتماعية) لا زكاة فيها حتى تُقبض فعلاً فتنضم إلى نقودك. أما الخطط الاختيارية التي تملك سحبها (ولو بغرامة) فتُزكّى سنوياً على القيمة المتاحة، على القول الأرجح عند المعاصرين.",
    },
    keywords: ["retirement", "pension", "gosi", "تقاعد", "تأمينات"],
  },
  // Business
  {
    id: "business-how",
    category: "business",
    q: { en: "How does a business owner calculate Zakat?", ar: "كيف يحسب صاحب المشروع زكاته؟" },
    a: {
      en: "Zakat falls on working capital, not fixed assets: add cash, inventory valued at today's selling price, and receivables you expect to collect; subtract debts due within the year; pay 2.5% of the net. Equipment, vehicles, premises and furniture used to run the business are exempt.",
      ar: "الزكاة على رأس المال العامل لا الأصول الثابتة: اجمع النقد والمخزون مقوَّماً بسعر البيع الحالي والديون المرجوّة التحصيل، واخصم الديون الحالّة عليك خلال السنة، ثم أخرج 2.5% من الصافي. أما المعدات والسيارات والمقر والأثاث المستعملة لتشغيل النشاط فلا زكاة فيها.",
    },
    keywords: ["business", "company", "working capital", "تجارة", "شركة", "رأس مال"],
  },
  {
    id: "inventory",
    category: "business",
    q: { en: "How do I value my inventory?", ar: "كيف أقوّم مخزون البضاعة؟" },
    a: {
      en: "At the current wholesale/market price you would actually get for it on your Zakat day, not the historical cost you paid, and not the aspirational retail tag. Dead or unsellable stock may be valued at its realistic liquidation value.",
      ar: "بسعر السوق الحالي الذي تحصل عليه فعلاً يوم زكاتك, لا بتكلفة الشراء التاريخية ولا بسعر البيع الطموح. والبضاعة الراكدة أو بطيئة التصريف تُقوَّم بقيمتها الواقعية عند التسييل.",
    },
    keywords: ["inventory", "stock", "goods", "مخزون", "بضاعة"],
  },
  {
    id: "partnership",
    category: "business",
    q: { en: "I own 30% of a company: who pays its Zakat?", ar: "أملك 30% من شركة: من يزكّيها؟" },
    a: {
      en: "Zakat follows ownership: each partner owes Zakat on their share of the company's zakatable assets. If the company pays Zakat centrally from its accounts (common in Saudi), your share is covered, don't double-pay. If it doesn't, calculate your percentage of its zakatable net and include it in your own calculation.",
      ar: "الزكاة تتبع الملك: فعلى كل شريك زكاة حصته من الموجودات الزكوية للشركة. فإن كانت الشركة تُخرج الزكاة مركزياً من حساباتها (كالشائع في السعودية) فقد أُدّيت زكاة حصتك فلا تكررها، وإلا فاحسب نسبتك من صافيها الزكوي وأدخلها في حسابك.",
    },
    keywords: ["partner", "share", "company", "شريك", "حصة"],
  },
  // Real Estate
  {
    id: "home",
    category: "property",
    q: { en: "Is my home zakatable? My car?", ar: "هل تجب الزكاة في بيتي أو سيارتي؟" },
    a: {
      en: "No. Personal-use assets: the home you live in, your cars, furniture, devices, carry no Zakat regardless of value. Zakat targets growing wealth, not possessions in use.",
      ar: "لا. أموال القنية المستعملة: البيت الذي تسكنه وسياراتك وأثاثك وأجهزتك, لا زكاة فيها مهما بلغت قيمتها، لأن الزكاة في المال النامي لا في المقتنيات المستعملة.",
    },
    keywords: ["home", "house", "car", "personal", "بيت", "سيارة", "قنية"],
  },
  {
    id: "rental-property",
    category: "property",
    q: { en: "I own apartments I rent out: what's zakatable?", ar: "أملك شققاً مؤجّرة: ما الذي يُزكّى؟" },
    a: {
      en: "The buildings themselves are exempt (they're income-producing assets, not trade goods). The rent you collect joins your cash and is zakated with it on your Zakat day. Only if you bought a property intending to resell it does its full market value become zakatable as trade goods.",
      ar: "العقارات المؤجّرة نفسها لا زكاة فيها (فهي أصول مُغلّة لا عروض تجارة)، وإنما تنضم غلّتها (الأجرة) إلى نقودك فتُزكّى معها يوم زكاتك. فإن كنت اشتريت العقار بنية بيعه والمتاجرة به فقيمته السوقية كلها زكوية كعروض التجارة.",
    },
    keywords: ["rent", "rental", "apartment", "إيجار", "شقة", "عقار"],
  },
  {
    id: "land-intent",
    category: "property",
    q: { en: "I own land and haven't decided what to do with it", ar: "أملك أرضاً ولم أحدد ماذا سأفعل بها" },
    a: {
      en: "Intention decides. Bought for resale/trade: zakatable at market value yearly. Bought to build your home, keep as legacy, or with no settled intention: no Zakat until you actually sell (then the proceeds join your cash). Merely hoping it appreciates, without a firm trading intention, does not make it trade goods per the majority.",
      ar: "العبرة بالنية: فإن اشتريتها للبيع والمتاجرة فهي عروض تجارة تُزكّى بقيمتها السوقية كل سنة. وإن اشتريتها للسكنى أو للإرث أو بلا نية محددة فلا زكاة فيها حتى تُباع فعلاً فتنضم قيمتها إلى نقودك. ومجرد رجاء ارتفاع السعر دون عزم على الاتجار لا يجعلها عروض تجارة عند الجمهور.",
    },
    keywords: ["land", "plot", "intention", "أرض", "نية"],
  },
  // Debts & Dues
  {
    id: "my-debts",
    category: "debts",
    q: { en: "I have a mortgage/car loan: do I deduct it?", ar: "عليّ قرض عقاري أو قرض سيارة: هل أخصمه؟" },
    a: {
      en: "Deduct only the installments due within the coming year, not the entire long-term balance, this is the balanced contemporary position (AAOIFI). Deducting the whole mortgage would wipe out Zakat for most people while they live in comfort, which contradicts its purpose.",
      ar: "تخصم أقساط السنة المقبلة فقط لا كامل رصيد القرض الطويل, وهذا هو القول الوسط عند المعاصرين (أيوفي). فخصم كامل القرض العقاري يُسقط الزكاة عن أكثر الناس وهم في سعة، وهذا يخالف مقصودها.",
    },
    keywords: ["mortgage", "loan", "deduct", "قرض", "خصم", "أقساط"],
  },
  {
    id: "owed-to-me",
    category: "debts",
    q: { en: "People owe me money: do I zakat it?", ar: "لي ديون عند الناس: هل أزكّيها؟" },
    a: {
      en: "If the debtor is solvent and expected to pay (a 'strong' debt), include it in your calculation each year. If recovery is doubtful, a struggling debtor, a denied or disputed debt, no yearly Zakat; when you eventually collect, pay one year's Zakat on it per the sounder view.",
      ar: "إن كان المدين مليئاً باذلاً (دَين قوي مرجوّ) فأدخله في زكاتك كل سنة. وإن كان تحصيله مشكوكاً فيه, لمماطلة أو إعسار أو جحود, فلا زكاة فيه سنوياً، فإذا قبضته زكّيته لسنة واحدة على الراجح.",
    },
    keywords: ["receivable", "owed", "lent", "دين", "مستحقات", "أقرضت"],
  },
  // Family & Personal
  {
    id: "husband-pays-wife",
    category: "family",
    q: { en: "Can I pay Zakat on behalf of my wife's gold?", ar: "هل أُخرج الزكاة عن ذهب زوجتي؟" },
    a: {
      en: "Zakat on her gold is her obligation since she owns it. You may pay it on her behalf with her knowledge and consent, that is valid and common, and it counts as a gift from you to her. Without her authorization, her obligation isn't discharged.",
      ar: "زكاة ذهبها واجبة عليها لأنها المالكة. ويصح أن تُخرجها عنها بعلمها وإذنها, وهذا جائز وشائع ويُعدّ هبة منك لها. أما بلا توكيلها فلا تبرأ ذمتها.",
    },
    keywords: ["wife", "behalf", "husband", "زوجة", "وكالة"],
  },
  {
    id: "zakat-to-relatives",
    category: "family",
    q: { en: "Can I give Zakat to relatives?", ar: "هل أدفع زكاتي لأقاربي؟" },
    a: {
      en: "Yes: and it carries double reward (charity + kinship), except to those you are already obliged to support: parents, grandparents, children, grandchildren, and your wife. An eligible poor brother, sister, uncle, cousin or in-law is actually a superior recipient.",
      ar: "نعم: ولها أجران: صدقة وصلة: إلا من تلزمك نفقتهم: الوالدين والأجداد والأولاد والأحفاد والزوجة. أما الأخ والأخت والعم وابن العم والأصهار المستحقون فهم أولى بها من غيرهم.",
    },
    keywords: ["relatives", "family", "brother", "parents", "أقارب", "أخ", "والدين"],
  },
  {
    id: "zakat-al-fitr",
    category: "family",
    q: { en: "Is Zakat al-Fitr the same as this Zakat?", ar: "هل زكاة الفطر هي هذه الزكاة؟" },
    a: {
      en: "No. Zakat al-Fitr is a separate, small per-person duty (a saa' of staple food, ~2.5-3 kg, or its value per some scholars) paid before the Eid prayer by everyone with a day's surplus food. This app calculates Zakat al-Mal, the annual 2.5% wealth Zakat.",
      ar: "لا. زكاة الفطر فريضة مستقلة يسيرة عن كل شخص (صاع من قوت البلد نحو 2.5-3 كجم، أو قيمته عند بعض أهل العلم) تُخرج قبل صلاة العيد على كل من ملك فضل قوت يومه. أما هذا التطبيق فيحسب زكاة المال السنوية بنسبة 2.5%.",
    },
    keywords: ["fitr", "eid", "فطر", "عيد"],
  },
  // Paying Zakat
  {
    id: "who-receives",
    category: "payment",
    q: { en: "Who can receive Zakat?", ar: "من يستحق الزكاة؟" },
    a: {
      en: "The Quran fixes eight categories (9:60): the poor, the needy, Zakat administrators, reconciliation of hearts, freeing captives, the debt-ridden, in Allah's cause, and stranded travellers. It cannot fund mosque construction or general projects per the majority, it is the right of eligible people.",
      ar: "حدّد القرآن ثمانية أصناف (التوبة: 60): الفقراء والمساكين والعاملين عليها والمؤلفة قلوبهم وفي الرقاب والغارمين وفي سبيل الله وابن السبيل. ولا تُصرف لبناء المساجد والمشاريع العامة عند الجمهور, فهي حق للمستحقين من الأشخاص.",
    },
    keywords: ["recipients", "categories", "poor", "مصارف", "فقراء", "أصناف"],
  },
  {
    id: "pay-early-installments",
    category: "payment",
    q: { en: "Can I pay Zakat early or in monthly installments?", ar: "هل يجوز تعجيل الزكاة أو تقسيطها شهرياً؟" },
    a: {
      en: "Paying early: before your Zakat day arrives, is permitted by the majority once you own the Nisab, even a year or two ahead. Many pay monthly amounts through the year, then true-up any shortfall on their Zakat day. Delaying payment after it falls due, however, is not allowed without genuine excuse.",
      ar: "تعجيل الزكاة قبل تمام الحول جائز عند الجمهور لمن ملك النصاب، ولو لسنة أو سنتين. وكثيرون يدفعون شهرياً على مدار السنة ثم يجبرون النقص يوم زكاتهم. أما تأخيرها بعد وجوبها فلا يجوز بلا عذر معتبر.",
    },
    keywords: ["early", "advance", "installments", "monthly", "تعجيل", "تقسيط"],
  },
  {
    id: "forgot-years",
    category: "payment",
    q: { en: "I never paid Zakat for past years, what now?", ar: "لم أزكِّ سنوات ماضية: ماذا أفعل؟" },
    a: {
      en: "Zakat is a debt to the poor that doesn't expire. Estimate your zakatable wealth for each missed year as best you can (bank statements help), calculate 2.5% per year, and pay it off, at once or in stages as you can. Repentance plus payment clears it; Allah accepts sincere estimation where records are gone.",
      ar: "الزكاة دَين للفقراء لا يسقط بالتقادم. قدّر مالك الزكوي في كل سنة فائتة بغلبة الظن (تعينك كشوف الحساب)، واحسب 2.5% عن كل سنة، وأخرجها دفعة أو على دفعات حسب قدرتك. وبالتوبة مع الأداء تبرأ الذمة، والتقدير الصادق مقبول عند تعذّر السجلات.",
    },
    keywords: ["missed", "past", "years", "قضاء", "سنوات", "فوائت"],
  },
  {
    id: "value-vs-goods",
    category: "payment",
    q: { en: "Must I pay in cash or can I give goods?", ar: "هل أدفع نقداً أم يجوز إخراج سلع؟" },
    a: {
      en: "Cash is the default and most useful to the poor. The Hanafi school permits paying the equivalent value in goods; the majority restrict goods to specific cases. For business inventory, paying cash equal to 2.5% of its value is the standard practice today.",
      ar: "النقد هو الأصل وهو أنفع للفقير. وأجاز الحنفية إخراج القيمة سلعاً، وقيّده الجمهور بحالات. وفي زكاة عروض التجارة جرى العمل اليوم على إخراج النقد بقدر 2.5% من قيمتها.",
    },
    keywords: ["cash", "goods", "value", "نقد", "قيمة", "سلع"],
  },
];
