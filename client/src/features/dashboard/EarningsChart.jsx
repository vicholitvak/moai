import React from 'react';

/**
 * A simple bar chart to display daily earnings.
 * @param {{ data: { date: string, dailyEarnings: number }[] }} props
 */
const EarningsChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div style={styles.container}><p>No chart data for this period.</p></div>;
    }

    const maxValue = Math.max(...data.map(d => d.dailyEarnings));
    const chartHeight = 250;

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>Daily Earnings</h3>
            <div style={styles.chartArea}>
                {data.map((item, index) => {
                    const barHeight = maxValue > 0 ? (item.dailyEarnings / maxValue) * chartHeight : 0;
                    return (
                        <div key={index} style={styles.barWrapper} title={`Date: ${item.date}\nEarnings: $${item.dailyEarnings.toFixed(2)}`}>
                            <div style={{ ...styles.bar, height: `${barHeight}px` }}></div>
                            <div style={styles.label}>{new Date(item.date).getDate()}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        border: '1px solid #eee',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        marginTop: '20px',
    },
    title: { margin: '0 0 20px 0', textAlign: 'center' },
    chartArea: {
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: '250px',
        borderLeft: '1px solid #ccc',
        borderBottom: '1px solid #ccc',
        padding: '10px 0 0 10px',
    },
    barWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
    },
    bar: { width: '50%', backgroundColor: '#4a90e2', transition: 'height 0.3s ease-in-out' },
    label: { marginTop: '5px', fontSize: '12px', color: '#555' }
};

export default EarningsChart;