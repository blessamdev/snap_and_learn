/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Eye,
  RefreshCw,
  Lightbulb,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  GraduationCap,
  Globe,
  X,
  AlertCircle
} from 'lucide-react';
import { StudyMode, AnalyzeResponse, SampleTestCase, QuizQuestion } from './types';
import { compressImage, CompressionResult } from './utils/imageCompressor';
import { SAMPLE_TEST_CASES } from './data/sampleCases';

export default function App() {
  // App state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);
  const [mode, setMode] = useState<StudyMode>('explain');
  const [question, setQuestion] = useState<string>('');
  const [swahiliSummary, setSwahiliSummary] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'study' | 'samples' | 'guide'>('study');

  // Request & analysis state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStepText, setLoadingStepText] = useState<string>('Analyzing photo...');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimitWait, setRateLimitWait] = useState<number | null>(null);

  // Interactive Quiz state
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<number, number>>({});
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);

  // Hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading animation message rotation
  useEffect(() => {
    if (!isLoading) return;

    const messages = [
      'Compressing photo for faster upload...',
      'Gemma 4 is inspecting your study material...',
      'Reading logic formulas and circuit values...',
      'Double-checking step-by-step reasoning...',
      'Preparing helpful explanations for you...',
    ];

    let index = 0;
    setLoadingStepText(messages[0]);
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingStepText(messages[index]);
    }, 2400);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Rate limit countdown effect
  useEffect(() => {
    if (rateLimitWait === null || rateLimitWait <= 0) return;
    const timer = setInterval(() => {
      setRateLimitWait((prev) => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitWait]);

  // Handle image selection and client-side compression
  const handleImageFile = async (file: File) => {
    setErrorMessage(null);
    try {
      setIsLoading(true);
      setLoadingStepText('Compressing photo for mobile efficiency...');
      const compressed = await compressImage(file, 1280, 0.82);
      setSelectedImage(compressed.dataUrl);
      setCompressionInfo(compressed);
      setResult(null);
      setUserQuizAnswers({});
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load one of the 5 sample test cases
  const handleSelectSample = async (sample: SampleTestCase) => {
    setErrorMessage(null);
    setResult(null);
    setUserQuizAnswers({});
    setMode(sample.recommendedMode);
    setQuestion(sample.suggestedQuestion);

    try {
      setIsLoading(true);
      setLoadingStepText('Loading sample test case...');
      const compressed = await compressImage(sample.imageDataUrl, 1280, 0.85);
      setSelectedImage(compressed.dataUrl);
      setCompressionInfo(compressed);
      setActiveTab('study');
    } catch (err: any) {
      setErrorMessage('Could not load sample case. Please try another.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send photo and settings to /api/analyze
  const handleAnalyze = async () => {
    if (!selectedImage) {
      setErrorMessage('Please snap or upload a photo first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    setUserQuizAnswers({});

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: compressionInfo?.mimeType || 'image/jpeg',
          mode,
          question: question.trim() || undefined,
          swahiliSummary,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setRateLimitWait(data.retryAfter || 30);
        }
        throw new Error(data.message || data.error || `Server returned ${response.status}`);
      }

      setResult(data);
    } catch (err: any) {
      console.error('Analyze failed:', err);
      setErrorMessage(err?.message || 'Unable to connect to the study tutor. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to snap another photo
  const handleReset = () => {
    setSelectedImage(null);
    setCompressionInfo(null);
    setResult(null);
    setUserQuizAnswers({});
    setErrorMessage(null);
    setQuestion('');
  };

  // Switch mode on the same photo
  const handleSwitchModeAndAnalyze = (newMode: StudyMode) => {
    setMode(newMode);
    setUserQuizAnswers({});
    // Trigger analysis with new mode
    setTimeout(() => {
      handleAnalyzeWithMode(newMode);
    }, 50);
  };

  const handleAnalyzeWithMode = async (targetMode: StudyMode) => {
    if (!selectedImage) return;
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    setUserQuizAnswers({});

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: compressionInfo?.mimeType || 'image/jpeg',
          mode: targetMode,
          question: question.trim() || undefined,
          swahiliSummary,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || `Server returned ${response.status}`);
      }
      setResult(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error running analysis in new mode.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quiz option selection
  const handleSelectQuizAnswer = (questionIndex: number, optionIndex: number) => {
    setUserQuizAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  // Compute quiz score
  const quizScore = result?.quiz?.reduce((score, q, idx) => {
    return userQuizAnswers[idx] === q.answer_index ? score + 1 : score;
  }, 0) || 0;

  // Copy explanation to clipboard
  const handleCopyNotes = () => {
    if (!result) return;
    let textToCopy = `=== Snap and Learn Analysis ===\nModel: ${result.model_used}\n\n`;
    textToCopy += `What I See:\n${result.what_i_see}\n\n`;

    if (result.explanation_steps && result.explanation_steps.length > 0) {
      textToCopy += `Explanation Steps:\n`;
      result.explanation_steps.forEach((step, idx) => {
        textToCopy += `${idx + 1}. ${step}\n`;
      });
      textToCopy += '\n';
    }

    if (result.mistake_check) {
      textToCopy += `Mistake Check:\n`;
      if (result.mistake_check.praise) textToCopy += `Praise: ${result.mistake_check.praise}\n`;
      textToCopy += `First Error: ${result.mistake_check.first_error}\n`;
      textToCopy += `Why: ${result.mistake_check.why}\n`;
      textToCopy += `Hint: ${result.mistake_check.hint}\n`;
      textToCopy += `Corrected Step: ${result.mistake_check.corrected_step}\n\n`;
    }

    if (result.swahili_summary) {
      textToCopy += `Muhtasari wa Kiswahili:\n${result.swahili_summary}\n\n`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 pb-12">
      {/* Hidden file inputs for Camera and Gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
      />

      {/* Top Mobile-First Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-sm shadow-teal-700/20">
              <Camera className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900">
                  Snap &amp; Learn
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800 border border-teal-200">
                  Gemma 4
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">CS &amp; Physics Tutor • Kenya</p>
            </div>
          </div>

          {/* Quick tab switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('study')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'study' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Study
            </button>
            <button
              onClick={() => setActiveTab('samples')}
              className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                activeTab === 'samples' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Samples</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full px-4 pt-4 flex-1">
        {/* Sample Test Cases View (when activeTab === 'samples') */}
        {activeTab === 'samples' && (
          <section className="mb-6 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>5 Demo Test Cases</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Tap any case to test Gemma 4 immediately with verified test material.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('study')}
                className="text-xs text-slate-500 hover:text-slate-800 p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {SAMPLE_TEST_CASES.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="group p-3 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50/70 hover:bg-teal-50/40 transition-all cursor-pointer flex gap-3 items-start"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0 relative">
                    <img src={sample.imageDataUrl} alt={sample.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[9px] text-white text-center py-0.5 truncate px-1">
                      {sample.category}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 truncate">
                        {sample.title}
                      </h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        {sample.recommendedMode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{sample.expectedBehavior}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 mt-1">
                      Test this case <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Home Screen: Photo Upload, Mode Picker & Question */}
        {!result && (
          <div className="space-y-4">
            {/* Quick Demo Carousel Chips */}
            <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Try 1-Click Test Scenarios:
                </span>
                <button
                  onClick={() => setActiveTab('samples')}
                  className="text-[11px] font-semibold text-teal-700 hover:underline"
                >
                  View All (5)
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {SAMPLE_TEST_CASES.map((tc) => (
                  <button
                    key={tc.id}
                    onClick={() => handleSelectSample(tc)}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/50 text-left transition-all"
                  >
                    <div className="text-xs font-semibold text-slate-800">{tc.title}</div>
                    <div className="text-[10px] text-slate-500">{tc.category}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Selection Area */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              {!selectedImage ? (
                <div className="space-y-3">
                  <div className="text-center py-4 px-2">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mb-3">
                      <Camera className="w-8 h-8 stroke-[1.8]" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">Photograph Your Notes or Code</h2>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                      Works on handwritten K-maps, C compiler errors, circuits, or physics equations.
                    </p>
                  </div>

                  {/* Primary Big Mobile Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full min-h-[52px] px-4 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-sm shadow-teal-700/20 flex items-center justify-center gap-2.5 transition-all"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Snap with Camera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full min-h-[52px] px-4 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 flex items-center justify-center gap-2.5 transition-all"
                    >
                      <Upload className="w-5 h-5 text-slate-600" />
                      <span>Upload Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Selected Photo Preview */
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-950 max-h-72 flex items-center justify-center">
                    <img
                      src={selectedImage}
                      alt="Uploaded study material"
                      className="w-full h-auto max-h-72 object-contain"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        onClick={() => setShowImageModal(true)}
                        className="px-2 py-1 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-medium rounded-md backdrop-blur-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Fullscreen
                      </button>
                      <button
                        onClick={handleReset}
                        className="px-2 py-1 bg-rose-600/90 hover:bg-rose-700 text-white text-[11px] font-medium rounded-md backdrop-blur-xs flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Retake
                      </button>
                    </div>
                  </div>

                  {/* Client Compression Stats Badge */}
                  {compressionInfo && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-teal-50 border border-teal-200/80 text-xs text-teal-900 font-medium">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        <span>Ready • Compressed for low bandwidth</span>
                      </span>
                      <span className="text-[11px] text-teal-700 font-mono">
                        {Math.round(compressionInfo.compressedSizeBytes / 1024)} KB ({compressionInfo.width}×
                        {compressionInfo.height})
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mode Selector */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Select Study Mode
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Explain */}
                <button
                  type="button"
                  onClick={() => setMode('explain')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 min-h-[50px] ${
                    mode === 'explain'
                      ? 'border-teal-600 bg-teal-50/70 ring-1 ring-teal-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      mode === 'explain' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Explain Step by Step</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Gemma breaks down the logic, circuit, or code into clear, sequential concepts.
                    </div>
                  </div>
                </button>

                {/* 2. Quiz me */}
                <button
                  type="button"
                  onClick={() => setMode('quiz')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 min-h-[50px] ${
                    mode === 'quiz'
                      ? 'border-teal-600 bg-teal-50/70 ring-1 ring-teal-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      mode === 'quiz' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <FileQuestion className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Quiz Me</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Generate 3 interactive practice questions with instant feedback and score.
                    </div>
                  </div>
                </button>

                {/* 3. Check my working */}
                <button
                  type="button"
                  onClick={() => setMode('check')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 min-h-[50px] ${
                    mode === 'check'
                      ? 'border-teal-600 bg-teal-50/70 ring-1 ring-teal-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      mode === 'check' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Check My Working</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Identifies your first mistake, explains why it's wrong, and guides you to the correct step.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Optional Question & Language Options */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
              <div>
                <label htmlFor="user-question" className="text-xs font-bold text-slate-700 block mb-1">
                  Optional Question or Focus Note
                </label>
                <input
                  id="user-question"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. 'Why does line 6 give a segfault?' or 'Check my corner grouping'"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white text-slate-900"
                />
              </div>

              {/* Swahili Summary Toggle */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Add Swahili summary</div>
                    <div className="text-[11px] text-slate-500">Muhtasari wa Kiswahili sanifu</div>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={swahiliSummary}
                    onChange={(e) => setSwahiliSummary(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-rose-800">Analysis Notice</div>
                  <div className="mt-0.5 text-rose-700">{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Rate limit countdown notification */}
            {rateLimitWait !== null && rateLimitWait > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Please wait <strong>{rateLimitWait}s</strong> before submitting another photo.
                </span>
              </div>
            )}

            {/* Submit Analyze Button */}
            <button
              type="button"
              disabled={!selectedImage || isLoading || (rateLimitWait !== null && rateLimitWait > 0)}
              onClick={handleAnalyze}
              className={`w-full min-h-[54px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                !selectedImage || isLoading || (rateLimitWait !== null && rateLimitWait > 0)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-teal-700/20'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>{loadingStepText}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Analyze with Gemma 4</span>
                </>
              )}
            </button>

            {/* Privacy note */}
            <div className="text-center pt-2 pb-4">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Photos are sent to the AI for analysis and not saved.
              </p>
            </div>
          </div>
        )}

        {/* Loading Overlay / In-Progress Screen */}
        {isLoading && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center my-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Gemma 4 is Working</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{loadingStepText}</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-teal-600 h-1.5 rounded-full w-2/3 animate-pulse"></div>
            </div>
            <p className="text-[11px] text-slate-400">Patience pays • Subira huvuta heri</p>
          </div>
        )}

        {/* Results Screen */}
        {result && !isLoading && (
          <div className="space-y-4">
            {/* Top confirmation banner: "What I see" */}
            <div
              className={`rounded-2xl p-4 border shadow-xs transition-all ${
                result.readable
                  ? 'bg-white border-slate-200'
                  : 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    result.readable ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {result.readable ? <Eye className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      What Gemma 4 Sees:
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {result.model_used}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-1 leading-snug">
                    {result.what_i_see}
                  </p>
                </div>
              </div>

              {/* If photo is unreadable / blurry / non-study material, show friendly retake guidance */}
              {!result.readable && (
                <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2">
                  <p className="text-xs text-amber-900">
                    💡 <strong>Tip for a clear photo:</strong> Hold your phone steady, ensure good lighting, avoid
                    heavy shadows or glare, and keep formulas/code clearly inside the frame.
                  </p>
                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake or Try Another Photo</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mode Output (if readable) */}
            {result.readable && (
              <>
                {/* 1. EXPLAIN MODE OUTPUT */}
                {mode === 'explain' && result.explanation_steps && result.explanation_steps.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-teal-600" />
                        <h2 className="text-sm font-bold text-slate-900">Step-by-Step Explanation</h2>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {result.explanation_steps.length} steps
                      </span>
                    </div>

                    <div className="space-y-3">
                      {result.explanation_steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80"
                        >
                          <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                            {step}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. CHECK MY WORKING MODE OUTPUT */}
                {mode === 'check' && result.mistake_check && (
                  <div className="space-y-3">
                    {/* Praise */}
                    {result.mistake_check.praise && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                            Praise for What Was Right
                          </div>
                          <p className="text-sm text-emerald-900 mt-1">{result.mistake_check.praise}</p>
                        </div>
                      </div>
                    )}

                    {/* First Error Found */}
                    <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 text-rose-600">
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="text-sm font-bold text-slate-900">First Error Found</h3>
                      </div>

                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                        <p className="text-sm font-bold text-rose-900">{result.mistake_check.first_error}</p>
                      </div>

                      {/* Why it is wrong */}
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Why this is wrong:
                        </span>
                        <p className="text-sm text-slate-800 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                          {result.mistake_check.why}
                        </p>
                      </div>

                      {/* Helpful Hint */}
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                          <Lightbulb className="w-4 h-4 text-amber-600" />
                          <span>Guided Hint (Think it through)</span>
                        </div>
                        <p className="text-sm text-amber-900 mt-1 font-medium">{result.mistake_check.hint}</p>
                      </div>

                      {/* Corrected Step */}
                      <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-950">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          <span>Corrected Next Step</span>
                        </div>
                        <p className="text-sm text-teal-900 mt-1 leading-relaxed font-mono whitespace-pre-line bg-white/70 p-2.5 rounded-lg border border-teal-200/60">
                          {result.mistake_check.corrected_step}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. QUIZ ME MODE OUTPUT */}
                {mode === 'quiz' && result.quiz && result.quiz.length > 0 && (
                  <div className="space-y-4">
                    {/* Quiz Header with Score */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <FileQuestion className="w-4 h-4 text-teal-600" />
                          <span>Interactive Quiz</span>
                        </h2>
                        <p className="text-xs text-slate-500">Tap your answer for instant explanations</p>
                      </div>

                      {/* Score Badge */}
                      <div className="px-3 py-1.5 rounded-xl bg-teal-100 text-teal-900 border border-teal-200 text-center">
                        <div className="text-[10px] uppercase font-bold text-teal-700">Score</div>
                        <div className="text-base font-extrabold font-mono">
                          {quizScore} / {result.quiz.length}
                        </div>
                      </div>
                    </div>

                    {/* Questions */}
                    {result.quiz.map((q, qIdx) => {
                      const selectedOption = userQuizAnswers[qIdx];
                      const isAnswered = selectedOption !== undefined;
                      const isCorrect = selectedOption === q.answer_index;

                      return (
                        <div
                          key={qIdx}
                          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                              Q{qIdx + 1}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 leading-snug">{q.question}</h3>
                          </div>

                          {/* Options A, B, C, D */}
                          <div className="space-y-2 pt-1">
                            {q.options.map((opt, optIdx) => {
                              const isThisSelected = selectedOption === optIdx;
                              const isThisCorrect = optIdx === q.answer_index;

                              let buttonStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300';
                              if (isAnswered) {
                                if (isThisCorrect) {
                                  buttonStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold ring-1 ring-emerald-500';
                                } else if (isThisSelected && !isCorrect) {
                                  buttonStyle = 'bg-rose-50 border-rose-500 text-rose-900 font-semibold ring-1 ring-rose-500';
                                } else {
                                  buttonStyle = 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-70';
                                }
                              }

                              const optionLetters = ['A', 'B', 'C', 'D'];

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleSelectQuizAnswer(qIdx, optIdx)}
                                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 min-h-[44px] ${buttonStyle}`}
                                >
                                  <span className="w-5 h-5 rounded-md border border-current flex items-center justify-center shrink-0 font-bold text-[11px]">
                                    {optionLetters[optIdx]}
                                  </span>
                                  <span className="flex-1 mt-0.5 leading-snug">{opt}</span>
                                  {isAnswered && isThisCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  )}
                                  {isAnswered && isThisSelected && !isCorrect && (
                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation Box */}
                          {isAnswered && (
                            <div
                              className={`p-3 rounded-xl text-xs space-y-1.5 transition-all ${
                                isCorrect ? 'bg-emerald-50 border border-emerald-200 text-emerald-950' : 'bg-rose-50 border border-rose-200 text-rose-950'
                              }`}
                            >
                              <div className="font-bold flex items-center gap-1.5">
                                {isCorrect ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span>Correct! Vizuri sana!</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-4 h-4 text-rose-600" />
                                    <span>Not quite right. Let's learn why:</span>
                                  </>
                                )}
                              </div>
                              <p className="leading-relaxed text-slate-700">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Reset Quiz button */}
                    {Object.keys(userQuizAnswers).length > 0 && (
                      <button
                        onClick={() => setUserQuizAnswers({})}
                        className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake this Quiz</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Swahili Summary Card (if requested) */}
                {result.swahili_summary && result.swahili_summary.trim().length > 0 && (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Globe className="w-4 h-4 text-emerald-700" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">Muhtasari wa Kiswahili</h3>
                    </div>
                    <p className="text-sm text-emerald-950 leading-relaxed font-medium">
                      {result.swahili_summary}
                    </p>
                  </div>
                )}

                {/* Action Bar: Switch mode without re-uploading */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5">
                  <div className="text-xs font-bold text-slate-700">Switch mode on this same photo:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchModeAndAnalyze('explain')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        mode === 'explain'
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      💡 Explain
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchModeAndAnalyze('quiz')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        mode === 'quiz'
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      📝 Quiz Me
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchModeAndAnalyze('check')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        mode === 'check'
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      🔍 Check Work
                    </button>
                  </div>
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyNotes}
                    className="flex-1 min-h-[48px] px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-600" />
                        <span>Copy Analysis</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 min-h-[48px] px-3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Snap Next Photo</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Fullscreen Image Modal */}
      {showImageModal && selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-2 text-sm font-semibold flex items-center gap-1"
            >
              <X className="w-5 h-5" /> Close
            </button>
            <img
              src={selectedImage}
              alt="Uploaded study material"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
