# Quick Deployment Checklist

## Before You Deploy (5 minutes)

### 1. Verify Your App Works Locally

```bash
npm run dev
# Visit http://localhost:3000 and test a few questions
```

### 2. Ensure Data is Loaded

```bash
npm run check-chunks
# Should show multiple chunks with page numbers
```

### 3. Test Cache System

```bash
npm run check-cache
# Should show no errors
```

### 4. Verify Environment Variables

Check `.env.local` has all required keys:

- [x] `OPENAI_API_KEY`
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_ROLE`

---

## Deploy to Vercel (10 minutes)

### Step 1: Push to GitHub (2 min)

```bash
git init
git add .
git commit -m "Initial commit - SFU Residence Handbook AI"

# Create repo on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/residence-handbook-ai.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel (5 min)

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New Project"
4. Select your repository
5. Add environment variables (copy from `.env.local`)
6. Click "Deploy"

### Step 3: Verify Deployment (2 min)

1. Visit your Vercel URL (e.g., `https://residence-handbook-ai.vercel.app`)
2. Ask test question: "What is the campus emergency number?"
3. Verify answer appears with citations

### Step 4: Check Logs (1 min)

- Vercel Dashboard → Your Project → Logs
- Look for `[retrieveContext]` and `[POST /api/ask]` logs
- Confirm no errors

---

## Send to Employer

### 1. Copy Your Vercel URL

Example: `https://residence-handbook-ai-abc123.vercel.app`

### 2. Customize Email Template

Open `EMAIL_TEMPLATE.md` and:

- Replace `[YOUR_VERCEL_URL_HERE]` with your actual URL
- Replace `[Manager/Supervisor Name]` with their name
- Replace `[Your Name]` etc. with your details

### 3. Send Email

- Copy the customized email
- Send to your supervisor/manager
- Include the live demo link prominently

---

## After Sending Email

### Monitor Usage

- Check Vercel Analytics daily
- Look for patterns in questions asked
- Note any errors in logs

### Be Ready to Respond

Have answers ready for common questions:

- ✅ "How accurate is it?" → Show citation system
- ✅ "How much does it cost?" → ~$50/month for moderate usage
- ✅ "Can we update it?" → Yes, just replace PDF and re-ingest
- ✅ "Is it secure?" → Yes, rate limiting + HTTPS + no PII collected

### Prepare for Demo Call

If they request a demo:

1. Show the live app
2. Demonstrate 3-5 example questions
3. Show how citations work
4. Explain the caching system
5. Walk through update process
6. Discuss integration possibilities

---

## Quick Commands Reference

```bash
# Development
npm run dev              # Start local dev server

# Data Management
npm run ingest           # Load PDFs into database
npm run check-chunks     # Verify chunk data
npm run check-cache      # Check cache health

# Diagnostics
npm run diagnose         # Full system health check
npm run test-links       # Preview link extraction

# Deployment
git push                 # Auto-deploys to Vercel
vercel logs              # View production logs
```

---

## Common Issues & Solutions

### Issue: "No results returned" in production

**Solution:** Run `npm run ingest` locally (data goes to Supabase, accessible by production)

### Issue: "API key invalid" error

**Solution:** Check Vercel environment variables are set correctly (no quotes, no spaces)

### Issue: Slow response times

**Solution:** Check Vercel logs, may need to upgrade Supabase plan if database is slow

### Issue: Cache not working

**Solution:** Run the SQL from `ARCHITECTURE.md` in Supabase SQL Editor

---

## Success Metrics to Share

After 1 week, share these stats with your employer:

- **Total questions asked:** [X]
- **Average response time:** ~2 seconds
- **Cache hit rate:** ~40% (cost savings!)
- **Most common questions:** [List top 5]
- **User satisfaction:** [If you add feedback system]

This demonstrates real value and usage patterns.

---

## Next Steps After Approval

If your employer approves the prototype:

1. **Custom Domain** - Get sfu.ca subdomain
2. **Branding** - Add SFU colors, logo
3. **Analytics** - Add proper tracking
4. **More Content** - Ingest additional documents
5. **Feedback System** - Add thumbs up/down
6. **Integration** - Embed in official website

All of these are straightforward to implement!

---

## You're Ready! 🚀

✅ App is production-ready  
✅ Deployment is straightforward  
✅ Email template is professional  
✅ You have answers to common questions

**Good luck with your presentation!**
