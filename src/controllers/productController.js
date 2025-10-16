import ProductModel from '../models/Product.js';

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
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Vui lòng nhập đầy đủ thông tin (sku, title, regularPrice)' 
                }
            });
        }

        const existingProduct = await ProductModel.findOne({ sku });

        if (existingProduct) {
            return res.status(400).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
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

        return res.status(201).json({ 
            status_code: 1,
            data: {
                product,
                message: 'Tạo sản phẩm thành công'
            }
        });
    } catch (err) {
        console.error('Create product error:', err);
        next(err);
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const products = await ProductModel.find();

        return res.status(200).json({ 
            status_code: 1,
            data: {
                products
            }
        });
    } catch (err) {
        console.error('Get products error:', err);
        return res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi lấy danh sách sản phẩm'
            }
        });
    }
}

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
}

export const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { 
            sku, 
            title, 
            thumbnail, 
            description, 
            salePrice, 
            regularPrice,
            inStock,
            isPublished,
            isFeatured
        } = req.body;

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

        if (product.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Bạn không có quyền sửa sản phẩm này' 
                }
            });
        }

        // Cập nhật từng field
        if (sku) product.sku = sku;
        if (title) product.title = title;
        if (thumbnail) product.thumbnail = thumbnail;
        if (description) product.description = description;
        if (salePrice !== undefined) product.salePrice = salePrice;
        if (regularPrice !== undefined) product.regularPrice = regularPrice;
        if (inStock !== undefined) product.inStock = inStock;
        if (isPublished !== undefined) product.isPublished = isPublished;
        if (isFeatured !== undefined) product.isFeatured = isFeatured;

        await product.save();

        return res.status(200).json({ 
            status_code: 1,
            data: {
                product,
                message: 'Cập nhật sản phẩm thành công'
            }
        });
    } catch (err) {
        console.error('Update product error:', err);
        next(err);
    }
};

export const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await ProductModel.findById(id);

        if (!product) {
            return res.status(200).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Sản phẩm không tồn tại' 
                }
            });
        }

        if (product.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Bạn không có quyền xóa sản phẩm này' 
                }
            });
        }

        await product.deleteOne();

        return res.status(200).json({ 
            status_code: 1,
            data: {
                message: 'Xóa sản phẩm thành công'
            }
        });
    } catch (err) {
        next(err);
    }
}
