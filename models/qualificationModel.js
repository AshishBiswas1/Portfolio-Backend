const mongoose = require('mongoose');
const validator = require('validator');

const qualificationSchema = new mongoose.Schema(
  {
    educationLevel: {
      type: String,
      required: [true, 'Please specify the level of education'],
      enum: {
        values: [
          'Secondary School',
          'Higher Secondary',
          'Undergraduate',
          'Postgraduate',
          'Diploma',
          'Certification'
        ],
        message:
          'Education level is either: Secondary School, Higher Secondary, Undergraduate, Postgraduate, Diploma, or Certification.'
      }
    },
    institution: {
      type: String,
      required: [true, 'Please provide the name of the institution.'],
      trim: true
    },
    degree: {
      type: String,
      required: [
        true,
        'Please provide the degree or standard (e.g., B.Tech, 12th Grade)'
      ],
      trim: true
    },
    fieldOfStudy: {
      type: String,
      trim: true
    },
    score: {
      type: String,
      trim: true
    },
    duration: {
      startYear: {
        type: String,
        requires: [true, 'Please provide a start Year']
      },
      endYear: {
        type: String,
        required: [true, 'Please provide an end year (or "Present")']
      }
    },
    endYearNumeric: {
      type: Number,
      select: false // Prevents this field from being sent to the frontend
    },
    description: {
      type: String,
      trim: true,
      maxLength: [
        200,
        'A description must have less or equal than 200 characters'
      ]
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==========================================
// 1. INDEXES
// ==========================================
qualificationSchema.index({ endYearNumeric: -1 });

// ==========================================
// 2. VIRTUAL PROPERTIES
// ==========================================
qualificationSchema.virtual('isCurrentlyOngoing').get(function () {
  if (!this.duration || !this.duration.endYear) return false;
  return this.duration.endYear.toLowerCase() === 'present';
});

// ==========================================
// 3. DOCUMENT MIDDLEWARE (PRE-SAVE HOOK)
// ==========================================
qualificationSchema.pre('save', function () {
  // If the user is currently studying here...
  if (this.duration.endYear.toLowerCase() === 'present') {
    this.endYearNumeric = 9999;
  } else {
    this.endYearNumeric = parseInt(this.duration.endYear, 10);
  }
});

// ==========================================
// 4. QUERY MIDDLEWARE (PRE-UPDATE HOOK)
// ==========================================
qualificationSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate();

  // Safely looks for standard updates OR Postman dot-notation updates
  const newEndYear =
    (update.duration && update.duration.endYear) ||
    update['duration.endYear'] ||
    (update.$set && update.$set['duration.endYear']);

  if (newEndYear) {
    if (newEndYear.toLowerCase() === 'present') {
      if (update.$set) update.$set.endYearNumeric = 9999;
      else update.endYearNumeric = 9999;
    } else {
      const parsedYear = parseInt(newEndYear, 10);
      if (update.$set) update.$set.endYearNumeric = parsedYear;
      else update.endYearNumeric = parsedYear;
    }
  }
});

const Qualification = mongoose.model('Qualification', qualificationSchema);

module.exports = Qualification;
