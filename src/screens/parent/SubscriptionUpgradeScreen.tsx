import React from 'react';
import {
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../utils/colors';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { useI18n } from '../../i18n/useI18n';
import { useAuthStore } from '../../store/store';
import { supabase } from '../../lib/supabase';

const SubscriptionUpgradeScreen: React.FC<any> = ({ navigation }) => {
  const { t } = useI18n();
  const { user, setUser } = useAuthStore();
  const [loadingTier, setLoadingTier] = React.useState<string | null>(null);

  const handleSubscribe = async (tier: string) => {
    setLoadingTier(tier);
    try {
      const tierUpper = tier.toUpperCase();
      // Update Supabase Auth Metadata
      const { data, error } = await supabase.auth.updateUser({
        data: { tier_level: tierUpper }
      });
      if (error) throw error;
      
      // Update local store
      if (user) {
        setUser({ ...user, tier_level: tierUpper as any });
      }
      
      Alert.alert(
        'Upgrade Successful!',
        `Your account has been upgraded to ${tier} tier.`,
        [{ text: 'Awesome!', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Upgrade Failed', e.message);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textDark} />
        </TouchableOpacity>

        <Text style={styles.title}>{t('subscription_title')}</Text>
        <Text style={styles.note}>{t('subscription_note')}</Text>

        <CrayonCard style={styles.tierCard} backgroundColor={colors.lightGrey}>
          <Text style={styles.tierName}>FREE</Text>
          <Text style={styles.tierPrice}>0 BDT</Text>
          <Text style={styles.tierFeature}>• M-CHAT Screener</Text>
          <Text style={styles.tierFeature}>• 1 Demo Game/week</Text>
        </CrayonCard>

        <CrayonCard style={styles.tierCard} backgroundColor={colors.primaryLight}>
          <Text style={styles.tierName}>BASIC</Text>
          <Text style={styles.tierPrice}>299 BDT/mo</Text>
          <Text style={styles.tierFeature}>• All 8 Therapy Games</Text>
          <Text style={styles.tierFeature}>• 7-day Analytics</Text>
          <CrayonButton
            label={loadingTier === 'Basic' ? 'Upgrading...' : t('subscription_iap')}
            onPress={() => handleSubscribe('Basic')}
            variant="primary"
            size="small"
            fullWidth
            style={{ marginTop: 12 }}
          />
        </CrayonCard>

        <CrayonCard style={styles.tierCard} backgroundColor={colors.secondaryLight}>
          <Text style={styles.tierName}>PREMIUM</Text>
          <Text style={styles.tierPrice}>799 BDT/mo</Text>
          <Text style={styles.tierFeature}>• Unlimited AI Sessions</Text>
          <Text style={styles.tierFeature}>• 30-day Analytics + PDF Reports</Text>
          <CrayonButton
            label={loadingTier === 'Premium' ? 'Upgrading...' : t('subscription_iap')}
            onPress={() => handleSubscribe('Premium')}
            variant="secondary"
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
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.lightGrey, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textDark, marginBottom: 12, fontFamily: 'Poppins' },
  note: { fontSize: 12, color: colors.darkGrey, marginBottom: 20, fontFamily: 'Inter' },
  tierCard: { marginBottom: 16, padding: 20 },
  tierName: { fontSize: 18, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins' },
  tierPrice: { fontSize: 20, fontWeight: '800', color: colors.primary, marginVertical: 8, fontFamily: 'Poppins' },
  tierFeature: { fontSize: 13, color: colors.textWarmBrown, marginTop: 6, fontFamily: 'Inter' },
});

export default SubscriptionUpgradeScreen;
