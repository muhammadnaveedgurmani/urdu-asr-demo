import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get('audio') as Blob;
    if (!audio) {
      return NextResponse.json({ error: 'Koi audio nahi mili' }, { status: 400 });
    }

    // Use HF Inference API with base Whisper (deployed by providers)
    // Our fine-tuned model Naveef/whisper-small-ur is not yet picked up by any provider
    const buffer = Buffer.from(await audio.arrayBuffer());

    const hfRes = await fetch(
      'https://api-inference.huggingface.co/models/openai/whisper-small',
      {
        method: 'POST',
        headers: { 'Content-Type': 'audio/wav' },
        body: buffer,
      }
    );

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      console.error('HF API error:', hfRes.status, errText);
      return NextResponse.json(
        { error: 'Transcription service masroof hai. Thodi der baad try karein.' },
        { status: 503 }
      );
    }

    const data = await hfRes.json();
    const transcript = data.text || '';
    return NextResponse.json({ transcript });
  } catch (e) {
    console.error('Transcribe error:', e);
    return NextResponse.json(
      { error: 'Transcription nakam hui. Dobara try karein.' },
      { status: 500 }
    );
  }
}
