import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { plaudKasAPI } from '../api/plaudKas';
import { openclawAPI } from '../api/openclaw';

const ChatScreen = ({ route }) => {
  const { sessionId } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const data = await plaudKasAPI.getResults(sessionId);
      setSession(data);

      // If there's existing chat history
      if (data.history && data.history.length > 0) {
        setMessages(data.history);
      } else {
        // Welcome message
        setMessages([
          {
            role: 'assistant',
            content: 'Hallo! Ik heb de transcriptie gelezen. Wat wil je weten over deze vergadering?'
          }
        ]);
      }
    } catch (err) {
      console.error('Load session error:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Get response from Plaud Kas chat endpoint
      const response = await openclawAPI.sendMessage(userMessage, {
        sessionId,
        transcription: session?.transcription
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.answer || 'Sorry, er ging iets mis.' }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, er ging iets mis. Probeer opnieuw.' }]);
    } finally {
      setLoading(false);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💬 Chat</Text>
        <Text style={styles.subtitle}>Vraag over de transcriptie</Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.messageUser : styles.messageAssistant
            ]}
          >
            <Text style={[
              styles.messageText,
              msg.role === 'user' ? styles.messageTextUser : styles.messageTextAssistant
            ]}>
              {msg.content}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.messageBubble, styles.messageAssistant]}>
            <Text style={styles.messageTextAssistant}>
              ⏳ Denkt...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Stel een vraag..."
          placeholderTextColor="#64748b"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendButtonText}>🚀</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22d3ee',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
  },
  messageUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#22d3ee',
  },
  messageAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextUser: {
    color: '#0f172a',
    fontWeight: '600',
  },
  messageTextAssistant: {
    color: '#e2e8f0',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    maxHeight: 120,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#22d3ee',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
  },
  sendButtonText: {
    fontSize: 24,
  },
});

export default ChatScreen;
