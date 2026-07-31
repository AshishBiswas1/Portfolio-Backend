const mongoose = require('mongoose');
const validator = require('validator');

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name.'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters.']
    },
    email: {
      type: String,
      required: [true, 'Please provide a valid email address for replies.'],
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email structure.']
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [200, 'Subject line cannot exceed 200 characters.'],
      default: 'General Portfolio Inquiry'
    },
    message: {
      type: String,
      required: [true, 'A message body cannot be empty.'],
      trim: true
    },
    mlAnalysis: {
      intent: {
        type: String,
        enum: ['Hiring/Recruiter', 'Project Work', 'General Question', 'Spam'],
        default: 'General Question'
      },
      confidenceScore: { type: Number, default: 0.85 },
      priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
      sentimentScore: { type: Number, default: 0.5 },
      keywords: [{ type: String }]
    },
    isRead: {
      type: Boolean,
      default: false
    },
    repliedAt: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==========================================
// INDEXES
// ==========================================
contactSchema.index({ createdAt: -1 });
contactSchema.index({ isRead: 1 });

// ==========================================
// PRE-HOOKS / MIDDLEWARES
// ==========================================
contactSchema.pre('save', function () {
  if (!this.subject || this.subject.trim() === '') {
    this.subject = 'General Portfolio Inquiry';
  }
});

// ==========================================
// INSTANCE METHODS
// ==========================================
contactSchema.methods.markAsRead = async function () {
  this.isRead = true;
  return await this.save({ validateBeforeSave: false });
};

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
