const AppError = require('../util/appError');
const catchAsync = require('../util/catchAsync');
const Objective = require('../models/objectiveModel');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    // We check the base field to allow MongoDB dot notation (e.g., 'focusAreas.0.title')
    const baseField = el.split('.')[0];
    if (allowedFields.includes(baseField)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getCarrierObjective = catchAsync(async (req, res, next) => {
  const objective = await Objective.find({ isActive: true });

  if (!objective) {
    return next(new AppError('No objective found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { objective }
  });
});

exports.createCarrierObjective = catchAsync(async (req, res, next) => {
  const newObjective = await Objective.create({
    headline: req.body.headline,
    description: req.body.description,
    focusAreas: req.body.focusAreas,
    isActive: req.body.isActive
  });

  res.status(201).json({
    status: 'success',
    data: { objective: newObjective }
  });
});

exports.updateCarrierObjective = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'headline',
    'description',
    'focusAreas',
    'isActive'
  );

  const updatedObjective = await Objective.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    { returnDocument: 'after', runValidators: true }
  );

  if (!updatedObjective) {
    return next(new AppError('No objective found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { objective: updatedObjective }
  });
});

exports.deleteCarrierObjective = catchAsync(async (req, res, next) => {
  await Objective.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});
