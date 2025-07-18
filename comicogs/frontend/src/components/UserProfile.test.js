
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfile from './UserProfile/UserProfile';
import UserProfileManager from './UserProfile/UserProfileManager';

// Mock the UserProfileManager
jest.mock('./UserProfile/UserProfileManager', () => ({
    getUser: jest.fn(),
    updateUser: jest.fn(),
}));

describe('UserProfile', () => {
    beforeEach(() => {
        UserProfileManager.getUser.mockResolvedValue({
            username: 'testuser',
            email: 'test@example.com',
            bio: 'A test bio',
        });
    });

    test('renders user profile data', async () => {
        render(<UserProfile />);

        await waitFor(() => {
            expect(screen.getByText('testuser')).toBeInTheDocument();
            expect(screen.getByText('test@example.com')).toBeInTheDocument();
            expect(screen.getByText('A test bio')).toBeInTheDocument();
        });
    });

    test('allows editing and saving the profile', async () => {
        render(<UserProfile />);

        // Wait for initial data to load
        await waitFor(() => expect(screen.getByText('testuser')).toBeInTheDocument());

        // Click the edit button
        fireEvent.click(screen.getByText('Edit'));

        // Change the username
        fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newusername' } });

        // Mock the updateUser function
        UserProfileManager.updateUser.mockResolvedValue({
            username: 'newusername',
            email: 'test@example.com',
            bio: 'A test bio',
        });

        // Click the save button
        fireEvent.click(screen.getByText('Save'));

        // Check that the updated username is displayed
        await waitFor(() => {
            expect(screen.getByText('newusername')).toBeInTheDocument();
        });
    });
});
