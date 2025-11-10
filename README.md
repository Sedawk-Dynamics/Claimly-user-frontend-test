# Claimly User Frontend

React + TypeScript + Vite frontend application for Claimly - Insurance Policy Management Platform.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Authentication enabled

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory with the following variables:

```env
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

3. Start the development server:
```bash
npm run dev
```

The application will start on `http://localhost:5175` (or the port specified in vite.config.ts).

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
src/
├── components/          # Reusable components
│   └── Layout.tsx      # Main layout component
├── config/             # Configuration files
│   └── firebase.ts     # Firebase configuration
├── pages/              # Page components
│   ├── Login.tsx       # Login/Sign up page
│   ├── Homepage.tsx    # Active homepage
│   ├── Profile.tsx     # User profile page
│   ├── NomineesList.tsx # Nominees list page
│   ├── AddNominee.tsx  # Add nominee flow
│   ├── Policies.tsx    # Policies list page
│   ├── AddPolicy.tsx   # Add policy flow
│   ├── Subscription.tsx # Subscription page
│   ├── SubscriptionOffering.tsx # Subscription plans
│   ├── PaymentScreen.tsx # Payment screen
│   ├── PaymentSuccess.tsx # Payment success
│   └── KYC.tsx         # KYC completion page
├── services/           # API service layer
│   ├── api.ts          # Axios instance
│   ├── auth.service.ts # Authentication service
│   ├── user.service.ts # User service
│   ├── nominee.service.ts # Nominee service
│   ├── policy.service.ts # Policy service
│   └── subscription.service.ts # Subscription service
├── types/              # TypeScript types
│   └── index.ts        # Type definitions
├── App.tsx             # Main app component with routing
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## 🔄 User Workflow

1. **Login/Sign Up**: User logs in with phone number via Firebase OTP
2. **Subscription Check**: System checks if user has active subscription
   - If no subscription: Redirects to subscription offering
   - If subscription active: Shows active homepage
3. **Active Homepage**: Navigation hub with access to:
   - Banners
   - My Profile
   - Nominees List
   - My Subscription
   - My Policies
4. **Nominee Management**:
   - Step 1: Add nominee basic info
   - Step 2: Upload nominee documents
5. **Policy Management**:
   - Check KYC status (if not complete, redirect to KYC)
   - Step 1: Fill policy details
   - Step 2: Upload policy documents
   - Step 3: Select nominees and assign share percentages
6. **KYC Flow**:
   - Complete user KYC
   - Upload Aadhaar & PAN documents

## 🛠️ Technologies Used

- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Firebase** - Authentication (OTP)
- **TailwindCSS** - Styling
- **Lucide React** - Icons

## 🔒 Features

- Firebase OTP authentication
- Subscription management
- Policy management
- Nominee management
- Document upload
- KYC verification
- Responsive design

## 📄 License

ISC

