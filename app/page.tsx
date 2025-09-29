'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [lectureContent, setLectureContent] = useState('');
  const [studentInputs, setStudentInputs] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.txt')) {
      setError('Please upload a .txt file');
      return;
    }

    try {
      const text = await file.text();
      setLectureContent(text);
      setError('');
    } catch {
      setError('Failed to read file. Please try again.');
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

  const generateSummary = async () => {
    if (!lectureContent.trim()) {
      setError('Please add lecture content first');
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureContent, studentInputs }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate summary');
        return;
      }

      setSummary(data.summary);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            BIO 101 Lecture Summarizer
          </h1>
          <p className="text-gray-600">Generate your lecture summary in seconds</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">

          {/* Step 1: Lecture Content */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold">
                1
              </span>
              <h2 className="text-xl font-semibold text-gray-900">
                Add Lecture Content
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
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <div className="space-y-2">
                <div className="text-4xl">📄</div>
                <p className="text-lg font-medium text-gray-700">
                  Drop a .txt file here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Upload your lecture notes as a text file
                </p>
              </div>
            </div>

            {/* Text Input */}
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Or paste your content:</p>
              <textarea
                value={lectureContent}
                onChange={(e) => setLectureContent(e.target.value)}
                placeholder="Paste your lecture notes here..."
                rows={8}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none text-gray-900"
              />
            </div>
          </div>

          {/* Step 2: Student Inputs (Optional) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-400 text-white text-sm font-bold">
                2
              </span>
              <h2 className="text-xl font-semibold text-gray-900">
                Add Classmate Insights <span className="text-gray-500 text-sm font-normal">(Optional)</span>
              </h2>
            </div>
            <textarea
              value={studentInputs}
              onChange={(e) => setStudentInputs(e.target.value)}
              placeholder="Example: Sarah mentioned that telomeres shorten with age. Mike found an article about SNPs affecting alcohol tolerance..."
              rows={4}
              className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none text-gray-900"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-700 font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateSummary}
            disabled={loading || !lectureContent.trim()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-all text-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Generating Summary...
              </span>
            ) : (
              'Generate Summary'
            )}
          </button>

          {/* Summary Output */}
          {summary && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <h3 className="text-xl font-semibold text-gray-900">Your Summary</h3>
              </div>
              <div className="p-6 bg-green-50 border-2 border-green-300 rounded-xl">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {summary}
                </p>
              </div>
              <button
                onClick={copyToClipboard}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
              >
                📋 Copy to Clipboard
              </button>
            </div>
          )}

          {/* Format Guide */}
          <details className="mt-6">
            <summary className="cursor-pointer text-indigo-600 font-medium hover:text-indigo-700">
              📖 Summary Format Guide
            </summary>
            <div className="mt-3 p-4 bg-gray-50 rounded-xl text-sm text-gray-700 space-y-2">
              <p><strong>Sentence 1:</strong> Major takeaway with biology terminology</p>
              <p><strong>Sentence 2:</strong> Interesting detail that caught your attention</p>
              <p><strong>Sentence 3:</strong> Connection to textbook or research</p>
              <p><strong>Additional:</strong> Reference classmate insights if provided</p>
            </div>
          </details>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Powered by AI • Optimized for BIO 101 format</p>
        </div>
      </div>
    </div>
  );
}