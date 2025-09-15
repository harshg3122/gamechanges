import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";
import Login from "./components/auth/Login";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import AdminManagement from "./pages/AdminManagement";
import GameManagement from "./pages/GameManagement";
import WithdrawalRequests from "./pages/WithdrawalRequests";
import TransactionHistory from "./pages/TransactionHistory";
import QRCodeManagement from "./pages/QRCodeManagement";
import Results from "./pages/Results";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/agents" element={<AdminManagement />} />
                {/* <Route path="/games" element={<GameManagement />} /> */}
                <Route path="/results" element={<Results />} />
                <Route path="/withdrawals" element={<WithdrawalRequests />} />
                <Route path="/transactions" element={<TransactionHistory />} />
                <Route path="/qr-codes" element={<QRCodeManagement />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
