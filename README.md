# Lecture Summary Generator

A Next.js web app that generates BIO 101 lecture summaries in the required format using AI. Perfect for quickly creating summaries that can be written in under 5 minutes.

## Features

- Upload lecture content (TXT files) or paste directly
- Add other students' discussion points
- AI-powered summary generation following BIO 101 format
- Copy-to-clipboard functionality
- Clean, responsive UI

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Get a Free Groq API Key

1. Go to [Groq Console](https://console.groq.com/keys)
2. Sign up for a free account
3. Create a new API key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your Groq API key:

```
GROQ_API_KEY=your_actual_api_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and sign in
3. Click "New Project" and import your GitHub repository
4. Add your `GROQ_API_KEY` environment variable in Vercel project settings
5. Deploy!

## Alternative Free LLM APIs

If you want to use a different API, edit `app/api/summarize/route.ts` and update:

- **Google AI Studio (Gemini)**: [https://ai.google.dev/](https://ai.google.dev/)
- **OpenRouter**: [https://openrouter.ai/](https://openrouter.ai/)
- **Together AI**: [https://www.together.ai/](https://www.together.ai/)

## Usage

1. Upload a TXT file or paste your lecture notes
2. (Optional) Add what other students mentioned in class
3. Click "Generate Summary"
4. Copy the formatted summary

The summary follows the required BIO 101 format:
- Sentence 1: Major takeaway with biology language
- Sentence 2: Interesting detail or twist
- Sentence 3: Connection to textbook or external resources
- Additional sentences incorporating peer insights

## Technologies

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Groq API (Llama 3.3 70B)