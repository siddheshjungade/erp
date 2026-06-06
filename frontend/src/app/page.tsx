"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Sun, 
  Database, 
  Lock, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';

export default function Home() {
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="flex-1 flex flex-col relative bg-gradient-to-br from-[#f4faf6] via-[#ffffff] to-[#f9fdfa]">
      {/* Decorative Top-Right Soft Green Radial Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#d4f3dd] to-transparent rounded-full blur-[120px] opacity-60 pointer-events-none" />
      <div className="absolute top-[20%] left-[-100px] w-[400px] h-[400px] bg-gradient-to-tr from-[#e8f7ee] to-transparent rounded-full blur-[100px] opacity-40 pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#047857] flex items-center justify-center shadow-lg shadow-emerald-200">
              <Sun className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-emerald-950">Solar<span className="text-[#10b981]">ERP</span></span>
              <span className="block text-[10px] text-emerald-700/70 font-semibold tracking-wider uppercase -mt-1">Vertical SaaS</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              className="text-xs font-semibold text-emerald-900/70 hover:text-emerald-950 transition-colors"
            >
              Documentation
            </a>
            <button
              onClick={login}
              className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-950 border border-emerald-200 bg-white hover:bg-emerald-50/50 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Content Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Grid: Copy & Actions */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-800 tracking-wide uppercase">Phase 1 Live • Google OAuth & Sheets Handshake</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-emerald-950 leading-[1.1]">
            Your Solar Operations, <br />
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">Powered by Google Sheets</span>
          </h1>

          <p className="text-base sm:text-lg text-emerald-900/70 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
            Manage projects, inventory, leads, and financials within a single premium dashboard. We use your Google Drive Spreadsheet as a full relational database, ensuring 100% data ownership and no complex server overhead.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button
              onClick={login}
              className="w-full sm:w-auto px-8 py-4.5 bg-gradient-to-r from-emerald-500 to-[#047857] hover:from-[#059669] hover:to-[#065f46] text-white font-bold rounded-2xl shadow-xl shadow-emerald-200/80 hover:shadow-emerald-300/80 flex items-center justify-center gap-3 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer group"
            >
              {/* Google Custom SVG Icon */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Connect with Google Drive
              <ArrowRight className="w-4 h-4 text-emerald-100 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <a
              href="#features"
              className="w-full sm:w-auto px-7 py-4.5 bg-white text-emerald-950 font-bold rounded-2xl border border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50/20 text-center transition-all hover:scale-[1.01]"
            >
              Explore Architecture
            </a>
          </div>

          {/* Quick Stats/Trust badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3 border-t border-emerald-100/60 max-w-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-950/80">
              <ShieldCheck className="w-4 h-4 text-[#10b981]" /> Full Data Ownership
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-950/80">
              <Layers className="w-4 h-4 text-[#10b981]" /> Automated Schema Setup
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-950/80">
              <RefreshCw className="w-4 h-4 text-[#10b981]" /> Instant JWT Handshake
            </div>
          </div>
        </div>

        {/* Right Grid: Visual System Preview Mockup */}
        <div className="lg:col-span-5 relative flex items-center justify-center">
          {/* Background Rotating Sun/Flower Pattern */}
          <div className="absolute w-[360px] h-[360px] bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full animate-spin-slow opacity-80" />
          
          {/* Main Mockup Card */}
          <div className="relative w-full max-w-sm bg-white rounded-3xl border border-emerald-100 shadow-2xl p-6 hover-card-premium">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-emerald-950">Active Database Instance</span>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                Google API v4
              </span>
            </div>

            {/* Simulated Sheets Structure */}
            <div className="mt-5 space-y-3.5">
              <div className="bg-[#f7faf8] rounded-xl p-3 border border-emerald-100/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Database className="w-4.5 h-4.5 text-[#10b981]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-950">Solar ERP Database</h3>
                    <p className="text-[10px] text-emerald-800/60 font-semibold">Active in Google Drive</p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>

              {/* Visualization of relational tables */}
              <div className="space-y-2">
                <span className="block text-[10px] text-emerald-900/50 font-bold uppercase tracking-wider pl-1">Relational Tabs Setup</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-2 border border-gray-100 text-left">
                    <span className="block text-[9px] font-bold text-emerald-900/40">CONFIG</span>
                    <span className="block text-[10px] font-bold text-emerald-950">System Variables</span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-gray-100 text-left">
                    <span className="block text-[9px] font-bold text-emerald-900/40">PROJECTS</span>
                    <span className="block text-[10px] font-bold text-emerald-950">Solar System kW</span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-gray-100 text-left">
                    <span className="block text-[9px] font-bold text-emerald-900/40">INVENTORY</span>
                    <span className="block text-[10px] font-bold text-emerald-950">Panel Stock Level</span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-gray-100 text-left">
                    <span className="block text-[9px] font-bold text-emerald-900/40">LEADS</span>
                    <span className="block text-[10px] font-bold text-emerald-950">Client Pipelines</span>
                  </div>
                </div>
              </div>

              {/* Access Banner */}
              <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#10b981]" />
                  <span className="font-semibold text-emerald-950">Session Encryption</span>
                </div>
                <span className="font-bold text-emerald-800 text-[10px] uppercase">JWT Secured</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Grid / Details Section */}
      <section id="features" className="bg-white border-t border-emerald-100/50 py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-emerald-950">Solar ERP MVP Security & Schema Architecture</h2>
            <p className="text-sm font-medium text-emerald-900/60 leading-relaxed">
              We leverage modern web standards to merge standard Google accounts with robust, enterprise-grade authentication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#fbfdfb] rounded-2xl p-6 border border-emerald-100/50 space-y-4 hover-card-premium">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Lock className="w-5.5 h-5.5 text-[#10b981]" />
              </div>
              <h3 className="font-bold text-emerald-950 text-base">Google OAuth 2.0 Consent</h3>
              <p className="text-xs font-semibold text-emerald-950/60 leading-relaxed">
                Connect and authenticate easily. The application requests discrete scopes to create files, write configurations, and read sheets dynamically without having root permissions over your total drive files.
              </p>
            </div>

            <div className="bg-[#fbfdfb] rounded-2xl p-6 border border-emerald-100/50 space-y-4 hover-card-premium">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Layers className="1.1 h-5.5 text-[#10b981]" />
              </div>
              <h3 className="font-bold text-emerald-950 text-base">Automated Database Setup</h3>
              <p className="text-xs font-semibold text-emerald-950/60 leading-relaxed">
                Upon connecting, the backend instantly scans Google Drive for "Solar ERP Database". If missing, it will programmatically spawn the sheet, format the headers, freeze columns, and add initial configuration parameters in 3 seconds.
              </p>
            </div>

            <div className="bg-[#fbfdfb] rounded-2xl p-6 border border-emerald-100/50 space-y-4 hover-card-premium">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <LayoutDashboard className="w-5.5 h-5.5 text-[#10b981]" />
              </div>
              <h3 className="font-bold text-emerald-950 text-base">Next-Gen Vertical Dashboard</h3>
              <p className="text-xs font-semibold text-emerald-950/60 leading-relaxed">
                Enjoy a pristine, high-fidelity light green UI interface built using Tailwind CSS and Outfit font design systems. Track live sheets synchronization and browse your system's data structure cleanly in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#fbfdfb] border-t border-gray-100 py-8 px-6 text-center text-xs font-semibold text-emerald-950/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 Solar ERP Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-emerald-950">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-950">Terms of Service</a>
            <a href="#" className="hover:text-emerald-950">API Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
