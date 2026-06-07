/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Store, ShoppingBag, LogOut, UserCheck } from "lucide-react";
import ConsumerInterface from "./components/ConsumerInterface";
import SmbInterface from "./components/SmbInterface";
import RegistrationPage from "./components/RegistrationPage";

interface ConsumerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  photo: string;
  createdAt: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"consumer" | "smb">("consumer");

  // Load consumer profile from localStorage on startup
  const [registeredConsumer, setRegisteredConsumer] = useState<ConsumerProfile | null>(() => {
    try {
      const cached = localStorage.getItem("localstitch_consumer");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Load SMB profile from localStorage on startup
  const [registeredSmb, setRegisteredSmb] = useState<any | null>(() => {
    try {
      const cached = localStorage.getItem("localstitch_smb");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const handleRegisterSuccess = (data: ConsumerProfile) => {
    try {
      localStorage.setItem("localstitch_consumer", JSON.stringify(data));
    } catch (err) {
      console.error("Local storage caching failed", err);
    }
    setRegisteredConsumer(data);
    setActiveTab("consumer");
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("localstitch_consumer");
    } catch (err) {
      console.error(err);
    }
    setRegisteredConsumer(null);
  };

  const handleSmbRegisterSuccess = (data: any) => {
    try {
      localStorage.setItem("localstitch_smb", JSON.stringify(data));
    } catch (err) {
      console.error("Local storage caching failed for SMB", err);
    }
    setRegisteredSmb(data);
    setActiveTab("smb");
  };

  const handleLogoutSmb = () => {
    try {
      localStorage.removeItem("localstitch_smb");
    } catch (err) {
      console.error(err);
    }
    setRegisteredSmb(null);
  };

  return (
    <div id="main-frame" className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased p-2 md:p-6">
      {/* Primary Brand Navigation Bar built as Bento Header */}
      <header id="primary-header" className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white/60 p-4 md:p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-600/10">S</div>
          <h1 id="brand-title" className="text-2xl font-black tracking-tight uppercase">Local<span className="text-indigo-600 italic">Stitch</span> <span className="text-xs tracking-widest text-indigo-600/60 font-mono px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50/50">AI</span></h1>
        </div>

        {/* Unified Role Toggle Buttons styled as full rounded-full capsules */}
        <div id="unified-tabs" className="flex bg-white rounded-full p-1 border border-slate-205 shadow-sm">
          <button
            id="tab-consumer-btn"
            onClick={() => setActiveTab("consumer")}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "consumer"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Consumer Wardrobe
          </button>
          <button
            id="tab-smb-btn"
            onClick={() => setActiveTab("smb")}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "smb"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Store className="w-4 h-4" />
            SMB Portal
          </button>
        </div>

        {/* Dynamic header profile display based on active role & setup status */}
        <div className="flex items-center gap-4">
          {activeTab === "consumer" && registeredConsumer ? (
            <div className="flex items-center gap-3 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl px-3 py-1.5 shadow-2xs">
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black tracking-wider text-indigo-700 uppercase flex items-center justify-end gap-1">
                  <UserCheck className="w-2.5 h-2.5" /> Synchronized Buyer
                </p>
                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{registeredConsumer.name}</p>
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-indigo-200 shadow-sm overflow-hidden flex items-center justify-center bg-white">
                <img
                  src={registeredConsumer.photo}
                  alt={registeredConsumer.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                title="Reset Consumer Profile"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : activeTab === "smb" && registeredSmb ? (
            <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl px-3 py-1.5 shadow-2xs">
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-black tracking-wider text-emerald-700 uppercase flex items-center justify-end gap-1">
                  <Store className="w-2.5 h-2.5" /> Synchronized Merchant
                </p>
                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{registeredSmb.name}</p>
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-emerald-200 bg-white flex items-center justify-center text-sm font-black text-emerald-700">
                {registeredSmb.name.substring(0, 2).toUpperCase()}
              </div>
              <button
                onClick={handleLogoutSmb}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                title="Logout from Boutique"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">LOCAL PARTNER</p>
                <p className="text-xs font-bold text-slate-700">Elena's Boutique</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-tr from-indigo-100 to-indigo-300 flex items-center justify-center text-indigo-700 font-extrabold text-sm font-mono">EB</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Body Stage */}
      <main id="primary-stage" className="flex-1 max-w-7xl w-full mx-auto px-1 md:px-4 py-4">
        <div id="sub-page-transition-frame" className="transition-all duration-300">
          {activeTab === "consumer" ? (
            registeredConsumer ? (
              <ConsumerInterface />
            ) : (
              <RegistrationPage
                initialRole="consumer"
                onRegisterSuccess={handleRegisterSuccess}
                onSkipToSMB={() => setActiveTab("smb")}
                onSmbRegisterSuccess={handleSmbRegisterSuccess}
              />
            )
          ) : (
            registeredSmb ? (
              <SmbInterface registeredSmb={registeredSmb} onLogoutSmb={handleLogoutSmb} />
            ) : (
              <RegistrationPage
                initialRole="smb"
                onRegisterSuccess={handleRegisterSuccess}
                onSkipToSMB={() => setActiveTab("smb")}
                onSmbRegisterSuccess={handleSmbRegisterSuccess}
              />
            )
          )}
        </div>
      </main>

      {/* Humble Elegant Footer Footer */}
      <footer id="primary-footer" className="bg-white border-t border-slate-100 py-6 mt-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p id="footer-text" className="text-xs text-slate-450 text-center md:text-left leading-normal">
            LocalStitch AI connects independent clothing brands with local consumers inside San Francisco.
          </p>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span id="system-status-indicator" className="text-[10px] font-black text-slate-400 font-mono uppercase tracking-widest">
              Live Cloud Connection Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

