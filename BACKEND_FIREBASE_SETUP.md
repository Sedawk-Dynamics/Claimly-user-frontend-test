# Backend Firebase Admin SDK Setup

The backend uses **Firebase Admin SDK** (server-side), which requires **Service Account credentials**, not the web app configuration.

## What's Different?

- **Frontend**: Uses Firebase Web SDK with API key (already configured ✅)
- **Backend**: Uses Firebase Admin SDK with Service Account credentials (needs setup)

## Steps to Set Up Backend Firebase

### 1. Get Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **claimly-f3c25**
3. Click the gear icon ⚙️ → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** in the dialog
7. A JSON file will be downloaded (e.g., `claimly-f3c25-firebase-adminsdk-xxxxx.json`)

### 2. Update Backend .env File

In `claimly-backend/.env`, add/update these variables:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=claimly-f3c25
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@claimly-f3c25.iam.gserviceaccount.com
```

### 3. Extract Values from Service Account JSON

Open the downloaded JSON file and extract:

- **project_id** → `FIREBASE_PROJECT_ID`
- **private_key** → `FIREBASE_PRIVATE_KEY` (keep the `-----BEGIN/END PRIVATE KEY-----` markers)
- **client_email** → `FIREBASE_CLIENT_EMAIL`

**Important Notes:**
- The private key in the JSON has `\n` characters that need to be preserved
- When adding to `.env`, use quotes and keep the `\n` characters
- The private key should look like:
  ```
  "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
  ```

### 4. Example .env Entry

```env
FIREBASE_PROJECT_ID=claimly-f3c25
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1234567890abcdefghijklmnopqrstuvwxyz\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@claimly-f3c25.iam.gserviceaccount.com
```

### 5. Verify Backend Firebase Setup

The backend code in `claimly-backend/src/config/firebase.ts` already handles:
- Reading environment variables
- Formatting the private key correctly
- Initializing Firebase Admin SDK

After updating `.env`, restart your backend server.

### 6. Test Backend Firebase Connection

The backend should log:
```
Firebase Admin initialized successfully
```

If you see warnings, check:
- All three environment variables are set
- Private key format is correct (with `\n` characters)
- Service account JSON file was downloaded correctly

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit** the service account JSON file or `.env` file to git
2. The `.env` file should be in `.gitignore` (already configured)
3. For production, use environment variables or a secrets manager
4. Restrict service account permissions in Google Cloud Console if needed

## Troubleshooting

### Error: "Firebase Admin not initialized"

- Check that all three environment variables are set in `.env`
- Verify the private key includes `\n` characters
- Ensure the private key has `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers

### Error: "Invalid credentials"

- Verify the service account JSON was downloaded from the correct Firebase project
- Check that `FIREBASE_PROJECT_ID` matches `claimly-f3c25`
- Ensure the private key is not corrupted (check for missing characters)

### Error: "Permission denied"

- Service account might need additional permissions
- Check IAM roles in Google Cloud Console
- Ensure the service account has "Firebase Admin" role

## What the Backend Uses Firebase For

The backend uses Firebase Admin SDK to:
1. **Verify ID tokens** sent from the frontend after phone authentication
2. **Validate user authentication** in `/auth/verify-otp` endpoint
3. **Create/get Firebase users** if needed

## Summary

✅ **Frontend**: Already configured with web app credentials  
⏳ **Backend**: Needs service account credentials in `.env` file

After setting up the backend Firebase credentials, both frontend and backend will be able to communicate securely for user authentication.

