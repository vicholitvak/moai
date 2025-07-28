import React from 'react';

/**
 * A simple card to display a single statistic.
 * @param {{ title: string, value: string | number }} props
 */
const StatCard = ({ title, value }) => {
    return (
        <div style={styles.card}>
            <h4 style={styles.title}>{title}</h4>
            <p style={styles.value}>{value}</p>
        </div>
    );
};

const styles = {
    card: {
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    title: {
        margin: '0 0 10px 0',
        fontSize: '14px',
        color: '#666',
    },
    value: {
        margin: 0,
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
    }
};

export default StatCard;