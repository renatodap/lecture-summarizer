import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { lectureContent, studentInputs } = await request.json();

    if (!lectureContent) {
      return NextResponse.json(
        { error: 'Lecture content is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please add GROQ_API_KEY to your .env.local file' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a helpful assistant that creates biology lecture summaries for BIO 101 students. The summary should be written in the style that can be completed in under 5 minutes and follow this specific format:

REQUIRED FORMAT:
1. First sentence: State the major takeaway using at least one element of biology language
2. Second sentence: Give some detail or twist that caught attention
3. Third sentence: Mention a connection to the textbook or additional resources not presented in class (can reference real scientific sources)
4. Additional sentences (if student inputs are provided): Incorporate other students' contributions using phrases like "[Student] mentioned [concept] which reminded me of..." or "In contrast to what [Student] said..." or "[Student] incorporated [concept] but I didn't make that connection. Instead, I thought..."

STYLE GUIDELINES:
- Write in first person ("I learned", "I was surprised", "I found")
- Use casual academic tone
- Keep the summary concise but substantive
- Include specific scientific terms and concepts
- Make connections between concepts
- Show curiosity and engagement with the material`;

    const userPrompt = `Create a lecture summary based on this lecture content:

LECTURE CONTENT:
${lectureContent}

${studentInputs ? `OTHER STUDENTS' INPUTS:\n${studentInputs}\n` : ''}

Write a complete lecture summary following the BIO 101 format. Make it personal and engaging while maintaining academic rigor.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate summary. Please check your API key and try again.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || 'Failed to generate summary';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}