# Exemples d'intégration Frontend

Ce document contient des exemples d'intégration du BFF avec différents frameworks frontend.

## Configuration requise

**Important** : Pour que les cookies HttpOnly fonctionnent, le frontend doit :
1. Utiliser `credentials: 'include'` (Fetch API) ou `withCredentials: true` (Axios)
2. Le CORS doit autoriser les credentials (`credentials: true`)
3. Frontend et BFF doivent être sur le même domaine ou utiliser un proxy en développement

## Angular (TypeScript)

### Configuration HttpClient

```typescript
// app.module.ts
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

@NgModule({
  imports: [HttpClientModule],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CredentialsInterceptor,
      multi: true,
    },
  ],
})
export class AppModule {}
```

### Intercepteur pour credentials

```typescript
// credentials.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class CredentialsInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const withCredentials = req.clone({ withCredentials: true });
    return next.handle(withCredentials);
  }
}
```

### Service d'authentification

```typescript
// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface LoginResponse {
  message: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  register(userData: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, userData, {
      withCredentials: true,
    });
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials, {
      withCredentials: true,
    });
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/logout`,
      {},
      { withCredentials: true }
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`, {
      withCredentials: true,
    });
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, data, {
      withCredentials: true,
    });
  }

  checkAuth(): Observable<{ authenticated: boolean; user: User }> {
    return this.http.get<{ authenticated: boolean; user: User }>(
      `${this.apiUrl}/check`,
      { withCredentials: true }
    );
  }
}
```

### Guard pour routes protégées

```typescript
// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.checkAuth().pipe(
      map((response) => {
        if (response.authenticated) {
          return true;
        }
        this.router.navigate(['/login']);
        return false;
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
```

### Composant de connexion

```typescript
// login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  credentials = { email: '', password: '' };
  error: string | null = null;
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = null;

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Login failed';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
```

---

## React (JavaScript/TypeScript)

### Configuration Axios

```javascript
// api/axios.config.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // IMPORTANT: envoie les cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Rediriger vers login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Service d'authentification

```javascript
// services/authService.js
import api from '../api/axios.config';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  async checkAuth() {
    try {
      const response = await api.get('/auth/check');
      return response.data;
    } catch (error) {
      return { authenticated: false };
    }
  },
};
```

### Context d'authentification

```javascript
// context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authService.checkAuth();
      if (response.authenticated) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Auth check failed', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    setUser(response.user);
    return response;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Route protégée

```javascript
// components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
```

### Composant de connexion

```javascript
// pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(credentials);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={credentials.email}
          onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={credentials.password}
          onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
    </div>
  );
};
```

---

## Vue.js 3 (Composition API)

### Configuration Axios

```javascript
// plugins/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Composable d'authentification

```javascript
// composables/useAuth.js
import { ref, computed } from 'vue';
import api from '../plugins/axios';

const user = ref(null);
const loading = ref(false);

export function useAuth() {
  const isAuthenticated = computed(() => user.value !== null);

  const login = async (credentials) => {
    loading.value = true;
    try {
      const response = await api.post('/auth/login', credentials);
      user.value = response.data.user;
      return response.data;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    await api.post('/auth/logout');
    user.value = null;
  };

  const register = async (userData) => {
    loading.value = true;
    try {
      const response = await api.post('/auth/register', userData);
      user.value = response.data.user;
      return response.data;
    } finally {
      loading.value = false;
    }
  };

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/check');
      user.value = response.data.user;
    } catch (error) {
      user.value = null;
    }
  };

  const getProfile = async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    checkAuth,
    getProfile,
  };
}
```

### Navigation Guard

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const routes = [
  { path: '/login', component: () => import('@/views/Login.vue') },
  {
    path: '/dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const { checkAuth, isAuthenticated } = useAuth();

  if (to.meta.requiresAuth) {
    await checkAuth();
    if (!isAuthenticated.value) {
      next('/login');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
```

---

## Vanilla JavaScript (Fetch API)

```javascript
// auth.js
const API_BASE_URL = 'http://localhost:3000/api';

async function register(userData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    credentials: 'include', // IMPORTANT
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error('Registration failed');
  }

  return response.json();
}

async function login(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include', // IMPORTANT
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
}

async function logout() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include', // IMPORTANT
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }

  return response.json();
}

async function getProfile() {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    credentials: 'include', // IMPORTANT
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
}

async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/check`, {
      credentials: 'include', // IMPORTANT
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    return response.json();
  } catch (error) {
    return { authenticated: false };
  }
}

// Export
export { register, login, logout, getProfile, checkAuth };
```

---

## Configuration Proxy (Développement)

### Angular (proxy.conf.json)

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

Puis dans `angular.json` :
```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

### React (package.json)

```json
{
  "proxy": "http://localhost:3000"
}
```

### Vite (vite.config.js)

```javascript
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
};
```

---

## Gestion des erreurs communes

### 401 - Non authentifié

```javascript
// Rediriger vers login
if (error.response?.status === 401) {
  window.location.href = '/login';
}
```

### 403 - Token expiré

```javascript
// Tenter de rafraîchir le token
if (error.response?.status === 403) {
  // Implémenter refresh token si disponible
  // Sinon, rediriger vers login
  window.location.href = '/login';
}
```

### Erreurs de validation (400)

```javascript
if (error.response?.status === 400) {
  const errors = error.response.data.errors;
  // Afficher les erreurs de validation
  console.error('Validation errors:', errors);
}
```

---

## Points importants

✅ **Toujours utiliser** `credentials: 'include'` (Fetch) ou `withCredentials: true` (Axios)  
✅ **CORS** : Le backend doit avoir `credentials: true` dans la configuration CORS  
✅ **Même origine** : En développement, utiliser un proxy pour éviter les problèmes CORS  
✅ **HTTPS** : En production, les cookies `Secure` nécessitent HTTPS  
✅ **Gestion d'erreurs** : Intercepter les 401/403 pour rediriger vers login  
✅ **Loading states** : Afficher des indicateurs pendant les requêtes  
✅ **Error messages** : Afficher les messages d'erreur à l'utilisateur
