import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Colors, BorderRadius, Spacing, Typography } from '../constants/Theme';

interface ImperialCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
}

export const ImperialCard = ({ title, subtitle, children, style, delay = 0 }: ImperialCardProps) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 800, delay }}
      style={[styles.container, style]}
    >
      <BlurView intensity={20} tint="dark" style={styles.blur}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {children}
        </View>
      </BlurView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: Spacing.md,
  },
  blur: {
    padding: Spacing.md,
  },
  content: {
    gap: Spacing.sm,
  },
  header: {
    marginBottom: Spacing.xs,
  },
  title: {
    color: Colors.primary,
    fontSize: Typography.h2.fontSize,
    fontWeight: Typography.h2.fontWeight,
    letterSpacing: Typography.h2.letterSpacing,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.caption.fontWeight,
  },
});
