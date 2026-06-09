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
    'mlKeywords' // Pass keywords as an array from Postman/Frontend
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
    'mlKeywords'
  );

  const updatedSkill = await Skills.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      returnDocument: 'after', // Returns the newly updated document instead of the old one
      runValidators: true // Ensures the enum categories and max values are strictly followed
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
