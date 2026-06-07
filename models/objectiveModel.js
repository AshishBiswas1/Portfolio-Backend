const mongoose = require('mongoose');

const objectiveSchema = new mongoose.Schema(
  {
    headline: {
      type: String,
      required: [true, 'Please provide a headline for your career objective'],
      trim: true,
      maxlength: [100, 'A headline must have less or equal than 200 characters']
    },
    description: {
      type: String,
      required: [
        true,
        'Please provide a description for your career objective'
      ],
      trim: true
    },
    focusAreas: {
      type: [
        {
          title: {
            type: String,
            required: [true, 'Each focus area must have a title'],
            trim: true
          },
          proficiency: {
            type: String,
            required: [true, 'Each focus area must have a proficiency level'],
            trim: true,
            enum: ['Familiar', 'Proficient', 'Expert'],
            default: 'Proficient'
          },
          _id: false
        }
      ],
      validate: {
        validator: function (val) {
          return val && val.length > 0;
        },
        message:
          'Please provide at least one focus area for your career objective'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

objectiveSchema.pre(/^find/, function () {
  this.find({ isActive: { $ne: false } });
});

objectiveSchema.pre('save', async function () {
  // 'this' refers to the document currently being saved
  if (this.isActive) {
    // this.constructor refers to the Objective model itself
    await this.constructor.updateMany(
      { _id: { $ne: this._id } }, // Find all objectives EXCEPT this one
      { isActive: false } // Set them to false
    );
  }
});

objectiveSchema.post('save', async function () {
  // If you ever set up On-Demand Revalidation in Next.js,
  // you would trigger a fetch request here to your frontend API
  // to tell it to rebuild the cache because an objective was updated.

  console.log(`Objective updated. (ID: ${this._id})`);
});

const Objective = mongoose.model('Objective', objectiveSchema);

module.exports = Objective;
