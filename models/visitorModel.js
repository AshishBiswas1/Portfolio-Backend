const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  ip: {
    type: String,
    trim: true,
    default: '127.0.0.1'
  },
  userAgent: {
    type: String,
    trim: true
  },
  path: {
    type: String,
    trim: true,
    default: '/'
  },
  referrer: {
    type: String,
    trim: true,
    default: 'Direct'
  },
  source: {
    type: String,
    enum: ['Google', 'GitHub', 'LinkedIn', 'Twitter', 'Direct', 'Other'],
    default: 'Direct'
  },
  device: {
    type: String,
    enum: ['Desktop', 'Mobile', 'Tablet'],
    default: 'Desktop'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

visitorSchema.index({ createdAt: -1 });
visitorSchema.index({ source: 1 });
visitorSchema.index({ device: 1 });

const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;
