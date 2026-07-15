const multer = require('multer');

const storage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  // Allow images, videos, AND specific document types like PDF
  if (
    file.mimetype.startsWith('image') ||
    file.mimetype.startsWith('video') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // For .docx
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Not a valid file type! Please upload only images, videos, PDFs, or Word docs.',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: multerFilter
});

module.exports = upload;
