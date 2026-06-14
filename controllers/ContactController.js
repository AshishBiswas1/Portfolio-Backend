const Contact = require('../models/contactModel');
const AppError = require('../util/appError');
const catchAsync = require('../util/catchAsync');

// ==========================================
// 1. GET ALL CONTACTS
// ==========================================
exports.getAllContacts = catchAsync(async (req, res, next) => {
  const contacts = await Contact.find();

  res.status(200).json({
    status: 'success',
    results: contacts.length,
    contacts
  });
});

// ==========================================
// 2. GET SINGLE CONTACT (Auto-marks as read)
// ==========================================
exports.getContact = catchAsync(async (req, res, next) => {
  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    return next(new AppError('No message found with that ID', 404));
  }

  // Smart Automation: If the message hasn't been read yet, trigger our model's instance method
  if (!contact.isRead) {
    await contact.markAsRead();
  }

  res.status(200).json({
    status: 'success',
    contact
  });
});

// ==========================================
// 3. DELETE CONTACT
// ==========================================
exports.deleteContact = catchAsync(async (req, res, next) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);

  if (!contact) {
    return next(new AppError('No message found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// ==========================================
// 4. REPLY TO CONTACT
// ==========================================
exports.replyToContact = catchAsync(async (req, res, next) => {
  const { message, subject } = req.body;

  // 1) Guard Rail: Ensure the admin actually wrote a response body
  if (!message || message.trim() === '') {
    return next(
      new AppError('Please provide both subject and message for the reply', 400)
    );
  }

  // 2. Fetch target visitor details from the database
  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    return next(new AppError('No message found with that ID', 404));
  }

  // 3. Fallback to an automated thread reference subject line if left blank
  const replySubject = subject || `Reply for: ${contact.subject}`;

  // 4. Execute the mail delivery pipeline directly to the visitor's email inbox
  await sendEmail({
    email: contact.email, // Sent directly to the visitor
    subject: replySubject,
    template: 'adminReply', // Executes a clean template layout
    data: {
      firstName: contact.name,
      originalMessage: contact.message,
      replyMessage: message
    }
  });

  // 5. Update state parameters on the document to track administrative engagement
  contact.repliedAt = Date.now();
  await contact.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: `Reply successfully dispatched to ${contact.email}`
  });
});

// ==========================================
// 5. SUBMIT CONTACT FORM (Public Endpoint)
// ==========================================
exports.submitContactForm = catchAsync(async (req, res, next) => {
  const newContact = await Contact.create({
    name: req.body.name,
    email: req.body.email,
    subject: req.body.subject,
    message: req.body.message
  });

  res.status(201).json({
    status: 'success',
    message: 'Your message has been received! Thank you for reaching out.',
    newContact
  });
});
