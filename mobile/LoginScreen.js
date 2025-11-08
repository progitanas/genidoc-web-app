import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    let payload = { password };
    if (username.includes('@')) payload.email = username;
    else payload.username = username;
    try {
      const res = await fetch('http://<VOTRE_IP>:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        // navigation.navigate('PatientCard', { genidocId: result.genidocId });
        Alert.alert('Succès', 'Connexion réussie !');
      } else {
        Alert.alert('Erreur', result.message || 'Identifiants invalides');
      }
    } catch {
      Alert.alert('Erreur', 'Erreur réseau');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion GeniDoc</Text>
      <TextInput
        style={styles.input}
        placeholder="Email ou identifiant"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Se connecter" onPress={handleLogin} color="#1d06ea" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#f5f7fa', padding:20 },
  title: { fontSize:22, color:'#4D3AFF', marginBottom:24, fontWeight:'bold' },
  input: { width:'100%', backgroundColor:'#eaf1ff', borderRadius:10, borderWidth:1, borderColor:'#d6d6f7', padding:14, marginBottom:16, fontSize:16 }
});
