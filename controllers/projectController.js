const AppError = require('../util/appError');
const catchAsync = require('../util/catchAsync');
const Project = require('../models/projectModel');
const filterObj = require('../util/filterObj');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const { deleteFromCloudinary } = require('../util/cloudinaryHelper');

exports.createProject = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'title',
    'shortdescription',
    'description',
    'technologies',
    'gitlink',
    'deployedlink',
    'duration',
    'image'
  );

  const newProjectId = new mongoose.Types.ObjectId();
  filteredBody._id = newProjectId;

  if (req.file) {
    const uploadStream = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio_files/video',
          public_id: `video_${newProjectId}`,
          resource_type: 'video'
        },
        (error, result) => {
          if (error) return reject(new AppError('Failed to upload video to Cloudinary', 500));
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    const cloudinaryResult = await uploadStream;
    filteredBody.video = cloudinaryResult.secure_url;
  }

  const newProject = await Project.create(filteredBody);

  res.status(201).json({
    status: 'success',
    data: { project: newProject }
  });
});

exports.getTopProjects = catchAsync(async (req, res, next) => {
  let query = Project.find();

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  if (req.query.limit) {
    const limit = req.query.limit * 1;
    query = query.limit(limit);
  }

  const projects = await query;

  res.status(200).json({
    status: 'success',
    data: { projects }
  });
});

exports.getAllProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find();

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: { projects }
  });
});

exports.getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { project }
  });
});

exports.updateProject = catchAsync(async (req, res, next) => {
  const filteredBody = { ...req.body };
  delete filteredBody.mlScore;
  delete filteredBody.mlConfidence;
  delete filteredBody.mlLastAnalyzed;

  if (req.file) {
    const oldProject = await Project.findById(req.params.id);
    if (oldProject && oldProject.video) {
      await deleteFromCloudinary(oldProject.video, 'video');
    }

    const uploadStream = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio_files/video',
          public_id: `video_${req.params.id}`,
          overwrite: true,
          invalidate: true,
          resource_type: 'video'
        },
        (error, result) => {
          if (error) return reject(new AppError('Failed to upload video to Cloudinary', 500));
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    const cloudinaryResult = await uploadStream;
    filteredBody.video = cloudinaryResult.secure_url;
  }

  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    { returnDocument: 'after', runValidators: true }
  );

  if (!updatedProject) {
    return next(new AppError('No project found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { project: updatedProject }
  });
});

exports.deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndDelete(req.params.id);

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
