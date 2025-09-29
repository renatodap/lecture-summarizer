'use client';

import { useState } from 'react';

export default function Home() {
  const [lectureContent, setLectureContent] = useState('');
  const [studentInputs, setStudentInputs] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const text = await file.text();
    setLectureContent(text);
  };

  const generateSummary = async () => {
    if (!lectureContent.trim()) {
      alert('Please provide lecture content');
      return;
    }

    setLoading(true);
    setSummary('');

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureContent, studentInputs }),
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      alert('Error generating summary. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Lecture Summary Generator
          </h1>
          <p className="text-gray-600 mb-6">
            Generate a 5-minute lecture summary in BIO 101 format
          </p>

          <div className="space-y-6">
            {/* Lecture Content Section */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Lecture Content
              </label>
              <div className="mb-3">
                <input
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {fileName && (
                  <p className="mt-2 text-sm text-green-600">Loaded: {fileName}</p>
                )}
              </div>
              <textarea
                value={lectureContent}
                onChange={(e) => setLectureContent(e.target.value)}
                placeholder="Or paste lecture content here..."
                className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
              />
            </div>

            {/* Student Inputs Section */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Other Students' Inputs (Optional)
              </label>
              <textarea
                value={studentInputs}
                onChange={(e) => setStudentInputs(e.target.value)}
                placeholder="Enter what other students mentioned in class discussion..."
                className="w-full h-32 p-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generateSummary}
              disabled={loading || !lectureContent.trim()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-lg transition-colors duration-200 text-lg"
            >
              {loading ? 'Generating Summary...' : 'Generate Summary'}
            </button>

            {/* Summary Output */}
            {summary && (
              <div className="mt-6">
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Your Lecture Summary
                </label>
                <div className="p-6 bg-green-50 border-2 border-green-300 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {summary}
                  </p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(summary)}
                  className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                >
                  Copy to Clipboard
                </button>
              </div>
            )}

            {/* Format Guide */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Summary Format:</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Sentence 1: Major takeaway with biology language</li>
                <li>Sentence 2: Detail or twist that caught your attention</li>
                <li>Sentence 3: Connection to textbook or additional resources</li>
                <li>Additional sentences incorporating other students' insights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}