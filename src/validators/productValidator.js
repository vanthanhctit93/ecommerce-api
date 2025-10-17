import Joi from 'joi';

export const createProductSchema = Joi.object({
    sku: Joi.string()
        .pattern(/^[A-Z0-9-]{3,50}$/)
        .required()
        .messages({
            'string.pattern.base': 'SKU chỉ chứa chữ hoa, số và dấu gạch ngang',
            'any.required': 'SKU là bắt buộc'
        }),
    
    title: Joi.string()
        .min(3)
        .max(200)
        .required()
        .messages({
            'string.min': 'Tiêu đề tối thiểu 3 ký tự',
            'string.max': 'Tiêu đề tối đa 200 ký tự'
        }),
    
    regularPrice: Joi.number()
        .min(0)
        .required(),
    
    salePrice: Joi.number()
        .min(0)
        .less(Joi.ref('regularPrice'))
        .messages({
            'number.less': 'Giá sale phải nhỏ hơn giá gốc'
        })
        .optional(),
    
    inStock: Joi.number()
        .integer()
        .min(0)
        .required(),
    
    categories: Joi.array()
        .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
        .min(1)
        .required()
});

export const updateProductSchema = createProductSchema.fork(
    ['sku', 'title', 'regularPrice', 'inStock', 'categories'],
    (schema) => schema.optional()
);