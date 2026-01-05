# Ecom2Micro BFF (Backend For Frontend)

Backend For Frontend (BFF) pour le projet Ecom2Micro. Ce service sert d'intermédiaire entre le frontend et les microservices backend, offrant une API simplifiée et unifiée.

## 🎯 Objectif

Le BFF agit comme une couche d'agrégation et de simplification entre le frontend et les microservices :
- Unifie les appels API vers plusieurs microservices
- Gère l'authentification JWT via **cookies HttpOnly** (protection XSS)
- Fournit une limitation de débit (rate limiting)
- Centralise la gestion des erreurs et le logging
- Améliore les performances avec retry et timeout

## 🔐 Authentification Sécurisée

Le BFF utilise des **cookies HttpOnly** pour stocker les JWT, offrant une sécurité renforcée :
- ✅ Protection contre les attaques XSS (JavaScript ne peut pas accéder aux cookies)
- ✅ Transmission automatique des cookies avec chaque requête
- ✅ Flags `Secure` et `SameSite` pour protection CSRF
- ✅ Gestion simplifiée côté frontend

📖 **[Documentation complète de l'authentification](docs/AUTHENTICATION.md)**

## 📋 Prérequis

- Node.js >= 18.0.0
- npm ou yarn
- Gateway API Ecom2Micro en cours d'exécution sur `http://localhost:5000`

## 🏗️ Architecture

```
bff/
├── src/
│   ├── config/           # Configuration (URLs services, JWT, logger)
│   │   ├── index.js
│   │   └── logger.js
│   ├── middleware/       # Middlewares Express
│   │   ├── auth.js       # Authentification JWT
│   │   ├── errorHandler.js
│   │   ├── logger.js     # Logging des requêtes
│   │   └── rateLimiter.js
│   ├── routes/           # Routes API par domaine
│   │   ├── auth.js       # /api/auth
│   │   ├── cart.js       # /api/cart
│   │   ├── catalog.js    # /api/catalog
│   │   ├── orders.js     # /api/orders
│   │   ├── payment.js    # /api/payment
│   │   └── index.js
│   ├── services/         # Clients HTTP vers microservices
│   │   ├── httpClient.js # Client Axios avec retry
│   │   ├── catalogService.js
│   │   ├── cartService.js
│   │   ├── orderService.js
│   │   ├── identityService.js
│   │   └── paymentService.js
│   ├── app.js           # Configuration Express
│   └── server.js        # Point d'entrée
├── logs/                # Logs de l'application
├── .env.example         # Variables d'environnement (template)
├── .gitignore
└── package.json
```

## 🚀 Installation

### 1. Cloner et installer les dépendances

```bash
cd bff
npm install
```

### 2. Configuration

Créez un fichier `.env` à partir du template :

```bash
cp .env.example .env
```

Modifiez les variables selon votre environnement :

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Gateway Configuration
GATEWAY_URL=http://localhost:5000

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:4200

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# API Timeouts (milliseconds)
API_TIMEOUT=30000
API_RETRY_ATTEMPTS=3
API_RETRY_DELAY=1000
```

### 3. Démarrer le serveur

**Mode développement (avec rechargement automatique) :**
```bash
npm run dev
```

**Mode production :**
```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Authentification (`/api/auth`)

**⚠️ Important** : L'authentification utilise des **cookies HttpOnly**. Le frontend doit utiliser `credentials: 'include'` (fetch) ou `withCredentials: true` (axios).

- `POST /api/auth/register` - Inscription utilisateur (crée le cookie)
- `POST /api/auth/login` - Connexion utilisateur (crée le cookie)
- `POST /api/auth/logout` - Déconnexion (supprime le cookie) 🔒
- `GET /api/auth/profile` - Obtenir le profil 🔒
- `PUT /api/auth/profile` - Mettre à jour le profil 🔒
- `GET /api/auth/check` - Vérifier l'authentification 🔒
- `POST /api/auth/refresh` - Rafraîchir le token (met à jour le cookie)

🔒 = Nécessite authentification (cookie ou header Authorization)

📖 **[Guide complet d'authentification](docs/AUTHENTICATION.md)**

### Catalogue (`/api/catalog`)
- `GET /api/catalog/products` - Liste des produits
- `GET /api/catalog/products/:id` - Détails d'un produit
- `GET /api/catalog/products/search?q=...` - Recherche de produits
- `GET /api/catalog/categories` - Liste des catégories
- `GET /api/catalog/categories/:id/products` - Produits par catégorie

### Panier (`/api/cart`)
- `GET /api/cart` - Obtenir le panier (🔒 nécessite authentification)
- `POST /api/cart/items` - Ajouter un article (🔒 nécessite authentification)
- `PUT /api/cart/items/:id` - Modifier la quantité (🔒 nécessite authentification)
- `DELETE /api/cart/items/:id` - Retirer un article (🔒 nécessite authentification)
- `DELETE /api/cart` - Vider le panier (🔒 nécessite authentification)
- `POST /api/cart/checkout` - Passer commande (🔒 nécessite authentification)

### Commandes (`/api/orders`)
- `GET /api/orders` - Liste des commandes (🔒 nécessite authentification)
- `GET /api/orders/:id` - Détails d'une commande (🔒 nécessite authentification)
- `GET /api/orders/history` - Historique (🔒 nécessite authentification)
- `POST /api/orders` - Créer une commande (🔒 nécessite authentification)
- `POST /api/orders/:id/cancel` - Annuler une commande (🔒 nécessite authentification)
- `PATCH /api/orders/:id/status` - Mettre à jour le statut (🔒 nécessite authentification)

### Paiement (`/api/payment`)
- `POST /api/payment/process` - Traiter un paiement (🔒 nécessite authentification)
- `GET /api/payment/status/:id` - Statut d'un paiement (🔒 nécessite authentification)
- `GET /api/payment/history` - Historique des paiements (🔒 nécessite authentification)
- `POST /api/payment/:id/refund` - Rembourser un paiement (🔒 nécessite authentification)

## 🔐 Authentification

Le BFF utilise JWT (JSON Web Tokens) stockés dans des **cookies HttpOnly** pour une sécurité renforcée.

### Connexion (Login)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Réponse :
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

Le JWT est automatiquement stocké dans un cookie `auth_token` (HttpOnly, Secure, SameSite).

### Utiliser l'authentification

Le cookie est automatiquement envoyé avec chaque requête :

```bash
curl -X GET http://localhost:3000/api/cart \
  -b cookies.txt
```

**Frontend (JavaScript/Fetch) :**
```javascript
fetch('http://localhost:3000/api/cart', {
  credentials: 'include'  // IMPORTANT: envoie les cookies
})
```

**Frontend (Axios) :**
```javascript
axios.get('/api/cart', {
  withCredentials: true  // IMPORTANT: envoie les cookies
})
```

### Déconnexion (Logout)

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

Le cookie d'authentification est automatiquement supprimé.

📖 **[Guide complet avec exemples](docs/AUTHENTICATION.md)**

## 🛡️ Sécurité et Middlewares

### Rate Limiting

- **Routes générales** : 100 requêtes / 15 minutes
- **Routes d'authentification** : 5 tentatives / 15 minutes
- **Routes de paiement** : 10 requêtes / heure

### CORS

Configuré pour accepter les requêtes du frontend avec support des cookies :
- **Origin** : `http://localhost:4200` (configurable via `CORS_ORIGIN`)
- **Credentials** : `true` (nécessaire pour les cookies HttpOnly)
- Le frontend doit utiliser `credentials: 'include'` ou `withCredentials: true`

### Helmet

Protection contre les vulnérabilités web courantes (XSS, clickjacking, etc.).

### Validation

Validation des entrées utilisateur avec `express-validator`.

## 📊 Logging

Les logs sont enregistrés dans le dossier `logs/` :
- `error.log` : Erreurs uniquement
- `combined.log` : Tous les logs

En mode développement, les logs sont également affichés dans la console avec coloration.

## 🔄 Retry et Timeout

### Retry Logic

Le client HTTP Axios est configuré avec une logique de retry automatique :
- **3 tentatives** par défaut
- Retry sur erreurs réseau et codes 5xx
- Délai exponentiel entre les tentatives (1s, 2s, 3s)

### Timeout

- Timeout par défaut : **30 secondes**
- Configurable via `API_TIMEOUT` dans `.env`

## 🧪 Tests

```bash
# Exécuter les tests
npm test

# Tests avec coverage
npm run test:coverage
```

## 🔍 Debugging

### Vérifier la connexion au Gateway

```bash
curl http://localhost:3000/api/health
```

### Activer les logs détaillés

Dans `.env`, définissez :
```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📝 Exemples d'utilisation

### Exemple 1 : Récupérer les produits

```javascript
fetch('http://localhost:3000/api/catalog/products')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Exemple 2 : Ajouter au panier (avec authentification)

```javascript
fetch('http://localhost:3000/api/cart/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    productId: '123',
    quantity: 2
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### Exemple 3 : Créer une commande

```javascript
fetch('http://localhost:3000/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    items: [
      { productId: '123', quantity: 2 },
      { productId: '456', quantity: 1 }
    ],
    shippingAddress: {
      street: '123 Main St',
      city: 'Paris',
      postalCode: '75001',
      country: 'France'
    }
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

## 🚨 Troubleshooting

### Le serveur ne démarre pas

- Vérifiez que le port 3000 n'est pas déjà utilisé
- Assurez-vous que toutes les dépendances sont installées : `npm install`

### Erreur de connexion au Gateway

- Vérifiez que le Gateway est en cours d'exécution sur `http://localhost:5000`
- Vérifiez la configuration `GATEWAY_URL` dans `.env`

### Token JWT invalide

- Vérifiez que `JWT_SECRET` est le même que celui utilisé par le service Identity
- Assurez-vous que le token n'a pas expiré

## 📚 Technologies utilisées

- **Express** - Framework web
- **Axios** - Client HTTP avec retry
- **axios-retry** - Logique de retry automatique
- **jsonwebtoken** - Gestion JWT
- **express-rate-limit** - Limitation de débit
- **helmet** - Sécurité HTTP
- **cors** - Configuration CORS
- **winston** - Logging avancé
- **morgan** - Logging HTTP
- **express-validator** - Validation des entrées

## 📄 License

ISC

## 👥 Support

Pour toute question ou problème, consultez la documentation du projet Ecom2Micro.
