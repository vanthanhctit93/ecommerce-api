import mongoose from 'mongoose';
import ProductModel from '../models/Product.js';

/**
 * Reserve stock atomically using MongoDB transactions
 * Prevents race conditions when multiple users checkout simultaneously
 * 
 * @param {Array} items - Cart items with productId and quantity
 * @param {Object} session - MongoDB session for transaction
 * @throws {Error} If insufficient stock or product not available
 */
export async function reserveStock(items, session) {
    for (const item of items) {
        // Atomic update: decrement stock only if sufficient quantity available
        const result = await ProductModel.findOneAndUpdate(
            {
                _id: item.productId,
                inStock: { $gte: item.quantity }, // Only if enough stock
                isDeleted: false,
                isPublished: true
            },
            {
                $inc: { inStock: -item.quantity }
            },
            { 
                session, 
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            // Either insufficient stock or product not available
            const product = await ProductModel.findById(item.productId);
            
            if (!product || product.isDeleted) {
                throw new Error(`Product ${item.productId} is not available`);
            }
            
            if (!product.isPublished) {
                throw new Error(`Product "${product.title}" is not published`);
            }
            
            throw new Error(`Insufficient stock for product "${product.title}". Available: ${product.inStock}, Requested: ${item.quantity}`);
        }

        console.log(`✅ Reserved ${item.quantity} units of product ${item.productId}`);
    }
}

/**
 * Release stock (rollback operation)
 * Used when transaction fails or payment is cancelled
 * 
 * @param {Array} items - Cart items to release
 * @param {Object} session - MongoDB session for transaction
 */
export async function releaseStock(items, session) {
    for (const item of items) {
        await ProductModel.findByIdAndUpdate(
            item.productId,
            { 
                $inc: { inStock: item.quantity }
            },
            { session }
        );

        console.log(`🔄 Released ${item.quantity} units of product ${item.productId}`);
    }
}

/**
 * Update sold count after successful payment
 * 
 * @param {Array} items - Order items
 * @param {Object} session - MongoDB session for transaction
 */
export async function updateSoldCount(items, session) {
    for (const item of items) {
        await ProductModel.findByIdAndUpdate(
            item.productId,
            { 
                $inc: { soldCount: item.quantity }
            },
            { session }
        );
    }
}
