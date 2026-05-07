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
import { useI18n } from '../../i18n/useI18n';

interface Product {
  id: string;
  name: string;
  price: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const PRODUCTS: Product[] = [
  {
    id: 'weighted-blanket',
    name: 'Weighted Blanket',
    price: 'BDT 2,200',
    icon: 'bed-queen-outline',
  },
  {
    id: 'chew-set',
    name: 'Sensory Chew Set',
    price: 'BDT 650',
    icon: 'tooth-outline',
  },
  {
    id: 'fidget-bundle',
    name: 'Fidget Bundle',
    price: 'BDT 480',
    icon: 'gesture-tap',
  },
  {
    id: 'visual-cards',
    name: 'Visual Schedule Cards',
    price: 'BDT 350',
    icon: 'clipboard-text-outline',
  },
];

const designColors = {
  surfaceContainer: '#eeeeee',
  surfaceLowest: '#ffffff',
  surfaceLow: '#f4f3f3',
  surfaceVariant: '#e2e2e2',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#474552',
  primary: '#554db7',
  secondaryContainer: '#fdcc22',
  outline: '#787584',
  outlineVariant: '#c8c4d4',
  headerBg: '#7B74E0',
  chipActive: '#F5C518',
};

const CATEGORIES = ['All', 'Sensory', 'Weighted', 'Oral', 'Lamps'];

const StoreScreen: React.FC<any> = ({ navigation }) => {
  const { t } = useI18n();
  const handleCheckout = () => {
    Alert.alert(
      'Checkout',
      'Store purchases are processed via Stripe or SSLCommerz (external gateway).',
    );
  };

  const handleBack = () => {
    navigation?.goBack?.();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeTop} />
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.85}
            onPress={handleBack}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>NeuroStore</Text>
        </View>
        <View style={styles.xpPill}>
          <MaterialCommunityIcons
            name="star"
            size={16}
            color={designColors.secondaryContainer}
          />
          <Text style={styles.xpText}>2,450 XP</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          <View style={styles.headerSection}>
            <Text style={styles.pageTitle}>NeuroStore</Text>
            <Text style={styles.pageSubtitle}>
              Redeem your XP for real rewards.
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={styles.chipScroll}
          >
            {CATEGORIES.map((chip, index) => {
              const active = index === 0;
              return (
                <TouchableOpacity
                  key={chip}
                  activeOpacity={0.85}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {chip}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.productList}>
            {PRODUCTS.map((product) => (
              <TouchableOpacity
                key={product.id}
                activeOpacity={0.9}
                style={styles.productRow}
                onPress={handleCheckout}
              >
                <View style={styles.thumbWrapper}>
                  <View style={styles.thumb}>
                    <MaterialCommunityIcons
                      name={product.icon}
                      size={28}
                      color={designColors.primary}
                    />
                  </View>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View style={styles.productMetaRow}>
                    <MaterialCommunityIcons
                      name="star"
                      size={16}
                      color={designColors.primary}
                    />
                    <Text style={styles.productMetaText}>{product.price}</Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={designColors.outlineVariant}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.note}>{t('store_note')}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designColors.surfaceContainer,
  },
  safeTop: {
    backgroundColor: designColors.headerBg,
  },
  topBar: {
    height: 64,
    backgroundColor: designColors.headerBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 40,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  topBarTitle: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 18,
    color: '#FFF',
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  xpText: {
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 13,
    color: '#FFF',
  },
  scroll: {
    paddingBottom: 90,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  headerSection: {
    marginBottom: 24,
  },
  pageTitle: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 24,
    lineHeight: 30,
    color: designColors.onSurface,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: designColors.onSurfaceVariant,
  },
  chipScroll: {
    marginHorizontal: -20,
    marginBottom: 24,
  },
  chipRow: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: designColors.surfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: designColors.chipActive,
    borderColor: designColors.chipActive,
    shadowColor: designColors.chipActive,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  chipText: {
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
    color: designColors.onSurfaceVariant,
  },
  chipTextActive: {
    color: '#FFF',
  },
  productList: {
    gap: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designColors.surfaceLowest,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  thumbWrapper: {
    marginRight: 16,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: designColors.surfaceLow,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontFamily: 'Nunito',
    fontWeight: '700',
    fontSize: 17,
    lineHeight: 24,
    color: designColors.onSurface,
    marginBottom: 4,
  },
  productMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productMetaText: {
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
    color: designColors.primary,
  },
  note: {
    fontFamily: 'Nunito',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: designColors.outline,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default StoreScreen;

