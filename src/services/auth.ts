import api from './api';

export interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return res.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  getRole(): string {
    const u = this.getCurrentUser();
    return u?.role || '';
  },
};
