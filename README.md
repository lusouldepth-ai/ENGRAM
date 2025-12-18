# ENGRAM - AI Flashcard Learning Platform

![Engram Banner](https://img.shields.io/badge/Status-Beta-orange?style=for-the-badge) ![License](https://img.shields.io/badge/License-Private-blue?style=for-the-badge)

**ENGRAM** is an AI-powered vocabulary learning application that combines the "Less, but better" design philosophy of Dieter Rams with advanced spaced repetition algorithms (FSRS). It generates personalized study cards based on user interests and career paths, offering a seamless, aesthetic learning experience.

## ✨ Key Features

- **AI Card Generation**: Create context-aware vocabulary cards tailored to your profession (e.g., AI, Medical, Legal) or interests.
- **Dieter Rams Aesthetic**: A "Digital Braun" design system featuring warm grays, orange accents, and tactile interactive elements.
- **Smart Review (FSRS)**: Advanced spaced repetition scheduling to maximize retention efficiency.
- **Hybrid Source Mode**: Prioritizes high-quality database definitions, falling back to AI generation only when necessary.
- **Pronunciation & Shadowing**: Integrated TTS and recording features for speaking practice.

## 📂 Project Structure

- **`/app`**: Next.js App Router pages and layouts.
- **`/components`**: Reusable UI components (design system).
- **`/lib`**: Utility functions, Supabase clients, and contexts.
- **`/docs`**: Detailed project documentation.
  - [PRD (Product Requirements)](./docs/PRD_V3.md)
  - [Deployment Guide](./docs/DEPLOYMENT.md)

## 🚀 Getting Started

1. **Clone the repository** (Private access only).
2. **Install dependencies**:
   ```bash
   pnpm install
   ```
3. **Configure Environment**:
   - Copy `.env.example` to `.env.local` (Ask administrator for keys).
   - **Security Note**: Never commit `.env.local` to git.
4. **Run Development Server**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Framer Motion
- **Database**: Supabase (PostgreSQL)
- **AI**: DeepSeek API / OpenAI
- **Auth**: Supabase Auth

---
*© 2024 ENGRAM. All rights reserved.*
