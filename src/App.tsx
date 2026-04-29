import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DataEntry from "./pages/DataEntry";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import PaymentPending from "./pages/PaymentPending";
import Checkout from "./pages/Checkout";
import Demo from "./pages/Demo";
import Conta from "./pages/Conta";
import NotFound from "./pages/NotFound";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!profile?.has_access) return <Navigate to="/checkout" replace />;
  return <>{children}</>;
}

function Spinner() {
  return (
    <div
      className="w-8 h-8 rounded-full animate-spin"
      style={{ border: "2px solid var(--border)", borderTopColor: "var(--gold)" }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failure" element={<PaymentFailure />} />
        <Route path="/payment-pending" element={<PaymentPending />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/dados"
          element={<ProtectedRoute><DataEntry /></ProtectedRoute>}
        />
        <Route path="/demo" element={<Demo />} />
        <Route
          path="/conta"
          element={<ProtectedRoute><Conta /></ProtectedRoute>}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
