import React from 'react';
import { View, StyleSheet, Text, SafeAreaView } from 'react-native';
import { colors } from '../../utils/colors';
import { CrayonButton } from '../../components/CrayonButton';

const SpecialistLoginScreen: React.FC<any> = ({ navigation }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.title}>Specialist Login</Text>
      <Text style={styles.subtitle}>For Healthcare Professionals</Text>
      <CrayonButton
        label="Continue"
        onPress={() => {}}
        variant="primary"
        size="large"
        fullWidth
        style={{ marginTop: 24 }}
      />
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textDark,
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textWarmBrown,
    marginTop: 8,
    fontFamily: 'Inter',
  },
});

export default SpecialistLoginScreen;
