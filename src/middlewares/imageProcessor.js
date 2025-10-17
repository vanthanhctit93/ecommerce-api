import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

/**
 * Process and optimize uploaded images
 */
export const processImages = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next();
    }

    try {
        const processedFiles = [];

        for (const file of req.files) {
            const outputFilename = `optimized-${file.filename}`;
            const outputPath = path.join(path.dirname(file.path), outputFilename);

            // Get original file size
            const originalStats = await fs.stat(file.path);
            const originalSize = originalStats.size;

            // Resize and optimize
            await sharp(file.path)
                .resize(1200, 1200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ 
                    quality: 85,
                    progressive: true,
                    mozjpeg: true
                })
                .toFile(outputPath);

            // Get optimized file size
            const optimizedStats = await fs.stat(outputPath);
            const optimizedSize = optimizedStats.size;

            // Calculate savings
            const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

            console.log(`📸 Optimized: ${file.filename}`);
            console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
            console.log(`   Optimized: ${(optimizedSize / 1024).toFixed(2)} KB`);
            console.log(`   Savings: ${savings}%`);

            // Delete original
            await fs.unlink(file.path);

            // Rename optimized to original filename
            await fs.rename(outputPath, file.path);

            processedFiles.push({
                filename: file.filename,
                originalSize,
                optimizedSize,
                savings
            });
        }

        req.imageStats = processedFiles;
        next();
    } catch (error) {
        console.error('Image processing error:', error);
        next(error);
    }
};

/**
 * Process single image
 */
export const processSingleImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        const file = req.file;
        const outputFilename = `optimized-${file.filename}`;
        const outputPath = path.join(path.dirname(file.path), outputFilename);

        const originalStats = await fs.stat(file.path);
        const originalSize = originalStats.size;

        await sharp(file.path)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ 
                quality: 85,
                progressive: true,
                mozjpeg: true
            })
            .toFile(outputPath);

        const optimizedStats = await fs.stat(outputPath);
        const optimizedSize = optimizedStats.size;

        const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

        console.log(`📸 Optimized: ${file.filename} (${savings}% savings)`);

        await fs.unlink(file.path);
        await fs.rename(outputPath, file.path);

        req.imageStats = {
            filename: file.filename,
            originalSize,
            optimizedSize,
            savings
        };

        next();
    } catch (error) {
        console.error('Image processing error:', error);
        next(error);
    }
};

/**
 * Generate thumbnail
 */
export const generateThumbnail = async (imagePath, thumbnailPath, size = 300) => {
    try {
        await sharp(imagePath)
            .resize(size, size, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ 
                quality: 80,
                progressive: true
            })
            .toFile(thumbnailPath);

        console.log(`📸 Thumbnail generated: ${path.basename(thumbnailPath)}`);
    } catch (error) {
        console.error('Thumbnail generation error:', error);
        throw error;
    }
};