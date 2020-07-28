const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('../models/task');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid');
      }
    },
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) {
        throw new Error('Age must be a positive number')
      }
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
    trim: true,
    validate(value) {
      if (value.toLowerCase().includes('password')) {
        throw Error('Password should not include the "password"');
      };
    },
  },
  tokens: [{
    token: {
      type: String,
      required: true,
    }
  }],
  avatar: {
    type: Buffer,
  }
}, {
  timestamps: true
});

// 这个virtual filed之所以叫做virtual，是因为
// 它并不实际存储于database,只是用于告知mongoose模型之间的关系
// 所以它才叫virtual
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner',
});

// 不显示token和password给respond ////////
// 方法一
// userSchema.methods.getPublicProfile = function () {
//   const user = this;
//   // toObject() is provided by mongoose
//   const userObject = user.toObject();

//   delete userObject.password;
//   delete userObject.tokens;

//   return userObject;
// };

// 方法二
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
};
// ///////////

// methods 是对document instances
userSchema.methods.generateAuhToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString()}, process.env.JWT_SECRET)

  // concat和spread operator等效
  // user.tokens = user.tokens.concat({ token });
  user.tokens = [...user.tokens, { token }];
  await user.save();

  return token;
};

// statics 是对model methods
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('Unable to login');
  };

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error('Unable to login');
  };

  return user;
};

// Hash the plain text password before saving
// 一定要用标准function,而不是arrow function, 因为arrow functions don't bind this
userSchema.pre('save', async function (next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  };

  next();
});

// Delete user tasks when user is removed
// 经过测试，用post也可以，但是由于删除后无后续操作，所以next
// 不需要。否则会一直处于发送请求状态，userSchema.post('remove', async function (doc, next) {...})
// 其中next不是必须，此处不需要。
userSchema.pre('remove', async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
