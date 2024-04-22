const errorHandler = (err, req, res, next) => {
    const status = res.statusCode ? res.statusCode : 500;

    res.status(statusCode);

    res.join({
        message: err.message,
        stack: err.stack
    })
}

module.exports = {
    errorHandler
}