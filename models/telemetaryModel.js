const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: [true, 'Telemetry must belong to a specific project.']
  },
  eventType: {
    type: String,
    enum: ['card_view', 'github_click', 'demo_click', 'dwell_time'],
    required: [true, 'Event type must be specified.']
  },
  value: {
    type: Number,
    default: 1
  },
  visitorSession: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7776000
  }
});

telemetrySchema.index({ project: 1, eventType: 1 });

const Telemetry = mongoose.model('Telemetry', telemetrySchema);

module.exports = Telemetry;
