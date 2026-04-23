const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'af-south-1' });
const BUCKET_NAME = process.env.S3_BUCKET;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Upload image and process with sharp
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }

    const fileId = uuidv4();
    const originalKey = `properties/original/${fileId}.webp`;
    const thumbnailKey = `properties/thumbnail/${fileId}.webp`;

    // Process image to webp
    const originalBuffer = await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .toBuffer();

    const thumbnailBuffer = await sharp(req.file.buffer)
      .resize(400, 300, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    // Upload original
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: originalKey,
      Body: originalBuffer,
      ContentType: 'image/webp'
    }));

    // Upload thumbnail
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: 'image/webp'
    }));

    res.status(201).json({
      message: 'Image uploaded successfully',
      urls: {
        original: `https://${CLOUDFRONT_DOMAIN}/${originalKey}`,
        thumbnail: `https://${CLOUDFRONT_DOMAIN}/${thumbnailKey}`
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate pre-signed URL for direct upload
router.post('/presigned-url', async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    const fileId = uuidv4();
    const extension = filename.split('.').pop();
    const key = `properties/raw/${fileId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({
      uploadUrl: signedUrl,
      fileKey: key,
      publicUrl: `https://${CLOUDFRONT_DOMAIN}/${key}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
