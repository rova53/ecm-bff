# Routes des Commandes (Orders API)

## Vue d'ensemble

Les routes des commandes permettent de gérer le cycle de vie complet des commandes d'un utilisateur. Toutes les routes nécessitent une authentification JWT.

## Configuration

- **Endpoint de base** : `/api/orders`
- **Service backend** : Order.Service via Gateway (`http://localhost:5000/order`)
- **Authentification** : JWT obligatoire (cookie HttpOnly ou header Authorization)

## Routes disponibles

### 1. Liste des commandes (avec pagination)

Récupère la liste des commandes de l'utilisateur connecté avec pagination et filtres.

**Requête :**
```http
GET /api/orders?page=1&limit=10&status=pending&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <token>
```

**Paramètres de query (optionnels) :**
- `page` : Numéro de page (entier >= 1, défaut: 1)
- `limit` : Nombre d'éléments par page (entier 1-100, défaut: 20)
- `status` : Filtre par statut (`pending`, `processing`, `shipped`, `delivered`, `cancelled`)
- `sortBy` : Champ de tri (`createdAt`, `updatedAt`, `total`)
- `sortOrder` : Ordre de tri (`asc`, `desc`, défaut: `desc`)

**Validation :**
- `page` : entier >= 1
- `limit` : entier entre 1 et 100
- `status` : chaîne de caractères
- `sortBy` : `createdAt` | `updatedAt` | `total`
- `sortOrder` : `asc` | `desc`

**Réponse (200 OK) :**
```json
{
  "data": [
    {
      "id": "order-uuid",
      "userId": "user-uuid",
      "status": "pending",
      "items": [
        {
          "productId": "product-uuid",
          "name": "Product Name",
          "price": 99.99,
          "quantity": 2,
          "subtotal": 199.98
        }
      ],
      "subtotal": 199.98,
      "shipping": 10.00,
      "tax": 20.00,
      "total": 229.98,
      "shippingAddress": {
        "street": "123 Main St",
        "city": "Paris",
        "postalCode": "75001",
        "country": "France"
      },
      "createdAt": "2025-12-28T19:00:00Z",
      "updatedAt": "2025-12-28T19:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### 2. Détail d'une commande

Récupère les détails complets d'une commande spécifique.

**Requête :**
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

**Paramètres :**
- `id` : ID de la commande (path parameter)

**Réponse (200 OK) :**
```json
{
  "id": "order-uuid",
  "userId": "user-uuid",
  "status": "processing",
  "items": [
    {
      "productId": "product-uuid",
      "name": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "quantity": 2,
      "subtotal": 199.98,
      "imageUrl": "https://..."
    }
  ],
  "subtotal": 199.98,
  "shipping": 10.00,
  "tax": 20.00,
  "total": 229.98,
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Paris",
    "postalCode": "75001",
    "country": "France",
    "phone": "+33123456789"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "Paris",
    "postalCode": "75001",
    "country": "France"
  },
  "paymentMethod": "credit_card",
  "paymentStatus": "paid",
  "trackingNumber": "TRK123456789",
  "statusHistory": [
    {
      "status": "pending",
      "timestamp": "2025-12-28T19:00:00Z",
      "note": "Order created"
    },
    {
      "status": "processing",
      "timestamp": "2025-12-28T19:05:00Z",
      "note": "Payment confirmed"
    }
  ],
  "createdAt": "2025-12-28T19:00:00Z",
  "updatedAt": "2025-12-28T19:05:00Z"
}
```

---

### 3. Créer une nouvelle commande

Crée une nouvelle commande à partir des données fournies.

**Requête :**
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "price": 99.99
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Paris",
    "postalCode": "75001",
    "country": "France",
    "phone": "+33123456789"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "Paris",
    "postalCode": "75001",
    "country": "France"
  },
  "paymentMethod": "credit_card"
}
```

**Validation :**
- `items` : tableau obligatoire (minimum 1 élément)
- `shippingAddress` : objet obligatoire

**Réponse (201 Created) :**
```json
{
  "id": "order-uuid",
  "userId": "user-uuid",
  "status": "pending",
  "items": [...],
  "total": 229.98,
  "createdAt": "2025-12-28T19:00:00Z"
}
```

---

### 4. Annuler une commande

Annule une commande existante (si le statut le permet).

**Requête :**
```http
PUT /api/orders/:id/cancel
Authorization: Bearer <token>
```

**Paramètres :**
- `id` : ID de la commande à annuler (path parameter)

**Réponse (200 OK) :**
```json
{
  "id": "order-uuid",
  "status": "cancelled",
  "cancelledAt": "2025-12-28T19:00:00Z",
  "refundStatus": "pending",
  "message": "Order cancelled successfully"
}
```

**Erreurs possibles :**

**409 Conflict :**
```json
{
  "error": "Conflict",
  "message": "Cannot cancel order with status 'shipped'"
}
```

---

### 5. Statut en temps réel d'une commande

Récupère le statut actuel d'une commande avec les dernières mises à jour.

**Requête :**
```http
GET /api/orders/:id/status
Authorization: Bearer <token>
```

**Paramètres :**
- `id` : ID de la commande (path parameter)

**Réponse (200 OK) :**
```json
{
  "orderId": "order-uuid",
  "status": "shipped",
  "paymentStatus": "paid",
  "trackingNumber": "TRK123456789",
  "estimatedDelivery": "2025-12-30T18:00:00Z",
  "currentLocation": "Distribution center - Paris",
  "lastUpdate": "2025-12-28T19:00:00Z",
  "timeline": [
    {
      "status": "pending",
      "timestamp": "2025-12-28T10:00:00Z",
      "description": "Order received"
    },
    {
      "status": "processing",
      "timestamp": "2025-12-28T11:00:00Z",
      "description": "Payment confirmed"
    },
    {
      "status": "shipped",
      "timestamp": "2025-12-28T19:00:00Z",
      "description": "Package shipped"
    }
  ]
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
      "msg": "Order must contain at least one item",
      "param": "items",
      "location": "body"
    },
    {
      "msg": "Shipping address is required",
      "param": "shippingAddress",
      "location": "body"
    },
    {
      "msg": "Page must be at least 1",
      "param": "page",
      "location": "query"
    },
    {
      "msg": "Limit must be between 1 and 100",
      "param": "limit",
      "location": "query"
    }
  ]
}
```

### Erreurs métier

**404 Not Found :**
```json
{
  "error": "Not Found",
  "message": "Order not found"
}
```

**409 Conflict :**
```json
{
  "error": "Conflict",
  "message": "Cannot cancel order in current status"
}
```

---

## Exemples d'utilisation

### Créer et suivre une commande

```bash
# 1. Se connecter
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' | jq -r '.token')

# 2. Créer une commande
ORDER_ID=$(curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "prod-1", "quantity": 2, "price": 99.99}
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Paris",
      "postalCode": "75001",
      "country": "France"
    },
    "paymentMethod": "credit_card"
  }' | jq -r '.id')

# 3. Consulter les détails
curl -X GET http://localhost:3000/api/orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN"

# 4. Vérifier le statut
curl -X GET http://localhost:3000/api/orders/$ORDER_ID/status \
  -H "Authorization: Bearer $TOKEN"
```

### Liste avec pagination et filtres

```bash
# Commandes récentes (page 1)
curl -X GET "http://localhost:3000/api/orders?page=1&limit=10&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer $TOKEN"

# Commandes en attente
curl -X GET "http://localhost:3000/api/orders?status=pending" \
  -H "Authorization: Bearer $TOKEN"

# Commandes livrées
curl -X GET "http://localhost:3000/api/orders?status=delivered&sortBy=updatedAt" \
  -H "Authorization: Bearer $TOKEN"
```

### Annuler une commande

```bash
# Annuler la commande
curl -X PUT http://localhost:3000/api/orders/$ORDER_ID/cancel \
  -H "Authorization: Bearer $TOKEN"
```

---

## Statuts des commandes

| Statut | Description | Actions possibles |
|--------|-------------|-------------------|
| `pending` | Commande créée, en attente de paiement | cancel, pay |
| `processing` | Paiement confirmé, en préparation | cancel |
| `shipped` | Commande expédiée | view tracking |
| `delivered` | Commande livrée | return, review |
| `cancelled` | Commande annulée | reorder |
| `returned` | Commande retournée | refund |

---

## Architecture

### Flux de données

```
Client → BFF (/api/orders/*) → Gateway (/order/*) → Order.Service
         │                                              │
         └───────────────── JWT Auth ──────────────────┘
```

### Middleware appliqués

1. **authenticateToken** : Vérifie le JWT et extrait les informations utilisateur
2. **express-validator** : Valide les paramètres de query et body
3. **errorHandler** : Gère les erreurs et formate les réponses

### Service backend

Le `orderService` :
- Utilise `httpClient` avec retry automatique (3 tentatives)
- Ajoute automatiquement le token JWT aux requêtes
- Communique via le Gateway sur `/order`
- Gère les timeouts (30 secondes par défaut)
- Supporte la pagination côté backend

---

## Sécurité

- ✅ **Authentification obligatoire** : Toutes les routes nécessitent un JWT valide
- ✅ **Validation des entrées** : express-validator vérifie tous les paramètres
- ✅ **Rate limiting** : 100 requêtes/15 minutes (général)
- ✅ **Isolation utilisateur** : Chaque utilisateur ne voit que ses propres commandes
- ✅ **CORS** : Configuré pour accepter les credentials
- ✅ **Helmet** : Headers de sécurité activés

---

## Notes techniques

- Le token JWT est automatiquement extrait du cookie HttpOnly ou du header Authorization
- La pagination est gérée côté backend pour de meilleures performances
- Les paramètres de pagination par défaut sont définis dans le service backend
- La méthode PUT est utilisée pour `/cancel` (opération idempotente)
- La route `/status` retourne un statut en temps réel sans modifier la commande
- Les erreurs sont automatiquement loguées avec Winston
- Le service utilise axios-retry pour la résilience
