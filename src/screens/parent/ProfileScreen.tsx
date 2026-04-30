import React, { useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../utils/colors';
import { useAuthStore, useChildStore } from '../../store/store';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Parent Profile</Text>

        <CrayonCard style={styles.userCard}>
          <MaterialCommunityIcons name="account-circle" size={48} color={colors.primary} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.full_name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <TouchableOpacity 
              style={styles.tierBadge}
              onPress={() => navigation.navigate('SubscriptionUpgrade')}
            >
              <Text style={styles.tierText}>{user?.tier_level} PLAN (TAP TO UPGRADE)</Text>
            </TouchableOpacity>
          </View>
        </CrayonCard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Children</Text>
          <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={24} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {children.map((child) => (
          <TouchableOpacity
            key={child.id}
            onPress={() => setActiveChild(child)}
            style={[styles.childCard, activeChild?.id === child.id && styles.childCardActive]}
          >
            <MaterialCommunityIcons 
              name="face-man-profile" 
              size={32} 
              color={activeChild?.id === child.id ? colors.primary : colors.darkGrey} 
            />
            <View style={styles.childInfo}>
              <Text style={[styles.childName, activeChild?.id === child.id && styles.childNameActive]}>
                {child.first_name}
              </Text>
              <Text style={styles.childAge}>
                {new Date().getFullYear() - new Date(child.date_of_birth).getFullYear()} years old
              </Text>
            </View>
            {activeChild?.id === child.id && (
              <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}

        <CrayonButton
          label="Log Out"
          onPress={handleLogout}
          variant="danger"
          size="large"
          fullWidth
          style={styles.logoutButton}
        />
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
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textDark,
    fontFamily: 'Poppins',
    marginBottom: 24,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 32,
  },
  userInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    fontFamily: 'Poppins',
  },
  userEmail: {
    fontSize: 14,
    color: colors.darkGrey,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  tierBadge: {
    marginTop: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tierText: {
    color: colors.textDark,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Poppins',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    fontFamily: 'Poppins',
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  childCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.cream,
  },
  childInfo: {
    flex: 1,
    marginLeft: 16,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGrey,
    fontFamily: 'Poppins',
  },
  childNameActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  childAge: {
    fontSize: 12,
    color: colors.textWarmBrown,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  logoutButton: {
    marginTop: 32,
  },
});

export default ProfileScreen;
