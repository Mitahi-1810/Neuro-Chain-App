import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CrayonButton } from '../../components/CrayonButton';
import { useAuthStore, useChildStore } from '../../store/store';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n/useI18n';
import { getMchatQuestions } from './screenerData';
import { saveScreenerDraft, loadScreenerDraft, clearScreenerDraft, formatDraftDate } from './screenerDraft';
import { SCREENER_SECTIONS, getSectionInfo } from './screenerSections';

const dc = {
  bg: '#7B74E0',
  primary: '#554db7',
  white: '#ffffff',
  yellow: '#fdcc22',
  yellowText: '#241a00',
  inactive: 'rgba(255,255,255,0.25)',
  muted: 'rgba(255,255,255,0.65)',
  cardBg: 'rgba(255,255,255,0.13)',
  surface: '#ffffff',
};

type Instrument = 'CSBS_ITC' | 'MCHAT' | 'CAST' | 'NONE' | 'OLDER';

const getAgeInMonths = (dob: Date) => {
  const now = new Date();
  return Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));
};

const getInstrumentForAge = (ageMonths: number): Instrument => {
  if (ageMonths >= 9 && ageMonths <= 15) return 'CSBS_ITC';
  if (ageMonths >= 16 && ageMonths <= 47) return 'MCHAT';
  if (ageMonths >= 48 && ageMonths <= 132) return 'CAST';
  if (ageMonths >= 132) return 'OLDER';
  return 'NONE';
};

const SECTIONS = SCREENER_SECTIONS.MCHAT;
const TEST_TYPE = 'MCHAT';

interface Props {
  navigation: any;
}

const AutismScreenerScreen: React.FC<Props> = ({ navigation }) => {
  const { locale } = useI18n();
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [lastAssessment, setLastAssessment] = useState<any | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(true);

  // Draft / resume state
  const [draftChecked, setDraftChecked] = useState(false);
  const [resumeDraft, setResumeDraft] = useState<{ answers: boolean[]; questionIndex: number; savedAt: string } | null>(null);
  const [showResume, setShowResume] = useState(false);

  // Section complete overlay state
  const [showSectionComplete, setShowSectionComplete] = useState(false);
  const [pendingAnswers, setPendingAnswers] = useState<boolean[]>([]);
  const [pendingIndex, setPendingIndex] = useState(0);

  const screenerQuestions = useMemo(() => getMchatQuestions(locale), [locale]);

  const childDOB = useMemo(() => {
    if (!activeChild?.date_of_birth) return null;
    return new Date(activeChild.date_of_birth);
  }, [activeChild]);

  const childAgeMonths = useMemo(() => {
    if (!childDOB) return null;
    return getAgeInMonths(childDOB);
  }, [childDOB]);

  const instrument = useMemo(() => {
    if (childAgeMonths === null) return 'NONE' as Instrument;
    return getInstrumentForAge(childAgeMonths);
  }, [childAgeMonths]);

  useEffect(() => {
    const init = async () => {
      if (!activeChild) {
        setLoadingAssessment(false);
        setDraftChecked(true);
        return;
      }
      try {
        const { data } = await supabase
          .from('assessments')
          .select('*')
          .eq('child_id', activeChild.id)
          .order('timestamp', { ascending: false })
          .limit(1);
        setLastAssessment(data?.[0] ?? null);
      } catch {
        // non-fatal
      } finally {
        setLoadingAssessment(false);
      }

      try {
        const draft = await loadScreenerDraft(activeChild.id, TEST_TYPE);
        if (draft && draft.answers.length > 0) {
          setResumeDraft(draft as any);
          setShowResume(true);
        }
      } catch {
        // non-fatal
      } finally {
        setDraftChecked(true);
      }
    };
    init();
  }, [activeChild]);

  const lockInfo = useMemo(() => {
    if (!lastAssessment || !childAgeMonths) return null;
    const lastType = lastAssessment.test_type as string;
    const lastRisk = lastAssessment.risk_level as string;
    const lastTimestamp = new Date(lastAssessment.timestamp || lastAssessment.created_at || Date.now());
    const monthsSince = (new Date().getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);

    if (
      instrument === 'MCHAT' &&
      lastType === 'CSBS_ITC' &&
      typeof childAgeMonths === 'number' &&
      childAgeMonths < 18 &&
      monthsSince < 3
    ) {
      return {
        locked: true,
        reason: 'M-CHAT will be available at 18 months and at least 90 days after the last CSBS screening.',
      };
    }
    if (instrument !== lastType) return null;
    if (lastRisk === 'HIGH') {
      return {
        locked: true,
        reason: 'Based on your previous screening, a specialist consultation is the recommended next step.',
      };
    }
    const minMonths = lastRisk === 'MODERATE' ? 3 : 6;
    if (lastRisk === 'MODERATE' && user?.tier_level && user.tier_level !== 'FREE') return null;
    if (monthsSince < minMonths) {
      const remaining = Math.ceil(minMonths - monthsSince);
      return {
        locked: true,
        reason: `Re-screening will be available in ${remaining} month${remaining === 1 ? '' : 's'}.`,
      };
    }
    return null;
  }, [lastAssessment, instrument, childAgeMonths, user?.tier_level]);

  // ─── Guard screens ──────────────────────────────────────────────────────────

  if (!activeChild) {
    return (
      <SafeAreaView style={styles.container}>
        <GateHeader navigation={navigation} title="M-CHAT Screener" />
        <View style={styles.gateContent}>
          <GateCard icon="account-alert" title="Add a child profile" desc="Please add your child's profile to start the right age-specific screening.">
            <CrayonButton label="Return home" onPress={() => navigation.navigate('ParentTabs')} variant="primary" size="large" fullWidth style={{ marginTop: 24 }} />
          </GateCard>
        </View>
      </SafeAreaView>
    );
  }

  if (!loadingAssessment && lockInfo?.locked) {
    return (
      <SafeAreaView style={styles.container}>
        <GateHeader navigation={navigation} title="M-CHAT Screener" />
        <View style={styles.gateContent}>
          <GateCard icon="lock" title="Screening locked" desc={lockInfo.reason}>
            <CrayonButton label="Book a specialist" onPress={() => navigation.navigate('TelehealthBooking')} variant="primary" size="large" fullWidth style={{ marginTop: 24 }} />
            <CrayonButton label="Return home" onPress={() => navigation.navigate('ParentTabs')} variant="ghost" size="medium" fullWidth style={{ marginTop: 10 }} />
          </GateCard>
        </View>
      </SafeAreaView>
    );
  }

  if (!loadingAssessment && !draftChecked) {
    return (
      <SafeAreaView style={styles.container}>
        <GateHeader navigation={navigation} title="M-CHAT Screener" />
        <View style={styles.gateContent}>
          <GateCard icon="clock-outline" title="Preparing your screener" desc="Checking your child's eligibility…" />
        </View>
      </SafeAreaView>
    );
  }

  if (loadingAssessment || !draftChecked) {
    return (
      <SafeAreaView style={styles.container}>
        <GateHeader navigation={navigation} title="M-CHAT Screener" />
        <View style={styles.gateContent}>
          <GateCard icon="clock-outline" title="Preparing your screener" desc="Checking your child's eligibility…" />
        </View>
      </SafeAreaView>
    );
  }

  if (instrument !== 'MCHAT') {
    const copy = (() => {
      if (instrument === 'CSBS_ITC') return { title: 'Infant communication screening available', desc: 'Your child is in the 9–15 month window. Start the CSBS-DP Infant-Toddler Checklist now.', actionLabel: 'Start CSBS checklist', action: () => navigation.navigate('CSBSScreener') };
      if (instrument === 'CAST') return { title: 'School-age screening available', desc: 'Your child is in the 4–11 year window. Start the CAST questionnaire now.', actionLabel: 'Start CAST screening', action: () => navigation.navigate('CastScreener') };
      if (instrument === 'OLDER') return { title: 'Specialist evaluation recommended', desc: 'For children aged 11 and above, a clinician-led evaluation is the most reliable path.', actionLabel: 'Learn more', action: () => navigation.navigate('OlderChildInfo') };
      return { title: 'No age-validated screener right now', desc: 'There is no validated screener for this age range yet.', actionLabel: 'Book a specialist', action: () => navigation.navigate('TelehealthBooking') };
    })();
    return (
      <SafeAreaView style={styles.container}>
        <GateHeader navigation={navigation} title="M-CHAT Screener" />
        <View style={styles.gateContent}>
          <GateCard icon="clipboard-text" title={copy.title} desc={copy.desc}>
            <CrayonButton label={copy.actionLabel} onPress={copy.action} variant="primary" size="large" fullWidth style={{ marginTop: 24 }} />
            <CrayonButton label="Return home" onPress={() => navigation.navigate('ParentTabs')} variant="ghost" size="medium" fullWidth style={{ marginTop: 10 }} />
          </GateCard>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Resume screen ──────────────────────────────────────────────────────────

  if (showResume && resumeDraft) {
    const resumeSection = getSectionInfo(SECTIONS, resumeDraft.questionIndex);
    const totalAnswered = resumeDraft.answers.length;
    const total = screenerQuestions.length;

    const handleResume = () => {
      setAnswers(resumeDraft.answers as boolean[]);
      setCurrentQuestionIndex(resumeDraft.questionIndex);
      setShowResume(false);
    };

    const handleStartOver = () => {
      Alert.alert('Start over?', 'Your saved progress will be cleared.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start over',
          style: 'destructive',
          onPress: async () => {
            await clearScreenerDraft(activeChild.id, TEST_TYPE);
            setResumeDraft(null);
            setShowResume(false);
            setAnswers([]);
            setCurrentQuestionIndex(0);
          },
        },
      ]);
    };

    return (
      <SafeAreaView style={styles.container}>
        <GateHeader navigation={navigation} title="M-CHAT Screener" />
        <View style={styles.gateContent}>
          <View style={styles.resumeCard}>
            <View style={styles.resumeIconWrap}>
              <MaterialCommunityIcons name="bookmark-check" size={40} color={dc.primary} />
            </View>
            <Text style={styles.resumeTitle}>Welcome back!</Text>
            <Text style={styles.resumeBody}>
              You've answered {totalAnswered} of {total} questions.
            </Text>
            <Text style={styles.resumeSection}>
              Next up: Section {resumeSection.sectionIndex + 1} of {resumeSection.totalSections} — {resumeSection.sectionTitle}
            </Text>
            <Text style={styles.resumeDate}>Last session: {formatDraftDate(resumeDraft.savedAt)}</Text>

            <View style={styles.resumeProgressBar}>
              {Array.from({ length: total }).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.resumeSegment,
                    idx < totalAnswered ? styles.resumeSegmentDone : styles.resumeSegmentPending,
                  ]}
                />
              ))}
            </View>

            <CrayonButton label={`Continue from Q${resumeDraft.questionIndex + 1}`} onPress={handleResume} variant="primary" size="large" fullWidth style={{ marginTop: 24 }} />
            <CrayonButton label="Start over" onPress={handleStartOver} variant="ghost" size="medium" fullWidth style={{ marginTop: 10 }} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Section complete overlay ────────────────────────────────────────────────

  if (showSectionComplete) {
    const completedSection = getSectionInfo(SECTIONS, pendingIndex - 1);
    const nextSection = pendingIndex < screenerQuestions.length ? getSectionInfo(SECTIONS, pendingIndex) : null;
    const remaining = screenerQuestions.length - pendingAnswers.length;

    const handleContinue = () => {
      setAnswers(pendingAnswers);
      setCurrentQuestionIndex(pendingIndex);
      setShowSectionComplete(false);
    };

    const handleSaveExit = () => {
      navigation.navigate('ParentTabs');
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.sectionCompleteWrap}>
          <View style={styles.sectionCompleteIcon}>
            <MaterialCommunityIcons name="check-circle" size={72} color={dc.yellow} />
          </View>
          <Text style={styles.sectionCompleteBadge}>
            SECTION {completedSection.sectionIndex + 1} OF {completedSection.totalSections}
          </Text>
          <Text style={styles.sectionCompleteTitle}>{completedSection.sectionTitle}</Text>
          <Text style={styles.sectionCompleteLabel}>Complete!</Text>
          <Text style={styles.sectionCompleteStats}>
            {pendingAnswers.length} answered · {remaining} to go
          </Text>
          {nextSection && (
            <View style={styles.nextSectionPill}>
              <Text style={styles.nextSectionText}>
                Up next: {nextSection.sectionTitle}
              </Text>
            </View>
          )}
          <View style={styles.sectionCompleteActions}>
            <CrayonButton
              label={nextSection ? `Continue to Section ${completedSection.sectionIndex + 2}` : 'See results'}
              onPress={handleContinue}
              variant="primary"
              size="large"
              fullWidth
            />
            <CrayonButton
              label="Save & come back later"
              onPress={handleSaveExit}
              variant="ghost"
              size="medium"
              fullWidth
              style={{ marginTop: 12 }}
            />
          </View>
          <Text style={styles.sectionCompleteSaved}>Progress saved automatically</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Question view ───────────────────────────────────────────────────────────

  const currentQuestion = screenerQuestions[currentQuestionIndex];
  const sectionInfo = getSectionInfo(SECTIONS, currentQuestionIndex);

  const handleAnswer = (answer: boolean) => {
    const newAnswers = [...answers, answer];
    const newIndex = currentQuestionIndex + 1;
    const info = getSectionInfo(SECTIONS, currentQuestionIndex);

    if (newIndex >= screenerQuestions.length) {
      clearScreenerDraft(activeChild.id, TEST_TYPE);
      const riskScore = screenerQuestions.reduce((score, q, idx) => {
        const isYes = newAnswers[idx];
        return (q.is_reversed ? isYes : !isYes) ? score + 1 : score;
      }, 0);
      navigation.navigate('ScreenerResults', { testType: 'MCHAT', riskScore, answers: newAnswers });
    } else if (info.isLastInSection) {
      saveScreenerDraft(activeChild.id, TEST_TYPE, newAnswers, newIndex).catch(() => {});
      setPendingAnswers(newAnswers);
      setPendingIndex(newIndex);
      setShowSectionComplete(true);
    } else {
      setAnswers(newAnswers);
      setCurrentQuestionIndex(newIndex);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setAnswers(answers.slice(0, -1));
    } else {
      Alert.alert('Exit Screener?', 'Are you sure? Your progress will be saved for next time.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => navigation.goBack(), style: 'destructive' },
      ]);
    }
  };

  const segmentStart = sectionInfo.sectionStart;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={dc.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>M-CHAT Screener</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Section header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionMetaRow}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>
                SECTION {sectionInfo.sectionIndex + 1} OF {sectionInfo.totalSections}
              </Text>
            </View>
            <Text style={styles.totalCounter}>
              Q{currentQuestionIndex + 1} of {screenerQuestions.length}
            </Text>
          </View>
          <Text style={styles.sectionTitle}>{sectionInfo.sectionTitle}</Text>

          {/* Within-section segmented bar */}
          <View style={styles.segmentedBar}>
            {Array.from({ length: sectionInfo.countInSection }).map((_, idx) => {
              const globalIdx = segmentStart + idx;
              const isDone = globalIdx < currentQuestionIndex;
              const isCurrent = globalIdx === currentQuestionIndex;
              return (
                <View
                  key={idx}
                  style={[
                    styles.segment,
                    isDone || isCurrent ? styles.segmentActive : styles.segmentInactive,
                    idx === 0 && styles.segmentFirst,
                    idx === sectionInfo.countInSection - 1 && styles.segmentLast,
                  ]}
                />
              );
            })}
          </View>
          <Text style={styles.inSectionCounter}>
            Question {sectionInfo.indexInSection + 1} of {sectionInfo.countInSection} in this section
          </Text>
        </View>

        {/* Question card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionNum}>Q{currentQuestionIndex + 1}</Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Answer buttons */}
        <View style={styles.answerGroup}>
          <TouchableOpacity style={styles.answerYes} activeOpacity={0.85} onPress={() => handleAnswer(true)}>
            <Text style={styles.answerYesText}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.answerNo} activeOpacity={0.85} onPress={() => handleAnswer(false)}>
            <Text style={styles.answerNoText}>No</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Shared gate sub-components ─────────────────────────────────────────────

const GateHeader = ({ navigation, title }: { navigation: any; title: string }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
      <MaterialCommunityIcons name="arrow-left" size={22} color={dc.white} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={styles.headerSpacer} />
  </View>
);

const GateCard = ({
  icon,
  title,
  desc,
  children,
}: {
  icon: string;
  title: string;
  desc: string;
  children?: React.ReactNode;
}) => (
  <View style={styles.gateCard}>
    <MaterialCommunityIcons name={icon as any} size={56} color={dc.primary} style={{ marginBottom: 16 }} />
    <Text style={styles.gateTitle}>{title}</Text>
    <Text style={styles.gateDesc}>{desc}</Text>
    {children}
  </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dc.bg },

  header: {
    height: 64,
    backgroundColor: dc.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Nunito', fontWeight: '800', fontSize: 18, color: dc.white },
  headerSpacer: { width: 40 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100, flexGrow: 1 },

  // Section header
  sectionHeader: { marginBottom: 20 },
  sectionMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sectionBadgeText: {
    fontFamily: 'Nunito',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1,
    color: dc.white,
  },
  totalCounter: { fontFamily: 'Nunito', fontWeight: '600', fontSize: 13, color: dc.muted },
  sectionTitle: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 22,
    color: dc.white,
    marginBottom: 14,
  },
  segmentedBar: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  segment: { flex: 1, height: 8 },
  segmentActive: { backgroundColor: dc.white },
  segmentInactive: { backgroundColor: dc.inactive },
  segmentFirst: { borderTopLeftRadius: 9999, borderBottomLeftRadius: 9999 },
  segmentLast: { borderTopRightRadius: 9999, borderBottomRightRadius: 9999 },
  inSectionCounter: { fontFamily: 'Nunito', fontWeight: '600', fontSize: 12, color: dc.muted },

  // Question card
  questionCard: {
    backgroundColor: dc.cardBg,
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  questionNum: { fontFamily: 'Nunito', fontWeight: '700', fontSize: 12, color: dc.muted, marginBottom: 10, letterSpacing: 0.5 },
  questionText: { fontFamily: 'Nunito', fontWeight: '800', fontSize: 20, lineHeight: 30, color: dc.white },

  // Answers
  answerGroup: { gap: 14 },
  answerYes: {
    backgroundColor: dc.yellow,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  answerYesText: { fontFamily: 'Nunito', fontWeight: '800', fontSize: 18, color: dc.yellowText },
  answerNo: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  answerNoText: { fontFamily: 'Nunito', fontWeight: '800', fontSize: 18, color: dc.white },

  // Gate screens
  gateContent: { flex: 1, paddingHorizontal: 20, paddingVertical: 24, justifyContent: 'center' },
  gateCard: {
    backgroundColor: dc.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  gateTitle: { fontFamily: 'Nunito', fontWeight: '800', fontSize: 22, color: '#1a1c1c', textAlign: 'center', marginBottom: 10 },
  gateDesc: { fontFamily: 'Nunito', fontWeight: '600', fontSize: 14, lineHeight: 20, color: '#474552', textAlign: 'center' },

  // Resume screen
  resumeCard: {
    backgroundColor: dc.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  resumeIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(85,77,183,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resumeTitle: { fontFamily: 'Nunito', fontWeight: '800', fontSize: 22, color: '#1a1c1c', marginBottom: 8 },
  resumeBody: { fontFamily: 'Nunito', fontWeight: '600', fontSize: 15, color: '#474552', textAlign: 'center', marginBottom: 4 },
  resumeSection: { fontFamily: 'Nunito', fontWeight: '700', fontSize: 14, color: dc.primary, textAlign: 'center', marginBottom: 4 },
  resumeDate: { fontFamily: 'Nunito', fontWeight: '500', fontSize: 13, color: '#888', marginBottom: 16 },
  resumeProgressBar: { flexDirection: 'row', gap: 3, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 4, width: '100%' },
  resumeSegment: { height: 6, flex: 1, minWidth: 6, maxWidth: 16, borderRadius: 3 },
  resumeSegmentDone: { backgroundColor: dc.primary },
  resumeSegmentPending: { backgroundColor: '#e0dff5' },

  // Section complete overlay
  sectionCompleteWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  sectionCompleteIcon: { marginBottom: 20 },
  sectionCompleteBadge: {
    fontFamily: 'Nunito',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.5,
    color: dc.muted,
    marginBottom: 6,
  },
  sectionCompleteTitle: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 26,
    color: dc.white,
    textAlign: 'center',
  },
  sectionCompleteLabel: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 32,
    color: dc.yellow,
    marginBottom: 12,
  },
  sectionCompleteStats: {
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 15,
    color: dc.muted,
    marginBottom: 20,
  },
  nextSectionPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 32,
  },
  nextSectionText: {
    fontFamily: 'Nunito',
    fontWeight: '700',
    fontSize: 13,
    color: dc.white,
  },
  sectionCompleteActions: { width: '100%' },
  sectionCompleteSaved: {
    fontFamily: 'Nunito',
    fontWeight: '500',
    fontSize: 12,
    color: dc.muted,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default AutismScreenerScreen;
