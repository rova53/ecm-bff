/**
 * Mock data middleware pour développement et tests
 * Active uniquement quand les services backend ne sont pas disponibles
 */

const mockUsers = new Map();
const mockCarts = new Map();
const mockOrders = new Map();

// Utilisateur de test par défaut
const DEFAULT_TEST_USER = {
    id: 'user-test-1',
    email: 'demo@ecom2micro.com',
    password: 'Demo123!', // En production, ce serait hashé
    username: 'Demo User',
    createdAt: new Date().toISOString()
};

// Ajouter l'utilisateur de test au démarrage
mockUsers.set(DEFAULT_TEST_USER.email, DEFAULT_TEST_USER);

// Données de produits mockées
const mockProducts = [
    {
        id: 'prod-1',
        name: 'Laptop Dell XPS 15',
        description: 'Ordinateur portable haute performance',
        price: 1499.99,
        category: 'Electronics',
        stock: 10,
        imageUrl: 'https://via.placeholder.com/300x200?text=Laptop'
    },
    {
        id: 'prod-2',
        name: 'iPhone 15 Pro',
        description: 'Smartphone dernière génération',
        price: 999.99,
        category: 'Electronics',
        stock: 25,
        imageUrl: 'https://via.placeholder.com/300x200?text=iPhone'
    },
    {
        id: 'prod-3',
        name: 'Sony WH-1000XM5',
        description: 'Casque à réduction de bruit',
        price: 349.99,
        category: 'Audio',
        stock: 15,
        imageUrl: 'https://via.placeholder.com/300x200?text=Headphones'
    },
    {
        id: 'prod-4',
        name: 'Samsung 4K Monitor',
        description: 'Écran 4K 32 pouces',
        price: 599.99,
        category: 'Electronics',
        stock: 8,
        imageUrl: 'https://via.placeholder.com/300x200?text=Monitor'
    }
];

const mockCategories = [
    { id: 'cat-1', name: 'Electronics', slug: 'electronics' },
    { id: 'cat-2', name: 'Audio', slug: 'audio' },
    { id: 'cat-3', name: 'Accessories', slug: 'accessories' }
];

// Générer un token JWT simple pour les mocks
function generateMockToken(userId)
{
    return Buffer.from(JSON.stringify({ userId, exp: Date.now() + 86400000 })).toString('base64');
}

function parseMockToken(token)
{
    try
    {
        const data = JSON.parse(Buffer.from(token, 'base64').toString());
        if (data.exp < Date.now()) return null;
        return data;
    } catch
    {
        return null;
    }
}

const mockMiddleware = {
    // Auth mocks
    register: (req, res) =>
    {
        const { email, password, name } = req.body;

        if (!email || !password)
        {
            return res.status(400).json({ error: 'Email and password required' });
        }

        if (mockUsers.has(email))
        {
            return res.status(400).json({ error: 'User already exists' });
        }

        const userId = `user-${Date.now()}`;
        const user = { userId, email, name, createdAt: new Date() };
        mockUsers.set(email, { ...user, password });

        const token = generateMockToken(userId);
        res.status(201).json({ token, user });
    },

    login: (req, res) =>
    {
        const { email, password } = req.body;

        const user = mockUsers.get(email);
        if (!user || user.password !== password)
        {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateMockToken(user.userId);
        const { password: _, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
    },

    me: (req, res) =>
    {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer '))
        {
            return res.status(401).json({ error: 'Access denied' });
        }

        const token = authHeader.substring(7);
        const tokenData = parseMockToken(token);

        if (!tokenData)
        {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const user = Array.from(mockUsers.values()).find(u => u.userId === tokenData.userId);
        if (!user)
        {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    },

    logout: (req, res) =>
    {
        res.json({ message: 'Logged out successfully' });
    },

    // Catalog mocks
    getProducts: (req, res) =>
    {
        res.json(mockProducts);
    },

    getProduct: (req, res) =>
    {
        const product = mockProducts.find(p => p.id === req.params.id);
        if (!product)
        {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    },

    searchProducts: (req, res) =>
    {
        const { q } = req.query;
        if (!q)
        {
            return res.json(mockProducts);
        }
        const results = mockProducts.filter(p =>
            p.name.toLowerCase().includes(q.toLowerCase()) ||
            p.description.toLowerCase().includes(q.toLowerCase())
        );
        res.json(results);
    },

    getCategories: (req, res) =>
    {
        res.json(mockCategories);
    },

    // Cart mocks
    getCart: (req, res) =>
    {
        const userId = req.user?.userId;
        if (!userId)
        {
            return res.status(401).json({ error: 'Access denied' });
        }

        const cart = mockCarts.get(userId) || { items: [], total: 0 };
        res.json(cart);
    },

    addToCart: (req, res) =>
    {
        const userId = req.user?.userId;
        if (!userId)
        {
            return res.status(401).json({ error: 'Access denied' });
        }

        const { productId, quantity } = req.body;
        const product = mockProducts.find(p => p.id === productId);

        if (!product)
        {
            return res.status(404).json({ error: 'Product not found' });
        }

        let cart = mockCarts.get(userId) || { items: [], total: 0 };
        const existingItem = cart.items.find(item => item.productId === productId);

        if (existingItem)
        {
            existingItem.quantity += quantity;
        } else
        {
            cart.items.push({
                productId,
                productName: product.name,
                price: product.price,
                quantity
            });
        }

        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        mockCarts.set(userId, cart);

        res.status(201).json(cart);
    },

    updateCartItem: (req, res) =>
    {
        const userId = req.user?.userId;
        if (!userId)
        {
            return res.status(401).json({ error: 'Access denied' });
        }

        const { productId } = req.params;
        const { quantity } = req.body;

        let cart = mockCarts.get(userId);
        if (!cart)
        {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const item = cart.items.find(item => item.productId === productId);
        if (!item)
        {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        item.quantity = quantity;
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        mockCarts.set(userId, cart);

        res.json(cart);
    },

    removeFromCart: (req, res) =>
    {
        const userId = req.user?.userId;
        if (!userId)
        {
            return res.status(401).json({ error: 'Access denied' });
        }

        const { productId } = req.params;
        let cart = mockCarts.get(userId);

        if (!cart)
        {
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.productId !== productId);
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        mockCarts.set(userId, cart);

        res.json(cart);
    },

    clearCart: (req, res) =>
    {
        const userId = req.user?.userId;
        if (!userId)
        {
            return res.status(401).json({ error: 'Access denied' });
        }

        mockCarts.set(userId, { items: [], total: 0 });
        res.json({ message: 'Cart cleared' });
    },

    // Order mocks
    createOrder: (req, res) =>
    {
        const userId = req.user?.userId;
        if (!userId)
        {
            return res.status(401).json({ error: 'Access denied' });
        }

        const cart = mockCarts.get(userId);
        if (!cart || cart.items.length === 0)
        {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const orderId = `order-${Date.now()}`;
        const order = {
            orderId,
            userId,
            items: [...cart.items],
            total: cart.total,
            shippingAddress: req.body.shippingAddress,
            status: 'pending',
            createdAt: new Date()
        };

        let userOrders = mockOrders.get(userId) || [];
        userOrders.push(order);
        mockOrders.set(userId, userOrders);

        // Clear cart
        mockCarts.set(userId, { items: [], total: 0 });

        res.status(201).json(order);
    },

    getOrders: (req, res) =>
    {
        const userId = req.user?.userId;
        if (!userId)
        {
            return res.status(401).json({ error: 'Access denied' });
        }

        const orders = mockOrders.get(userId) || [];
        res.json(orders);
    },

    getOrder: (req, res) =>
    {
        const userId = req.user?.userId;
        if (!userId)
        {
            return res.status(401).json({ error: 'Access denied' });
        }

        const { orderId } = req.params;
        const orders = mockOrders.get(userId) || [];
        const order = orders.find(o => o.orderId === orderId);

        if (!order)
        {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    },

    cancelOrder: (req, res) =>
    {
        const userId = req.user?.userId;
        if (!userId)
        {
            return res.status(401).json({ error: 'Access denied' });
        }

        const { orderId } = req.params;
        const orders = mockOrders.get(userId) || [];
        const order = orders.find(o => o.orderId === orderId);

        if (!order)
        {
            return res.status(404).json({ error: 'Order not found' });
        }

        order.status = 'cancelled';
        res.json(order);
    },

    // Payment mocks
    processPayment: (req, res) =>
    {
        const userId = req.user?.userId;
        if (!userId)
        {
            return res.status(401).json({ error: 'Access denied' });
        }

        const { orderId } = req.body;
        const orders = mockOrders.get(userId) || [];
        const order = orders.find(o => o.orderId === orderId);

        if (!order)
        {
            return res.status(404).json({ error: 'Order not found' });
        }

        const transactionId = `txn-${Date.now()}`;
        order.status = 'paid';
        order.transactionId = transactionId;

        res.json({
            status: 'success',
            transactionId,
            orderId,
            amount: order.total
        });
    },

    getPaymentStatus: (req, res) =>
    {
        const userId = req.user?.userId;
        if (!userId)
        {
            return res.status(401).json({ error: 'Access denied' });
        }

        const { orderId } = req.params;
        const orders = mockOrders.get(userId) || [];
        const order = orders.find(o => o.orderId === orderId);

        if (!order)
        {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            status: order.status,
            orderId: order.orderId,
            transactionId: order.transactionId || null
        });
    }
};

// Middleware pour extraire userId du token pour les routes protégées
const extractUserFromToken = (req, res, next) =>
{
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer '))
    {
        const token = authHeader.substring(7);
        const tokenData = parseMockToken(token);
        if (tokenData)
        {
            req.user = { userId: tokenData.userId };
        }
    }
    next();
};

module.exports = { mockMiddleware, extractUserFromToken };
