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
                monto: parseFloat(monto),
                metodo,
                referencia,
                nota,
                userId
            });

            // Check if order is fully paid
            const { ordersStorage } = await import('../storage/orders.storage.js');
            const order = await ordersStorage.findById(ordenId);
            
            // Logic Update: Only set 'pagado' (Ready for Delivery) if fully paid AND results are loaded.
            if (order && order.pagado >= Number(order.total)) {
                 const hasResults = await ordersStorage.hasAllResults(ordenId);
                 if (hasResults) {
                     await ordersStorage.updateStatus(ordenId, 'pagado');
                 } else {
                     // If paid but results pending, ensure it's not 'creado' if it should be 'procesando'?
                     // Actually, results logic handles 'procesando'. We just DON'T set 'pagado' here.
                     // The order stays 'pendiente'/'procesando'/'resultados_cargados'.
                     // Ideally if it was 'resultados_cargados' but not paid, and now paid -> 'pagado'.
                     // If 'pendiente', stays 'pendiente'.
                 }
            }

            res.status(201).json(payment);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error registering payment' });
        }
    }
};
