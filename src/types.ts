/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SMBStore {
  id: string;
  name: string;
  ownerEmail: string;
  locationName: string;
  latitude: number;
  longitude: number;
  targetAudience: string;
  targetLocalities: string[];
}

export interface SKUItem {
  id: string;
  smbId: string;
  name: string;
  category: "Tops" | "Bottoms" | "Dresses" | "Outerwear" | "Shoes" | "Accessories";
  price: number;
  sku: string;
  stock: number;
  imageUrl: string;
  styleTags: string[];
  description: string;
  sizes: string[];
}

export interface MatchedStoreInfo {
  smbId: string;
  storeName: string;
  matchedItem: SKUItem;
  distanceKm: number;
  deliveryTime: string;
  deliveryCharges: number;
  similarityScore: number;
}

export interface SavedOutfit {
  id: string;
  occasion: string;
  mood: string;
  intention: string;
  bodyType: string;
  generatedImageUrl: string;
  generatedDescription: string;
  isApproved: boolean;
  matchedStores?: MatchedStoreInfo[];
}

export interface ActiveDiscount {
  id: string;
  smbId: string;
  storeName: string;
  skuId: string;
  name: string;
  originalPrice: number;
  discountPercent: number;
  discountedPrice: number;
  targetLocalities: string[];
  status: "draft" | "approved";
  socialPromos?: {
    facebook: string;
    instagram: string;
    tiktok: string;
    imagePrompt: string;
  };
}

export interface MarketTrendConfig {
  locality: string;
  trends: string[];
  competingBrands: {
    brand: string;
    item: string;
    price: number;
  }[];
  recommendedDiscountPercent: number;
}
