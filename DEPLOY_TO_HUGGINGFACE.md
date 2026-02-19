# 🚀 Deploy to Hugging Face

## Your Hugging Face Space
- Node.js API: `https://epscord-password-manager-api.hf.space`
- DeepFace API: `https://epscord-password-manager-deepface.hf.space`

## Quick Commands (Node.js API)

### Option A: Manual Upload (Easiest) ⭐
1. Go to: https://huggingface.co/spaces/epscord/password-manager-api
2. Click **Files and versions** → `server/routes/auth.js`
3. Click **Edit** button
4. Replace entire file with your local version
5. Commit changes → **Space auto-rebuilds!** ✅

### Option B: Git Push
```powershell
# Add Hugging Face as a remote
git remote add huggingface https://huggingface.co/spaces/epscord/password-manager-api

# Push changes
git push huggingface main
```

### If you get "remote already exists" error:
```powershell
# Remove old remote
git remote remove huggingface

# Add new remote
git remote add huggingface https://huggingface.co/spaces/epscord/password-manager-api

# Push
git push huggingface main
```

## What Gets Deployed

The updated `server/routes/auth.js` with:
- ✅ Dual API location detection (ipapi.co + ip-api.com fallback)
- ✅ Localhost IP handling
- ✅ Better error logging
- ✅ 5-second timeout on API calls
- ✅ IP cleanup for proxy headers

## Verify After Deployment

1. Check Hugging Face Space logs
2. Look for these new log messages:
   - `🔍 Looking up location for IP: ...`
   - `📍 Location detected (ipapi.co): Chennai, Tamil Nadu`
   - `📡 IP API Response: ...`

3. Test login - email alert should show:
   - ✅ **Location: Chennai, Tamil Nadu** (instead of Unknown)

## Rollback (if needed)

```powershell
# Revert to previous version
git revert HEAD
git push huggingface main
```
