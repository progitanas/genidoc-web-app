import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Button,
} from 'react-native';
import { fetchAppointments } from '../services/api';
import { WebView } from 'react-native-webview';

export default function HomeScreen({ token, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [openJitsi, setOpenJitsi] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAppointments(token);
        if (res && res.success) setAppointments(res.data || []);
      } catch (e) {
        console.warn(e);
      }
      setLoading(false);
    })();
  }, []);

  if (openJitsi) {
    return <WebView source={{ uri: openJitsi }} style={{ flex: 1 }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes rendez-vous</Text>
        <Button title="Se déconnecter" onPress={onLogout} />
      </View>
      <FlatList
        data={appointments}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.patientName || item.patient || 'Patient'}
            </Text>
            <Text>{item.date || item.scheduledAt}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  setOpenJitsi(
                    'https://meet.jit.si/genidoc-' + (item.id || Date.now())
                  );
                }}
              >
                <Text style={{ color: '#fff' }}>Téléconsult</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={{ padding: 20 }}>Aucun rendez-vous</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: { fontSize: 20, fontWeight: '700' },
  card: { padding: 14, borderBottomWidth: 1, borderColor: '#f1f1f1' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  btn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
});
