import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Dashboard from './pages/Dashboard'; // ← ADD

// Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CharityList from './pages/CharityList';
import DonationForm from './pages/DonationForm';
import Receipt from './pages/Receipt';
import Register from './pages/Register';
import Login from './pages/Login';
import DonationsList from './pages/DonationsList';
import Profile from './pages/Profile';
import ContactUs from './pages/ContactUs';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/charities" element={<CharityList />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/donations" element={<DonationsList />} />
            <Route path="/donate/:charityId" element={<DonationForm />} />
            <Route path="/receipt/:donationId" element={<Receipt />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/admin" element={<Admin />} />
	    	<Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
