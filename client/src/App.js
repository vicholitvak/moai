import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage'; // Assuming you have this component
import ProfilePage from './pages/ProfilePage'; // Import the ProfilePage
import CookDashboard from './features/dashboard/EarningsDashboard';
import CustomerDashboard from './pages/CustomerDashboard'; // Assuming you have this component
import CookOrdersPage from './pages/CookOrdersPage'; // Assuming you have this component
import AddDishPage from './pages/AddDishPage'; // Import the new page
import OrderStatusPage from './pages/OrderStatusPage'; // Import the new OrderStatusPage
import MainLayout from './components/layout/MainLayout'; // 1. Import the new layout

import ProtectedRoute from './components/routing/ProtectedRoute';
import PublicRoute from './components/routing/PublicRoute';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public routes like login/signup should redirect if the user is already logged in */}
                    <Route path="/" element={
                        <PublicRoute><LoginPage /></PublicRoute>
                    } />
                    <Route path="/signup" element={
                        <PublicRoute><SignupPage /></PublicRoute>
                    } />

                    {/* 2. Wrap all protected routes in the MainLayout */}
                    <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                        {/* Cooker-specific routes */}
                        <Route path="/cooks/dishes/add" element={<AddDishPage />} />
                        <Route path="/cooks/orders" element={<CookOrdersPage />} />
                        <Route path="/cooks/earnings" element={<CookDashboard />} />
                        
                        {/* Customer-specific routes */}
                        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                        <Route path="/order/status/:orderId" element={<OrderStatusPage />} />
                        
                        {/* Shared routes */}
                        <Route path="/user/profile" element={<ProfilePage />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
