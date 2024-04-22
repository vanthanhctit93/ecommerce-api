const getApi = (req, res) => {
    res.status(200).json({
        message: 'Get Api'
    })
}

const setApi = (req, res) => {
    res.status(200).json({
        message: 'Set Api'
    })
}

const updateApi = (req, res) => {
    res.status(200).json({
        message: `Update Api ${req.params.id}`
    })
}

const deleteApi = (req, res) => {
    res.status(200).json({
        message: `Delete Api ${req.params.id}`
    })
}

module.exports = {
    getApi,
    setApi,
    updateApi,
    deleteApi
}