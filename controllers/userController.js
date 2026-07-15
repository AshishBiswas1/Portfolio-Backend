const AppError = require('../util/appError');
const catchAsync = require('../util/catchAsync');
const User = require('../models/userModel');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const { deleteFromCloudinary } = require('../util/cloudinaryHelper');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getUserDetails = catchAsync(async (req, res, next) => {
  const user = await User.find().select(
    'name email designation photo address number githubLink linkedinLink'
  );

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

exports.updateUserDetails = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'name',
    'email',
    'designation',
    'githubLink',
    'linkedinLink'
  );

  if (req.file) {
    const oldUser = await User.findById(req.user.id);
    if (oldUser && oldUser.photo) {
      await deleteFromCloudinary(oldUser.photo, 'image');
    }

    const uploadStream = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio_files',
          public_id: `user_${req.user.id}`,
          overwrite: true,
          invalidate: true
        },
        (error, result) => {
          if (error) return reject(new AppError('Failed to upload image', 500));
          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    const cloudinaryResult = await uploadStream;

    filteredBody.photo = cloudinaryResult.secure_url;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    returnDocument: 'after',
    runValidators: true
  });

  if (!updatedUser) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser }
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  const isCurrentPasswordCorrect = await user.correctPassword(
    req.body.currentPassword,
    user.password
  );

  if (!isCurrentPasswordCorrect) {
    return next(new AppError('Your current password is incorrect.', 401));
  }

  user.password = req.body.newPassword;
  user.confirmPassword = req.body.confirmPassword;

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully.'
  });
});
