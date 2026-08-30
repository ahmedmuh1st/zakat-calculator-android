// Settings — language, currency, nisab standard, metal prices, anniversary, appearance, about/privacy.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ExpoClipboard from "expo-clipboard";
import Constants from "expo-constants";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Modal, Platform, ScrollView, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { CurrencyPicker } from "@/components/zakat/currency-picker";
import { MoneyInput } from "@/components/zakat/money-input";
import { PressableScale } from "@/components/zakat/pressable-scale";
import { useColors } from "@/hooks/use-colors";
import { useLayout } from "@/hooks/use-layout";
import { useConfirm } from "@/components/zakat/confirm-sheet";
import { useThemeContext } from "@/lib/theme-provider";
import type { ThemePreference } from "@/lib/theme-provider";
import { clearFeedbackState, openStoreListing } from "@/lib/feedback";
import { useStore } from "@/lib/store";
import { LOCALES, dateTag } from "@/lib/i18n/locales";
import { fetchLivePrices } from "@/lib/zakat/prices";
import { exportBackup, parseBackup, pickBackupFile, type BackupError } from "@/lib/zakat/backup";
import { useLanguageChange } from "@/lib/zakat/use-language-change";
import { hijriMonthName } from "@/lib/zakat/hijri";
import { localizeDigits, parseAmount } from "@/lib/zakat/numbers";

export default function Settings() {
  const { settings, prices, entries, deductions, history, t, isRTL, dispatch } = useStore();
  const colors = useColors();
  const confirm = useConfirm();
  const { listContentStyle } = useLayout();
  const { themePreference, setThemePreference } = useThemeContext();
  const params = useLocalSearchParams<{ scrollTo?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const anniversaryY = useRef(0);
  const [fetching, setFetching] = useState(false);
  const [goldInput, setGoldInput] = useState("");
  const [silverInput, setSilverInput] = useState("");
  // Changing the language may change what currency makes sense: Ahmed switched to Urdu and
  // the total stayed in Riyal, which is a wrong number rather than a cosmetic problem. The
  // rule is shared with the wide-screen pane and lives in lib/zakat/language-currency.ts.
  const { changeLanguage, currencyListOpen, clearCurrencyListSignal } = useLanguageChange();

  const lang = settings.language;
  const rowDir = isRTL ? "flex-row-reverse" : "flex-row";
  const textAlign = isRTL ? ("right" as const) : ("left" as const);

  // Precise scroll to the Zakat day section when opened via "Set your Zakat day"
  useEffect(() => {
    if (params.scrollTo === "anniversary") {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: Math.max(0, anniversaryY.current - 12), animated: true });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [params.scrollTo]);

  const fetchPrices = async () => {
    setFetching(true);
    try {
      const p = await fetchLivePrices(settings.currency);
      dispatch({ type: "setPrices", payload: p });
      setGoldInput(String(p.goldPerGram));
      setSilverInput(String(p.silverPerGram));
    } catch {
      await confirm({ title: t.pricesNone, message: "", confirmLabel: t.done, cancelLabel: t.cancel, destructive: false });
    } finally {
      setFetching(false);
    }
  };

  const saveManualPrices = () => {
    const g = parseAmount(goldInput);
    const s = parseAmount(silverInput);
    if (!(g > 0) && !(s > 0)) return;
    dispatch({
      type: "setPrices",
      payload: {
        goldPerGram: g > 0 ? g : prices.goldPerGram,
        silverPerGram: s > 0 ? s : prices.silverPerGram,
        updatedAt: new Date().toISOString(),
        source: "manual",
      },
    });
  };

  const anniversary = settings.anniversary;

  // Contact flow:
  // - Standalone store builds (APK / App Store): open the mail app directly via mailto.
  // - Expo Go / web: mailto crashes Expo Go on iOS, so use the fully in-app
  //   fallback (copy address + in-app sheet). Constants.appOwnership === "expo"
  //   identifies Expo Go; standalone builds report null/"standalone".
  const isExpoGo = Constants.appOwnership === "expo";
  // Read the version from the build rather than hardcoding it. A literal string here
  // silently drifted when shared code moved between the Android and iOS projects,
  // which run on independent version tracks.
  const appVersion = Constants.expoConfig?.version ?? "";
  const contactSupport = async () => {
    if (!isExpoGo && Platform.OS !== "web") {
      try {
        const url = `mailto:${t.contactEmail}`;
        const can = await Linking.canOpenURL(url);
        if (can) {
          await Linking.openURL(url);
          return;
        }
      } catch {
        // fall through to the in-app fallback
      }
    }
    try {
      await ExpoClipboard.setStringAsync(t.contactEmail);
    } catch {
      // clipboard unavailable — the sheet still shows the address
    }
    await confirm({
      title: t.suggestionsHelp,
      message: t.emailCopied,
      confirmLabel: t.done,
      cancelLabel: t.cancel,
      destructive: false,
    });
  };

  const resetApp = async () => {
    const ok = await confirm({ title: t.resetApp, message: t.resetAppConfirm, confirmLabel: t.resetApp, cancelLabel: t.cancel });
    if (!ok) return;
    dispatch({ type: "resetAll" });
    // The rating counters live outside the store, so clear them too or a reset
    // device would still be treated as a long-time user.
    clearFeedbackState().catch(() => {});
    // Give the state reset + persist a beat, then hard-replace the whole stack.
    // requestAnimationFrame alone is unreliable inside native Alert callbacks,
    // so use a slightly longer timeout and dismiss any stacked screens first.
    setTimeout(() => {
      try {
        if (router.canDismiss()) router.dismissAll();
      } catch {
        // no stacked screens to dismiss
      }
      router.replace("/onboarding");
    }, 150);
  };

  // Opens the public store listing. If there is no listing yet (dev build, web)
  // fall back to the contact sheet so the row is never a dead end.
  const rateApp = async () => {
    const opened = await openStoreListing();
    if (!opened) await contactSupport();
  };

  // Backup: writing a copy out, and reading one back in.
  //
  // The automatic half needs no code here. Android Auto Backup carries the app's stored
  // state into the user's own Google account and restores it on a new device; it is enabled
  // in app.config.ts and controlled by the user in Android's own Settings. These two rows
  // cover the cases Auto Backup does not: moving to iPhone, keeping a copy before a reset,
  // or restoring on a device that is already set up.
  const saveBackupCopy = async () => {
    try {
      await exportBackup({ settings, entries, deductions, prices, history }, appVersion);
    } catch {
      await notify(t.backup, t.backupErrorFailed);
    }
  };

  const restoreBackup = async () => {
    let raw: string | null;
    try {
      raw = await pickBackupFile();
    } catch {
      await notify(t.backup, t.backupErrorFailed);
      return;
    }
    if (raw === null) return; // user cancelled the picker

    const result = parseBackup(raw);
    if (!result.ok) {
      await notify(t.backup, backupErrorMessage(result.error));
      return;
    }

    const exportedAt = new Date(result.envelope.exportedAt);
    const when = isNaN(exportedAt.getTime())
      ? "?"
      : exportedAt.toLocaleDateString(dateTag(lang), { year: "numeric", month: "short", day: "numeric" });
    const entryCount = result.envelope.data.entries.reduce((n, e) => n + e.items.length, 0);

    const ok = await confirm({
      title: t.backupRestoreTitle,
      message: t.backupRestoreBody(
        localizeDigits(entryCount, lang),
        localizeDigits(result.summary.history, lang),
        when,
      ),
      confirmLabel: t.backupRestoreConfirm,
      cancelLabel: t.cancel,
    });
    if (!ok) return;

    // Count what the merge will add before dispatching, so the confirmation reports the
    // real number rather than the file's total.
    const known = new Set(history.map((h) => h.id));
    const added = result.envelope.data.history.filter((h) => h && !known.has(h.id)).length;
    dispatch({ type: "importBackup", payload: result.envelope });
    await notify(t.backup, t.backupRestoreDone(localizeDigits(added, lang)));
  };

  const backupErrorMessage = (code: BackupError): string => {
    switch (code) {
      case "not-json":
        return t.backupErrorNotJson;
      case "not-our-file":
        return t.backupErrorNotOurs;
      case "too-new":
        return t.backupErrorTooNew;
      case "no-data":
      case "bad-shape":
        return t.backupErrorBadShape;
      default:
        return t.backupErrorFailed;
    }
  };

  /** One-button message. The confirm sheet is reused so backup never falls back to a
      native Alert, which this app avoids everywhere else. */
  const notify = (title: string, message: string) =>
    confirm({ title, message, confirmLabel: t.done, cancelLabel: t.cancel, destructive: false });

  return (
    <ScreenContainer>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[{ paddingBottom: 32 }, listContentStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-2 pb-3">
          <Text className="text-2xl font-bold text-foreground" style={{ textAlign }}>
            {t.settings}
          </Text>
        </View>

        {/* Language */}
        <Section title={t.language} textAlign={textAlign}>
          {/* Seven locales no longer fit a row of buttons, so this is a list. Each row shows the
              language in its own script (endonym) because someone looking for Bengali is
              scanning for বাংলা, not for the word "Bengali". */}
          <View className="gap-2">
            {LOCALES.map((meta) => {
              const selected = lang === meta.code;
              return (
                <PressableScale
                  key={meta.code}
                  onPress={() => changeLanguage(meta.code)}
                >
                  <View
                    className={`${rowDir} items-center justify-between rounded-xl px-4 py-3 border`}
                    style={{
                      backgroundColor: selected ? colors.primary : "transparent",
                      borderColor: selected ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      className="text-base font-bold"
                      style={{
                        color: selected ? "#FFFFFF" : colors.foreground,
                        writingDirection: meta.direction,
                      }}
                    >
                      {meta.endonym}
                    </Text>
                    {selected ? (
                      <MaterialIcons name="check" size={18} color="#FFFFFF" />
                    ) : (
                      <Text className="text-xs" style={{ color: colors.muted }}>
                        {meta.englishName}
                      </Text>
                    )}
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </Section>

        {/* Currency */}
        <Section title={t.currency} textAlign={textAlign}>
          <CurrencyPicker
            label={t.currency}
            value={settings.currency}
            isRTL={isRTL}
            lang={lang}
            searchPlaceholder={t.searchCurrency}
            onSelect={(c) => dispatch({ type: "setSettings", payload: { currency: c } })}
            pinned={["SAR", "USD", "EUR", "AED", "KWD", "QAR", "BHD", "OMR", "EGP"]}
            openSignal={currencyListOpen}
            onOpenSignalHandled={clearCurrencyListSignal}
          />
        </Section>

        {/* Nisab standard */}
        <Section title={t.nisabStandard} textAlign={textAlign}>
          <View className={`${rowDir} gap-2`}>
            {(["gold", "silver"] as const).map((std) => (
              <PressableScale
                key={std}
                onPress={() => dispatch({ type: "setSettings", payload: { nisabStandard: std } })}
                style={{ flex: 1 }}
              >
                <View
                  className="rounded-xl py-3 items-center border"
                  style={{
                    backgroundColor: settings.nisabStandard === std ? (std === "gold" ? "#C9A24B" : "#8E9AAB") : "transparent",
                    borderColor: settings.nisabStandard === std ? (std === "gold" ? "#C9A24B" : "#8E9AAB") : colors.border,
                  }}
                >
                  <Text
                    className="text-sm font-bold"
                    style={{ color: settings.nisabStandard === std ? "#FFFFFF" : colors.muted }}
                  >
                    {std === "gold" ? t.nisab_gold : t.nisab_silver}
                  </Text>
                </View>
              </PressableScale>
            ))}
          </View>
          <Text className="text-xs text-muted leading-5 mt-3" style={{ textAlign }}>
            {t.nisabExplainer}
          </Text>
        </Section>

        {/* Metal prices */}
        <Section title={t.metalPrices} textAlign={textAlign}>
          <PressableScale onPress={fetchPrices} haptic>
            <View className={`${rowDir} items-center justify-center gap-2 rounded-xl py-3 bg-primary`}>
              {fetching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="refresh" size={16} color="#FFFFFF" />
              )}
              <Text className="text-sm font-bold text-white">{fetching ? t.fetching : t.fetchLive}</Text>
            </View>
          </PressableScale>
          <View className={`${rowDir} gap-2 mt-3`}>
            <View className="flex-1">
              <Text className="text-[11px] text-muted mb-1" style={{ textAlign }}>
                {t.goldPerGram} ({settings.currency})
              </Text>
              <MoneyInput
                value={goldInput}
                onChangeValue={setGoldInput}
                locale={lang}
                isRTL={isRTL}
                placeholder={prices.goldPerGram > 0 ? String(prices.goldPerGram) : "—"}
                onBlur={saveManualPrices}
                onSubmitEditing={saveManualPrices}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] text-muted mb-1" style={{ textAlign }}>
                {t.silverPerGram} ({settings.currency})
              </Text>
              <MoneyInput
                value={silverInput}
                onChangeValue={setSilverInput}
                locale={lang}
                isRTL={isRTL}
                placeholder={prices.silverPerGram > 0 ? String(prices.silverPerGram) : "—"}
                onBlur={saveManualPrices}
                onSubmitEditing={saveManualPrices}
              />
            </View>
          </View>
          {prices.updatedAt && (
            <Text className="text-[11px] text-muted mt-2" style={{ textAlign }}>
              {prices.source === "live" ? t.pricesUpdated : t.pricesManual} ·{" "}
              {new Date(prices.updatedAt).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}
            </Text>
          )}
        </Section>

        {/* Zakat anniversary */}
        <View onLayout={(e) => { anniversaryY.current = e.nativeEvent.layout.y; }}>
        <Section title={t.zakatAnniversary} textAlign={textAlign}>
          <Text className="text-xs text-muted mb-2" style={{ textAlign }}>
            {t.anniversaryHint}
          </Text>
          <View className={`${rowDir} gap-2`}>
            {/* Month */}
            <View className="flex-1">
              <DropdownPicker
                label={t.month}
                value={anniversary ? hijriMonthName(anniversary.month, lang) : hijriMonthName(9, lang)}
                options={t.hijriMonths.map((m, i) => ({ label: m, value: i + 1 }))}
                selectedValue={anniversary?.month ?? 9}
                isRTL={isRTL}
                onSelect={(month) =>
                  dispatch({
                    type: "setSettings",
                    payload: { anniversary: { month, day: anniversary?.day ?? 1 } },
                  })
                }
              />
            </View>
            {/* Day */}
            <View className="flex-1">
              <DropdownPicker
                label={t.day}
                value={anniversary ? String(anniversary.day) : "1"}
                options={Array.from({ length: 30 }, (_, i) => ({ label: String(i + 1), value: i + 1 }))}
                selectedValue={anniversary?.day ?? 1}
                isRTL={isRTL}
                onSelect={(day) =>
                  dispatch({
                    type: "setSettings",
                    payload: { anniversary: { month: anniversary?.month ?? 9, day } },
                  })
                }
              />
            </View>
          </View>
        </Section>
        </View>

        {/* Appearance */}
        <Section title={t.appearance} textAlign={textAlign}>
          <View className={`${rowDir} gap-2`}>
            {(["system", "light", "dark"] as ThemePreference[]).map((pref) => (
              <PressableScale
                key={pref}
                onPress={() => setThemePreference(pref)}
                haptic
                style={{ flex: 1 }}
              >
                <View
                  className="rounded-xl py-3 items-center border"
                  style={{
                    backgroundColor: themePreference === pref ? colors.primary : "transparent",
                    borderColor: themePreference === pref ? colors.primary : colors.border,
                  }}
                >
                  <MaterialIcons
                    name={pref === "system" ? "brightness-auto" : pref === "light" ? "light-mode" : "dark-mode"}
                    size={16}
                    color={themePreference === pref ? "#FFFFFF" : colors.muted}
                  />
                  <Text
                    className="text-xs font-bold mt-1"
                    style={{ color: themePreference === pref ? "#FFFFFF" : colors.muted }}
                  >
                    {t[`theme_${pref}` as keyof typeof t] as string}
                  </Text>
                </View>
              </PressableScale>
            ))}
          </View>
        </Section>

        {/* Start fresh */}
        <Section title={t.clearAll} textAlign={textAlign}>
          <PressableScale
            onPress={async () => {
              const ok = await confirm({ title: t.clearAll, message: t.clearAllConfirm, confirmLabel: t.startNewCalc, cancelLabel: t.cancel });
              if (ok) dispatch({ type: "clearCalculation" });
            }}
          >
            <View className={`${rowDir} items-center justify-center gap-2 rounded-xl py-3 border`} style={{ borderColor: colors.error }}>
              <MaterialIcons name="restart-alt" size={16} color={colors.error} />
              <Text className="text-sm font-bold" style={{ color: colors.error }}>
                {t.startNewCalc}
              </Text>
            </View>
          </PressableScale>
          <PressableScale onPress={resetApp} style={{ marginTop: 8 }}>
            <View className={`${rowDir} items-center justify-center gap-2 rounded-xl py-3`} style={{ backgroundColor: colors.error }}>
              <MaterialIcons name="delete-forever" size={16} color="#FFFFFF" />
              <Text className="text-sm font-bold text-white">{t.resetApp}</Text>
            </View>
          </PressableScale>
        </Section>

        {/* Saved results */}
        <Section title={t.savedResults} textAlign={textAlign}>
          <PressableScale onPress={() => router.push("/history")}>
            <View className={`${rowDir} items-center gap-3`}>
              <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + "14" }}>
                <MaterialIcons name="bookmark-outline" size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground" style={{ textAlign }}>
                  {t.savedResults}
                </Text>
                <Text className="text-xs text-muted mt-0.5" style={{ textAlign }}>
                  {t.savedResultsHint}
                </Text>
              </View>
              <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={colors.muted} />
            </View>
          </PressableScale>
        </Section>

        {/* Backup */}
        <Section title={t.backup} textAlign={textAlign}>
          {/* Automatic backup is stated rather than toggled: Android owns the switch, and a
              second one in here would either lie or fight the system setting. */}
          <View className={`${rowDir} items-start gap-3`}>
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.success + "18" }}>
              <MaterialIcons name="cloud-done" size={20} color={colors.success} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground" style={{ textAlign }}>
                {t.backupAuto}
              </Text>
              <Text className="text-xs text-muted mt-0.5 leading-4" style={{ textAlign }}>
                {t.backupAutoOn}
              </Text>
              <Text className="text-[11px] text-muted mt-1 leading-4 opacity-80" style={{ textAlign }}>
                {t.backupAutoHint}
              </Text>
            </View>
          </View>

          <View className="h-px bg-border my-3.5" />

          <PressableScale onPress={saveBackupCopy}>
            <View className={`${rowDir} items-center gap-3`}>
              <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + "14" }}>
                <MaterialIcons name="save-alt" size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground" style={{ textAlign }}>
                  {t.backupSaveCopy}
                </Text>
                <Text className="text-xs text-muted mt-0.5" style={{ textAlign }}>
                  {t.backupSaveCopyHint}
                </Text>
              </View>
              <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={colors.muted} />
            </View>
          </PressableScale>

          <View className="h-px bg-border my-3.5" />

          <PressableScale onPress={restoreBackup}>
            <View className={`${rowDir} items-center gap-3`}>
              <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + "14" }}>
                <MaterialIcons name="settings-backup-restore" size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground" style={{ textAlign }}>
                  {t.backupRestore}
                </Text>
                <Text className="text-xs text-muted mt-0.5" style={{ textAlign }}>
                  {t.backupRestoreHint}
                </Text>
              </View>
              <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={colors.muted} />
            </View>
          </PressableScale>
        </Section>

        {/* About + privacy */}
        <Section title={t.about} textAlign={textAlign}>
          <Text className="text-[13px] leading-5 text-foreground" style={{ textAlign }}>
            {t.aboutBody}
          </Text>
          <View className={`${rowDir} items-center gap-1.5 mt-4 mb-1`}>
            <MaterialIcons name="lock" size={14} color={colors.primary} />
            <Text className="text-xs font-bold" style={{ color: colors.primary }}>
              {t.privacy}
            </Text>
          </View>
          <Text className="text-[13px] leading-5 text-muted" style={{ textAlign }}>
            {t.privacyBody}
          </Text>
        </Section>

        {/* Contact & support */}
        <Section title={t.contact} textAlign={textAlign}>
          {/* Rating first: it is the cheapest way for a user to help, and the
              app asks nothing else of them. This opens the store listing rather
              than invoking the native card, which store rules reserve for
              non-button moments. */}
          <PressableScale onPress={rateApp} style={{ marginBottom: 8 }}>
            <View className={`${rowDir} items-center gap-3 bg-background border border-border rounded-xl px-4 py-3.5`}>
              <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: "#C9A24B22" }}
              >
                <MaterialIcons name="star-outline" size={20} color="#C9A24B" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground" style={{ textAlign }}>
                  {t.rateApp}
                </Text>
                <Text className="text-xs text-muted mt-0.5" style={{ textAlign }}>
                  {t.rateAppSub}
                </Text>
              </View>
              <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={colors.muted} />
            </View>
          </PressableScale>
          <PressableScale
            onPress={contactSupport}
          >
            <View className={`${rowDir} items-center gap-3 bg-background border border-border rounded-xl px-4 py-3.5`}>
              <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + "14" }}>
                <MaterialIcons name="mail-outline" size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground" style={{ textAlign }}>
                  {t.suggestionsHelp}
                </Text>
                <Text className="text-xs text-muted mt-0.5" style={{ textAlign }}>
                  {t.suggestionsHelpSub}
                </Text>
              </View>
              <MaterialIcons name={isRTL ? "chevron-left" : "chevron-right"} size={20} color={colors.muted} />
            </View>
          </PressableScale>
          <Text className="text-xs leading-5 text-muted mt-3" style={{ textAlign }}>
            {t.oneManShow}
          </Text>
        </Section>

        {/* Legal (App Store requirements) */}
        <Section title={t.legal} textAlign={textAlign}>
          <Text className="text-xs font-bold mb-1" style={{ textAlign, color: colors.primary }}>
            {t.privacyPolicy}
          </Text>
          <Text className="text-[13px] leading-5 text-muted" style={{ textAlign }}>
            {t.privacyPolicyBody}
          </Text>
          <Text className="text-xs font-bold mt-4 mb-1" style={{ textAlign, color: colors.primary }}>
            {t.terms}
          </Text>
          <Text className="text-[13px] leading-5 text-muted" style={{ textAlign }}>
            {t.termsBody}
          </Text>
          <Text className="text-[13px] leading-5 text-muted mt-3 italic" style={{ textAlign }}>
            {t.disclaimerNote}
          </Text>
          <View className={`${rowDir} items-center justify-between mt-4 pt-3 border-t border-border`}>
            <Text className="text-xs text-muted">{t.appVersion}</Text>
            <Text className="text-xs font-bold text-muted">{appVersion}</Text>
          </View>
        </Section>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({
  title,
  children,
  textAlign,
}: {
  title: string;
  children: React.ReactNode;
  textAlign: "left" | "right";
}) {
  return (
    <View className="mx-5 mb-4 bg-surface border border-border rounded-2xl p-4">
      <Text className="text-sm font-bold text-foreground mb-3" style={{ textAlign }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function DropdownPicker<T extends string | number>({
  label,
  value,
  options,
  selectedValue,
  onSelect,
  isRTL,
}: {
  label: string;
  value: string;
  options: { label: string; value: T }[];
  selectedValue: T;
  onSelect: (v: T) => void;
  isRTL?: boolean;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  return (
    <>
      <PressableScale onPress={() => setOpen(true)}>
        <View className="rounded-xl border border-border px-3 py-2.5" style={{ minHeight: 56, justifyContent: "center" }}>
          <Text className="text-[11px] text-muted" style={{ textAlign: "center" }}>
            {label}
          </Text>
          <View className="flex-row items-center justify-center gap-1 mt-0.5">
            <Text className="text-[13px] font-bold text-foreground" numberOfLines={1}>
              {value}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={18} color={colors.muted} />
          </View>
        </View>
      </PressableScale>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <PressableScale onPress={() => setOpen(false)} style={{ flex: 1 }}>
          <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
            <View className="bg-surface rounded-2xl w-full max-w-sm border border-border" style={{ maxHeight: 420 }}>
              <Text className="text-sm font-bold text-foreground text-center py-3 border-b border-border">{label}</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {options.map((opt) => (
                  <PressableScale
                    key={String(opt.value)}
                    onPress={() => {
                      onSelect(opt.value);
                      setOpen(false);
                    }}
                  >
                    <View
                      className={`${isRTL ? "flex-row-reverse" : "flex-row"} items-center justify-between px-5 py-3 border-b border-border`}
                      style={{
                        backgroundColor: opt.value === selectedValue ? colors.primary + "14" : "transparent",
                      }}
                    >
                      <Text
                        className="text-sm text-foreground"
                        style={{ fontWeight: opt.value === selectedValue ? "700" : "400" }}
                      >
                        {opt.label}
                      </Text>
                      {opt.value === selectedValue && (
                        <MaterialIcons name="check" size={18} color={colors.primary} />
                      )}
                    </View>
                  </PressableScale>
                ))}
              </ScrollView>
            </View>
          </View>
        </PressableScale>
      </Modal>
    </>
  );
}
