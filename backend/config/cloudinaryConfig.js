const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// ─── Step 1: Configure Cloudinary with .env Variables ───────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Step 2: Validate credentials exist at startup ──────────────────────────
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY    ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error('❌ FATAL: Cloudinary environment variables are missing!');
  console.error('   Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env');
}

// ─── Step 3: Configure Cloudinary Storage (async params — required for v1.x+) ──
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'smart_room_finder/rooms',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
      // Unique public ID to avoid overwriting
      public_id: `room_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
    };
  },
});

// ─── Step 4: File Type Filter (reject non-images BEFORE uploading) ──────────
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPG, PNG, WEBP are allowed.`), false);
  }
};

// ─── Step 5: Export Multer Instance with limits ──────────────────────────────
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
});

module.exports = { cloudinary, upload };
