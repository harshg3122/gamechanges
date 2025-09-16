import React from "react";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const isAgent = user?.role === "agent";
  const name = user?.fullName || user?.name || user?.username || "User";

  return (
    <div>
      <h2>{isAgent ? `Welcome, ${name}` : "Welcome to the Admin Dashboard"}</h2>
      {isAgent && (
        <div className="mt-4">
          <p className="text-muted">
            Agent Dashboard - Manage your users and view results
          </p>
          <div className="row mt-3">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Your Users</h5>
                  <p className="card-text">
                    Manage users under your referral code
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Results</h5>
                  <p className="card-text">View game results and outcomes</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Referral Code</h5>
                  <p className="card-text">
                    Your code: <strong>{user?.referralCode}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
