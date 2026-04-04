// Pure logic for speech recognition state management.
// The React hook (useSpeechRecognition) wraps these with browser APIs.

export type SpeechState = {
  isListening: boolean;
  transcript: string;
  error: string | null;
};

export function createSpeechState(): SpeechState {
  return {
    isListening: false,
    transcript: "",
    error: null,
  };
}

export function handleSpeechResult(rawTranscript: string): {
  transcript: string;
  isFinal: boolean;
} {
  return {
    transcript: rawTranscript.trim(),
    isFinal: true,
  };
}

export function handleSpeechError(errorCode: string): string {
  switch (errorCode) {
    case "not-allowed":
      return "Microphone access denied. Please allow microphone access in your browser settings.";
    case "no-speech":
      return "No speech detected. Please try again.";
    case "network":
      return "Network error. Please check your connection.";
    case "aborted":
      return "Speech recognition was stopped.";
    default:
      return "Speech recognition error. Please try again.";
  }
}
