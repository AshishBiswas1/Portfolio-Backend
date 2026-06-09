const AppError = require('../util/appError');
const catchAsync = require('../util/catchAsync');
const Qualification = require('../models/qualificationModel');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    const baseField = el.split('.')[0];
    if (allowedFields.includes(baseField)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

exports.getAllQualification = catchAsync(async (req, res, next) => {
  const qualifications = await Qualification.find()
    .select('educationLevel institution degree score duration')
    .sort('-endYearNumeric');

  res.status(200).json({
    status: 'success',
    result: qualifications.length,
    data: {
      qualifications
    }
  });
});

exports.getQualification = catchAsync(async (req, res, next) => {
  const qualification = await Qualification.findById(req.params.id);

  if (!qualification) {
    return next(new AppError('No Qualification details were found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      qualification
    }
  });
});

exports.addQualification = catchAsync(async (req, res, next) => {
  const newQualification = await Qualification.create({
    educationLevel: req.body.educationLevel,
    institution: req.body.institution,
    degree: req.body.degree,
    fieldOfStudy: req.body.fieldOfStudy,
    score: req.body.score,
    duration: req.body.duration,
    description: req.body.description
  });

  res.status(201).json({
    status: 'success',
    data: {
      newQualification
    }
  });
});

exports.updateQualification = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'educationLevel',
    'institution',
    'degree',
    'fieldOfStudy',
    'score',
    'duration',
    'description'
  );

  const updatedQualification = await Qualification.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      returnDocument: 'after',
      runValidators: true
    }
  );

  if (!updatedQualification) {
    return next(new AppError('Failed to update the Qualification', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      updatedQualification
    }
  });
});

exports.deleteQualification = catchAsync(async (req, res, next) => {
  await Qualification.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});
