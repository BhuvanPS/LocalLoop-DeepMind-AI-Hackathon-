/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Store, Plus, Trash2, TrendingUp, Sparkles, AlertCircle, Share2, Facebook, Instagram, Music, Check, Loader, DollarSign, Layers, Cpu } from "lucide-react";
import { SMBStore, SKUItem, ActiveDiscount, MarketTrendConfig } from "../types";

const CATEGORIES = ["Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories"];

// Convenient presets of high-quality mock images matching each category
const CATEGORY_IMAGE_PRESETS: { [key: string]: string[] } = {
  Tops: [
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80",
    "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80",
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80"
  ],
  Bottoms: [
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&q=80",
    "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=500&q=80",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&q=80"
  ],
  Dresses: [
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&q=80",
    "https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=500&q=80",
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80"
  ],
  Outerwear: [
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80",
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&q=80"
  ],
  Shoes: [
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
    "https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&q=80"
  ],
  Accessories: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&q=80",
    "https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=500&q=80"
  ]
};

interface SmbInterfaceProps {
  registeredSmb?: SMBStore | null;
  onLogoutSmb?: () => void;
}

export default function SmbInterface({ registeredSmb, onLogoutSmb }: SmbInterfaceProps = {}) {
  // Store registry states
  const [stores, setStores] = useState<SMBStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(registeredSmb?.id || "");
  const [activeStore, setActiveStore] = useState<SMBStore | null>(registeredSmb || null);

  useEffect(() => {
    if (registeredSmb) {
      setSelectedStoreId(registeredSmb.id);
      setActiveStore(registeredSmb);
    }
  }, [registeredSmb]);

  // Store profile creation form toggles and inputs
  const [showRegForm, setShowRegForm] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regLocName, setRegLocName] = useState("");
  const [regLat, setRegLat] = useState("37.7749");
  const [regLng, setRegLng] = useState("-122.4194");
  const [regAudience, setRegAudience] = useState("");
  const [regLocalities, setRegLocalities] = useState("");

  // Catalog items state
  const [skus, setSkus] = useState<SKUItem[]>([]);
  
  // Adding New Product Form
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState<string>(CATEGORIES[0]);
  const [itemPrice, setItemPrice] = useState("");
  const [itemSkuCode, setItemSkuCode] = useState("");
  const [itemStock, setItemStock] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemTags, setItemTags] = useState("");

  // Market Insights AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insightsResult, setInsightsResult] = useState<MarketTrendConfig | null>(null);

  // Under-cutting discount formulation
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [selectedSkuId, setSelectedSkuId] = useState<string>("");
  const [isGeneratingAds, setIsGeneratingAds] = useState(false);
  const [generatedPromo, setGeneratedPromo] = useState<any | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // OMP Calculations & Predictive Optimization State
  const [showDiscountFlow, setShowDiscountFlow] = useState(false);
  const [isCalculatingOmp, setIsCalculatingOmp] = useState(false);
  const [ompError, setOmpError] = useState<string | null>(null);
  const [ompResult, setOmpResult] = useState<{
    ompPrice: number;
    optimalDiscountPercent: number;
    priceElasticity: number;
    predictedVolumeLiftPercent: number;
    predictedRevenueChangePercent: number;
    trainingSteps: string[];
    featureImportance: { feature: string; importance: number }[];
  } | null>(null);
  const [mlLogIndex, setMlLogIndex] = useState(0);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      const store = stores.find((s) => s.id === selectedStoreId);
      if (store) {
        setActiveStore(store);
        fetchCatalog(store.id);
        // Clear old insights
        setInsightsResult(null);
        setGeneratedPromo(null);
        setPublishSuccess(false);
      }
    } else {
      setActiveStore(null);
      setSkus([]);
    }
  }, [selectedStoreId, stores]);

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/smb");
      if (res.ok) {
        const data = await res.json();
        setStores(data);
        if (registeredSmb) {
          setSelectedStoreId(registeredSmb.id);
        } else if (data.length > 0 && !selectedStoreId) {
          setSelectedStoreId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading boutiques list:", err);
    }
  };

  const fetchCatalog = async (id: string) => {
    try {
      const res = await fetch(`/api/smb/${id}/skus`);
      if (res.ok) {
        const data = await res.json();
        setSkus(data);
      }
    } catch (err) {
      console.error("Error loading catalogue:", err);
    }
  };

  const handleRegisterStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regLocName || !regAudience) {
      alert("Please populate all requested merchant fields.");
      return;
    }

    const localitiesList = regLocalities
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    const payload = {
      name: regName,
      ownerEmail: regEmail,
      locationName: regLocName,
      latitude: parseFloat(regLat) || 37.7749,
      longitude: parseFloat(regLng) || -122.4194,
      targetAudience: regAudience,
      targetLocalities: localitiesList.length > 0 ? localitiesList : ["San Francisco"]
    };

    try {
      const res = await fetch("/api/smb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const saved = await res.json();
        setSelectedStoreId(saved.id);
        await fetchStores();
        setShowRegForm(false);
        // Reset form
        setRegName("");
        setRegEmail("");
        setRegLocName("");
        setRegAudience("");
        setRegLocalities("");
      }
    } catch (err) {
      console.error("Error saving store:", err);
    }
  };

  const handleDeleteStore = async () => {
    if (!activeStore) return;
    if (!confirm(`Are you absolutely sure you want to withdraw ${activeStore.name} from the database? This deletes all associated SKUs.`)) return;

    try {
      const res = await fetch(`/api/smb/${activeStore.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSelectedStoreId("");
        setActiveStore(null);
        await fetchStores();
      }
    } catch (err) {
      console.error("Error removing store:", err);
    }
  };

  const handleAddSku = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;
    if (!itemName || !itemPrice || !itemSkuCode) {
      alert("Please provide Product Name, SKU, and Price details.");
      return;
    }

    // Assign randomized style illustration from category presets to avoid blank pictures
    const presets = CATEGORY_IMAGE_PRESETS[itemCategory] || CATEGORY_IMAGE_PRESETS.Tops;
    const randomImage = presets[Math.floor(Math.random() * presets.length)];

    const tagsList = itemTags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag !== "");

    const payload = {
      name: itemName,
      category: itemCategory,
      price: parseFloat(itemPrice) || 0,
      sku: itemSkuCode,
      stock: parseInt(itemStock) || 5,
      imageUrl: randomImage,
      styleTags: tagsList.length > 0 ? tagsList : [itemCategory.toLowerCase(), "casual"],
      description: itemDesc || "Original crafted boutique design.",
      sizes: ["S", "M", "L"]
    };

    try {
      const res = await fetch(`/api/smb/${activeStore.id}/skus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchCatalog(activeStore.id);
        // Clear SKU inputs
        setItemName("");
        setItemPrice("");
        setItemSkuCode("");
        setItemStock("");
        setItemDesc("");
        setItemTags("");
      }
    } catch (err) {
      console.error("Error saving SKU SKU:", err);
    }
  };

  const handleDeleteSku = async (skuId: string) => {
    if (!activeStore) return;
    try {
      const res = await fetch(`/api/smb/${activeStore.id}/skus/${skuId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchCatalog(activeStore.id);
      }
    } catch (err) {
      console.error("Error deleting SKU:", err);
    }
  };

  const handleAnalyzeTrends = async () => {
    if (!activeStore) return;
    setIsAnalyzing(true);
    setInsightsResult(null);
    setGeneratedPromo(null);
    setPublishSuccess(false);

    try {
      const res = await fetch("/api/analyze-smb-trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetLocalities: activeStore.targetLocalities,
          targetAudience: activeStore.targetAudience,
          currentSkus: skus
        })
      });

      if (res.ok) {
        const data = await res.json();
        setInsightsResult(data);
        setDiscountPercent(data.recommendedDiscountPercent || 15);
        if (skus.length > 0) {
          setSelectedSkuId(skus[0].id);
        }
      }
    } catch (err) {
      alert("Trend AI connection errored out. Try again shortly.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCalculateOmp = async () => {
    if (!activeStore || !selectedSkuId) return;
    setIsCalculatingOmp(true);
    setOmpResult(null);
    setMlLogIndex(0);
    setOmpError(null);

    const selectedItem = skus.find((s) => s.id === selectedSkuId);
    if (!selectedItem) {
      setIsCalculatingOmp(false);
      return;
    }

    const competitorPrice = insightsResult?.competingBrands?.[0]?.price || selectedItem.price * 1.1;

    try {
      const res = await fetch("/api/calculate-omp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skuId: selectedSkuId,
          skuName: selectedItem.name,
          currentPrice: selectedItem.price,
          competitorPrice,
          targetLocalities: activeStore.targetLocalities
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        let currentStep = 0;
        const totalSteps = data.trainingSteps ? data.trainingSteps.length : 5;
        const interval = setInterval(() => {
          setMlLogIndex((prev) => {
            if (prev >= totalSteps - 1) {
              clearInterval(interval);
              setOmpResult(data);
              setIsCalculatingOmp(false);
              setDiscountPercent(data.optimalDiscountPercent || 20);
              return prev;
            }
            return prev + 1;
          });
        }, 450);
      } else {
        setOmpError("Optimizing pipeline failed. Please retry.");
        setIsCalculatingOmp(false);
      }
    } catch (err) {
      setOmpError("Error establishing connection to AutoML cluster.");
      setIsCalculatingOmp(false);
    }
  };

  const handlePublishOmpDiscount = async () => {
    if (!activeStore || !selectedSkuId || !ompResult) return;

    const selectedItem = skus.find((s) => s.id === selectedSkuId);
    if (!selectedItem) return;

    const payload = {
      skuId: selectedSkuId,
      name: `${selectedItem.name} - OMP Optimal ${ompResult.optimalDiscountPercent}% Sale`,
      originalPrice: selectedItem.price,
      discountPercent: ompResult.optimalDiscountPercent,
      discountedPrice: ompResult.ompPrice,
      targetLocalities: activeStore.targetLocalities,
      status: "approved",
      socialPromos: {
        facebook: `BigQuery ML & Vertex AI OMP Model optimized flash sale! Grab the premium ${selectedItem.name} at a mathematically precise optimal price of $${ompResult.ompPrice} at ${activeStore.name}! Support local, beat big retail corporate giant prices!`,
        instagram: `Engineered Pricing Optimization is LIVE! Get the ${selectedItem.name} for only $${ompResult.ompPrice} (${ompResult.optimalDiscountPercent}% Off) at ${activeStore.name}! Calculated using Vertex AI AutoML Tables. #SupportLocal #PremiumQuality #PricingOptimization`,
        tiktok: `[Beat the giant corps!] ⚡ Our Vertex AI AutoML Tables modeling says the ${selectedItem.name} should be discounted! Get it for $${ompResult.ompPrice} only! Grab it at ${activeStore.name} right now!`,
        imagePrompt: `A high-contrast luxury studio photography of ${selectedItem.name} with an overlay graphic reading ${ompResult.optimalDiscountPercent}% OFF OMP OPTIMIZED`
      }
    };

    try {
      const res = await fetch(`/api/smb/${activeStore.id}/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setPublishSuccess(true);
        setTimeout(() => {
          setPublishSuccess(false);
          setOmpResult(null);
          setShowDiscountFlow(false);
        }, 5000);
      }
    } catch (err) {
      alert("Failed to publish OMP discount: " + err);
    }
  };

  const handleGenerateAdCopy = async () => {
    if (!activeStore || !selectedSkuId || !insightsResult) return;
    setIsGeneratingAds(true);
    setGeneratedPromo(null);
    setPublishSuccess(false);

    const selectedItem = skus.find((s) => s.id === selectedSkuId);
    if (!selectedItem) return;

    const calculatedDiscountedPrice = parseFloat(
      (selectedItem.price * (1 - discountPercent / 100)).toFixed(2)
    );

    try {
      const res = await fetch("/api/generate-social-promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: activeStore.name,
          itemName: selectedItem.name,
          originalPrice: selectedItem.price,
          discountPercent,
          discountedPrice: calculatedDiscountedPrice,
          targetLocalities: activeStore.targetLocalities
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedPromo({
          ...data,
          skuId: selectedSkuId,
          itemName: selectedItem.name,
          originalPrice: selectedItem.price,
          discountedPrice: calculatedDiscountedPrice
        });
      }
    } catch (err) {
      alert("Error generating marketing copy: " + err);
    } finally {
      setIsGeneratingAds(false);
    }
  };

  const handlePublishDiscountLive = async () => {
    if (!activeStore || !generatedPromo) return;

    const payload = {
      skuId: generatedPromo.skuId,
      name: `${generatedPromo.itemName} - Flash ${discountPercent}% Undercut Sale`,
      originalPrice: generatedPromo.originalPrice,
      discountPercent: discountPercent,
      discountedPrice: generatedPromo.discountedPrice,
      targetLocalities: activeStore.targetLocalities,
      status: "approved",
      socialPromos: {
        facebook: generatedPromo.facebook,
        instagram: generatedPromo.instagram,
        tiktok: generatedPromo.tiktok,
        imagePrompt: generatedPromo.imagePrompt
      }
    };

    try {
      const res = await fetch(`/api/smb/${activeStore.id}/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setPublishSuccess(true);
        // Clear insights to encourage subsequent optimization cycles
        setTimeout(() => {
          setInsightsResult(null);
          setGeneratedPromo(null);
          setPublishSuccess(false);
        }, 5000);
      }
    } catch (err) {
      alert("Failed to propagate discount: " + err);
    }
  };

  return (
    <div id="smb-merchant-view" className="space-y-6 animate-fade-in">
      {/* Merchant Header Control */}
      <div id="smb-merchant-controls" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div>
          <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">Merchant Center</span>
          <h2 id="merchant-control-title" className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mt-0.5">
            <Store className="w-5 h-5 text-indigo-600" />
            Boutique Dashboard
          </h2>
          <p id="merchant-control-desc" className="text-xs text-slate-400 mt-1">Manage local collections, calculate strategic high-street undercut discounts, and broadcast campaign signals.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {registeredSmb ? (
            <div id="logged-in-smb-tag" className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black rounded-2xl px-4 py-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Partner Account
            </div>
          ) : (
            <>
              {stores.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="bg-white border border-slate-200 text-xs font-bold rounded-2xl pl-4 pr-10 py-3.5 text-slate-800 focus:outline-none appearance-none"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 text-xs font-bold">
                    ▼
                  </div>
                </div>
              )}

              <button
                id="merchant-reg-toggle-btn"
                onClick={() => setShowRegForm(!showRegForm)}
                className="px-5 py-3.5 bg-indigo-600 hover:bg-slate-900 border-none text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10"
              >
                <Plus className="w-4 h-4 text-indigo-200" />
                New Boutique
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reg Form Modal / Accordion */}
      {showRegForm && (
        <div id="merchant-reg-form-card" className="bg-white border-2 border-indigo-600/10 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
          <div>
            <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">Setup Workspace</span>
            <h3 id="reg-form-header" className="text-base font-black text-slate-900 uppercase mt-0.5">Register Physical Shop Coordinates</h3>
          </div>
          <form onSubmit={handleRegisterStore} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Company Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                placeholder="e.g., Union Silk Merchants"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Merchant Contact Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                placeholder="merchant@boutique.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Full Physical Address</label>
              <input
                type="text"
                value={regLocName}
                onChange={(e) => setRegLocName(e.target.value)}
                required
                placeholder="e.g., 550 Sutter St, San Francisco, CA"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Simulated Latitude (Coordinate)</label>
              <input
                type="text"
                value={regLat}
                onChange={(e) => setRegLat(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Simulated Longitude (Coordinate)</label>
              <input
                type="text"
                value={regLng}
                onChange={(e) => setRegLng(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target Audience Demographic</label>
              <input
                type="text"
                value={regAudience}
                onChange={(e) => setRegAudience(e.target.value)}
                required
                placeholder="e.g., Professionals wishing eco-minimalist cottons"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target Neighborhood Zones (Comma separated)</label>
              <input
                type="text"
                value={regLocalities}
                onChange={(e) => setRegLocalities(e.target.value)}
                required
                placeholder="e.g., Union Square, Mission District, Financial District"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="md:col-span-2 pt-2 flex justify-end gap-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setShowRegForm(false)}
                className="px-4 py-2 text-slate-400 hover:text-slate-600 text-xs font-black uppercase tracking-wider"
              >
                Discard
              </button>
              <button
                type="submit"
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow"
              >
                Launch Brand
              </button>
            </div>
          </form>
        </div>
      )}

      {activeStore ? (
        <div id="merchant-workspace-inner" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Catalogue & SKU Registration */}
          <div id="skus-mgr-panel" className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div id="skus-mgr-heading-block" className="flex items-center justify-between border-b border-slate-105 pb-4">
              <div>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Stock Ledger</span>
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase mt-0.5">
                  <Layers className="w-4 h-4 text-slate-500" />
                  Inventory Catalogue
                </h3>
              </div>

              <button
                id="merchant-retract-btn"
                onClick={handleDeleteStore}
                className="text-[10px] text-rose-500 font-extrabold hover:underline uppercase tracking-wider"
              >
                Retract Store Registrations
              </button>
            </div>

            {/* List SKUs Grid */}
            {skus.length === 0 ? (
              <div id="skus-empty-state" className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-350" />
                <p className="text-sm font-bold text-slate-800">No Inventory Found</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mt-1">This brand doesn't have any items registered yet. Register clothes using the portal below to synchronize catalogs.</p>
              </div>
            ) : (
              <div id="inventory-grid" className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
                {skus.map((item) => (
                  <div id={`sku-row-card-${item.id}`} key={item.id} className="border border-slate-150 rounded-2xl p-4 flex gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all relative group shadow-xs">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-205 overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div id="inv-card-meta" className="flex-1 space-y-1 pr-6">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-black text-[8px] rounded uppercase tracking-wider">{item.category}</span>
                      <h4 className="text-xs font-black text-slate-800 line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] font-mono text-slate-450 font-bold">SKU: {item.sku}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-black text-slate-900">${item.price}</span>
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-black py-0.5 px-2 rounded-md uppercase">Units: {item.stock}</span>
                      </div>
                    </div>
                    <button
                      id={`delete-inv-btn-${item.id}`}
                      onClick={() => handleDeleteSku(item.id)}
                      className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 transition-all"
                      title="Delete SKU"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Form to Append New Item */}
            <form onSubmit={handleAddSku} className="border-t border-slate-100 pt-5 space-y-4">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block">Catalogue Expansion Form</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Product Name</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                    placeholder="Classic Cotton Knit Sweater Class"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-850 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Garment Category</label>
                  <div className="relative">
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-850 outline-none focus:bg-white appearance-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 text-xs font-bold">
                      ▼
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Price ($USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    required
                    placeholder="e.g., 85.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-850 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">SKU Barcode Reference</label>
                  <input
                    type="text"
                    value={itemSkuCode}
                    onChange={(e) => setItemSkuCode(e.target.value)}
                    required
                    placeholder="e.g., STCH-KNIT-SWE"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-850 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Available Stock Units</label>
                  <input
                    type="number"
                    value={itemStock}
                    onChange={(e) => setItemStock(e.target.value)}
                    placeholder="5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-850 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Style tags (Comma separated)</label>
                  <input
                    type="text"
                    value={itemTags}
                    onChange={(e) => setItemTags(e.target.value)}
                    placeholder="cozy, rustic, neutral, cashmere"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-850 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Short Description of materials & fit</label>
                  <textarea
                    rows={2}
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    placeholder="Organic woven natural fibers meticulously formulated to provide a luxurious relaxed drape..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-850 outline-none focus:bg-white focus:ring-1 focus:ring-indigo-600 resize-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 px-6 bg-slate-900 border-none hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow"
              >
                Register SKU Item
              </button>
            </form>
          </div>

          {/* Right Panel: AI Trend Analysis, Under-cutting Discount proposal, Ad Copies */}
          <div id="ai-promotions-panel" className="lg:col-span-5 space-y-6">
            <div id="smb-ai-dashboard" className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 relative overflow-hidden">
              <div id="smb-ai-panel-header" className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                <div>
                  <span className="text-emerald-400 text-[9px] font-black uppercase tracking-widest">Analytical Core</span>
                  <h3 className="text-base font-black tracking-tight uppercase text-white mt-0.5 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400 animate-pulse" />
                    Market Intelligence
                  </h3>
                </div>
              </div>

              {/* Active settings mapping */}
              <div id="smb-ai-meta-pills" className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Targeted Neighborhood Zones</span>
                  <span className="text-xs font-bold text-white mt-0.5">{activeStore.targetLocalities.join(", ")}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Target Client Persona</span>
                  <span className="text-xs font-medium text-slate-300 italic mt-0.5">"{activeStore.targetAudience}"</span>
                </div>
              </div>

              <button
                id="smb-run-ai-btn"
                onClick={handleAnalyzeTrends}
                disabled={isAnalyzing}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-650 disabled:opacity-50 text-slate-950 rounded-2xl text-[10.5px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 relative z-10 shadow-lg shadow-emerald-500/10 border-none"
              >
                {isAnalyzing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Calculating local demands...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-900" />
                    Analyze Local Demands & Comps
                  </>
                )}
              </button>

              {/* AI Analysis Outcome Card - Bento styled */}
              {insightsResult && (
                <div id="smb-ai-insights-block" className="space-y-5 border-t border-white/10 pt-5 animate-fade-in relative z-10">
                  {/* Trends List */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Dynamic Fashion Demands</span>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {insightsResult.trends.map((t, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="font-semibold text-slate-200">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Competitor Undercuts Cards Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-rose-450 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        Giant Corporate Outfits & Pricing
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">Zara, Theory, Hugo Boss, etc.</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {(insightsResult.competingBrands || []).map((c: any, i: number) => (
                        <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:border-slate-600 transition-all">
                          <div className="relative aspect-square w-full bg-slate-900 overflow-hidden">
                            <img 
                              src={c.imageUrl || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=80"} 
                              alt={c.item} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2 bg-rose-500/90 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-lg shadow-sm">
                              ${c.price.toFixed(2)}
                            </div>
                          </div>
                          <div className="p-2.5 flex-1 flex flex-col justify-between">
                            <div>
                              <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest block">{c.brand}</span>
                              <h5 className="text-[11px] font-bold text-slate-100 truncate mt-0.5">{c.item}</h5>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Do you want to discount toggle and automated OMP workflow */}
                  {skus.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h4 className="text-[11px] font-black uppercase text-amber-400 tracking-wide">Do you want to discount?</h4>
                            <p className="text-[10px] text-slate-400">Optimize markdown pricing and auto-submit live promos using AI pipelines.</p>
                          </div>
                          <button
                            onClick={() => {
                              setShowDiscountFlow(!showDiscountFlow);
                              if (!showDiscountFlow && skus.length > 0 && !selectedSkuId) {
                                setSelectedSkuId(skus[0].id);
                              }
                            }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-none ${
                              showDiscountFlow 
                                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10" 
                                : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                            }`}
                          >
                            {showDiscountFlow ? "YES" : "NO"}
                          </button>
                        </div>

                        {showDiscountFlow && (
                          <div className="border-t border-slate-700/60 pt-3.5 space-y-4 animate-fade-in">
                            <div>
                              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Select Catalog Item to Optimize</label>
                              <div className="relative">
                                <select
                                  value={selectedSkuId}
                                  onChange={(e) => {
                                    setSelectedSkuId(e.target.value);
                                    setOmpResult(null);
                                    setMlLogIndex(0);
                                    setOmpError(null);
                                    setGeneratedPromo(null);
                                  }}
                                  className="w-full bg-slate-900 text-xs font-mono text-white rounded-xl p-3 outline-none border border-slate-700 appearance-none"
                                >
                                  {skus.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.name} (${item.price.toFixed(2)})
                                    </option>
                                  ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white">
                                  ▼
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={handleCalculateOmp}
                              disabled={isCalculatingOmp}
                              className="w-full py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 disabled:opacity-55 text-slate-950 font-black uppercase tracking-widest rounded-xl text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-lg border-none cursor-pointer"
                            >
                              {isCalculatingOmp ? (
                                <>
                                  <Loader className="w-3.5 h-3.5 animate-spin text-slate-950" />
                                  Running price optimization model...
                                </>
                              ) : (
                                <>
                                  <Cpu className="w-3.5 h-3.5 text-slate-950" />
                                  Run AutoML Tables OMP Optimization
                                </>
                              )}
                            </button>

                            {/* Loading Steps terminal logger */}
                            {isCalculatingOmp && (
                              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono text-[9.5px] text-emerald-400 space-y-1.5 leading-normal max-h-[140px] overflow-y-auto">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block border-b border-white/5 pb-1 mb-1">
                                  💻 Vertex AI / BigQuery ML Pipeline Logs
                                </span>
                                {Array.from({ length: mlLogIndex + 1 }).map((_, stepIdx) => {
                                  const defaultSteps = [
                                    "[BigQuery ML] INITIALIZING CREATE OR REPLACE MODEL `retail_pricing.omp_xgboost` ...",
                                    "[BigQuery ML] Training data loaded correctly from Cloud Storage dataset (15,480 iterations).",
                                    "[BigQuery ML] LOGGING ITERATION 1: rmse_loss = 0.2852, val_loss = 0.2910",
                                    "[BigQuery ML] LOGGING ITERATION 5: rmse_loss = 0.1104, val_loss = 0.1197",
                                    "[Vertex AI AutoML] Fine-tuning hyperparameter space on Pricing Elasticity target...",
                                    "[Vertex AI] Model successfully bound to Live Inference endpoint bucket."
                                  ];
                                  return (
                                    <div key={stepIdx} className="text-emerald-400 animate-pulse">
                                      {defaultSteps[stepIdx] || `[Pipeline Step ${stepIdx + 1}] Done.`}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {ompError && (
                              <div className="text-[10px] text-rose-450 text-center py-1">
                                ⚠️ {ompError}
                              </div>
                            )}

                            {/* AutoML Result Panel */}
                            {ompResult && (
                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-4 animate-fade-in">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                  <span className="text-[9px] font-black text-emerald-450 uppercase tracking-wider">Predictive pricing report</span>
                                  <span className="text-[8.5px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 font-bold">AutoML Tables Inference</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3.5">
                                  <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-center">
                                    <span className="text-[8px] text-slate-450 uppercase font-bold tracking-wider block">Recommended OMP</span>
                                    <span className="text-lg font-black text-amber-400 block">${ompResult.ompPrice.toFixed(2)}</span>
                                    <span className="text-[8.5px] font-bold text-slate-400 italic block mt-0.5">({ompResult.optimalDiscountPercent}% Markdown)</span>
                                  </div>

                                  <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-center">
                                    <span className="text-[8px] text-slate-450 uppercase font-bold tracking-wider block">Price Elasticity</span>
                                    <span className="text-lg font-mono font-bold text-rose-400 block">{ompResult.priceElasticity.toFixed(2)}</span>
                                    <span className="text-[8.5px] font-bold text-slate-400 italic block mt-0.5">Highly Elastic</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3.5">
                                  <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-center">
                                    <span className="text-[8px] text-slate-450 uppercase font-bold tracking-wider block">Predicted Volume Lift</span>
                                    <span className="text-sm font-black text-emerald-400 block mt-0.5">+{ompResult.predictedVolumeLiftPercent}%</span>
                                  </div>

                                  <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-center">
                                    <span className="text-[8px] text-slate-450 uppercase font-bold tracking-wider block">Predicted Rev Impact</span>
                                    <span className="text-sm font-black text-emerald-400 block mt-0.5">+{ompResult.predictedRevenueChangePercent}%</span>
                                  </div>
                                </div>

                                {/* Feature Importance mini bento */}
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Vertex AI Feature Importances</span>
                                  <div className="space-y-1">
                                    {ompResult.featureImportance?.map((f, fIdx) => (
                                      <div key={fIdx} className="space-y-0.5">
                                        <div className="flex justify-between text-[9px] text-slate-300">
                                          <span>{f.feature}</span>
                                          <span className="font-mono font-bold text-emerald-400">{(f.importance * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{ width: `${f.importance * 100}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Submit OMP markdown pricing */}
                                <div className="pt-2">
                                  {publishSuccess ? (
                                    <div className="py-2.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-xl text-center text-[10.5px] font-black uppercase tracking-wider animate-pulse">
                                      Submitted OMP Markdown Successfully!
                                    </div>
                                  ) : (
                                    <button
                                      onClick={handlePublishOmpDiscount}
                                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-650 text-slate-950 font-black uppercase tracking-widest text-[9.5px] rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5 text-slate-950" />
                                      Submit Calculated OMP Discount
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Manual Custom Campaign Form for copywriting */}
                      <div id="undercut-action-form" className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <AlertCircle className="w-4 h-4" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Local Promotions Generator</h4>
                        </div>

                        <p className="text-[11px] text-slate-350 leading-relaxed italic">
                          "{insightsResult.reasoning || "Compete directly by applying a strategic markdown to undercut big boxes and capture local client bases."}"
                        </p>

                        <div className="space-y-3.5 pt-2">
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Target product to program</label>
                            <div className="relative">
                              <select
                                value={selectedSkuId}
                                onChange={(e) => {
                                  setSelectedSkuId(e.target.value);
                                  setGeneratedPromo(null);
                                }}
                                className="w-full bg-slate-800 text-xs font-mono text-white rounded-xl p-3 outline-none border border-slate-700 appearance-none"
                              >
                                {skus.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name} (${item.price.toFixed(2)})
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white">
                                ▼
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Markdown (%)</label>
                              <input
                                type="number"
                                value={discountPercent}
                                onChange={(e) => {
                                  setDiscountPercent(Math.max(1, parseInt(e.target.value) || 0));
                                  setGeneratedPromo(null);
                                }}
                                className="w-full bg-slate-800 text-xs text-white rounded-xl p-2.5 font-bold font-mono text-center outline-none border border-slate-700"
                              />
                            </div>

                            <div className="flex flex-col justify-center text-center bg-white/5 rounded-xl border border-white/5 p-1.5">
                              <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">Undercut custom</span>
                              <span className="text-base font-black text-emerald-400">
                                $
                                {(() => {
                                  const selectedItem = skus.find((s) => s.id === selectedSkuId);
                                  if (!selectedItem) return "0.00";
                                  const dPrice = selectedItem.price * (1 - discountPercent / 100);
                                  return dPrice.toFixed(2);
                                })()}
                              </span>
                            </div>
                          </div>

                          <button
                            id="merchant-gen-ads-btn"
                            type="button"
                            onClick={handleGenerateAdCopy}
                            disabled={isGeneratingAds}
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-650 text-slate-950 font-black uppercase tracking-tight rounded-xl text-[10.5px] transition-all flex items-center justify-center gap-1.5 shadow-md border-none cursor-pointer"
                          >
                            {isGeneratingAds ? (
                              <>
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                                Spinning social promos...
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                Generate Targeted Copywriting
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-rose-350 text-center animate-pulse pt-2">⚠️ You must register at least 1 SKU item to configure discount campaigns.</p>
                  )}
                </div>
              )}
              <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-slate-800 rounded-full blur-[100px] opacity-30"></div>
            </div>

            {/* Generated Marketing social campaigns display */}
            {generatedPromo && (
              <div id="promos-deck-card" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in">
                <div id="promos-deck-header" className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">Publishing Suite</span>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase mt-0.5">
                      <Share2 className="w-4 h-4 text-indigo-600" />
                      Multichannel Ad Previews
                    </h3>
                  </div>
                </div>

                <div id="social-channels-scroller" className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {/* Facebook */}
                  <div className="p-4 bg-blue-50/50 border border-blue-105 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider">
                      <Facebook className="w-3.5 h-3.5" />
                      Facebook Local Broadcaster
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">"{generatedPromo.facebook}"</p>
                  </div>

                  {/* Instagram */}
                  <div className="p-4 bg-pink-50/50 border border-pink-105 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-pink-700 font-extrabold text-[10px] uppercase tracking-wider">
                      <Instagram className="w-3.5 h-3.5" />
                      Instagram Luxury Capsule Feed
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">"{generatedPromo.instagram}"</p>
                  </div>

                  {/* TikTok Screenplay */}
                  <div className="p-4 bg-purple-50/50 border border-purple-105 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-purple-700 font-extrabold text-[10px] uppercase tracking-wider">
                      <Music className="w-3.5 h-3.5" />
                      TikTok Script & Hooks
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">"{generatedPromo.tiktok}"</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                    <span className="font-black text-slate-800 block text-[9px] uppercase tracking-wider">🤖 Image Generation prompts:</span>
                    <p className="italic">"{generatedPromo.imagePrompt}"</p>
                  </div>
                </div>

                {/* Publish & Notify Button */}
                <div id="promos-publishing-tray" className="border-t border-slate-100 pt-4 flex flex-col items-center gap-3">
                  {publishSuccess ? (
                    <div className="w-full py-3.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200 text-center text-xs font-bold animate-pulse flex items-center justify-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Promo broadcasted live in client catalogs!
                    </div>
                  ) : (
                    <button
                      id="push-campaign-live-btn"
                      onClick={handlePublishDiscountLive}
                      className="w-full py-4 bg-indigo-600 hover:bg-slate-900 border-none text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4 text-indigo-200" />
                      Deploy Flash Sale to Local Feed
                    </button>
                  )}
                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">This alerts nearby users search algorithms within physical coordinate boundaries and registers the promo pricing in active catalogues.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div id="smb-no-stores-guard" className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 h-[380px] flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mb-4 shadow-sm border border-indigo-150">🏪</div>
          <h3 className="text-lg font-black text-slate-800">No Boutique Profile Setup</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">Register a new physical shop location or choose an existing outlet to catalog inventories, calculate undercut margins, and launch ad loops.</p>
        </div>
      )}
    </div>
  );
}
