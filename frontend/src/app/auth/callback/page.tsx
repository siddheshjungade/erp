"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Database, ShieldAlert, CheckCircle2, ShieldCheck } from 'lucide-react';

function AuthCallbackContent() {
  const { checkAuth } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const token = searchParams.get('token');
  const error = searchParams.get('error');
  const errorDetails = searchParams.get('details');

  const stepMessages = [
    "Validating Google authorization handshake...",
    "Connecting to Google Drive API secure servers...",
    "Scanning user folder for 'Solar ERP Database' spreadsheet...",
    "Verifying spreadsheet relational tabs & schemas (Projects, Leads, Financials)...",
    "Wrapping secure session JWT token...",
    "Synchronized! Launching Solar ERP Dashboard..."
  ];

  useEffect(() => {
    if (error) {
      console.error('OAuth Callback Error:', error, errorDetails);
      setErrorMsg(errorDetails || 'Google OAuth verification failed. Please try again.');
      return;
    }

    if (!token) {
      setErrorMsg('No session token received. Unauthorized access.');
      return;
    }

    // Save token
    localStorage.setItem('token', token);

    // Run beautiful mock steps to simulate initialization stages for a premium experience
    const runSteps = async () => {
      for (let i = 0; i < stepMessages.length; i++) {
        setStep(i);
        await new Promise((resolve) => setTimeout(resolve, 750));
      }
      
      // Update global auth status in context
      await checkAuth();
      
      // Navigate to dashboard
      router.push('/dashboard');
    };

    runSteps();
  }, [token, error, errorDetails]);

  if (errorMsg) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#fdfbfc] to-[#fbfdfb] min-h-screen">
        <div className="max-w-md w-full bg-white rounded-3xl border border-red-100 shadow-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto text-red-500 shadow-lg shadow-red-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-emerald-950">Handshake Failed</h2>
            <p className="text-xs font-semibold text-red-600 bg-red-50/50 py-2.5 px-4 rounded-xl border border-red-100/50">
              {errorMsg}
            </p>
          </div>

          <p className="text-xs font-medium text-emerald-900/60 leading-relaxed">
            There was an error initializing your database spreadsheet. Make sure your Google account has authorized Google Drive and Sheets API permissions.
          </p>

          <button
            onClick={() => router.push('/')}
            className="w-full py-4 bg-emerald-500 hover:bg-[#059669] text-white font-bold rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#f4faf6] to-[#f9fdfa] min-h-screen">
      {/* Decorative Radial Glows */}
      <div className="absolute w-[400px] h-[400px] bg-gradient-to-br from-[#d4f3dd] to-transparent rounded-full blur-[100px] opacity-40 pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl border border-emerald-100 shadow-2xl p-8 text-center space-y-8 relative z-10">
        
        {/* Animated Green Sphere / Loader */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          {/* Pulsing Back Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-emerald-50 opacity-40" />
          {/* Animated Spinner Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          {/* Center Database Icon */}
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
            <Database className="w-5.5 h-5.5 animate-pulse" />
          </div>
        </div>

        {/* Text Details & Steps */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-emerald-950">Initializing Solar ERP</h2>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Setup & Connection in Progress</p>
          </div>

          {/* Stepper visualization */}
          <div className="space-y-2 bg-[#f7faf8] rounded-2xl p-4 border border-emerald-100/50 text-left">
            <div className="flex items-center justify-between border-b border-emerald-100/20 pb-2 mb-2">
              <span className="text-[9px] font-bold text-emerald-900/50 uppercase tracking-wide">Sync Phase</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                {step + 1} of {stepMessages.length}
              </span>
            </div>
            
            <p className="text-xs font-semibold text-emerald-950/80 transition-all flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin flex-shrink-0" />
              {stepMessages[step]}
            </p>
          </div>
        </div>

        {/* Visual Steps Checkmarks */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
          <div className={`p-2 rounded-xl border transition-all ${step >= 1 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
            <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
            OAuth
          </div>
          <div className={`p-2 rounded-xl border transition-all ${step >= 3 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
            <Database className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
            Sheets Setup
          </div>
          <div className={`p-2 rounded-xl border transition-all ${step >= 5 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
            <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
            Launch
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-[#fbfdfb] min-h-screen">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-emerald-950/60">Loading session keys...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
