import asyncHandler from "express-async-handler";

const getApi = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: 'Get Api'
    })
})

const setApi = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: 'Set Api'
    })
})

const updateApi = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: `Update Api ${req.params.id}`
    })
})

const deleteApi = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: `Delete Api ${req.params.id}`
    })
})

module.exports = {
    getApi,
    setApi,
    updateApi,
    deleteApi
}