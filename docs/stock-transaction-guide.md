# Stock Transaction Management - Implementation Guide

## 📋 Overview

This document explains the implementation of MongoDB transactions for atomic stock management in the e-commerce API, preventing race conditions during concurrent checkouts.

## 🎯 Problem Statement

### Race Condition Scenario (Before Fix)

```
Time    User A                      User B                      Stock
----    ----------------------      ----------------------      -----
T1      Check stock (inStock=1)     -                          1
T2      -                           Check stock (inStock=1)    1
T3      Checkout ✅                 -                          0
T4      -                           Checkout ✅                -1 ❌ BUG!
```

**Issue:** Two users can checkout the same last item simultaneously, resulting in overselling (negative stock).

## ✅ Solution: MongoDB Transactions

### Architecture

```
┌─────────────────────────────────────────────────────┐
│              Checkout Flow                          │
├─────────────────────────────────────────────────────┤
│  1. Start Transaction                               │
│  2. Reserve Stock (Atomic Check + Decrement)        │
│  3. Create Order                                    │
│  4. Clear Cart                                      │
│  5. Commit Transaction                              │
│  6. Create Stripe Payment Intent                    │
├─────────────────────────────────────────────────────┤
│  On Error: Abort Transaction (Auto Rollback)       │
└─────────────────────────────────────────────────────┘
```

## 📁 Files Modified/Created

### 1. `/src/utils/stockManager.js` (NEW)

Utility functions for atomic stock operations:

```javascript
// Reserve stock with atomic check and decrement
export async function reserveStock(items, session)

// Release stock when payment fails/cancels
export async function releaseStock(items, session)

// Update sold count after payment success
export async function updateSoldCount(items, session)
```

**Key Features:**
- ✅ Atomic operations using `findOneAndUpdate` with conditions
- ✅ Session parameter for transaction support
- ✅ Detailed error messages for debugging
- ✅ Safety checks (inStock >= quantity, isPublished, !isDeleted)

### 2. `/src/controllers/paymentController.js` (UPDATED)

#### Changes Made:

**Imports Added:**
```javascript
import mongoose from 'mongoose';
import { reserveStock, releaseStock, updateSoldCount } from '../utils/stockManager.js';
```

**Functions Updated:**

1. **`checkout()`** - Wrapped in transaction
   - Before: Race condition vulnerability
   - After: Atomic stock reservation + order creation

2. **`handlePaymentSuccess()`** - Transaction for sold count update
   - Before: Manual stock decrement (race condition)
   - After: Uses `updateSoldCount()` with transaction

3. **`handlePaymentFailed()`** - Transaction for stock release
   - Before: Stock not released
   - After: Uses `releaseStock()` with transaction

4. **`handlePaymentCanceled()`** - Transaction for stock release
   - Before: Stock not released
   - After: Uses `releaseStock()` with transaction

## 🔧 Implementation Details

### Checkout Flow (Transaction)

```javascript
export const checkout = async (req, res) => {
    const session = await mongoose.startSession();
    
    try {
        session.startTransaction();

        // Validate cart...
        
        // ✅ ATOMIC: Reserve stock (check + decrement in one operation)
        await reserveStock(
            validatedCart.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            })),
            session
        );

        // Create order with transaction
        await order.save({ session });

        // Clear cart
        req.session[cartKey] = [];

        // Commit all changes atomically
        await session.commitTransaction();

        // Create Stripe Payment Intent (after successful commit)
        const paymentIntent = await stripe.paymentIntents.create({...});

        res.status(200).json({...});
    } catch (error) {
        // ✅ AUTO ROLLBACK: All changes reverted
        await session.abortTransaction();
        console.error('Checkout error:', error);
        res.status(500).json({...});
    } finally {
        session.endSession();
    }
};
```

### Stock Reservation (Atomic)

```javascript
export async function reserveStock(items, session) {
    for (const item of items) {
        const result = await ProductModel.findOneAndUpdate(
            {
                _id: item.productId,
                inStock: { $gte: item.quantity }, // ✅ Atomic check
                isDeleted: false,
                isPublished: true
            },
            { 
                $inc: { inStock: -item.quantity } // ✅ Atomic decrement
            },
            { 
                session,        // Transaction session
                new: true,      // Return updated document
                runValidators: true 
            }
        );
        
        if (!result) {
            // Product not found, out of stock, or conditions not met
            throw new Error(`Insufficient stock for product ${item.productId}`);
        }
    }
}
```

**Why This Works:**
- MongoDB's `findOneAndUpdate` is **atomic** - checks and updates in single operation
- No gap between check and decrement = no race condition
- Transaction ensures all items reserve together or all fail

## 🎯 Race Condition Prevention

### After Fix

```
Time    User A                                  User B                                  Stock
----    ----------------------------------      ----------------------------------      -----
T1      Start Transaction                       -                                      1
T2      -                                       Start Transaction                      1
T3      reserveStock() - Lock & Decrement ✅   -                                      0
T4      Commit Transaction                      -                                      0
T5      -                                       reserveStock() - FAIL ❌               0
                                                (inStock < quantity)
```

**Result:** Only User A succeeds. User B receives proper error: "Insufficient stock".

## 🧪 Testing

### Manual Test Scenarios

1. **Concurrent Checkouts (Same Product)**
   ```bash
   # Terminal 1
   curl -X POST http://localhost:3000/api/payment/checkout \
     -H "Authorization: Bearer <token1>" \
     -d '{"cart":[{"productId":"123","quantity":1}],...}'

   # Terminal 2 (simultaneously)
   curl -X POST http://localhost:3000/api/payment/checkout \
     -H "Authorization: Bearer <token2>" \
     -d '{"cart":[{"productId":"123","quantity":1}],...}'
   ```
   
   **Expected:** One succeeds, one fails with "Insufficient stock"

2. **Payment Failure Recovery**
   - Checkout product (stock decremented)
   - Simulate Stripe payment failure
   - Verify stock is released back

3. **Payment Cancellation**
   - Checkout product
   - Cancel payment before completion
   - Verify stock is released

### Load Testing

```bash
# Install Artillery
npm install -g artillery

# Run concurrent checkout test
artillery quick --count 50 --num 10 http://localhost:3000/api/payment/checkout
```

**Expected:** No negative stock values in database.

## ⚠️ Important Notes

### Transaction Requirements

1. **MongoDB Replica Set Required**
   ```javascript
   // Transactions only work with replica sets
   // For development: Start MongoDB with --replSet flag
   mongod --replSet rs0
   ```

2. **Connection String**
   ```
   MONGODB_URI=mongodb://localhost:27017/ecommerce?replicaSet=rs0
   ```

### Performance Considerations

- **Transaction Overhead:** ~2-5ms per transaction
- **Lock Duration:** Minimal (atomic operations)
- **Retry Logic:** Already handled by MongoDB driver

### Error Handling

```javascript
// Errors that trigger rollback:
- Insufficient stock
- Product not found
- Product not published
- Order creation failure
- Database connection error

// All changes are automatically reverted on error
```

## 🚀 Deployment Checklist

- [ ] MongoDB replica set configured
- [ ] Connection string includes `replicaSet` parameter
- [ ] Test concurrent checkouts in staging
- [ ] Monitor transaction duration metrics
- [ ] Set up alerts for transaction failures
- [ ] Document stock reconciliation procedure (just in case)

## 📊 Monitoring

### Key Metrics to Track

1. **Transaction Duration**
   ```javascript
   const start = Date.now();
   await session.commitTransaction();
   console.log(`Transaction took ${Date.now() - start}ms`);
   ```

2. **Transaction Failures**
   ```javascript
   // Log all aborted transactions
   await session.abortTransaction();
   logger.error('Transaction aborted', { orderId, error });
   ```

3. **Stock Levels**
   - Alert when any product reaches 0 stock
   - Alert if any product goes negative (should never happen)

## 🔄 Rollback Scenarios

### Automatic Rollback (by Transaction)

1. Stock reservation fails → No order created
2. Order creation fails → Stock released
3. Network error → All changes reverted

### Manual Rollback (Payment Webhooks)

1. Payment failed → `releaseStock()` called
2. Payment canceled → `releaseStock()` called
3. Refund processed → Stock not changed (item already sold)

## 📝 Future Improvements

1. **Optimistic Locking** for high-traffic scenarios
2. **Reserved Stock Timeout** (15 min limit for payment)
3. **Stock Reconciliation Job** (nightly audit)
4. **Real-time Stock Notifications** via WebSocket

## 🆘 Troubleshooting

### Error: "Transaction numbers are only allowed on a replica set member"

**Solution:**
```bash
# Initialize replica set
mongosh
> rs.initiate()
```

### Error: "MongoServerError: Transaction timed out"

**Solution:**
```javascript
// Increase transaction timeout
session.startTransaction({
    maxCommitTimeMS: 30000 // 30 seconds
});
```

### Stock Mismatch After Recovery

**Solution:**
```javascript
// Run stock reconciliation script
node scripts/reconcileStock.js
```

## 📚 References

- [MongoDB Transactions Documentation](https://docs.mongodb.com/manual/core/transactions/)
- [Mongoose Transactions Guide](https://mongoosejs.com/docs/transactions.html)
- [ACID Properties Explained](https://en.wikipedia.org/wiki/ACID)

---

**Last Updated:** 2024-01-XX  
**Author:** Development Team  
**Status:** ✅ Implemented & Tested
