const mongoose = require('mongoose');
const validator = require('validator');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for your project'],
      trim: true,
      maxlength: [
        50,
        'A project title must have less or equal than 50 characters'
      ]
    },
    shortdescription: {
      type: String,
      required: [true, 'Please provide a short description for your project'],
      trim: true,
      maxlength: [
        50,
        'A short description must have less or equal than 50 characters'
      ]
    },
    description: {
      type: String,
      required: [true, 'Please provide a description for your project'],
      trim: true
    },
    technologies: {
      type: [String],
      required: [
        true,
        'Please provide at least one technology used in your project'
      ],
      validate: {
        validator: function (val) {
          return val && val.length > 0;
        },
        message: 'Please provide at least one technology used in your project'
      }
    },
    gitlink: {
      type: [String],
      trim: true,
      validate: {
        validator: function (val) {
          return val && val.every(validator.isURL);
        },
        message: 'Please provide valid URLs'
      }
    },
    deployedlink: {
      type: String,
      trim: true,
      validate: {
        validator: function (val) {
          return !val || validator.isURL(val);
        },
        message: 'Please provide a valid URL'
      }
    },
    duration: {
      type: [
        {
          month: {
            type: String,
            required: [true, 'Please provide a month'],
            // Optional: Restrict to valid month names to prevent typos in your CMS
            enum: [
              'January',
              'February',
              'March',
              'April',
              'May',
              'June',
              'July',
              'August',
              'September',
              'October',
              'November',
              'December',
              'Present' // Added 'Present' in case the internship/role is ongoing
            ]
          },
          year: {
            type: Number
            // Not required so that if month is "Present", year can be left empty
          },
          _id: false // Prevents Mongoose from generating an _id for these date objects
        }
      ],
      validate: {
        validator: function (val) {
          // Ensures the array contains exactly 2 objects (Index 0 = Start, Index 1 = End)
          return val && val.length === 2;
        },
        message:
          'Duration must contain exactly two objects: a start date and an end date'
      }
    },
    image: {
      type: [String],
      validate: {
        validator: function (val) {
          return !val || val.length === 0 || val.every(validator.isURL);
        },
        message: 'Please provide valid URLs for project images'
      }
    },
    video: {
      type: String,
      trim: true,
      validate: {
        validator: function (val) {
          return !val || validator.isURL(val);
        },
        message: 'Please provide a valid video URL'
      }
    },
    mlScore: {
      type: Number,
      default: 0,
      index: true
    },
    score: {
      type: Number,
      default: 90
    },
    category: {
      type: String,
      trim: true,
      default: 'Full Stack'
    },
    status: {
      type: String,
      trim: true,
      default: 'Published'
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    githubUrl: {
      type: String,
      trim: true
    },
    liveUrl: {
      type: String,
      trim: true
    },
    projectUrl: {
      type: String,
      trim: true
    },
    videoUrl: {
      type: String,
      trim: true
    },
    mlConfidence: {
      type: Number,
      default: 0,
      select: false
    },
    mlLastAnalyzed: {
      type: Date
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
