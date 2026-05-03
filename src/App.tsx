import React, { useState } from 'react';
import { SignedIn, SignedOut, SignIn, UserButton, SignUp } from '@clerk/clerk-react';
import { UploadCloud, CheckCircle, FileText, Calendar, Loader2, Sparkles, AlertCircle, Trash2, ChevronRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Candidate {
  id: string;
  candidateName: string;
  candidateEmail: string;
  skillsDetected: string[];
  matchScore: number;
  aiSummary: string;
}

export default function App() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans flex flex-col relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] bg-fuchsia-600/10 blur-[150px] rounded-full pointer-events-none -translate-x-1/2" />

      <header className="h-20 border-b border-white/5 bg-black/30 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-50 w-full transition-all duration-300">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Astra.HR
          </h1>
          <motion.span 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold tracking-widest rounded-full uppercase ml-2 flex items-center gap-1"
          >
            <Zap className="w-3 h-3" /> Live
          </motion.span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <SignedOut>
            <div className="flex space-x-4 bg-white/5 p-1 rounded-lg border border-white/10">
              <button 
                onClick={() => setAuthMode('signin')}
                className={`px-5 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${authMode === 'signin' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-zinc-400 hover:text-white'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => setAuthMode('signup')}
                className={`px-5 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${authMode === 'signup' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-zinc-400 hover:text-white'}`}
              >
                Sign Up
              </button>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="ring-2 ring-white/10 rounded-full p-0.5 hover:ring-violet-500/50 transition-all duration-300">
              <UserButton appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
            </div>
          </SignedIn>
        </motion.div>
      </header>

      <main className="flex-1 flex flex-col p-6 md:p-12 w-full max-w-[1400px] mx-auto z-10 relative">
        <SignedOut>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center mt-10 lg:mt-20"
          >
            <div className="max-w-md w-full bg-black/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col items-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="w-16 h-16 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-violet-500/20 rotate-3 group-hover:rotate-6 transition-transform">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold mb-3 text-center text-white tracking-tight">Access Hub</h2>
              <p className="text-zinc-400 mb-8 text-center text-sm leading-relaxed max-w-[80%]">
                Authenticate to enter the intelligent HR workspace and analyze candidates.
              </p>
              <div className="bg-white/5 p-4 rounded-2xl w-full border border-white/10 shadow-inner">
                {authMode === 'signin' ? <SignIn routing="hash" /> : <SignUp routing="hash" />}
              </div>
            </div>
          </motion.div>
        </SignedOut>

        <SignedIn>
          <Dashboard />
        </SignedIn>
      </main>
    </div>
  );
}

function Dashboard() {
  const [jobDescription, setJobDescription] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorPrompt, setErrorPrompt] = useState<string | null>(null);
  
  // Scheduling States
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!jobDescription.trim()) {
      setErrorPrompt('Please define the Job Description first.');
      e.target.value = '';
      return;
    }

    setErrorPrompt(null);
    setIsProcessing(true);

    const formData = new FormData();
    formData.append('cvFile', file);
    formData.append('jobDescription', jobDescription);

    try {
      const response = await fetch('http://localhost:6001/api/screen-cv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process CV');
      }

      const data = await response.json();
      
      const newCandidate: Candidate = {
        id: Math.random().toString(36).substring(7),
        ...data
      };

      setCandidates(prev => [...prev, newCandidate].sort((a, b) => b.matchScore - a.matchScore));
    } catch (err: any) {
      console.error(err);
      setErrorPrompt(err.message || 'Error communicating with the agent.');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleOpenScheduleModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setScheduleSuccess(null);
    setInterviewDate('');
    setInterviewTime('');
    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    setIsScheduling(true);
    setScheduleSuccess(null);
    setErrorPrompt(null);

    try {
      const response = await fetch('http://localhost:6001/api/schedule-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateEmail: selectedCandidate.candidateEmail,
          candidateName: selectedCandidate.candidateName,
          date: interviewDate,
          time: interviewTime
        })
      });

      if (!response.ok) {
        throw new Error('Failed to schedule the interview.');
      }

      setScheduleSuccess(`Invitation sent to ${selectedCandidate.candidateEmail}!`);
      setTimeout(() => setScheduleModalOpen(false), 2000);
    } catch (err: any) {
      setErrorPrompt(err.message || 'Failed to schedule. Check SMTP config.');
    } finally {
      setIsScheduling(false);
    }
  };

  const removeCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 xl:grid-cols-12 gap-8"
    >
      {/* Setup Section */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[50px] rounded-full" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="text-sm font-bold tracking-widest text-white flex items-center gap-3">
              <span className="p-2 bg-violet-500/20 text-violet-400 rounded-lg">
                <FileText className="w-4 h-4" />
              </span>
              JOB REQUIREMENTS
            </h2>
          </div>
          
          <textarea 
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full h-48 p-4 bg-black/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-sm resize-none text-zinc-200 placeholder-zinc-600 relative z-10"
            placeholder="E.g. Seeking a Senior Engineer with deep expertise in LLMs, Agentic Architectures, and Typescript..."
          />
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-xl relative overflow-hidden"
        >
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full" />

          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="text-sm font-bold tracking-widest text-white flex items-center gap-3">
              <span className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <UploadCloud className="w-4 h-4" />
              </span>
              ANALYZE CV
            </h2>
          </div>
          
          <label className={`w-full relative z-10 flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-2xl transition-all duration-300 ${isProcessing ? 'border-violet-500/50 bg-violet-500/10 cursor-not-allowed' : 'border-white/10 hover:border-violet-500/50 hover:bg-white/5 cursor-pointer'}`}>
            <div className="flex flex-col items-center justify-center text-center p-6">
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-10 h-10 text-violet-400 mb-3" />
                </motion.div>
              ) : (
                <UploadCloud className="w-10 h-10 text-zinc-500 mb-3 group-hover:text-violet-400 transition-colors" />
              )}
              <p className="text-sm font-semibold text-zinc-300">
                {isProcessing ? 'Agent processing context...' : 'Drag & drop CV or Click'}
              </p>
              <p className="text-xs text-zinc-500 mt-2">Supports PDF & TXT</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.txt" 
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
          </label>

          <AnimatePresence>
            {errorPrompt && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-red-500/10 text-red-400 text-sm rounded-xl border border-red-500/20 flex items-start gap-3 relative z-10"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="font-medium">{errorPrompt}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Results Section */}
      <div className="xl:col-span-8">
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl min-h-[600px] flex flex-col overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500" />
          
          <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-end">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Ranked Candidates</h3>
              <p className="text-sm text-zinc-400">AI-driven matching against your requirements</p>
            </div>
            <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-zinc-300">
              {candidates.length} Scored
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative">
            {candidates.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500"
              >
                <div className="w-24 h-24 mb-6 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center bg-white/5">
                  <CheckCircle className="w-10 h-10 opacity-50" />
                </div>
                <p className="text-lg font-medium text-zinc-400">No candidates analyzed yet</p>
                <p className="text-sm text-zinc-600 mt-2">Upload a CV to begin the evaluation process.</p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {candidates.map((candidate, idx) => (
                  <motion.div 
                    key={candidate.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative bg-black/40 border border-white/5 hover:border-white/10 p-6 rounded-2xl transition-all hover:bg-white/[0.02] flex flex-col md:flex-row gap-6 md:gap-8 items-start"
                  >
                    {/* Score Ring */}
                    <div className="shrink-0 flex flex-col items-center justify-center">
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-800" />
                          <motion.circle 
                            initial={{ strokeDasharray: "0 300" }}
                            animate={{ strokeDasharray: `${(candidate.matchScore / 100) * 283} 300` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" 
                            className={`${
                                candidate.matchScore >= 80 ? 'text-violet-500' : 
                                candidate.matchScore >= 50 ? 'text-blue-500' : 
                                'text-rose-500'
                            }`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-white">{candidate.matchScore}</span>
                          <span className="text-[10px] uppercase font-bold text-zinc-500">Match</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 w-full">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {candidate.candidateName}
                            {candidate.matchScore >= 90 && <Sparkles className="w-4 h-4 text-amber-400" />}
                          </h3>
                          <a href={`mailto:${candidate.candidateEmail}`} className="text-sm text-zinc-400 hover:text-violet-400 transition-colors">
                            {candidate.candidateEmail}
                          </a>
                        </div>
                        <button 
                          onClick={() => removeCandidate(candidate.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <p className="text-zinc-300 text-sm leading-relaxed mb-6 bg-white/5 p-4 rounded-xl border border-white/5">
                        {candidate.aiSummary}
                      </p>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto">
                        <div className="flex flex-wrap gap-2">
                          {candidate.skillsDetected.slice(0, 5).map((skill, i) => (
                            <span key={i} className="bg-white/5 text-zinc-300 px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                              {skill}
                            </span>
                          ))}
                          {candidate.skillsDetected.length > 5 && (
                            <span className="text-xs text-zinc-500 py-1 px-2">+{candidate.skillsDetected.length - 5} more</span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleOpenScheduleModal(candidate)}
                          disabled={candidate.candidateEmail === 'Not Provided' || candidate.candidateEmail.includes('Unknown')}
                          className="shrink-0 flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10 group/btn"
                        >
                          <Calendar className="w-4 h-4" />
                          Schedule
                          <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
        {scheduleModalOpen && selectedCandidate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-[2rem] w-full max-w-lg p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 blur-[50px] rounded-full pointer-events-none" />

              <h2 className="text-2xl font-bold text-white mb-2">Schedule Interview</h2>
              <p className="text-sm text-zinc-400 mb-8">Set up a meeting with <span className="text-white font-medium">{selectedCandidate.candidateName}</span></p>

              {scheduleSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-emerald-500/10 text-emerald-400 text-sm border border-emerald-500/20 rounded-xl flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{scheduleSuccess}</span>
                </motion.div>
              )}

              <form onSubmit={handleScheduleSubmit} className="flex flex-col gap-5 relative z-10">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Recipient</label>
                  <input 
                    type="email" 
                    value={selectedCandidate.candidateEmail} 
                    disabled
                    className="w-full p-3.5 bg-black/50 border border-white/5 rounded-xl text-sm text-zinc-400 font-medium cursor-not-allowed"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Date</label>
                    <input 
                      type="date" 
                      required
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full p-3.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Time</label>
                    <input 
                      type="time" 
                      required
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full p-3.5 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-8">
                  <button 
                    type="button"
                    onClick={() => setScheduleModalOpen(false)}
                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isScheduling || !!scheduleSuccess}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold text-sm hover:from-violet-500 hover:to-blue-500 transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isScheduling && <Loader2 className="w-5 h-5 animate-spin" />}
                    {isScheduling ? 'Dispatching...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
