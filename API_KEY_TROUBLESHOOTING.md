# Firebase API Key Error Troubleshooting

If you're seeing the error: `auth/api-key-not-valid.-please-pass-a-valid-api-key`, follow these steps:

## Step 1: Verify API Key in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **claimly-f3c25**
3. Click the gear icon ⚙️ → **Project settings**
4. Scroll down to **Your apps** section
5. Click on your web app (or create one if it doesn't exist)
6. Copy the **API Key** from the `firebaseConfig` object
7. Compare it with the one in your `.env` file or code

## Step 2: Check API Key Restrictions

The API key might be restricted to specific domains. Here's how to fix it:

### Option A: Remove Restrictions (Development Only)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **claimly-f3c25**
3. Navigate to **APIs & Services** → **Credentials**
4. Find your API key (starts with `AIzaSy...`)
5. Click on the API key to edit it
6. Under **Application restrictions**:
   - For development: Select **None** (not recommended for production)
   - OR Select **HTTP referrers** and add:
     - `localhost:*`
     - `127.0.0.1:*`
     - Your production domain (e.g., `https://yourdomain.com/*`)
7. Under **API restrictions**:
   - Make sure **Firebase Authentication API** is enabled
   - OR select **Don't restrict key** (for development)
8. Click **Save**

### Option B: Create a New Unrestricted API Key (Development)

1. In Google Cloud Console → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the new API key
4. Update your `.env` file:
   ```env
   VITE_FIREBASE_API_KEY=your-new-api-key-here
   ```
5. Restart your development server

## Step 3: Verify Firebase Configuration

Make sure all values match exactly:

1. **API Key**: Should start with `AIzaSy`
2. **Project ID**: `claimly-f3c25`
3. **Auth Domain**: `claimly-f3c25.firebaseapp.com`

Check in Firebase Console → Project Settings → Your apps → Web app config

## Step 4: Check Environment Variables

1. Ensure you have a `.env` file in `user-frontend/` directory
2. Verify the file contains:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyCDlvhiaQfcjOjj-gomxvcjPmet5Uzn53s
   VITE_FIREBASE_AUTH_DOMAIN=claimly-f3c25.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=claimly-f3c25
   VITE_FIREBASE_STORAGE_BUCKET=claimly-f3c25.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=39178158773
   VITE_FIREBASE_APP_ID=1:39178158773:web:ac2d34fe6d16278e9b74fc
   ```
3. Restart your dev server after changing `.env` file:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

## Step 5: Verify Phone Authentication is Enabled

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Click on **Phone**
3. Ensure it's **Enabled**
4. If not, toggle it ON and click **Save**

## Step 6: Check Browser Console

Open browser DevTools (F12) and check:
1. **Console tab**: Look for Firebase initialization messages
2. **Network tab**: Check if Firebase API calls are being made
3. Look for any CORS errors or blocked requests

## Step 7: Test with a Simple Configuration

Try initializing Firebase with just the API key to test:

```javascript
// Temporary test in browser console
const testConfig = {
  apiKey: "AIzaSyCDlvhiaQfcjOjj-gomxvcjPmet5Uzn53s",
  authDomain: "claimly-f3c25.firebaseapp.com",
  projectId: "claimly-f3c25",
};
```

## Common Issues and Solutions

### Issue 1: API Key Restricted to Wrong Domain
**Solution**: Add `localhost:*` and `127.0.0.1:*` to HTTP referrers in Google Cloud Console

### Issue 2: API Key Doesn't Match Project
**Solution**: Verify the API key belongs to the correct Firebase project (`claimly-f3c25`)

### Issue 3: Environment Variables Not Loading
**Solution**: 
- Restart dev server after changing `.env`
- Verify variable names start with `VITE_`
- Check for typos in variable names

### Issue 4: API Key Revoked or Deleted
**Solution**: Create a new API key in Firebase Console and update your `.env` file

### Issue 5: Firebase Project Not Active
**Solution**: Check if Firebase project is active and billing is set up (if required)

## Quick Fix Checklist

- [ ] API key is correct in Firebase Console
- [ ] API key restrictions allow `localhost:*`
- [ ] `.env` file exists and has correct values
- [ ] Dev server restarted after `.env` changes
- [ ] Phone Authentication is enabled in Firebase Console
- [ ] All Firebase config values match Firebase Console
- [ ] No typos in environment variable names
- [ ] Browser cache cleared (Ctrl+Shift+R)

## Still Having Issues?

1. **Double-check the API key**: Copy it directly from Firebase Console
2. **Try a new API key**: Create a new one without restrictions for testing
3. **Check Firebase Status**: Visit [Firebase Status Page](https://status.firebase.google.com/)
4. **Review Firebase Logs**: Check Firebase Console → Logs for errors
5. **Test in Incognito Mode**: Rule out browser extension issues

## Security Note

⚠️ **For Production:**
- Always use API key restrictions
- Restrict to your production domain only
- Never commit API keys to version control
- Use environment variables, not hardcoded values

