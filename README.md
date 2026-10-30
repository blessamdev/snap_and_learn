# Snap and Learn

**Tagline:** *Capture. Understand. Learn.*

Snap and Learn is a multimodal AI-powered learning companion for university, college, and diploma students. Students simply photograph or upload their study material—handwritten lecture notes, textbook passages, equations, code and compiler errors, circuit diagrams, graphs, or assignment questions—and receive patient, step-by-step educational guidance powered by Google's **Gemma 4** (`gemma-4-26b-a4b-it`) via the Gemini API.

Built mobile-first for affordable smartphones with low bandwidth, clean typography, high contrast, and accessible touch targets.

---

## 🏗️ Project Architecture & File Tree

```
/
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules (.env protected)
├── index.html                # App entry point with meta tags & Google fonts
├── metadata.json             # App capabilities & AI Studio configuration
├── package.json              # Project dependencies & npm scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite bundler configuration
├── server.ts                 # Express full-stack backend (/api/analyze & /api/followup)
├── README.md                 # Complete documentation, test results & deployment
└── src/
    ├── App.tsx               # Main mobile-first application (Phase 1 MVP + Phase 2)
    ├── index.css             # Tailwind CSS & custom animations
    ├── main.tsx              # React DOM mounting entry point
    ├── types.ts              # Core schemas, profile, follow-up & Phase 3 types
    ├── data/
    │   └── sampleCases.ts    # 5 Verified test case fixtures with SVG diagrams
    └── utils/
        └── imageCompressor.ts # Client-side image resize (~1280px) via Canvas
```

---

## 🌟 Core Features by Build Phase

### Phase 1: MVP (Complete & Fully Functional)
- **Mobile-First Capture:** Large 48px+ tap target camera snap button (`capture="environment"`) and gallery file picker.
- **Client-Side Image Resizing:** Automatically resizes photos to max 1280px on the longest dimension via HTML5 Canvas before sending over the network, preserving bandwidth while keeping handwriting legible.
- **Three Dedicated Study Modes:**
  1. 💡 **Explain:** Identifies topic, extracts visible text/diagrams, explains concepts in logical steps, defines technical terms, and provides relevant examples.
  2. 📝 **Quiz me:** Generates exactly three multiple-choice questions (4 options each) based strictly on visible content, with immediate feedback, right/wrong rationale, and real-time score tracking.
  3. 🔍 **Check my working:** Finds the *first* incorrect step in a student's solution, explains why it is wrong, provides a guiding hint, shows the corrected step, and acknowledges correct work without spoiling the rest of the problem.
- **"What I See" Confirmation:** States what Gemma 4 read so the student can verify image comprehension.
- **Swahili Summary Option:** Optional toggle for a concise, natural Kiswahili summary (*Kiswahili sanifu*).
- **Backend Quality & Security:**
  - Strict input MIME validation (`image/jpeg`, `image/png`, `image/webp`).
  - In-memory sliding-window rate limiter (25 requests/minute per client IP) returning HTTP 429 and `retryAfter`.
  - JSON schema enforcement with automatic single-retry correction if model output is malformed.
  - Zero permanent photo storage.

### Phase 2: Enhanced Learning Tools (Built & Active)
- **Session-Only Follow-Up Chat:** Students can ask follow-up questions about the analyzed material within the active study session via `/api/followup`.
- **My Learning Space (Profile):** Optional student profile (Institution, Country, Programme, Academic Level, Year of Study) stored strictly in `localStorage` to personalize tutor explanations.
- **Image Rotate Tool:** 90° clockwise rotation tool to fix sideways phone camera captures directly in-browser.
- **Results Export:** 1-click Markdown file download (`.md`) and clipboard copy.
- **Dark and Light Mode:** High-contrast toggle with persistent user preference.

### Phase 3: Curriculum Compass (Architected for Future Expansion)
- Structured types in `src/types.ts` (`CurriculumCourse`, `CurriculumTopic`, `learningObjectives`, `masteryLevel`).
- Designed to allow syllabus / course outline uploads, extracting course units, and mapping student snapshots to syllabus learning objectives.

---

## ⚙️ Model Configuration & Gemini API Verification

The model identifier is stored in a single constant in `server.ts`:

```typescript
// server.ts
export const MODEL_ID = process.env.MODEL_ID || 'gemma-4-26b-a4b-it';
```

### Verified Model Capabilities:
- **Identifier:** `gemma-4-26b-a4b-it` (Google DeepMind's Gemma 4 Mixture-of-Experts multimodal model).
- **Architecture:** ~25.2B total parameters, ~4B active per token.
- **Inputs:** Multimodal (accepts inline image base64 + text prompt).
- **Output:** Native structured JSON output (`responseMimeType: "application/json"`).
- **System Instruction Support:** Native support for tutor system prompts.
- **Free-Tier Limits:** Standard Gemini API quotas apply. Rate limiting on our server prevents rapid quota depletion. If quota or model limits are exceeded, a friendly 429 error is shown to the student.

---

## 🔑 How to Get a Free Gemini API Key

1. Navigate to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **"Get API key"** in the left sidebar.
4. Click **"Create API key in new project"** (or choose an existing Google Cloud project).
5. Copy the generated key.
6. In AI Studio Build, configure it in **Settings > Secrets** under `GEMINI_API_KEY`, or add it to your `.env` file locally.

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 18+ (tested on v20 and v22)
- npm or pnpm

### Quickstart
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/snap-and-learn.git
   cd snap-and-learn
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   MODEL_ID="gemma-4-26b-a4b-it"
   PORT=3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` on your mobile phone or browser.

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

---

## ☁️ Deployment Guide

### Deploying to Vercel
1. Push your repository to GitHub.
2. In Vercel, click **Add New Project** and select your repository.
3. In **Environment Variables**, set:
   - `GEMINI_API_KEY`: Your Google AI Studio API key.
   - `MODEL_ID`: `gemma-4-26b-a4b-it`.
4. Deploy. Express routes (`/api/*`) are handled seamlessly.

### Deploying to Netlify or Cloud Run
1. Configure build command `npm run build` and publish directory `dist`.
2. Add `GEMINI_API_KEY` in Netlify Site Settings > Environment Variables.
3. For Docker/Cloud Run, run with `node server.ts` or `tsx server.ts`.

---

## 🧪 Real Test Executions & Actual Results

All five test scenarios were executed against the live server using `gemma-4-26b-a4b-it`:

### Test 1: 4-Variable Karnaugh Map (`kmap`)
- **Mode:** Check my working
- **Result:** `readable: true`
- **Subject:** Computational Logic
- **Topic:** Karnaugh Map (K-map) Simplification
- **What I See:** *"A Karnaugh map for a 4-variable Boolean function F(A,B,C,D) = Σm(0, 2, 5, 7, 8, 10, 13, 15). The student has attempted to group the 1s to find the simplified expression."*
- **First Error:** *"Incomplete grouping of the corner cells."*
- **Why:** *"The student grouped the corner 1s (at cells 0, 2, 8, and 10) as separate entities or as part of smaller groups, instead of recognizing they can form a single quad (a group of 4)."*
- **Hint:** *"In a 4-variable K-map, look at the four extreme corners. Can they be treated as a single group of four adjacent cells?"*
- **Corrected Step:** *"Combine the 1s at (0,0,0,0), (0,0,1,0), (1,0,0,0), and (1,0,1,0) into one group of four..."*

### Test 2: C Compiler Error & Segfault Screenshot (`c-error`)
- **Mode:** Explain
- **Result:** `readable: true`
- **Subject:** C Programming
- **Topic:** Pointers and Memory Allocation
- **What I See:** *"A terminal window showing C code for a file named 'student_record.c' and the subsequent compiler warnings and runtime error (Segmentation fault) after running the compiled program."*
- **Explanation:**
  - *Step 1:* Identifies `char *campus_name` as an uninitialized pointer holding a random garbage address.
  - *Step 2:* Explains why `strcpy` trying to write to that random memory causes the OS to abort execution with a Segmentation fault.
  - *Step 3:* Demonstrates proper array declaration `char campus_name[50]` or dynamic allocation `malloc`.

### Test 3: Kirchhoff Two-Loop Circuit (`kirchhoff`)
- **Mode:** Quiz me
- **Result:** `readable: true`
- **Subject:** Physics & Electronics
- **Topic:** Kirchhoff's Voltage Law (KVL) and Mesh Analysis
- **Quiz:** Generated exactly 3 multiple-choice questions, each with 4 options.
  - *Q1:* Inquires about the current $I_3 = I_1 - I_2$ flowing through shared resistor $R_2$.
  - *Answer Index:* 1 (`I3 = I1 - I2`).
  - *Explanation:* Details how clockwise Loop 1 and counter-clockwise Loop 2 interact at the central node.

### Test 4: Blurry / Illegible Photo (`blurry`)
- **Mode:** Explain
- **Result:** `readable: false`
- **Unreadable Reason:** *"The image is extremely blurry due to camera movement, making all text and formulas illegible."*
- **What I See:** *"I see a very blurry image of what appears to be handwritten marks or lines on a yellow background, but no text or formulas can be identified."*
- **Confidence Note:** Refuses to hallucinate equations or invent missing formulas, asking the student for a sharp retake.

### Test 5: Non-Academic Photo (`non-study`)
- **Mode:** Explain
- **Result:** Politely declined.
- **Subject / Topic:** `N/A`
- **What I See:** *"An illustration of a red mug containing a steaming beverage sitting on a saucer, with a small plate of snacks next to it. The image is labeled as 'Photo of Kenyan Tea (Not Study Material)'."*
- **Explanation:** *"As a learning companion, my purpose is to assist with academic materials, such as textbook pages, equations, diagrams, or lecture notes. Because this image does not contain academic content, I cannot provide an educational explanation for it."*

---

## 🔒 Security & Privacy Practices

- **Zero Client-Side Key Leaks:** The `GEMINI_API_KEY` is referenced solely on the Node server and is never sent in frontend bundles.
- **Untrusted Content Defense:** Text inside uploaded student photos is strictly treated as untrusted data to protect against prompt injection.
- **Sliding-Window Rate Limiter:** Protects against abuse while allowing natural study sessions.
- **Zero Data Retention:** Uploaded photos are decoded in memory, analyzed by Gemma 4, and discarded immediately. No user accounts or database entries are stored.

---

## ⚠️ Known Limitations
- Free-tier Gemini API keys are subject to Google's rate limits and occasional queue spikes during peak global hours.
- Highly reflective glare on glossy textbook paper may reduce text extraction accuracy; students are advised to shoot with diffused lighting.

---

## 📜 License
Apache-2.0 License. Built for university and college students everywhere.
