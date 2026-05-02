import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow, tiers } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { useAuthStore, useChildStore } from '../../store/store';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { Mascot } from '../../components/Mascot';
import { AvatarBubble, SectionTitle } from '../../components/Decorations';
import { ChildProfileModal } from '../../components/ChildProfileModal';

const ProfileScreen: React.FC<any> = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { children, activeChild, setActiveChild, addChild } = useChildStore();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleSaveChild = async (payload: any) => {
    const newChild = {
      id: Date.now().toString(),
      parent_id: user?.id || 'local-parent',
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
  const tierKey = tier.toLowerCase() as 'free' | 'basic' | 'premium';
  const tierColor = tiers[tierKey]?.color || colors.primary;

  const SettingRow = ({
    icon,
    label,
    sub,
    onPress,
    danger,
  }: {
    icon: string;
    label: string;
    sub?: string;
    onPress?: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: danger ? colors.dangerLight : colors.primaryLight },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={18}
          color={danger ? colors.danger : colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, danger && { color: colors.danger }]}>
          {label}
        </Text>
        {sub && <Text style={styles.settingSub}>{sub}</Text>}
      </View>
      {onPress && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={colors.darkGrey}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>My profile</Text>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.85}>
            <MaterialCommunityIcons name="cog-outline" size={20} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        {/* Identity card */}
        <CrayonCard variant="primary" padding={22} style={{ marginBottom: 18 }}>
          <View style={styles.idRow}>
            <AvatarBubble
              initial={user?.full_name?.charAt(0) || '?'}
              size={64}
              bg={colors.secondary}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.idName}>{user?.full_name || 'Parent'}</Text>
              <Text style={styles.idEmail}>{user?.email}</Text>
              <TouchableOpacity
                style={styles.idTier}
                onPress={() => navigation.navigate('SubscriptionUpgrade')}
                activeOpacity={0.85}
              >
                <Text style={styles.idTierText}>
                  {tier} plan {tier !== 'PREMIUM' ? '· upgrade' : ''}
                </Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={12}
                  color={colors.textDark}
                />
              </TouchableOpacity>
            </View>
          </View>
        </CrayonCard>

        {/* Children */}
        <SectionTitle
          title="My children"
          action={{
            label: '+ Add child',
            onPress: () => setIsModalVisible(true),
          }}
        />

        {children.length === 0 ? (
          <CrayonCard padding={24} style={{ alignItems: 'center', marginBottom: 18 }}>
            <Mascot kind="puzzle" size="lg" />
            <Text style={[styles.emptyTitle, { marginTop: 14 }]}>
              No children added yet
            </Text>
            <Text style={styles.emptySub}>
              Add your child to start their personalized therapy plan.
            </Text>
            <CrayonButton
              label="Add a child"
              onPress={() => setIsModalVisible(true)}
              variant="primary"
              size="medium"
              style={{ marginTop: 14 }}
            />
          </CrayonCard>
        ) : (
          <View style={{ gap: 10, marginBottom: 18 }}>
            {children.map((child) => {
              const active = activeChild?.id === child.id;
              const age =
                new Date().getFullYear() -
                new Date(child.date_of_birth).getFullYear();
              return (
                <TouchableOpacity
                  key={child.id}
                  onPress={() => setActiveChild(child)}
                  activeOpacity={0.92}
                  style={[styles.childCard, active && styles.childCardActive]}
                >
                  <AvatarBubble
                    initial={child.first_name?.charAt(0) || '?'}
                    size={48}
                    bg={active ? colors.primary : colors.primaryLight}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.childName,
                        active && { color: colors.primary },
                      ]}
                    >
                      {child.first_name}
                    </Text>
                    <Text style={styles.childMeta}>{age} years old</Text>
                  </View>
                  {active ? (
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>Active</Text>
                    </View>
                  ) : (
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={colors.darkGrey}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Settings */}
        <SectionTitle title="Account" />
        <View style={styles.settingsCard}>
          <SettingRow
            icon="bell-outline"
            label="Notifications"
            sub="Daily reminders, streak nudges"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="translate"
            label="Language"
            sub="English / বাংলা"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="shield-check-outline"
            label="Privacy"
            sub="Vision AI runs on-device only"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="help-circle-outline"
            label="Help & support"
            onPress={() => {}}
          />
        </View>

        <CrayonButton
          label="Log out"
          onPress={handleLogout}
          variant="ghost"
          size="large"
          fullWidth
          style={{ marginTop: 20, marginBottom: 12 }}
        />

        <Text style={styles.versionText}>NeuroChain · v3.0</Text>
      </ScrollView>

      {isModalVisible && (
        <ChildProfileModal
          visible={isModalVisible}
          onSave={handleSaveChild}
          onClose={() => setIsModalVisible(false)}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    ...typography.h1,
    fontSize: 26,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },

  /* Identity */
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  idName: {
    ...typography.h2,
    fontSize: 20,
    color: colors.white,
  },
  idEmail: {
    ...typography.body,
    fontSize: 13,
    color: colors.primaryLight,
    marginTop: 2,
  },
  idTier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  idTierText: {
    ...typography.badge,
    fontSize: 11,
    color: colors.textDark,
    textTransform: 'none',
    letterSpacing: 0.2,
  },

  /* Empty */
  emptyTitle: {
    ...typography.h3,
    fontSize: 16,
  },
  emptySub: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  /* Child card */
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: radius.xl,
    gap: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow.sm,
  },
  childCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  childName: {
    ...typography.h3,
    fontSize: 15,
  },
  childMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  activePill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  activePillText: {
    ...typography.badge,
    fontSize: 10,
    color: colors.white,
    textTransform: 'none',
    letterSpacing: 0.3,
  },

  /* Settings */
  settingsCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
    ...shadow.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 14,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    ...typography.h4,
    fontSize: 14,
  },
  settingSub: {
    ...typography.caption,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 18,
  },

  versionText: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default ProfileScreen;
