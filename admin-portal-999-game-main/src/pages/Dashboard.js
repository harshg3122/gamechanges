import React from "react";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const isAgent = user?.role === "agent";
  const name = user?.name || user?.username || "User";

  return (
    <div>
      <h2>{isAgent ? `Welcome, ${name}` : "Welcome to the Admin Dashboard"}</h2>
    </div>
  );
};

export default Dashboard;
