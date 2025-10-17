import Article from '../models/Article.js';
import mongoose from 'mongoose';

/**
 * Get all articles with pagination, filtering, sorting
 * @route GET /article/list
 * @access Public
 */
export const getAllArticles = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filters
        const filters = { isDeleted: false };

        // Status filter
        if (req.query.status) {
            filters.status = req.query.status;
        } else {
            // Default: only show published articles for public
            filters.status = 'published';
            filters.publishedAt = { $lte: new Date() };
        }

        // Category filter
        if (req.query.category) {
            filters.categories = req.query.category;
        }

        // Tag filter
        if (req.query.tag) {
            filters.tags = req.query.tag;
        }

        // Author filter
        if (req.query.author) {
            filters.author = req.query.author;
        }

        // Featured filter
        if (req.query.featured === 'true') {
            filters.isFeatured = true;
        }

        // Search
        if (req.query.search) {
            filters.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { excerpt: { $regex: req.query.search, $options: 'i' } },
                { content: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Sorting
        let sort = {};
        switch (req.query.sort) {
            case 'popular':
                sort = { viewCount: -1 };
                break;
            case 'trending':
                sort = { likeCount: -1, viewCount: -1 };
                break;
            case 'oldest':
                sort = { publishedAt: 1 };
                break;
            case 'newest':
            default:
                sort = { publishedAt: -1 };
        }

        const articles = await Article.find(filters)
            .populate('author', 'username fullname avatar')
            .populate('categories', 'name slug')
            .select('-content') // Don't send full content in list
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Article.countDocuments(filters);

        res.status(200).json({
            status_code: 1,
            data: {
                articles,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get articles error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Get article by ID or slug
 * @route GET /article/:idOrSlug
 * @access Public
 */
export const getArticleById = async (req, res) => {
    try {
        const { idOrSlug } = req.params;

        let query;
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            query = { _id: idOrSlug };
        } else {
            query = { slug: idOrSlug };
        }

        query.isDeleted = false;

        const article = await Article.findOne(query)
            .populate('author', 'username fullname avatar bio')
            .populate('categories', 'name slug description')
            .populate({
                path: 'comments.user',
                select: 'username fullname avatar'
            });

        if (!article) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Bài viết không tồn tại'
                }
            });
        }

        // Check if published
        if (article.status !== 'published' || (article.publishedAt && article.publishedAt > new Date())) {
            // Only author can view unpublished articles
            if (!req.user || req.user._id.toString() !== article.author._id.toString()) {
                return res.status(403).json({
                    status_code: 0,
                    data: {
                        error_code: 3,
                        message: 'Bài viết chưa được xuất bản'
                    }
                });
            }
        }

        // Increment view count (async, don't wait)
        article.incrementViewCount().catch(err => 
            console.error('Failed to increment view count:', err)
        );

        // Get related articles
        const relatedArticles = await Article.find({
            _id: { $ne: article._id },
            categories: { $in: article.categories },
            status: 'published',
            isDeleted: false,
            publishedAt: { $lte: new Date() }
        })
        .select('title slug thumbnail excerpt publishedAt')
        .populate('author', 'username fullname')
        .limit(5)
        .sort({ publishedAt: -1 });

        res.status(200).json({
            status_code: 1,
            data: {
                article,
                relatedArticles
            }
        });
    } catch (error) {
        console.error('Get article error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Create new article
 * @route POST /article/create
 * @access Private
 */
export const createArticle = async (req, res) => {
    try {
        const {
            title,
            excerpt,
            content,
            thumbnail,
            categories,
            tags,
            status,
            scheduledAt,
            seo,
            isFeatured
        } = req.body;

        // Validation
        if (!title || !content) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Tiêu đề và nội dung là bắt buộc'
                }
            });
        }

        // Create article
        const article = new Article({
            title,
            excerpt,
            content,
            thumbnail,
            categories: categories || [],
            tags: tags || [],
            author: req.user._id,
            status: status || 'draft',
            scheduledAt,
            seo,
            isFeatured: isFeatured || false
        });

        await article.save();

        // Populate before sending response
        await article.populate('author', 'username fullname');
        await article.populate('categories', 'name slug');

        res.status(201).json({
            status_code: 1,
            data: {
                article,
                message: 'Tạo bài viết thành công'
            }
        });
    } catch (error) {
        console.error('Create article error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Update article
 * @route PUT /article/update/:id
 * @access Private
 */
export const updateArticle = async (req, res) => {
    try {
        const article = await Article.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!article) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Bài viết không tồn tại'
                }
            });
        }

        // Check ownership
        if (article.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Bạn không có quyền chỉnh sửa bài viết này'
                }
            });
        }

        // Update fields
        const allowedUpdates = [
            'title',
            'excerpt',
            'content',
            'thumbnail',
            'categories',
            'tags',
            'status',
            'scheduledAt',
            'seo',
            'isFeatured',
            'featuredOrder'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                article[field] = req.body[field];
            }
        });

        await article.save();

        await article.populate('author', 'username fullname');
        await article.populate('categories', 'name slug');

        res.status(200).json({
            status_code: 1,
            data: {
                article,
                message: 'Cập nhật bài viết thành công'
            }
        });
    } catch (error) {
        console.error('Update article error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Delete article (soft delete)
 * @route DELETE /article/delete/:id
 * @access Private
 */
export const deleteArticle = async (req, res) => {
    try {
        const article = await Article.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!article) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Bài viết không tồn tại'
                }
            });
        }

        // Check ownership
        if (article.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Bạn không có quyền xóa bài viết này'
                }
            });
        }

        // Soft delete
        article.isDeleted = true;
        article.deletedAt = new Date();
        article.deletedBy = req.user._id;

        await article.save();

        res.status(200).json({
            status_code: 1,
            data: {
                message: 'Xóa bài viết thành công'
            }
        });
    } catch (error) {
        console.error('Delete article error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Restore deleted article
 * @route PUT /article/restore/:id
 * @access Private
 */
export const restoreArticle = async (req, res) => {
    try {
        const article = await Article.findOne({
            _id: req.params.id,
            isDeleted: true
        });

        if (!article) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Bài viết không tồn tại'
                }
            });
        }

        // Check ownership
        if (article.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Bạn không có quyền khôi phục bài viết này'
                }
            });
        }

        article.isDeleted = false;
        article.deletedAt = null;
        article.deletedBy = null;

        await article.save();

        res.status(200).json({
            status_code: 1,
            data: {
                article,
                message: 'Khôi phục bài viết thành công'
            }
        });
    } catch (error) {
        console.error('Restore article error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Toggle article publish status
 * @route PUT /article/toggle-publish/:id
 * @access Private
 */
export const togglePublish = async (req, res) => {
    try {
        const article = await Article.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!article) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Bài viết không tồn tại'
                }
            });
        }

        // Check ownership
        if (article.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status_code: 0,
                data: {
                    error_code: 3,
                    message: 'Bạn không có quyền thao tác bài viết này'
                }
            });
        }

        if (article.status === 'published') {
            article.status = 'draft';
        } else {
            article.status = 'published';
            if (!article.publishedAt) {
                article.publishedAt = new Date();
            }
        }

        await article.save();

        res.status(200).json({
            status_code: 1,
            data: {
                article,
                message: article.status === 'published' 
                    ? 'Xuất bản bài viết thành công' 
                    : 'Chuyển bài viết về nháp'
            }
        });
    } catch (error) {
        console.error('Toggle publish error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Like/Unlike article
 * @route POST /article/like/:id
 * @access Private
 */
export const toggleLike = async (req, res) => {
    try {
        const article = await Article.findOne({
            _id: req.params.id,
            isDeleted: false,
            status: 'published'
        });

        if (!article) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Bài viết không tồn tại'
                }
            });
        }

        await article.toggleLike(req.user._id);

        res.status(200).json({
            status_code: 1,
            data: {
                likeCount: article.likeCount,
                isLiked: article.likes.includes(req.user._id),
                message: 'Thành công'
            }
        });
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Add comment to article
 * @route POST /article/comment/:id
 * @access Private
 */
export const addComment = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Nội dung bình luận không được để trống'
                }
            });
        }

        const article = await Article.findOne({
            _id: req.params.id,
            isDeleted: false,
            status: 'published'
        });

        if (!article) {
            return res.status(404).json({
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Bài viết không tồn tại'
                }
            });
        }

        await article.addComment(req.user._id, content);

        res.status(201).json({
            status_code: 1,
            data: {
                message: 'Thêm bình luận thành công. Bình luận đang chờ duyệt.'
            }
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Get featured articles
 * @route GET /article/featured
 * @access Public
 */
export const getFeaturedArticles = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const articles = await Article.findFeatured(limit)
            .populate('author', 'username fullname avatar')
            .populate('categories', 'name slug')
            .select('-content');

        res.status(200).json({
            status_code: 1,
            data: {
                articles
            }
        });
    } catch (error) {
        console.error('Get featured articles error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Get articles by category
 * @route GET /article/category/:categoryId
 * @access Public
 */
export const getArticlesByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const articles = await Article.find({
            categories: categoryId,
            status: 'published',
            isDeleted: false,
            publishedAt: { $lte: new Date() }
        })
        .populate('author', 'username fullname avatar')
        .populate('categories', 'name slug')
        .select('-content')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit);

        const total = await Article.countDocuments({
            categories: categoryId,
            status: 'published',
            isDeleted: false
        });

        res.status(200).json({
            status_code: 1,
            data: {
                articles,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get articles by category error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Search articles
 * @route GET /article/search
 * @access Public
 */
export const searchArticles = async (req, res) => {
    try {
        const { q, category, tag, author } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const filters = {
            status: 'published',
            isDeleted: false,
            publishedAt: { $lte: new Date() }
        };

        // Search query
        if (q) {
            filters.$or = [
                { title: { $regex: q, $options: 'i' } },
                { excerpt: { $regex: q, $options: 'i' } },
                { content: { $regex: q, $options: 'i' } },
                { tags: { $regex: q, $options: 'i' } }
            ];
        }

        // Additional filters
        if (category) filters.categories = category;
        if (tag) filters.tags = tag;
        if (author) filters.author = author;

        const articles = await Article.find(filters)
            .populate('author', 'username fullname avatar')
            .populate('categories', 'name slug')
            .select('-content')
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Article.countDocuments(filters);

        res.status(200).json({
            status_code: 1,
            data: {
                articles,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                },
                query: q
            }
        });
    } catch (error) {
        console.error('Search articles error:', error);
        res.status(500).json({
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

/**
 * Bulk publish articles
 * @route PUT /article/bulk-publish
 * @access Private
 */
export const bulkPublishArticles = async (req, res) => {
    try {
        const { articleIds, isPublished } = req.body;

        if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
            return res.status(400).json({
                status_code: 0,
                data: { error_code: 1, message: 'Danh sách bài viết không hợp lệ' }
            });
        }

        // Check ownership
        const articles = await Article.find({
            _id: { $in: articleIds },
            author: req.user._id,
            isDeleted: false
        });

        if (articles.length !== articleIds.length) {
            return res.status(403).json({
                status_code: 0,
                data: { error_code: 2, message: 'Bạn không có quyền thao tác một số bài viết' }
            });
        }

        const result = await Article.updateMany(
            { _id: { $in: articleIds }, author: req.user._id },
            { 
                $set: { 
                    status: isPublished ? 'published' : 'draft',
                    publishedAt: isPublished ? new Date() : null
                }
            }
        );

        res.status(200).json({
            status_code: 1,
            data: {
                modifiedCount: result.modifiedCount,
                message: `Đã ${isPublished ? 'xuất bản' : 'ẩn'} ${result.modifiedCount} bài viết`
            }
        });
    } catch (error) {
        console.error('Bulk publish error:', error);
        res.status(500).json({
            status_code: 0,
            data: { error_code: 0, message: 'Lỗi server' }
        });
    }
};

/**
 * Bulk delete articles
 * @route DELETE /article/bulk-delete
 * @access Private
 */
export const bulkDeleteArticles = async (req, res) => {
    try {
        const { articleIds } = req.body;

        if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
            return res.status(400).json({
                status_code: 0,
                data: { error_code: 1, message: 'Danh sách bài viết không hợp lệ' }
            });
        }

        const result = await Article.updateMany(
            { _id: { $in: articleIds }, author: req.user._id, isDeleted: false },
            { 
                $set: { 
                    isDeleted: true, 
                    deletedAt: new Date(),
                    deletedBy: req.user._id
                }
            }
        );

        res.status(200).json({
            status_code: 1,
            data: {
                deletedCount: result.modifiedCount,
                message: `Đã xóa ${result.modifiedCount} bài viết`
            }
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({
            status_code: 0,
            data: { error_code: 0, message: 'Lỗi server' }
        });
    }
};

/**
 * Moderate comment (Admin only)
 * @route PUT /article/comment/:articleId/:commentId
 * @access Private/Admin
 */
export const moderateComment = async (req, res) => {
    try {
        const { articleId, commentId } = req.params;
        const { isApproved, rejectionReason } = req.body;

        const article = await Article.findById(articleId);

        if (!article) {
            return res.status(404).json({
                status_code: 0,
                data: { error_code: 1, message: 'Bài viết không tồn tại' }
            });
        }

        const comment = article.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({
                status_code: 0,
                data: { error_code: 2, message: 'Bình luận không tồn tại' }
            });
        }

        comment.isApproved = isApproved;
        comment.moderatedBy = req.user._id;
        comment.moderatedAt = new Date();
        
        if (!isApproved && rejectionReason) {
            comment.rejectionReason = rejectionReason;
        }

        await article.save();

        res.status(200).json({
            status_code: 1,
            data: {
                message: isApproved ? 'Đã duyệt bình luận' : 'Đã từ chối bình luận',
                comment
            }
        });
    } catch (error) {
        console.error('Moderate comment error:', error);
        res.status(500).json({
            status_code: 0,
            data: { error_code: 0, message: 'Lỗi server' }
        });
    }
};

/**
 * Get article analytics
 * @route GET /article/analytics/:id
 * @access Private
 */
export const getArticleAnalytics = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                status_code: 0,
                data: { error_code: 1, message: 'Bài viết không tồn tại' }
            });
        }

        // Check ownership
        if (article.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status_code: 0,
                data: { error_code: 2, message: 'Bạn không có quyền xem analytics' }
            });
        }

        const analytics = {
            views: article.viewCount,
            likes: article.likeCount,
            comments: article.commentCount,
            readingTime: article.readingTime,
            engagement: {
                likeRate: article.viewCount > 0 ? (article.likeCount / article.viewCount * 100).toFixed(2) + '%' : '0%',
                commentRate: article.viewCount > 0 ? (article.commentCount / article.viewCount * 100).toFixed(2) + '%' : '0%'
            },
            publishedAt: article.publishedAt,
            status: article.status
        };

        res.status(200).json({
            status_code: 1,
            data: { analytics }
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            status_code: 0,
            data: { error_code: 0, message: 'Lỗi server' }
        });
    }
};

/**
 * Schedule article publishing
 * @route PUT /article/schedule/:id
 * @access Private
 */
export const schedulePublish = async (req, res) => {
    try {
        const { scheduledAt } = req.body;

        if (!scheduledAt) {
            return res.status(400).json({
                status_code: 0,
                data: { error_code: 1, message: 'Vui lòng chọn thời gian xuất bản' }
            });
        }

        const scheduledDate = new Date(scheduledAt);

        if (scheduledDate <= new Date()) {
            return res.status(400).json({
                status_code: 0,
                data: { error_code: 2, message: 'Thời gian xuất bản phải trong tương lai' }
            });
        }

        const article = await Article.findOne({
            _id: req.params.id,
            author: req.user._id,
            isDeleted: false
        });

        if (!article) {
            return res.status(404).json({
                status_code: 0,
                data: { error_code: 3, message: 'Bài viết không tồn tại' }
            });
        }

        article.scheduledAt = scheduledDate;
        article.status = 'draft'; // Keep as draft until scheduled time
        await article.save();

        res.status(200).json({
            status_code: 1,
            data: {
                article,
                message: `Đã lên lịch xuất bản vào ${scheduledDate.toLocaleString('vi-VN')}`
            }
        });
    } catch (error) {
        console.error('Schedule publish error:', error);
        res.status(500).json({
            status_code: 0,
            data: { error_code: 0, message: 'Lỗi server' }
        });
    }
};