const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    // 1. STANDARD RESUME FIELDS
    fullName: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true
    },
    professionalTitle: {
      // Notice how we open the array, THEN define the string properties
      type: [
        {
          type: String,
          trim: true
        }
      ],
      // This custom validator ensures the array isn't submitted empty []
      validate: [
        (val) => val.length > 0,
        'Please provide at least one professional title (e.g., Full Stack Developer)'
      ]
    },
    contact: {
      email: { type: String, required: true },
      phone: { type: String },
      location: { type: String }
    },
    socialLinks: {
      github: { type: String },
      linkedin: { type: String }
    },

    // 2. THE CLOUDINARY PDF LINK
    resumePdf: {
      type: String,
      default: null // Will be populated by our Cloudinary upload stream
    },

    // 3. THE SUMMARIES
    // The fallback summary if the ML model hasn't figured out what the visitor wants yet
    defaultSummary: {
      type: String,
      required: [true, 'Please provide a default summary']
    },

    // The ML-Driven Array: Your Next.js app will analyze the visitor,
    // find the matching audience in this array, and display that specific text!
    targetedSummaries: [
      {
        audience: {
          type: String,
          enum: [
            'Frontend',
            'Backend',
            'FullStack',
            'DataScience',
            'DevOps',
            'General'
          ],
          required: true
        },
        text: {
          type: String,
          required: true
        }
      }
    ],

    // 4. VERSION CONTROL
    // Allows you to have multiple resumes in the database, but only show the active one
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// ==========================================
// DOCUMENT MIDDLEWARE
// ==========================================
// If you create a new resume and set it to active, this hook automatically
// sets all your older resumes to inactive, so you only ever have one active at a time!
resumeSchema.pre('save', async function () {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
});

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
