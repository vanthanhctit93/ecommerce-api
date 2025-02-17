const ProductModel = require('../models/Product');

const createProduct = async (req, res) => {
    try {
        const { sku, title, thumbnail, description, price } = req.body;

        if (!sku || !title || !thumbnail || !description || !price) {
            return res.status(200).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Vui lòng nhập đầy đủ thông tin' 
                }
            });
        }

        const existingProduct = await ProductModel.findOne({ sku });

        if (existingProduct) {
            return res.status(200).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Sản phẩm đã tồn tại' 
                }
            });
        }

        const product = new ProductModel({
            sku,
            title,
            thumbnail,
            description,
            price
        });

        await product.save();

        return res.status(200).json({ 
            status_code: 1,
            data: {
                product
            }
        });
    } catch (err) {
        next(err);
    }
}

const getAllProducts = async (req, res) => {
    try {
        const products = await ProductModel.find();

        return res.status(200).json({ 
            status_code: 1,
            data: {
                products
            }
        });
    } catch (err) {
        next(err);
    }
}

const getProductById = async (req, res) => {
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
        
        return res.status(200).json({
            status_code: 1,
            data: {
                product
            }
        });
    } catch (err) {
        next(err);
    }
}

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { sku, title, thumbnail, description, price } = req.body;

        const product = await ProductModel.findByIdAndUpdate(id);

        product.sku = sku;
        product.title = title;
        product.thumbnail = thumbnail;
        product.description = description;
        product.price = price;

        await product.save();

        return res.status(200).json({ 
            status_code: 1,
            data: {
                product
            }
        });
    } catch (err) {
        next(err);
    }
}

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        await ProductModel.findByIdAndDelete(id);

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

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };