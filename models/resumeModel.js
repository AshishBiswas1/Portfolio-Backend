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
      type: [
        {
          type: String,
          trim: true
        }
      ],
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
    location: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    github: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    socialLinks: {
      github: { type: String },
      linkedin: { type: String }
    },

    // 2. EXECUTIVE BRANDING & EXTENDED METADATA
    tagline: { type: String, trim: true },
    headline: { type: String, trim: true },
    preferredRole: { type: String, trim: true },
    yearsOfExperience: { type: String, trim: true },
    availabilityStatus: { type: String, trim: true },
    preferredWorkMode: { type: String, trim: true },
    website: { type: String, trim: true },
    leetcode: { type: String, trim: true },
    kaggle: { type: String, trim: true },
    twitter: { type: String, trim: true },
    coreCompetencies: [{ type: String, trim: true }],
    certifications: [
      {
        name: { type: String, trim: true },
        issuer: { type: String, trim: true },
        issueDate: { type: String, trim: true },
        credentialUrl: { type: String, trim: true }
      }
    ],
    languages: [
      {
        language: { type: String, trim: true },
        proficiency: { type: String, trim: true }
      }
    ],
    lastUpdatedDate: { type: String, trim: true },
    downloadCount: { type: Number, default: 0 },

    // 3. MODEL REFERENCES (Dynamically populates from respective collections)
    objective: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Objective'
    },
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
      }
    ],
    experiences: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Internship'
      }
    ],
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skills'
      }
    ],
    qualifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Qualification'
      }
    ],

    // 4. THE CLOUDINARY PDF LINK
    resumePdf: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: null
    },
    resumeUrl: {
      type: String,
      default: null
    },

    // 5. THE SUMMARIES
    defaultSummary: {
      type: String,
      required: [true, 'Please provide a default summary']
    },
    summary: {
      type: String
    },
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
            'General',
            'AI/ML',
            'AI'
          ],
          required: true
        },
        text: {
          type: String,
          required: true
        }
      }
    ],

    // 6. VERSION CONTROL
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Pre-save middleware for single active resume
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
