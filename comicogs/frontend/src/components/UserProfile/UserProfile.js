
import React, { useState, useEffect } from 'react';
import UserProfileManager from './UserProfileManager';
import './UserProfile.css';

const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        bio: ''
    });

    useEffect(() => {
        const fetchUser = async () => {
            const userData = await UserProfileManager.getUser();
            setUser(userData);
            setFormData({
                username: userData.username,
                email: userData.email,
                bio: userData.bio || ''
            });
        };
        fetchUser();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const updatedUser = await UserProfileManager.updateUser(formData);
        setUser(updatedUser);
        setIsEditing(false);
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="user-profile">
            <h2>User Profile</h2>
            {isEditing ? (
                <form onSubmit={handleFormSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="bio">Bio</label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                        ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary">Save</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                </form>
            ) : (
                <div>
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Bio:</strong> {user.bio}</p>
                    <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit</button>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
