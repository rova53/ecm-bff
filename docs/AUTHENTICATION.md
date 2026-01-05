# Authentification BFF - Guide Complet

## 🔐 Vue d'ensemble

Le BFF utilise une authentification basée sur les **cookies HttpOnly** pour stocker les JWT (JSON Web Tokens). Cette approche améliore la sécurité en protégeant contre les attaques XSS (Cross-Site Scripting).

## 🏗️ Architecture

```
Frontend → BFF (cookies HttpOnly) → Gateway → Identity.Service
```

### Avantages des cookies HttpOnly

- ✅ **Protection XSS** : JavaScript ne peut pas accéder aux cookies HttpOnly
- ✅ **Transmission automatique** : Les cookies sont envoyés automatiquement avec chaque requête
- ✅ **Sécurité renforcée** : Flags `Secure` et `SameSite` pour protection CSRF
- ✅ **Gestion simplifiée** : Pas besoin de gérer manuellement le token dans le localStorage

## 📡 Routes d'authentification

### 1. Inscription (Register)

**POST** `/api/auth/register`

Inscrit un nouvel utilisateur et stocke le JWT dans un cookie HttpOnly.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Cookie Set:**
```
auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; 
HttpOnly; 
Secure; 
SameSite=Strict; 
Max-Age=86400
```

**Validation:**
- Email valide requis
- Mot de passe minimum 8 caractères
- Prénom et nom requis

---

### 2. Connexion (Login)

**POST** `/api/auth/login`

Authentifie l'utilisateur et stocke le JWT dans un cookie HttpOnly.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Cookie Set:**
```
auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; 
HttpOnly; 
Secure; 
SameSite=Strict; 
Max-Age=86400
```

**Rate Limiting:** 5 tentatives / 15 minutes

---

### 3. Déconnexion (Logout)

**POST** `/api/auth/logout`

Déconnecte l'utilisateur et supprime le cookie d'authentification.

**Headers:**
```
Cookie: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Cookie Cleared:**
```
auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0
```

---

### 4. Profil utilisateur (Get Profile)

**GET** `/api/auth/profile`

Récupère le profil de l'utilisateur connecté.

**Headers:**
```
Cookie: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "id": "123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### 5. Mettre à jour le profil (Update Profile)

**PUT** `/api/auth/profile`

Met à jour le profil de l'utilisateur connecté.

**Headers:**
```
Cookie: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response (200):**
```json
{
  "id": "123",
  "email": "user@example.com",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

---

### 6. Rafraîchir le token (Refresh)

**POST** `/api/auth/refresh`

Rafraîchit le token d'accès expiré.

**Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "user": {
    "id": "123",
    "email": "user@example.com"
  }
}
```

**Cookie Updated:**
Nouveau token stocké dans le cookie `auth_token`.

---

### 7. Vérifier l'authentification (Check)

**GET** `/api/auth/check`

Vérifie si l'utilisateur est authentifié (utile pour le frontend).

**Headers:**
```
Cookie: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "authenticated": true,
  "user": {
    "id": "123",
    "email": "user@example.com"
  }
}
```

---

## 🛡️ Middleware d'authentification

Le middleware `authenticateToken` vérifie automatiquement le JWT depuis les cookies.

### Utilisation dans les routes

```javascript
const { authenticateToken } = require('../middleware/auth');

router.get('/protected', authenticateToken, (req, res) => {
  // req.user contient les données décodées du JWT
  // req.token contient le token JWT
  res.json({ userId: req.user.id });
});
```

### Fonctionnement

1. **Lecture du cookie** : Cherche le token dans `req.cookies.auth_token`
2. **Fallback header** : Si pas de cookie, cherche dans `Authorization: Bearer <token>`
3. **Vérification JWT** : Valide le token avec la clé secrète
4. **Injection** : Ajoute `req.user` et `req.token` à la requête

### Gestion des erreurs

- **401 Unauthorized** : Aucun token fourni
- **403 Forbidden** : Token invalide ou expiré
- **500 Internal Error** : Erreur serveur

---

## 🔧 Configuration

### Variables d'environnement (.env)

```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Environment
NODE_ENV=production  # or development

# CORS (Important pour les cookies)
CORS_ORIGIN=http://localhost:4200
```

### Configuration des cookies (src/config/index.js)

```javascript
cookie: {
  httpOnly: true,                              // Inaccessible par JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en prod
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 24 * 60 * 60 * 1000,                 // 24 heures
}
```

---

## 🌐 Configuration CORS

Pour que les cookies fonctionnent entre le frontend et le BFF, CORS doit être configuré correctement :

```javascript
cors: {
  origin: 'http://localhost:4200',  // URL du frontend
  credentials: true,                 // IMPORTANT: Permet l'envoi des cookies
  optionsSuccessStatus: 200,
}
```

**Frontend (Axios) :**
```javascript
axios.defaults.withCredentials = true;

// Ou pour une requête spécifique
axios.post('/api/auth/login', credentials, {
  withCredentials: true
});
```

**Frontend (Fetch) :**
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',  // IMPORTANT
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(credentials)
});
```

---

## 🧪 Tests avec cURL

### 1. Inscription
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Connexion
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

### 3. Profil (avec cookie)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -b cookies.txt
```

### 4. Déconnexion
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

---

## 🔒 Sécurité

### Protection XSS
Les cookies HttpOnly ne peuvent pas être lus par JavaScript, protégeant contre les attaques XSS.

### Protection CSRF
- **SameSite=Strict** (production) : Bloque les requêtes cross-site
- **SameSite=Lax** (développement) : Permet la navigation normale

### HTTPS obligatoire en production
Le flag `Secure` assure que les cookies ne sont envoyés que via HTTPS en production.

### Rate Limiting
- Routes d'authentification : 5 tentatives / 15 minutes
- Protège contre les attaques par force brute

---

## 🐛 Troubleshooting

### Les cookies ne sont pas envoyés

**Problème** : Le frontend ne reçoit pas les cookies

**Solutions** :
1. Vérifier `credentials: true` dans CORS
2. Vérifier `withCredentials: true` côté client
3. En développement, frontend et backend doivent être sur le même domaine ou utiliser un proxy

### Token expiré

**Problème** : 403 Forbidden - Token invalide

**Solutions** :
1. Utiliser `/api/auth/refresh` avec le refreshToken
2. Redemander à l'utilisateur de se connecter

### Cookies non partagés entre domaines

**Problème** : Cookies ne fonctionnent pas entre localhost:4200 et localhost:3000

**Solutions** :
1. Utiliser un proxy côté frontend
2. Configurer `sameSite: 'lax'` en développement
3. Utiliser le même domaine (ex: dev.local)

---

## 📊 Flow d'authentification

```
1. Utilisateur → POST /api/auth/login
2. BFF → Identity.Service (via Gateway)
3. Identity.Service → JWT généré
4. BFF ← JWT reçu
5. BFF → Cookie HttpOnly créé
6. Utilisateur ← Response + Cookie

Requêtes suivantes:
7. Utilisateur → GET /api/cart (Cookie inclus automatiquement)
8. BFF → Vérifie JWT depuis cookie
9. BFF → Forward vers Cart.Service avec token
10. Utilisateur ← Données du panier
```

---

## 📝 Exemple d'intégration Frontend (Angular)

```typescript
// auth.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  register(userData: any) {
    return this.http.post(`${this.apiUrl}/register`, userData, {
      withCredentials: true  // IMPORTANT
    });
  }

  login(credentials: any) {
    return this.http.post(`${this.apiUrl}/login`, credentials, {
      withCredentials: true  // IMPORTANT
    });
  }

  logout() {
    return this.http.post(`${this.apiUrl}/logout`, {}, {
      withCredentials: true  // IMPORTANT
    });
  }

  getProfile() {
    return this.http.get(`${this.apiUrl}/profile`, {
      withCredentials: true  // IMPORTANT
    });
  }

  checkAuth() {
    return this.http.get(`${this.apiUrl}/check`, {
      withCredentials: true  // IMPORTANT
    });
  }
}
```

---

## ✅ Checklist de mise en production

- [ ] Changer `JWT_SECRET` avec une clé forte et aléatoire
- [ ] Définir `NODE_ENV=production`
- [ ] Activer HTTPS (requis pour cookies Secure)
- [ ] Configurer `CORS_ORIGIN` avec l'URL de production du frontend
- [ ] Vérifier les logs d'authentification
- [ ] Tester les scénarios d'erreur
- [ ] Configurer la rotation des tokens
- [ ] Implémenter la blacklist des tokens (optionnel)

---

## 📚 Ressources

- [JWT.io](https://jwt.io/) - Debugger JWT
- [OWASP - Cookie Security](https://owasp.org/www-community/controls/SecureCookieAttribute)
- [MDN - HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
