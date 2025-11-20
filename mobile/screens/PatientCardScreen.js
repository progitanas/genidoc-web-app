import React from 'react';
import { View, Text, Button } from 'react-native';

export default function PatientCardScreen({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 12 }}>Patient Card (placeholder)</Text>
      <Button title="Back" onPress={() => navigation.goBack()} />
    </View>
  );
}
