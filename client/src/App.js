import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Chat from "./components/Chat";
import "./App.css";
import Navbar from "./components/Navbar";
import Profile from "./components/Profile";
import PendingPage from "./components/PendingPage";
function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  return (
    <Router>
      <Navbar token={token} setToken={setToken} />

      <div className="app-container">
        <Routes>
          <Route path="/register" element={<Register setToken={setToken} />} />
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route
            path="/"
            element={
              token ? (
                <Dashboard token={token} setToken={setToken} />
              ) : (
                <Login setToken={setToken} />
              )
            }
          />
          <Route path="/pending" element={<PendingPage />} />

          <Route
            path="/chat/private/:userId"
            element={<Chat token={token} />}
          />
          <Route path="/chat/group/:groupId" element={<Chat token={token} />} />
            <Route path="/profile" element={<Profile token={token}/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
