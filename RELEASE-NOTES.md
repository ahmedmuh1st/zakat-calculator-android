# Release notes, Zakat Calculator

Single source of truth for store changelogs.

## Rules

1. Every version gets an entry here BEFORE the build is uploaded.
2. Each entry has an English block and an Arabic block, written for users (what changed
   and why it matters), not for engineers. No internal file names, no commit hashes, and
   never a generic "bug fixes and improvements".
3. Notes must describe **what is actually in that binary**. Accuracy beats cross-platform
   consistency: never promise a feature the reviewed build does not contain.
4. **Android and iOS run on independent version tracks.** They are on different numbers
   whenever one platform ships a round the other has not. Entries below are therefore
   filed per platform. When both platforms ship the same code, reuse the same wording.
5. Play: paste the block into "Release notes" for `en-US` and `ar` (500 character limit
   per language). App Store: paste into "What's New in This Version" per localization
   (4000 character limit).
6. Whoever owns a platform writes that platform's block here and mirrors this file to
   `/home/ubuntu/projects/zakat-calculator/RELEASE-NOTES.md` on the cloud computer.

## Platform state

| Platform | Version | Status | Contains |
|---|---|---|---|
| Android (Play) | 1.0.1 / versionCode 2 | Live since 31 Jul 2026 | Initial public release |
| Android (Play) | 1.0.2 / versionCode 3 | Live since 4 Aug 2026 | Summary + Arabic fixes, swipe rows, large-screen support |
| Android (Play) | 1.0.3 / versionCode 4 | SUPERSEDED, never submitted | Two-pane tablet/foldable layout, in-app rating path, R8 + module cleanup |
| Android (Play) | 1.0.5 / versionCode 10005 | Live on internal testing since 19 Aug 2026; not yet promoted to production | Everything held back since 1.0.2: the V2 features, seven languages, backup and restore, currency following the language, and the display fixes from the iOS round |
| Android (Play) | 1.0.6 / versionCode 10006 | Built 29 Aug 2026; superseded before upload | Payment tracking, truthful category breakdowns and resilient metal prices; built before the corrected launch screen |
| Android (Play) | 1.0.7 / versionCode 10007 | Code complete; not yet built | Everything in 1.0.6 plus the corrected full-green launch screen |
| iOS (App Store) | 1.0.1 | In Apple review since 2 Aug 2026 | Summary + Arabic fixes, swipe rows. iPhone only (`supportsTablet: false`) |
| iOS (App Store) | 1.0.2 | Planned | Large-screen support + iPad enablement, needs 13-inch iPad screenshots |

Note on iPad: iOS 1.0.1 ships with `ios.supportsTablet: false` deliberately. Apple rejected
the first submission because declaring iPad support requires the 13-inch iPad screenshot set.
iPad is a v1.0.2 item, not a v1.0.1 one.

---

## Android 1.0.7, versionCode 10007, code complete and not yet built

Android 1.0.6 was built from the checkpoint immediately before the launch-screen correction. It was
never uploaded to Play. The build platform then opened version 1.0.7 for the corrected source, so the
complete changelog below belongs to 1.0.7.

- **Track payment of each saved Zakat obligation.** Results and History show the amount due, paid,
  remaining and any extra given. Each payment keeps a name, amount, exact date and time. Payments
  can be added, edited or deleted without changing the saved calculation they belong to.
- **Adding the first payment from Results saves the calculation once.** The user names the
  calculation first, then records the payment. Cancelling either step changes nothing, and the
  flow cannot create duplicate saved calculations.
- **Payment records survive device migration and exports.** Manual JSON backup merges payment
  edits and deletions by payment id and last update time. Android Auto Backup carries the same
  local state. CSV export now includes Paid, Remaining and dated payment details.
- **Payment progress is visible on Home.** Home follows one exact saved obligation, shows Paid and
  Remaining at a glance, and opens that exact History record already expanded without changing
  the user's saved order.
- **Category breakdowns now tell the mathematical truth.** Every category shows the gross Zakat
  produced by its printed rate. Shared deductions appear once as a separate red adjustment, while
  the final obligation remains unchanged. Older saved calculations are reconstructed only for
  display and are never rewritten.
- **Metal-price refresh is resilient to brief provider failures.** Gold, silver and exchange-rate
  requests retry with a timeout rather than leaving the side panel blank after one failed request.
  The panel shows an actionable update label while live prices are unavailable.
- **Seven-language and responsive support.** The complete tracker and form are available in
  English, Arabic, Indonesian, Urdu, Bengali, Turkish and French, with native RTL order, readable
  long labels, phone layouts and centered foldable layouts.
- **The launch screen now matches the brand.** A full deep-green background carries only the gold
  wheat mark, replacing the old square artwork floating on white or black.

### English

Track every Zakat payment from Home, Results or History. Add, edit or delete dated payments and see
Paid, Remaining or Extra given. Category breakdowns now show the true Zakat at the stated rate,
with deductions as one clear adjustment and no change to the final total. Payments survive backup
and appear in CSV. Metal prices retry after brief provider failures.
The launch screen is now full green with the gold wheat mark centered.

### Arabic

تابع دفعات الزكاة من الرئيسية أو الملخص أو السجل. أضف دفعات مؤرخة وعدّلها أو احذفها، وشاهد
المدفوع والمتبقي أو زيادة العطاء. يعرض التفصيل الآن زكاة كل فئة حسب النسبة المكتوبة، وتظهر
الخصومات كتعديل واحد واضح دون تغيير المجموع النهائي. تُحفظ الدفعات في النسخ الاحتياطية وتظهر
في CSV. وتعيد أسعار المعادن المحاولة عند تعطل المصدر مؤقتًا.
وأصبحت شاشة البدء خضراء بالكامل مع سنبلة ذهبية في المنتصف.

### Play-trimmed 1.0.7 wording

**en-US**

Track every Zakat payment from Home, Results or History. Add, edit or delete dated payments and see
Paid, Remaining or Extra given. Category breakdowns now show true Zakat at the stated rate, with
deductions as one clear adjustment and no change to the final total. Payments survive backup and
appear in CSV. Metal prices retry after brief provider failures.
The launch screen is now full green with the gold wheat mark centered.

**ar**

تابع دفعات الزكاة من الرئيسية أو الملخص أو السجل. أضف دفعات مؤرخة وعدّلها أو احذفها، وشاهد
المدفوع والمتبقي أو زيادة العطاء. يعرض التفصيل زكاة كل فئة حسب النسبة المكتوبة، وتظهر الخصومات
كتعديل واحد واضح دون تغيير المجموع النهائي. تُحفظ الدفعات في النسخ الاحتياطية وتظهر في CSV.
وتعيد أسعار المعادن المحاولة عند تعطل المصدر مؤقتًا.
وأصبحت شاشة البدء خضراء بالكامل مع سنبلة ذهبية في المنتصف.

---

## Android 1.0.5, versionCode 10005, live on internal testing and not in production

**Numbered 1.0.5, not 1.0.4.** The build platform assigns the version itself and bumped it past
the 1.0.4 the source carried, so the source was moved to match the binary rather than the other
way round: Play records whatever the AAB declares, and a rebuild to reclaim a number nobody has
seen would buy nothing. 1.0.3 and 1.0.4 were both code-complete and never shipped, so the store
goes 1.0.2 to 1.0.5 with no gap a user can perceive.

Note also that versionCode is derived, not counted: the platform uses
major*10000 + minor*100 + patch, hence 10005 here and 10002 for the 1.0.2 live on Play. The old
hand-maintained sequence (3, 4, 5) never reached a binary.

**Do not ship the 1.0.3 AAB.** 1.0.3 was built but held, because Play rejects a new version
code while another is in review and 1.0.2 was still under review at the time. The V2 feature
work then landed on top, so 1.0.5 contains everything in 1.0.3 plus the items below, and the
store blocks in this section cover both sets of changes.

V2 items in this build, from Osama's TestFlight feedback and Ahmed's specs:

- **14k and 10k gold added**, alongside 24k/22k/21k/18k. Purity uses exact fractions
  (14/24, 10/24), not rounded percentages.
- **Karat discoverability fixed.** The math was always right; the problem was that a bare row
  of chips read as decoration, so a tester assumed karats were unsupported. The selector now
  has a heading, an explanation, and a live line naming the selected karat and its purity.
- **Stocks can be marked as already assessed for Zakat.** Saudi listed companies are assessed
  by ZATCA, so a shareholder should not pay again on the same wealth. Ticked holdings are
  excluded from the base entirely, defaulting to ticked for SAR and unticked otherwise, with
  the row showing the value struck through and an "excluded" badge so nothing looks lost.
- **Contextual questions inside each category screen**, drawn from the same curated FAQ the
  Learn tab uses, with a link into that topic. The answers already existed; nothing connected
  them to the screen where the question actually arises.
- **First launch opens Learn**, once, with a button onward to the calculator. Tab order is
  unchanged, so every later launch opens the calculator as before.
- **Arabic tab bar order fixed.** React Navigation follows the system writing direction rather
  than the app language, so an English phone locale with the app set to Arabic put the
  calculator tab on the far left. The iOS session found this first; Android had the same defect.
- **Saved calculations can be named and reused.** History records take a name, suggested from
  the Hijri date and editable, so the list reads as a set of yearly records rather than a
  column of totals. Every record then has a "use in calculator" action that loads its figures
  back in for the new year, asking first because it replaces what is currently entered. Today's
  gold and silver prices are applied, so the total is recomputed rather than replayed.
- **Riyal symbol no longer clipped in the large total.** The symbol is drawn slightly larger
  than surrounding digits so it stays legible at small sizes, but on the summary total the line
  box was fixed to the font size, cutting the symbol top and bottom. Most visible with enlarged
  system text.
- **Nisab test corrected for holdings a company already pays Zakat on.** Marking a stock holding
  as company-assessed removed it from the Nisab test as well as from the charge, so a portfolio
  of ⃁49,000 in Saudi equities plus ⃁1,000 cash reported "Below Nisab" and no Zakat due. Wealth
  the user owns was deciding the year did not qualify. Nisab is now measured against everything
  held, while the charge still applies only to what is not already assessed.
- **Every money figure now says what it is.** On the category screens a bare figure was the
  value of the holdings, and was read as the Zakat due. Both figures are now named, and the
  Zakat line comes from the calculation itself, so it respects Nisab and the crop rates instead
  of assuming 2.5%.
- **Nisab now defaults to the silver standard** for new installs. Silver is the lower of the two
  thresholds, so Zakat falls due sooner. Anyone who has already chosen a standard keeps it.
- **Backup and restore.** Two halves. Automatic: Android Auto Backup is enabled, so the app's
  data rides along in the user's own Google backup and returns when they set up a new phone,
  with no code and no servers of ours. Manual: Settings can write a portable JSON file and read
  one back. The file format is versioned and shared with the iOS app (`BACKUP-FORMAT.md`), so a
  user moving between Android and iPhone can carry their records across. A restore replaces the
  current amounts and merges saved results by id, so it never deletes history and importing the
  same file twice changes nothing.
- **Currency follows the language you choose.** Picking Indonesian, Bengali or Turkish sets the
  matching currency, Urdu asks whether you calculate in Pakistani or Indian rupees, and the
  languages that span many currencies open the list. Nothing is asked when the current currency
  already fits, so a Saudi on Riyal switching to Arabic is not interrupted. Previously the
  language changed and the currency silently stayed put, which left the totals in the wrong
  money.
- **The Nisab progress line no longer reports a multiple.** It read "10x+ of Nisab threshold",
  which was not understandable and said nothing about what is owed, since the rate is 2.5%
  whether wealth sits at 3x or 30x the threshold. Above the threshold it now says so plainly;
  below it the percentage is kept, where it answers a real question.
- **The total no longer overflows the ring.** Long amounts in currencies such as the Rupiah were
  drawn across the ring's edge. The figure is now sized to the space inside the circle.
- **The wide-screen side panel offers all seven languages.** It still listed only English and
  Arabic, months after the other five shipped, so a tablet or foldable user could not reach them
  without opening full Settings.

Not user-visible, so kept out of the store blocks: the in-app version label now reads from the
build config instead of a hardcoded string, which had already drifted once between the two
platform projects.

Privacy copy corrected in every language to match: it previously said nothing you enter ever
leaves the device, which stopped being true the moment Auto Backup was enabled. It now says the
figures are included in the user's own Google backup, that the copy is theirs, and that we run
no servers and receive nothing.

### English

The app now speaks Indonesian, Urdu, Bengali, Turkish and French, alongside Arabic and English.
Every screen, every explanation and all 33 questions in Learn are translated, and Urdu reads
right to left like Arabic.

Gold now covers 14k and 10k as well as 24k, 22k, 21k and 18k, and the purity selector explains
itself: pick a karat and the app shows how much pure gold that is.

If a company already pays Zakat on its own assets, as Saudi listed companies do, you can mark
the holding and it is left out of your total instead of being counted twice.

Each category screen now carries the questions people ask on that screen, answered in place.

Saved calculations can be named, and any of them can be loaded back into the calculator to
start this year from last year's figures, recalculated at today's gold and silver prices.

Also in this release:
- First launch opens a short read before the calculator, so the categories make sense.
- The Arabic tab bar starts from the right, whatever language your phone is set to.
- Tablets and unfolded foldables show a side panel with your running total, and currency,
  Nisab standard, language and metal prices can be changed without leaving the screen.
- The Riyal symbol is no longer clipped in the large total, including at large text sizes.
- You can rate the app from Settings.
- Holdings marked as already assessed for Zakat still count toward the Nisab threshold, so the
  year qualifies correctly even when most of your wealth is exempt from the charge.
- Every amount on screen is labelled, so the value of what you hold is never mistaken for the
  Zakat due on it.
- New installs start on the silver Nisab standard, the lower of the two. Your own choice, once
  made, is kept.
- Choosing a language now sets the currency to match where the language makes that clear, and
  asks when it does not.
- The Nisab line says plainly when your wealth is past the threshold, instead of reporting a
  multiple of it.
- Large totals stay inside the circle on the home screen.
- The side panel on tablets and foldables now lists all seven languages.

Your figures are now included in your phone's own Google backup, so a lost or replaced phone no
longer means starting over. You can also save a backup file yourself and restore from it later,
including on an iPhone.

Everything is still calculated on your device: no accounts, no ads, no tracking. The backup copy
sits in your Google account, not ours.

### العربية

التطبيق يتحدث الآن الإندونيسية والأردية والبنغالية والتركية والفرنسية، إضافة إلى العربية
والإنجليزية. كل الشاشات والشروح والأسئلة الثلاثة والثلاثين في قسم التعلّم مترجمة، والأردية
تُقرأ من اليمين إلى اليسار كالعربية.

الذهب يشمل الآن عيار 14 و10 إضافة إلى 24 و22 و21 و18، ومحدد العيار يشرح نفسه: اختر العيار
ويظهر لك مقدار الذهب الخالص فيه.

وإذا كانت الشركة تدفع الزكاة عن أصولها، كالشركات المدرجة في السوق السعودي، يمكنك تحديد
الاستثمار ليُستثنى من إجماليك بدل أن يُزكّى مرتين.

وكل شاشة صنف تعرض الآن الأسئلة التي تُطرح فيها فعلاً، بإجاباتها في مكانها.

ويمكنك تسمية الحسابات المحفوظة، وتحميل أي حساب سابق إلى الحاسبة لتبدأ سنتك من أرقام السنة
الماضية، مع إعادة الحساب بأسعار الذهب والفضة اليوم.

كذلك في هذا التحديث:
- أول تشغيل يبدأ بقراءة قصيرة قبل الحاسبة، لتكون الأصناف أوضح.
- شريط التبويب في العربية يبدأ من اليمين، أياً كانت لغة جهازك.
- الأجهزة اللوحية والهواتف المفتوحة تعرض لوحة جانبية فيها مجموعك، ويمكن تغيير العملة ومعيار
  النصاب واللغة وأسعار المعادن دون مغادرة الشاشة.
- رمز الريال لم يعد مقطوعاً في المجموع الكبير، وحتى مع تكبير حجم الخط.
- يمكنك تقييم التطبيق من الإعدادات.
- الاستثمارات المحددة بأن الشركة تزكّي عنها تُحتسب في النصاب، فيصح بلوغ الحول وإن كان أكثر مالك
  مستثنى من الزكاة نفسها.
- كل مبلغ على الشاشة صار مسمّى، فلا تُقرأ قيمة ما تملكه على أنها الزكاة المستحقة عليه.
- التطبيق الجديد يبدأ بمعيار الفضة، وهو الأدنى بين المعيارين. ومن اختار معياره يبقى على اختياره.
- اختيار اللغة يضبط العملة معها حين تكون اللغة دالّة على عملة واحدة، ويسألك حين لا تكون كذلك.
- سطر النصاب يقول بوضوح إن ثروتك تجاوزت الحد، بدل أن يذكر مضاعفاً للنصاب.
- المجاميع الكبيرة تبقى داخل الدائرة في الشاشة الرئيسية.
- اللوحة الجانبية في الأجهزة اللوحية والهواتف المفتوحة تعرض اللغات السبع كلها.

وأرقامك صارت تُدرج ضمن النسخ الاحتياطي لهاتفك في حساب جوجل الخاص بك، فلا يعني ضياع الهاتف أو
تغييره البدء من الصفر. ويمكنك أيضاً حفظ ملف نسخة احتياطية بنفسك واستعادته لاحقاً، حتى على آيفون.

وكل الحسابات ما زالت تتم على جهازك: بلا حسابات ولا إعلانات ولا تتبّع. والنسخة الاحتياطية في
حسابك أنت على جوجل، لا لدينا.

### Play-trimmed 1.0.5 wording (fits the 500-character limit)

The long-form blocks above are well over Play's cap. Paste these instead. The correctness fix
leads, because it changes a number a user may have already acted on. The rest is compressed.

Measured with `python3 store-kit/check_note_lengths.py 1.0.5`. Re-run it after any edit rather
than counting by eye, since Play rejects an over-length note without saying which locale broke.

**en-US**

Now in Indonesian, Urdu, Bengali, Turkish and French, fully translated.

Your figures are now kept in your phone's own Google backup, and you can save or restore a
backup file yourself, including on iPhone.

Fixed: marking a stock as company-assessed also dropped it from the Nisab test, so a large
portfolio could wrongly show no Zakat due. Nisab now counts everything you hold, and every
amount is labelled.

Also: name and reuse saved calculations, 14k and 10k gold, silver Nisab by default.

**ar**

التطبيق متوفر الآن بالإندونيسية والأردية والبنغالية والتركية والفرنسية، مترجماً بالكامل.

وأرقامك تُحفظ الآن ضمن النسخ الاحتياطي لهاتفك على جوجل، ويمكنك حفظ ملف نسخة واستعادته بنفسك،
حتى على آيفون.

وأُصلح خلل: تحديد السهم بأن الشركة تزكّي عنه كان يخرجه من حساب النصاب أيضاً، فقد تظهر محفظة
كبيرة بلا زكاة مستحقة. والنصاب الآن يُحتسب على كل ما تملك، وكل مبلغ صار مسمّى.

كذلك: تسمية الحسابات المحفوظة وإعادة استخدامها، وعيار 14 و10 للذهب، ومعيار الفضة افتراضياً.

---

## Android 1.0.3 notes (superseded, kept for the record)


Builds on the 1.0.2 large-screen work. Where 1.0.2 stopped content from stretching, 1.0.3
puts the freed space to use: at 840dp and above (unfolded foldable in landscape, tablets)
a persistent side pane carries the running total and the settings people change mid
calculation. Mirrored for Arabic, so the pane sits on the left in RTL.

Also adds the first feedback path: the OS rating card after a second saved calculation,
and a "Rate this app" row in Settings. No analytics were added; the rating card is the
system one and the contact row still just opens the user's own mail app.

Three Play Console warnings were also cleared, none of them user-visible, so they stay out of
the store blocks below:

- **R8 minification enabled** (`enableMinifyInReleaseBuilds` plus `enableShrinkResourcesInReleaseBuilds`),
  so the build emits `mapping.txt` and crash stack traces become readable in Play. Library keep
  rules were added for React Native, Hermes, Reanimated, Gesture Handler, SVG and Expo modules.
- **`expo-audio` and `expo-video` removed.** Neither was imported anywhere in the app.
  `expo-audio` was the source of Play's restricted foreground-service warning, since it
  registered `AudioControlsService` / `AudioRecordingService` via `BOOT_COMPLETED`, which
  crashes on Android 15+.
- **Edge-to-edge confirmed on the modern path** (`edgeToEdgeEnabled: true`, and
  `react-native-is-edge-to-edge` in the dependency tree), so the deprecation warning came from
  the older build configuration rather than app code. Re-verify on upload.

Because R8 is enabled here for the first time, the release build needs a real-device smoke test
before rollout: minification can break reflection-dependent native code in ways that typecheck
and the Metro bundle cannot catch.

### English

Tablets and unfolded foldables now show a side panel with your running Zakat total, so the
figure stays visible while you enter amounts. Currency, Nisab standard, language and metal
prices can be changed right there without leaving the screen. In Arabic the panel sits on
the left, mirroring the rest of the layout.

Also in this release:
- The summary shows your figures and the per-category breakdown side by side on wide screens.
- Very large holdings no longer report an unhelpful Nisab percentage.
- You can now rate the app from Settings.

Phone layouts are unchanged. Everything still runs on your device, with no accounts, ads or
tracking.

### العربية

الأجهزة اللوحية والهواتف المفتوحة القابلة للطي تعرض الآن لوحة جانبية فيها مجموع زكاتك، فيبقى
الرقم أمامك أثناء إدخال المبالغ. ويمكن تغيير العملة ومعيار النصاب واللغة وأسعار المعادن من
نفس اللوحة دون مغادرة الشاشة. وفي العربية تظهر اللوحة على اليسار، بما يوافق بقية التخطيط.

كذلك في هذا التحديث:
- الملخص يعرض أرقامك والتفصيل لكل صنف جنباً إلى جنب على الشاشات العريضة.
- الأموال الكبيرة لم تعد تُظهر نسبة نصاب غير مفيدة.
- يمكنك الآن تقييم التطبيق من الإعدادات.

لا تغيير على تخطيط الهواتف العادية. وكل شيء ما زال يعمل على جهازك، بلا حسابات ولا إعلانات
ولا تتبّع.

## Android 1.0.3, versionCode 4, superseded and never submitted

Kept for the record. Its contents ship inside 1.0.5 above.

## Android 1.0.2, versionCode 3, built 2 Aug 2026

Submitted to Google Play on 3 Aug 2026. Play version code 10002, release name
"1.0.2 - Large screen support", full rollout 100%, all 177 countries. Download size 20.3 MB
(591 KB smaller than 1.0.1). Device support unchanged: 12,296 phones, 6,609 tablets.

The blocks below are the long-form record. Play enforces a hard 500-character limit per
language, so the pasted version trims "currency shown on gold and silver prices" to
"currency with metal prices" and drops "left or right" from the swipe line. Wording is
otherwise identical.

### English

Large-screen support. The app now adapts to foldable phones and tablets: content stays in
a comfortable reading column instead of stretching across the screen, and the category grid
uses the extra space. Phone layouts are unchanged.

Also in this release:
- The summary now shows the Zakat due per category, with wealth Zakat and crop Zakat
  listed separately.
- Nisab details moved into an info note so the totals are easier to read.
- Arabic fixes: correct Hijri date wording, Arabic numerals in the countdown, and the
  currency shown on gold and silver prices.
- Swipe a saved item left or right to edit or delete it.

### العربية

دعم الشاشات الكبيرة. أصبح التطبيق يتكيّف مع الهواتف القابلة للطي والأجهزة اللوحية: يبقى
المحتوى في عمود مريح للقراءة بدلاً من التمدد على كامل الشاشة، وتستفيد شبكة الأصناف من
المساحة الإضافية. لا تغيير على تخطيط الهواتف العادية.

كذلك في هذا التحديث:
- الملخص يعرض الزكاة المستحقة لكل صنف، مع فصل زكاة المال عن زكاة الزروع.
- نُقلت تفاصيل النصاب إلى ملاحظة توضيحية ليصبح المجموع أوضح.
- إصلاحات عربية: صياغة التاريخ الهجري، الأرقام العربية في العدّاد، وإظهار العملة مع أسعار
  الذهب والفضة.
- اسحب أي عنصر محفوظ يميناً أو يساراً للتعديل أو الحذف.

---

## iOS 1.0.1, in Apple review, submitted 2 Aug 2026

First App Store release. iPhone only. Owned by the iOS session: it writes and pastes the
final wording. Placeholder below reflects what that binary contains, minus the large-screen
work, which was written after the build was compiled and ships in iOS 1.0.2.

_iOS session: replace this section with your final EN + AR text._

---

## Android 1.0.1, versionCode 2, live 31 Jul 2026

First public release on Google Play.

### English

Calculate your Zakat privately on your device. Nine wealth categories, live gold and silver
Nisab, Hijri Zakat anniversary reminders, multi-currency entries, year-over-year history,
and a bilingual Arabic/English interface. No account, no ads, no data collected.

### العربية

احسب زكاتك بخصوصية كاملة على جهازك. تسعة أصناف للمال، نصاب الذهب والفضة بأسعار حيّة،
حَول زكوي بالتاريخ الهجري، إدخال بعملات متعددة، سجل سنوي للمقارنة، وواجهة عربية/إنجليزية.
بلا حساب، بلا إعلانات، ولا نجمع أي بيانات.
