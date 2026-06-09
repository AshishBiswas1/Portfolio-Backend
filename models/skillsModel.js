const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [
        true,
        'Please provide the skill name (e.g., "React", "Node.js")'
      ],
      unique: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please provide a category for the skill'],
      enum: {
        values: ['Frontend', 'Backend', 'Database', 'DevOps', 'Tools', 'Other'],
        message:
          'Category must be Frontend, Backend, Database, DevOps, Tools, or Other'
      }
    },
    // Useful for rendering progress bars or radar charts on your frontend
    proficiency: {
      type: Number,
      required: [true, 'Please provide a proficiency level (1-100)'],
      min: [1, 'Proficiency must be at least 1'],
      max: [100, 'Proficiency cannot exceed 100']
    },
    // ==========================================
    // MACHINE LEARNING & RANKING FIELDS
    // ==========================================
    impactScore: {
      type: Number,
      default: 50,
      min: [1, 'Impact score must be at least 1'],
      max: [100, 'Impact score cannot exceed 100']
    },
    // Hidden tags your ML model uses to connect visitors to this skill
    mlKeywords: [
      {
        type: String,
        trim: true,
        select: false // Keeps payload size small by hiding this from standard GET requests
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==========================================
// INDEXES FOR ML QUERY PERFORMANCE
// ==========================================
skillSchema.index({ impactScore: -1, proficiency: -1 });
skillSchema.index({ category: 1 });

skillSchema.pre('save', function () {
  // If no keywords were provided, auto-generate basic ones
  if (!this.mlKeywords || this.mlKeywords.length === 0) {
    this.mlKeywords = [this.name.toLowerCase(), this.category.toLowerCase()];
  }
});

const validCategories = [
  'Frontend',
  'Backend',
  'Database',
  'DevOps',
  'Tools',
  'Other'
];

skillSchema.pre('validate', function () {
  if (this.category) {
    // Find the exact matching category regardless of case
    const exactMatch = validCategories.find(
      (cat) => cat.toLowerCase() === this.category.toLowerCase()
    );

    // If a match is found, apply the perfect casing.
    // If not, leave it alone and let Mongoose throw its normal error!
    if (exactMatch) {
      this.category = exactMatch;
    }
  }
});

skillSchema.pre('save', function () {
  if (this.name) {
    // Forces "react" or "rEACT" to always save as "React"
    this.name =
      this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
  }
});

// ==========================================
// QUERY MIDDLEWARE (Runs on PATCH / Update)
// ==========================================
skillSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate();

  // Find where the category string is hiding in the update object
  const categoryToUpdate =
    update.category || (update.$set && update.$set.category);

  if (categoryToUpdate) {
    const exactMatch = validCategories.find(
      (cat) => cat.toLowerCase() === categoryToUpdate.toLowerCase()
    );

    if (exactMatch) {
      if (update.category) update.category = exactMatch;
      if (update.$set && update.$set.category)
        update.$set.category = exactMatch;
    }
  }
});

const Skills = mongoose.model('Skills', skillSchema);

module.exports = Skills;
