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

const { deleteFromCloudinary } = require('../util/cloudinaryHelper');

const uploadToCloudinary = (fileBuffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) return reject(new AppError('Failed to upload file to Cloudinary', 500));
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

exports.getAllInternships = catchAsync(async (req, res, next) => {
  const internships = await Internship.find()
    .select('role company workType location certificate offerLetter recommendationLetter duration')
    .sort('-endDateNumeric');

  res.status(200).json({
    status: 'success',
    result: internships.length,
    internships
  });
});

exports.getTopInternships = catchAsync(async (req, res, next) => {
  const internships = await Internship.find()
    .select('role company workType location certificate offerLetter recommendationLetter duration')
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
    'duration',
    'duration.startDate',
    'duration.endDate'
  );

  const newInternshipId = new mongoose.Types.ObjectId();
  filteredBody._id = newInternshipId;

  if (req.files) {
    if (req.files.certificate && req.files.certificate[0]) {
      const resVal = await uploadToCloudinary(
        req.files.certificate[0].buffer,
        'portfolio_files',
        `internship_${newInternshipId}`
      );
      filteredBody.certificate = resVal.secure_url;
    }
    if (req.files.offerLetter && req.files.offerLetter[0]) {
      const resVal = await uploadToCloudinary(
        req.files.offerLetter[0].buffer,
        'portfolio_files',
        `offerLetter_${newInternshipId}`
      );
      filteredBody.offerLetter = resVal.secure_url;
    }
    if (req.files.recommendationLetter && req.files.recommendationLetter[0]) {
      const resVal = await uploadToCloudinary(
        req.files.recommendationLetter[0].buffer,
        'portfolio_files',
        `recommendationLetter_${newInternshipId}`
      );
      filteredBody.recommendationLetter = resVal.secure_url;
    }
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

  const internship = await Internship.findById(req.params.id);
  if (!internship) {
    return next(new AppError('No internship found with that ID', 404));
  }

  if (req.files) {
    if (req.files.certificate && req.files.certificate[0]) {
      if (internship.certificate) {
        await deleteFromCloudinary(internship.certificate, 'image');
        await deleteFromCloudinary(internship.certificate, 'raw');
      }
      const resVal = await uploadToCloudinary(
        req.files.certificate[0].buffer,
        'portfolio_files',
        `internship_${req.params.id}`
      );
      filteredBody.certificate = resVal.secure_url;
    }
    if (req.files.offerLetter && req.files.offerLetter[0]) {
      if (internship.offerLetter) {
        await deleteFromCloudinary(internship.offerLetter, 'image');
        await deleteFromCloudinary(internship.offerLetter, 'raw');
      }
      const resVal = await uploadToCloudinary(
        req.files.offerLetter[0].buffer,
        'portfolio_files',
        `offerLetter_${req.params.id}`
      );
      filteredBody.offerLetter = resVal.secure_url;
    }
    if (req.files.recommendationLetter && req.files.recommendationLetter[0]) {
      if (internship.recommendationLetter) {
        await deleteFromCloudinary(internship.recommendationLetter, 'image');
        await deleteFromCloudinary(internship.recommendationLetter, 'raw');
      }
      const resVal = await uploadToCloudinary(
        req.files.recommendationLetter[0].buffer,
        'portfolio_files',
        `recommendationLetter_${req.params.id}`
      );
      filteredBody.recommendationLetter = resVal.secure_url;
    }
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
