import { BaseService } from './base-service';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleCode: string;
  tenantId?: string;
  forcePasswordChange?: boolean;
  avatar?: string;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  instituteName?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  passwordConfirmation: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

export interface UpdateProfileData {
  name?: string;
  avatar?: string;
  email?: string;
}

class AuthService extends BaseService {
  constructor() {
    super({ baseUrl: '/auth' });
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/login', credentials);
    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/register', data);
    return response;
  }

  async logout(): Promise<void> {
    await this.post('/logout', {});
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await this.post<RefreshTokenResponse>('/refresh', { refreshToken });
    return response;
  }

  async me(): Promise<User> {
    const response = await this.get<User>('/me');
    return response;
  }

  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    await this.post('/forgot-password', data);
  }

  async resetPassword(data: ResetPasswordData): Promise<void> {
    await this.post('/reset-password', data);
  }

  async changePassword(data: ChangePasswordData): Promise<void> {
    await this.post('/change-password', data);
  }

  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await this.put<User>('/profile', data);
    return response;
  }

  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<{ url: string }>('/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  }

  async verifyEmail(token: string): Promise<void> {
    await this.post('/verify-email', { token });
  }

  async resendVerificationEmail(): Promise<void> {
    await this.post('/resend-verification', {});
  }
}

export const authService = new AuthService();
