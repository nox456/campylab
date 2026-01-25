import { paymentsStorage } from '../storage/payments.storage.js';

export const paymentsController = {
    async getAll(req, res) {
        try {
            const payments = await paymentsStorage.findAll();
            res.json(payments);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error fetching payments' });
        }
    },

    async getByOrder(req, res) {
        try {
            const { id } = req.params;
            const payments = await paymentsStorage.findByOrderId(id);
            res.json(payments);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error fetching order payments' });
        }
    },

    async create(req, res) {
        try {
            const { ordenId, monto, metodo, referencia, nota } = req.body;
            // Ensure userId is captured
            const userId = req.user ? req.user.userId : 1; 

            if (!ordenId || !monto || !metodo) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const payment = await paymentsStorage.create({
                ordenId,
                monto,
                metodo,
                referencia,
                nota,
                userId
            });

            // Check if order is fully paid
            // We need to fetch the order and its payments to verify
            // Or just check sum(payments) >= order.total
            // For now, let's use a quick check via existing storage methods or new logic
            // Since we are in controller, we can import ordersStorage
            // Dynamic import to avoid circular dependency if any, or standard import
            const { ordersStorage } = await import('../storage/orders.storage.js');
            const order = await ordersStorage.findById(ordenId);
            
            if (order && order.pagado >= Number(order.total)) {
                 await ordersStorage.updateStatus(ordenId, 'pagado');
            }

            res.status(201).json(payment);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error registering payment' });
        }
    }
};
