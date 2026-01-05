# Aide-mémoire BFF - Référence Rapide

## 🚀 Démarrage rapide

```bash
cd bff
npm install
cp .env.example .env
npm run dev
```

Serveur : `http://localhost:3000`

## 📡 Routes principales

### Sans authentification
```
POST /api/auth/register      # Inscription
POST /api/auth/login          # Connexion
GET  /api/catalog/products    # Liste produits
GET  /api/catalog/products/:id # Détail produit
GET  /api/health              # Health check
```

### Avec authentification (cookie automatique)
```
POST /api/auth/logout         # Déconnexion
GET  /api/auth/profile        # Profil
GET  /api/cart                # Panier
POST /api/cart/items          # Ajouter au panier
GET  /api/orders              # Commandes
POST /api/payment/process     # Paiement
```

## 🔐 Authentification

### Connexion
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"user@example.com","password":"pass123"}'
```

### Utiliser le cookie
```bash
curl http://localhost:3000/api/auth/profile -b cookies.txt
```

### Frontend (Axios)
```javascript
axios.post('/api/auth/login', credentials, {
  withCredentials: true  // OBLIGATOIRE
})
```

### Frontend (Fetch)
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',  // OBLIGATOIRE
  body: JSON.stringify(credentials)
})
```

## 🛠️ Configuration (.env)

```env
NODE_ENV=development
PORT=3000
GATEWAY_URL=http://localhost:5000
JWT_SECRET=change-me-in-production
CORS_ORIGIN=http://localhost:4200
```

## 📝 Structure des requêtes

### Inscription
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Connexion
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Ajouter au panier
```json
POST /api/cart/items
{
  "productId": "123",
  "quantity": 2
}
```

### Créer commande
```json
POST /api/orders
{
  "items": [
    {"productId": "123", "quantity": 2}
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Paris",
    "postalCode": "75001"
  }
}
```

## 🔧 Commandes utiles

```bash
npm run dev          # Mode développement
npm start            # Mode production
npm test             # Tests
npm run test:watch   # Tests en mode watch
npm run lint         # Vérifier le code
npm run lint:fix     # Corriger le code
```

## 🐛 Debugging

### Logs
- `logs/error.log` - Erreurs uniquement
- `logs/combined.log` - Tous les logs

### Variables de log
```env
LOG_LEVEL=debug  # ou info, warn, error
```

### Vérifier la connexion
```bash
curl http://localhost:3000/api/health
```

## ⚠️ Erreurs communes

### Cookies non envoyés
✅ Vérifier `withCredentials: true` ou `credentials: 'include'`  
✅ Vérifier CORS `credentials: true` côté backend

### 401 Unauthorized
✅ Cookie expiré → Se reconnecter  
✅ Pas de cookie → Vérifier l'envoi des credentials

### CORS Error
✅ Vérifier `CORS_ORIGIN` dans .env  
✅ Utiliser un proxy en développement

## 📊 Rate Limits

- **Général** : 100 req / 15 min
- **Auth** : 5 req / 15 min
- **Payment** : 10 req / heure

## 🔒 Sécurité

✅ **Cookies HttpOnly** - Protection XSS  
✅ **SameSite=Strict** - Protection CSRF  
✅ **Secure** - HTTPS en production  
✅ **Helmet** - Headers sécurisés  
✅ **Rate limiting** - Anti-bruteforce

## 📚 Documentation complète

- [Authentification détaillée](docs/AUTHENTICATION.md)
- [Intégration Frontend](docs/FRONTEND_INTEGRATION.md)
- [README principal](README.md)

## 🆘 Support

### Gateway non accessible
```bash
# Vérifier que le Gateway tourne
curl http://localhost:5000/health
```

### Port déjà utilisé
```env
PORT=3001  # Changer dans .env
```

### Problème de JWT
```env
JWT_SECRET=nouveau-secret-super-securise
```

## 🧪 Tests rapides

### Test register + login
```bash
# Inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@test.com","password":"Test1234!","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@test.com","password":"Test1234!"}'

# Profile
curl http://localhost:3000/api/auth/profile -b cookies.txt

# Logout
curl -X POST http://localhost:3000/api/auth/logout -b cookies.txt
```

## 💡 Astuces

### Voir le contenu du cookie
```bash
cat cookies.txt
```

### Tester avec VS Code REST Client
Utiliser le fichier `tests/auth.http`

### Debugger les requêtes
```javascript
// Ajouter dans config/logger.js
level: 'debug'
```

### Proxy de développement (Angular)
```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```

---

**🎯 Conseil** : Commencez toujours par tester `/api/health` pour vérifier que le serveur fonctionne !
