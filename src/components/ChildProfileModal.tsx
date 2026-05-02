import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../utils/colors';
import { CrayonButton } from './CrayonButton';
import { CrayonCard } from './CrayonCard';

const PRIMARY_CONCERNS = [
  'Social Development',
  'Communication',
  'Behavior & Routine',
  'Sensory Sensitivities',
  'Motor Skills',
];

type GenderOption = 'boy' | 'girl' | 'prefer_not_to_say';

interface Props {
  visible: boolean;
  onSave: (payload: {
    first_name: string;
    date_of_birth: string;
    gender: GenderOption;
    primary_concerns: string[];
  }) => void;
  onClose?: () => void;
}

export const ChildProfileModal: React.FC<Props> = ({ visible, onSave, onClose }) => {
  const [firstName, setFirstName] = useState('');
  const [dob, setDob] = useState<Date>(new Date());
  const [gender, setGender] = useState<GenderOption>('boy');
  const [primaryConcerns, setPrimaryConcerns] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formattedDob = useMemo(
    () => dob.toISOString().split('T')[0],
    [dob]
  );

  const toggleConcern = (value: string) => {
    setPrimaryConcerns((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const validate = () => {
    if (!firstName.trim()) {
      Alert.alert('Missing Name', 'Please enter your child\'s first name.');
      return false;
    }

    if (firstName.trim().length > 40) {
      Alert.alert('Name Too Long', 'Name must be 40 characters or less.');
      return false;
    }

    const today = new Date();
    const oldestAllowed = new Date();
    oldestAllowed.setFullYear(today.getFullYear() - 12);

    if (dob > today) {
      Alert.alert('Invalid Date', 'Date of birth cannot be in the future.');
      return false;
    }

    if (dob < oldestAllowed) {
      Alert.alert('Invalid Date', 'Date of birth must be within 12 years.');
      return false;
    }

    if (primaryConcerns.length === 0) {
      Alert.alert('Select Concerns', 'Please choose at least one concern.');
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      first_name: firstName.trim(),
      date_of_birth: dob.toISOString(),
      gender,
      primary_concerns: primaryConcerns,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
          >
            <Text style={styles.title}>Create Child Profile</Text>
            <Text style={styles.subtitle}>
              Please complete your child\'s profile to continue.
            </Text>

            <CrayonCard style={styles.section} variant="default">
              <Text style={styles.label}>Child\'s First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                placeholderTextColor={colors.darkGrey}
                value={firstName}
                onChangeText={setFirstName}
              />
            </CrayonCard>

            <CrayonCard style={styles.section} variant="default">
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
              >
                <Text style={styles.dateText}>{formattedDob}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dob}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    const currentDate = selectedDate || dob;
                    setShowDatePicker(Platform.OS === 'ios');
                    setDob(currentDate);
                  }}
                />
              )}
            </CrayonCard>

            <CrayonCard style={styles.section} variant="default">
              <Text style={styles.label}>Gender</Text>
              <View style={styles.row}>
                {[
                  { value: 'boy', label: 'Boy' },
                  { value: 'girl', label: 'Girl' },
                  { value: 'prefer_not_to_say', label: 'Prefer Not to Say' },
                ].map((option) => {
                  const isActive = gender === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setGender(option.value as GenderOption)}
                      style={[
                        styles.chip,
                        isActive ? styles.chipActive : styles.chipInactive,
                      ]}
                    >
                      <Text
                        style={
                          isActive ? styles.chipTextActive : styles.chipText
                        }
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </CrayonCard>

            <CrayonCard style={styles.section} variant="default">
              <Text style={styles.label}>Primary Concern</Text>
              <View style={styles.rowWrap}>
                {PRIMARY_CONCERNS.map((concern) => {
                  const isActive = primaryConcerns.includes(concern);
                  return (
                    <TouchableOpacity
                      key={concern}
                      onPress={() => toggleConcern(concern)}
                      style={[
                        styles.chip,
                        isActive ? styles.chipActive : styles.chipInactive,
                      ]}
                    >
                      <Text
                        style={
                          isActive ? styles.chipTextActive : styles.chipText
                        }
                      >
                        {concern}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </CrayonCard>

            <CrayonButton
              label="Save Child Profile"
              onPress={handleSave}
              variant="primary"
              size="large"
              fullWidth
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    backgroundColor: colors.cream,
    borderRadius: 20,
    maxHeight: '90%',
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textWarmBrown,
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  section: {
    marginBottom: 12,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  input: {
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.lightGrey,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.textDark,
    fontFamily: 'Inter',
  },
  dateButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  dateText: {
    fontSize: 16,
    color: colors.textDark,
    fontFamily: 'Inter',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.lightGrey,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
    fontFamily: 'Inter',
  },
  chipTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
    fontFamily: 'Inter',
  },
});
