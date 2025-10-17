export const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                status_code: 0,
                data: {
                    error_code: 1,
                    message: 'Validation failed',
                    errors
                }
            });
        }

        req.validatedData = value;
        next();
    };
};