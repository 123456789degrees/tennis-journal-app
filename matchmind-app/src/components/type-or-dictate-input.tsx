import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Global requirement (TRANSFER-PACKAGE.md §3): every free-text field supports
// type OR voice dictation. On web this uses the browser's built-in
// SpeechRecognition API, which works out of the box in the browser preview.
// On native there's no dictation backend wired up yet — real device speech
// recognition needs a custom dev build (Expo Go can't host third-party native
// modules) — so the mic button explains that instead of silently doing
// nothing. Typing works everywhere regardless.
const webSpeechSupported =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

interface TypeOrDictateFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

export function TypeOrDictateField({
  value,
  onChangeText,
  placeholder,
  multiline,
}: TypeOrDictateFieldProps) {
  const theme = useTheme();
  const [listening, setListening] = useState(false);
  const [focused, setFocused] = useState(false);
  const recognitionRef = useRef<any>(null);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    if (!webSpeechSupported) {
      // eslint-disable-next-line no-alert
      alert(
        'Voice dictation needs a custom dev build on a real device. Typing works fine for now.'
      );
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onChangeText(value ? `${value} ${transcript}` : transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <View style={styles.row}>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            borderColor: focused ? theme.primary : theme.border,
            borderWidth: focused ? 2 : 1,
            color: theme.text,
            backgroundColor: theme.backgroundElement,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <Pressable
        onPress={toggleListening}
        style={({ pressed }) => [
          styles.micButton,
          {
            borderColor: listening ? theme.danger : theme.border,
            backgroundColor: listening ? theme.danger : theme.backgroundElement,
            opacity: pressed ? 0.75 : 1,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <ThemedText>{listening ? '⏹️' : '🎤'}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  input: {
    flex: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  micButton: {
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
});
