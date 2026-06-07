/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, MapPin, CheckCircle, Navigation, Loader, Truck, DollarSign, Image as ImageIcon, ChevronRight, Tag, HelpCircle } from "lucide-react";
import UploadDropzone from "./UploadDropzone";
import { SKUItem, MatchedStoreInfo, SavedOutfit, ActiveDiscount } from "../types";
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_PLATFORM_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(GOOGLE_MAPS_PLATFORM_KEY) && GOOGLE_MAPS_PLATFORM_KEY !== "YOUR_API_KEY";

// Dynamic Earth Distance formula (Haversine)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return parseFloat(d.toFixed(1));
}

// Circular Radius indicator component
function MapCircularRadius({ center, radiusKm }: { center: google.maps.LatLngLiteral; radiusKm: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const circle = new google.maps.Circle({
      strokeColor: '#4f46e5',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#6366f1',
      fillOpacity: 0.12,
      map,
      center,
      radius: radiusKm * 1000 // Convert km to meters
    });
    return () => {
      circle.setMap(null);
    };
  }, [map, center, radiusKm]);
  return null;
}

const BODY_TYPES = [
  { id: "petite", name: "Petite & Balanced", desc: "Short torso or legs, streamlined look" },
  { id: "athletic", name: "Athletic & Broad", desc: "Structured shoulders, high mobility fits" },
  { id: "average", name: "Standard / Average", desc: "Balanced proportions, standard sizing fit" },
  { id: "hourglass", name: "Curvy / Hourglass", desc: "Defined waist, flared outlines and shapes" },
  { id: "tall", name: "Tall & Slender", desc: "Long limbs, draped fabrics and long hems" }
];

const OCCASIONS = [
  { value: "Office / Work Wear", label: "🏢 Office & Business Casual" },
  { value: "An Elegant Wedding or Gala", label: "💍 Wedding & Formal Ceremonies" },
  { value: "Weekend Party or Night Out", label: "🍹 Party, Club & Night Out" },
  { value: "Casual Beach or Park Hangout", label: "🌳 Casual Outdoor Picnic" },
  { value: "Lazing at Home / Coziness", label: "☕ Loungewear & Cozy Coffee Runs" }
];

const MOODS = [
  { value: "Confident & Sharp", label: "⚡ Bold & Eye-catching" },
  { value: "Relaxed & Carefree", label: "🍃 Laid-back & Comfortable" },
  { value: "Chic & Mysterious", label: "🖤 Sleek & Alluvial" },
  { value: "Joyful & Colorful", label: "🌈 Vibrant, Pastel & Lively" }
];

const STYLES = [
  { value: "classic", label: "🏛️ Timeless Classic (Trench coats, trousers)" },
  { value: "trendy", label: "🔥 Trendy Streetwear (Oversized, baggy denim)" },
  { value: "bohemian", label: "🌻 Bohemian / Earthy (Linens, knitwear, fringe)" },
  { value: "minimalist", label: "🤍 Eco-Minimalist (Clean monochrome, simple)" }
];

// SF Coordinates fallback points for simulation
const SIMULATED_LOCATIONS = [
  { name: "SF Downtown / Union Square", lat: 37.7876, lng: -122.4074 },
  { name: "Mission District", lat: 37.7599, lng: -122.4348 },
  { name: "Richmond District (West)", lat: 37.7796, lng: -122.4838 },
  { name: "East Bay (Out of 10km Range)", lat: 37.8044, lng: -122.2711 }
];

export default function ConsumerInterface() {
  // Read consumer profile from localStorage for Virtual Try-On
  const [userProfile, setUserProfile] = useState<any>(() => {
    try {
      const cached = localStorage.getItem("localstitch_consumer");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Navigation / Choices State
  const [activeTab, setActiveTab] = useState<"questions" | "image">("questions");
  const [occasion, setOccasion] = useState(OCCASIONS[2].value);
  const [mood, setMood] = useState(MOODS[0].value);
  const [intention, setIntention] = useState(STYLES[0].value);
  const [bodyType, setBodyType] = useState(BODY_TYPES[2].id);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [tailoringChoice, setTailoringChoice] = useState<"guidance" | "photo">("guidance");
  const [tailoringPhotoBase64, setTailoringPhotoBase64] = useState<string | null>(null);

  // Simulated Coordinates
  const [selectedCoordsIndex, setSelectedCoordsIndex] = useState(0);
  const [latitude, setLatitude] = useState(SIMULATED_LOCATIONS[selectedCoordsIndex].lat);
  const [longitude, setLongitude] = useState(SIMULATED_LOCATIONS[selectedCoordsIndex].lng);
  
  // Running Active Discounts
  const [runningDiscounts, setRunningDiscounts] = useState<ActiveDiscount[]>([]);
  const [showOffers, setShowOffers] = useState<boolean>(false);
  const [showTailoring, setShowTailoring] = useState<boolean>(false);

  // Try-On Specific States
  const [tryonMode, setTryonMode] = useState<"mirror" | "garment">("mirror");
  const [tryonData, setTryonData] = useState<any>(null);

  // Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [outfitResult, setOutfitResult] = useState<SavedOutfit | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchedStores, setMatchedStores] = useState<MatchedStoreInfo[]>([]);
  const [matchingError, setMatchingError] = useState("");

  // Loading states
  const [loadingStep, setLoadingStep] = useState(0);

  // Geolocation & Radius Settings
  const [purchaseRadius, setPurchaseRadius] = useState<number>(10); // in km
  const [useLiveLocation, setUseLiveLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [distanceMatrixData, setDistanceMatrixData] = useState<any[]>([]);
  const [smbStores, setSmbStores] = useState<any[]>([]);

  // Sync coords with index selection if live GPS is inactive
  useEffect(() => {
    if (useLiveLocation) return;
    const loc = SIMULATED_LOCATIONS[selectedCoordsIndex];
    setLatitude(loc.lat);
    setLongitude(loc.lng);
  }, [selectedCoordsIndex, useLiveLocation]);

  // Fetch running discounts & SMB stores on mount
  useEffect(() => {
    fetchRunningOffers();
    fetchSmbStores();
  }, []);

  const fetchSmbStores = async () => {
    try {
      const res = await fetch("/api/smb");
      if (res.ok) {
        const data = await res.json();
        setSmbStores(data);
      }
    } catch (err) {
      console.error("Error fetching smb stores:", err);
    }
  };

  const fetchRunningOffers = async () => {
    try {
      const res = await fetch("/api/discounts");
      if (res.ok) {
        const data = await res.json();
        setRunningDiscounts(data);
      }
    } catch (err) {
      console.error("Error fetching discounts:", err);
    }
  };

  const detectLiveLocation = () => {
    setIsDetectingLocation(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setUseLiveLocation(true);
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMsg = "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location access denied. Please enable browser location permissions or choose a simulated preset.";
        }
        setLocationError(errorMsg);
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Distance Matrix calculation effect (Local Earth formula with real Distance Matrix query option)
  useEffect(() => {
    if (smbStores.length === 0) return;

    // Local Haversine fallback calculations
    const fallbackData = smbStores.map(s => {
      const dist = getDistanceKm(latitude, longitude, s.latitude, s.longitude);
      return {
        storeId: s.id,
        storeName: s.name,
        distanceText: `${dist} km`,
        distanceVal: dist,
        durationText: `${Math.round(dist * 2.5)} mins drive`,
        durationVal: Math.round(dist * 150)
      };
    });

    if (!GOOGLE_MAPS_PLATFORM_KEY || typeof google === "undefined" || !google.maps || !google.maps.DistanceMatrixService) {
      setDistanceMatrixData(fallbackData);
      return;
    }

    try {
      const service = new google.maps.DistanceMatrixService();
      const destinations = smbStores.map(s => new google.maps.LatLng(s.latitude, s.longitude));
      const origin = new google.maps.LatLng(latitude, longitude);

      service.getDistanceMatrix({
        origins: [origin],
        destinations: destinations,
        travelMode: google.maps.TravelMode.DRIVING,
      }, (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          const results = response.rows[0].elements;
          const updated = smbStores.map((s, idx) => {
            const element = results[idx];
            if (element && element.status === "OK") {
              return {
                storeId: s.id,
                storeName: s.name,
                distanceText: element.distance.text,
                distanceVal: element.distance.value / 1000, // to km
                durationText: element.duration.text,
                durationVal: element.duration.value
              };
            } else {
              const dist = getDistanceKm(latitude, longitude, s.latitude, s.longitude);
              return {
                storeId: s.id,
                storeName: s.name,
                distanceText: `${dist} km`,
                distanceVal: dist,
                durationText: `${Math.round(dist * 2.5)} mins drive`,
                durationVal: Math.round(dist * 150)
              };
            }
          });
          setDistanceMatrixData(updated);
        } else {
          console.warn("Distance Matrix status failed:", status);
          setDistanceMatrixData(fallbackData);
        }
      });
    } catch (e) {
      console.error("Distance Matrix lookup failure:", e);
      setDistanceMatrixData(fallbackData);
    }
  }, [latitude, longitude, smbStores]);

  // Automated loading texts
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const getLoadingMessage = () => {
    const msgs = [
      "Consulting local style designers...",
      "Matching fabric weights with current weather in San Francisco...",
      "Mapping designed look to your specified body type boundaries...",
      "Stitching the cohesive look and color palette..."
    ];
    return msgs[loadingStep];
  };

  const handleStyleSubmit = async () => {
    setIsGenerating(true);
    setOutfitResult(null);
    setMatchedStores([]);
    setMatchingError("");
    setTryonData(null);

    try {
      const res = await fetch("/api/generate-outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion: activeTab === "questions" ? occasion : "",
          mood: activeTab === "questions" ? mood : "",
          intention: activeTab === "questions" ? intention : "",
          bodyType,
          base64Image: activeTab === "image" ? uploadedBase64 : null
        })
      });

      if (!res.ok) {
        throw new Error("Local servers failed to process styled parameters");
      }

      const data = await res.json();
      
      const randomSeed = Math.floor(Math.random() * 1000);
      const clothingMock = `https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80&sig=${randomSeed}`;

      // Call our custom Banana Generator Try-On API!
      const activeUserPortrait = activeTab === "image"
        ? uploadedBase64
        : (tailoringChoice === "photo"
            ? (tailoringPhotoBase64 || uploadedBase64 || userProfile?.photo || null)
            : (userProfile?.photo || uploadedBase64 || null));
      
      const tryonResponse = await fetch("/api/banana-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPhoto: activeUserPortrait,
          aestheticName: data.aestheticName,
          colors: data.colors,
          components: data.components,
          intention: activeTab === "questions" ? intention : "classic",
          occasion: activeTab === "questions" ? occasion : "Custom Outing"
        })
      });

      let tryonResult = null;
      let finalClothingUrl = clothingMock;

      if (tryonResponse.ok) {
        tryonResult = await tryonResponse.json();
        setTryonData(tryonResult);
        if (tryonResult.clothingTemplateUrl) {
          finalClothingUrl = tryonResult.clothingTemplateUrl;
        }
        // Force Try-On mirror if user photo is available
        setTryonMode(activeUserPortrait ? "mirror" : "garment");
      }

      setOutfitResult({
        id: "outfit_" + Date.now(),
        occasion: activeTab === "questions" ? occasion : "Extracted from Image",
        mood: activeTab === "questions" ? mood : "Uploaded Outfit Style",
        intention: activeTab === "questions" ? intention : "Dynamic Custom",
        bodyType: BODY_TYPES.find(b => b.id === bodyType)?.name || bodyType,
        generatedImageUrl: finalClothingUrl,
        generatedDescription: data.visualDescription,
        isApproved: false,
        matchedStores: []
      });
      
      // Append temporary data we'll need for matching
      (window as any).tempAesthetic = data;
    } catch (err: any) {
      alert("Error styling outfit: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveOutfit = async () => {
    if (!outfitResult) return;
    setIsMatching(true);
    setMatchingError("");

    const aesthetic = (window as any).tempAesthetic || {
      visualDescription: outfitResult.generatedDescription,
      tags: ["classic", "minimalist", "trendy"]
    };

    try {
      const res = await fetch("/api/match-outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outfitDescription: aesthetic.visualDescription,
          tags: aesthetic.tags,
          userLat: latitude,
          userLng: longitude,
          radiusKm: purchaseRadius
        })
      });

      if (!res.ok) {
        throw new Error("Unable to check local catalog availability.");
      }

      const matches = await res.json();
      setMatchedStores(matches);
      
      if (matches.length === 0) {
        setMatchingError(`No matching items found within your active ${purchaseRadius} km purchase radius of your location. Try expanding your purchase radius zone or select simulated points close to merchants!`);
      }
    } catch (err: any) {
      setMatchingError("Error connecting to nearby boutique registers: " + err.message);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div id="consumer-view" className="space-y-6 animate-fade-in">
      {/* Geolocation Active Radar & Purchase Radius Dashboard */}
      <div id="geolocation-radar-dashboard" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/10">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 id="radar-title" className="text-sm font-black text-slate-950 uppercase tracking-tight">Real-time Purchase Radar</h4>
                <span id="location-mode-badge" className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                  useLiveLocation 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-250 animate-pulse" 
                    : "bg-amber-50 text-amber-700 border-amber-250"
                }`}>
                  {useLiveLocation ? "🛰️ Active GPS" : "⚙️ Simulated"}
                </span>
              </div>
              <p id="radar-desc" className="text-xs text-slate-450">Scan merchant physical catalogs relative to your immediate position via Google maps matrix metrics.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              id="locate-gps-detector-btn"
              onClick={detectLiveLocation}
              disabled={isDetectingLocation}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all border cursor-pointer ${
                useLiveLocation 
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
              }`}
            >
              {isDetectingLocation ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Acquiring GPS...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  {useLiveLocation ? "Locate Me Again" : "Detect My Position"}
                </>
              )}
            </button>
            {useLiveLocation && (
              <button
                id="disable-live-loc-btn"
                onClick={() => {
                  setUseLiveLocation(false);
                  setSelectedCoordsIndex(0);
                  setLatitude(SIMULATED_LOCATIONS[0].lat);
                  setLongitude(SIMULATED_LOCATIONS[0].lng);
                }}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-55 border border-slate-205 rounded-xl transition-all cursor-pointer"
              >
                Reset Preset
              </button>
            )}
          </div>
        </div>

        {locationError && (
          <div id="radar-warning" className="bg-amber-50 border border-amber-150 rounded-2xl p-4 text-xs font-bold text-amber-900 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-extrabold uppercase text-[9px] tracking-wider text-amber-800 mb-0.5">Authorization Indicator Required</p>
              <p>{locationError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Purchase Radius</span>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-150">{purchaseRadius} km zone</span>
              </div>
              <input
                id="purchase-radius-scroller"
                type="range"
                min="1"
                max="25"
                value={purchaseRadius}
                onChange={(e) => setPurchaseRadius(parseInt(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
                <span>1 km</span>
                <span>10 km</span>
                <span>20 km</span>
                <span>25 km</span>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 space-y-4">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Selected Center</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono font-bold text-slate-700">
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 truncate">
                    <span className="block text-[8px] uppercase tracking-wider text-slate-450 font-black mb-0.5">Lat</span>
                    {latitude.toFixed(5)}
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 truncate">
                    <span className="block text-[8px] uppercase tracking-wider text-slate-450 font-black mb-0.5">Lng</span>
                    {longitude.toFixed(5)}
                  </div>
                </div>
              </div>

              {!useLiveLocation && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Simulation Presets</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SIMULATED_LOCATIONS.map((loc, idx) => (
                      <button
                        id={`pos-button-preset-${idx}`}
                        key={idx}
                        onClick={() => setSelectedCoordsIndex(idx)}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight text-left truncate transition-all cursor-pointer ${
                          selectedCoordsIndex === idx
                            ? "bg-indigo-600 text-white shadow-xs border-transparent"
                            : "bg-white hover:bg-slate-105 text-slate-505 border border-slate-200"
                        }`}
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Boutiques Distance Matrix</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {distanceMatrixData.map((data) => {
                const isWithin = data.distanceVal <= purchaseRadius;
                return (
                  <div 
                    id={`matrix-item-${data.storeId}`}
                    key={data.storeId} 
                    className={`p-3 rounded-2xl border transition-all ${
                      isWithin 
                        ? "bg-indigo-50/20 border-indigo-200/80 shadow-xs" 
                        : "bg-slate-50/60 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="text-[11px] font-black text-slate-800 truncate" title={data.storeName}>{data.storeName}</h5>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isWithin ? "bg-emerald-500 animate-pulse" : "bg-rose-400"}`} />
                    </div>
                    
                    <div className="mt-2 text-xs font-bold text-slate-605 flex items-baseline justify-between">
                      <span className="text-sm font-black text-slate-900 font-mono tracking-tight">{data.distanceText}</span>
                      <span className="text-[9px] text-slate-450 uppercase">{data.durationText}</span>
                    </div>

                    <div className="mt-3.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] font-black uppercase tracking-tight">
                      <span className="text-slate-400">STATUS</span>
                      <span className={isWithin ? "text-emerald-600" : "text-rose-500"}>
                        {isWithin ? "Within Radius" : "Out of bounds"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive 2D Map Container */}
            <div id="interactive-radar-map" className="relative h-60 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              {hasValidKey ? (
                <APIProvider apiKey={GOOGLE_MAPS_PLATFORM_KEY} version="weekly">
                  <Map
                    center={{ lat: latitude, lng: longitude }}
                    zoom={12}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: "100%", height: "100%" }}
                  >
                    {/* User Pin */}
                    <AdvancedMarker position={{ lat: latitude, lng: longitude }} title="My Location Target">
                      <Pin background="#4f46e5" glyphColor="#ffffff" borderColor="#ffffff" />
                    </AdvancedMarker>

                    {/* Stores Pins */}
                    {smbStores.map((store) => {
                      const matrixResult = distanceMatrixData.find(d => d.storeId === store.id);
                      const distance = matrixResult ? matrixResult.distanceVal : getDistanceKm(latitude, longitude, store.latitude, store.longitude);
                      const isWithin = distance <= purchaseRadius;
                      return (
                        <AdvancedMarker
                          key={store.id}
                          position={{ lat: store.latitude, lng: store.longitude }}
                          title={store.name}
                        >
                          <Pin
                            background={isWithin ? "#10b981" : "#f43f5e"}
                            borderColor="#ffffff"
                            glyphColor="#ffffff"
                          />
                        </AdvancedMarker>
                      );
                    })}

                    <MapCircularRadius center={{ lat: latitude, lng: longitude }} radiusKm={purchaseRadius} />
                  </Map>
                </APIProvider>
              ) : (
                <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-slate-50">
                  <div className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-lg mb-2">🗺️</div>
                  <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Active Circular Map Placeholder</h4>
                  <p className="text-[10px] text-slate-450 max-w-sm mt-0.5 leading-relaxed">
                    Interactive 2D radar is fully coded & operational. To enable rendering, please define your Maps Key as a Secret:
                  </p>
                  
                  <div className="mt-2 p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[9px] text-indigo-950 text-left space-y-0.5 max-w-md">
                    <p className="font-extrabold uppercase text-[8px] tracking-wider text-indigo-700">Setup Instructions:</p>
                    <p>1. Open <strong>Settings</strong> (⚙️ gear icon, top-right) → <strong>Secrets</strong>.</p>
                    <p>2. Create secret: <code>GOOGLE_MAPS_PLATFORM_KEY</code> → paste Google Maps Key.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Bubbles beneath Radar */}
      <div id="radar-quick-bubbles" className="flex flex-wrap items-center justify-center gap-4 py-4 border-t border-slate-100">
        <button
          id="bubble-toggle-offers"
          onClick={() => {
            setShowOffers(prev => !prev);
            if (!showOffers) {
              setTimeout(() => {
                document.getElementById("active-discounts-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 100);
            }
          }}
          className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 border shadow-xs transition-all cursor-pointer ${
            showOffers
              ? "bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-200 animate-pulse"
              : "bg-white border-slate-200 hover:border-rose-450 hover:bg-rose-50/20 text-slate-700 hover:text-rose-650"
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${showOffers ? "bg-rose-500 animate-pulse" : "bg-rose-400"}`} />
          View Attractive Offers
        </button>

        <button
          id="bubble-own-choice"
          onClick={() => {
            setShowTailoring(true);
            setTimeout(() => {
              document.getElementById("stylist-heading")?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }}
          className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 border shadow-xs transition-all cursor-pointer ${
            showTailoring
              ? "bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-200 animate-pulse"
              : "bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 text-slate-700 hover:text-indigo-600"
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          I Want My Own Choice Today
        </button>
      </div>

      {/* Running SMB Banner Offers - Rose Styled Price War Cards */}
      {showOffers && (
        <div id="active-discounts-section" className="space-y-3 animate-fade-in">
          <span className="text-rose-600 text-[10px] font-black uppercase tracking-widest">🔥 Price War active • Beat High-Street Conglomerates</span>
          {runningDiscounts.length > 0 ? (
            <div id="discounts-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {runningDiscounts.map((disc) => (
                <div 
                  id={`disc-card-${disc.id}`} 
                  key={disc.id} 
                  className="bg-rose-50/70 border border-rose-150 rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div id="disc-header-block" className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-rose-200/50 text-rose-700 rounded">
                        Local Promo Price
                      </span>
                      <span className="text-xs font-bold text-slate-500 italic">at {disc.storeName}</span>
                    </div>
                    <h4 id="disc-item-name" className="text-lg font-extrabold text-rose-950 mt-1 line-clamp-1">{disc.name}</h4>
                    <p id="disc-item-locs" className="text-xs text-rose-700/60 font-medium">Zones: {disc.targetLocalities.join(", ")}</p>
                  </div>
                  <div className="flex items-end justify-between pt-4 border-t border-rose-200/50 mt-4">
                    <div>
                      <span className="text-3xl font-black text-rose-600">${disc.discountedPrice}</span>
                      <p className="text-[9px] font-extrabold text-rose-800 uppercase tracking-wider">YOUR OPTIMIZED PRICE</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 line-through block">${disc.originalPrice}</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">-{disc.discountPercent}% OFF</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-rose-50/30 border border-rose-150 rounded-3xl p-8 text-center text-rose-950">
              <span className="text-2xl block mb-2">🏷️</span>
              <p className="text-xs font-extrabold uppercase tracking-wider font-mono">Independent Boutiques Undercutting Promo</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">There are currently no active merchant discount campaigns configured in this 10km zones circle. Register promotional discounts via your merchant dashboard to see them instantly.</p>
            </div>
          )}
        </div>
      )}

      {showTailoring && (
        <div className="space-y-6 pt-6 border-t border-slate-150">
          {/* Main Designer Board Headers */}
          <div className="flex items-center justify-between pt-2">
        <div>
          <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">Interactive Sandbox</span>
          <h2 id="stylist-heading" className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            AI Style <span className="text-indigo-600 italic">Studio</span>
          </h2>
        </div>
      </div>

      <div id="designer-inner-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Preferences Layout as rounded-3xl Bento Card */}
        <div id="preferences-col" className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div id="tab-selectors" className="flex bg-slate-50 p-1 rounded-2xl border border-slate-150">
            <button
              id="pref-tab-questions"
              onClick={() => setActiveTab("questions")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-tight transition-all text-center ${
                activeTab === "questions"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tailored Guidance
            </button>
            <button
              id="pref-tab-image"
              onClick={() => setActiveTab("image")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-tight transition-all text-center ${
                activeTab === "image"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Inspire by Photo
            </button>
          </div>

          {activeTab === "questions" ? (
            <div id="guided-questions" className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">1. Destination Event / Target Location</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {OCCASIONS.map((occ) => (
                    <button
                      key={occ.value}
                      onClick={() => setOccasion(occ.value)}
                      className={`text-left px-4 py-3 rounded-2xl border text-xs font-bold transition-all ${
                        occasion === occ.value
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs"
                          : "border-slate-150 bg-white hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {occ.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">2. Desired Visual Mood</label>
                <div className="grid grid-cols-2 gap-2">
                  {MOODS.map((md) => (
                    <button
                      key={md.value}
                      onClick={() => setMood(md.value)}
                      className={`p-3.5 rounded-2xl border text-xs font-bold text-center transition-all ${
                        mood === md.value
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs"
                          : "border-slate-150 bg-white hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {md.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">3. Style Theme Intention</label>
                <div className="relative">
                  <select
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 appearance-none"
                  >
                    {STYLES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 font-bold">
                    ▼
                  </div>
                </div>
              </div>

              {/* Question 4: Tailoring Customization Choice */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  4. Tailoring Customization Choice
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTailoringChoice("guidance")}
                    className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                      tailoringChoice === "guidance"
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs"
                        : "border-slate-150 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    📐 Fit Guidance
                  </button>
                  <button
                    type="button"
                    onClick={() => setTailoringChoice("photo")}
                    className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                      tailoringChoice === "photo"
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs"
                        : "border-slate-150 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    👤 Choice by Photo
                  </button>
                </div>

                {tailoringChoice === "guidance" ? (
                  <div className="bg-indigo-50/40 border border-indigo-150 rounded-2xl p-4 space-y-2 mt-3 animate-fade-in">
                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">📐 Instant Sizing Guide (Smart Sizing Guidance)</p>
                    <p className="text-[11px] text-indigo-950 font-medium leading-relaxed">
                      Sizing coordinates will adapt dynamically to standard design metrics matching pattern room draft parameters.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 mt-3 animate-fade-in">
                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">👤 Sizing by Photo / Smart Virtual Try-on</p>
                    <UploadDropzone
                      onImageSelected={(base64) => {
                        setTailoringPhotoBase64(base64);
                        setUploadedBase64(base64);
                      }}
                      selectedImageUrl={tailoringPhotoBase64 || uploadedBase64 || userProfile?.photo}
                    />
                    <p className="text-[9px] text-slate-450 italic mt-1 text-center">
                      {(tailoringPhotoBase64 || uploadedBase64 || userProfile?.photo) ? "✅ Silhouette loaded! Clothes will be layer-composited on this photo." : "⚠️ Please upload a silhouette portrait photo to render Try-On."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div id="image-uploader-wrapper" className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Custom Style Reference</label>
              <UploadDropzone
                onImageSelected={setUploadedBase64}
                selectedImageUrl={uploadedBase64}
              />
            </div>
          )}

          {/* Body shape selection */}
          <div id="body-shape-selection" className="space-y-3 pt-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              4. Target Body Archetype Scale
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {BODY_TYPES.map((bt) => (
                <button
                  key={bt.id}
                  onClick={() => setBodyType(bt.id)}
                  className={`text-left px-4 py-3 rounded-2xl border transition-all flex flex-col justify-start ${
                    bodyType === bt.id
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                      : "border-slate-150 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs font-black">{bt.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">{bt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            id="draft-outfit-btn"
            onClick={handleStyleSubmit}
            disabled={isGenerating || (activeTab === "image" && !uploadedBase64)}
            className="w-full py-4 px-6 bg-slate-900 border-none hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin text-indigo-400" />
                {getLoadingMessage()}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Draft Ideal Styled Outfit
              </>
            )}
          </button>
        </div>

        {/* Right Side: Visual styled canvas outcome */}
        <div id="canvas-outcome-col" className="lg:col-span-7 space-y-6">
          {!outfitResult && !isGenerating && (
            <div id="canvas-placeholder" className="border border-slate-200 bg-white rounded-3xl p-12 text-center h-[520px] flex flex-col items-center justify-center text-slate-400 shadow-sm">
              <div className="h-16 w-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mb-4 shadow-sm border border-indigo-150">🖼️</div>
              <h4 className="text-lg font-black text-slate-800 mb-1">Wardrobe Creative Sandbox</h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed mt-1">Specify your target parameters or upload a references to generate coordinates that reflect your proportions.</p>
            </div>
          )}

          {isGenerating && (
            <div id="canvas-generating-loader" className="bg-indigo-900 rounded-3xl p-8 text-center h-[520px] flex flex-col items-center justify-center space-y-6 shadow-xl relative overflow-hidden text-white">
              <div className="relative z-10 space-y-6 max-w-md">
                <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded border border-indigo-400/30">
                  Ad Studio AI Process
                </span>
                
                <div id="styling-beacons" className="flex space-x-2 items-center justify-center">
                  <span className="block w-3.5 h-3.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="block w-3.5 h-3.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="block w-3.5 h-3.5 bg-indigo-100 rounded-full animate-bounce" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl font-bold tracking-tight text-white animate-pulse">Autumn Capsule Launch</h4>
                  <p className="text-xs text-indigo-200/80 font-mono italic">
                    "{getLoadingMessage()}"
                  </p>
                </div>
              </div>
              <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-30"></div>
            </div>
          )}

          {outfitResult && !isGenerating && (
            <div id="canvas-outfit-details" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div id="outfit-banner" className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div id="visual-render-block" className="md:col-span-5 relative bg-slate-50 rounded-2xl overflow-hidden shadow-xs h-72 border border-slate-200 flex flex-col justify-between">
                  <div className="relative flex-1 w-full bg-slate-900 overflow-hidden">
                    {tryonMode === "mirror" && (userProfile?.photo || uploadedBase64) ? (
                      /* USER VIRTUAL TRY-ON PRESENTATION LAYER */
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* Base physical portrait outline */}
                        <img
                          src={uploadedBase64 || userProfile?.photo}
                          alt="User Portrait Base"
                          className="absolute inset-0 w-full h-full object-cover opacity-75"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Overlay clothing asset positioned, styled, and blended over shape */}
                        <div className="absolute inset-x-0 bottom-4 top-10 flex items-center justify-center select-none pointer-events-none filter drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)]">
                          <img
                            src={outfitResult.generatedImageUrl}
                            alt="Recommended Apparel"
                            className="w-11/12 max-h-full object-contain mix-blend-multiply opacity-90 relative z-20"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Interactive scanning laser bar */}
                        <div className="absolute inset-x-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.9)] animate-[scan_4s_infinite_ease-in-out]" style={{
                          animation: "scan 4s infinite ease-in-out"
                        }} />

                        {/* Scan label badge */}
                        <div className="absolute bottom-2.5 left-2.5 bg-indigo-950/90 text-indigo-200 text-[8px] font-black px-2 py-1 rounded border border-indigo-500/30 font-mono uppercase tracking-wider z-30">
                          ⚡ AI Smart Try-On Active
                        </div>
                      </div>
                    ) : (
                      /* GARMENT ONLY BLUEPRINT MODEL */
                      <div className="relative w-full h-full">
                        <img
                          src={outfitResult.generatedImageUrl}
                          alt="Garment Blueprint"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-2.5 left-2.5 bg-slate-950/80 text-slate-300 text-[8px] font-black px-2 py-1 rounded border border-white/5 font-mono uppercase tracking-wider z-30">
                          Apparel Spec Blueprint
                        </div>
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 bg-slate-950/85 backdrop-blur-md text-white text-[9px] uppercase font-black py-1 px-2.5 rounded-full tracking-wider border border-white/10 z-30">
                      Creative #01
                    </div>
                  </div>

                  {/* Interactive Mirror vs Item spec toggles */}
                  {(userProfile?.photo || uploadedBase64) && (
                    <div className="bg-slate-950 p-1 flex justify-around border-t border-slate-950/80 z-30 relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setTryonMode("mirror")}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer text-center ${
                          tryonMode === "mirror"
                            ? "bg-indigo-650 text-white shadow-xs"
                            : "text-slate-400 hover:text-slate-100"
                        }`}
                      >
                        👤 Try-On Mirror
                      </button>
                      <button
                        type="button"
                        onClick={() => setTryonMode("garment")}
                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer text-center ${
                          tryonMode === "garment"
                            ? "bg-indigo-650 text-white shadow-xs"
                            : "text-slate-400 hover:text-slate-100"
                        }`}
                      >
                        👕 Model Garment
                      </button>
                    </div>
                  )}
                </div>

                <div id="outfit-descr-block" className="md:col-span-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded uppercase tracking-wider">{outfitResult.bodyType} Fit Shape</span>
                    <h3 id="aesthetic-title" className="text-xl font-black text-slate-900 tracking-tight italic">
                      {(window as any).tempAesthetic?.string || (window as any).tempAesthetic?.aestheticName || "Autumn Capsule Look"}
                    </h3>
                    <p id="aesthetic-desc" className="text-xs text-slate-500 leading-relaxed">
                      {outfitResult.generatedDescription}
                    </p>
                  </div>

                  {/* Colors & Tags */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {((window as any).tempAesthetic?.colors || ["#E5E7EB", "#9CA3AF", "#4B5563"]).map((col: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-1 bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-xl text-[10px] font-bold font-mono">
                          <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: col }} />
                          <span>{col}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {((window as any).tempAesthetic?.tags || ["classic", "casual"]).map((tg: string) => (
                        <span key={tg} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-500 font-bold text-[10.5px] uppercase tracking-wider rounded-lg border border-slate-200">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {tg}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Outfit Components breakdown */}
              <div id="outfit-components-block" className="border-t border-slate-100 pt-5 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Suggested Key Layer Pairings</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {((window as any).tempAesthetic?.components || [
                    "Elegant tailored outermost jacket",
                    "Soft cotton-woven coordinate pants"
                  ]).map((comp: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-150">
                      <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{comp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Match Execution Buttons */}
              <div id="outfit-approval-action" className="border-t border-slate-100 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">Confirm this virtual creative meets your design goals to scan inventory registered dynamically within a 10km radius zones.</p>
                <button
                  id="approve-and-scan-btn"
                  onClick={handleApproveOutfit}
                  disabled={isMatching}
                  className="w-full md:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 self-end"
                >
                  {isMatching ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Scanning catalogues...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Approve & Scan Local Stores
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Catalog Matches / Store Lookups - Styled using Slate-900 Bento styling */}
          {(matchedStores.length > 0 || isMatching || matchingError) && (
            <div id="local-results-container" className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-2 relative z-10">
                <div id="store-lookup-title-block">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">Live Styles Matches</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Boutiques in active 10km radius zones matching your proportions.</p>
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-full text-[9px] text-white tracking-widest font-black uppercase inline-block self-start">
                  SF ACTIVE ZONE
                </span>
              </div>

              {isMatching && (
                <div id="match-loader" className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400 relative z-10">
                  <Loader className="w-8 h-8 animate-spin text-emerald-400" />
                  <p className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400 animate-pulse">Running semantic lookup algorithms...</p>
                </div>
              )}

              {matchingError && (
                <div id="match-error-message" className="py-6 text-center text-rose-300 relative z-10">
                  <p className="text-sm font-bold mb-1 uppercase tracking-wider">Zero matches catalog lookup</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">{matchingError}</p>
                </div>
              )}

              {matchedStores.length > 0 && !isMatching && (
                <div id="matching-stores-list" className="space-y-3 relative z-10">
                  {matchedStores.map((match, index) => (
                    <div 
                      id={`match-item-card-${index}`} 
                      key={index} 
                      className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all"
                    >
                      <div className="flex gap-4 items-start lg:items-center">
                        {/* Physical item Image */}
                        <div className="w-20 h-20 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-xs">
                          <img
                            src={match.matchedItem.imageUrl}
                            alt={match.matchedItem.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] text-emerald-400 font-black bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded tracking-wider uppercase">
                              {match.similarityScore}% Style Match
                            </span>
                            <span className="text-xs font-bold text-slate-350">at {match.storeName}</span>
                          </div>
                          <h4 className="text-sm font-black text-white tracking-tight">{match.matchedItem.name}</h4>
                          <p className="text-[11px] text-slate-400 italic line-clamp-1">"{match.matchJustification || 'Accents match perfectly with local collection inventory.'}"</p>
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-slate-400 text-[10.5px]">
                            <span className="flex items-center gap-1 text-slate-400 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {match.distanceKm} km away
                            </span>
                            <span className="flex items-center gap-1 text-slate-400 font-medium">
                              <Truck className="w-3 h-3 text-slate-400" />
                              {match.deliveryTime}
                            </span>
                            <span className="flex items-center gap-1 text-emerald-400">
                              <DollarSign className="w-3 h-3 text-emerald-400" />
                              Shipping: {match.deliveryCharges === 0 ? "FREE" : `$${match.deliveryCharges}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5 mt-2 lg:mt-0">
                        <div className="space-y-0.5 text-left lg:text-right">
                          <span className="text-[10px] text-slate-500 uppercase font-black block">Price</span>
                          <p className="text-xl font-black text-white">${match.matchedItem.price}</p>
                        </div>
                        <button
                          id={`matched-purchase-btn-${index}`}
                          onClick={() => alert(`Purchase and Reservation Request sent directly to ${match.storeName}! The system is hold-checking item SKU: ${match.matchedItem.sku}.`)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-tight rounded-xl text-xs transition-all shadow shadow-indigo-600/25 border-none"
                        >
                          Reserve Pickup
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Layout Decorative logistics numbers */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-white/90 relative z-10">
                <div>
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Average delivery</p>
                  <p className="text-2xl font-light italic">24 <span className="text-xs text-slate-400">mins</span></p>
                </div>
                <div>
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Zone radius</p>
                  <p className="text-sm font-bold text-emerald-400">{purchaseRadius} km active</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Delivery fee</p>
                  <p className="text-sm font-bold">$4.50 <span className="text-[9px] text-slate-500 font-normal">avg</span></p>
                </div>
              </div>
              <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-slate-800 rounded-full blur-[100px] opacity-30"></div>
            </div>
          )}
        </div>
      </div>
      </div>
      )}
    </div>
  );
}
