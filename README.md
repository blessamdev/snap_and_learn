# Snap and Learn 🇰🇪

A focused, mobile-first AI study tool tailored for first-year Computer Science and Engineering university students in Kenya (University of Nairobi, Kenyatta University, JKUAT, Strathmore, etc.). Students photograph study material and receive instant, patient guidance from **Gemma 4** through the Gemini API.

Built to be fast, reliable, low-bandwidth friendly, and demo-ready.

---

## 🌟 Key Features

1. **Snap or Upload (Mobile-First):**
   - Tap to snap directly with mobile camera (`capture="environment"`) or upload from gallery.
   - Built-in **client-side image compression** (resizes to max 1280px via HTML5 Canvas before uploading) to preserve mobile data bundles in Kenya.
2. **Three Dedicated Study Modes:**
   - 💡 **Explain:** Step-by-step breakdown of what is in the photo with simple explanations and clear reasoning.
   - 📝 **Quiz me:** Generates 3 interactive multiple-choice questions with instant right/wrong feedback, detailed rationale, and final score.
   - 🔍 **Check my working:** Evaluates the student's own attempted solution, praises what was right, isolates the *first* mistake, explains why it is wrong, provides a guiding hint, and demonstrates the corrected next step (without dumping the full answer).
3. **"What I See" Confirmation:**
   - Displays a short 1-2 sentence confirmation of what Gemma read so students can verify the AI's understanding before trusting the answer.
4. **Honest Quality Guardrails:**
   - If an image is blurry, cropped, or illegible, it sets `readable: false` and politely requests a retake rather than hallucinating or guessing.
   - If a non-study image (e.g. food, scenery, coffee) is uploaded, it politely asks for academic notes, circuits, or code.
5. **Swahili Summary Toggle (Kiswahili Sanifu):**
   - Optional toggle for Kenyan students to get a 2-4 sentence takeaway in Swahili.
6. **Built-in 5 One-Click Demo Test Cases:**
   - Instantly testable directly in the UI without needing to photograph external notes.
7. **Privacy-Preserving:**
   - Photos are processed in real-time in memory and never stored. No account required.
8. **Server-Side Security & Rate Limiting:**
   - API key lives strictly on the server (`GEMINI_API_KEY`).
   - In-memory sliding window rate limiter protects quotas.

---

## ⚙️ Model Configuration

The Gemma model ID is centralized in a single configuration constant in `server.ts`:

```typescript
// server.ts
export const MODEL_ID = process.env.MODEL_ID || 'gemma-4-31b-it';
export const FALLBACK_MODEL_ID = 'gemini-3.8-flash';
```

If you wish to switch model variants (e.g. `gemma-4-26b-a4b-it`, `gemma-4-31b-it`, or `gemini-3.8-flash`), simply change this constant or set the `MODEL_ID` environment variable.

---

## 🚀 How to Get a Free Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google Account.
3. Click on **"Get API key"** in the left sidebar navigation.
4. Click **"Create API key in new project"** (or select an existing Google Cloud project).
5. Copy your newly created API key.

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 18+ (tested on Node v20/v22)
- npm or pnpm

### Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/snap-and-learn.git
   cd snap-and-learn
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   MODEL_ID="gemma-4-31b-it"
   PORT=3000
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` on your mobile browser or desktop.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## ☁️ Deployment Guide

### Option A: Deploying to Vercel

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"** > **"Import Git Repository"**.
3. Under **Environment Variables**, add:
   - Key: `GEMINI_API_KEY`
   - Value: `your-gemini-api-key`
   - Key: `MODEL_ID`
   - Value: `gemma-4-31b-it`
4. For full-stack routing on Vercel:
   - The `/api/analyze` route can be run as a Serverless Function under `api/analyze.ts` or through the Node server with `@vercel/node`.
5. Click **Deploy**.

### Option B: Deploying to Netlify

1. Push your code to GitHub.
2. In [Netlify](https://netlify.com/), click **"Add new site"** > **"Import an existing project"**.
3. Set Build Command: `npm run build` and Publish Directory: `dist`.
4. Go to **Site Configuration** > **Environment Variables** and add `GEMINI_API_KEY`.
5. Use Netlify Functions (or Express adapter) to route `/api/*`.

### Option C: Deploying to Cloud Run or Render

1. Deploy as a standard Node container:
   - Build command: `npm run build`
   - Start command: `npm start`
   - Environment variables: `GEMINI_API_KEY=...`

---

## 🧪 5 Sample Test Cases & Expected Behaviors

The app includes 5 pre-built test cases available under the **"Samples"** tab:

### 1. 4-Variable Karnaugh Map (`kmap`)
- **Subject:** Computational Logic (Boolean Algebra & K-Maps)
- **Image:** A handwritten 4-variable K-map for $F(A,B,C,D) = \Sigma m(0, 2, 5, 7, 8, 10, 13, 15)$.
- **Student Attempt:** Correctly identified quad $(5, 7, 13, 15)$ as $BD$, but made an error on the corners: grouped $(0,2)$ and $(8,10)$ as separate 2-cell groups rather than recognizing the 4-corner wrap-around quad $B'D'$.
- **Recommended Mode:** `check` ("Check my working")
- **Expected Behavior:**
  - *What I see:* Recognizes a 4-variable Karnaugh map with 8 minterms.
  - *Praise:* Commends the correct identification of the center quad $BD$.
  - *First Error:* Flags grouping $(0,2)$ and $(8,10)$ as pairs.
  - *Why:* Karnaugh maps wrap around both horizontally and vertically; corners $m0, m2, m8, m10$ form a larger group of 4 (power of 2), eliminating two variables instead of one.
  - *Hint:* Look at the extreme four corners simultaneously.
  - *Corrected Step:* Combine $m(0,2,8,10)$ into a single group giving $B'D'$. Final function: $F = BD + B'D'$.

---

### 2. C Pointer Compile Warning & Segfault (`c-error`)
- **Subject:** C Programming (Pointers & Memory Allocation)
- **Image:** VS Code editor and terminal screenshot showing:
  ```c
  char *campus_name;
  strcpy(campus_name, "Chiromo Campus");
  ```
  with gcc warning: `warning: 'campus_name' is used uninitialized` and runtime error: `Segmentation fault (core dumped)`.
- **Recommended Mode:** `explain`
- **Expected Behavior:**
  - *What I see:* Identifies the C source code and the terminal segmentation fault.
  - *Explanation Steps:*
    1. Defines what an uninitialized pointer (wild pointer) is in C.
    2. Explains that `campus_name` holds an arbitrary, unallocated memory address.
    3. Explains why `strcpy` trying to write bytes into restricted OS memory triggers an immediate segmentation fault.
    4. Shows the proper solution using fixed array allocation (`char campus_name[50];`) or dynamic memory (`malloc(50)`).

---

### 3. Two-Loop DC Circuit (`kirchhoff`)
- **Subject:** Introductory Physics (Electrostatics & Kirchhoff's Laws)
- **Image:** A two-mesh circuit diagram with 12V battery $V_1$, 6V battery $V_2$, resistors $R_1=4\Omega$, $R_2=2\Omega$, $R_3=6\Omega$, and loop currents $I_1, I_2$.
- **Recommended Mode:** `quiz`
- **Expected Behavior:**
  - *What I see:* Identifies the two-loop DC circuit with two DC sources and 3 resistors.
  - *Quiz Output:* Generates 3 interactive multiple-choice questions on:
    1. Kirchhoff's Voltage Law (KVL) loop equation for Loop 1.
    2. Current flowing through the shared resistor $R_2$ ($I_1 - I_2$).
    3. Calculating total power or junction current using Kirchhoff's Current Law (KCL).
  - Tapping options gives immediate right/wrong feedback and clear explanations.

---

### 4. Blurry Motion-Blurred Notes (`blurry`)
- **Subject:** Image Quality Guardrail
- **Image:** Lined notebook page with smeared, heavily motion-blurred handwriting and illegible symbols.
- **Recommended Mode:** `explain`
- **Expected Behavior:**
  - *Readable:* `false`
  - *What I see:* "I can see handwritten notes, but the text is heavily blurred and out of focus. To avoid giving you inaccurate or guessed information, please hold your camera steady and retake a sharp photo in good lighting."
  - Shows friendly retake button.

---

### 5. Kenyan Chai Mug (`non-study`)
- **Subject:** Academic Guardrail
- **Image:** A photo illustration of a steaming ceramic mug of spiced Kenyan tea with mandazi snacks on a wooden desk.
- **Recommended Mode:** `explain`
- **Expected Behavior:**
  - *Readable:* `false`
  - *What I see:* Politely indicates that the image displays a cup of tea and snacks rather than university study materials. Prompts the student to photograph their logic diagrams, C programs, physics circuits, or lecture notes.

---

## 🔒 Security & Best Practices

- **Zero Client-Side Key Exposure:** `process.env.GEMINI_API_KEY` is referenced strictly within `server.ts`. No API keys are bundled into client assets or network payloads.
- **Network Resilience:** Safe JSON extraction cleans markdown code fences and retries once if the model response encounters formatting errors.
- **Graceful Fallback:** If the primary `MODEL_ID` encounters an issue, the server falls back to `gemini-3.8-flash` without terminating the student's study session.

---

## 📜 License
Apache-2.0 License. Designed with ❤️ for university students in Kenya.
