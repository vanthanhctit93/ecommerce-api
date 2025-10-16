# Bulk Operations Documentation

## Overview

Bulk Operations cho phép bạn thực hiện các thao tác trên nhiều sản phẩm cùng lúc, tiết kiệm thời gian và tối ưu performance.

## Features

### 1. Bulk Update ✅
Cập nhật nhiều sản phẩm cùng lúc với các thông tin giống nhau.

**Endpoint:** `PUT /product/bulk-update`

**Use Cases:**
- Thay đổi giá hàng loạt
- Cập nhật tồn kho cho nhiều sản phẩm
- Thay đổi trạng thái publish
- Set featured products

### 2. Bulk Delete ✅
Xóa nhiều sản phẩm cùng lúc (soft delete).

**Endpoint:** `DELETE /product/bulk-delete`

**Use Cases:**
- Xóa sản phẩm hết hạn
- Cleanup products out of stock lâu ngày
- Remove discontinued products

### 3. Bulk Publish/Unpublish ✅
Xuất bản hoặc ẩn nhiều sản phẩm cùng lúc.

**Endpoint:** `PUT /product/bulk-publish`

**Use Cases:**
- Launch campaign (publish nhiều sản phẩm sale)
- Hide products tạm thời
- Seasonal product management

### 4. Bulk Restore ✅
Khôi phục nhiều sản phẩm đã xóa cùng lúc.

**Endpoint:** `PUT /product/bulk-restore`

**Use Cases:**
- Undo bulk delete by mistake
- Restore seasonal products
- Re-activate discontinued products

## Implementation Details

### Security
- ✅ **Authentication Required:** Tất cả endpoints yêu cầu JWT token
- ✅ **Authorization:** Chỉ product owner mới có quyền bulk operations
- ✅ **Ownership Check:** Kiểm tra từng product trước khi thực hiện
- ✅ **Input Validation:** Validate tất cả inputs (productIds, updates)

### Performance
- ✅ **MongoDB updateMany():** Sử dụng atomic operation
- ✅ **Batch Processing:** Xử lý nhiều records trong 1 query
- ✅ **Optimized Queries:** Có indexes trên owner và isDeleted fields

### Error Handling
- ✅ **Detailed Error Codes:** Mỗi error có code riêng
- ✅ **Partial Success:** Báo số lượng thành công vs thất bại
- ✅ **Rollback Safe:** Soft delete cho phép rollback

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| PUT | `/product/bulk-update` | Update nhiều products | Private |
| DELETE | `/product/bulk-delete` | Delete nhiều products | Private |
| PUT | `/product/bulk-publish` | Publish/Unpublish nhiều products | Private |
| PUT | `/product/bulk-restore` | Restore nhiều deleted products | Private |

## Request Examples

See [bulk-operations-examples.md](./bulk-operations-examples.md) for detailed examples.

## Response Format

All bulk operations return consistent format:

### Success Response
```json
{
  "status_code": 1,
  "data": {
    "matchedCount": 10,      // Số products matched query
    "modifiedCount": 8,       // Số products đã update thành công
    "deletedCount": 8,        // (Chỉ bulk-delete) Số products đã xóa
    "restoredCount": 5,       // (Chỉ bulk-restore) Số products đã restore
    "message": "Đã cập nhật 8 sản phẩm"
  }
}
```

### Error Response
```json
{
  "status_code": 0,
  "data": {
    "error_code": 3,
    "message": "Bạn không có quyền cập nhật một số sản phẩm"
  }
}
```

## Best Practices

### 1. Batch Size
```javascript
// ❌ BAD: Too many products at once
const productIds = getAllProducts(); // 10,000 products
bulkUpdate(productIds, updates);

// ✅ GOOD: Process in batches
const batchSize = 100;
for (let i = 0; i < productIds.length; i += batchSize) {
  const batch = productIds.slice(i, i + batchSize);
  await bulkUpdate(batch, updates);
  await sleep(1000); // Delay between batches
}
```

### 2. Error Handling
```javascript
// ✅ GOOD: Handle partial success
try {
  const response = await bulkUpdate(productIds, updates);
  
  if (response.data.modifiedCount < productIds.length) {
    console.warn(`Only ${response.data.modifiedCount}/${productIds.length} products updated`);
    // Handle partial failure
  }
} catch (error) {
  // Handle complete failure
  console.error('Bulk update failed:', error);
}
```

### 3. Validation Before Bulk Operations
```javascript
// ✅ GOOD: Validate before bulk operation
const productsToUpdate = await validateProductIds(productIds);

if (productsToUpdate.length !== productIds.length) {
  console.warn('Some products are invalid');
}

await bulkUpdate(productsToUpdate, updates);
```

## Limitations

1. **Max Products per Request:** Recommended 100-500 products
2. **Ownership:** Can only operate on own products
3. **Soft Delete:** Deleted products not permanently removed
4. **Rate Limiting:** Subject to API rate limits (100 req/15min)

## Future Enhancements

- [ ] Bulk upload from CSV
- [ ] Scheduled bulk operations
- [ ] Bulk operations history/audit log
- [ ] Undo last bulk operation
- [ ] Bulk operations with filters (không cần productIds)
- [ ] Email notification after bulk operations

## Support

For issues or questions:
- Check [bulk-operations-examples.md](./bulk-operations-examples.md)
- Review error codes in examples
- Contact API support team
