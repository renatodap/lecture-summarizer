import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to avoid build-time issues with pdf-parse
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Dynamic import to prevent build-time loading
  const pdf = (await import('pdf-parse')).default;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const data = await pdf(buffer);
    const text = data.text;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text found in PDF. The file might be empty or contain only images.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error('PDF parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse PDF. Please make sure it contains readable text.' },
      { status: 500 }
    );
  }
}