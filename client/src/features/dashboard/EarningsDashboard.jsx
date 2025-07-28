import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Import the new components
import StatCard from './StatCard';
import EarningsChart from './EarningsChart';

// We can define simple loading/error components right here or import them
const LoadingSpinner = () => <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
const ErrorMessage = ({ message }) => <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>Error: {message}</div>;

const EarningsDashboard = () => {
    const { user } = useAuth();
    const [earningsData, setEarningsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('monthly');

    useEffect(() => {
        if (!user?.id) {
            setIsLoading(false);
            return;
        }

        const fetchEarnings = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/cooks/${user.id}/earnings?period=${period}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch earnings data.');
                }
                const data = await response.json();
                setEarningsData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEarnings();
    }, [user, period]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    // This JSX replaces the static "Order Revenue Breakdown" content
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Earnings Dashboard</h1>
            
            <div style={styles.periodSelector}>
                <button onClick={() => setPeriod('weekly')} style={period === 'weekly' ? styles.activeButton : styles.button}>Weekly</button>
                <button onClick={() => setPeriod('monthly')} style={period === 'monthly' ? styles.activeButton : styles.button}>Monthly</button>
                <button onClick={() => setPeriod('yearly')} style={period === 'yearly' ? styles.activeButton : styles.button}>Yearly</button>
            </div>

            {earningsData ? (
                <>
                    <div style={styles.statsGrid}>
                        <StatCard title={`Total Earnings (${earningsData.period})`} value={`$${earningsData.totalEarnings.toFixed(2)}`} />
                        <StatCard title={`Completed Orders (${earningsData.period})`} value={earningsData.orderCount} />
                    </div>
                    <div className="chart-container">
                        <EarningsChart data={earningsData.chartData} />
                    </div>
                </>
            ) : (
                <div>No earnings data available for this period.</div>
            )}
        </div>
    );
};

// Basic styling to make it look decent
const styles = {
    container: { fontFamily: 'sans-serif', padding: '20px' },
    header: { textAlign: 'center', marginBottom: '20px' },
    periodSelector: { display: 'flex', justifyContent: 'center', marginBottom: '20px' },
    button: { padding: '10px 20px', margin: '0 5px', border: '1px solid #ccc', borderRadius: '5px', background: '#f0f0f0', cursor: 'pointer' },
    activeButton: { padding: '10px 20px', margin: '0 5px', border: '1px solid #4a90e2', borderRadius: '5px', background: '#4a90e2', color: 'white', cursor: 'pointer' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }
};

export default EarningsDashboard;
