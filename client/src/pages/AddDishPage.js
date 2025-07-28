import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AddDishPage = () => {
    const [dish, setDish] = useState({
        name: '',
        description: '',
        price: '',
        prepTimeMinutes: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { token } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDish(prevDish => ({ ...prevDish, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/dishes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...dish,
                    price: parseFloat(dish.price),
                    prepTimeMinutes: parseInt(dish.prepTimeMinutes, 10),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add dish.');
            }

            setSuccess('Dish added successfully! Redirecting...');
            setTimeout(() => navigate('/cooks/orders'), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h2>Add a New Dish</h2>
            <form onSubmit={handleSubmit}>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}
                <div><label>Dish Name: <input type="text" name="name" value={dish.name} onChange={handleChange} required /></label></div>
                <div><label>Description: <textarea name="description" value={dish.description} onChange={handleChange} required /></label></div>
                <div><label>Price ($): <input type="number" name="price" value={dish.price} onChange={handleChange} required min="0" step="0.01" /></label></div>
                <div><label>Prep Time (minutes): <input type="number" name="prepTimeMinutes" value={dish.prepTimeMinutes} onChange={handleChange} required min="1" /></label></div>
                <button type="submit">Add Dish</button>
            </form>
        </div>
    );
};

export default AddDishPage;