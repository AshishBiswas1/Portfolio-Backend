const Contact = require('../models/contactModel');
const AppError = require('../util/appError');
const catchAsync = require('../util/catchAsync');
const sendEmail = require('../util/email');
const pythonMlClient = require('../util/pythonMlClient');

// ==========================================
// 1. GET ALL CONTACTS
// ==========================================
exports.getAllContacts = catchAsync(async (req, res, next) => {
  const contacts = await Contact.find().sort('-createdAt');

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
// 4. REPLY TO CONTACT (Triggers Model 2 Online Learning Feedback)
// ==========================================
exports.replyToContact = catchAsync(async (req, res, next) => {
  const { message, subject } = req.body;

  if (!message || message.trim() === '') {
    return next(
      new AppError('Please provide both subject and message for the reply', 400)
    );
  }

  const contact = await Contact.findById(req.params.id);

  if (!contact) {
    return next(new AppError('No message found with that ID', 404));
  }

  const replySubject = subject || `Reply for: ${contact.subject}`;

  await sendEmail({
    email: contact.email,
    subject: replySubject,
    template: 'adminReply',
    data: {
      firstName: contact.name,
      originalMessage: contact.message,
      replyMessage: message
    }
  });

  // ─── MODEL 2 ONLINE INCREMENTAL LEARNING FEEDBACK (partial_fit) ───
  try {
    const feedbackText = `${contact.subject} ${contact.message}`;
    const intentLabel = contact.mlAnalysis?.intent || 'Hiring/Recruiter';
    await pythonMlClient.sendFeedback(feedbackText, intentLabel);
  } catch (mlErr) {
    console.error('[Model 2 Feedback Error]:', mlErr.message);
  }

  contact.repliedAt = Date.now();
  await contact.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: `Reply successfully dispatched to ${contact.email}`
  });
});

// ==========================================
// 5. SUBMIT CONTACT FORM (Public Endpoint + Python Model 2 Inference)
// ==========================================
exports.submitContactForm = catchAsync(async (req, res, next) => {
  // ─── MODEL 2 INFERENCE: Delegate to Python ML Service ───
  const mlAnalysis = await pythonMlClient.predictIntent(req.body.subject, req.body.message);

  // 1. Save contact message with ML Insights to MongoDB Atlas
  const newContact = await Contact.create({
    name: req.body.name,
    email: req.body.email,
    subject: req.body.subject,
    message: req.body.message,
    mlAnalysis
  });

  // 2. Send email notification alert to admin with ML priority subject line
  try {
    const adminEmail =
      process.env.ADMIN_EMAIL ||
      process.env.EMAIL_USERNAME ||
      'biswasashish655@gmail.com';

    await sendEmail({
      email: adminEmail,
      replyTo: newContact.email,
      subject: `[${mlAnalysis.priority} Priority - ${mlAnalysis.intent}] Portfolio Message from ${newContact.name}`,
      template: 'contactForm',
      data: {
        visitorName: newContact.name,
        visitorEmail: newContact.email,
        visitorMessage: newContact.message,
        intent: mlAnalysis.intent,
        priority: mlAnalysis.priority
      }
    });
  } catch (emailErr) {
    console.error('[Contact Form Email Dispatch Error]:', emailErr.message);
  }

  res.status(201).json({
    status: 'success',
    message: 'Your message has been received! Thank you for reaching out.',
    newContact
  });
});
