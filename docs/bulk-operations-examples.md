# Bulk Operations API Examples

## 1. Bulk Update Products

Cập nhật nhiều sản phẩm cùng lúc.

### Request

```http
PUT http://localhost:8000/product/bulk-update
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Body

```json
{
  "productIds": [
    "67890abc123def456",
    "67890abc123def457",
    "67890abc123def458"
  ],
  "updates": {
    "isPublished": true,
    "isFeatured": false,
    "lowStockThreshold": 5,
    "inStock": 100
  }
}
```

### Response Success (200)

```json
{
  "status_code": 1,
  "data": {
    "matchedCount": 3,
    "modifiedCount": 3,
    "message": "Đã cập nhật 3 sản phẩm"
  }
}
```

### Response Error - Invalid Products (400)

```json
{
  "status_code": 0,
  "data": {
    "error_code": 1,
    "message": "Danh sách sản phẩm không hợp lệ"
  }
}
```

### Response Error - No Updates (400)

```json
{
  "status_code": 0,
  "data": {
    "error_code": 2,
    "message": "Không có thông tin cập nhật"
  }
}
```

### Response Error - Unauthorized (403)

```json
{
  "status_code": 0,
  "data": {
    "error_code": 3,
    "message": "Bạn không có quyền cập nhật một số sản phẩm hoặc sản phẩm không tồn tại"
  }
}
```

---

## 2. Bulk Delete Products

Xóa nhiều sản phẩm cùng lúc (soft delete).

### Request

```http
DELETE http://localhost:8000/product/bulk-delete
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Body

```json
{
  "productIds": [
    "67890abc123def456",
    "67890abc123def457"
  ]
}
```

### Response Success (200)

```json
{
  "status_code": 1,
  "data": {
    "deletedCount": 2,
    "message": "Đã xóa 2 sản phẩm"
  }
}
```

### Response Error - Not Found (404)

```json
{
  "status_code": 0,
  "data": {
    "error_code": 2,
    "message": "Không tìm thấy sản phẩm nào hoặc đã bị xóa"
  }
}
```

---

## 3. Bulk Publish/Unpublish Products

Xuất bản hoặc ẩn nhiều sản phẩm cùng lúc.

### Request - Publish

```http
PUT http://localhost:8000/product/bulk-publish
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Body - Publish

```json
{
  "productIds": [
    "67890abc123def456",
    "67890abc123def457",
    "67890abc123def458"
  ],
  "isPublished": true
}
```

### Body - Unpublish

```json
{
  "productIds": [
    "67890abc123def456",
    "67890abc123def457"
  ],
  "isPublished": false
}
```

### Response Success (200)

```json
{
  "status_code": 1,
  "data": {
    "modifiedCount": 3,
    "message": "Đã xuất bản 3 sản phẩm"
  }
}
```

### Response Error - Invalid Status (400)

```json
{
  "status_code": 0,
  "data": {
    "error_code": 2,
    "message": "Trạng thái publish không hợp lệ"
  }
}
```

---

## 4. Bulk Restore Products

Khôi phục nhiều sản phẩm đã xóa cùng lúc.

### Request

```http
PUT http://localhost:8000/product/bulk-restore
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Body

```json
{
  "productIds": [
    "67890abc123def456",
    "67890abc123def457"
  ]
}
```

### Response Success (200)

```json
{
  "status_code": 1,
  "data": {
    "restoredCount": 2,
    "message": "Đã khôi phục 2 sản phẩm"
  }
}
```

### Response Error - Not Found (404)

```json
{
  "status_code": 0,
  "data": {
    "error_code": 2,
    "message": "Không tìm thấy sản phẩm nào hoặc sản phẩm chưa bị xóa"
  }
}
```

---

## Use Cases - Khi nào dùng Bulk Operations?

### 1. **Admin Panel - Quản lý nhiều sản phẩm**

```javascript
// User chọn nhiều sản phẩm trong table
const selectedProducts = [
  '67890abc123def456',
  '67890abc123def457',
  '67890abc123def458'
];

// Click "Publish All"
await fetch('http://localhost:8000/product/bulk-publish', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productIds: selectedProducts,
    isPublished: true
  })
});
```

### 2. **Bulk Import - Cập nhật giá cho nhiều sản phẩm**

```javascript
// Upload CSV file với giá mới
const updates = {
  regularPrice: 199000,
  salePrice: 149000
};

const productIds = ['id1', 'id2', 'id3', ...]; // From CSV

await fetch('http://localhost:8000/product/bulk-update', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productIds,
    updates
  })
});
```

### 3. **Seasonal Sales - Featured Products**

```javascript
// Đặt tất cả sản phẩm sale làm "Featured"
const saleProductIds = await fetchSaleProducts();

await fetch('http://localhost:8000/product/bulk-update', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productIds: saleProductIds,
    updates: {
      isFeatured: true
    }
  })
});
```

### 4. **Cleanup - Xóa sản phẩm hết hàng lâu**

```javascript
// Xóa tất cả sản phẩm out of stock > 6 tháng
const oldOutOfStockProducts = await fetchOldOutOfStockProducts();

await fetch('http://localhost:8000/product/bulk-delete', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productIds: oldOutOfStockProducts.map(p => p._id)
  })
});
```

---

## Testing với curl

### Bulk Update

```bash
curl -X PUT http://localhost:8000/product/bulk-update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["67890abc123def456", "67890abc123def457"],
    "updates": {
      "isPublished": true,
      "inStock": 50
    }
  }'
```

### Bulk Delete

```bash
curl -X DELETE http://localhost:8000/product/bulk-delete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["67890abc123def456", "67890abc123def457"]
  }'
```

### Bulk Publish

```bash
curl -X PUT http://localhost:8000/product/bulk-publish \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["67890abc123def456", "67890abc123def457"],
    "isPublished": true
  }'
```

### Bulk Restore

```bash
curl -X PUT http://localhost:8000/product/bulk-restore \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["67890abc123def456", "67890abc123def457"]
  }'
```

---

## Error Codes Reference

| Error Code | Message | Description |
|------------|---------|-------------|
| 0 | Lỗi server | Lỗi không xác định từ server |
| 1 | Danh sách sản phẩm không hợp lệ | productIds không phải array hoặc rỗng |
| 2 | Không có thông tin cập nhật / Không tìm thấy sản phẩm | updates object rỗng hoặc không tìm thấy product |
| 3 | Không có quyền | User không sở hữu một số products |
| 4 | Giá sản phẩm không thể âm | regularPrice < 0 |
| 5 | Giá sale không thể âm | salePrice < 0 |
| 6 | Số lượng tồn kho không thể âm | inStock < 0 |

---

## Notes

1. **Ownership Check**: Tất cả bulk operations đều kiểm tra ownership. User chỉ có thể thao tác với sản phẩm của mình.

2. **Soft Delete**: Bulk delete sử dụng soft delete (isDeleted = true), không xóa vĩnh viễn khỏi database.

3. **Atomic Operations**: Mỗi bulk operation sử dụng `updateMany()` của MongoDB, đảm bảo tính atomic.

4. **Validation**: Tất cả inputs đều được validate trước khi thực hiện operation.

5. **Error Handling**: Mỗi operation có error codes riêng để dễ debug và xử lý lỗi.
