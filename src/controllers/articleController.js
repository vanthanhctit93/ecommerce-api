import postModel from '../models/Article.js';

export const getAllArticles = async (req, res) => {
    try {
        const posts = await postModel.find();

        return res.status(200).json({ 
            status_code: 1,
            data: {
                posts
            }
        });
    } catch (err) {
        res.status(500).json({ 
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
};

// 
/**
 * Creates a new article.
 * 
 * @async
 * @function createArticle
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {string} req.body.title - The title of the article.
 * @param {string} req.body.content - The content of the article.
 * @param {Object} req.user - The user object.
 * @param {string} req.user._id - The ID of the user.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - Returns a promise that resolves to void.
 * @throws {Error} - Throws an error if there is a server issue.
 */
export const createArticle = async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title) {
            return res.status(200).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Vui lòng nhập tiêu đề bài viết' 
                }
            });
        }

        const post = new postModel({
            title,
            content,
            author: req.user._id,
            createdAt: new Date(),
        });

        await post.save();
        res.status(200).json({ 
            status_code: 1,
            data: {
                post,
                message: 'Tạo bài viết thành công',
            } 
        });
    } catch (err) {
        res.status(500).json({ 
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
}

export const getArticleById = async (req, res) => {
    try {
        const post = await postModel.findById(req.params.id);

        if (!post) {
            return res.status(200).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Bài viết không tồn tại' 
                }
            });
        }

        return res.status(200).json({ 
            status_code: 1,
            data: {
                post
            }
        });
    } catch (err) {
        res.status(500).json({ 
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
}

export const updateArticle = async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title) {
            return res.status(200).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Vui lòng nhập tiêu đề bài viết' 
                }
            });
        }

        const post = await postModel.findById(req.params.id);

        if (!post) {
            return res.status(200).json({ 
                status_code: 0,
                data: {
                    error_code: 2,
                    message: 'Bài viết không tồn tại' 
                }
            });
        }

        post.title = title;
        post.content = content;

        await post.save();
        res.status(200).json({ 
            status_code: 1,
            data: {
                post,
                message: 'Cập nhật bài viết thành công',
            } 
        });
    } catch (err) {
        res.status(500).json({ 
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
}

export const deleteArticle = async (req, res) => {
    try {
        const post = await postModel.findById(req.params.id);

        if (!post) {
            return res.status(200).json({ 
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Bài viết không tồn tại' 
                }
            });
        }

        await post.remove();
        res.status(200).json({ 
            status_code: 1,
            data: {
                message: 'Xóa bài viết thành công',
            } 
        });
    } catch (err) {
        res.status(500).json({ 
            status_code: 0,
            data: {
                error_code: 0,
                message: 'Lỗi server'
            }
        });
    }
}