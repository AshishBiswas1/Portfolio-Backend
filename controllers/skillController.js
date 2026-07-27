const AppError = require('../util/appError');
const catchAsync = require('../util/catchAsync');
const Skills = require('../models/skillsModel');
const filterObj = require('../util/filterObj');

exports.getTopSkills = catchAsync(async (req, res, next) => {
  let query = Skills.find();

  if (req.query.category) {
    query = query.find({ category: req.query.category });
  }

  const skills = await query.sort('-impactScore -proficiency').limit(5);

  res.status(200).json({
    status: 'success',
    result: skills.length,
    skills
  });
});

exports.getAllSkills = catchAsync(async (req, res, next) => {
  const skills = await Skills.find().sort('-impactScore -proficiency');

  res.status(200).json({
    status: 'success',
    results: skills.length,
    skills
  });
});

exports.addSkill = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'name',
    'category',
    'proficiency',
    'impactScore',
    'featured',
    'isFeatured',
    'mlKeywords'
  );

  const newSkill = await Skills.create(filteredBody);

  res.status(201).json({
    status: 'success',
    newSkill
  });
});

exports.updateSkill = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'name',
    'category',
    'proficiency',
    'impactScore',
    'featured',
    'isFeatured',
    'mlKeywords'
  );

  const updatedSkill = await Skills.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      returnDocument: 'after',
      runValidators: true
    }
  );

  if (!updatedSkill) {
    return next(new AppError('No skill found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    updatedSkill
  });
});

exports.deleteSkill = catchAsync(async (req, res, next) => {
  const skill = await Skills.findByIdAndDelete(req.params.id);

  if (!skill) {
    return next(new AppError('No skill found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.incrementSkillViews = catchAsync(async (req, res, next) => {
  const updatedSkill = await Skills.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { returnDocument: 'after' }
  );

  if (!updatedSkill) {
    return next(new AppError('No skill found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    updatedSkill
  });
});
