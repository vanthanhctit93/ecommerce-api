import mongoose from 'mongoose';
import Article from '../models/Article.js';
import { 
    sendSuccess, 
    sendNotFound, 
    sendValidationError,
    sendUnauthorized,
    sendServerError 
} from '../utils/responseHelper.js';

/**
 * Get all articles (OPTIMIZED - No N+1 queries)
 */
export const getAllArticles = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filters
        const match = { isDeleted: false };
        
        if (req.query.status) {
            match.status = req.query.status;
        }
        
        if (req.query.author) {
            match.author = mongoose.Types.ObjectId(req.query.author);
        }

        // ✅ OPTIMIZED AGGREGATION PIPELINE
        const articlesWithRelated = await Article.aggregate([
            // Stage 1: Match filters
            { $match: match },
            
            // Stage 2: Sort
            { $sort: { publishedAt: -1, createdAt: -1 } },
            
            // Stage 3: Pagination
            { $skip: skip },
            { $limit: limit },
            
            // Stage 4: Lookup author
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'authorData'
                }
            },
            {
                $unwind: {
                    path: '$authorData',
                    preserveNullAndEmptyArrays: true
                }
            },
            
            // Stage 5: Lookup categories
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categoriesData'
                }
            },
            
            // Stage 6: Lookup related articles (based on shared categories)
            {
                $lookup: {
                    from: 'articles',
                    let: { 
                        articleId: '$_id', 
                        articleCategories: '$categories' 
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $ne: ['$_id', '$$articleId'] },
                                        { $eq: ['$status', 'published'] },
                                        { $eq: ['$isDeleted', false] },
                                        {
                                            $gt: [
                                                { $size: { $setIntersection: ['$categories', '$$articleCategories'] } },
                                                0
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $limit: 3 },
                        { $project: { _id: 1, title: 1, slug: 1, thumbnail: 1 } }
                    ],
                    as: 'relatedArticles'
                }
            },
            
            // Stage 7: Project final shape
            {
                $project: {
                    _id: 1,
                    title: 1,
                    slug: 1,
                    excerpt: 1,
                    thumbnail: 1,
                    description: 1,
                    status: 1,
                    publishedAt: 1,
                    createdAt: 1,
                    viewCount: 1,
                    isFeatured: 1,
                    author: {
                        _id: '$authorData._id',
                        username: '$authorData.username',
                        fullname: '$authorData.fullname',
                        avatar: '$authorData.avatar'
                    },
                    categories: {
                        $map: {
                            input: '$categoriesData',
                            as: 'cat',
                            in: {
                                _id: '$$cat._id',
                                name: '$$cat.name',
                                slug: '$$cat.slug'
                            }
                        }
                    },
                    relatedArticles: 1
                }
            }
        ]);

        // Get total count
        const total = await Article.countDocuments(match);

        return sendSuccess(res, {
            articles: articlesWithRelated,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Get articles error:', err);
        return sendServerError(res);
    }
};

/**
 * Get article by ID (OPTIMIZED)
 */
export const getArticleById = async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ OPTIMIZED: Single aggregation query
        const articles = await Article.aggregate([
            { $match: { _id: mongoose.Types.ObjectId(id), isDeleted: false } },
            
            // Lookup author
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'authorData'
                }
            },
            { $unwind: { path: '$authorData', preserveNullAndEmptyArrays: true } },
            
            // Lookup categories
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categoriesData'
                }
            },
            
            // Lookup related articles
            {
                $lookup: {
                    from: 'articles',
                    let: { articleId: '$_id', articleCategories: '$categories' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $ne: ['$_id', '$$articleId'] },
                                        { $eq: ['$status', 'published'] },
                                        { $eq: ['$isDeleted', false] },
                                        {
                                            $gt: [
                                                { $size: { $setIntersection: ['$categories', '$$articleCategories'] } },
                                                0
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $limit: 5 },
                        { $project: { _id: 1, title: 1, slug: 1, thumbnail: 1, excerpt: 1 } }
                    ],
                    as: 'relatedArticles'
                }
            },
            
            // Project final shape
            {
                $project: {
                    _id: 1,
                    title: 1,
                    slug: 1,
                    excerpt: 1,
                    thumbnail: 1,
                    description: 1,
                    content: 1,
                    status: 1,
                    publishedAt: 1,
                    createdAt: 1,
                    viewCount: 1,
                    isFeatured: 1,
                    likeCount: 1,
                    commentCount: 1,
                    author: {
                        _id: '$authorData._id',
                        username: '$authorData.username',
                        fullname: '$authorData.fullname',
                        avatar: '$authorData.avatar'
                    },
                    categories: {
                        $map: {
                            input: '$categoriesData',
                            as: 'cat',
                            in: {
                                _id: '$$cat._id',
                                name: '$$cat.name',
                                slug: '$$cat.slug'
                            }
                        }
                    },
                    relatedArticles: 1
                }
            }
        ]);

        if (!articles || articles.length === 0) {
            return sendNotFound(res, 'Bài viết không tồn tại');
        }

        const article = articles[0];

        // Increment view count (async, don't wait)
        Article.updateOne({ _id: id }, { $inc: { viewCount: 1 } }).catch(console.error);

        return sendSuccess(res, { article });
    } catch (err) {
        console.error('Get article error:', err);
        return sendServerError(res);
    }
};

/**
 * Get featured articles
 */
export const getFeaturedArticles = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const articles = await Article.find({
            isFeatured: true,
            status: 'published',
            isDeleted: false
        })
        .populate('author', 'username fullname avatar')
        .populate('categories', 'name slug')
        .sort({ publishedAt: -1 })
        .limit(limit)
        .select('title slug excerpt thumbnail publishedAt viewCount likeCount');

        return sendSuccess(res, { articles });
    } catch (err) {
        console.error('Get featured articles error:', err);
        return sendServerError(res);
    }
};

/**
 * Get articles by category
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
            isDeleted: false
        })
        .populate('author', 'username fullname avatar')
        .populate('categories', 'name slug')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit);

        const total = await Article.countDocuments({
            categories: categoryId,
            status: 'published',
            isDeleted: false
        });

        return sendSuccess(res, {
            articles,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Get articles by category error:', err);
        return sendServerError(res);
    }
};

/**
 * Search articles
 */
export const searchArticles = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return sendValidationError(res, 'Query parameter "q" is required');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const articles = await Article.find({
            $text: { $search: q },
            status: 'published',
            isDeleted: false
        })
        .populate('author', 'username fullname avatar')
        .populate('categories', 'name slug')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit);

        const total = await Article.countDocuments({
            $text: { $search: q },
            status: 'published',
            isDeleted: false
        });

        return sendSuccess(res, {
            articles,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Search articles error:', err);
        return sendServerError(res);
    }
};

/**
 * Create article
 */
export const createArticle = async (req, res) => {
    try {
        const { title, content, excerpt, thumbnail, categories, status } = req.body;

        if (!title) {
            return sendValidationError(res, 'Vui lòng nhập tiêu đề bài viết');
        }

        const article = new Article({
            title,
            content,
            excerpt,
            thumbnail,
            categories,
            status: status || 'draft',
            author: req.user._id,
            createdAt: new Date(),
        });

        await article.save();
        
        return sendSuccess(res, { article }, 'Tạo bài viết thành công', 201);
    } catch (err) {
        console.error('Create article error:', err);
        return sendServerError(res);
    }
};

/**
 * Update article
 */
export const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, excerpt, thumbnail, categories, status } = req.body;

        if (!title) {
            return sendValidationError(res, 'Vui lòng nhập tiêu đề bài viết');
        }

        const article = await Article.findById(id);

        if (!article || article.isDeleted) {
            return sendNotFound(res, 'Bài viết không tồn tại');
        }

        if (article.author.toString() !== req.user._id.toString()) {
            return sendUnauthorized(res, 'Bạn không có quyền chỉnh sửa bài viết này');
        }

        article.title = title;
        article.content = content;
        article.excerpt = excerpt;
        article.thumbnail = thumbnail;
        article.categories = categories;
        article.status = status;

        await article.save();
        
        return sendSuccess(res, { article }, 'Cập nhật bài viết thành công');
    } catch (err) {
        console.error('Update article error:', err);
        return sendServerError(res);
    }
};

/**
 * Delete article (soft delete)
 */
export const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;
        
        const article = await Article.findById(id);

        if (!article || article.isDeleted) {
            return sendNotFound(res, 'Bài viết không tồn tại');
        }

        if (article.author.toString() !== req.user._id.toString()) {
            return sendUnauthorized(res, 'Bạn không có quyền xóa bài viết này');
        }

        article.isDeleted = true;
        article.deletedAt = new Date();
        await article.save();
        
        return sendSuccess(res, {}, 'Xóa bài viết thành công');
    } catch (err) {
        console.error('Delete article error:', err);
        return sendServerError(res);
    }
};

/**
 * Restore deleted article
 */
export const restoreArticle = async (req, res) => {
    try {
        const { id } = req.params;

        const article = await Article.findOne({
            _id: id,
            author: req.user._id,
            isDeleted: true
        });

        if (!article) {
            return sendNotFound(res, 'Bài viết không tồn tại hoặc chưa bị xóa');
        }

        article.isDeleted = false;
        article.deletedAt = null;
        await article.save();

        return sendSuccess(res, { article }, 'Khôi phục bài viết thành công');
    } catch (err) {
        console.error('Restore article error:', err);
        return sendServerError(res);
    }
};

/**
 * Toggle publish status
 */
export const togglePublish = async (req, res) => {
    try {
        const { id } = req.params;

        const article = await Article.findById(id);

        if (!article || article.isDeleted) {
            return sendNotFound(res, 'Bài viết không tồn tại');
        }

        if (article.author.toString() !== req.user._id.toString()) {
            return sendUnauthorized(res, 'Bạn không có quyền thay đổi trạng thái bài viết này');
        }

        // Toggle between draft and published
        article.status = article.status === 'published' ? 'draft' : 'published';
        
        if (article.status === 'published' && !article.publishedAt) {
            article.publishedAt = new Date();
        }

        await article.save();

        return sendSuccess(res, { article }, `Bài viết đã ${article.status === 'published' ? 'xuất bản' : 'chuyển về draft'}`);
    } catch (err) {
        console.error('Toggle publish error:', err);
        return sendServerError(res);
    }
};

/**
 * Toggle like
 */
export const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const article = await Article.findById(id);

        if (!article || article.isDeleted) {
            return sendNotFound(res, 'Bài viết không tồn tại');
        }

        // Check if user already liked
        const likedIndex = article.likes.indexOf(userId);

        if (likedIndex > -1) {
            // Unlike
            article.likes.splice(likedIndex, 1);
            article.likeCount = Math.max(0, article.likeCount - 1);
        } else {
            // Like
            article.likes.push(userId);
            article.likeCount += 1;
        }

        await article.save();

        return sendSuccess(res, {
            liked: likedIndex === -1,
            likeCount: article.likeCount
        });
    } catch (err) {
        console.error('Toggle like error:', err);
        return sendServerError(res);
    }
};

/**
 * Add comment
 */
export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return sendValidationError(res, 'Nội dung comment không được để trống');
        }

        const article = await Article.findById(id);

        if (!article || article.isDeleted) {
            return sendNotFound(res, 'Bài viết không tồn tại');
        }

        const comment = {
            user: req.user._id,
            content: content.trim(),
            createdAt: new Date()
        };

        article.comments.push(comment);
        article.commentCount += 1;

        await article.save();

        // Populate comment user info
        await article.populate('comments.user', 'username fullname avatar');

        const newComment = article.comments[article.comments.length - 1];

        return sendSuccess(res, { comment: newComment }, 'Thêm comment thành công');
    } catch (err) {
        console.error('Add comment error:', err);
        return sendServerError(res);
    }
};

/**
 * Moderate comment (approve/reject)
 */
export const moderateComment = async (req, res) => {
    try {
        const { articleId, commentId } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return sendValidationError(res, 'Trạng thái không hợp lệ');
        }

        const article = await Article.findById(articleId);

        if (!article || article.isDeleted) {
            return sendNotFound(res, 'Bài viết không tồn tại');
        }

        if (article.author.toString() !== req.user._id.toString()) {
            return sendUnauthorized(res, 'Bạn không có quyền moderate comment');
        }

        const comment = article.comments.id(commentId);

        if (!comment) {
            return sendNotFound(res, 'Comment không tồn tại');
        }

        comment.status = status;
        await article.save();

        return sendSuccess(res, { comment }, `Comment đã ${status === 'approved' ? 'được duyệt' : 'bị từ chối'}`);
    } catch (err) {
        console.error('Moderate comment error:', err);
        return sendServerError(res);
    }
};

/**
 * Bulk publish articles
 */
export const bulkPublishArticles = async (req, res) => {
    try {
        const { articleIds, status } = req.body;

        if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
            return sendValidationError(res, 'Danh sách bài viết không hợp lệ');
        }

        if (!['published', 'draft'].includes(status)) {
            return sendValidationError(res, 'Trạng thái không hợp lệ');
        }

        const updateData = { status };
        
        if (status === 'published') {
            updateData.publishedAt = new Date();
        }

        const result = await Article.updateMany(
            {
                _id: { $in: articleIds },
                author: req.user._id,
                isDeleted: false
            },
            { $set: updateData }
        );

        return sendSuccess(res, {
            modifiedCount: result.modifiedCount,
            message: `Đã ${status === 'published' ? 'xuất bản' : 'chuyển về draft'} ${result.modifiedCount} bài viết`
        });
    } catch (err) {
        console.error('Bulk publish error:', err);
        return sendServerError(res);
    }
};

/**
 * Bulk delete articles
 */
export const bulkDeleteArticles = async (req, res) => {
    try {
        const { articleIds } = req.body;

        if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
            return sendValidationError(res, 'Danh sách bài viết không hợp lệ');
        }

        const result = await Article.updateMany(
            {
                _id: { $in: articleIds },
                author: req.user._id,
                isDeleted: false
            },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date()
                }
            }
        );

        return sendSuccess(res, {
            deletedCount: result.modifiedCount,
            message: `Đã xóa ${result.modifiedCount} bài viết`
        });
    } catch (err) {
        console.error('Bulk delete error:', err);
        return sendServerError(res);
    }
};

/**
 * Get article analytics
 */
export const getArticleAnalytics = async (req, res) => {
    try {
        const { id } = req.params;

        const article = await Article.findById(id);

        if (!article || article.isDeleted) {
            return sendNotFound(res, 'Bài viết không tồn tại');
        }

        if (article.author.toString() !== req.user._id.toString()) {
            return sendUnauthorized(res, 'Bạn không có quyền xem analytics');
        }

        const analytics = {
            views: article.viewCount || 0,
            likes: article.likeCount || 0,
            comments: article.commentCount || 0,
            publishedAt: article.publishedAt,
            lastUpdated: article.updatedAt,
            status: article.status
        };

        return sendSuccess(res, { analytics });
    } catch (err) {
        console.error('Get analytics error:', err);
        return sendServerError(res);
    }
};

/**
 * Schedule publish
 */
export const schedulePublish = async (req, res) => {
    try {
        const { id } = req.params;
        const { publishAt } = req.body;

        if (!publishAt) {
            return sendValidationError(res, 'Vui lòng nhập thời gian xuất bản');
        }

        const publishDate = new Date(publishAt);
        
        if (publishDate <= new Date()) {
            return sendValidationError(res, 'Thời gian xuất bản phải trong tương lai');
        }

        const article = await Article.findById(id);

        if (!article || article.isDeleted) {
            return sendNotFound(res, 'Bài viết không tồn tại');
        }

        if (article.author.toString() !== req.user._id.toString()) {
            return sendUnauthorized(res, 'Bạn không có quyền schedule bài viết này');
        }

        article.scheduledPublishAt = publishDate;
        article.status = 'scheduled';
        await article.save();

        return sendSuccess(res, { article }, `Bài viết sẽ được xuất bản vào ${publishDate.toLocaleString('vi-VN')}`);
    } catch (err) {
        console.error('Schedule publish error:', err);
        return sendServerError(res);
    }
};