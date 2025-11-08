import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function PatientCardScreen({ route, navigation }) {
  const { genidocId } = route.params;
  // Pour une vraie app, fetcher les infos patient ici
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Carte GeniDoc</Text>
      <Text style={styles.label}>Votre ID :</Text>
      <Text style={styles.id}>{genidocId}</Text>
      <Button title="Déconnexion" color="#1d06ea" onPress={()=>navigation.replace('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#f5f7fa', padding:20 },
  title: { fontSize:22, color:'#4D3AFF', marginBottom:24, fontWeight:'bold' },
  label: { fontSize:18, color:'#222', marginBottom:8 },
  id: { fontSize:28, color:'#1d06ea', fontWeight:'bold', marginBottom:32 }
});
