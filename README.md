# 🧵 LocalLoop — Hyperlocal Fashion Marketplace

> Bridging independent fashion merchants with neighborhood consumers through data-driven local insights and generative AI.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Front-End Client Layer](#1-front-end-client-layer)
  - [Back-End Service Layer](#2-back-end-service-layer)
  - [Data & Persistence Layer](#3-data--persistence-layer)
- [Core Features](#core-features)
  - [Local Market & Competitor Analysis](#-local-market--competitor-analysis)
  - [Opportunity Markdown Price (OMP) Optimizer](#-opportunity-markdown-price-omp-optimizer)
  - [Wardrobe Creative Sandbox & Smart Discovery](#️-wardrobe-creative-sandbox--smart-discovery)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)

---

## Overview

LocalLoop is a full-stack web platform built on a modern reactive architecture. It connects local independent fashion merchants (SMBs) with neighborhood consumers by surfacing hyperlocal supply-and-demand signals and powering generative AI experiences — from dynamic pricing to personalized outfit generation.

---

## Architecture

The platform is organized into three core layers:

### 1. Front-End Client Layer

The UI is a single-page React application styled with Tailwind CSS, presenting two distinct portals:

**Merchant Portal**
A suite for small business apparel owners to:
- Manage store locations and physical catalogs
- Analyze neighborhood supply-and-demand indicators
- Run dynamic promotions and markdown campaigns

**Consumer Portal**
An interactive space centered on the **Wardrobe Creative Sandbox**, where shoppers can:
- Discover local outlets by neighborhood proximity
- Browse live inventory in real time
- Experiment with generative outfit suggestions and visual try-on mockups

---

### 2. Back-End Service Layer

The server runs an Express application serving two primary purposes:

**Operational API Routes**
Orchestrates core business operations including:
- Adding and managing SKUs
- Retrieving nearby available stores
- Creating and submitting markdown schedules

**Generative AI Proxy**
Proxies requests securely to Gemini models to:
- Parse style-specific local trends
- Evaluate competitor positioning
- Drive predictive pricing simulations

All AI calls are server-side to ensure sensitive credentials are never exposed to the browser.

---

### 3. Data & Persistence Layer

The platform uses a hybrid data management approach optimized for high availability, security, and fast session syncing:

| Store | Purpose |
|---|---|
| **Firebase Firestore** | Cloud database for user roles and store registrations, protected by strict security rules validating coordinates, emails, and inputs |
| **REST Data Store** | Robust database tracking active categories, catalogues, styles, coordinates, and pricing lists |

---

## Core Features

### 📊 Local Market & Competitor Analysis

Rather than generic market advice, the backend delivers localized demand analysis tailored to each merchant's style profile (e.g., *Corporate Workwear* for Business Chic vs. *Evening Attire* for Party Animal).

The system:
- Examines real-time trends scoped to specific local neighborhoods
- Identifies exactly three directly competing garments from multinational brands (e.g., Theory, Zara, Hugo Boss)
- Visualizes competitor items alongside direct product images for objective value benchmarking

---

### 🧠 Opportunity Markdown Price (OMP) Optimizer

Merchants can run a predictive ML wizard inspired by BigQuery ML and Vertex AI AutoML Tables patterns:

**AutoML Tables Simulation**
Displays live regressor training and evaluation steps, illustrating RMSE loss decline as regional characteristics are processed.

**Price Elasticity Matrix**
Computes elasticities to predict precise volume lift and overall revenue impact of a given markdown.

**Feature Importance Bento**
Graphs the weight of input variables such as:
- Competitor Price Gap
- Neighborhood Density Index
- Seasonal Demand Signals

**Instant Submission**
Submits the mathematically calibrated markdown directly to the live local catalog in one click.

---

### 🛍️ Wardrobe Creative Sandbox & Smart Discovery

For consumers, the platform provides:
- **Neighborhood proximity maps** to locate stores matching personal style preferences
- **Dynamic outfit generator** — select separate categories and receive automated mix-and-match advice
- **Visual try-on mockups** generated instantly via the generative AI backend

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS |
| Backend | Node.js, Express |
| Generative AI | Google Gemini (via secure server proxy) |
| Cloud Database | Firebase Firestore |
| REST Data Store | REST-based relational database |
| ML Inspiration | BigQuery ML, Vertex AI AutoML Tables patterns |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Firestore enabled
- Gemini API key

---

> Built with ❤️ for independent fashion merchants and their neighborhoods.