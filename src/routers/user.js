const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')
const router = new express.Router();

// route for signing up
router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    // sendWelcomeEmail不需要await
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuhToken();
    res.status(201).send({ user, token });
  } catch (err) {
    res.status(400).send(err);
  }

  // user.save().then(() => {
  //   res.status(201).send(user);
  // }).catch(err => {
  //   res.status(400).send(err);
  // });
});

// route for signing in
router.post('/users/login', async (req, res) => {
  try {
    // findByCredentials为自定义的方法，在user model中定义
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuhToken();
    // 让respond的user中不含password和tokens /////
    // 方法一  ///
    // res.send({ user: user.getPublicProfile(), token });
    // 方法二
    res.send({ user, token });
    // ///////////
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    })
    await req.user.save();

    res.send(req.user);
  } catch (err) {
    res.status(500).send();
  }
})

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.status(200).send(req.user);
  } catch (err) {
    res.status(500).send();
  }
})

// auth这是middleware, 第二个参数是middleware
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);

  // User.find({}).then(users => {
  //   res.status(200).send(users);
  // }).catch(e => {
  //   res.status(500).send();
  // });
});

// 由于已经有/users/me了，这里不需要/users/:id了，因为其他user不能查看非本人的user信息
// router.get('/users/:id', async (req, res) => {
//   const _id = req.params.id;

//   try {
//     const user = await User.findById(_id);

//     if (!user) {
//       return res.status(404).send();
//     }

//     res.status(200).send(user);
//   } catch (err) {
//     res.status(500).send();
//   }

  // User.findById(_id).then(user => {
  //   if (!user) {
  //     return res.status(404).send();
  //   }

  //   res.send(user);
  // }).catch(e => {
  //   res.status(500).send();
  // });
// });

router.patch('/users/me', auth, async (req, res) => {
  // 如果用户要更新除['name', 'email', 'password', 'age']以外的栏位，mongoose的findByIdAndUpdate是仍然允许的，但会忽略不在前面四项中的栏位，
  // 所以我们要创建一个额外的400提示
  // 下面4行是判断body中是否含有name, email, password和age中的栏位，如果没有，比如对一个user更新height: 172，则返回‘Invalid updates!‘的提示
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {

    // const user = await User.findByIdAndUpdate(id, req.body, { new: true, runValidators: true});
    const { user } = req;
    updates.forEach(update => user[update] = req.body[update]);
    await user.save();

    // if (!user) {
    //   return res.status(404).send();
    // }
    res.status(200).send(user);

  } catch (err) {
    if (err.message == `Cast to ObjectId failed for value "${id}" at path "_id" for model "User"`) {
      return res.status(404).send();
    }
    res.status(400).send(err);
  }
});

router.delete('/users/me', auth, async (req, res) => {
  try {
    // 方法一
    // req.user由middleware auth中传入
    // const user = await User.findByIdAndDelete(req.user._id);

    // if (!user) {
    //   return res.status(404).send();
    // }
    // ///////

    // 方法二
    const { user: { email, name } } = req;
    await req.user.remove();
    // ///////

    sendCancellationEmail(email, name);

    res.send(req.user);

  } catch (err) {
    if (err.message == `Cast to ObjectId failed for value "${id}" at path "_id" for model "User"`) {
      return res.status(404).send();
    };

    res.status(500).send();
  }
});



const upload = multer({
  // dest: 'avatars',
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload a JPG or JPEG file'));
    }

    cb(undefined, true);
  }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  // sharp是用来对上传的图片文件进行预处理的
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
  req.user.avatar = buffer;

  await req.user.save();
  res.send();
});

router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    if (!req.user.avatar) {
      throw new Error('You do not have an avatar');
    }

    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (err) {
    res.status(404).send({error: err.message});
  }
});

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById({_id: req.params.id});

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set('Content-Type', 'image/jpg');
    res.send(user.avatar);
  } catch (err) {
    res.status(404).send();
  }
});

module.exports = router;
