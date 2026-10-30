/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  BookOpen,
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
  RotateCw,
  Download,
  Moon,
  Sun,
  User,
  MessageSquare,
  Send,
  X,
  AlertCircle,
  Globe,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { StudyMode, AnalyzeResponse, StudentProfile, FollowUpMessage, SampleTestCase } from './types.ts';
import { compressImage, CompressionResult } from './utils/imageCompressor.ts';
import { SAMPLE_TEST_CASES } from './data/sampleCases.ts';

const DEFAULT_PROFILE: StudentProfile = {
  institution: '',
  country: 'Kenya',
  programme: '',
  level: 'Undergraduate',
  year: 'Year 1',
  currentUnits: '',
};

export default function App() {
  // Theme state (Phase 2: Dark/Light Mode)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('snap_and_learn_theme') === 'dark';
  });

  // Profile state (Phase 2: My Learning Space)
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const stored = localStorage.getItem('snap_and_learn_profile');
      return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // App input state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [mode, setMode] = useState<StudyMode>('explain');
  const [subject, setSubject] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [swahiliSummary, setSwahiliSummary] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'study' | 'samples'>('study');

  // Loading & execution state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStepText, setLoadingStepText] = useState<string>('Analyzing with Gemma 4...');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimitWait, setRateLimitWait] = useState<number | null>(null);

  // Quiz state
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<number, number>>({});
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);

  // Follow-up conversation state (Phase 2)
  const [followupInput, setFollowupInput] = useState<string>('');
  const [followupHistory, setFollowupHistory] = useState<FollowUpMessage[]>([]);
  const [isFollowupLoading, setIsFollowupLoading] = useState<boolean>(false);

  // File input refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('snap_and_learn_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('snap_and_learn_theme', 'light');
    }
  }, [darkMode]);

  // Sync profile
  useEffect(() => {
    localStorage.setItem('snap_and_learn_profile', JSON.stringify(profile));
  }, [profile]);

  // Loading animation messages
  useEffect(() => {
    if (!isLoading) return;

    const messages = [
      'Compressing image for fast transmission...',
      'Gemma 4 is reading the visible content...',
      'Checking formulas, code, or diagrams...',
      'Drafting step-by-step reasoning...',
      'Finalizing educational feedback...',
    ];

    let idx = 0;
    setLoadingStepText(messages[0]);
    const timer = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setLoadingStepText(messages[idx]);
    }, 2400);

    return () => clearInterval(timer);
  }, [isLoading]);

  // Rate limit countdown
  useEffect(() => {
    if (rateLimitWait === null || rateLimitWait <= 0) return;
    const interval = setInterval(() => {
      setRateLimitWait((prev) => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitWait]);

  // Handle client-side image compression
  const handleImageFile = async (file: File) => {
    setErrorMessage(null);
    setImageRotation(0);
    try {
      setIsLoading(true);
      setLoadingStepText('Compressing photo client-side...');
      const compressed = await compressImage(file, 1280, 0.82);
      setSelectedImage(compressed.dataUrl);
      setCompressionInfo(compressed);
      setResult(null);
      setUserQuizAnswers({});
      setFollowupHistory([]);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not process photo. Please try a different image.');
    } finally {
      setIsLoading(false);
    }
  };

  // Rotate image 90 degrees
  const handleRotateImage = () => {
    if (!selectedImage) return;
    const newRotation = (imageRotation + 90) % 360;
    setImageRotation(newRotation);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (newRotation === 90 || newRotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((newRotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(rotatedDataUrl);
    };
    img.src = selectedImage;
  };

  // Load sample test case
  const handleSelectSample = async (sample: SampleTestCase) => {
    setErrorMessage(null);
    setResult(null);
    setUserQuizAnswers({});
    setImageRotation(0);
    setMode(sample.recommendedMode);
    setQuestion(sample.suggestedQuestion);
    setSubject(sample.category);
    setFollowupHistory([]);

    try {
      setIsLoading(true);
      setLoadingStepText('Loading test case photo...');
      const compressed = await compressImage(sample.imageDataUrl, 1280, 0.85);
      setSelectedImage(compressed.dataUrl);
      setCompressionInfo(compressed);
      setActiveTab('study');
    } catch {
      setErrorMessage('Could not load sample case.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send to /api/analyze
  const handleAnalyze = async () => {
    if (!selectedImage) {
      setErrorMessage('Please capture or upload an image first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    setUserQuizAnswers({});
    setFollowupHistory([]);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: compressionInfo?.mimeType || 'image/jpeg',
          mode,
          subject: subject.trim() || undefined,
          question: question.trim() || undefined,
          swahiliSummary,
          profile: profile.programme || profile.institution ? profile : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setRateLimitWait(data.retryAfter || 30);
        }
        throw new Error(data.message || data.error || `Server responded with ${response.status}`);
      }

      setResult(data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err?.message || 'Unable to connect to Gemma 4. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch mode on same photo
  const handleSwitchModeAndAnalyze = (newMode: StudyMode) => {
    setMode(newMode);
    setUserQuizAnswers({});
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
          subject: subject.trim() || undefined,
          question: question.trim() || undefined,
          swahiliSummary,
          profile: profile.programme || profile.institution ? profile : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Mode analysis failed');
      setResult(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to switch mode.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Follow-up questions (Phase 2)
  const handleSendFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupInput.trim() || !result || isFollowupLoading) return;

    const userMsg: FollowUpMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: followupInput.trim(),
      timestamp: Date.now(),
    };

    setFollowupHistory((prev) => [...prev, userMsg]);
    setFollowupInput('');
    setIsFollowupLoading(true);

    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg.text,
          originalWhatISee: result.what_i_see,
          originalTopic: result.topic || result.subject,
          previousExplanation: (result.explanation_steps || []).join('\n'),
          chatHistory: followupHistory,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Follow-up error');

      const tutorMsg: FollowUpMessage = {
        id: 'msg_tutor_' + Date.now(),
        sender: 'tutor',
        text: data.answer,
        timestamp: Date.now(),
      };
      setFollowupHistory((prev) => [...prev, tutorMsg]);
    } catch (err: any) {
      const errorMsg: FollowUpMessage = {
        id: 'msg_err_' + Date.now(),
        sender: 'tutor',
        text: 'Sorry, I had trouble formulating a response. Please ask again.',
        timestamp: Date.now(),
      };
      setFollowupHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsFollowupLoading(false);
    }
  };

  // Reset
  const handleReset = () => {
    setSelectedImage(null);
    setCompressionInfo(null);
    setImageRotation(0);
    setResult(null);
    setUserQuizAnswers({});
    setErrorMessage(null);
    setQuestion('');
    setFollowupHistory([]);
  };

  // Quiz answer handling
  const handleSelectQuizAnswer = (qIdx: number, optIdx: number) => {
    setUserQuizAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx,
    }));
  };

  const quizScore =
    result?.quiz?.reduce((score, q, idx) => {
      return userQuizAnswers[idx] === q.answer_index ? score + 1 : score;
    }, 0) || 0;

  // Copy notes to clipboard
  const handleCopyNotes = () => {
    if (!result) return;
    const text = formatResultsAsMarkdown(result);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Download notes as markdown file (Phase 2)
  const handleDownloadMarkdown = () => {
    if (!result) return;
    const markdown = formatResultsAsMarkdown(result);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `snap-and-learn-${result.mode}-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  function formatResultsAsMarkdown(res: AnalyzeResponse): string {
    let md = `# Snap and Learn Study Notes\n\n`;
    md += `**Subject:** ${res.subject || 'General'} | **Topic:** ${res.topic || 'General'}\n`;
    md += `**Model:** ${res.model_used || 'Gemma 4'}\n\n`;
    md += `## What I See\n${res.what_i_see}\n\n`;

    if (res.explanation_steps && res.explanation_steps.length > 0) {
      md += `## Explanation Steps\n`;
      res.explanation_steps.forEach((step, idx) => {
        md += `${idx + 1}. ${step}\n\n`;
      });
    }

    if (res.mistake_check) {
      md += `## Check My Working\n`;
      if (res.mistake_check.first_error) md += `- **First Error:** ${res.mistake_check.first_error}\n`;
      if (res.mistake_check.why) md += `- **Why:** ${res.mistake_check.why}\n`;
      if (res.mistake_check.hint) md += `- **Hint:** ${res.mistake_check.hint}\n`;
      if (res.mistake_check.corrected_step) md += `- **Corrected Step:** ${res.mistake_check.corrected_step}\n\n`;
    }

    if (res.swahili_summary) {
      md += `## Muhtasari wa Kiswahili\n${res.swahili_summary}\n\n`;
    }

    return md;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} pb-12`}>
      {/* Hidden file inputs */}
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

      {/* Top Mobile Header */}
      <header className={`sticky top-0 z-40 border-b px-4 py-2.5 backdrop-blur-md transition-colors ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white shadow-sm shadow-teal-700/20">
              <Camera className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className={`font-bold text-lg leading-tight tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Snap &amp; Learn
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Gemma 4
                </span>
              </div>
              <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold tracking-wide">Capture. Understand. Learn.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Dark / Light Mode Toggle (Phase 2) */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Dark / Light Theme"
              className={`p-2 rounded-lg border transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 text-amber-300' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* My Learning Space Profile Button (Phase 2) */}
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              title="My Learning Space"
              className={`p-2 rounded-lg border transition-all flex items-center gap-1 text-xs font-semibold ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full px-4 pt-3 flex-1">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between mb-3 bg-slate-200/70 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('study')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === 'study'
                ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Study Hub
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'samples'
                ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Test Samples (5)</span>
          </button>
        </div>

        {/* TAB: SAMPLES GALLERY */}
        {activeTab === 'samples' && (
          <section className={`mb-6 rounded-2xl p-4 border shadow-xs ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>5 Curated Test Cases</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pre-configured study scenarios to verify Gemma 4 behavior and guardrails.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('study')}
                className="text-xs text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {SAMPLE_TEST_CASES.slice(0, 5).map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-start group ${
                    darkMode
                      ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-teal-500'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-teal-50/40 hover:border-teal-400'
                  }`}
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-white shrink-0">
                    <img src={sample.imageDataUrl} alt={sample.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold truncate group-hover:text-teal-600">
                        {sample.title}
                      </h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                        {sample.recommendedMode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{sample.expectedBehavior}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 mt-1">
                      Test this scenario <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB: STUDY HUB (HOME FLOW) */}
        {!result && (
          <div className="space-y-4">
            {/* Photo Capture Area */}
            <div className={`rounded-2xl p-4 border shadow-xs ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              {!selectedImage ? (
                <div className="space-y-3">
                  <div className="text-center py-4 px-2">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-3">
                      <Camera className="w-8 h-8 stroke-[1.8]" />
                    </div>
                    <h2 className="text-base font-bold">Snap or Upload Material</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                      Notes, textbook pages, equations, code, circuit diagrams, or assignment questions.
                    </p>
                  </div>

                  {/* Primary Mobile Buttons (Min 48px touch targets) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full min-h-[52px] px-4 py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-sm shadow-teal-700/20 flex items-center justify-center gap-2.5 transition-all"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Take Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full min-h-[52px] px-4 py-3 font-bold text-sm rounded-xl border flex items-center justify-center gap-2.5 transition-all ${
                        darkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      <Upload className="w-5 h-5 text-slate-500" />
                      <span>Upload File</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Selected Photo Preview & Image Tools (Phase 2 Crop/Rotate) */
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 max-h-72 flex items-center justify-center">
                    <img
                      src={selectedImage}
                      alt="Uploaded study material"
                      className="w-full h-auto max-h-72 object-contain"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        onClick={handleRotateImage}
                        title="Rotate 90 degrees"
                        className="px-2.5 py-1.5 bg-slate-900/85 hover:bg-slate-900 text-white text-[11px] font-medium rounded-lg backdrop-blur-xs flex items-center gap-1"
                      >
                        <RotateCw className="w-3.5 h-3.5" /> Rotate
                      </button>
                      <button
                        onClick={() => setShowImageModal(true)}
                        className="px-2.5 py-1.5 bg-slate-900/85 hover:bg-slate-900 text-white text-[11px] font-medium rounded-lg backdrop-blur-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={handleReset}
                        className="px-2.5 py-1.5 bg-rose-600/90 hover:bg-rose-700 text-white text-[11px] font-medium rounded-lg backdrop-blur-xs flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Replace
                      </button>
                    </div>
                  </div>

                  {/* Compression Stats Badge */}
                  {compressionInfo && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 font-medium">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>Ready • Optimized for mobile (~1280px)</span>
                      </span>
                      <span className="text-[11px] font-mono text-teal-700 dark:text-teal-300">
                        {Math.round(compressionInfo.compressedSizeBytes / 1024)} KB ({compressionInfo.width}×
                        {compressionInfo.height})
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mode Selector (3 Modes per Section 6) */}
            <div className={`rounded-2xl p-4 border shadow-xs space-y-3 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Select Study Mode
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Explain */}
                <button
                  type="button"
                  onClick={() => setMode('explain')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 min-h-[48px] ${
                    mode === 'explain'
                      ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 ring-1 ring-teal-600'
                      : darkMode
                      ? 'border-slate-800 hover:border-slate-700 bg-slate-900'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    mode === 'explain' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Explain Step by Step</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Identify topic, extract text/diagrams, define terms, and show calculations.
                    </div>
                  </div>
                </button>

                {/* 2. Quiz me */}
                <button
                  type="button"
                  onClick={() => setMode('quiz')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 min-h-[48px] ${
                    mode === 'quiz'
                      ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 ring-1 ring-teal-600'
                      : darkMode
                      ? 'border-slate-800 hover:border-slate-700 bg-slate-900'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    mode === 'quiz' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <FileQuestion className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Quiz Me (3 MCQs)</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Exactly 3 interactive questions with instant feedback and scoring.
                    </div>
                  </div>
                </button>

                {/* 3. Check my working */}
                <button
                  type="button"
                  onClick={() => setMode('check')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 min-h-[48px] ${
                    mode === 'check'
                      ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 ring-1 ring-teal-600'
                      : darkMode
                      ? 'border-slate-800 hover:border-slate-700 bg-slate-900'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    mode === 'check' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Check My Working</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Pinpoints your first mistake, explains why it's wrong, and gives a hint.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Optional Fields: Subject, Question, and Swahili Toggle */}
            <div className={`rounded-2xl p-4 border shadow-xs space-y-3.5 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              {/* Optional Subject Field */}
              <div>
                <label htmlFor="subject-input" className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Optional Subject / Course Unit
                </label>
                <input
                  id="subject-input"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Computational Logic, Organic Chemistry, Macroeconomics..."
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                    darkMode
                      ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Optional Question Box */}
              <div>
                <label htmlFor="question-input" className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Optional Question / Specific Focus
                </label>
                <input
                  id="question-input"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. 'Why did step 3 fail?' or 'Focus on the KVL equation'"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                    darkMode
                      ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Swahili Summary Toggle */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Add Swahili summary</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Muhtasari wa Kiswahili sanifu</div>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={swahiliSummary}
                    onChange={(e) => setSwahiliSummary(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Notice</div>
                  <div className="mt-0.5">{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Rate limit countdown notification */}
            {rateLimitWait !== null && rateLimitWait > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Please wait <strong>{rateLimitWait}s</strong> before sending another request.
                </span>
              </div>
            )}

            {/* Analyze Button */}
            <button
              type="button"
              disabled={!selectedImage || isLoading || (rateLimitWait !== null && rateLimitWait > 0)}
              onClick={handleAnalyze}
              className={`w-full min-h-[54px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                !selectedImage || isLoading || (rateLimitWait !== null && rateLimitWait > 0)
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
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

            {/* Required Privacy Note (Section 11) */}
            <div className="text-center pt-1 pb-3">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 max-w-sm mx-auto leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                Your photos are sent to Google's AI service for analysis. Snap and Learn does not permanently store uploaded photos.
              </p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className={`rounded-2xl p-6 border shadow-sm text-center my-6 space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400 flex items-center justify-center">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold">Analyzing Study Material</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">{loadingStepText}</p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-teal-600 h-1.5 rounded-full w-2/3 animate-pulse"></div>
            </div>
            <p className="text-[11px] text-slate-400">Capture. Understand. Learn.</p>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {result && !isLoading && (
          <div className="space-y-4">
            {/* Top Confirmation: What I See */}
            <div className={`rounded-2xl p-4 border shadow-xs transition-all ${
              result.readable
                ? darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-1 ring-amber-300 dark:ring-amber-800'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  result.readable
                    ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                }`}>
                  {result.readable ? <Eye className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      What Gemma 4 Sees:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {result.subject && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {result.subject}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400">
                        {result.model_used || 'Gemma 4'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold mt-1 leading-snug">
                    {result.what_i_see}
                  </p>
                </div>
              </div>

              {/* Unreadable / Blurry Guidance */}
              {!result.readable && (
                <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-900 space-y-2">
                  <p className="text-xs text-amber-900 dark:text-amber-200">
                    💡 <strong>Tip for clearer photos:</strong> Hold your phone steady in good light, align the page straight, and avoid camera blur so mathematical symbols or code can be read with confidence.
                  </p>
                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake Photo</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mode-Specific Outputs */}
            {result.readable && (
              <>
                {/* 1. EXPLAIN MODE */}
                {mode === 'explain' && result.explanation_steps && result.explanation_steps.length > 0 && (
                  <div className={`rounded-2xl p-4 border shadow-xs space-y-3 ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <h2 className="text-sm font-bold">Step-by-Step Explanation</h2>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {result.explanation_steps.length} steps
                      </span>
                    </div>

                    <div className="space-y-3">
                      {result.explanation_steps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                            darkMode ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                          }`}
                        >
                          <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="text-sm leading-relaxed whitespace-pre-line font-normal">
                            {step}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. CHECK MY WORKING MODE */}
                {mode === 'check' && result.mistake_check && (
                  <div className="space-y-3">
                    <div className={`rounded-2xl p-4 border shadow-xs space-y-3 ${
                      darkMode ? 'bg-slate-900 border-rose-950' : 'bg-white border-rose-200'
                    }`}>
                      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="text-sm font-bold">Identified First Error</h3>
                      </div>

                      {/* First Error */}
                      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200">
                        <p className="text-sm font-bold">
                          {result.mistake_check.first_error || 'No error detected in visible steps. Your working appears sound!'}
                        </p>
                      </div>

                      {/* Why it is wrong */}
                      {result.mistake_check.why && (
                        <div>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Why it is incorrect:
                          </span>
                          <p className={`text-sm mt-1 leading-relaxed p-3 rounded-xl border ${
                            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                          }`}>
                            {result.mistake_check.why}
                          </p>
                        </div>
                      )}

                      {/* Hint */}
                      {result.mistake_check.hint && (
                        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-200">
                          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span>Guiding Hint (Think through it)</span>
                          </div>
                          <p className="text-sm mt-1 font-medium">{result.mistake_check.hint}</p>
                        </div>
                      )}

                      {/* Corrected step */}
                      {result.mistake_check.corrected_step && (
                        <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-950 dark:text-teal-200">
                          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            <span>Corrected Next Step</span>
                          </div>
                          <p className={`text-sm mt-1 font-mono leading-relaxed p-2.5 rounded-lg border ${
                            darkMode ? 'bg-slate-900 border-teal-900' : 'bg-white border-teal-200'
                          }`}>
                            {result.mistake_check.corrected_step}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. QUIZ ME MODE */}
                {mode === 'quiz' && result.quiz && result.quiz.length > 0 && (
                  <div className="space-y-4">
                    {/* Header & Score */}
                    <div className={`rounded-2xl p-4 border shadow-xs flex items-center justify-between ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div>
                        <h2 className="text-sm font-bold flex items-center gap-2">
                          <FileQuestion className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span>Interactive Quiz (3 Questions)</span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Tap an answer to see instant rationale</p>
                      </div>

                      <div className="px-3.5 py-1.5 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800 text-center">
                        <div className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400">Score</div>
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
                          className={`rounded-2xl p-4 border shadow-xs space-y-3 ${
                            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                              Q{qIdx + 1}
                            </span>
                            <h3 className="text-sm font-bold leading-snug">{q.question}</h3>
                          </div>

                          <div className="space-y-2 pt-1">
                            {q.options.map((opt, optIdx) => {
                              const isThisSelected = selectedOption === optIdx;
                              const isThisCorrect = optIdx === q.answer_index;

                              let btnStyle = darkMode
                                ? 'bg-slate-800/70 border-slate-700 text-slate-200 hover:border-slate-600'
                                : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300';

                              if (isAnswered) {
                                if (isThisCorrect) {
                                  btnStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                                } else if (isThisSelected && !isCorrect) {
                                  btnStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200 font-semibold ring-1 ring-rose-500';
                                } else {
                                  btnStyle = 'opacity-60 border-slate-200 dark:border-slate-800';
                                }
                              }

                              const optionLetters = ['A', 'B', 'C', 'D'];

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleSelectQuizAnswer(qIdx, optIdx)}
                                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 min-h-[44px] ${btnStyle}`}
                                >
                                  <span className="w-5 h-5 rounded-md border border-current flex items-center justify-center shrink-0 font-bold text-[11px]">
                                    {optionLetters[optIdx]}
                                  </span>
                                  <span className="flex-1 mt-0.5 leading-snug">{opt}</span>
                                  {isAnswered && isThisCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Instant Explanation Box */}
                          {isAnswered && (
                            <div className={`p-3 rounded-xl text-xs space-y-1 transition-all ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-200'
                            }`}>
                              <div className="font-bold">
                                {isCorrect ? '✓ Correct!' : '✗ Explanation:'}
                              </div>
                              <p className="leading-relaxed opacity-90">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {Object.keys(userQuizAnswers).length > 0 && (
                      <button
                        onClick={() => setUserQuizAnswers({})}
                        className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
                      </button>
                    )}
                  </div>
                )}

                {/* Swahili Summary Card */}
                {result.swahili_summary && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                      <Globe className="w-4 h-4" />
                      <span>Muhtasari wa Kiswahili</span>
                    </div>
                    <p className="text-sm text-emerald-950 dark:text-emerald-100 leading-relaxed font-medium">
                      {result.swahili_summary}
                    </p>
                  </div>
                )}

                {/* PHASE 2: Follow-up Questions in Session Context */}
                <div className={`rounded-2xl p-4 border shadow-xs space-y-3 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">Ask a Follow-Up Question</h3>
                  </div>

                  {followupHistory.length > 0 && (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {followupHistory.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-xl text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-teal-600 text-white ml-6 text-right'
                              : darkMode
                              ? 'bg-slate-800 text-slate-200 mr-6'
                              : 'bg-slate-100 text-slate-800 mr-6'
                          }`}
                        >
                          <div className="font-bold text-[10px] opacity-75 mb-0.5">
                            {msg.sender === 'user' ? 'You' : 'Gemma 4 Tutor'}
                          </div>
                          <div>{msg.text}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSendFollowup} className="flex gap-2">
                    <input
                      type="text"
                      value={followupInput}
                      onChange={(e) => setFollowupInput(e.target.value)}
                      placeholder="Ask about a specific formula, variable, or concept..."
                      disabled={isFollowupLoading}
                      className={`flex-1 px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!followupInput.trim() || isFollowupLoading}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                    >
                      {isFollowupLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </form>
                </div>

                {/* Switch Mode Bar */}
                <div className={`rounded-2xl p-4 border shadow-xs space-y-2.5 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Try another mode on this photo:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchModeAndAnalyze('explain')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        mode === 'explain'
                          ? 'bg-teal-600 text-white border-teal-600'
                          : darkMode
                          ? 'bg-slate-800 border-slate-700 text-slate-300'
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
                          : darkMode
                          ? 'bg-slate-800 border-slate-700 text-slate-300'
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
                          : darkMode
                          ? 'bg-slate-800 border-slate-700 text-slate-300'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      🔍 Check Work
                    </button>
                  </div>
                </div>

                {/* Action Toolbar: Copy, Download, Retake */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyNotes}
                    className={`min-h-[48px] px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                      darkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {copiedText ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    <span>{copiedText ? 'Copied!' : 'Copy Summary'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadMarkdown}
                    className={`min-h-[48px] px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                      darkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>Download (.md)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="min-h-[48px] px-3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
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

      {/* PHASE 2: My Learning Space Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-2xl p-5 border shadow-xl space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-bold">My Learning Space (Profile)</h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Optional profile to personalize explanations to your academic level and programme. Stored in your browser only.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Institution</label>
                <input
                  type="text"
                  value={profile.institution}
                  onChange={(e) => setProfile({ ...profile, institution: e.target.value })}
                  placeholder="e.g. University of Nairobi, Kenyatta University, JKUAT..."
                  className={`w-full p-2.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Programme / Major</label>
                <input
                  type="text"
                  value={profile.programme}
                  onChange={(e) => setProfile({ ...profile, programme: e.target.value })}
                  placeholder="e.g. BSc Computer Science, Electrical Engineering..."
                  className={`w-full p-2.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Academic Level</label>
                  <select
                    value={profile.level}
                    onChange={(e) => setProfile({ ...profile, level: e.target.value })}
                    className={`w-full p-2.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  >
                    <option>Undergraduate</option>
                    <option>Diploma</option>
                    <option>Certificate</option>
                    <option>Postgraduate</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Year of Study</label>
                  <select
                    value={profile.year}
                    onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                    className={`w-full p-2.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  >
                    <option>Year 1</option>
                    <option>Year 2</option>
                    <option>Year 3</option>
                    <option>Year 4</option>
                    <option>Year 5</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
              >
                Save &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Modal */}
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
