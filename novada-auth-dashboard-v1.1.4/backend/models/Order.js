/**
 * =============================================================================
 * Novada Auth System - Order Model
 * =============================================================================
 * Database operations for order management
 * 
 * NOTE: This model is prepared for future use by the ecosystem
 * (admin dashboard, user center, billing system, etc.)
 */

const db = require('../config/database');
const crypto = require('crypto');

/**
 * Order status enumeration
 */
const OrderStatus = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    EXPIRED: 'expired',
};

/**
 * Generate a unique order number
 * Format: OXY-YYYYMMDD-XXXXXXXX (8 random hex chars)
 * @returns {string} Unique order number
 */
const generateOrderNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `OXY-${dateStr}-${random}`;
};

/**
 * Order model with database operations
 */
const Order = {
    /**
     * Create a new order
     * @param {Object} orderData - Order data
     * @returns {Promise<Object>} Created order with ID and order number
     */
    async create({
        userId,
        planType = null,
        serverConfig = null,
        orderAmount = 0,
    }) {
        const orderNumber = generateOrderNumber();
        const orderCreatedAt = new Date();
        
        const result = await db.query(
            `INSERT INTO orders 
             (user_id, order_number, plan_type, server_config, order_amount, order_created_at, status)
             VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
            [
                userId,
                orderNumber,
                planType,
                serverConfig ? JSON.stringify(serverConfig) : null,
                orderAmount,
                orderCreatedAt,
            ]
        );
        
        return {
            id: result.insertId,
            orderNumber,
            orderCreatedAt,
        };
    },
    
    /**
     * Find order by ID
     * @param {number} id - Order ID
     * @returns {Promise<Object|null>} Order object or null
     */
    async findById(id) {
        const orders = await db.query(
            `SELECT * FROM orders WHERE id = ? LIMIT 1`,
            [id]
        );
        
        if (orders.length === 0) return null;
        
        const order = orders[0];
        if (order.server_config) {
            try { order.server_config = JSON.parse(order.server_config); } catch { order.server_config = null; }
        }
        return order;
    },

    /**
     * Find order by order number
     * @param {string} orderNumber - Business order number
     * @returns {Promise<Object|null>} Order object or null
     */
    async findByOrderNumber(orderNumber) {
        const orders = await db.query(
            `SELECT * FROM orders WHERE order_number = ? LIMIT 1`,
            [orderNumber]
        );

        if (orders.length === 0) return null;

        const order = orders[0];
        if (order.server_config) {
            try { order.server_config = JSON.parse(order.server_config); } catch { order.server_config = null; }
        }
        return order;
    },
    
    /**
     * Find all orders for a user
     * @param {number} userId - User ID
     * @param {Object} options - Query options { limit, offset, status }
     * @returns {Promise<Array>} Array of orders
     */
    async findByUserId(userId, { limit = 20, offset = 0, status = null } = {}) {
        let query = `SELECT * FROM orders WHERE user_id = ?`;
        const params = [userId];
        
        if (status) {
            query += ` AND status = ?`;
            params.push(status);
        }
        
        query += ` ORDER BY order_created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        const orders = await db.query(query, params);
        
        return orders.map(order => {
            if (order.server_config) {
                try { order.server_config = JSON.parse(order.server_config); } catch { order.server_config = null; }
            }
            return order;
        });
    },
    
    /**
     * Update order status
     * @param {number} id - Order ID
     * @param {string} status - New status (from OrderStatus enum)
     * @returns {Promise<boolean>} Success status
     */
    async updateStatus(id, status) {
        if (!Object.values(OrderStatus).includes(status)) {
            throw new Error(`Invalid order status: ${status}`);
        }
        
        const result = await db.query(
            `UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?`,
            [status, id]
        );
        
        return result.affectedRows > 0;
    },
    
    /**
     * Record payment for an order
     * @param {number} id - Order ID
     * @param {number} paidAmount - Amount paid
     * @returns {Promise<boolean>} Success status
     */
    async recordPayment(id, paidAmount) {
        const result = await db.query(
            `UPDATE orders 
             SET paid_amount = ?, paid_at = NOW(), status = 'processing', updated_at = NOW() 
             WHERE id = ?`,
            [paidAmount, id]
        );
        
        return result.affectedRows > 0;
    },
    
    /**
     * Activate an order (service starts)
     * @param {number} id - Order ID
     * @returns {Promise<boolean>} Success status
     */
    async activate(id) {
        return this.updateStatus(id, OrderStatus.ACTIVE);
    },
    
    /**
     * Cancel an order
     * @param {number} id - Order ID
     * @returns {Promise<boolean>} Success status
     */
    async cancel(id) {
        const order = await this.findById(id);
        if (!order || order.status !== OrderStatus.PENDING) {
            return false;
        }
        
        return this.updateStatus(id, OrderStatus.CANCELLED);
    },
    
    /**
     * Process refund for an order
     * @param {number} id - Order ID
     * @returns {Promise<boolean>} Success status
     */
    async refund(id) {
        const order = await this.findById(id);
        if (!order || !order.paid_at) {
            return false;
        }
        
        return this.updateStatus(id, OrderStatus.REFUNDED);
    },
    
    /**
     * Get order count for a user
     * @param {number} userId - User ID
     * @param {string} status - Filter by status (optional)
     * @returns {Promise<number>} Order count
     */
    async countByUserId(userId, status = null) {
        let query = `SELECT COUNT(*) as count FROM orders WHERE user_id = ?`;
        const params = [userId];
        
        if (status) {
            query += ` AND status = ?`;
            params.push(status);
        }
        
        const result = await db.query(query, params);
        return result[0]?.count || 0;
    },
    
    /**
     * Get total spent by a user
     * @param {number} userId - User ID
     * @returns {Promise<number>} Total amount spent
     */
    async getTotalSpent(userId) {
        const result = await db.query(
            `SELECT COALESCE(SUM(paid_amount), 0) as total 
             FROM orders 
             WHERE user_id = ? AND paid_at IS NOT NULL`,
            [userId]
        );
        return parseFloat(result[0]?.total || 0);
    },
    
    /**
     * Update server configuration
     * @param {number} id - Order ID
     * @param {Object} serverConfig - New server configuration
     * @returns {Promise<boolean>} Success status
     */
    async updateServerConfig(id, serverConfig) {
        const result = await db.query(
            `UPDATE orders SET server_config = ?, updated_at = NOW() WHERE id = ?`,
            [JSON.stringify(serverConfig), id]
        );
        
        return result.affectedRows > 0;
    },
    
    /**
     * Expire pending orders older than specified hours
     * @param {number} hours - Hours threshold
     * @returns {Promise<number>} Number of orders expired
     */
    async expirePendingOrders(hours = 24) {
        const result = await db.query(
            `UPDATE orders 
             SET status = 'expired', updated_at = NOW() 
             WHERE status = 'pending' 
               AND order_created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
            [hours]
        );
        
        return result.affectedRows;
    },
};

module.exports = {
    Order,
    OrderStatus,
    generateOrderNumber,
};
