const multer = require('multer');

const storage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  // Allow images AND specific document types like PDF
  if (
    file.mimetype.startsWith('image') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // For .docx
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Not a valid image or document type! Please upload only images, PDFs, or Word docs.',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: multerFilter
});

module.exports = upload;
