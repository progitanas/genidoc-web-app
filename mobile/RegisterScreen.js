import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    const data = { username, email, birthdate, password };
    try {
      const res = await fetch('http://<VOTRE_IP>:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        Alert.alert('Succès', 'Compte créé !', [
          { text: 'OK', onPress: () => navigation.replace('PatientCard', { genidocId: result.genidocId }) }
        ]);
      } else {
        Alert.alert('Erreur', result.message || 'Erreur lors de la création du compte');
      }
    } catch {
      Alert.alert('Erreur', 'Erreur réseau');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Créer un compte GeniDoc</Text>
      <TextInput style={styles.input} placeholder="Identifiant patient" value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Date de naissance (YYYY-MM-DD)" value={birthdate} onChangeText={setBirthdate} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Créer le compte" onPress={handleRegister} color="#1d06ea" />
      <Text style={{marginTop:16}}>Déjà inscrit ? <Text style={{color:'#4D3AFF'}} onPress={()=>navigation.replace('Login')}>Se connecter</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#f5f7fa', padding:20 },
  title: { fontSize:22, color:'#4D3AFF', marginBottom:24, fontWeight:'bold' },
  input: { width:'100%', backgroundColor:'#eaf1ff', borderRadius:10, borderWidth:1, borderColor:'#d6d6f7', padding:14, marginBottom:16, fontSize:16 }
});
