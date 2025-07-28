import React from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming useAuth is exported from your context

// A component to display and manage customer payment methods
const PaymentMethods = () => (
    <div>
        <h3>My Payment Methods</h3>
        {/* UI for adding/viewing credit cards, etc. */}
        <p>Visa ending in 1234</p>
        <button>Add New Card</button>
    </div>
);

// A component to display and manage cook banking information
const BankingAccount = () => (
    <div>
        <h3>Banking Account</h3>
        {/* UI for managing bank account details for payouts */}
        <p>Bank of Moai, Account ending in 5678</p>
        <button>Update Account</button>
    </div>
);

const ProfilePage = () => {
    const { user } = useAuth();

    // Render a loading state or nothing if user data isn't available yet
    if (!user) {
        return <div>Loading profile...</div>;
    }

    return (
        <div>
            <h2>User Profile</h2>
            <p><strong>Email:</strong> {user.email}</p>
            {/* Other common profile details can go here */}

            <hr />

            {/* Conditionally render the correct section based on the user's role. */}
            {user.role === 'cooker' ? <BankingAccount /> : <PaymentMethods />}
        </div>
    );
};

export default ProfilePage;