import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MainLayout = () => {
    const { user } = useAuth();

    // A basic layout structure
    const layoutStyle = {
        display: 'flex',
    };

    const contentStyle = {
        flexGrow: 1,
        padding: '20px',
    };

    return (
        <div style={layoutStyle}>
            <nav>
                {user?.role === 'cooker' ? (
                    <>
                        <h3>Cook Menu</h3>
                        <ul>
                            {/* These paths are now guaranteed to be correct */}
                            <li><Link to="/cooks/orders">My Orders</Link></li>
                            <li><Link to="/cooks/earnings">My Earnings</Link></li>
                            <li><Link to="/cooks/dishes/add">Add New Dish</Link></li>
                            <li><Link to="/user/profile">Profile</Link></li>
                        </ul>
                    </>
                ) : (
                    <>
                        <h3>Customer Menu</h3>
                        <ul>
                            <li><Link to="/customer/dashboard">Dashboard</Link></li>
                            <li><Link to="/user/profile">Profile</Link></li>
                        </ul>
                    </>
                )}
            </nav>
            <main style={contentStyle}>
                <Outlet /> {/* This will render the matched route component */}
            </main>
        </div>
    );
};

export default MainLayout;