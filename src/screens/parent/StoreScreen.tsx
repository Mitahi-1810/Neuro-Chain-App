import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { Mascot } from '../../components/Mascot';
import { SectionTitle } from '../../components/Decorations';
import { useI18n } from '../../i18n/useI18n';

interface Product {
  id: string;
  name: string;
  price: string;
  emoji: string;
  category: 'sensory' | 'fine-motor' | 'comfort';
  bg: string;
  accent: string;
  desc: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'weighted-blanket',
    name: 'Weighted Blanket',
    price: 'BDT 2,200',
    emoji: '🛌',
    category: 'comfort',
    bg: colors.primaryLight,
    accent: colors.primary,
    desc: 'Calming pressure for self-regulation routines.',
  },
  {
    id: 'chew-set',
    name: 'Sensory Chew Set',
    price: 'BDT 650',
    emoji: '🦷',
    category: 'sensory',
    bg: colors.skyLight,
    accent: '#0EA5E9',
    desc: 'Three textures for oral input regulation.',
  },
  {
    id: 'fidget-bundle',
    name: 'Fidget Bundle',
    price: 'BDT 480',
    emoji: '🌀',
    category: 'fine-motor',
    bg: colors.pinkLight,
    accent: colors.pink,
    desc: 'Six tools for fine-motor & focus.',
  },
  {
    id: 'visual-cards',
    name: 'Visual Schedule Cards',
    price: 'BDT 350',
    emoji: '🗂️',
    category: 'comfort',
    bg: colors.accentLight,
    accent: colors.accent,
    desc: '40 picture cards for daily routines.',
  },
];

const StoreScreen: React.FC<any> = () => {
  const { t } = useI18n();
  const handleCheckout = () => {
    Alert.alert(
      'Checkout',
      'Store purchases are processed via Stripe or SSLCommerz (external gateway).',
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>therapy store</Text>
            <Text style={styles.title}>{t('store_title')}</Text>
            <Text style={styles.subtitle}>{t('store_subtitle')}</Text>
          </View>
          <Mascot kind="heart" size="lg" />
        </View>

        {/* Featured banner */}
        <TouchableOpacity activeOpacity={0.92} style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerEyebrow}>this week</Text>
            <Text style={styles.bannerTitle}>15% off{'\n'}sensory bundles</Text>
            <Text style={styles.bannerDesc}>
              Curated for South Asian families · cash-on-delivery available.
            </Text>
          </View>
          <Mascot kind="star" size="xl" tint="rgba(255,255,255,0.4)" />
        </TouchableOpacity>

        {/* Products */}
        <SectionTitle title="Picked for you" />
        <View style={styles.grid}>
          {PRODUCTS.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={[styles.cardThumb, { backgroundColor: p.bg }]}>
                <Text style={{ fontSize: 40 }}>{p.emoji}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardCategory, { color: p.accent }]}>
                  {p.category}
                </Text>
                <Text style={styles.cardName}>{p.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {p.desc}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrice}>{p.price}</Text>
                  <TouchableOpacity
                    style={[styles.buyBtn, { backgroundColor: p.accent }]}
                    onPress={handleCheckout}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <CrayonButton
          label="Shop all 24 items"
          onPress={handleCheckout}
          variant="dark"
          size="large"
          fullWidth
          style={{ marginTop: 12, marginBottom: 12 }}
        />

        <Text style={styles.note}>{t('store_note')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.primary,
    marginBottom: 6,
  },
  title: {
    ...typography.h1,
    fontSize: 26,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 4,
  },

  /* Banner */
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: 22,
    marginBottom: 22,
    overflow: 'hidden',
    ...shadow.primary,
  },
  bannerEyebrow: {
    ...typography.eyebrow,
    color: colors.secondary,
    marginBottom: 8,
  },
  bannerTitle: {
    ...typography.h1,
    fontSize: 24,
    lineHeight: 28,
    color: colors.white,
  },
  bannerDesc: {
    ...typography.body,
    fontSize: 13,
    color: colors.primaryLight,
    marginTop: 6,
    paddingRight: 80,
  },

  /* Grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  cardThumb: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 12,
  },
  cardCategory: {
    ...typography.badge,
    fontSize: 9,
    marginBottom: 4,
  },
  cardName: {
    ...typography.h4,
    fontSize: 14,
  },
  cardDesc: {
    ...typography.caption,
    marginTop: 4,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  cardPrice: {
    ...typography.h4,
    fontSize: 13,
    color: colors.textDark,
  },
  buyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  note: {
    ...typography.caption,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default StoreScreen;
