# 🚀 Deploy Your Residence Assistant - Get a Working Link in 15 Minutes

Follow these steps exactly to get your live link.

---

## ✅ **Before You Start - Check These:**

1. Your app works locally (run `npm run dev` and test it)
2. You have a GitHub account ([sign up free](https://github.com/signup))
3. Your `.env.local` file has all 4 API keys

---

## 📝 **Step 1: Push Your Code to GitHub** (5 minutes)

### A. Check Git Status

Open your terminal in the project folder and run:

```bash
git status
```

You should see modified files listed.

### B. Stage and Commit All Changes

```bash
# Add all files
git add .

# Commit with a message
git commit -m "Add FAQs and session management"
```

### C. Create GitHub Repository

1. Go to: https://github.com/new
2. **Repository name:** `residence-assistant-ai`
3. **Description:** "AI chatbot for residence questions"
4. **Visibility:** ✅ **Public** (required for free Vercel hosting)
5. **DO NOT** check "Add a README" or any other options
6. Click **"Create repository"**

### D. Push to GitHub

GitHub will show you commands. Copy YOUR username and run:

```bash
# Add remote (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/residence-assistant-ai.git

# Push to GitHub
git branch -M main
git push -u origin main
```

✅ **Check:** Go to your GitHub repository URL - you should see all your files there!

---

## 🚀 **Step 2: Deploy to Vercel** (8 minutes)

### A. Create Vercel Account

1. Go to: https://vercel.com/signup
2. Click **"Continue with GitHub"**
3. Click **"Authorize Vercel"**

### B. Import Your Project

1. You'll be on the Vercel dashboard
2. Click **"Add New..."** (top right)
3. Click **"Project"**
4. Find **`residence-assistant-ai`** in the list
5. Click **"Import"**

### C. Configure Project

You'll see a configuration screen. Keep these defaults:

- ✅ **Framework Preset:** Next.js (auto-detected)
- ✅ **Root Directory:** ./
- ✅ **Build Command:** `npm run build`
- ✅ **Output Directory:** .next

**STOP! Don't click Deploy yet!**

### D. Add Environment Variables

Scroll down to **"Environment Variables"** section.

Click **"Add"** and enter each of these 4 variables:

#### Variable 1:
- **Name:** `OPENAI_API_KEY`
- **Value:** (paste your OpenAI key from `.env.local`)
- Click **"Add"**

#### Variable 2:
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** (paste your Supabase URL from `.env.local`)
- Click **"Add"**

#### Variable 3:
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** (paste your Supabase anon key from `.env.local`)
- Click **"Add"**

#### Variable 4:
- **Name:** `SUPABASE_SERVICE_ROLE`
- **Value:** (paste your Supabase service role key from `.env.local`)
- Click **"Add"**

⚠️ **Important Tips:**
- Copy values EXACTLY from your `.env.local` file
- Do NOT add quotes (") around values
- Do NOT add spaces before or after values
- Just paste the raw values

### E. Deploy!

1. Click **"Deploy"** button (bottom of page)
2. Wait 2-3 minutes
3. You'll see a building progress screen
4. When done, you'll see: 🎉 **"Congratulations!"**

✅ **You now have a working link!**

---

## 🎉 **Step 3: Get Your Link** (1 minute)

On the success screen, you'll see your deployment URL:

```
https://residence-assistant-ai-xxxxx.vercel.app
```

### Test Your Link:

1. Click the **"Visit"** button OR copy the URL
2. Open it in your browser
3. You should see:
   - ✨ "Residence Assistant" title
   - 💬 Welcome message
   - 10 FAQ buttons in a 2-column grid

### Try It Out:

Click on any FAQ button, like:
- "Which residences require a meal plan?"
- "Can I have a party in my room?"

You should get an answer with citations!

---

## 📧 **Step 4: Share Your Link**

### Copy Your URL

Your working link is:
```
https://residence-assistant-ai-[your-unique-id].vercel.app
```

### Send to Residence & Housing Department:

```
Subject: Residence Assistant AI - Live Demo

Hi [Name],

I've built an AI assistant for residence questions. It provides instant 
answers from the official handbook with page citations.

🔗 Live Demo: [PASTE YOUR VERCEL URL HERE]

Try clicking any of the 10 FAQ questions or type your own question!

Features:
✅ 10 common questions ready to click
✅ Instant answers with page citations
✅ Clickable links to resources
✅ Fresh session each time you visit

Let me know what you think!

Best,
[Your Name]
```

---

## 🔄 **Making Updates Later**

If you want to change something (add more FAQs, fix text, etc.):

```bash
# Make your changes in the code

# Commit and push
git add .
git commit -m "Update FAQs"
git push

# Vercel automatically redeploys! (takes 2-3 minutes)
```

Your link stays the same - it just updates automatically!

---

## 🆘 **Troubleshooting**

### Problem: Build Failed on Vercel

**Check:**
1. Did you add all 4 environment variables?
2. Are there any typos in the variable names?
3. Did you copy the complete values without quotes?

**Fix:** Go to Vercel Dashboard → Your Project → Settings → Environment Variables
→ Check/fix the variables → Redeploy

### Problem: "Cannot find it in materials" for all questions

**Check:**
1. Did you run `npm run ingest` locally before deploying?
2. Check your Supabase dashboard → Table Editor → `chunks` table
3. Should have 47+ rows of data

**Fix:** Run `npm run ingest` locally, then test again

### Problem: TypeScript Errors During Build

**Check locally:**
```bash
npm run build
```

If it fails locally, fix the errors, then:
```bash
git add .
git commit -m "Fix build errors"
git push
```

### Problem: Environment Variable Not Working

**Common mistake:** Adding quotes around values

❌ Wrong:
```
OPENAI_API_KEY="sk-proj-xyz123"
```

✅ Correct:
```
OPENAI_API_KEY=sk-proj-xyz123
```

---

## 📊 **Your Deployment Info**

Fill this out once deployed:

```
GitHub Repo: https://github.com/YOUR_USERNAME/residence-assistant-ai
Vercel URL: https://residence-assistant-ai-______.vercel.app
Deployed on: [DATE]
```

---

## 🎯 **What Happens When Users Visit Your Link**

1. **First visit:** See 10 FAQ buttons
2. **Click FAQ:** Get instant answer
3. **Ask questions:** Conversation builds up
4. **Close tab:** Session ends
5. **Reopen link:** See FAQ buttons again (fresh start)
6. **Backend:** All answers cached in database for speed

---

## 💰 **Costs**

- **Vercel:** FREE (100GB bandwidth/month)
- **Supabase:** FREE (500MB database)
- **OpenAI:** ~$0.002 per question

**Estimated:**
- 100 questions: ~$0.20/month
- 500 questions: ~$1.00/month

With caching, actual costs are ~40% lower!

---

## ✅ **Checklist**

Before sharing your link, verify:

- [ ] Link opens in browser
- [ ] Shows "Residence Assistant" title
- [ ] Shows 10 FAQ buttons
- [ ] FAQs are clickable
- [ ] Get answers with citations
- [ ] Close tab and reopen shows FAQs again
- [ ] Tested on mobile (responsive design)

---

## 🎉 **You're Done!**

You now have:
- ✅ A working live link
- ✅ 10 FAQ questions
- ✅ Session-based history
- ✅ Beautiful modern UI
- ✅ Production-ready deployment

**Share your link and impress them!** 🚀

---

## 📞 **Need Help?**

Common commands:

```bash
# Test locally
npm run dev

# Check what changed
git status

# See deployment logs
# Go to: vercel.com/dashboard → Your Project → Deployments → Logs

# Rebuild
git push
```

**Your link will work immediately after successful deployment!** ✨

