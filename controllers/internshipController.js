const AppError = require('../util/appError');
const catchAsync = require('../util/catchAsync');
const Internship = require('../models/internshipModel');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const filterObj = require('../util/filterObj');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.getAllInternships = catchAsync(async (req, res, next) => {
  const internships = await Internship.find()
    .select('role company workType location certificate duration')
    .sort('-endDateNumeric');

  res.status(200).json({
    status: 'success',
    result: internships.length,
    internships
  });
});

exports.getTopInternships = catchAsync(async (req, res, next) => {
  const internships = await Internship.find()
    .select('role company workType location certificate duration')
    .sort('-impactScore -endDateNumeric')
    .limit(3);

  res.status(200).json({
    status: 'success',
    result: internships.length,
    internships
  });
});

exports.getInternship = catchAsync(async (req, res, next) => {
  const internship = await Internship.findById(req.params.id);

  if (!internship) {
    return next(new AppError('Could not find the internship', 404));
  }

  res.status(200).json({
    status: 'success',
    internship
  });
});

exports.addInternship = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'role',
    'company',
    'workType',
    'location',
    'techStack',
    'impactScore',
    'description',
    'duration', // As discussed earlier, allow the top-level duration object!
    'duration.startDate',
    'duration.endDate'
  );

  const newInternshipId = new mongoose.Types.ObjectId();

  filteredBody._id = newInternshipId;

  if (req.file) {
    const uploadStream = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio_files',
          public_id: `internship_${newInternshipId}`,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) return reject(new AppError('Failed to upload image', 500));
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    const cloudinaryResult = await uploadStream;

    filteredBody.certificate = cloudinaryResult.secure_url;
  }

  const newInternship = await Internship.create(filteredBody);

  res.status(201).json({
    status: 'success',
    newInternship
  });
});

exports.updateInternship = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'role',
    'company',
    'workType',
    'location',
    'techStack',
    'impactScore',
    'description',
    'duration',
    'duration.startDate',
    'duration.endDate'
  );

  if (req.file) {
    const uploadStream = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio_files',
          public_id: `internship_${req.params.id}`,
          overwrite: true,
          invalidate: true,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) return reject(new AppError('Failed to upload image', 500));
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    const cloudinaryResult = await uploadStream;

    filteredBody.certificate = cloudinaryResult.secure_url;
  }

  const updatedInternship = await Internship.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      returnDocument: 'after',
      runValidators: true
    }
  );

  if (!updatedInternship) {
    return next(new AppError('No internship found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    internship: {
      updatedInternship
    }
  });
});

exports.deleteInternship = catchAsync(async (req, res, next) => {
  await Internship.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});
