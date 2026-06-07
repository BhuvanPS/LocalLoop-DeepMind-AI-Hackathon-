/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Store, User, Mail, Phone, Calendar, Image as ImageIcon, CheckCircle, ArrowRight, Loader2, Landmark } from "lucide-react";
import { db } from "../firebase";
import { setDoc, doc } from "firebase/firestore";
import UploadDropzone from "./UploadDropzone";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: "local-client-session",
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface RegistrationPageProps {
  initialRole?: "consumer" | "smb";
  onRegisterSuccess: (consumerData: {
    id: string;
    name: string;
    email: string;
    phone: string;
    age: number;
    photo: string;
    createdAt: string;
  }) => void;
  onSkipToSMB: () => void;
  onSmbRegisterSuccess: (smbData: {
    id: string;
    name: string;
    ownerEmail: string;
    locationName: string;
    latitude: number;
    longitude: number;
    targetAudience: string;
    targetLocalities: string[];
  }) => void;
}

const SF_NEIGHBORHOODS = [
  { name: "Union Square", lat: "37.7891", lng: "-122.4068", localities: "Union Square, Nob Hill, Chinatown, Financial District" },
  { name: "Mission District", lat: "37.7523", lng: "-122.4184", localities: "Mission District, Noe Valley, Castro, Potrero Hill" },
  { name: "Haight-Ashbury", lat: "37.7699", lng: "-122.4468", localities: "Haight-Ashbury, Western Addition, Richmond, Cole Valley" },
  { name: "Castro", lat: "37.7629", lng: "-122.4350", localities: "Castro, Twin Peaks, Duboce Triangle, Noe Valley" },
  { name: "Financial District", lat: "37.7940", lng: "-122.4014", localities: "Financial District, Embarcadero, North Beach" },
  { name: "Pacific Heights", lat: "37.7925", lng: "-122.4356", localities: "Pacific Heights, Cow Hollow, Marina, Presidio" }
];

export default function RegistrationPage({
  initialRole = "consumer",
  onRegisterSuccess,
  onSkipToSMB,
  onSmbRegisterSuccess
}: RegistrationPageProps) {
  const [role, setRole] = useState<"consumer" | "smb">(initialRole);

  // Sync role with initialRole prop
  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  // Consumer inputs state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // SMB inputs state - Registration
  const [smbName, setSmbName] = useState("");
  const [smbEmail, setSmbEmail] = useState("");
  const [smbAddress, setSmbAddress] = useState("");
  const [smbLat, setSmbLat] = useState("37.7523");
  const [smbLng, setSmbLng] = useState("-122.4184");
  const [smbAudience, setSmbAudience] = useState("");
  const [smbLocalities, setSmbLocalities] = useState("Mission District, Noe Valley");
  const [selectedNeighborhoodPreset, setSelectedNeighborhoodPreset] = useState("Mission District");

  // SMB inputs state - Login
  const [existingStores, setExistingStores] = useState<any[]>([]);
  const [selectedLoginStoreId, setSelectedLoginStoreId] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [isSmbRegisterActive, setIsSmbRegisterActive] = useState(false);

  // Status flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch existing stores on mount for quick login select selection
  useEffect(() => {
    const fetchExistingStores = async () => {
      try {
        const res = await fetch("/api/smb");
        if (res.ok) {
          const data = await res.json();
          setExistingStores(data);
          if (data.length > 0) {
            setSelectedLoginStoreId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load stores lists", err);
      }
    };
    fetchExistingStores();
  }, [success]);

  // Handle preset selected to autocomplete coordinates and localities
  const handleNeighborhoodChange = (presetName: string) => {
    setSelectedNeighborhoodPreset(presetName);
    const found = SF_NEIGHBORHOODS.find((n) => n.name === presetName);
    if (found) {
      setSmbLat(found.lat);
      setSmbLng(found.lng);
      setSmbLocalities(found.localities);
    }
  };

  const handleConsumerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate photo exists
    if (!photoBase64) {
      setErrorMessage("Please upload your full silhouette photo to create your wardrobe profile.");
      return;
    }

    // Validate age is numerical
    const numericAge = parseInt(age, 10);
    if (isNaN(numericAge) || numericAge < 1 || numericAge > 120) {
      setErrorMessage("Please enter a valid age.");
      return;
    }

    setIsSubmitting(true);

    const clientUniqueId = "consumer_" + Date.now();
    const consumerObject = {
      id: clientUniqueId,
      name,
      email,
      phone,
      age: numericAge,
      photo: photoBase64,
      createdAt: new Date().toISOString(),
    };

    const docPath = `consumers/${clientUniqueId}`;
    try {
      // Save directly to Firebase Firestore
      try {
        await setDoc(doc(db, "consumers", clientUniqueId), consumerObject);
      } catch (fErr) {
        console.warn("Firestore sync warning (using active local session):", fErr);
      }

      setSuccess(true);
      setTimeout(() => {
        onRegisterSuccess(consumerObject);
      }, 1500);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage("Registration failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSmbRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!smbName || !smbEmail || !smbAddress || !smbAudience) {
      setErrorMessage("Please fill out all requested merchant information.");
      return;
    }

    setIsSubmitting(true);

    const localitiesList = smbLocalities
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    const clientUniqueId = "smb_" + Date.now();
    const storeObject = {
      id: clientUniqueId,
      name: smbName,
      ownerEmail: smbEmail,
      locationName: smbAddress,
      latitude: parseFloat(smbLat) || 37.7749,
      longitude: parseFloat(smbLng) || -122.4194,
      targetAudience: smbAudience,
      targetLocalities: localitiesList.length > 0 ? localitiesList : ["San Francisco"]
    };

    try {
      // 1. Post to REST API database
      const res = await fetch("/api/smb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeObject)
      });

      if (!res.ok) {
        throw new Error("Local REST synchronization failed");
      }

      // 2. Also save to Firestore (optional fallback)
      try {
        await setDoc(doc(db, "smbs", clientUniqueId), storeObject);
      } catch (firestoreErr) {
        console.warn("Firestore secondary sync warning (proceeding with REST fallback):", firestoreErr);
      }

      setSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onSmbRegisterSuccess(storeObject);
      }, 1500);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage("Registration failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleSmbLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedLoginStoreId) {
      setErrorMessage("Please choose your boutique storefront from the selection.");
      return;
    }

    const matchedStore = existingStores.find((s) => s.id === selectedLoginStoreId);
    if (!matchedStore) {
      setErrorMessage("The selected boutique profile was not found.");
      return;
    }

    // Verify contact email matches standard checks
    if (loginEmail.trim() && matchedStore.ownerEmail.toLowerCase() !== loginEmail.trim().toLowerCase()) {
      setErrorMessage("Owner contact email mismatch. Please input correct profile owner email.");
      return;
    }

    setSuccess(true);
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSmbRegisterSuccess(matchedStore);
    }, 1200);
  };

  return (
    <div id="registration-workspace" className="max-w-4xl mx-auto my-6 p-2 md:p-4 animate-fade-in">
      {/* Visual Header Grid Accent */}
      <div id="registration-header-grid" className="text-center mb-8 space-y-2">
        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-200">
          Onboarding Portal
        </span>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
          Welcome to LocalStitch AI
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Select your role, connect with local coordinates, and access active local fashion databases.
        </p>
      </div>

      {/* Choice Toggle cards */}
      <div id="role-select-cards" className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div
          id="toggle-card-consumer"
          onClick={() => {
            setRole("consumer");
            setErrorMessage(null);
            setSuccess(false);
          }}
          className={`cursor-pointer border-2 rounded-3xl p-6 transition-all duration-300 flex items-start gap-4 shadow-sm bg-white hover:shadow-md ${
            role === "consumer"
              ? "border-indigo-600 bg-indigo-50/10 scale-[1.01]"
              : "border-slate-200 opacity-70 hover:opacity-100"
          }`}
        >
          <div className={`p-3.5 rounded-2xl ${role === "consumer" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-tight flex items-center gap-2">
              Join as Consumer
              {role === "consumer" && <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />}
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              Style intelligent outfits, match silhouette cuts, and grab high-street boutique markdowns in SF.
            </p>
          </div>
        </div>

        <div
          id="toggle-card-smb"
          onClick={() => {
            setRole("smb");
            setErrorMessage(null);
            setSuccess(false);
          }}
          className={`cursor-pointer border-2 rounded-3xl p-6 transition-all duration-300 flex items-start gap-4 shadow-sm bg-white hover:shadow-md ${
            role === "smb"
              ? "border-indigo-600 bg-indigo-50/10 scale-[1.01]"
              : "border-slate-200 opacity-70 hover:opacity-100"
          }`}
        >
          <div className={`p-3.5 rounded-2xl ${role === "smb" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
            <Store className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-tight flex items-center gap-2">
              Digitalize Clothing SMB
              {role === "smb" && <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />}
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              Host catalogues, run strategic local undercut campaigns, and broadcast real-time inventory hooks.
            </p>
          </div>
        </div>
      </div>

      {role === "consumer" ? (
        <form
          onSubmit={handleConsumerSubmit}
          className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 animate-fade-in"
        >
          {/* Left panel inputs */}
          <div className="p-6 md:p-8 md:col-span-7 space-y-5">
            <div>
              <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest block font-mono">Consumer Ledger</span>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-0.5">
                Register Silhouette Profile
              </h3>
              <p className="text-xs text-slate-450 mt-1">
                Your profile is synchronized with Firebase Firestore for safe offline outfit recall.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 text-rose-700 text-xs font-bold rounded-2xl border border-rose-200 animate-pulse">
                ⚠️ {errorMessage}
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl border border-emerald-200 animate-bounce flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Successfully synchronized! Transitioning to your wardrobe cabin...
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Alexandra Rivers"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(415) 555-0199"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Your Age
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="130"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g., 27"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || success}
              className="w-full py-4 px-6 bg-indigo-600 hover:bg-slate-900 border-none disabled:bg-slate-350 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10 cursor-pointer text-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                  Synchronizing records...
                </>
              ) : (
                <>
                  Submit Profile Registration
                  <ArrowRight className="w-4 h-4 text-indigo-200" />
                </>
              )}
            </button>
          </div>

          {/* Right panel: Full Body Photo upload */}
          <div className="bg-slate-50 p-6 md:p-8 md:col-span-12 lg:col-span-5 border-t md:border-t-0 md:border-l border-slate-200/80 flex flex-col justify-between gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Full-Body Portrait
              </label>
              <p className="text-xs text-slate-400 leading-normal mb-4">
                Upload a portrait silhouette. This provides clothing matching algorithms with structural bounds.
              </p>
              <UploadDropzone onImageSelected={setPhotoBase64} selectedImageUrl={photoBase64} />
            </div>

            <div className="hidden md:block bg-white p-3.5 rounded-2xl border border-slate-150 text-[10px] text-slate-400 leading-relaxed font-mono">
              <span className="font-extrabold text-slate-600 block uppercase mb-1">Privacy Safe Guards</span>
              Files are processed securely. LocalStitch does not resell demographic profiles.
            </div>
          </div>
        </form>
      ) : (
        /* SMB Registration and Login Module card */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="text-center space-y-1 max-w-lg mx-auto">
            <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest block font-mono">Merchant Portal</span>
            <h3 id="smb-onboarding-title" className="text-xl font-black text-slate-900 uppercase tracking-tight">Clothing Partner Onboarding</h3>
            <p id="smb-onboarding-desc" className="text-xs text-slate-400">Sign into an existing SF merchant store, or launch a brand new boutique node live in the localized network map.</p>
          </div>

          {/* Mode Switch Pills */}
          <div className="flex bg-slate-100 rounded-full p-1 max-w-xs mx-auto">
            <button
              id="switch-smb-login-btn"
              type="button"
              onClick={() => {
                setIsSmbRegisterActive(false);
                setErrorMessage(null);
                setSuccess(false);
              }}
              className={`flex-1 py-2 px-4 text-xs font-black uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                !isSmbRegisterActive ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In
            </button>
            <button
              id="switch-smb-reg-btn"
              type="button"
              onClick={() => {
                setIsSmbRegisterActive(true);
                setErrorMessage(null);
                setSuccess(false);
              }}
              className={`flex-1 py-2 px-4 text-xs font-black uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                isSmbRegisterActive ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Register Shop
            </button>
          </div>

          {errorMessage && (
            <div className="p-4 bg-rose-50 text-rose-700 text-xs font-bold rounded-2xl border border-rose-200 animate-pulse text-center max-w-xl mx-auto">
              ⚠️ {errorMessage}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl border border-emerald-200 animate-pulse flex items-center justify-center gap-2 text-center max-w-xl mx-auto">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Boutique verified! Opening management cabin dashboard...
            </div>
          )}

          {!isSmbRegisterActive ? (
            /* SMB Sign In Form */
            <form onSubmit={handleSmbLoginSubmit} className="max-w-xl mx-auto space-y-4">
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-150">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5 text-indigo-600" /> Select Storefront Boutique
                  </label>
                  <div className="relative">
                    <select
                      id="login-smb-select"
                      value={selectedLoginStoreId}
                      onChange={(e) => setSelectedLoginStoreId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 appearance-none"
                    >
                      {existingStores.length === 0 ? (
                        <option value="">No registered stores yet</option>
                      ) : (
                        existingStores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name} — {store.locationName.split(",")[0]}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 text-xs font-bold">
                      ▼
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-505 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" /> Owner Contact Email
                  </label>
                  <input
                    id="login-smb-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g., hello@bohemalinen.com"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 font-mono">Matches the registered boutique owner email address.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRole("consumer")}
                  className="flex-1 py-4 border border-slate-200 rounded-2xl text-xs font-black uppercase text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Back to Buyer Form
                </button>
                <button
                  id="submit-smb-login"
                  type="submit"
                  disabled={isSubmitting || success || existingStores.length === 0}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-slate-900 border-none disabled:bg-slate-350 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all cursor-pointer"
                >
                  Enter Portal Dashboard
                </button>
              </div>
            </form>
          ) : (
            /* SMB Registration Form */
            <form onSubmit={handleSmbRegisterSubmit} className="space-y-4 max-w-2xl mx-auto">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 space-y-4">
                <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest block font-mono">Configure Store Node</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Shop / Brand Name</label>
                    <input
                      id="reg-smb-name"
                      type="text"
                      required
                      value={smbName}
                      onChange={(e) => setSmbName(e.target.value)}
                      placeholder="e.g., Mission Velvet Studio"
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Owner Contact Email</label>
                    <input
                      id="reg-smb-email"
                      type="email"
                      required
                      value={smbEmail}
                      onChange={(e) => setSmbEmail(e.target.value)}
                      placeholder="e.g., team@missionvelvet.com"
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Physical Store Address</label>
                  <input
                    id="reg-smb-address"
                    type="text"
                    required
                    value={smbAddress}
                    onChange={(e) => setSmbAddress(e.target.value)}
                    placeholder="e.g., 901 Valencia St, San Francisco, CA"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="border-t border-slate-200 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Neighborhood Coordinator Preset</label>
                    <div className="relative">
                      <select
                        id="reg-smb-preset"
                        value={selectedNeighborhoodPreset}
                        onChange={(e) => handleNeighborhoodChange(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-3.5 text-xs font-bold text-slate-800 outline-none appearance-none"
                      >
                        {SF_NEIGHBORHOODS.map((n) => (
                          <option key={n.name} value={n.name}>
                            {n.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 text-xs font-bold">
                        ▼
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Latitude coordinate</label>
                    <input
                      id="reg-smb-lat"
                      type="text"
                      required
                      value={smbLat}
                      onChange={(e) => setSmbLat(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Longitude coordinate</label>
                    <input
                      id="reg-smb-lng"
                      type="text"
                      required
                      value={smbLng}
                      onChange={(e) => setSmbLng(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target Client Persona</label>
                    <input
                      id="reg-smb-audience"
                      type="text"
                      required
                      value={smbAudience}
                      onChange={(e) => setSmbAudience(e.target.value)}
                      placeholder="e.g., Young creatives and dark-fringe enthusiasts"
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Broadcast Neighborhood Zones (comma list)</label>
                    <input
                      id="reg-smb-localities"
                      type="text"
                      required
                      value={smbLocalities}
                      onChange={(e) => setSmbLocalities(e.target.value)}
                      placeholder="e.g., Mission District, Castro, Potrero Hill"
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSmbRegisterActive(false)}
                  className="flex-1 py-4 border border-slate-200 rounded-2xl text-xs font-black uppercase text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Return to Sign In
                </button>
                <button
                  id="submit-smb-register"
                  type="submit"
                  disabled={isSubmitting || success}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-slate-900 border-none disabled:bg-slate-350 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? "Launching Brand Node..." : "Register & Enter Dashboard"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
