import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let worker = null;

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

    console.log('Starting OCR processing for:', fileName);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create Tesseract worker with explicit configuration
    worker = await createWorker('eng', 1, {
      logger: (m) => console.log('OCR:', m),
    });

    console.log('Worker created, starting recognition...');

    // Perform OCR
    const { data } = await worker.recognize(buffer);
    const text = data.text;

    console.log('OCR completed, text length:', text?.length || 0);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text found in image. Please make sure the image contains readable text.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error) {
    console.error('OCR error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to extract text from image: ${errorMessage}` },
      { status: 500 }
    );
  } finally {
    if (worker) {
      try {
        await worker.terminate();
        console.log('Worker terminated successfully');
      } catch (e) {
        console.error('Error terminating worker:', e);
      }
    }
  }
}