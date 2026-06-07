const AppError = require('../util/appError');
const catchAsync = require('../util/catchAsync');
const Project = require('../models/projectModel');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
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
    'image'
  );

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
