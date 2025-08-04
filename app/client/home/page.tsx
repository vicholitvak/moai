
'use client';

import { useAuth } from '../../../context/AuthContext';

const ClientHome = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold">Client Home</h1>
      <p>Welcome, {user?.email}</p>
    </div>
  );
};

export default ClientHome;
