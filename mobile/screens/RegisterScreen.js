import React from 'react';
import { View, Text, Button } from 'react-native';

export default function RegisterScreen({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 12 }}>Register (placeholder)</Text>
      <Button title="Back to Login" onPress={() => navigation.goBack()} />
    </View>
  );
}
