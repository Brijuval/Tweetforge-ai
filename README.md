TweetForge AI 🐦✨

An AI-powered brand tweet generator that creates 10 on-brand tweets using 3 intelligent voice analysis methods.

🔗 Live Demo: https://tweetforge-ai.vercel.app
📁 GitHub: https://github.com/Brijuval/tweetforge-ai

📌 What It Does
TweetForge takes your brand details and generates 10 perfectly on-brand tweets — covering promotional, engaging, witty, informative, inspirational, and question-style content.

🧠 Three Brand Voice Analysis Methods
MethodHow it worksBest for📡 Social Post AnalysisPaste real posts — AI extracts tone, themes, voice patternsExisting brands with content🧠 AI InferenceDescribe your brand — AI infers everything automaticallyNew brands or quick testing🎛 Manual DefinitionHand-pick tones, themes, audience yourselfFull creative control

✨ Features

Brand Voice Analysis — 5-dimension scoring (Professionalism, Friendliness, Humor, Authority, Engagement)
10 Tweet Mix — Promotional, Engaging, Witty, Informative, Inspirational, Question
Filter by Style — View tweets by category
Copy & Export — Copy individual tweets or export full report as .txt
Regenerate — Instantly re-generate with same brand settings
Responsive UI — Works on desktop and mobile


🛠 Tech Stack
LayerTechnologyFrontendReact 18 + ViteStylingCSS-in-JS (inline styles)AI ModelGroq API — LLaMA 3.3 70BFontsOutfit + Lora (Google Fonts)DeploymentVercel (free)

🚀 Getting Started Locally
Prerequisites

Node.js 18+
Groq API key (free at console.groq.com)

Installation
bash# Clone the repo
git clone https://github.com/Brijuval/tweetforge-ai.git
cd tweetforge-ai

# Install dependencies
npm install

# Create .env file
echo "VITE_GROQ_API_KEY=your_key_here" > .env

# Start dev server
npm run dev
Open http://localhost:5173

📁 Project Structure
tweetforge-ai/
├── src/
│   ├── TweetForge.jsx    ← Main component (all logic + UI)
│   ├── App.jsx           ← Entry point
│   ├── main.jsx          ← React root
│   └── index.css         ← Base reset styles
├── public/
│   └── index.html
├── .env                  ← API key (not committed)
├── .gitignore
├── vite.config.js
├── package.json
└── README.md

🧪 Test Cases
Brand 1 — Zomato (Witty / Humorous)

Mode: AI Inference
Industry: Food & Beverage
Tone Hints: Witty, Humorous, Casual
Products: Food delivery, restaurant discovery, Zomato Gold
Objective: User Engagement

Expected output: Funny, relatable tweets with food puns and meme-style content

Brand 2 — Tesla (Bold / Inspirational)

Mode: Manual Definition
Tones: Bold, Inspirational, Minimal, Authoritative
Themes: Product Features, Motivation, Announcements
Industry: Automotive
Objective: Brand Awareness

Expected output: Short, powerful tweets about innovation and sustainable future

Brand 3 — Nike (Social Post Analysis)

Mode: Social Post Analysis → Platform: Twitter/X
Paste real or sample Nike tweets
Brand Name: Nike, Industry: Sports

Expected output: Motivational, bold tweets matching Nike's real voice

📊 Approach Document
How Brand Voice is Analysed
Method 1 — Social Post Analysis

User pastes real social media posts
A separate Groq API call analyses the posts
Extracts: dominant tones, target audience, content themes, voice observations, 5 dimension scores
This voice profile is then injected into the tweet generation prompt

Method 2 — AI Inference

User provides brand description, industry, audience, and optional tone hints
AI infers all voice attributes from context
Single API call handles both analysis and generation

Method 3 — Manual Definition

User directly selects tones (12 options), themes (12 options), audience, and voice notes
User-defined parameters are passed directly into the generation prompt


Prompt Engineering Strategy

Strict JSON schema enforced in every prompt — AI returns only raw JSON
System role set to "brand strategist and social media copywriter"
Style distribution explicitly specified: 2 promotional, 2 engaging, 2 witty, 2 informative, 1 inspirational, 1 question
Hard constraints in prompt: 280 char limit, 1–3 hashtags, natural emojis
Voice context dynamically injected based on selected analysis method
Temperature 0.9 for creative variation while staying on-brand


🌐 Deployment
Deployed on Vercel (free tier):

Connect GitHub repo to Vercel
Add VITE_GROQ_API_KEY as environment variable
Auto-deploys on every git push


📝 License
MIT License — free to use and modify.

👤 Author
Built by Valmeeki / Brijuval as part of an AI Tools & Workflows assignment.

Powered by Groq · LLaMA 3.3 70B · Vite · React
