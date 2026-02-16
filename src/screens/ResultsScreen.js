import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { plaudKasAPI } from '../api/plaudKas';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const ResultsScreen = ({ route }) => {
  const { sessionId } = route.params;
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('transcriptie');
  const [generating, setGenerating] = useState({
    summary: false,
    actions: false,
    decisions: false
  });

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    try {
      const data = await plaudKasAPI.getResults(sessionId);
      setSession(data);
    } catch (err) {
      console.error('Load results error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (session.summary && session.summary.length > 0) {
      Alert.alert('Info', 'Samenvatting bestaat al');
      return;
    }

    setGenerating(prev => ({ ...prev, summary: true }));
    try {
      const result = await plaudKasAPI.generateSummary(sessionId);
      if (result.success) {
        setSession(prev => ({ ...prev, summary: result.summary }));
        Alert.alert('Succes', 'Samenvatting gegenereerd!');
      }
    } catch (error) {
      Alert.alert('Fout', 'Samenvatting genereren mislukt');
    } finally {
      setGenerating(prev => ({ ...prev, summary: false }));
    }
  };

  const generateActionItems = async () => {
    if (session.actionItems && session.actionItems.length > 0) {
      Alert.alert('Info', 'Actiepunten bestaan al');
      return;
    }

    setGenerating(prev => ({ ...prev, actions: true }));
    try {
      const result = await plaudKasAPI.extractActionItems(sessionId);
      if (result.success) {
        setSession(prev => ({ ...prev, actionItems: result.actionItems }));
        Alert.alert('Succes', 'Actiepunten geëxtraheerd!');
      }
    } catch (error) {
      Alert.alert('Fout', 'Actiepunten extractie mislukt');
    } finally {
      setGenerating(prev => ({ ...prev, actions: false }));
    }
  };

  const generateDecisions = async () => {
    if (session.decisions && session.decisions.length > 0) {
      Alert.alert('Info', 'Besluiten bestaan al');
      return;
    }

    setGenerating(prev => ({ ...prev, decisions: true }));
    try {
      const result = await plaudKasAPI.extractDecisions(sessionId);
      if (result.success) {
        setSession(prev => ({ ...prev, decisions: result.decisions }));
        Alert.alert('Succes', 'Besluiten geëxtraheerd!');
      }
    } catch (error) {
      Alert.alert('Fout', 'Besluiten extractie mislukt');
    } finally {
      setGenerating(prev => ({ ...prev, decisions: false }));
    }
  };

  const parseTranscript = (text) => {
    // This is a simplified version - in production, use proper parsing
    if (!text) return 'Geen transcriptie beschikbaar';
    return text;
  };

  const exportDocument = async () => {
    Alert.alert(
      'Exporteren',
      'Word document genereren...',
      [{ text: 'OK' }]
    );

    try {
      const result = await plaudKasAPI.exportDocument(sessionId);

      if (result.success) {
        // Save file to local filesystem
        const filename = `plaudkas-rapport-${Date.now()}.docx`;
        const fileUri = FileSystem.documentDirectory + filename;

        await FileSystem.writeAsStringAsync(fileUri, result.data.toString('base64'), {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Share the file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          dialogTitle: 'Sla rapport op',
          UTI: 'com.microsoft.word.doc'
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Fout', 'Exporteren mislukt');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22d3ee" />
        <Text style={styles.loadingText}>Laden...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Geen resultaten gevonden</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>
          📄 Dossier
        </Text>
        <Text style={styles.filename}>
          {session.originalFilename}
        </Text>

        {/* Export Button */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={exportDocument}
        >
          <Ionicons name="download" size={20} color="#fff" />
          <Text style={styles.exportButtonText}>📄 Exporteer Word Document</Text>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'transcriptie' && styles.tabActive]}
            onPress={() => setActiveTab('transcriptie')}
          >
            <Text style={[styles.tabText, activeTab === 'transcriptie' && styles.tabTextActive]}>
              📝 Transcriptie
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'samenvatting' && styles.tabActive]}
            onPress={() => setActiveTab('samenvatting')}
          >
            <Text style={[styles.tabText, activeTab === 'samenvatting' && styles.tabTextActive]}>
              📄 Samenvatting
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'acties' && styles.tabActive]}
            onPress={() => setActiveTab('acties')}
          >
            <Text style={[styles.tabText, activeTab === 'acties' && styles.tabTextActive]}>
              ✅ Acties
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'besluiten' && styles.tabActive]}
            onPress={() => setActiveTab('besluiten')}
          >
            <Text style={[styles.tabText, activeTab === 'besluiten' && styles.tabTextActive]}>
              📌 Besluiten
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentCard}>
          {activeTab === 'transcriptie' && (
            <Text style={styles.text}>
              {parseTranscript(session.transcription)}
            </Text>
          )}

          {activeTab === 'samenvatting' && (
            <View>
              {generating.summary ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#22d3ee" />
                  <Text style={styles.loadingText}>Samenvatting genereren...</Text>
                </View>
              ) : session.summary ? (
                <Text style={styles.text}>
                  {session.summary}
                </Text>
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={generateSummary}
                >
                  <Ionicons name="document-text" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Genereer Samenvatting</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {activeTab === 'acties' && (
            <View>
              {generating.actions ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#22d3ee" />
                  <Text style={styles.loadingText}>Actiepunten extraheren...</Text>
                </View>
              ) : session.actionItems && session.actionItems.length > 0 ? (
                session.actionItems.map((item, index) => (
                  <View key={index} style={styles.item}>
                    <Text style={styles.itemTitle}>{item.action}</Text>
                    <Text style={styles.itemOwner}>👤 {item.owner}</Text>
                    <Text style={styles.itemDeadline}>⏰ {item.deadline}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={generateActionItems}
                  >
                    <Ionicons name="list" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Extraher Actiepunten</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {activeTab === 'besluiten' && (
            <View>
              {generating.decisions ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#22d3ee" />
                  <Text style={styles.loadingText}>Besluiten extraheren...</Text>
                </View>
              ) : session.decisions && session.decisions.length > 0 ? (
                session.decisions.map((decision, index) => (
                  <View key={index} style={styles.item}>
                    <Text style={styles.itemTitle}>📌 {decision}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={generateDecisions}
                  >
                    <Ionicons name="flag" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Extraher Besluiten</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22d3ee',
    marginBottom: 10,
  },
  filename: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 20,
  },
  exportButton: {
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#334155',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#22d3ee',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#22d3ee',
  },
  contentCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    minHeight: 400,
  },
  text: {
    color: '#e2e8f0',
    fontSize: 16,
    lineHeight: 24,
  },
  note: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 20,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#22d3ee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    padding: 40,
  },
  item: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  itemTitle: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  itemOwner: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 4,
  },
  itemDeadline: {
    color: '#64748b',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#22d3ee',
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
  },
});

export default ResultsScreen;
