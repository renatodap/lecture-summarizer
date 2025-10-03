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
    const systemPrompt = `You are a helpful assistant that creates responses for BIO 101 reading quiz questions. You provide thoughtful, biologically accurate answers that demonstrate understanding of scientific papers and their connections to broader biological concepts.`;

    // Question 1 Part 1: Essential Result
    const q1Part1Prompt = `Based on this research paper, write ONE sentence describing in your own words the most essential result. Focus only on what the result is, not why it's important.

PAPER CONTENT:
${paperContent}

Provide ONLY one clear, concise sentence.`;

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
        temperature: 0.6,
        max_tokens: 150,
      }),
    });

    if (!q1Part1Response.ok) {
      throw new Error('Failed to generate essential result');
    }

    const q1Part1Data = await q1Part1Response.json();
    const essentialResult = q1Part1Data.choices[0]?.message?.content || '';

    // Question 1 Part 2: Experimental Logic
    const q1Part2Prompt = `Based on this research paper, summarize in 2-3 sentences the experimental logic that led to the essential result. Focus on the big picture approach: what was the comparison of interest, how was the response variable determined, and what approach allowed them to discover this result?

PAPER CONTENT:
${paperContent}

ESSENTIAL RESULT:
${essentialResult}

Provide 2-3 clear sentences explaining the logic.`;

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
        temperature: 0.6,
        max_tokens: 250,
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
      const q2Prompt = `Based on this research paper and the news article information, write 3-5 good sentences that:
1. Describe what you perceive as the key result of the news article
2. Explain the connection you see to the research paper using biological language

RESEARCH PAPER:
${paperContent}

${newsArticleContent ? `NEWS ARTICLE CONTENT:\n${newsArticleContent}` : `NEWS ARTICLE URL:\n${newsArticleUrl}\n(Note: Could not fetch article content automatically. Please make reasonable connections based on the URL and typical content from Science Daily, The Conversation, or Eureka Alerts)`}

Write in first person ("I found...", "I see a connection...") and use biological terminology. Provide 3-5 sentences, no fewer, no more.`;

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
          temperature: 0.7,
          max_tokens: 400,
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
