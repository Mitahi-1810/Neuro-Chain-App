import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuthStore, useChildStore } from '../../store/store';
import { ChildProfileModal } from '../../components/ChildProfileModal';
import { useI18n } from '../../i18n/useI18n';

// Static colors matching the pixel-perfect design
const designColors = {
  surfaceContainer: '#eeeeee',
  surfaceLowest: '#ffffff',
  surfaceLow: '#f4f3f3',
  surfaceHighest: '#e2e2e2',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#474552',
  primary: '#554db7',
  primaryFixed: '#e3dfff',
  secondaryFixed: '#ffe08b',
  secondary: '#745b00',
  outline: '#787584',
  outlineVariant: '#c8c4d4',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  headerBg: '#7B74E0',
};

const ProfileScreen: React.FC<any> = ({ navigation }) => {
  const { t } = useI18n();
  const { user, logout } = useAuthStore();
  const { children, activeChild, setActiveChild, addChild } = useChildStore();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const sortedChildren = useMemo(
    () => [...children].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [children],
  );

  const getAge = (dob?: string) => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const hasHadBirthday =
      today.getMonth() > birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    if (!hasHadBirthday) age -= 1;
    return Math.max(age, 0);
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleSaveChild = async (payload: any) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to save a child profile.');
      return;
    }
    const newChild = {
      id: Date.now().toString(),
      parent_id: user.id,
      first_name: payload.first_name,
      date_of_birth: payload.date_of_birth,
      gender: payload.gender,
      primary_concerns: payload.primary_concerns,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await addChild(newChild);
    setActiveChild(newChild);
    setIsModalVisible(false);
  };

  const tier = (user?.tier_level || 'FREE') as 'FREE' | 'BASIC' | 'PREMIUM';

  // Specific row rendering to match `settings/code.html` rows precisely
  const SettingRow = ({
    icon,
    label,
    rightInfo,
    onPress,
    iconBg = designColors.primaryFixed,
    iconColor = designColors.primary,
    hideBorder = false,
  }: {
    icon: string;
    label: string;
    rightInfo?: React.ReactNode;
    onPress?: () => void;
    iconBg?: string;
    iconColor?: string;
    hideBorder?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.rowContainer,
        !hideBorder && styles.rowBorder
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons
            name={icon as any}
            size={22}
            color={iconColor}
          />
        </View>
        {typeof label === 'string' && !rightInfo ? (
           <Text style={styles.rowLabel}>{label}</Text>
        ) : (
           <View style={styles.rowLabelGroup}>
             <Text style={styles.rowLabel}>{label}</Text>
             {rightInfo}
           </View>
        )}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={designColors.outlineVariant}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* TopAppBar exact match */}
      <SafeAreaView style={{ backgroundColor: designColors.headerBg }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              <SettingRow
                icon="account-outline"
                label={user?.full_name || "Profile Information"}
              />
              <SettingRow
                icon="lock-outline"
                label="Security & Password"
                hideBorder={true}
              />
            </View>
          </View>

          {/* Children Profiles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile_children_section') || 'My children'}</Text>
            <View style={styles.card}>
              {sortedChildren.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="account-child-outline" size={24} color={designColors.outline} />
                  <View style={styles.emptyTextWrap}>
                    <Text style={styles.emptyTitle}>{t('profile_no_children_title') || 'No children added yet'}</Text>
                    <Text style={styles.emptyDesc}>
                      {t('profile_no_children_desc') || 'Add your child to start their personalized therapy plan.'}
                    </Text>
                  </View>
                </View>
              ) : (
                sortedChildren.map((child, index) => {
                  const age = getAge(child.date_of_birth);
                  const isActive = activeChild?.id === child.id;
                  return (
                    <TouchableOpacity
                      key={child.id}
                      style={[styles.childRow, index !== sortedChildren.length - 1 && styles.rowBorder]}
                      onPress={() => setActiveChild(child)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.childAvatar}>
                        <MaterialCommunityIcons name="face-man-profile" size={20} color={designColors.primary} />
                      </View>
                      <View style={styles.childInfo}>
                        <Text style={styles.childName}>{child.first_name}</Text>
                        <Text style={styles.childMeta}>
                          {age !== null
                            ? (t('profile_years_old') || '{age} years old').replace('{age}', String(age))
                            : 'Age not set'}
                        </Text>
                      </View>
                      {isActive && (
                        <View style={styles.activePill}>
                          <Text style={styles.activePillText}>{t('profile_active_pill') || 'Active'}</Text>
                        </View>
                      )}
                      {!isActive && (
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={24}
                          color={designColors.outlineVariant}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
              <TouchableOpacity
                style={styles.addChildRow}
                onPress={() => setIsModalVisible(true)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconContainer, { backgroundColor: designColors.primaryFixed }]}> 
                  <MaterialCommunityIcons name="plus" size={20} color={designColors.primary} />
                </View>
                <Text style={styles.addChildText}>{t('profile_add_child_btn') || 'Add a child'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Subscription Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={styles.card}>
              <SettingRow
                icon="star"
                iconBg={designColors.secondaryFixed}
                iconColor={designColors.secondary}
                label="Current Plan"
                rightInfo={<Text style={styles.metaDataText}>{tier} Tier</Text>}
                onPress={() => navigation.navigate('SubscriptionUpgrade')}
              />
              <SettingRow
                icon="credit-card-outline"
                label="Payment Methods"
                hideBorder={true}
              />
            </View>
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.card}>
              <SettingRow
                icon="bell-ring-outline"
                label="Push Notifications"
                hideBorder={true}
              />
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.card}>
              <SettingRow
                icon="help-circle-outline"
                label="Help Center"
              />
              <SettingRow
                icon="information-outline"
                label="About"
                hideBorder={true}
              />
            </View>
          </View>

          {/* Log Out Button */}
          <View style={styles.logoutSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
              <MaterialCommunityIcons name="logout" size={20} color={designColors.onErrorContainer} style={{ marginRight: 8 }} />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {isModalVisible && (
        <ChildProfileModal
          visible={isModalVisible}
          onSave={handleSaveChild}
          onClose={() => setIsModalVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: designColors.surfaceContainer 
  },
  header: {
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
  headerTitle: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 18,
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  scroll: {
    paddingBottom: 90,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
    maxWidth: 600, // mimicking max-w-2xl mx-auto container logic
    alignSelf: 'stretch',
    width: '100%',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'Nunito',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    color: designColors.onSurfaceVariant,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: designColors.surfaceLowest,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: designColors.surfaceHighest,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16, // using marginRight here as generic React Native gap support requires specific setups
  },
  rowLabelGroup: {
    justifyContent: 'center',
  },
  rowLabel: {
    fontFamily: 'Nunito',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    color: designColors.onSurface,
  },
  metaDataText: {
    fontFamily: 'Nunito',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: designColors.outline,
    marginTop: 2,
  },
  logoutSection: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designColors.errorContainer,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  logoutButtonText: {
    fontFamily: 'Nunito',
    fontSize: 14,
    fontWeight: '800',
    color: designColors.onErrorContainer,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  emptyTextWrap: {
    flex: 1,
  },
  emptyTitle: {
    fontFamily: 'Nunito',
    fontSize: 14,
    fontWeight: '800',
    color: designColors.onSurface,
    marginBottom: 4,
  },
  emptyDesc: {
    fontFamily: 'Nunito',
    fontSize: 12,
    color: designColors.outline,
    lineHeight: 16,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontFamily: 'Nunito',
    fontSize: 14,
    fontWeight: '800',
    color: designColors.onSurface,
  },
  childMeta: {
    fontFamily: 'Nunito',
    fontSize: 12,
    color: designColors.outline,
    marginTop: 2,
  },
  activePill: {
    backgroundColor: designColors.secondaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activePillText: {
    fontFamily: 'Nunito',
    fontSize: 11,
    fontWeight: '700',
    color: designColors.secondary,
    letterSpacing: 0.3,
  },
  addChildRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: designColors.surfaceHighest,
    gap: 16,
  },
  addChildText: {
    fontFamily: 'Nunito',
    fontSize: 14,
    fontWeight: '800',
    color: designColors.primary,
  },
});

export default ProfileScreen;
