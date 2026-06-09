const Resume = require('../models/resumeModel');
const catchAsync = require('../util/catchAsync');
const AppError = require('../util/appError');
const filterObj = require('../util/filterObj');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

// ==========================================
// 1. THE MACHINE LEARNING ENDPOINT
// ==========================================
// Your Next.js app calls this route with the visitor's detected intent:
// GET /api/v1/resume/active?audience=Backend
exports.getActiveResume = catchAsync(async (req, res, next) => {
  // 1. Find the currently active resume
  const activeResume = await Resume.findOne({ isActive: true });

  if (!activeResume) {
    return next(new AppError('No active resume found', 404));
  }

  // 2. Determine which summary to show
  const requestedAudience = req.query.audience;
  let displaySummary = activeResume.defaultSummary;

  // If the ML model passed an audience, try to find the matching targeted summary
  if (requestedAudience && activeResume.targetedSummaries) {
    const targetedMatch = activeResume.targetedSummaries.find(
      (s) => s.audience.toLowerCase() === requestedAudience.toLowerCase()
    );

    if (targetedMatch) {
      displaySummary = targetedMatch.text;
    }
  }

  // 3. Send back a clean, compiled payload for the frontend
  res.status(200).json({
    status: 'success',
    data: {
      resume: {
        fullName: activeResume.fullName,
        professionalTitle: activeResume.professionalTitle,
        contact: activeResume.contact,
        socialLinks: activeResume.socialLinks,
        resumePdf: activeResume.resumePdf,
        // The frontend doesn't need the whole array, just the specific summary!
        summary: displaySummary
      }
    }
  });
});

// ==========================================
// 2. ADMIN CRUD OPERATIONS
// ==========================================
exports.createResume = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'fullName',
    'professionalTitle',
    'contact.email',
    'contact.phone',
    'contact.location',
    'socialLinks.github',
    'socialLinks.linkedin',
    'defaultSummary',
    'isActive'
  );

  if (req.body.targetedSummaries) {
    try {
      // JSON.parse converts the raw Postman string into a real JavaScript Array
      const parsedArray = JSON.parse(req.body.targetedSummaries);

      // Attach the real array to our filtered object BEFORE saving to Mongoose
      filteredBody.targetedSummaries = parsedArray;
    } catch (error) {
      return next(
        new AppError(
          'targetedSummaries must be formatted as a valid JSON string',
          400
        )
      );
    }
  }

  const newResumeId = new mongoose.Types.ObjectId();
  filteredBody._id = newResumeId;

  // Handle the PDF Upload exactly like the Internship certificate
  if (req.file) {
    const uploadStream = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio_files',
          public_id: `resume_${newResumeId}`,
          resource_type: 'auto' // Crucial for accepting PDFs!
        },
        (error, result) => {
          if (error) return reject(new AppError('Failed to upload PDF', 500));
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    const cloudinaryResult = await uploadStream;
    filteredBody.resumePdf = cloudinaryResult.secure_url;
  }

  const newResume = await Resume.create(filteredBody);

  res.status(201).json({
    status: 'success',
    data: { resume: newResume }
  });
});

exports.updateResume = catchAsync(async (req, res, next) => {
  // 1. Filter allowed top-level and nested dot-notation fields
  // If you don't send a field in Postman, filterObj leaves it out, and the DB keeps its current value!
  const filteredBody = filterObj(
    req.body,
    'fullName',
    'professionalTitle',
    'contact.email',
    'contact.phone',
    'contact.location',
    'socialLinks.github',
    'socialLinks.linkedin',
    'defaultSummary',
    'isActive'
  );

  // 2. Fetch the target resume document
  const resume = await Resume.findById(req.params.id);
  if (!resume) {
    return next(new AppError('No resume found with that ID', 404));
  }

  // 3. ULTRA-FLEXIBLE ARRAY UPDATE (targetedSummaries)
  if (req.body.targetedSummaries) {
    try {
      const updates = JSON.parse(req.body.targetedSummaries);

      updates.forEach((updateItem) => {
        // Find the existing summary using either its unique _id OR its audience name
        const existingSummary = resume.targetedSummaries.find(
          (subDoc) =>
            (updateItem._id &&
              subDoc._id.toString() === updateItem._id.toString()) ||
            (updateItem.audience &&
              subDoc.audience.toLowerCase() ===
                updateItem.audience.toLowerCase())
        );

        if (existingSummary) {
          // Update each field inside the sub-document separately only if provided
          if (updateItem.audience)
            existingSummary.audience = updateItem.audience;
          if (updateItem.text) existingSummary.text = updateItem.text;
        } else {
          // If it doesn't exist at all, dynamically push it as a new entry
          resume.targetedSummaries.push(updateItem);
        }
      });
    } catch (error) {
      return next(
        new AppError(
          'targetedSummaries must be formatted as a valid JSON string',
          400
        )
      );
    }
  }

  // 4. Handle Cloudinary PDF update (only updates if a new file is attached)
  if (req.file) {
    const uploadStream = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio_files',
          public_id: `resume_${req.params.id}`,
          resource_type: 'auto',
          overwrite: true,
          invalidate: true
        },
        (error, result) => {
          if (error) return reject(new AppError('Failed to upload PDF', 500));
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    const cloudinaryResult = await uploadStream;
    resume.resumePdf = cloudinaryResult.secure_url;
  }

  // 5. Apply the standard modifications and save
  resume.set(filteredBody);
  await resume.save();

  res.status(200).json({
    status: 'success',
    data: { resume }
  });
});

exports.deleteResume = catchAsync(async (req, res, next) => {
  const resume = await Resume.findByIdAndDelete(req.params.id);

  if (!resume) {
    return next(new AppError('No resume found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
