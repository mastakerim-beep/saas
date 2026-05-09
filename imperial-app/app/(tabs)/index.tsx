import React from 'react';
import { StyleSheet, ScrollView, View, Text, SafeAreaView } from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/Theme';
import { ImperialCard } from '../../components/ImperialCard';
import { Sparkles, Clock, Zap } from 'lucide-react-native';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome Back,</Text>
          <Text style={styles.userName}>Mr. Kerim</Text>
        </View>

        {/* AI Insight Card */}
        <ImperialCard 
          title="AI Morning Brief" 
          subtitle="Autonomous Intelligence v2"
          delay={200}
        >
          <View style={styles.insightRow}>
            <Sparkles size={20} color={Colors.primary} />
            <Text style={styles.insightText}>
              Today's recovery focus: Lower Body. Based on your Technogym data, 
              we recommend the 'Cryo-Recovery' session.
            </Text>
          </View>
        </ImperialCard>

        {/* Next Appointment Card */}
        <ImperialCard 
          title="Next Session" 
          subtitle="Imperial Spa & Wellness"
          delay={400}
        >
          <View style={styles.sessionRow}>
            <Clock size={20} color={Colors.textSecondary} />
            <Text style={styles.sessionText}>14:30 - Deep Tissue Massage</Text>
          </View>
          <View style={styles.statusBadge}>
            <Zap size={14} color={Colors.background} />
            <Text style={styles.statusText}>SURGE DISCOUNT APPLIED</Text>
          </View>
        </ImperialCard>

        {/* Placeholder for future biometric chart */}
        <View style={styles.placeholderChart}>
           <Text style={styles.placeholderText}>Biometric Energy Graph</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100, // Tab bar margin
  },
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  greeting: {
    color: Colors.textSecondary,
    fontSize: Typography.body.fontSize,
  },
  userName: {
    color: Colors.text,
    fontSize: Typography.h1.fontSize,
    fontWeight: Typography.h1.fontWeight,
    letterSpacing: Typography.h1.letterSpacing,
  },
  insightRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  insightText: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sessionText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: Spacing.md,
    gap: 4,
  },
  statusText: {
    color: Colors.background,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  placeholderChart: {
    height: 180,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  }
});
