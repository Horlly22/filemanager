const { Schema, model } = require('mongoose');

const fileSchema = new Schema({
  originalName: String,
  storedName:   String,
  folder:       String,
  path:         String,
  mimeType:     String,
  uploadedAt:   { type: Date, default: Date.now }
});

module.exports = model('File', fileSchema);