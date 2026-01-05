# Routes du Panier (Cart API)

## Vue d'ensemble

Les routes du panier permettent de gérer le panier d'un utilisateur connecté. Toutes les routes nécessitent une authentification JWT.

## Configuration

- **Endpoint de base** : `/api/cart`
- **Service backend** : Cart.Service via Gateway (`http://localhost:5000/cart`)
- **Authentification** : JWT obligatoire (cookie HttpOnly ou header Authorization)

## Routes disponibles

### 1. Récupérer le panier

Récupère le panier de l'utilisateur connecté avec tous ses articles.

**Requête :**
```http
GET /api/cart
Authorization: Bearer <token>
```

**Réponse (200 OK) :**
```json
{
  "id": "cart-uuid",
  "userId": "user-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "name": "Product Name",
      "price": 99.99,
      "quantity": 2,
      "subtotal": 199.98
    }
  ],
  "total": 199.98,
  "itemCount": 2,
  "updatedAt": "2025-12-28T19:00:00Z"
}
```

---

### 2. Ajouter un produit au panier

Ajoute un nouveau produit ou augmente la quantité si le produit existe déjà.

**Requête :**
```http
POST /api/cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product-uuid",
  "quantity": 2
}
```

**Validation :**
- `productId` : obligatoire (string non vide)
- `quantity` : obligatoire (entier >= 1)

**Réponse (201 Created) :**
```json
{
  "productId": "product-uuid",
  "quantity": 2,
  "price": 99.99,
  "subtotal": 199.98,
  "addedAt": "2025-12-28T19:00:00Z"
}
```

---

### 3. Mettre à jour la quantité

Met à jour la quantité d'un produit dans le panier.

**Requête :**
```http
PUT /api/cart/items/:productId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 5
}
```

**Paramètres :**
- `productId` : ID du produit à mettre à jour (path parameter)

**Validation :**
- `quantity` : obligatoire (entier >= 1)

**Réponse (200 OK) :**
```json
{
  "productId": "product-uuid",
  "quantity": 5,
  "price": 99.99,
  "subtotal": 499.95,
  "updatedAt": "2025-12-28T19:00:00Z"
}
```

---

### 4. Supprimer un produit

Supprime un produit spécifique du panier.

**Requête :**
```http
DELETE /api/cart/items/:productId
Authorization: Bearer <token>
```

**Paramètres :**
- `productId` : ID du produit à supprimer (path parameter)

**Réponse (204 No Content) :**
```
(pas de contenu)
```

---

### 5. Vider le panier

Supprime tous les articles du panier.

**Requête :**
```http
DELETE /api/cart
Authorization: Bearer <token>
```

**Réponse (204 No Content) :**
```
(pas de contenu)
```

---

### 6. Passer commande (Checkout)

Lance le processus de commande à partir du panier actuel.

**Requête :**
```http
POST /api/cart/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Paris",
    "postalCode": "75001",
    "country": "France"
  },
  "paymentMethod": "credit_card"
}
```

**Réponse (200 OK) :**
```json
{
  "orderId": "order-uuid",
  "status": "pending",
  "total": 199.98,
  "items": [...],
  "createdAt": "2025-12-28T19:00:00Z"
}
```

---

## Gestion des erreurs

### Erreurs d'authentification

**401 Unauthorized :**
```json
{
  "error": "Access denied",
  "message": "No token provided"
}
```

**403 Forbidden :**
```json
{
  "error": "Forbidden",
  "message": "Invalid or expired token"
}
```

### Erreurs de validation

**400 Bad Request :**
```json
{
  "errors": [
    {
      "msg": "Product ID is required",
      "param": "productId",
      "location": "body"
    },
    {
      "msg": "Quantity must be at least 1",
      "param": "quantity",
      "location": "body"
    }
  ]
}
```

### Erreurs métier

**404 Not Found :**
```json
{
  "error": "Not Found",
  "message": "Product not found in cart"
}
```

**409 Conflict :**
```json
{
  "error": "Conflict",
  "message": "Insufficient stock for product"
}
```

---

## Exemples d'utilisation

### Ajouter plusieurs produits

```bash
# Ajouter le premier produit
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"productId": "prod-1", "quantity": 2}'

# Ajouter un deuxième produit
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"productId": "prod-2", "quantity": 1}'
```

### Mettre à jour et supprimer

```bash
# Mettre à jour la quantité
curl -X PUT http://localhost:3000/api/cart/items/prod-1 \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"quantity": 5}'

# Supprimer un produit
curl -X DELETE http://localhost:3000/api/cart/items/prod-2 \
  -H "Authorization: Bearer eyJhbGc..."
```

### Workflow complet

```bash
# 1. Se connecter
LOGIN_RESPONSE=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

# 2. Ajouter des produits
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "prod-1", "quantity": 2}'

# 3. Consulter le panier
curl -X GET http://localhost:3000/api/cart \
  -H "Authorization: Bearer $TOKEN"

# 4. Passer commande
curl -X POST http://localhost:3000/api/cart/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Paris",
      "postalCode": "75001",
      "country": "France"
    },
    "paymentMethod": "credit_card"
  }'
```

---

## Architecture

### Flux de données

```
Client → BFF (/api/cart/*) → Gateway (/cart/*) → Cart.Service
         │                                             │
         └─────────────── JWT Auth ────────────────────┘
```

### Middleware appliqués

1. **authenticateToken** : Vérifie le JWT et extrait les informations utilisateur
2. **express-validator** : Valide les données d'entrée
3. **errorHandler** : Gère les erreurs et formate les réponses

### Service backend

Le `cartService` :
- Utilise `httpClient` avec retry automatique (3 tentatives)
- Ajoute automatiquement le token JWT aux requêtes
- Communique via le Gateway sur `/cart`
- Gère les timeouts (30 secondes par défaut)

---

## Sécurité

- ✅ **Authentification obligatoire** : Toutes les routes nécessitent un JWT valide
- ✅ **Validation des entrées** : express-validator vérifie tous les paramètres
- ✅ **Rate limiting** : 100 requêtes/15 minutes (général)
- ✅ **CORS** : Configuré pour accepter les credentials
- ✅ **Helmet** : Headers de sécurité activés

---

## Notes techniques

- Le token JWT est automatiquement extrait du cookie HttpOnly ou du header Authorization
- Les réponses 204 (No Content) n'ont pas de body
- Les erreurs sont automatiquement loguées avec Winston
- Le service utilise axios-retry pour la résilience
