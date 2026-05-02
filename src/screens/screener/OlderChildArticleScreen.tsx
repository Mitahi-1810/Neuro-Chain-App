import React from 'react';
import { StyleSheet, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonCard } from '../../components/CrayonCard';

interface Props {
  navigation: any;
}

const OlderChildArticleScreen: React.FC<Props> = ({ navigation }) => (
  <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.scroll}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
      </TouchableOpacity>

      <Text style={styles.title}>Autism in Older Children</Text>

      <CrayonCard padding={20} style={{ marginBottom: 16 }}>
        <Text style={styles.bodyText}>
          Autism can present differently in older children and adolescents. Social challenges might show up in subtle ways,
          such as difficulty maintaining friendships, understanding social rules, or navigating group dynamics.
        </Text>
        <Text style={[styles.bodyText, { marginTop: 12 }]}
        >
          It is also common for older children to experience co-occurring challenges like anxiety, ADHD, or depression,
          which can overlap with autism traits. A specialist evaluation helps clarify these patterns and recommends the right
          support plan.
        </Text>
      </CrayonCard>

      <CrayonCard padding={20}>
        <Text style={styles.bodyText}>
          If you notice persistent concerns with communication, sensory sensitivity, or rigid routines, consider scheduling
          a clinical evaluation. The earlier a support plan is in place, the better the long-term outcomes.
        </Text>
      </CrayonCard>
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
    marginBottom: 16,
  },
  title: {
    ...typography.h2,
    fontSize: 22,
    marginBottom: 16,
  },
  bodyText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textBody,
    lineHeight: 21,
  },
});

export default OlderChildArticleScreen;
