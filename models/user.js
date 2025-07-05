const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  profession: String,
  role: {
    type: String,
    default: 'student' // or 'expert'
  },
  matches: [
    {
      name: String,
      email: String,
      profession: String,
      meetLink: String
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
