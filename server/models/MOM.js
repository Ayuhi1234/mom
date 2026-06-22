const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  assignee: { type: String },
  dueDate: { type: Date },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
});

const momSchema = new mongoose.Schema({
  meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
  summary: { type: String, required: true },
  agendaItems: [{ type: String }],
  keyDiscussionPoints: [{ type: String }],
  decisions: [{ type: String }],
  actionItems: [actionItemSchema],
  nextSteps: [{ type: String }],
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('MOM', momSchema);
