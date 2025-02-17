module.exports = errorMiddleware = (err, req, res, next) => {
    res.status(500).join({
        message: err.message || 'Internal Server Error',
    })
}