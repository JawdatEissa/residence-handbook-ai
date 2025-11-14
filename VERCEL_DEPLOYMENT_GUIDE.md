# 🚀 Vercel Deployment Guide - Residence Assistant

This guide will help you deploy your Residence Assistant chatbot to Vercel in under 15 minutes, so you can share a live link with the Residence and Housing Department.

---

## 📋 What You'll Need

Before starting, make sure you have:

- ✅ GitHub account (free)
- ✅ Vercel account (free) - sign up at [vercel.com](https://vercel.com)
- ✅ Your `.env.local` file with all API keys (OpenAI + Supabase)
- ✅ Database already set up in Supabase (run `setup-database.sql`)
- ✅ PDFs already ingested (run `npm run ingest`)

---

## 🎯 Step 1: Push Your Code to GitHub (5 minutes)

### If you haven't initialized Git yet:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create your first commit
git commit -m "Initial commit - Residence Assistant AI"
```

### Create a new GitHub repository:

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `residence-assistant-ai`
3. **Visibility:** Public (required for free Vercel deployment)
4. **DO NOT** initialize with README, .gitignore, or license
5. Click **"Create repository"**

### Push your code to GitHub:

```bash
# Add your GitHub repository as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/residence-assistant-ai.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

✅ **Checkpoint:** Your code should now be visible on GitHub!

---

## 🚀 Step 2: Deploy to Vercel (10 minutes)

### A. Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** (if you don't have an account)
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

### B. Import Your Repository

1. Click **"Add New..."** → **"Project"**
2. Find your **`residence-assistant-ai`** repository
3. Click **"Import"**

### C. Configure Your Project

Vercel will automatically detect that it's a Next.js project. You should see:

- **Framework Preset:** Next.js ✅
- **Root Directory:** `./` ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `.next` ✅

**Don't click Deploy yet!** We need to add environment variables first.

### D. Add Environment Variables

Click **"Environment Variables"** and add these 4 variables:

#### Variable 1: OPENAI_API_KEY
- **Key:** `OPENAI_API_KEY`
- **Value:** Your OpenAI API key (starts with `sk-proj-...`)
- Click **"Add"**

#### Variable 2: NEXT_PUBLIC_SUPABASE_URL
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- Click **"Add"**

#### Variable 3: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** Your Supabase anon/public key (starts with `eyJhbGciOiJI...`)
- Click **"Add"**

#### Variable 4: SUPABASE_SERVICE_ROLE
- **Key:** `SUPABASE_SERVICE_ROLE`
- **Value:** Your Supabase service role key (starts with `eyJhbGciOiJI...`)
- Click **"Add"**

⚠️ **IMPORTANT:** 
- Do NOT add quotes around the values
- Do NOT add spaces before or after the values
- Just paste the raw values

### E. Deploy!

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. You'll see confetti 🎉 when it's done!

✅ **Checkpoint:** Your app is now live!

---

## 🧪 Step 3: Test Your Deployment (3 minutes)

Vercel will show you a URL like:

```
https://residence-assistant-ai-abc123.vercel.app
```

### Test it:

1. Click on the URL to open your live app
2. You should see the **"Residence Assistant"** title
3. You should see 5 FAQ buttons
4. Click on any FAQ button or type a question
5. Verify you get an answer with citations

### Test Questions:

- "Which residences require a meal plan?"
- "How to submit a maintenance request?"
- "What are the quiet hours?"

**✅ All working?** You're ready to share!

---

## 📧 Step 4: Share with Residence & Housing Department

### Copy Your Deployment URL

Your live URL is: `https://residence-assistant-ai-[your-id].vercel.app`

### Send This Email:

```
Subject: New AI Assistant for Residence Questions - Demo Ready

Hi [Name],

I've built an AI-powered assistant that can answer residence and housing questions 
instantly. It uses the official Residence Handbook and provides page citations for 
every answer.

🔗 Live Demo: [YOUR_VERCEL_URL_HERE]

Try asking:
- "Which residences require a meal plan?"
- "How to submit a maintenance request?"
- "What are the quiet hours?"

The system includes:
✅ Instant answers from official documents
✅ Page citations for verification
✅ Clickable links to resources
✅ Smart caching (reduces costs)

Each browser session is independent - when you close the tab and reopen, 
it starts fresh with the FAQ screen.

I'd love to hear your feedback!

Best regards,
[Your Name]
```

---

## 🎨 How the Session Management Works

**What happens when users visit your link:**

1. **First Visit:** Users see the FAQ screen with 5 common questions
2. **During Session:** Conversation history is maintained while the tab is open
3. **Close Tab:** When they close the browser tab/window, the session ends
4. **Return Visit:** Opening the link again shows the FAQ screen again (fresh start)

**Backend Caching (Always Active):**
- All questions and answers are cached in Supabase
- If someone asks the same question again, it returns instantly
- This reduces OpenAI API costs by ~40%
- Cache persists across all sessions and users

---

## 🔧 Troubleshooting

### ❌ "Module not found" error during build

**Fix:** Make sure all dependencies are in `package.json` (not `devDependencies`)

Check that these are in `dependencies`:
- `@supabase/supabase-js`
- `openai`
- `react-markdown`

### ❌ "API Error 500" in production

**Fix:** Check environment variables in Vercel

1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Verify all 4 variables are set correctly
4. No quotes, no extra spaces

### ❌ "Cannot find it in materials" for all questions

**Fix:** Your database is empty

1. Make sure you ran `npm run ingest` locally first
2. Check Supabase → Table Editor → `chunks` table
3. Should have 47+ rows

### ❌ Build fails with TypeScript errors

**Fix:** 

```bash
# Run locally to see errors
npm run build

# Fix any TypeScript errors
# Then commit and push
git add .
git commit -m "Fix build errors"
git push
```

Vercel will automatically redeploy when you push to GitHub.

---

## 🔄 Making Updates

After deployment, any changes you push to GitHub will automatically trigger a new deployment:

```bash
# Make your changes to the code

# Commit and push
git add .
git commit -m "Update XYZ feature"
git push

# Vercel automatically deploys the new version (takes 2-3 minutes)
```

### Update PDFs:

If the Residence Handbook is updated:

1. Replace the PDF in `data/pdfs/`
2. Run `npm run ingest` locally
3. The live app will immediately use the updated data (no redeployment needed!)

---

## 📊 Monitoring Your Deployment

### View Analytics (Free on Vercel)

1. Go to your project in Vercel
2. Click **"Analytics"** tab
3. See:
   - Page views
   - Unique visitors
   - Response times
   - Error rates

### View Logs

1. Go to your project in Vercel
2. Click **"Deployments"** → Select latest deployment
3. Click **"Functions"** tab
4. See API logs in real-time

---

## 💰 Cost Estimate

**Free Tier Includes:**
- Vercel hosting: FREE (hobby plan)
- Supabase database: FREE (up to 500MB)
- OpenAI API: Pay per use (~$0.002 per question)

**Estimated Monthly Cost:**
- 100 questions/month: ~$0.20
- 500 questions/month: ~$1.00
- 1000 questions/month: ~$2.00

With semantic caching, costs are reduced by ~40%!

---

## 🎉 You're Live!

Your Residence Assistant is now:

- ✅ Deployed and accessible via a shareable link
- ✅ Session-based (each tab visit is independent)
- ✅ Showing FAQ buttons on initial load
- ✅ Caching responses for efficiency
- ✅ Production-ready and scalable

**Share your link and impress the Residence & Housing Department!** 🚀

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## 🆘 Need Help?

If you encounter any issues:

1. Check the **Troubleshooting** section above
2. View Vercel deployment logs
3. Run `npm run diagnose` locally to check database health
4. Check Supabase logs in your dashboard

**Common Questions:**

Q: Can I use a custom domain?
A: Yes! In Vercel, go to Settings → Domains and add your custom domain (requires domain ownership)

Q: How do I roll back to a previous version?
A: In Vercel, go to Deployments, find the working version, click "..." → "Promote to Production"

Q: Can I see who's using the app?
A: Yes! Enable Vercel Analytics (free) to see visitor stats

---

**Good luck! 🍀 Your demo is ready to impress!**

