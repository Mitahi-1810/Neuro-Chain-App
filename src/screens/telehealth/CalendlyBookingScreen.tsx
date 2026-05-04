import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { useAuthStore, useChildStore } from '../../store/store';
import { getDatabase } from '../../data/database';

// Replace with your real Calendly event URL before demo
export const CALENDLY_BASE_URL = 'https://calendly.com/neurochain-demo/consultation';

const INJECTED_JS = `
  (function() {
    window.addEventListener('message', function(e) {
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.event && typeof data.event === 'string' && data.event.indexOf('calendly') !== -1) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
      } catch(err) {}
    });
  })();
  true;
`;

interface RouteParams {
  calendlyUrl: string;
  specialistId: string;
  specialistName: string;
  fee: number;
}

const CalendlyBookingScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { calendlyUrl, specialistId, specialistName, fee } = (route.params || {}) as RouteParams;
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const [loading, setLoading] = useState(true);
  const [booked, setBooked] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const fullUrl = `${calendlyUrl || CALENDLY_BASE_URL}?hide_gdpr_banner=1&hide_event_type_details=0`;

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.event === 'calendly.event_scheduled') {
        await saveBooking();
        setBooked(true);
      }
    } catch (_) {}
  };

  const saveBooking = async () => {
    try {
      const db = await getDatabase();
      const timestamp = new Date().toISOString();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await db.runAsync(
        `INSERT INTO appointments (
          id, parent_id, specialist_id, child_id, scheduled_at, session_type,
          status, amount_paid_bdt, payment_gateway, created_at, updated_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, 'Telehealth', 'PENDING', ?, 'STRIPE', ?, ?, 0)`,
        [
          Date.now().toString(),
          user?.id || '',
          specialistId || '',
          activeChild?.id || '',
          tomorrow.toISOString(),
          fee || 0,
          timestamp,
          timestamp,
        ]
      );
    } catch (err) {
      console.error('Failed to save booking:', err);
    }
  };

  if (booked) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.confirmedContainer}>
          <View style={styles.confirmedIcon}>
            <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
          </View>
          <Text style={styles.confirmedTitle}>Booking Requested!</Text>
          <Text style={styles.confirmedDesc}>
            Your appointment request with{'\n'}
            <Text style={styles.confirmedName}>{specialistName}</Text>
            {'\n'}has been sent. You'll receive a confirmation shortly.
          </Text>
          <CrayonButton
            label="Back to Home"
            onPress={() => navigation.navigate('ParentTabs')}
            variant="primary"
            size="large"
            fullWidth
            style={{ marginTop: 32 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{specialistName || 'Book Appointment'}</Text>
          <Text style={styles.headerSub}>Select a date and time</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Opening scheduler…</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: fullUrl }}
        injectedJavaScript={INJECTED_JS}
        onMessage={handleMessage}
        onLoadEnd={() => setLoading(false)}
        style={[styles.webview, loading && { opacity: 0 }]}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 16,
  },
  headerSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },

  webview: { flex: 1 },

  loadingOverlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    zIndex: 10,
    gap: 14,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },

  confirmedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  confirmedIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  confirmedTitle: {
    ...typography.h1,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmedDesc: {
    ...typography.bodyLg,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 26,
  },
  confirmedName: {
    ...typography.h3,
    color: colors.primary,
  },
});

export default CalendlyBookingScreen;
