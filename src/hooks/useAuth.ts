// Re-export the useAuth hook from AuthContext
export { useAuth } from '../contexts/AuthContext';

// Additional auth-related hooks can be added here
export const useAuthStatus = () => {
  // Re-import to avoid direct import cycles
  const { useAuth } = require('../contexts/AuthContext');
  const { isAuthenticated, isLoading, user } = useAuth();
  return { isAuthenticated, isLoading, user };
};

export const useUserRole = () => {
  const { useAuth } = require('../contexts/AuthContext');
  const { user } = useAuth();
  if (user && 'role' in user) {
    return (user as any).role;
  }
  return null;
};

export const useUserPermissions = () => {
  const { useAuth } = require('../contexts/AuthContext');
  const { user } = useAuth();
  if (user && 'permissions' in user) {
    return (user as any).permissions;
  }
  return [];
};
