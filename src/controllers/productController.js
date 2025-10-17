import mongoose from 'mongoose';
import ProductModel from '../models/Product.js';
import { isValidSKU } from '../utils/validators.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { 
    sendSuccess, 
    sendError, 
    sendNotFound, 
    sendValidationError,
    sendUnauthorized,
    sendServerError 
} from '../utils/responseHelper.js';

// ✅ ADD MISSING IMPORTS
import { deleteCachePattern } from '../config/redis.js';
import {
    PRODUCT_STATUS,
    PRODUCT_LIMITS,
    PAGINATION,
    ERROR_MESSAGES,
    ERROR_CODE,
    HTTP_STATUS
} from '../constants/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createProduct = async (req, res, next) => {
    try {
        const { 
            sku, 
            title, 
            thumbnail, 
            description, 
            salePrice, 
            regularPrice,
            inStock = 0,
            isPublished = true,
            isFeatured = false
        } = req.body;

        // Validation
        if (!sku || !title || !regularPrice) {
            return sendValidationError(res, ERROR_MESSAGES.MISSING_REQUIRED_FIELDS);
        }

        if (regularPrice < PRODUCT_LIMITS.MIN_PRICE) {
            return sendValidationError(res, 'Giá sản phẩm không thể âm');
        }

        if (salePrice && salePrice < PRODUCT_LIMITS.MIN_PRICE) {
            return sendValidationError(res, 'Giá sale không thể âm');
        }

        if (salePrice && salePrice > regularPrice) {
            return sendValidationError(res, 'Giá sale không thể lớn hơn giá gốc');
        }

        if (inStock < PRODUCT_LIMITS.MIN_PRICE) {
            return sendValidationError(res, 'Số lượng tồn kho không thể âm');
        }

        if (!isValidSKU(sku)) {
            return sendValidationError(res, 'SKU không hợp lệ (chỉ chữ hoa, số, dấu gạch ngang, 3-50 ký tự)');
        }

        const existingProduct = await ProductModel.findOne({ sku });

        if (existingProduct) {
            return res.status(HTTP_STATUS.CONFLICT).json({ 
                status_code: 0,
                data: {
                    error_code: ERROR_CODE.DUPLICATE_ERROR,
                    message: 'SKU đã tồn tại' 
                }
            });
        }

        const product = new ProductModel({
            sku,
            title,
            thumbnail,
            description,
            salePrice,
            regularPrice,
            inStock,
            isPublished,
            isFeatured,
            owner: req.user._id 
        });

        await product.save();
        await deleteCachePattern('cache:/product/list*');

        return sendSuccess(res, { product }, 'Tạo sản phẩm thành công', HTTP_STATUS.CREATED);
    } catch (err) {
        console.error('Create product error:', err);
        next(err);
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = parseInt(req.query.limit) || PAGINATION.PRODUCT_DEFAULT_LIMIT;
        const skip = (page - 1) * limit;

        // Filters
        const filters = { isDeleted: false };
        
        if (req.query.category) {
            filters.categories = req.query.category;
        }
        
        if (req.query.isPublished !== undefined) {
            filters.isPublished = req.query.isPublished === 'true';
        }
        
        if (req.query.isFeatured !== undefined) {
            filters.isFeatured = req.query.isFeatured === 'true';
        }

        // Price range filter
        if (req.query.minPrice || req.query.maxPrice) {
            filters.regularPrice = {};
            if (req.query.minPrice) {
                filters.regularPrice.$gte = parseInt(req.query.minPrice);
            }
            if (req.query.maxPrice) {
                filters.regularPrice.$lte = parseInt(req.query.maxPrice);
            }
        }

        // Sort
        let sort = { createdAt: -1 };
        if (req.query.sort === 'price_asc') {
            sort = { regularPrice: 1 };
        } else if (req.query.sort === 'price_desc') {
            sort = { regularPrice: -1 };
        } else if (req.query.sort === 'popular') {
            sort = { soldCount: -1 };
        }

        const products = await ProductModel.find(filters)
            .populate('categories', 'name slug')
            .populate('owner', 'username')
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await ProductModel.countDocuments(filters);

        return sendSuccess(res, {
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Get products error:', err);
        return sendServerError(res, ERROR_MESSAGES[ERROR_CODE.SERVER_ERROR]);
    }
};

/**
 * Get product by ID
 */
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await ProductModel.findById(id); 

        if (!product) {
            return res.status(404).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Sản phẩm không tồn tại' 
                }
            });
        } 
        
        return res.status(200).json({
            status_code: 1,
            data: {
                product
            }
        });
    } catch (err) {
        console.error('Get product error:', err);
        return res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi lấy thông tin sản phẩm'
            }
        });
    }
};

/**
 * Update product
 */
export const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { inStock, ...otherUpdates } = req.body;

        const product = await ProductModel.findById(id);

        if (!product) {
            return sendNotFound(res, 'Sản phẩm không tồn tại');
        }

        if (product.owner.toString() !== req.user._id.toString()) {
            return sendUnauthorized(res, 'Bạn không có quyền sửa sản phẩm này');
        }

        if (inStock !== undefined) {
            if (inStock < 0) {
                return sendError(res, 3, 'Số lượng tồn kho không thể âm');
            }
            product.inStock = inStock;
        }

        Object.assign(product, otherUpdates);
        await product.save();
        
        await deleteCachePattern('cache:/product/list*');
        await deleteCachePattern(`cache:/product/${id}`);

        return sendSuccess(res, { product }, 'Cập nhật sản phẩm thành công');
    } catch (err) {
        console.error('Update product error:', err);
        next(err);
    }
};

/**
 * Delete product (soft delete)
 */
export const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await ProductModel.findById(id);

        if (!product || product.isDeleted) {
            return sendNotFound(res, 'Sản phẩm không tồn tại');
        }

        if (product.owner.toString() !== req.user._id.toString()) {
            return sendUnauthorized(res, 'Bạn không có quyền xóa sản phẩm này');
        }

        product.isDeleted = true;
        product.deletedAt = Date.now();
        product.deletedBy = req.user._id;
        await product.save();

        await deleteCachePattern('cache:/product/list*');
        await deleteCachePattern(`cache:/product/${id}`);

        return sendSuccess(res, {}, 'Xóa sản phẩm thành công');
    } catch (err) {
        next(err);
    }
};

/**
 * Restore product
 */
export const restoreProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await ProductModel.findOne({ 
            _id: id,
            isDeleted: true,
            owner: req.user._id
        });

        if (!product) {
            return res.status(404).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Sản phẩm không tồn tại hoặc chưa bị xóa' 
                }
            });
        }

        product.isDeleted = false;
        product.deletedAt = null;
        product.deletedBy = null;
        await product.save();

        return res.status(200).json({ 
            status_code: 1,
            data: {
                product,
                message: 'Khôi phục sản phẩm thành công'
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Bulk update products (Cập nhật nhiều sản phẩm cùng lúc)
 * @route PUT /product/bulk-update
 * @access Private
 */
export const bulkUpdateProducts = async (req, res, next) => {
    try {
        const { productIds, updates } = req.body;

        // Validation
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Danh sách sản phẩm không hợp lệ' 
                }
            });
        }

        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Không có thông tin cập nhật' 
                }
            });
        }

        // Kiểm tra ownership - chỉ update sản phẩm của user hiện tại
        const products = await ProductModel.find({
            _id: { $in: productIds },
            owner: req.user._id,
            isDeleted: false
        });

        if (products.length !== productIds.length) {
            return res.status(403).json({ 
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Bạn không có quyền cập nhật một số sản phẩm hoặc sản phẩm không tồn tại' 
                }
            });
        }

        // Validation giá tiền nếu có trong updates
        if (updates.regularPrice !== undefined && updates.regularPrice < 0) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 4,
                    message: 'Giá sản phẩm không thể âm' 
                }
            });
        }

        if (updates.salePrice !== undefined) {
            if (updates.salePrice < 0) {
                return res.status(400).json({ 
                    status_code: 0,
                    data: {
                        error_code: 5,
                        message: 'Giá sale không thể âm' 
                    }
                });
            }
        }

        if (updates.inStock !== undefined && updates.inStock < 0) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 6,
                    message: 'Số lượng tồn kho không thể âm' 
                }
            });
        }

        // Perform bulk update
        const result = await ProductModel.updateMany(
            { 
                _id: { $in: productIds }, 
                owner: req.user._id,
                isDeleted: false
            },
            { $set: updates }
        );

        return res.status(200).json({ 
            status_code: 1,
            data: {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
                message: `Đã cập nhật ${result.modifiedCount} sản phẩm`
            }
        });
    } catch (err) {
        console.error('Bulk update error:', err);
        next(err);
    }
};

/**
 * Bulk delete products (Xóa nhiều sản phẩm cùng lúc - soft delete)
 * @route DELETE /product/bulk-delete
 * @access Private
 */
export const bulkDeleteProducts = async (req, res, next) => {
    try {
        const { productIds } = req.body;

        // Validation
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Danh sách sản phẩm không hợp lệ' 
                }
            });
        }

        // Kiểm tra ownership
        const products = await ProductModel.find({
            _id: { $in: productIds },
            owner: req.user._id,
            isDeleted: false
        });

        if (products.length === 0) {
            return res.status(404).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Không tìm thấy sản phẩm nào hoặc đã bị xóa' 
                }
            });
        }

        // Perform bulk soft delete
        const result = await ProductModel.updateMany(
            { 
                _id: { $in: productIds }, 
                owner: req.user._id,
                isDeleted: false
            },
            { 
                $set: { 
                    isDeleted: true, 
                    deletedAt: Date.now(),
                    deletedBy: req.user._id
                }
            }
        );

        return res.status(200).json({ 
            status_code: 1,
            data: {
                deletedCount: result.modifiedCount,
                message: `Đã xóa ${result.modifiedCount} sản phẩm`
            }
        });
    } catch (err) {
        console.error('Bulk delete error:', err);
        next(err);
    }
};

/**
 * Bulk publish/unpublish products
 * @route PUT /product/bulk-publish
 * @access Private
 */
export const bulkPublishProducts = async (req, res, next) => {
    try {
        const { productIds, isPublished } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Danh sách sản phẩm không hợp lệ' 
                }
            });
        }

        if (typeof isPublished !== 'boolean') {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Trạng thái publish không hợp lệ' 
                }
            });
        }

        // Kiểm tra ownership
        const products = await ProductModel.find({
            _id: { $in: productIds },
            owner: req.user._id,
            isDeleted: false
        });

        if (products.length === 0) {
            return res.status(404).json({ 
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Không tìm thấy sản phẩm nào' 
                }
            });
        }

        const result = await ProductModel.updateMany(
            { 
                _id: { $in: productIds }, 
                owner: req.user._id,
                isDeleted: false
            },
            { $set: { isPublished } }
        );

        return res.status(200).json({ 
            status_code: 1,
            data: {
                modifiedCount: result.modifiedCount,
                message: `Đã ${isPublished ? 'xuất bản' : 'ẩn'} ${result.modifiedCount} sản phẩm`
            }
        });
    } catch (err) {
        console.error('Bulk publish error:', err);
        next(err);
    }
};

/**
 * Bulk restore deleted products
 * @route PUT /product/bulk-restore
 * @access Private
 */
export const bulkRestoreProducts = async (req, res, next) => {
    try {
        const { productIds } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Danh sách sản phẩm không hợp lệ' 
                }
            });
        }

        // Kiểm tra ownership và product đã bị xóa
        const products = await ProductModel.find({
            _id: { $in: productIds },
            owner: req.user._id,
            isDeleted: true
        });

        if (products.length === 0) {
            return res.status(404).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Không tìm thấy sản phẩm nào hoặc sản phẩm chưa bị xóa' 
                }
            });
        }

        const result = await ProductModel.updateMany(
            { 
                _id: { $in: productIds }, 
                owner: req.user._id,
                isDeleted: true
            },
            { 
                $set: { 
                    isDeleted: false,
                    deletedAt: null,
                    deletedBy: null
                }
            }
        );

        return res.status(200).json({ 
            status_code: 1,
            data: {
                restoredCount: result.modifiedCount,
                message: `Đã khôi phục ${result.modifiedCount} sản phẩm`
            }
        });
    } catch (err) {
        console.error('Bulk restore error:', err);
        next(err);
    }
};

/**
 * Upload product images
 * @route POST /product/upload-images/:id
 * @access Private
 */
export const uploadProductImages = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Tìm sản phẩm
        const product = await ProductModel.findById(id);

        if (!product) {
            // Xóa files đã upload nếu product không tồn tại
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    await fs.unlink(file.path).catch(console.error);
                }
            }
            
            return res.status(404).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Sản phẩm không tồn tại' 
                }
            });
        }

        // Kiểm tra ownership
        if (product.owner.toString() !== req.user._id.toString()) {
            // Xóa files đã upload
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    await fs.unlink(file.path).catch(console.error);
                }
            }
            
            return res.status(403).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Bạn không có quyền upload ảnh cho sản phẩm này' 
                }
            });
        }

        // Kiểm tra có files không
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Vui lòng chọn ảnh để upload' 
                }
            });
        }

        // Tạo image objects
        const images = req.files.map((file, index) => ({
            url: `/uploads/products/${file.filename}`,
            alt: product.title,
            isPrimary: index === 0 && (!product.images || product.images.length === 0)
        }));

        // Thêm vào product (khởi tạo array nếu chưa có)
        if (!product.images) {
            product.images = [];
        }
        product.images.push(...images);

        // Set thumbnail nếu chưa có
        if (!product.thumbnail && images.length > 0) {
            product.thumbnail = images[0].url;
        }

        await product.save();

        return res.status(200).json({ 
            status_code: 1,
            data: {
                images,
                product,
                imageStats: req.imageStats || [], 
                message: `Upload thành công ${images.length} ảnh`
            }
        });
    } catch (err) {
        console.error('Upload images error:', err);
        
        // Xóa files nếu có lỗi
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await fs.unlink(file.path).catch(console.error);
            }
        }
        
        next(err);
    }
};

/**
 * Delete product image
 * @route DELETE /product/delete-image/:id
 * @access Private
 */
export const deleteProductImage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Image URL không được cung cấp' 
                }
            });
        }

        const product = await ProductModel.findById(id);

        if (!product) {
            return res.status(404).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Sản phẩm không tồn tại' 
                }
            });
        }

        if (product.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Bạn không có quyền xóa ảnh này' 
                }
            });
        }

        // Tìm và xóa image
        if (!product.images || product.images.length === 0) {
            return res.status(404).json({ 
                status_code: 0,
                data: {
                    error_code: 4,
                    message: 'Sản phẩm không có ảnh nào' 
                }
            });
        }

        const imageIndex = product.images.findIndex(img => img.url === imageUrl);
        
        if (imageIndex === -1) {
            return res.status(404).json({ 
                status_code: 0,
                data: {
                    error_code: 5,
                    message: 'Ảnh không tồn tại trong sản phẩm' 
                }
            });
        }

        // Xóa file từ disk
        const filename = path.basename(imageUrl);
        const filePath = path.join(__dirname, '../../uploads/products', filename);
        
        try {
            await fs.unlink(filePath);
            console.log('Deleted file:', filePath);
        } catch (error) {
            console.error('Error deleting file:', error);
            // Continue even if file deletion fails
        }

        // Xóa khỏi array
        product.images.splice(imageIndex, 1);

        // Nếu xóa thumbnail, set lại thumbnail
        if (product.thumbnail === imageUrl) {
            product.thumbnail = product.images.length > 0 ? product.images[0].url : null;
        }

        await product.save();

        return res.status(200).json({ 
            status_code: 1,
            data: {
                product,
                message: 'Xóa ảnh thành công'
            }
        });
    } catch (err) {
        console.error('Delete image error:', err);
        next(err);
    }
};

/**
 * Set primary image
 * @route PUT /product/set-primary-image/:id
 * @access Private
 */
export const setPrimaryImage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Image URL không được cung cấp' 
                }
            });
        }

        const product = await ProductModel.findById(id);

        if (!product) {
            return res.status(404).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Sản phẩm không tồn tại' 
                }
            });
        }

        if (product.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Bạn không có quyền thay đổi ảnh chính' 
                }
            });
        }

        if (!product.images || product.images.length === 0) {
            return res.status(404).json({ 
                status_code: 0,
                data: {
                    error_code: 4,
                    message: 'Sản phẩm không có ảnh nào' 
                }
            });
        }

        // Reset tất cả isPrimary
        product.images.forEach(img => {
            img.isPrimary = false;
        });

        // Set primary cho ảnh được chọn
        const selectedImage = product.images.find(img => img.url === imageUrl);
        
        if (!selectedImage) {
            return res.status(404).json({ 
                status_code: 0,
                data: {
                    error_code: 5,
                    message: 'Ảnh không tồn tại trong sản phẩm' 
                }
            });
        }

        selectedImage.isPrimary = true;
        product.thumbnail = imageUrl;

        await product.save();

        return res.status(200).json({ 
            status_code: 1,
            data: {
                product,
                message: 'Đặt ảnh chính thành công'
            }
        });
    } catch (err) {
        console.error('Set primary image error:', err);
        next(err);
    }
};
