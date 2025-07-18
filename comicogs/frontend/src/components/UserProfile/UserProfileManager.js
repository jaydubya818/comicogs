
const UserProfileManager = {
    getUser: async () => {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    },

    updateUser: async (userData) => {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        return response.json();
    }
};

export default UserProfileManager;
