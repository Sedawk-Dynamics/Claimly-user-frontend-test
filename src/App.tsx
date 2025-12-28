import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ApiResponseProvider } from './contexts/ApiResponseContext';
import ErrorBoundary from './components/ErrorBoundary';
import { authService } from './services/auth.service';
import Login from './pages/Login';
import Layout from './components/Layout';
import Homepage from './pages/Homepage';
import SubscriptionOffering from './pages/SubscriptionOffering';
import PaymentScreen from './pages/PaymentScreen';
import PaymentSuccess from './pages/PaymentSuccess';
import Profile from './pages/Profile';
import NomineesList from './pages/NomineesList';
import AddNominee from './pages/AddNominee';
import EditNominee from './pages/EditNominee';
import Subscription from './pages/Subscription';
import Policies from './pages/Policies';
import AddPolicy from './pages/AddPolicy';
import EditPolicy from './pages/EditPolicy';
import KYC from './pages/KYC';
import Notifications from './pages/Notifications';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return authService.isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ApiResponseProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Homepage />} />
                <Route path="subscription-offering" element={<SubscriptionOffering />} />
                <Route path="payment" element={<PaymentScreen />} />
                <Route path="payment-success" element={<PaymentSuccess />} />
                <Route path="profile" element={<Profile />} />
                <Route path="nominees" element={<NomineesList />} />
                <Route path="nominees/add" element={<AddNominee />} />
                <Route path="nominees/:id/edit" element={<EditNominee />} />
                <Route path="subscription" element={<Subscription />} />
                <Route path="policies" element={<Policies />} />
                <Route path="policies/add" element={<AddPolicy />} />
                <Route path="policies/:id/edit" element={<EditPolicy />} />
                <Route path="kyc" element={<KYC />} />
                <Route path="notifications" element={<Notifications />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ApiResponseProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

