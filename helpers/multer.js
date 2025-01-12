const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'riio-images',
    allowed_formats: ['jpeg', 'jpg', 'png', 'svg' ,'pdf'],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg' ,'application/pdf'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed types are jpeg, jpg,pdf , and png.`
      )
    );
  }
};

const upload = multer({
  storage: imageStorage,
  fileFilter: fileFilter,
});

module.exports = upload;
