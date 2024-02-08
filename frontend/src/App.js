import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BooksList from './components/BooksList';
import BookDetails from './components/BookDetails';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import UserProfile from './components/UserProfile';
import BorrowDetails from './components/BorrowDetails';
import InvoiceGenerator from './components/InvoiceGenerator';
import { useAuth } from './context/AuthContext'; 
import { Routes, Route, useLocation } from 'react-router-dom';

function App() {
  const { currentUser } = useAuth(); 
  const [loginOpen, setLoginOpen] = useState(false); 
  const [registerOpen, setRegisterOpen] = useState(false); 
  const location = useLocation();

  useEffect(() => {
    const handleStorageChange = () => {
      currentUser();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser]);

  const shouldHideNavbar = () => {
    return location.pathname.startsWith('/invoice');
  };

  return (
    <div>
      {!shouldHideNavbar() && <Navbar setLoginOpen={setLoginOpen} setRegisterOpen={setRegisterOpen} />}
      <Routes>
        <Route path="/" element={<BooksList />} />
        <Route path="/user" element={<UserProfile />} />
        <Route path="/books/:id" element={<BookDetails setLoginOpen={setLoginOpen} />} />
        <Route path="/borrows/:borrowId" element={<BorrowDetails />} />
        <Route path="/invoice/:borrowId" element={<InvoiceGenerator />} />
      </Routes>
      <LoginForm open={loginOpen} handleClose={() => setLoginOpen(false)} />
      <RegisterForm open={registerOpen} handleClose={() => setRegisterOpen(false)} />
    </div>
  );
}

export default App;
