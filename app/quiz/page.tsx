'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

export default function QuizResponse() {
  const [paperContent, setPaperContent] = useState('');
  const [newsArticleUrl, setNewsArticleUrl] = useState('');
  const [response, setResponse] = useState<{
    essentialResult: string;
    logic: string;
    newsConnection: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    const fileName = file.name.toLowerCase();

    // Check file type
    const isText = fileName.endsWith('.txt');
    const isPDF = fileName.endsWith('.pdf');
    const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].some(ext => fileName.endsWith(ext));

    if (!isText && !isPDF && !isImage) {
      setError('Please upload a .txt, .pdf, or image file (PNG, JPG, etc.)');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let text = '';

      if (isText) {
        text = await file.text();
      } else if (isPDF) {
        // Send PDF to API for parsing
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to parse PDF');
        }

        const data = await response.json();
        text = data.text;
      } else if (isImage) {
        // Send image to API for OCR
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/parse-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to extract text from image');
        }

        const data = await response.json();
        text = data.text;
      }

      setPaperContent(text);
      setError('');

      // Auto-generate response after file upload
      await generateResponseWithContent(text);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to read file. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const generateResponseWithContent = async (content: string) => {
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const response = await fetch('/api/quiz-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperContent: content, newsArticleUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate response');
        return;
      }

      setResponse(data);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const generateResponse = async () => {
    if (!paperContent.trim()) {
      setError('Please add the paper content first');
      return;
    }

    await generateResponseWithContent(paperContent);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            BIO 101 Reading Quiz Helper
          </h1>
          <p className="text-gray-600">Generate structured quiz responses following guidelines</p>
          <Link
            href="/"
            className="inline-block mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Lecture Summarizer
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">

          {/* Step 1: Paper Content */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-600 text-white text-sm font-bold">
                1
              </span>
              <h2 className="text-xl font-semibold text-gray-900">
                Add Research Paper Content (e.g., Pang et al 2023)
              </h2>
            </div>

            {/* File Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <div className="space-y-2">
                <div className="text-4xl">📄</div>
                <p className="text-lg font-medium text-gray-700">
                  Drop a file here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  .txt, .pdf, or images (PNG, JPG, etc.)
                </p>
              </div>
            </div>

            {/* Text Input */}
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Or paste your content:</p>
              <textarea
                value={paperContent}
                onChange={(e) => setPaperContent(e.target.value)}
                placeholder="Paste the research paper text here..."
                rows={8}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none text-gray-900"
              />
            </div>
          </div>

          {/* Step 2: News Article URL (Optional) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-400 text-white text-sm font-bold">
                2
              </span>
              <h2 className="text-xl font-semibold text-gray-900">
                News Article URL <span className="text-gray-500 text-sm font-normal">(Optional)</span>
              </h2>
            </div>
            <input
              type="url"
              value={newsArticleUrl}
              onChange={(e) => setNewsArticleUrl(e.target.value)}
              placeholder="https://www.sciencedaily.com/..."
              className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-gray-900"
            />
            <p className="text-sm text-gray-500 mt-2">
              From Science Daily, The Conversation, or Eureka Alerts
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-700 font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateResponse}
            disabled={loading || !paperContent.trim()}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-all text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Generating Response...
              </span>
            ) : (
              'Generate Quiz Response'
            )}
          </button>

          {/* Response Output */}
          {response && (
            <div className="space-y-6 animate-fadeIn">
              {/* Question 1: Essential Result */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📌</span>
                  <h3 className="text-xl font-semibold text-gray-900">Q1: Essential Result</h3>
                </div>
                <div className="p-6 bg-blue-50 border-2 border-blue-300 rounded-xl">
                  <p className="text-gray-800 leading-relaxed">
                    {response.essentialResult}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(response.essentialResult)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  📋 Copy
                </button>
              </div>

              {/* Question 1 Part 2: Logic */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔬</span>
                  <h3 className="text-xl font-semibold text-gray-900">Q1 Part 2: Experimental Logic</h3>
                </div>
                <div className="p-6 bg-green-50 border-2 border-green-300 rounded-xl">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {response.logic}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(response.logic)}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                >
                  📋 Copy
                </button>
              </div>

              {/* Question 2: News Connection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔗</span>
                  <h3 className="text-xl font-semibold text-gray-900">Q2: News Article Connection</h3>
                </div>
                <div className="p-6 bg-purple-50 border-2 border-purple-300 rounded-xl">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {response.newsConnection}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(response.newsConnection)}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                >
                  📋 Copy
                </button>
              </div>

              {/* URL Field Reminder */}
              {newsArticleUrl && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔗</span>
                    <h3 className="text-xl font-semibold text-gray-900">Article URL</h3>
                  </div>
                  <div className="p-6 bg-gray-50 border-2 border-gray-300 rounded-xl">
                    <p className="text-gray-800 leading-relaxed break-all">
                      {newsArticleUrl}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(newsArticleUrl)}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                  >
                    📋 Copy URL
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Format Guide */}
          <details className="mt-6">
            <summary className="cursor-pointer text-purple-600 font-medium hover:text-purple-700">
              📖 Quiz Response Format Guide
            </summary>
            <div className="mt-3 p-4 bg-gray-50 rounded-xl text-sm text-gray-700 space-y-2">
              <p><strong>Q1 Part 1:</strong> One sentence describing the most essential result in your own words</p>
              <p><strong>Q1 Part 2:</strong> 2-3 sentences summarizing the experimental logic (comparison, approach, response variable)</p>
              <p><strong>Q2:</strong> 3-5 sentences describing the key result from a news article and its biological connection to the paper</p>
            </div>
          </details>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Powered by AI • Optimized for BIO 101 Reading Quiz format</p>
        </div>
      </div>
    </div>
  );
}
