# Deployment Guide - SFU Residence Handbook AI

## Recommended: Deploy to Vercel (Fastest & Free)

**Why Vercel?**

- ✅ Built by the Next.js creators (perfect compatibility)
- ✅ Free tier (no credit card required)
- ✅ Automatic HTTPS
- ✅ One-click deployment from GitHub
- ✅ Automatic deployments on git push
- ✅ Custom domain support

**Time to deploy: ~10 minutes**

---

## Step-by-Step Deployment

### 1. Push Your Code to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - SFU Residence Handbook AI"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/residence-handbook-ai.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. Click **"Sign Up"** (use your GitHub account)
3. Click **"Add New Project"**
4. Select your **`residence-handbook-ai`** repository
5. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### 3. Add Environment Variables

In the Vercel deployment settings, add these environment variables:

```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE=eyJhbG...
```

**Important:** Copy these from your local `.env.local` file.

### 4. Deploy!

Click **"Deploy"** and wait ~2-3 minutes.

Your app will be live at: `https://residence-handbook-ai.vercel.app`

---

## Post-Deployment: Verify Everything Works

### 1. Check Database Connection

```bash
# The app should automatically connect to your Supabase instance
# Test by asking a question in the deployed app
```

### 2. Verify Data is Loaded

If you haven't run ingestion yet on your local machine, you need to:

**Option A: Run ingestion locally (pushes to Supabase)**

```bash
npm run ingest
```

**Option B: Run ingestion via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Run command on Vercel
vercel env pull .env.production
npm run ingest
```

### 3. Test the Live App

Visit your Vercel URL and ask:

- "What is the campus emergency number?"
- "How do I submit a maintenance request?"
- "Which residences require a meal plan?"

---

## Custom Domain (Optional)

### Free Option: Use Vercel Subdomain

- Default: `residence-handbook-ai.vercel.app`
- Custom: Change in Project Settings → Domains

### Paid Option: Use Your Own Domain

1. Buy a domain (e.g., from Namecheap, GoDaddy)
2. In Vercel: Project Settings → Domains → Add Domain
3. Follow DNS configuration instructions

---

## Monitoring & Analytics

### Built-in Vercel Analytics

- Go to your project dashboard
- Click "Analytics" tab
- See page views, performance metrics

### Custom Logging

Check logs in real-time:

1. Vercel Dashboard → Your Project → "Logs" tab
2. See API calls, errors, cache hits

---

## Updating Your App

Every time you push to GitHub, Vercel automatically redeploys:

```bash
# Make changes to your code
git add .
git commit -m "Updated system prompt"
git push

# Vercel automatically deploys in ~2 minutes
```

---

## Security Checklist

✅ **Environment Variables**: Never commit `.env.local` to GitHub  
✅ **Service Role Key**: Only used in API routes (server-side)  
✅ **Rate Limiting**: Already implemented (20 calls/min in production)  
✅ **HTTPS**: Automatically enabled by Vercel  
✅ **CORS**: Not needed (API routes are same-origin)

---

## Troubleshooting

### "Module not found" errors

- Make sure all dependencies are in `package.json` (not just `devDependencies`)
- Run `npm install` locally to verify

### API route returns 500 errors

- Check Vercel logs for detailed error messages
- Verify environment variables are set correctly
- Ensure Supabase RPC functions exist

### "Too many requests" error

- Adjust `MODEL_MAX_CALLS` in `src/app/api/ask/route.ts`
- Default: 20 calls/min in production

### Cache not working

- Verify `match_questions` RPC exists in Supabase
- Check that `qa_cache` table has data

---

## Alternative Deployment Options

### Option 2: Railway.app

- Similar to Vercel but with more infrastructure control
- Free tier available
- Good for apps that need background jobs

### Option 3: AWS Amplify

- Good if your organization uses AWS
- Auto-scaling, CDN included
- More complex setup

### Option 4: DigitalOcean App Platform

- $5/month minimum
- More control than Vercel
- Good for custom requirements

**Recommendation: Stick with Vercel for this prototype. It's the fastest and most reliable.**

---

## Cost Estimate

### Free Tier (Current Setup)

- **Vercel**: Free (100GB bandwidth, unlimited requests)
- **Supabase**: Free (500MB database, 2GB bandwidth)
- **OpenAI API**: ~$0.10 per 1000 questions (with caching)

### Expected Monthly Cost (100 users, 50 questions each)

- Vercel: $0 (within free tier)
- Supabase: $0 (within free tier)
- OpenAI: ~$50 (5,000 questions × $0.01)

**Total: ~$50/month** for moderate usage

---

## Scaling Considerations

### If usage grows beyond free tier:

**Vercel Pro** ($20/month)

- Unlimited bandwidth
- Better analytics
- Team collaboration

**Supabase Pro** ($25/month)

- 8GB database
- 50GB bandwidth
- Daily backups

**Optimize OpenAI costs:**

- Cache hit rate: Currently ~40% (saves $20/month already)
- Use gpt-5-nano when possible (cheaper than gpt-4o-mini)
- Implement user rate limiting per IP

---

## Next Steps After Deployment

1. ✅ Share the Vercel URL with your employer
2. ✅ Monitor usage in Vercel Analytics
3. ✅ Check Supabase logs for any issues
4. ✅ Gather feedback and iterate
5. ✅ Consider adding user authentication if needed

---

## Support

If you encounter issues:

- Check Vercel deployment logs
- Run `npm run diagnose` locally to test Supabase connection
- Verify all environment variables are set in Vercel dashboard
