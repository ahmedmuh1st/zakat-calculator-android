// Zakatonomics educational cards, drawn from the original eBook and calculation-heads content, presented neutrally.

export interface LearnCard {
  id: string;
  color: string;
  icon: string; // MaterialIcons name
  title: { en: string; ar: string };
  body: { en: string; ar: string };
}

export const LEARN_CARDS: LearnCard[] = [
  {
    id: "what",
    color: "#0F7B6C",
    icon: "spa",
    title: { en: "What Zakat is", ar: "ما هي الزكاة" },
    body: {
      en: "The third pillar of Islam: 2.5% of your savings wealth, given yearly to those who need it most. It purifies wealth, reminds us it flows from Allah, and keeps money moving to the poorest, whatever their beliefs.",
      ar: "الركن الثالث من أركان الإسلام: 2.5٪ من ثروتك المدخرة تُعطى سنوياً لمن هم أشد حاجة. تطهّر المال، وتذكّرنا بأنه من الله، وتُبقي الثروة تتدفق نحو الأكثر فقراً.",
    },
  },
  {
    id: "recipients",
    color: "#5B7FBD",
    icon: "diversity-3",
    title: { en: "Who receives it: the 8 categories", ar: "من يستحقها: الأصناف الثمانية" },
    body: {
      en: "The Quran (9:60) names eight: the poor, the needy, Zakat administrators, those whose hearts are to be reconciled, freeing captives, those in debt, in the cause of Allah, and the stranded traveler.",
      ar: "سمّى القرآن (التوبة: 60) ثمانية أصناف: الفقراء، والمساكين، والعاملين عليها، والمؤلفة قلوبهم، وفي الرقاب، والغارمين، وفي سبيل الله، وابن السبيل.",
    },
  },
  {
    id: "nisab",
    color: "#C9A24B",
    icon: "balance",
    title: { en: "Nisab: why two standards?", ar: "النصاب: لماذا معياران؟" },
    body: {
      en: "Zakat is only due above a minimum wealth: 85g of gold or 595g of silver, both set by the Prophet ﷺ. Silver's threshold is lower, so choosing it means giving sooner, many scholars consider it safer. Gold is the more common standard today. Pick one and stay consistent.",
      ar: "لا تجب الزكاة إلا فوق حد أدنى من الثروة: 85 جراماً من الذهب أو 595 جراماً من الفضة، وكلاهما بتحديد النبي ﷺ. نصاب الفضة أقل فيعني العطاء مبكراً, ويراه كثير من العلماء أحوط. الذهب هو المعيار الأشيع اليوم. اختر واحداً والزمه.",
    },
  },
  {
    id: "hawl",
    color: "#7A8B5A",
    icon: "event-repeat",
    title: { en: "The Hawl: your Zakat year", ar: "الحَوْل: سنتك الزكوية" },
    body: {
      en: "Wealth must sit with you one full Hijri year (the hawl) before Zakat is due on it. Most people fix one anniversary, the 1st of Ramadan is a beloved tradition, and calculate everything on that day at market values.",
      ar: "يشترط أن يمر على المال حول هجري كامل قبل وجوب الزكاة فيه. يثبّت معظم الناس تاريخاً واحداً, وأول رمضان تقليد محبب, ويحسبون كل شيء في ذلك اليوم بقيم السوق.",
    },
  },
  {
    id: "home",
    color: "#B06A3B",
    icon: "home",
    title: { en: "Your home is not zakatable", ar: "بيتك ليس عليه زكاة" },
    body: {
      en: "No Zakat on your residence: even if you own more than one home for personal use. Investment property is different: if held to sell for profit, Zakat is due on its market value; if rented out, Zakat is due on the rental income after expenses.",
      ar: "لا زكاة على مسكنك: حتى لو ملكت أكثر من بيت للسكن. عقار الاستثمار مختلف: إن كان للبيع بربح فالزكاة على قيمته السوقية، وإن كان مؤجراً فالزكاة على دخل الإيجار بعد المصاريف.",
    },
  },
  {
    id: "jewelry",
    color: "#8E9AAB",
    icon: "diamond",
    title: { en: "Worn jewelry: an honest difference", ar: "الحلي الملبوس: خلاف معتبر" },
    body: {
      en: "Scholars genuinely differ on gold jewelry worn regularly: the Hanafi school includes it in Zakat; others exempt personal-use jewelry. Diamonds and gems are generally not zakatable unless held for trade. Follow your school or ask a scholar you trust.",
      ar: "اختلف العلماء في الحلي الملبوس: فالحنفية يوجبون زكاته، وغيرهم يعفي حلي الاستعمال الشخصي. الألماس والأحجار الكريمة لا زكاة فيها عموماً إلا إذا كانت للتجارة. اتبع مذهبك أو اسأل عالماً تثق به.",
    },
  },
  {
    id: "debts",
    color: "#9B6BAE",
    icon: "handshake",
    title: { en: "Loans you gave, debts you owe", ar: "قروض أقرضتها وديون عليك" },
    body: {
      en: "Money you lent and expect back counts as your wealth. If repayment is doubtful, leave it out, add it when it returns. Debts you owe that fall due within the year can be deducted, but only those tied to zakatable wealth; car and home loans don't reduce your Zakat.",
      ar: "المال الذي أقرضته وتتوقع رجوعه يُحسب من ثروتك. إن كان السداد مشكوكاً فيه فاتركه، وأضفه حين يعود. الديون التي عليك وتستحق خلال السنة تُخصم، لكن فقط المرتبطة بثروة زكوية؛ قروض السيارة والمنزل لا تُنقص زكاتك.",
    },
  },
  {
    id: "business",
    color: "#D97B4F",
    icon: "storefront",
    title: { en: "Business: stock-in-trade", ar: "التجارة: عروض التجارة" },
    body: {
      en: "Zakat applies to inventory (at cost), receivables, and business cash, minus what you owe suppliers. No Zakat on buildings, machinery, or equipment. Value dead or damaged stock at what it would actually sell for.",
      ar: "تجب الزكاة في المخزون (بالتكلفة) والذمم المدينة ونقد التجارة, مخصوماً منها ما تدين به للموردين. لا زكاة على المباني والآلات والمعدات. قوّم البضاعة الراكدة أو التالفة بقيمتها البيعية الفعلية.",
    },
  },
  {
    id: "agriculture",
    color: "#5F9E54",
    icon: "agriculture",
    title: { en: "Agriculture: at every harvest", ar: "الزراعة: عند كل حصاد" },
    body: {
      en: "Crops are zakated at harvest, no waiting a year: 10% if rain-fed, 5% if irrigated at your cost, 7.5% if both. Two harvests a year means Zakat twice.",
      ar: "زكاة الزرع عند الحصاد دون انتظار الحول: 10٪ فيما سُقي بالمطر، و5٪ فيما سُقي بكلفة، و7.5٪ فيما جمع بينهما. حصادان في السنة يعنيان زكاتين.",
    },
  },
  {
    id: "mistakes",
    color: "#EF4444",
    icon: "error-outline",
    title: { en: "Common mistakes", ar: "أخطاء شائعة" },
    body: {
      en: "Using purchase price instead of today's market value. Forgetting business receivables. Deducting your mortgage. Skipping crypto. Counting doubtful loans as wealth. Estimating gold weight, weigh it.",
      ar: "استخدام سعر الشراء بدل قيمة السوق اليوم. نسيان ذمم التجارة. خصم قرض المنزل. تجاهل العملات الرقمية. احتساب قروض مشكوك في سدادها. تقدير وزن الذهب جزافاً, قم بوزنه.",
    },
  },
  {
    id: "spirit",
    color: "#0F7B6C",
    icon: "volunteer-activism",
    title: { en: "The spirit of it", ar: "روح الزكاة" },
    body: {
      en: "\"The example of those who spend their wealth in the way of Allah is like a seed which grows seven spikes; in each spike is a hundred grains.\" (2:261). Zakat isn't a tax, it's how wealth grows in meaning.",
      ar: "«مَثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ فِي كُلِّ سُنبُلَةٍ مِّائَةُ حَبَّةٍ» (البقرة: 261). الزكاة ليست ضريبة, بل هي نماء المال معنىً وبركة.",
    },
  },
];

// Per-category fiqh notes shown inside category detail screens.
export const CATEGORY_NOTES: Record<string, { en: string; ar: string }> = {
  cash: {
    en: "Count all cash, savings, checking and deposits at today's balance. The simplest sound approach: pay on whatever remains on your Zakat day.",
    ar: "احسب كل النقد والتوفير والحسابات الجارية والودائع برصيد اليوم. أسلم نهج وأبسطه: زكِّ ما بقي معك في يوم زكاتك.",
  },
  gold: {
    en: "Value gold at today's market price, not what you paid. Karat matters: 18k gold is 75% gold. Worn jewelry is a genuine scholarly difference, include it to be safe, or follow your school.",
    ar: "قوّم الذهب بسعر السوق اليوم لا بسعر الشراء. العيار مهم: عيار 18 يعني 75٪ ذهباً. الحلي الملبوس فيه خلاف معتبر, أدخله احتياطاً أو اتبع مذهبك.",
  },
  silver: {
    en: "Silver in any form counts: jewelry, utensils, decorative pieces, at today's market rate.",
    ar: "الفضة بكل صورها تُحسب: حلياً وأوانيَ وقطعاً زخرفية: بسعر السوق اليوم.",
  },
  stocks: {
    en: "Long-term investors may pay on the zakatable assets of the company; the simple, safe route used here: market value of your holdings on your Zakat day.",
    ar: "للمستثمر طويل الأجل تفاصيل أدق، لكن الطريق الأسلم والأبسط المعتمد هنا: القيمة السوقية لأسهمك في يوم زكاتك.",
  },
  business: {
    en: "Inventory at cost + receivables + business cash − supplier payables. No Zakat on premises, machinery or equipment.",
    ar: "المخزون بالتكلفة + الذمم المدينة + نقد التجارة − مستحقات الموردين. لا زكاة على المباني والآلات والمعدات.",
  },
  realEstate: {
    en: "Property held to sell for profit: Zakat on market value. Rented property: Zakat on net rental income only. Your own home: no Zakat at all.",
    ar: "العقار المعدّ للبيع بربح: زكاة على قيمته السوقية. المؤجَّر: زكاة على صافي دخل الإيجار فقط. مسكنك: لا زكاة عليه إطلاقاً.",
  },
  debts: {
    en: "Include loans you genuinely expect to be repaid. Doubtful debts can wait, add them to your Zakat when the money actually returns.",
    ar: "أدخل القروض التي تتوقع سدادها فعلاً. الديون المشكوك فيها تُؤجّل, زكِّها حين يعود المال إليك.",
  },
  agriculture: {
    en: "Due at each harvest, no one-year wait. Rain-fed: 10%. Irrigated at your expense: 5%. Mixed: 7.5%.",
    ar: "تجب عند كل حصاد دون انتظار الحول. بماء المطر: 10٪. بالري بكلفة: 5٪. مختلط: 7.5٪.",
  },
  crypto: {
    en: "Treated like cash and investments: market value of your coins and tokens on your Zakat day, at 2.5%.",
    ar: "تُعامل معاملة النقد والاستثمار: القيمة السوقية لعملاتك وأصولك الرقمية في يوم زكاتك، بنسبة 2.5٪.",
  },
};

