/**
 * ========================================
 *              ORDER CONSTANTS
 * ========================================
 */
export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
};

export const ORDER_STATUS_LABELS = {
    [ORDER_STATUS.PENDING]: 'Chờ xác nhận',
    [ORDER_STATUS.CONFIRMED]: 'Đã xác nhận',
    [ORDER_STATUS.PROCESSING]: 'Đang xử lý',
    [ORDER_STATUS.SHIPPED]: 'Đang giao',
    [ORDER_STATUS.DELIVERED]: 'Đã giao',
    [ORDER_STATUS.CANCELLED]: 'Đã hủy',
    [ORDER_STATUS.REFUNDED]: 'Đã hoàn tiền'
};

// Trạng thái không thể hủy
export const NON_CANCELLABLE_ORDER_STATUSES = [
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REFUNDED
];

/**
 * ========================================
 *          PAYMENT CONSTANTS
 * ========================================
 */
export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

export const PAYMENT_METHOD = {
    CARD: 'card',
    BANK_TRANSFER: 'bank_transfer',
    COD: 'cod'
};

export const PAYMENT_METHOD_LABELS = {
    [PAYMENT_METHOD.CARD]: 'Thẻ tín dụng/ghi nợ',
    [PAYMENT_METHOD.BANK_TRANSFER]: 'Chuyển khoản ngân hàng',
    [PAYMENT_METHOD.COD]: 'Thanh toán khi nhận hàng'
};

/**
 * ========================================
 *              SHIPPING CONSTANTS
 * ========================================
 */
export const SHIPPING_METHOD = {
    STANDARD: 'standard',
    EXPRESS: 'express'
};

export const SHIPPING_METHOD_LABELS = {
    [SHIPPING_METHOD.STANDARD]: 'Giao hàng tiêu chuẩn (3-5 ngày)',
    [SHIPPING_METHOD.EXPRESS]: 'Giao hàng nhanh (1-2 ngày)'
};

export const SHIPPING_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    PICKED_UP: 'picked_up',
    IN_TRANSIT: 'in_transit',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

// Shipping thresholds & rates
export const SHIPPING = {
    FREE_THRESHOLD: 500000, // 500k VND
    WEIGHT_THRESHOLD: 2, // kg
    WEIGHT_SURCHARGE: 5000, // 5k per kg
    VOLUMETRIC_DIVISOR: 6000, // For volumetric weight calculation
    COD_FEE_RATE: 0.01, // 1% COD fee
    INSURANCE_RATE: 0.005, // 0.5% insurance
    VAT_RATE: 0.10 // 10% VAT
};

export const SHIPPING_ZONES = {
    SAME_PROVINCE: 'same-province',
    NEIGHBORING: 'neighboring',
    NATIONWIDE: 'nationwide'
};

/**
 * ========================================
 *              PRODUCT CONSTANTS
 * ========================================
 */
export const PRODUCT_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
};

export const PRODUCT_LIMITS = {
    LOW_STOCK_THRESHOLD: 10,
    MAX_IMAGES: 10,
    MAX_CATEGORIES: 5,
    MIN_PRICE: 0,
    MAX_PRICE: 999999999
};

export const PRODUCT_SORT_OPTIONS = {
    NEWEST: 'createdAt',
    PRICE_ASC: 'price_asc',
    PRICE_DESC: 'price_desc',
    POPULAR: 'soldCount',
    RATING: 'rating'
};

/**
 * ========================================
 *              ARTICLE CONSTANTS
 * ========================================
 */
export const ARTICLE_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    SCHEDULED: 'scheduled',
    ARCHIVED: 'archived'
};

export const ARTICLE_STATUS_LABELS = {
    [ARTICLE_STATUS.DRAFT]: 'Bản nháp',
    [ARTICLE_STATUS.PUBLISHED]: 'Đã xuất bản',
    [ARTICLE_STATUS.SCHEDULED]: 'Đã lên lịch',
    [ARTICLE_STATUS.ARCHIVED]: 'Đã lưu trữ'
};

export const COMMENT_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

/**
 * ========================================
 *              ERROR CODES
 * ========================================
 */
export const ERROR_CODE = {
    SERVER_ERROR: 0,
    VALIDATION_ERROR: 1,
    NOT_FOUND: 2,
    UNAUTHORIZED: 3,
    FORBIDDEN: 4,
    BUSINESS_LOGIC_ERROR: 5,
    DUPLICATE_ERROR: 6,
    EXTERNAL_API_ERROR: 7
};

export const ERROR_MESSAGES = {
    // Server
    [ERROR_CODE.SERVER_ERROR]: 'Lỗi server',
    
    // Validation
    [ERROR_CODE.VALIDATION_ERROR]: 'Dữ liệu không hợp lệ',
    MISSING_REQUIRED_FIELDS: 'Vui lòng nhập đầy đủ thông tin',
    INVALID_EMAIL: 'Email không hợp lệ',
    INVALID_PASSWORD: 'Mật khẩu không đúng định dạng',
    PASSWORD_TOO_SIMPLE: 'Mật khẩu quá đơn giản. Cần ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.',
    
    // Auth
    DUPLICATE_USERNAME_EMAIL: 'Username hoặc email đã tồn tại',
    INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu không chính xác',
    TOKEN_INVALID: 'Token không hợp lệ',
    TOKEN_EXPIRED: 'Token đã hết hạn',
    
    // Resources
    [ERROR_CODE.NOT_FOUND]: 'Không tìm thấy',
    USER_NOT_FOUND: 'Người dùng không tồn tại',
    PRODUCT_NOT_FOUND: 'Sản phẩm không tồn tại',
    ORDER_NOT_FOUND: 'Đơn hàng không tồn tại',
    ARTICLE_NOT_FOUND: 'Bài viết không tồn tại',
    
    // Authorization
    [ERROR_CODE.UNAUTHORIZED]: 'Không có quyền truy cập',
    NOT_OWNER: 'Bạn không có quyền thao tác với tài nguyên này',
    
    // Business Logic
    OUT_OF_STOCK: 'Sản phẩm không đủ tồn kho',
    CART_EMPTY: 'Giỏ hàng trống',
    PRICE_CHANGED: 'Giá sản phẩm đã thay đổi',
    CANNOT_CANCEL_ORDER: 'Không thể hủy đơn hàng ở trạng thái này',
    INVALID_ADDRESS: 'Địa chỉ giao hàng không hợp lệ'
};

/**
 * ========================================
 *             PAGINATION & LIMITS
 * ========================================
 */
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    PRODUCT_DEFAULT_LIMIT: 12,
    MAX_LIMIT: 100
};

/**
 * ========================================
 *          FILE UPLOAD CONSTANTS
 * ========================================
 */
export const FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 10,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_IMAGE_EXTENSIONS: /\.(jpg|jpeg|png|gif|webp)$/i,
    IMAGE_QUALITY: 85,
    MAX_IMAGE_DIMENSION: 1200
};

/**
 * ========================================
 *       TIME CONSTANTS (milliseconds)
 * ========================================
 */
export const TIME = {
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    
    // JWT expiry
    JWT_ACCESS_EXPIRY: 15 * 60 * 1000, // 15 minutes
    JWT_REFRESH_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
    
    // Session
    SESSION_MAX_AGE: 60 * 60 * 1000, // 1 hour
    
    // Cart
    CART_ITEM_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
    
    // Cache TTL
    CACHE_SHORT: 60 * 1000, // 1 minute
    CACHE_MEDIUM: 5 * 60 * 1000, // 5 minutes
    CACHE_LONG: 60 * 60 * 1000, // 1 hour
    CACHE_VERY_LONG: 24 * 60 * 60 * 1000 // 1 day
};

/**
 * ========================================
 *              RATE LIMITING
 * ========================================
 */
export const RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    
    // Max requests per window
    STANDARD: 100,
    AUTH: 5,
    PAYMENT: 10,
    STRICT: 30
};

/**
 * ========================================
 *              TAX & PRICING
 * ========================================
 */
export const TAX = {
    VN_VAT_RATE: 0.10, // 10%
    US_SALES_TAX: 0.07, // 7%
    UK_VAT_RATE: 0.20, // 20%
    SG_GST_RATE: 0.08, // 8%
    TH_VAT_RATE: 0.07 // 7%
};

export const PRICING = {
    MIN_ORDER_AMOUNT: 10000, // 10k VND
    MAX_ORDER_AMOUNT: 50000000, // 50M VND
    DEFAULT_CURRENCY: 'VND'
};

/**
 * ========================================
 *              REGEX PATTERNS
 * ========================================
 */
export const REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_VN: /^[0-9]{10,11}$/,
    USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
    SKU: /^[A-Z0-9-]{3,50}$/,
    PASSWORD: {
        MIN_LENGTH: 8,
        HAS_NUMBER: /\d/,
        HAS_SPECIAL_CHAR: /[!@#$%^&*(),.?":{}|<>]/,
        HAS_UPPERCASE: /[A-Z]/,
        HAS_LOWERCASE: /[a-z]/
    },
    PROVINCE_CODE: /^[0-9]{2}$/,
    COMMUNE_CODE: /^[0-9]{5}$/
};

/**
 * ========================================
 *              HTTP STATUS CODES
 * ========================================
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

/**
 * ========================================
 *    RESPONSE STATUS CODES (API Custom)
 * ========================================
 */
export const RESPONSE_STATUS = {
    SUCCESS: 1,
    ERROR: 0
};

/**
 * ========================================
 *              EMAIL TEMPLATES
 * ========================================
 */
export const EMAIL_TYPES = {
    ORDER_CONFIRMATION: 'order_confirmation',
    ORDER_SHIPPED: 'order_shipped',
    PAYMENT_FAILED: 'payment_failed',
    REFUND_CONFIRMATION: 'refund_confirmation',
    PASSWORD_RESET: 'password_reset',
    WELCOME: 'welcome'
};

/**
 * ========================================
 *              COUNTRIES
 * ========================================
 */
export const COUNTRY = {
    VIETNAM: 'VN',
    USA: 'US',
    UK: 'UK',
    SINGAPORE: 'SG',
    THAILAND: 'TH'
};

/**
 * ========================================
 *              ENVIRONMENT
 * ========================================
 */
export const ENV = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test'
};

/**
 * ========================================
 *              SOCKET EVENTS
 * ========================================
 */
export const SOCKET_EVENTS = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ORDER_UPDATE: 'order:update',
    STOCK_UPDATE: 'stock:update',
    PAYMENT_UPDATE: 'payment:update'
};

/**
 * ========================================
 *              CACHE KEYS
 * ========================================
 */
export const CACHE_KEY = {
    PRODUCT_LIST: 'cache:/product/list',
    PRODUCT_DETAIL: 'cache:/product/',
    ARTICLE_LIST: 'cache:/article/list',
    PROVINCES: 'cache:/shipping/provinces',
    COMMUNES: 'cache:/shipping/communes',
    USER_ORDERS: 'cache:user:',
    SESSION: 'sess:'
};