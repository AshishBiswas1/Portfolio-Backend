const AppError = require('../util/appError');
const catchAsync = require('../util/catchAsync');
const Project = require('../models/projectModel');
const filterObj = require('../util/filterObj');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

const pythonMlClient = require('../util/pythonMlClient');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const { deleteFromCloudinary } = require('../util/cloudinaryHelper');

const uploadToCloudinary = (fileBuffer, folder, publicId, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType
      },
      (error, result) => {
        if (error) return reject(new AppError('Failed to upload to Cloudinary', 500));
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

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
    'category',
    'tags'
  );

  const newProjectId = new mongoose.Types.ObjectId();
  filteredBody._id = newProjectId;

  if (typeof filteredBody.technologies === 'string') {
    try { filteredBody.technologies = JSON.parse(filteredBody.technologies); } catch {}
  }
  if (typeof filteredBody.duration === 'string') {
    try { filteredBody.duration = JSON.parse(filteredBody.duration); } catch {}
  }
  if (typeof filteredBody.gitlink === 'string') {
    try { filteredBody.gitlink = JSON.parse(filteredBody.gitlink); } catch {}
  }

  const existingImages = req.body.existingImages ? (typeof req.body.existingImages === 'string' ? JSON.parse(req.body.existingImages) : req.body.existingImages) : [];
  let newImageUrls = [];

  if (req.files) {
    if (req.files.video && req.files.video[0]) {
      const cloudinaryResult = await uploadToCloudinary(
        req.files.video[0].buffer,
        'portfolio_files/video',
        `video_${newProjectId}`,
        'video'
      );
      filteredBody.video = cloudinaryResult.secure_url;
    }

    if (req.files.images && req.files.images.length > 0) {
      const uploadPromises = req.files.images.map((file, index) => {
        return uploadToCloudinary(
          file.buffer,
          'portfolio_files/images',
          `image_${newProjectId}_${Date.now()}_${index}`,
          'image'
        );
      });
      const results = await Promise.all(uploadPromises);
      newImageUrls = results.map(res => res.secure_url);
    }
  }

  filteredBody.image = [...existingImages, ...newImageUrls];

  // ─── DELEGATE TO PYTHON ML MICROSERVICE ───
  const techString = Array.isArray(filteredBody.technologies) ? filteredBody.technologies.join(' ') : (filteredBody.technologies || '');
  const fullText = `${filteredBody.title || ''} ${filteredBody.shortdescription || ''} ${filteredBody.description || ''} ${techString}`;
  filteredBody.embedding = await pythonMlClient.generateEmbedding(fullText);
  filteredBody.mlLastAnalyzed = new Date();

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
  const projects = await Project.find().sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: { projects }
  });
});

exports.getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { returnDocument: 'after' }
  );

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

  if (typeof filteredBody.technologies === 'string') {
    try { filteredBody.technologies = JSON.parse(filteredBody.technologies); } catch {}
  }
  if (typeof filteredBody.duration === 'string') {
    try { filteredBody.duration = JSON.parse(filteredBody.duration); } catch {}
  }
  if (typeof filteredBody.gitlink === 'string') {
    try { filteredBody.gitlink = JSON.parse(filteredBody.gitlink); } catch {}
  }

  const existingImages = req.body.existingImages ? (typeof req.body.existingImages === 'string' ? JSON.parse(req.body.existingImages) : req.body.existingImages) : [];
  let newImageUrls = [];

  if (req.files) {
    if (req.files.video && req.files.video[0]) {
      const oldProject = await Project.findById(req.params.id);
      if (oldProject && oldProject.video) {
        await deleteFromCloudinary(oldProject.video, 'video');
      }
      const cloudinaryResult = await uploadToCloudinary(
        req.files.video[0].buffer,
        'portfolio_files/video',
        `video_${req.params.id}_${Date.now()}`,
        'video'
      );
      filteredBody.video = cloudinaryResult.secure_url;
    }

    if (req.files.images && req.files.images.length > 0) {
      const uploadPromises = req.files.images.map((file, index) => {
        return uploadToCloudinary(
          file.buffer,
          'portfolio_files/images',
          `image_${req.params.id}_${Date.now()}_${index}`,
          'image'
        );
      });
      const results = await Promise.all(uploadPromises);
      newImageUrls = results.map(res => res.secure_url);
    }
  }

  if (req.body.existingImages || newImageUrls.length > 0) {
    filteredBody.image = [...existingImages, ...newImageUrls];
  }

  // Delete removed images from Cloudinary
  if (req.body.existingImages) {
    const oldProject = await Project.findById(req.params.id);
    if (oldProject && oldProject.image && oldProject.image.length > 0) {
      const imagesToDelete = oldProject.image.filter(imgUrl => !existingImages.includes(imgUrl));
      for (const img of imagesToDelete) {
        await deleteFromCloudinary(img, 'image');
      }
    }
  }

  // ─── DELEGATE TO PYTHON ML MICROSERVICE ON UPDATE ───
  if (filteredBody.title || filteredBody.description || filteredBody.shortdescription || filteredBody.technologies) {
    const existingProject = await Project.findById(req.params.id);
    const updatedTitle = filteredBody.title || existingProject?.title || '';
    const updatedShortDesc = filteredBody.shortdescription || existingProject?.shortdescription || '';
    const updatedDesc = filteredBody.description || existingProject?.description || '';
    const updatedTechs = filteredBody.technologies || existingProject?.technologies || [];

    const fullText = `${updatedTitle} ${updatedShortDesc} ${updatedDesc} ${updatedTechs.join(' ')}`;
    filteredBody.embedding = await pythonMlClient.generateEmbedding(fullText);
    filteredBody.mlLastAnalyzed = new Date();
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

exports.incrementProjectViews = catchAsync(async (req, res, next) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { returnDocument: 'after' }
  );

  if (!project) {
    return next(new AppError('No project found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { project }
  });
});

/**
 * ─── ML ENDPOINT: PERSONALIZED VECTOR RECOMMENDATIONS ───
 * Delegates to Python ML Microservice (Inter-Model Feedback Loop Model 2 -> Model 1)
 * GET /api/v1/projects/recommendations/:id?session_id=...
 */
exports.getProjectRecommendations = catchAsync(async (req, res, next) => {
  const targetProject = await Project.findById(req.params.id).select('+embedding');

  if (!targetProject) {
    return next(new AppError('Target project not found', 404));
  }

  let targetVector = targetProject.embedding;
  if (!targetVector || targetVector.length !== 384) {
    const fullText = `${targetProject.title} ${targetProject.shortdescription || ''} ${targetProject.description || ''} ${(targetProject.technologies || []).join(' ')}`;
    targetVector = await pythonMlClient.generateEmbedding(fullText);
    targetProject.embedding = targetVector;
    await targetProject.save({ validateBeforeSave: false });
  }

  const candidateProjects = await Project.find({ _id: { $ne: targetProject._id } }).select('+embedding');
  const candidateObjs = candidateProjects.map((p) => p.toObject());

  // Delegate Inter-Model Feedback personalization to Python FastAPI Service
  const recommendations = await pythonMlClient.getPersonalizedRecommendations(
    req.params.id,
    targetVector,
    candidateObjs,
    req.query.session_id || req.headers['x-session-id']
  );

  res.status(200).json({
    status: 'success',
    results: recommendations.length,
    data: { recommendations }
  });
});

/**
 * ─── ML ENDPOINT: DYNAMIC ROLE-BASED MATCH & RE-RANKING ───
 * GET /api/v1/projects/match?role=aiml
 */
exports.getRoleMatchedProjects = catchAsync(async (req, res, next) => {
  const sessionId = req.query.session_id || req.headers['x-session-id'];
  let role = req.query.role ? req.query.role.toLowerCase() : null;

  if (!role && sessionId) {
    const summaryData = await pythonMlClient.getTargetedSummary(null, sessionId);
    role = summaryData?.role || 'fullstack';
  }
  if (!role) role = 'fullstack';

  const projects = await Project.find();
  
  const sortedProjects = projects.map((p) => {
    const pObj = p.toObject();
    const roleScore = pObj.roleScores?.[role] || pObj.mlScore || 85;
    return { ...pObj, activeRoleScore: roleScore };
  }).sort((a, b) => b.activeRoleScore - a.activeRoleScore);

  res.status(200).json({
    status: 'success',
    results: sortedProjects.length,
    role,
    projects: sortedProjects
  });
});
