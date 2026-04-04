"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  createSpeechState,
  handleSpeechResult,
  handleSpeechError,
  type SpeechState,
} from "./speech-recognition";

// Extend Window for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getSpeechRecognitionConstructor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function useSpeechRecognition(onResult: (transcript: string) => void) {
  const [state, setState] = useState<SpeechState>(createSpeechState);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const isSupported = typeof window !== "undefined" && getSpeechRecognitionConstructor() !== null;

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      setState((s) => ({ ...s, error: "Speech recognition is not supported in this browser." }));
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-AU";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      if (last && last[0]) {
        const { transcript } = handleSpeechResult(last[0].transcript);
        setState((s) => ({ ...s, transcript, isListening: false }));
        onResultRef.current(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const error = handleSpeechError(event.error);
      setState((s) => ({ ...s, error, isListening: false }));
    };

    recognition.onend = () => {
      setState((s) => ({ ...s, isListening: false }));
    };

    recognitionRef.current = recognition;
    setState({ isListening: true, transcript: "", error: null });

    try {
      recognition.start();
    } catch {
      setState((s) => ({
        ...s,
        isListening: false,
        error: "Failed to start speech recognition.",
      }));
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setState((s) => ({ ...s, isListening: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    isSupported,
    startListening,
    stopListening,
  };
}
