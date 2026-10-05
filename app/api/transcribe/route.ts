import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error: 'Live transcription jald aa rahi hai. Model Hugging Face par deploy ho raha hai. Tab tak neeche diye gaye code se local par chalayein.',
    },
    { status: 503 }
  );
}
