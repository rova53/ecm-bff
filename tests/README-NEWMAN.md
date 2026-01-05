# Tests Newman pour Ecom2Micro BFF

Ce dossier contient une collection Postman complète pour tester tous les endpoints de la BFF, ainsi que les scripts pour exécuter les tests avec Newman.

## 📋 Contenu

- `ecom2micro-bff.postman_collection.json` - Collection Postman avec tous les tests
- `newman-run.ps1` - Script PowerShell pour exécuter les tests
- `newman-reports/` - Dossier contenant les rapports de tests

## 🚀 Prérequis

1. **La BFF doit être en cours d'exécution**
   ```bash
   cd bff
   npm start
   ```

2. **Installer Newman** (si pas déjà installé)
   ```bash
   npm install -g newman
   npm install -g newman-reporter-htmlextra
   ```

## 🧪 Exécution des Tests

### Option 1: Avec le script PowerShell (Recommandé)

```powershell
cd bff/tests
.\newman-run.ps1
```

Le script va :
- Vérifier que la BFF est accessible
- Installer Newman si nécessaire
- Exécuter tous les tests
- Générer des rapports HTML et JSON

### Option 2: Avec Newman directement

```bash
# Tests basiques avec sortie CLI
newman run ecom2micro-bff.postman_collection.json

# Avec rapport HTML détaillé
newman run ecom2micro-bff.postman_collection.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export ./newman-reports/report.html

# Avec variables d'environnement personnalisées
newman run ecom2micro-bff.postman_collection.json \
  --env-var "baseUrl=http://localhost:3000/api"
```

### Option 3: Import dans Postman

1. Ouvrez Postman
2. Cliquez sur **Import**
3. Sélectionnez `ecom2micro-bff.postman_collection.json`
4. Exécutez la collection avec **Runner**

## 📊 Tests Inclus

### 1. Health Check (1 test)
- ✅ Vérification de l'état de la BFF

### 2. Authentication (4 tests)
- ✅ Enregistrement d'un nouvel utilisateur
- ✅ Connexion utilisateur
- ✅ Récupération du profil
- ✅ Déconnexion

### 3. Catalog (4 tests)
- ✅ Liste de tous les produits
- ✅ Détails d'un produit
- ✅ Recherche de produits
- ✅ Liste des catégories

### 4. Cart (5 tests)
- ✅ Récupération du panier
- ✅ Ajout d'article au panier
- ✅ Mise à jour de quantité
- ✅ Suppression d'article
- ✅ Vidage du panier

### 5. Orders (4 tests)
- ✅ Création de commande
- ✅ Liste des commandes
- ✅ Détails d'une commande
- ✅ Annulation de commande

### 6. Payment (2 tests)
- ✅ Traitement de paiement
- ✅ Statut de paiement

**Total: 20 tests automatisés**

## 🔧 Variables de Collection

Les variables suivantes sont utilisées et gérées automatiquement :

- `baseUrl` - URL de base de l'API (par défaut: `http://localhost:3000/api`)
- `token` - Token JWT (extrait automatiquement après login)
- `userId` - ID de l'utilisateur connecté
- `productId` - ID d'un produit (extrait de la liste)
- `orderId` - ID d'une commande (extrait après création)

## 📝 Assertions Testées

Chaque requête vérifie :
- ✅ Code de statut HTTP correct
- ✅ Structure de la réponse JSON
- ✅ Présence des propriétés requises
- ✅ Types de données corrects
- ✅ Temps de réponse acceptable
- ✅ Relations entre les données

## 🎯 Ordre d'Exécution

Les tests doivent être exécutés dans l'ordre car ils sont séquentiels :

1. **Login** → récupère le token
2. **Catalog** → récupère un productId
3. **Cart** → utilise le token et productId
4. **Orders** → crée une commande à partir du panier
5. **Payment** → traite le paiement de la commande

## 📈 Rapports Générés

Après exécution du script, vous trouverez dans `newman-reports/` :

- `newman-report.html` - Rapport HTML détaillé avec graphiques
- `newman-report.json` - Rapport JSON pour intégration CI/CD

## 🔄 Intégration CI/CD

Pour intégrer dans un pipeline :

```yaml
# Exemple GitHub Actions
- name: Run Newman Tests
  run: |
    npm install -g newman
    cd bff/tests
    newman run ecom2micro-bff.postman_collection.json \
      --reporters cli,json \
      --reporter-json-export newman-report.json
```

## 🐛 Dépannage

### La BFF ne répond pas
```powershell
# Vérifier si la BFF tourne
Get-Process node
# Vérifier le port
Get-NetTCPConnection -LocalPort 3000
```

### Tests d'authentification échouent
- Vérifiez que l'Identity Service est accessible
- Vérifiez les variables d'environnement dans `.env`

### Tests de panier échouent
- Assurez-vous que le Cart Service est en cours d'exécution
- Vérifiez Redis si le cache est activé

## 📚 Ressources

- [Documentation Newman](https://learning.postman.com/docs/running-collections/using-newman-cli/command-line-integration-with-newman/)
- [Postman Collection Format](https://schema.postman.com/)
- [Newman HTML Reporter](https://github.com/DannyDainton/newman-reporter-htmlextra)

## 🎨 Personnalisation

Pour ajouter vos propres tests :

1. Modifiez `ecom2micro-bff.postman_collection.json`
2. Ajoutez des assertions dans les scripts de test :
   ```javascript
   pm.test("Mon nouveau test", function () {
       var jsonData = pm.response.json();
       pm.expect(jsonData).to.have.property('monChamp');
   });
   ```

## 💡 Conseils

- Exécutez les tests après chaque changement de code
- Utilisez `--delay-request 100` pour éviter de surcharger l'API
- Activez `--verbose` pour plus de détails en cas d'échec
- Utilisez `--folder "Catalog"` pour tester un groupe spécifique
