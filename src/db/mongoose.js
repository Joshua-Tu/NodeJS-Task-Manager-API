const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,

  // will address the deprecate warning findByIdAndUpdate
  useFindAndModify: false,
});

