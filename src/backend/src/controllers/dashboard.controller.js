import { dashboardStorage } from '../storage/dashboard.storage.js';

export const dashboardController = {
  async getDashboardData(req, res) {
    try {
      const [stats, recentOrders, lowStockItems] = await Promise.all([
        dashboardStorage.getStats(),
        dashboardStorage.getRecentOrders(),
        dashboardStorage.getLowStockDetails()
      ]);

      res.json({
        stats,
        recentOrders,
        lowStockItems
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
