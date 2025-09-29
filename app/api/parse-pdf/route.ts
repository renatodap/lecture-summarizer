import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to avoid build-time issues with pdf-parse
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Dynamic import to prevent build-time loading
    const pdf = (await import('pdf-parse')).default;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    console.log('Parsing PDF:', fileName);

    if (!fileName.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('PDF buffer size:', buffer.length);

    // Parse PDF
    const data = await pdf(buffer);
    const text = data.text;

    console.log('PDF parsing complete. Text length:', text?.length || 0);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text found in PDF. The file might be empty or contain only images.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error) {
    console.error('PDF parsing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to parse PDF: ${errorMessage}` },
      { status: 500 }
    );
  }
}