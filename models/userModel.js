const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [50, 'A user name must have less or equal than 50 characters'],
      minlength: [2, 'A user name must have more or equal than 2 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: 'Please provide a valid email'
      }
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'A password must have more or equal than 8 characters'],
      select: false
    },
    confirmPassword: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same!'
      }
    },
    designation: [
      {
        type: String,
        trim: true,
        maxlength: [
          100,
          'A designation must have less or equal than 100 characters'
        ],
        minlength: [
          2,
          'A designation must have more or equal than 2 characters'
        ]
      }
    ],
    photo: {
      type: String,
      default: 'default.jpg'
    },
    address: {
      type: String,
      trim: true,
      maxlength: [
        200,
        'An address must have less or equal than 200 characters'
      ],
      minlength: [5, 'An address must have more or equal than 5 characters']
    },
    number: {
      type: Number,
      validate: {
        validator: function (el) {
          return validator.isMobilePhone(el.toString(), 'any');
        },
        message: 'Please provide a valid phone number'
      }
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    githubLink: {
      type: String,
      validate: {
        validator: function (el) {
          return validator.isURL(el);
        },
        message: 'Please provide a valid URL'
      },
      trim: true
    },
    linkedinLink: {
      type: String,
      validate: {
        validator: function (el) {
          return validator.isURL(el);
        },
        message: 'Please provide a valid URL'
      },
      trim: true
    },
    passwordChangedAt: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Password hashing
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
});

userSchema.pre('save', function () {
  if (!this.isModified('password') || this.isNew) return;

  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.pre(/^find/, function () {
  this.find({ active: { $ne: false } });
});

const User = mongoose.model('User', userSchema);

module.exports = User;
