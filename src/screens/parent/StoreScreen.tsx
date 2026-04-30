import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView, Alert } from 'react-native';
import { colors } from '../../utils/colors';
import { CrayonCard } from '../../components/CrayonCard';
import { CrayonButton } from '../../components/CrayonButton';
import { useI18n } from '../../i18n/useI18n';

const StoreScreen: React.FC<any> = () => {
  const { t } = useI18n();
  const handleCheckout = () => {
    Alert.alert(
      'Checkout',
      'Store purchases are processed via Stripe or SSLCommerz (external gateway).'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('store_title')}</Text>
        <Text style={styles.subtitle}>{t('store_subtitle')}</Text>
        <Text style={styles.note}>{t('store_note')}</Text>

        <CrayonCard style={styles.productCard}>
          <Text style={styles.productName}>Weighted Blanket</Text>
          <Text style={styles.productMeta}>BDT 2,200</Text>
          <CrayonButton
            label={t('store_buy_now')}
            onPress={handleCheckout}
            variant="primary"
            size="small"
            fullWidth
            style={{ marginTop: 12 }}
          />
        </CrayonCard>

        <CrayonCard style={styles.productCard}>
          <Text style={styles.productName}>Sensory Chew Set</Text>
          <Text style={styles.productMeta}>BDT 650</Text>
          <CrayonButton
            label={t('store_buy_now')}
            onPress={handleCheckout}
            variant="primary"
            size="small"
            fullWidth
            style={{ marginTop: 12 }}
          />
        </CrayonCard>
      </ScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 16, paddingVertical: 24 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  subtitle: { fontSize: 14, color: colors.textWarmBrown, marginTop: 6, fontFamily: 'Inter' },
  note: { fontSize: 12, color: colors.darkGrey, marginTop: 8, fontFamily: 'Inter' },
  productCard: { marginTop: 16, padding: 16 },
  productName: { fontSize: 16, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins' },
  productMeta: { fontSize: 12, color: colors.primary, marginTop: 6, fontFamily: 'Inter' },
});
export default StoreScreen;
