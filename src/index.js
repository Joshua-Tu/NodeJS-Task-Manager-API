const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT;

// File upload with multer library ************
// const multer = require('multer');
// const upload = multer({
//   dest: 'images',
//   limits: {
//     fileSize: 1000000,
//   },
//   fileFilter(req, file, cb) {
//     // cb(new Error('File must be a PDF'));
//     // cb(undefined, true);
//     // cb(undefined, false);

//     if (!file.originalname.match(/\.(doc|docx)/)) {
//       return cb(new Error('Please upload a Word document'));
//     };

//     // if (!file.originalname.endsWith('.pdf')) {
//     //   return cb(new Error('Please uplaod a PDF'))
//     // }

//     cb(undefined, true);
//   }
// });

// app.post('/upload', upload.single('upload'), async (req, res) => {
//   res.send();
// }, (err, req, res, next) => {
//   res.status(400).send({error: err.message});
// });
// ***********

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
  console.log('Server is up on port ' + port);
});


// hashed password - bcrypt
// const bcrypt = require('bcryptjs');
// const myFunc = async () =>  {
//   const password = 'Joshua@$TTJJKK!';
//   const hashedPassword = await bcrypt.hash(password, 8);

//   console.log(password);
//   console.log(hashedPassword);

//   // normal encryption joshua -> pfdsafeafearerer -> joshua
//   // Hash Algorithm: mypass -> fdasdfewanraewrneidngW@fdsf (this is one we encryption)
//   const isMatch = await bcrypt.compare('Joshua@$TTJJKK!', hashedPassword);
//   console.log(isMatch);
// }
// myFunc();


// json web token
// const jwt = require('jsonwebtoken');
// const myFunc = async () => {
//   const token = jwt.sign({ _id: 'abc123' }, 'ajwtsecret', { expiresIn: '7 days'});
//   console.log(token);

//   const data = jwt.verify(token, 'ajwtsecret');
//   console.log(data)
// };

// myFunc();


// ************* toJSON method
// const pet = {
//   name: 'Hal',
// };

// pet.toJSON = function () {
//   console.log(this);
//   return this;
// }

// console.log(JSON.stringify(pet));
// *************


// relationship building among models
// const Task = require('./models/task');
// const User = require('./models/user');

// const main = async () =>  {
//   // const task = await Task.findById('5f1bc691434c25ad92bf8fa5');
//   // await task.populate('owner').execPopulate();
//   // console.log(task.owner);

//   const user = await User.findById('5f1bc5828cb9bdad4eca404d');
//   await user.populate('tasks').execPopulate();
//   console.log(user.tasks);

// };

// main();
// **************

