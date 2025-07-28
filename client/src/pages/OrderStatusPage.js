import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase-config'; // Ensure this path is correct
import DriverTrackingMap from '../components/tracking/DriverTrackingMap';

const OrderStatusPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!orderId) return;

        const orderRef = doc(db, 'orders', orderId);
        const unsubscribe = onSnapshot(orderRef, (docSnap) => {
            if (docSnap.exists()) {
                setOrder({ id: docSnap.id, ...docSnap.data() });
                setError('');
            } else {
                setError('Order not found.');
                setOrder(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching order:", err);
            setError('Failed to fetch order details.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orderId]);

    if (loading) {
        return <div>Loading order status...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!order) {
        return <div>Order not found.</div>;
    }

    // Only show the map when the order is out for delivery and has a driver assigned.
    const showMap = order.status === 'Out for Delivery' && order.driverId;

    return (
        <div>
            <h1>Order Status for #{order.id.substring(0, 6)}</h1>
            <p><strong>Status:</strong> {order.status}</p>

            <hr />

            {showMap ? (
                <DriverTrackingMap driverId={order.driverId} />
            ) : (
                <p>Live tracking will be available once your order is out for delivery.</p>
            )}
        </div>
    );
};

export default OrderStatusPage;