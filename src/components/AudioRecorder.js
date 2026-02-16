import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';

const AudioRecorder = ({ onRecordingComplete }) => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef(null);
  const intervalRef = useRef(null);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Toestemming vereist', 'Gelieve toegang te geven tot de microfoon');
        return;
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setRecording(recording);
      setIsRecording(true);
      setDuration(0);

      // Update duration every second
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Recording error:', err);
      Alert.alert('Fout', 'Opstarten opname mislukt');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();

      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const recordingData = {
        uri,
        durationMillis: status.durationMillis,
        type: 'audio/m4a',
        name: `recording_${Date.now()}.m4a`
      };

      setRecording(null);
      setIsRecording(false);
      setDuration(0);

      if (onRecordingComplete) {
        onRecordingComplete(recordingData);
      }

    } catch (err) {
      console.error('Stop recording error:', err);
      Alert.alert('Fout', 'Stoppen opname mislukt');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isRecording ? '🎙️ Opname bezig...' : '🎙️ Nieuwe opname'}
      </Text>

      {isRecording && (
        <Text style={styles.duration}>{formatDuration(duration)}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, isRecording ? styles.buttonStop : styles.buttonRecord]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {isRecording ? '⏹️ Stop' : '🎤 Start Opname'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  duration: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22d3ee',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonRecord: {
    backgroundColor: '#22d3ee',
  },
  buttonStop: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AudioRecorder;
