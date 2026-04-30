import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ChildProfileModal } from './ChildProfileModal';
import { useAuthStore, useChildStore } from '../store/store';

export const ChildProfileGate: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { activeChild, children, addChild, setActiveChild } = useChildStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!activeChild && children.length === 0) {
      setVisible(true);
    }
  }, [activeChild, children.length]);

  const handleSaveChildProfile = (payload: {
    first_name: string;
    date_of_birth: string;
    gender: 'boy' | 'girl' | 'prefer_not_to_say';
    primary_concerns: string[];
  }) => {
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

    addChild(newChild);
    setActiveChild(newChild);
    setVisible(false);

    const dob = new Date(payload.date_of_birth);
    const now = new Date();
    const ageInMonths =
      (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (ageInMonths >= 16 && ageInMonths <= 30) {
      navigation.navigate('AutismScreener');
    }
  };

  return <ChildProfileModal visible={visible} onSave={handleSaveChildProfile} />;
};
