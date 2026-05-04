import React from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleProp, TextStyle } from 'react-native';

interface IconSymbolProps {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const IconSymbol: React.FC<IconSymbolProps> = ({ name, size = 20, color = '#FFF', style }) => (
  <MaterialCommunityIcons name={name} size={size} color={color} style={style} />
);
