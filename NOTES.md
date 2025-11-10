# Important Notes

## Backend API Requirements

### Companies Endpoint
The frontend expects a public endpoint to fetch insurance companies. Currently, the `companyService.getCompanies()` function tries to call `/companies`, but this endpoint might not exist in the backend yet.

**Solution Options:**
1. Create a public companies endpoint in the backend (recommended):
   - Route: `GET /companies` (no auth required, or with user auth)
   - Returns list of active insurance companies

2. Or update the frontend to use the admin companies endpoint (if accessible):
   - Update `user-frontend/src/services/policy.service.ts`
   - Change the endpoint to `/admin/companies` (requires admin auth, not recommended for users)

### Firebase Configuration
Make sure to set up Firebase Authentication with Phone Number provider enabled. The frontend uses Firebase for OTP-based authentication.

### Environment Variables
Create a `.env` file in the `user-frontend` directory with your Firebase configuration. See `.env.example` for reference.

## Workflow Implementation

The frontend follows the workflow diagram:
1. Login/Sign Up → Check Subscription → Homepage or Subscription Offering
2. Active Homepage → Navigation to various sections
3. Nominee Flow: List → Add (Step 1: Basic Info, Step 2: Upload Docs)
4. Policy Flow: List → Add (Step 1: Details, Step 2: Documents, Step 3: Nominees)
5. KYC Flow: Check KYC → Complete KYC → Upload Aadhaar & PAN

## Payment Integration

Currently, the payment screen is a mock implementation. In production, integrate with a payment gateway like:
- Razorpay
- Stripe
- PayU
- Other payment providers

Update `user-frontend/src/pages/PaymentScreen.tsx` to integrate with your chosen payment gateway.

