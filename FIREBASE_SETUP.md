# Firebase Authentication Setup Guide

This guide explains how to set up Firebase Authentication for phone number (OTP) login in the Claimly user frontend.

## Prerequisites

1. A Firebase account (sign up at https://firebase.google.com/)
2. A Firebase project created
3. Node.js installed (v18 or higher)

## Step-by-Step Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter project name (e.g., "Claimly")
   - Enable/disable Google Analytics (optional)
   - Click "Create project"

### 2. Enable Phone Number Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Phone** in the providers list
3. Toggle **Enable** to ON
4. Click **Save**

**Important Notes:**
- For **production**, you'll need to verify your app's domain in Firebase Console
- For **testing**, Firebase allows phone numbers to be added to test phone numbers list
- Phone authentication requires reCAPTCHA verification (handled automatically by Firebase)

### 3. Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to **Your apps** section
4. Click on the web icon `</>` to add a web app (if not already added)
5. Register your app:
   - Enter app nickname (e.g., "Claimly User Frontend")
   - Optional: Check "Also set up Firebase Hosting"
   - Click **Register app**
6. Copy the Firebase configuration object (you'll see `firebaseConfig`)

### 4. Set Up Environment Variables

Create a `.env` file in the `user-frontend` directory:

```env
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
```

**Replace the values with your actual Firebase configuration values.**

### 5. Configure Authorized Domains

1. In Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Add your domains:
   - `localhost` (already included for development)
   - Your production domain (e.g., `claimly.com`)
   - Any staging domains

### 6. Set Up reCAPTCHA (Automatic)

Firebase automatically handles reCAPTCHA for phone authentication. The app uses invisible reCAPTCHA, which requires:

- A valid domain in authorized domains
- The reCAPTCHA container div in your HTML (already included in `Login.tsx`)

### 7. Testing Phone Authentication

#### Option A: Test Phone Numbers (Recommended for Development)

1. In Firebase Console → **Authentication** → **Sign-in method** → **Phone**
2. Scroll to **Phone numbers for testing**
3. Click **Add phone number**
4. Add test numbers with test OTP codes:
   - Phone: `+1234567890`
   - Code: `123456`

You can use these test numbers without receiving actual SMS.

#### Option B: Real Phone Numbers

For real phone numbers:
- Firebase will send actual SMS with OTP
- May incur costs (Firebase provides free tier)
- Requires phone number verification

### 8. Backend Integration

The frontend sends the Firebase ID token to your backend for verification. Ensure your backend:

1. Has Firebase Admin SDK configured (already set up in `claimly-backend`)
2. Verifies the ID token in `/auth/verify-otp` endpoint
3. Returns a JWT token for your application

## Required Firebase Services

### Authentication Service
- **Phone Number** provider must be enabled
- **Anonymous** provider (optional, not used in this app)

### Other Services (Not Required for Auth, but may be needed)
- **Firestore** (optional, not used for auth)
- **Storage** (optional, not used for auth)
- **Cloud Functions** (optional, not used for auth)

## Security Rules & Best Practices

### 1. API Key Restrictions (Production)
- In Google Cloud Console, restrict your API key to specific domains
- Go to **APIs & Services** → **Credentials**
- Edit your API key and add HTTP referrer restrictions

### 2. Authorized Domains
- Only add domains you control
- Remove unused domains
- Use separate Firebase projects for dev/staging/production

### 3. Rate Limiting
- Firebase has built-in rate limiting for phone auth
- Monitor usage in Firebase Console
- Set up alerts for unusual activity

## Troubleshooting

### Common Issues

1. **"reCAPTCHA container not found"**
   - Ensure `<div id="recaptcha-container"></div>` exists in your HTML
   - Check that the div is rendered before calling `setupRecaptcha()`

2. **"Phone number format invalid"**
   - Phone numbers must include country code (e.g., `+919876543210`)
   - The app automatically adds `+91` if not present

3. **"Quota exceeded"**
   - Check Firebase Console → Usage and Billing
   - Free tier: 10 verifications per day for phone auth
   - Upgrade to Blaze plan for higher limits

4. **"Invalid app credential"**
   - Verify all environment variables are set correctly
   - Check that Firebase config matches your project

5. **SMS not received**
   - Check phone number format
   - Verify the number is not blocked
   - Use test phone numbers for development

### Debug Mode

Enable debug logging in your browser console:
```javascript
// Add to firebase.ts temporarily
import { getAuth, setLogLevel } from 'firebase/auth';
setLogLevel('debug');
```

## Cost Considerations

### Free Tier (Spark Plan)
- 10 phone verifications per day
- Sufficient for development and testing

### Paid Tier (Blaze Plan)
- Pay as you go: ~$0.06 per verification
- First 50 verifications/day are free
- Required for production

## Production Checklist

- [ ] Enable Phone Authentication in Firebase Console
- [ ] Add production domain to authorized domains
- [ ] Set up API key restrictions
- [ ] Configure environment variables in production
- [ ] Test phone authentication flow
- [ ] Set up monitoring and alerts
- [ ] Review Firebase security rules
- [ ] Set up billing (Blaze plan) if needed

## Additional Resources

- [Firebase Phone Auth Documentation](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [reCAPTCHA Configuration](https://firebase.google.com/docs/auth/web/phone-auth#reCAPTCHA)

## Support

If you encounter issues:
1. Check Firebase Console for error logs
2. Review browser console for client-side errors
3. Verify backend logs for authentication errors
4. Check Firebase status page for service outages

