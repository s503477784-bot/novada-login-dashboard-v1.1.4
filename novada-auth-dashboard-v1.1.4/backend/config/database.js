/**
 * =============================================================================
 * Novada Auth System - Database Configuration
 * =============================================================================
 * MySQL database connection pool configuration
 * 
 * SECURITY NOTICE:
 * - All database credentials are loaded from environment variables
 * - This file should ONLY be used server-side
 * - NEVER expose database connections to frontend code
 */

const mysql = require('mysql2/promise');

/**
 * Database connection pool configuration
 * Using connection pooling for better performance and resource management
 */
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    
    // Connection pool settings
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    waitForConnections: true,
    queueLimit: 50,
    
    // Timeout settings
    connectTimeout: 10000,       // 10s to establish connection
    acquireTimeout: 10000,       // 10s to acquire connection from pool
    
    // Security settings
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    
    // Timezone handling
    timezone: '+00:00',
    
    // Character set
    charset: 'utf8mb4',
};

// Create the connection pool
let pool = null;

/**
 * Get database connection pool (lazy initialization)
 * Automatically recreates the pool if it was closed or fatally errored.
 * @returns {Promise<mysql.Pool>} MySQL connection pool
 */
const getPool = () => {
    if (!pool || pool._closed) {
        pool = mysql.createPool(poolConfig);
        
        // Log pool events in development
        if (process.env.NODE_ENV === 'development') {
            pool.on('connection', () => {
                console.log('[DB] New connection established');
            });
            
            pool.on('release', () => {
                console.log('[DB] Connection released');
            });
        }
    }
    return pool;
};

/**
 * Execute a parameterized query (prevents SQL injection)
 * @param {string} sql - SQL query with placeholders
 * @param {Array} params - Parameters to bind
 * @returns {Promise<Array>} Query results
 */
const query = async (sql, params = []) => {
    const connection = await getPool().getConnection();
    try {
        const [results] = await connection.execute(sql, params);
        return results;
    } finally {
        connection.release();
    }
};

/**
 * Execute a transaction with multiple queries
 * @param {Function} callback - Async function receiving connection
 * @returns {Promise<any>} Transaction result
 */
const transaction = async (callback) => {
    const connection = await getPool().getConnection();
    await connection.beginTransaction();
    
    try {
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection success status
 */
const testConnection = async () => {
    try {
        const connection = await getPool().getConnection();
        await connection.ping();
        connection.release();
        console.log('[DB] Database connection successful');
        return true;
    } catch (error) {
        console.error('[DB] Database connection failed:', error.message);
        return false;
    }
};

/**
 * Gracefully close all connections
 * @returns {Promise<void>}
 */
const closePool = async () => {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('[DB] Connection pool closed');
    }
};

module.exports = {
    getPool,
    query,
    transaction,
    testConnection,
    closePool,
};
