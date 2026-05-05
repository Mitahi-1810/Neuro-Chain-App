import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../utils/colors';
import { typography } from '../utils/typography';
import { CrayonButton } from './CrayonButton';

interface ChildProfileRequiredProps {
  featureName: string;
  description?: string;
}

export const ChildProfileRequired: React.FC<ChildProfileRequiredProps> = ({
  featureName,
  description,
}) => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="account-child" size={28} color={colors.primary} />
        </View>
        <Text style={styles.title}>Add a child profile to continue</Text>
        <Text style={styles.subtitle}>
          {description || `Create a child profile in Profile to access ${featureName}.`}
        </Text>
        <CrayonButton
          label="Create child profile"
          onPress={() => navigation.navigate('Profile')}
          variant="primary"
          size="large"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    ...shadow.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
});
