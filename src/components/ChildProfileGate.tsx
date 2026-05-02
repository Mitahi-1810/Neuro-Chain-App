import React, { useEffect, useState } from 'react';
import { useAuthStore, useChildStore } from '../store/store';
import { ChildProfileModal } from './ChildProfileModal';

export const ChildProfileGate: React.FC = () => {
  const { user } = useAuthStore();
  const { activeChild, children, addChild, setActiveChild } = useChildStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user?.role !== 'PARENT') {
      setVisible(false);
      return;
    }
    if (!activeChild && children.length === 0) {
      setVisible(true);
    }
  }, [activeChild, children.length, user?.role]);

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
  };

  return <ChildProfileModal visible={visible} onSave={handleSaveChildProfile} />;
};
