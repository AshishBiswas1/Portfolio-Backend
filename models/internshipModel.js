const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, 'Please provide you job title or role'],
      trim: true
    },
    company: {
      type: String,
      required: [true, 'Please provide the company name.'],
      trim: true
    },
    workType: {
      type: String,
      enum: {
        values: ['Remote', 'On-site', 'Hybrid'],
        message: 'Work type must be either Remote, On-site, or Hybrid'
      },
      default: 'Remote'
    },
    location: {
      type: String,
      trim: true
    },
    techStack: [
      {
        type: String,
        trim: true
      }
    ],
    impactScore: {
      type: Number,
      default: 50,
      min: [1, 'Impact score must be at least 1'],
      max: [100, 'Impact score cannot exceed 100']
    },
    description: {
      type: [String],
      required: [
        true,
        'Please provide at least one bullet point of description'
      ]
    },
    certificate: {
      type: String,
      trim: true,
      default: null
    },
    duration: {
      startDate: {
        type: String,
        required: [true, 'Please provide a start date (e.g., "April 2026")']
      },
      endDate: {
        type: String,
        required: [true, 'Please provide an end date (or "Present")']
      }
    },
    endDateNumeric: {
      type: Number,
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

internshipSchema.index({ impactScore: -1, endDateNumeric: -1 });

// ==========================================
// 2. VIRTUAL PROPERTIES
// ==========================================
internshipSchema.virtual('isCurrentlyActive').get(function () {
  if (!this.duration || !this.duration.endDate) return false;
  return this.duration.endDate.toLowerCase() === 'present';
});

// ==========================================
// 3. DOCUMENT MIDDLEWARE (PRE-SAVE HOOK)
// ==========================================
internshipSchema.pre('save', function () {
  if (this.duration.endDate.toLowerCase() === 'present') {
    this.endDateNumeric = 999999; // Massive number to always stay at the top
  } else {
    // Converts "April 2026" or "2026" into a sortable number.
    // Grabs the last 4 characters (the year) and turns it into an integer.
    const yearString = this.duration.endDate.slice(-4);
    this.endDateNumeric = parseInt(yearString, 10);
  }
});

// ==========================================
// 4. QUERY MIDDLEWARE (PRE-UPDATE HOOK)
// ==========================================
internshipSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate();

  const newEndDate =
    (update.duration && update.duration.endDate) ||
    update['duration.endDate'] ||
    (update.$set && update.$set['duration.endDate']);

  if (newEndDate) {
    if (newEndDate.toLowerCase() === 'present') {
      if (update.$set) update.$set.endDateNumeric = 999999;
      else update.endDateNumeric = 999999;
    } else {
      const yearString = newEndDate.slice(-4);
      const parsedYear = parseInt(yearString, 10);

      if (update.$set) update.$set.endDateNumeric = parsedYear;
      else update.endDateNumeric = parsedYear;
    }
  }
});

const Internship = mongoose.model('Internship', internshipSchema);

module.exports = Internship;
