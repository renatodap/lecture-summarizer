import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Dynamic import to prevent build issues
    const { createWorker } = await import('tesseract.js');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
    const isValidImage = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidImage) {
      return NextResponse.json(
        { error: 'File must be an image (PNG, JPG, JPEG, GIF, BMP, or WebP)' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create Tesseract worker
    const worker = await createWorker('eng');

    try {
      // Perform OCR
      const { data } = await worker.recognize(buffer);
      const text = data.text;

      if (!text || text.trim().length === 0) {
        return NextResponse.json(
          { error: 'No text found in image. Please make sure the image contains readable text.' },
          { status: 400 }
        );
      }

      return NextResponse.json({ text });
    } finally {
      await worker.terminate();
    }
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from image. Please try again.' },
      { status: 500 }
    );
  }
}