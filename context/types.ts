export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'patient' | 'chw' | 'nurse' | 'lab' | 'admin' | 'provider';
  photo: string;
  birthDate: string;
  lastHealedDate: string;
  location: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  consentAccepted: boolean;
  acceptConsent: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginByPhone: (phone: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  register: (name: string, email: string, phone: string, password: string, role: string, location?: string, county?: string, subCounty?: string, ward?: string, photoUri?: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}
