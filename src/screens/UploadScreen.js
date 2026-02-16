import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AudioRecorder from '../components/AudioRecorder';
import { plaudKasAPI } from '../api/plaudKas';

const UploadScreen = ({ navigation, onUploadSuccess }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedSessionId, setUploadedSessionId] = useState(null);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'video/*'],
        copyToCacheDirectory: true
      });

      if (!result.canceled) {
        await uploadFile(result.assets[0]);
      }
    } catch (err) {
      console.error('File picker error:', err);
      Alert.alert('Fout', 'Bestand kiezen mislukt');
    }
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadedSessionId(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await plaudKasAPI.uploadFile(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      Alert.alert('✅ Geüpload!', 'Bestand succesvol geüpload');

      setUploadedSessionId(response.sessionId);

      // Auto-start transcriptie
      await plaudKasAPI.transcribe(response.sessionId);

      // Navigate to results
      setTimeout(() => {
        onUploadSuccess(response.sessionId);
        navigation.navigate('Results', { sessionId: response.sessionId });
      }, 1000);

    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('❌ Fout', err.message || 'Upload mislukt');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRecordingComplete = async (recording) => {
    await uploadFile(recording);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          📐 Plaud Kas Android
        </Text>
        <Text style={styles.subtitle}>
          Upload audio of neem op
        </Text>

        {/* File Upload Button */}
        <TouchableOpacity
          style={[styles.button, styles.uploadButton]}
          onPress={handleFilePick}
          disabled={isUploading}
        >
          <Text style={styles.buttonText}>
            📁 Kies Audio/Video Bestand
          </Text>
        </TouchableOpacity>

        {/* OR divider */}
        <Text style={styles.orText}>— OF —</Text>

        {/* Audio Recorder */}
        <AudioRecorder onRecordingComplete={handleRecordingComplete} />

        {/* Progress */}
        {isUploading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              📤 Uploaden... {uploadProgress}%
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
          </View>
        )}

        {/* Info */}
        {uploadedSessionId && !isUploading && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              ✅ Transcriptie gestart voor ID: {uploadedSessionId}
            </Text>
          </View>
        )}
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22d3ee',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#22d3ee',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButton: {
    marginBottom: 30,
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 18,
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#1e293b',
    borderRadius: 12,
  },
  progressText: {
    color: '#22d3ee',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22d3ee',
    borderRadius: 4,
  },
  successBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#10b98120',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  successText: {
    color: '#10b981',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default UploadScreen;
