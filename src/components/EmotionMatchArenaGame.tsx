import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, ScrollView,
} from 'react-native';
import { colors, radius, shadow } from '../utils/colors';

const { width } = Dimensions.get('window');

const EMOTIONS = [
  { id: 'happy',       emoji: '😊', en: 'Happy',       bn: 'খুশি',       color: '#FFD60A' },
  { id: 'sad',         emoji: '😢', en: 'Sad',         bn: 'দুঃখী',      color: '#60A5FA' },
  { id: 'angry',       emoji: '😡', en: 'Angry',       bn: 'রাগী',       color: '#F87171' },
  { id: 'scared',      emoji: '😨', en: 'Scared',      bn: 'ভীত',        color: '#A78BFA' },
  { id: 'surprised',   emoji: '😲', en: 'Surprised',   bn: 'অবাক',       color: '#34D399' },
  { id: 'disgusted',   emoji: '🤢', en: 'Disgusted',   bn: 'বিতৃষ্ণ',   color: '#6EE7B7' },
  { id: 'proud',       emoji: '🥹', en: 'Proud',       bn: 'গর্বিত',     color: '#FBBF24' },
  { id: 'embarrassed', emoji: '😳', en: 'Embarrassed', bn: 'লজ্জিত',    color: '#FCA5A5' },
  { id: 'frustrated',  emoji: '😤', en: 'Frustrated',  bn: 'হতাশ',      color: '#F97316' },
  { id: 'calm',        emoji: '😌', en: 'Calm',        bn: 'শান্ত',      color: '#67E8F9' },
  { id: 'excited',     emoji: '🤩', en: 'Excited',     bn: 'উত্তেজিত',  color: '#FB923C' },
  { id: 'confused',    emoji: '😕', en: 'Confused',    bn: 'বিভ্রান্ত',  color: '#C084FC' },
];

type Tier = 'beginner' | 'intermediate' | 'advanced';
type Lang = 'en' | 'bn';
const TIER_CFG = {
  beginner:     { options: 2, label: 'Beginner',     color: '#10B981' },
  intermediate: { options: 4, label: 'Intermediate', color: '#F59E0B' },
  advanced:     { options: 6, label: 'Advanced',     color: '#EF4444' },
};
const ROUNDS = 8;

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function buildRound(tier: Tier, used: string[]) {
  const pool = EMOTIONS.filter(e => !used.includes(e.id));
  const src = pool.length ? pool : EMOTIONS;
  const target = src[Math.floor(Math.random() * src.length)];
  const dist = shuffle(EMOTIONS.filter(e => e.id !== target.id)).slice(0, TIER_CFG[tier].options - 1);
  return { target, options: shuffle([target, ...dist]) };
}

interface Props { onFinish: (m: any) => void; }
type Phase = 'setup' | 'observe' | 'respond' | 'feedback' | 'summary';

export const EmotionMatchArenaGame: React.FC<Props> = ({ onFinish }) => {
  const [phase, setPhase] = useState<Phase>('setup');
  const [tier, setTier] = useState<Tier>('beginner');
  const [lang, setLang] = useState<Lang>('en');
  const [round, setRound] = useState(0);
  const [current, setCurrent] = useState<ReturnType<typeof buildRound> | null>(null);
  const [cd, setCd] = useState(3);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [log, setLog] = useState<{ id: string; ok: boolean }[]>([]);
  const [used, setUsed] = useState<string[]>([]);
  const [startTime] = useState(Date.now());

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fbOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase !== 'observe') return;
    setCd(3);
    const iv = setInterval(() => {
      setCd(c => {
        if (c <= 1) { clearInterval(iv); setPhase('respond'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  const startRound = (t?: Tier, u?: string[]) => {
    const activeTier = t ?? tier;
    const activeUsed = u ?? used;
    const r = buildRound(activeTier, activeUsed);
    setCurrent(r);
    setSelected(null);
    setAttempts(0);
    fbOpacity.setValue(0);
    scaleAnim.setValue(1);
    setPhase('observe');
  };

  const handleTierSelect = (t: Tier) => {
    setTier(t); setRound(0); setLog([]); setUsed([]);
    startRound(t, []);
  };

  const handleOption = (id: string) => {
    if (selected || !current) return;
    const att = attempts + 1;
    setAttempts(att);
    setSelected(id);
    const ok = id === current.target.id;
    setCorrect(ok);
    if (ok) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.12, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
    Animated.timing(fbOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setPhase('feedback');

    setTimeout(() => {
      if (ok || att >= 2) {
        const newLog = [...log, { id: current.target.id, ok }];
        const newUsed = [...used, current.target.id];
        setLog(newLog);
        setUsed(newUsed);
        const next = round + 1;
        if (next >= ROUNDS) { setPhase('summary'); }
        else { setRound(next); startRound(tier, newUsed); }
      } else {
        setSelected(null);
        fbOpacity.setValue(0);
        setPhase('respond');
      }
    }, 1300);
  };

  // ── SETUP ──
  if (phase === 'setup') {
    return (
      <View style={s.setup}>
        <Text style={s.h1}>Emotion Match Arena 🎭</Text>
        <Text style={s.sub}>Choose your level to begin</Text>
        <View style={s.langRow}>
          {(['en', 'bn'] as Lang[]).map(l => (
            <TouchableOpacity key={l} style={[s.langBtn, lang === l && s.langActive]} onPress={() => setLang(l)}>
              <Text style={[s.langTxt, lang === l && s.langTxtActive]}>{l === 'en' ? '🇬🇧 EN' : '🇧🇩 BN'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {(['beginner', 'intermediate', 'advanced'] as Tier[]).map(t => (
          <TouchableOpacity key={t} style={[s.tierCard, { borderColor: TIER_CFG[t].color }]} onPress={() => handleTierSelect(t)} activeOpacity={0.8}>
            <View style={[s.tierDot, { backgroundColor: TIER_CFG[t].color }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.tierLabel}>{TIER_CFG[t].label}</Text>
              <Text style={s.tierHint}>
                {t === 'beginner' ? '2 options · Tap to match' :
                 t === 'intermediate' ? '4 options · Illustrated scenes' : '6 options · Text scenarios'}
              </Text>
            </View>
            <Text style={{ fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // ── SUMMARY ──
  if (phase === 'summary') {
    const ok = log.filter(l => l.ok).length;
    const pct = Math.round((ok / log.length) * 100);
    const byEm: Record<string, { c: number; t: number }> = {};
    log.forEach(l => {
      if (!byEm[l.id]) byEm[l.id] = { c: 0, t: 0 };
      byEm[l.id].t++;
      if (l.ok) byEm[l.id].c++;
    });
    return (
      <ScrollView contentContainerStyle={s.summary}>
        <Text style={s.h1}>Session Complete! 🎉</Text>
        <View style={[s.scoreCircle, { borderColor: pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.danger }]}>
          <Text style={s.scoreNum}>{pct}%</Text>
          <Text style={s.scoreLbl}>Accuracy</Text>
        </View>
        <Text style={s.sectionLbl}>Emotion Breakdown</Text>
        {Object.entries(byEm).map(([id, v]) => {
          const em = EMOTIONS.find(e => e.id === id)!;
          const p = Math.round((v.c / v.t) * 100);
          return (
            <View key={id} style={s.bRow}>
              <Text style={s.bEmoji}>{em.emoji}</Text>
              <Text style={s.bName}>{em.en}</Text>
              <View style={s.bBar}><View style={[s.bFill, { width: `${p}%` as any, backgroundColor: em.color }]} /></View>
              <Text style={s.bPct}>{p}%</Text>
            </View>
          );
        })}
        <TouchableOpacity style={s.doneBtn} onPress={() => onFinish({ accuracy_percentage: pct, session_duration_seconds: Math.round((Date.now() - startTime) / 1000), correct_trials: ok, total_trials: log.length, tier_played: tier })}>
          <Text style={s.doneTxt}>Finish Session</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (!current) return null;
  const optW = current.options.length <= 2 ? width * 0.38 : current.options.length <= 4 ? width * 0.28 : width * 0.27;

  return (
    <View style={s.game}>
      <View style={s.gameHeader}>
        <View style={[s.tierPill, { backgroundColor: TIER_CFG[tier].color + '22' }]}>
          <Text style={[s.tierPillTxt, { color: TIER_CFG[tier].color }]}>{TIER_CFG[tier].label}</Text>
        </View>
        <Text style={s.roundTxt}>{round + 1}/{ROUNDS}</Text>
        <TouchableOpacity onPress={() => setLang(lang === 'en' ? 'bn' : 'en')}>
          <Text style={{ fontSize: 22 }}>{lang === 'en' ? '🇧🇩' : '🇬🇧'}</Text>
        </TouchableOpacity>
      </View>
      <View style={s.pBar}><View style={[s.pFill, { width: `${(round / ROUNDS) * 100}%` as any }]} /></View>

      <Animated.View style={[s.stimulus, { backgroundColor: current.target.color + '20', transform: [{ scale: scaleAnim }, { translateX: shakeAnim }] }]}>
        <Text style={s.stimEmoji}>{current.target.emoji}</Text>
        {phase === 'observe' && (
          <View style={s.cdBadge}><Text style={s.cdTxt}>Look carefully… {cd}</Text></View>
        )}
        {phase === 'feedback' && (
          <Animated.View style={[s.fbBanner, { opacity: fbOpacity, backgroundColor: correct ? colors.success : colors.danger }]}>
            <Text style={s.fbTxt}>{correct ? '✓ Great job!' : attempts >= 2 ? `It's ${lang === 'en' ? current.target.en : current.target.bn}` : 'Try again!'}</Text>
          </Animated.View>
        )}
      </Animated.View>

      {(phase === 'respond' || phase === 'feedback') && (
        <>
          <Text style={s.qTxt}>{lang === 'en' ? 'Which emotion is this?' : 'এটি কোন আবেগ?'}</Text>
          <View style={s.optGrid}>
            {current.options.map(opt => {
              const isSel = selected === opt.id;
              const isTgt = opt.id === current.target.id;
              const bg = phase === 'feedback' ? (isTgt ? colors.successLight : isSel ? colors.dangerLight : colors.white) : colors.white;
              const bc = phase === 'feedback' ? (isTgt ? colors.success : isSel ? colors.danger : colors.border) : colors.border;
              return (
                <TouchableOpacity key={opt.id} style={[s.optBtn, { width: optW, backgroundColor: bg, borderColor: bc }]}
                  onPress={() => handleOption(opt.id)} disabled={phase === 'feedback'} activeOpacity={0.75}>
                  <Text style={{ fontSize: optW * 0.35, marginBottom: 6 }}>{opt.emoji}</Text>
                  <Text style={s.optLbl} numberOfLines={1}>{lang === 'en' ? opt.en : opt.bn}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  setup: { flex: 1, backgroundColor: colors.cream, padding: 28, paddingTop: 60 },
  h1: { fontSize: 26, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins', marginBottom: 6 },
  sub: { fontSize: 14, color: colors.textMuted, fontFamily: 'Inter', marginBottom: 24 },
  langRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  langBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, borderWidth: 2, borderColor: 'transparent' },
  langActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  langTxt: { fontSize: 14, fontWeight: '700', color: colors.textMuted, fontFamily: 'Inter' },
  langTxtActive: { color: colors.primary },
  tierCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white, borderRadius: radius.lg, padding: 18, marginBottom: 14, borderWidth: 2, ...shadow.sm },
  tierDot: { width: 14, height: 14, borderRadius: 7 },
  tierLabel: { fontSize: 16, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  tierHint: { fontSize: 12, color: colors.textMuted, fontFamily: 'Inter', marginTop: 3 },

  game: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', paddingTop: 54 },
  gameHeader: { position: 'absolute', top: 10, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tierPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full },
  tierPillTxt: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter' },
  roundTxt: { fontSize: 16, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  pBar: { width: width - 40, height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: 22, overflow: 'hidden' },
  pFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },

  stimulus: {
    width: width * 0.72, height: width * 0.72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    borderWidth: 3, borderColor: colors.border, ...shadow.lg, overflow: 'hidden',
  },
  stimEmoji: { fontSize: 100 },
  cdBadge: { position: 'absolute', bottom: 14, paddingHorizontal: 18, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.full },
  cdTxt: { color: '#fff', fontWeight: '700', fontFamily: 'Poppins', fontSize: 14 },
  fbBanner: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 12, alignItems: 'center' },
  fbTxt: { color: '#fff', fontWeight: '800', fontFamily: 'Poppins', fontSize: 15 },

  qTxt: { fontSize: 17, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins', marginBottom: 16, textAlign: 'center' },
  optGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingHorizontal: 12 },
  optBtn: { borderRadius: radius.md, padding: 12, alignItems: 'center', borderWidth: 2, marginBottom: 4 },
  optLbl: { fontSize: 12, fontWeight: '700', color: colors.textDark, fontFamily: 'Inter' },

  summary: { flexGrow: 1, backgroundColor: colors.cream, alignItems: 'center', padding: 28, paddingTop: 52 },
  scoreCircle: { width: 130, height: 130, borderRadius: 65, borderWidth: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  scoreNum: { fontSize: 34, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  scoreLbl: { fontSize: 13, color: colors.textMuted, fontFamily: 'Inter' },
  sectionLbl: { fontSize: 15, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins', alignSelf: 'flex-start', marginBottom: 12 },
  bRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', marginBottom: 10 },
  bEmoji: { fontSize: 20, width: 26 },
  bName: { fontSize: 12, fontWeight: '600', color: colors.textBody, fontFamily: 'Inter', width: 78 },
  bBar: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  bFill: { height: 8, borderRadius: 4 },
  bPct: { fontSize: 12, fontWeight: '700', color: colors.textMuted, fontFamily: 'Inter', width: 34, textAlign: 'right' },
  doneBtn: { backgroundColor: colors.primary, paddingHorizontal: 36, paddingVertical: 16, borderRadius: radius.full, marginTop: 28 },
  doneTxt: { color: '#fff', fontWeight: '800', fontFamily: 'Poppins', fontSize: 16 },
});
