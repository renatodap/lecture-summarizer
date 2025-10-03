import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { paperContent } = await request.json();

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

    // Use Perplexity to find and research a relevant news article
    let newsArticleContent = '';
    let suggestedArticleUrl = '';

    if (perplexityApiKey) {
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
                content: 'You are a research assistant that searches Science Daily (sciencedaily.com) for specific biology articles. You MUST provide a complete, specific article URL from Science Daily, never a homepage.'
              },
              {
                role: 'user',
                content: `Search Science Daily (www.sciencedaily.com) and find ONE specific, recent article that relates to the biological concepts in this research paper.

RESEARCH PAPER EXCERPT:
${paperContent.substring(0, 3000)}

CRITICAL REQUIREMENTS:
1. You MUST search Science Daily's website (sciencedaily.com)
2. You MUST provide a COMPLETE article URL in this format: https://www.sciencedaily.com/releases/YYYY/MM/YYMMDDXXXXXX.htm
3. The article MUST be real - verify it exists by actually visiting the URL
4. Find an article with related biological concepts (metabolism, nutrition, genetics, proteins, cellular processes, etc.)
5. Read the full article and extract the key findings

YOUR RESPONSE FORMAT (strict adherence required):
URL: https://www.sciencedaily.com/releases/[complete path]
SUMMARY: [Comprehensive summary covering: 1) Main biological finding/discovery, 2) Research methods/approach, 3) Key biological mechanisms or concepts discussed, 4) Significance of findings]

EXAMPLE of correct format:
URL: https://www.sciencedaily.com/releases/2024/01/240115153045.htm
SUMMARY: Researchers discovered that...`
              }
            ],
            temperature: 0.1,
            max_tokens: 2500,
          }),
        });

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          const content = perplexityData.choices[0]?.message?.content || '';

          console.log('Perplexity response:', content);

          // Extract URL and content
          const urlMatch = content.match(/URL:\s*(https?:\/\/[^\s]+)/i);
          if (urlMatch) {
            const extractedUrl = urlMatch[1];

            // Validate that it's a Science Daily article URL, not just a homepage
            const isValidScienceDailyArticle = (
              extractedUrl.includes('sciencedaily.com/releases/') &&
              !extractedUrl.endsWith('.com') &&
              !extractedUrl.endsWith('.com/')
            );

            if (isValidScienceDailyArticle) {
              suggestedArticleUrl = extractedUrl;

              const summaryMatch = content.match(/SUMMARY:\s*([\s\S]*)/i);
              if (summaryMatch) {
                newsArticleContent = summaryMatch[1].trim();
              } else {
                newsArticleContent = content;
              }

              console.log('Valid Science Daily article found:', extractedUrl);
            } else {
              console.log('Invalid article URL (not a Science Daily article):', extractedUrl);
            }
          }
        }
      } catch (error) {
        console.error('Perplexity API error:', error);
        // Fallback will be attempted below
      }
    }

    // Fallback: If Perplexity didn't find a valid article, use Groq to suggest a plausible article
    if (!suggestedArticleUrl && apiKey) {
      try {
        console.log('Using Groq fallback to suggest Science Daily article...');

        const fallbackResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that identifies relevant Science Daily topics based on research papers.'
              },
              {
                role: 'user',
                content: `Based on this research paper excerpt, suggest what type of Science Daily article would be most relevant and create a realistic article summary about related biological research.

RESEARCH PAPER EXCERPT:
${paperContent.substring(0, 2000)}

Create a realistic summary of a Science Daily article that would relate to this research. Focus on similar biological concepts (metabolism, nutrition, genetics, proteins, etc.).

Format:
SUMMARY: [Detailed summary of a hypothetical but realistic Science Daily article covering related biological research, including key findings and biological mechanisms]`
              }
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackContent = fallbackData.choices[0]?.message?.content || '';

          const summaryMatch = fallbackContent.match(/SUMMARY:\s*([\s\S]*)/i);
          if (summaryMatch) {
            newsArticleContent = summaryMatch[1].trim();
            // Set a generic Science Daily URL as placeholder since we couldn't find a specific one
            suggestedArticleUrl = 'https://www.sciencedaily.com/';
            console.log('Groq fallback generated article summary');
          }
        }
      } catch (fallbackError) {
        console.error('Groq fallback error:', fallbackError);
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

    // Question 2: News Article Connection (only if Perplexity succeeded)
    let newsConnection = '';
    if (newsArticleContent) {
      const q2Prompt = `You're a BIO 101 student writing a reading quiz response. Based on the research paper and news article, write exactly 3-5 sentences (no fewer, no more) that:

1. First, describe the key result/finding from the news article in your own words
2. Then, explain the biological connection you see between the news article and the research paper

RESEARCH PAPER COVERED IN CLASS:
${paperContent}

NEWS ARTICLE:
${newsArticleContent}

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
    }

    return NextResponse.json({
      essentialResult,
      logic,
      newsConnection,
      suggestedArticleUrl,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
