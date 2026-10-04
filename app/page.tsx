'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/wav' });
        transcribe(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.current.start();
      setRecording(true);
      setError('');
    } catch {
      setError('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) transcribe(file);
  };

  const transcribe = async (blob: Blob) => {
    setLoading(true);
    setError('');
    setTranscript('');
    try {
      const fd = new FormData();
      fd.append('audio', blob, 'audio.wav');
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setTranscript(data.transcript);
    } catch {
      setError('Transcription failed');
    }
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>🎙️ Urdu ASR Demo</h1>
      <p>Whisper-small fine-tuned on Urdu speech. WER 29.43%.</p>
      <p>
        <a href="https://huggingface.co/Naveef/whisper-small-ur" target="_blank" rel="noopener">
          Model on Hugging Face
        </a>
        {' | '}
        <a href="https://github.com/muhammadnaveedgurmani/urdu-asr" target="_blank" rel="noopener">
          GitHub
        </a>
      </p>

      <div style={{ margin: '2rem 0', display: 'flex', gap: '1rem' }}>
        {!recording ? (
          <button onClick={startRecording} style={btnStyle}>🔴 Record</button>
        ) : (
          <button onClick={stopRecording} style={{...btnStyle, background: '#dc2626'}}>⏹ Stop</button>
        )}
        <label style={{...btnStyle, cursor: 'pointer'}}>
          📁 Upload Audio
          <input type="file" accept="audio/*" onChange={handleFile} style={{ display: 'none' }} />
        </label>
      </div>

      {loading && <p>Transcribing...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {transcript && (
        <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: 8, marginTop: '1rem' }}>
          <h3>Transcript:</h3>
          <p style={{ fontSize: '1.2rem', direction: 'rtl' }}>{transcript}</p>
        </div>
      )}

      <div style={{ marginTop: '3rem', fontSize: '0.9rem', color: '#666' }}>
        <h3>About</h3>
        <p>
          Fine-tuned OpenAI Whisper-small (244M params) on 4,000 Urdu utterances.
          Trained on Google Colab T4 GPU. Model: Naveef/whisper-small-ur.
        </p>
      </div>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  background: '#0C56A5',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontSize: '1rem',
};
