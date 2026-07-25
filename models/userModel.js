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
      required: [
        function () {
          return this.isModified('password');
        },
        'Please confirm your password'
      ],
      validate: {
        validator: function (el) {
          if (!this.isModified('password')) return true;
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
    passwordResetToken: String,
    passwordResetExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    bio: {
      type: String,
      trim: true
    },
    heroLine1: {
      type: String,
      trim: true
    },
    heroLine2: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    github: {
      type: String,
      trim: true
    },
    linkedin: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    },
    marquee: {
      type: String,
      trim: true
    },
    openForWork: {
      type: Boolean,
      default: false
    },
    statusMessage: {
      type: String,
      trim: true
    },
    preferredRole: {
      type: String,
      trim: true
    },
    heroMedia: {
      type: String,
      trim: true
    },
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
  this.find({ isActive: { $ne: false } });
});

// ==========================================
// METHOD 1: VERIFY LOGIN PASSWORD
// ==========================================
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // Compares plain text login attempt with the encrypted DB hash
  return await bcrypt.compare(candidatePassword, userPassword);
};

// ==========================================
// METHOD 2: VALIDATE JWT ISSUANCE TIME
// ==========================================
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // Returns true if password was changed AFTER the current token was generated
    return JWTTimestamp < changedTimestamp;
  }

  // False means the password has not been changed since token issuance
  return false;
};

// ==========================================
// METHOD 3: GENERATE PASSWORD RESET TOKEN
// ==========================================
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetToken = hashedToken;
  this.resetPasswordToken = hashedToken;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 Minute Expiry
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
