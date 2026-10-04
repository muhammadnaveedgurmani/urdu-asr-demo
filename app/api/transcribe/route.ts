import { NextRequest, NextResponse } from 'next/server';

const HF_MODEL = 'Naveef/whisper-small-ur';
const HF_API = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('audio') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const response = await fetch(HF_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/wav',
      },
      body: buffer,
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Model API error: ${err}` }, { status: 502 });
    }

    const result = await response.json();
    
    return NextResponse.json({
      transcript: result.text || '',
      model: HF_MODEL,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
