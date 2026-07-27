const mongoose = require('mongoose');
const validator = require('validator');
const sendEmail = require('../util/email'); // Import your custom email engine

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
      default: 'General Portfolio Inquiry' // Fallback fallback if user leaves blank
    },
    message: {
      type: String,
      required: [true, 'A message body cannot be empty.'],
      trim: true
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
    // Ensures virtual properties show up when converting documents to JSON/Objects
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==========================================
// INDEXES (Performance Optimization)
// ==========================================
// Optimizes your admin dashboard queries to quickly find unread messages and display latest entries first
contactSchema.index({ createdAt: -1 });
contactSchema.index({ isRead: 1 });

// ==========================================
// PRE-HOOKS / MIDDLEWARES
// ==========================================
// Sanitize or adjust data before writing to MongoDB
contactSchema.pre('save', function () {
  // If the user typed an empty string or spaces for a subject, reset it to the default
  if (!this.subject || this.subject.trim() === '') {
    this.subject = 'General Portfolio Inquiry';
  }
});

// ==========================================
// POST-HOOKS / MIDDLEWARES
// ==========================================
// AUTOMATED EMAIL ALERT: Triggers the moment a new message is successfully saved to the DB
contactSchema.post('save', async function (doc) {
  // Guard: Only send email alert when a NEW message document is created
  // Do NOT send email alerts when admin marks the message as read or updates repliedAt
  if (doc.__isModifiedRead) return;

  try {
    const adminEmail =
      process.env.ADMIN_EMAIL ||
      process.env.EMAIL_USERNAME ||
      'biswasashish655@gmail.com';

    await sendEmail({
      email: adminEmail, // Recipient email address (Portfolio Owner)
      replyTo: doc.email, // Pressing reply in your inbox goes straight to the visitor!
      subject: `📬 Portfolio Message from ${doc.name}: ${doc.subject}`,
      template: 'contactForm', // Executes your view/email/contactForm.pug template
      data: {
        visitorName: doc.name,
        visitorEmail: doc.email,
        visitorMessage: doc.message
      }
    });
  } catch (err) {
    console.error(
      'Automated contact form notification email failed to send:',
      err.message
    );
  }
});

// ==========================================
// INSTANCE METHODS
// ==========================================
// Helpful helper methods for your admin dashboard controllers
contactSchema.methods.markAsRead = async function () {
  this.isRead = true;
  return await this.save({ validateBeforeSave: false });
};

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
