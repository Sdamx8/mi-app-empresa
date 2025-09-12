// Tipos para Firebase Auth
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

// Tipos para el contexto de autenticación
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

// Tipos para roles y permisos
export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  module: string;
  actions: ('read' | 'write' | 'delete' | 'admin')[];
}

// Tipos para el contexto de roles
export interface RoleContextType {
  userRole: UserRole | null;
  hasPermission: (module: string, action: string) => boolean;
  loading: boolean;
}