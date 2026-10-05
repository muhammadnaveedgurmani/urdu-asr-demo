'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [progress, setProgress] = useState('');
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const transcriber = useRef<any>(null);

  const loadModel = async () => {
    if (transcriber.current || modelLoading) return;
    setModelLoading(true);
    setError('');
    try {
      setProgress('Model download ho raha hai...');
      // @ts-ignore - loaded via CDN (@xenova/transformers v2)
      const { pipeline } = window.transformers;
      transcriber.current = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-small',
        {
          // @ts-ignore
          progress_callback: (p: any) => {
            if (p.status === 'downloading') setProgress('Model download: ' + Math.round(p.progress || 0) + '%');
          }
        }
      );
      setModelReady(true);
      setProgress('');
    } catch (e) {
      console.error(e);
      setError('Model load nahi hua. Internet check karein.');
    }
    setModelLoading(false);
  };

  useEffect(() => {
    loadModel();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(blob));
        transcribe(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.current.start();
      setRecording(true);
      setError('');
      setTranscript('');
    } catch {
      setError('Microphone ki ijazat nahi mili');
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioURL(URL.createObjectURL(file));
      transcribe(file);
    }
  };

  const transcribe = async (blob: Blob) => {
    if (!transcriber.current) {
      setError('Model abhi load ho raha hai. Thoda wait karein.');
      return;
    }
    setLoading(true);
    setError('');
    setTranscript('');
    try {
      const audioUrl = URL.createObjectURL(blob);
      const result = await transcriber.current(audioUrl, {
        language: 'urdu',
        task: 'transcribe',
      });
      setTranscript(result.text || '');
    } catch (e) {
      console.error(e);
      setError('Transcription nakam hui. Dobara try karein.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.badge}>🎙️ AI Powered</div>
          <h1 style={styles.title}>Urdu Speech to Text</h1>
          <p style={styles.subtitle}>
            Whisper-small model jo Urdu bolne ko samajhta hai.<br />
            100% browser me chalta hai. Koi server nahi.
          </p>
          {!modelReady && (
            <div style={styles.modelStatus}>
              {modelLoading ? (
                <><div style={styles.spinnerSmall}></div> {progress || 'Model load ho raha hai...'}</>
              ) : (
                <button onClick={loadModel} style={styles.loadBtn}>Model Load Karein</button>
              )}
            </div>
          )}
          {modelReady && <div style={styles.readyBadge}>✅ Model tayyar hai</div>}
          <div style={styles.stats}>
            <div style={styles.stat}>
              <div style={styles.statNum}>29.4%</div>
              <div style={styles.statLabel}>Word Error Rate</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNum}>4,000</div>
              <div style={styles.statLabel}>Training Samples</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNum}>244M</div>
              <div style={styles.statLabel}>Parameters</div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.btnRow}>
            {!recording ? (
              <button onClick={startRecording} disabled={!modelReady} style={{...styles.btn, ...styles.recordBtn, opacity: modelReady ? 1 : 0.5}}>
                <span style={{fontSize: '1.3rem'}}>🎤</span> Record Karein
              </button>
            ) : (
              <button onClick={stopRecording} style={{...styles.btn, ...styles.stopBtn}}>
                <span style={styles.pulse}>⏺</span> Recording... Rokain
              </button>
            )}
            <label style={{...styles.btn, ...styles.uploadBtn, opacity: modelReady ? 1 : 0.5}}>
              📁 Audio Upload Karein
              <input type="file" accept="audio/*" onChange={handleFile} style={{ display: 'none' }} disabled={!modelReady} />
            </label>
          </div>

          {audioURL && (
            <audio controls src={audioURL} style={{ width: '100%', marginTop: '1rem' }} />
          )}

          {loading && (
            <div style={styles.loading}>
              <div style={styles.spinner}></div>
              <p>AI sun raha hai...</p>
            </div>
          )}

          {error && <div style={styles.error}>⚠️ {error}</div>}

          {transcript && (
            <div style={styles.result}>
              <div style={styles.resultLabel}>📝 Transcript</div>
              <p style={styles.transcriptText}>{transcript}</p>
              <button
                onClick={() => navigator.clipboard.writeText(transcript)}
                style={styles.copyBtn}
              >
                📋 Copy Karein
              </button>
            </div>
          )}
        </div>

        <div style={styles.info}>
          <h3 style={styles.infoTitle}>Model ke baare mein</h3>
          <p style={styles.infoText}>
            Ye OpenAI ke Whisper-small model ka fine-tuned version hai,
            jo 4,000 Urdu audio samples par train hua hai (WER 29.43%).
            Demo browser me hi chalta hai taake foran kaam kare.
            Asal fine-tuned model yahan se download karein:
          </p>
          <div style={styles.links}>
            <a href="https://huggingface.co/Naveef/whisper-small-ur" target="_blank" rel="noopener" style={styles.link}>
              🤗 Hugging Face Model
            </a>
            <a href="https://github.com/muhammadnaveedgurmani/urdu-asr" target="_blank" rel="noopener" style={styles.link}>
              💻 GitHub Code
            </a>
          </div>
        </div>

        <footer style={styles.footer}>
          Built by Muhammad Naveed • Whisper-small fine-tuned for Urdu
        </footer>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0C56A5 100%)',
    padding: '2rem 1rem',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  container: { maxWidth: 680, margin: '0 auto' },
  header: { textAlign: 'center', marginBottom: '2rem', color: 'white' },
  badge: {
    display: 'inline-block', background: 'rgba(255,255,255,0.15)',
    padding: '0.4rem 1rem', borderRadius: 20, fontSize: '0.85rem', marginBottom: '1rem',
  },
  title: { fontSize: '2.5rem', margin: '0 0 0.5rem', fontWeight: 800 },
  subtitle: { fontSize: '1.05rem', opacity: 0.85, lineHeight: 1.6 },
  modelStatus: { marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' },
  loadBtn: { background: '#22c55e', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  readyBadge: { marginTop: '1rem', color: '#86efac', fontWeight: 600 },
  stats: { display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' },
  stat: { textAlign: 'center' },
  statNum: { fontSize: '1.8rem', fontWeight: 800, color: '#93c5fd' },
  statLabel: { fontSize: '0.8rem', opacity: 0.7 },
  card: {
    background: 'white', borderRadius: 16, padding: '2rem',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  btnRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  btn: {
    flex: 1, minWidth: 200, padding: '1rem', border: 'none', borderRadius: 12,
    fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
  },
  recordBtn: { background: 'linear-gradient(135deg, #dc2626, #991b1b)' },
  stopBtn: { background: 'linear-gradient(135deg, #7f1d1d, #450a0a)' },
  uploadBtn: { background: 'linear-gradient(135deg, #0C56A5, #1e3a8a)', cursor: 'pointer' },
  pulse: { animation: 'pulse 1s infinite' },
  loading: { textAlign: 'center', padding: '2rem', color: '#666' },
  spinner: {
    width: 40, height: 40, margin: '0 auto 1rem',
    border: '4px solid #e5e7eb', borderTop: '4px solid #0C56A5',
    borderRadius: '50%', animation: 'spin 1s linear infinite',
  },
  spinnerSmall: {
    width: 20, height: 20,
    border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white',
    borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block',
  },
  error: {
    background: '#fef2f2', color: '#dc2626', padding: '1rem',
    borderRadius: 8, marginTop: '1rem',
  },
  result: {
    background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 12,
    padding: '1.5rem', marginTop: '1.5rem',
  },
  resultLabel: { fontWeight: 700, marginBottom: '0.5rem', color: '#166534' },
  transcriptText: {
    fontSize: '1.3rem', direction: 'rtl', textAlign: 'right',
    background: 'white', padding: '1rem', borderRadius: 8, lineHeight: 1.8,
  },
  copyBtn: {
    marginTop: '1rem', padding: '0.5rem 1rem', background: '#166534',
    color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer',
  },
  info: {
    background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '1.5rem',
    marginTop: '1.5rem', color: 'white',
  },
  infoTitle: { margin: '0 0 0.5rem' },
  infoText: { opacity: 0.85, lineHeight: 1.6, fontSize: '0.95rem' },
  links: { display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' },
  link: {
    color: '#93c5fd', textDecoration: 'none', fontWeight: 600,
    background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: 8,
  },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: '2rem', fontSize: '0.85rem' },
};
