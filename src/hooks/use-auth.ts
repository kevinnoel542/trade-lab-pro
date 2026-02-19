/**
 * Offline mode — no authentication. Single local user.
 * Returns a fake user object so the rest of the app works unchanged.
 */

const LOCAL_USER = {
  id: 'local',
  email: 'local@tradevault.local',
};

export function useAuth() {
  return {
    user: LOCAL_USER as any,
    session: null,
    loading: false,
    signUp: async () => ({ error: null }),
    signIn: async () => ({ error: null }),
    signOut: async () => {},
  };
}
