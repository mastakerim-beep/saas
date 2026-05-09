import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Theme';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>YOUR IMPERIAL PROFILE</Text>
      <Text style={styles.sub}>SETTING UP SECURE ACCESS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  text: { color: Colors.primary, fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  sub: { color: Colors.textSecondary, fontSize: 12, marginTop: 10 }
});
