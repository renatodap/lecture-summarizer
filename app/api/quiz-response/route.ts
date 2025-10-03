import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { paperContent, newsArticleUrl } = await request.json();

    if (!paperContent || paperContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please add the paper content first' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      console.error('GROQ_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'API key not configured. Please contact the administrator.' },
        { status: 500 }
      );
    }

    // If news article URL is provided, use Perplexity to research it
    let newsArticleContent = '';
    if (newsArticleUrl && perplexityApiKey) {
      try {
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${perplexityApiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that extracts and summarizes scientific news articles. Focus on the key biological findings and experimental approaches.'
              },
              {
                role: 'user',
                content: `Please read and summarize the key biological findings from this article: ${newsArticleUrl}. Include: 1) The main result/discovery, 2) The biological concepts involved, 3) Any experimental methods mentioned.`
              }
            ],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        });

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          newsArticleContent = perplexityData.choices[0]?.message?.content || '';
        }
      } catch (error) {
        console.error('Perplexity API error:', error);
        // Continue without news article content
      }
    }

    // Generate responses using Groq
    const systemPrompt = `You are a college student in BIO 101 writing reading quiz responses. Write naturally like a student would - clear and accurate, but conversational and genuine. Avoid overly formal or flowery language. Sound like you actually read and understood the paper, not like you're trying to impress anyone.`;

    // Question 1 Part 1: Essential Result
    const q1Part1Prompt = `Based on this research paper, write ONE sentence describing in your own words the most essential result. Don't explain why it's important, just state what the result is.

PAPER CONTENT:
${paperContent}

Write like a college student - straightforward and clear. Use simple, direct language. Provide ONLY one sentence.`;

    const q1Part1Response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: q1Part1Prompt }
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    if (!q1Part1Response.ok) {
      throw new Error('Failed to generate essential result');
    }

    const q1Part1Data = await q1Part1Response.json();
    const essentialResult = q1Part1Data.choices[0]?.message?.content || '';

    // Question 1 Part 2: Experimental Logic
    const q1Part2Prompt = `Based on this research paper, summarize in 2-3 sentences the experimental logic that led to the essential result. Focus on the big picture:
- What comparison did they make?
- What did they measure (response variable)?
- What was their overall approach?

PAPER CONTENT:
${paperContent}

ESSENTIAL RESULT:
${essentialResult}

Write like a college student explaining the experiment to a classmate. Be clear and straightforward - focus on WHAT they did, not fancy descriptions. Use 2-3 sentences, no more.`;

    const q1Part2Response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: q1Part2Prompt }
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!q1Part2Response.ok) {
      throw new Error('Failed to generate experimental logic');
    }

    const q1Part2Data = await q1Part2Response.json();
    const logic = q1Part2Data.choices[0]?.message?.content || '';

    // Question 2: News Article Connection
    let newsConnection = '';
    if (newsArticleUrl) {
      const q2Prompt = `You're a BIO 101 student writing a reading quiz response. Based on the research paper and news article, write exactly 3-5 sentences (no fewer, no more) that:

1. First, describe the key result/finding from the news article in your own words
2. Then, explain the biological connection you see between the news article and the research paper

RESEARCH PAPER COVERED IN CLASS:
${paperContent}

${newsArticleContent ? `NEWS ARTICLE:\n${newsArticleContent}` : `NEWS ARTICLE URL:\n${newsArticleUrl}\n(Note: Make intelligent connections based on what articles from Science Daily, The Conversation, or Eureka Alerts typically cover)`}

IMPORTANT WRITING STYLE:
- Sound like a college student, not a textbook or AI
- Use specific biological terms and concepts (genes, proteins, pathways, mechanisms, etc.)
- Be thoughtful but natural - like you're explaining to a friend who also took the class
- Don't be overly formal or use phrases like "fascinating" or "remarkable"
- Make genuine, specific connections using proper biological language
- Keep it to 3-5 sentences exactly`;

      const q2Response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: q2Prompt }
          ],
          temperature: 0.85,
          max_tokens: 500,
        }),
      });

      if (!q2Response.ok) {
        throw new Error('Failed to generate news connection');
      }

      const q2Data = await q2Response.json();
      newsConnection = q2Data.choices[0]?.message?.content || '';
    } else {
      newsConnection = 'Please provide a news article URL to generate this response.';
    }

    return NextResponse.json({
      essentialResult,
      logic,
      newsConnection,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
