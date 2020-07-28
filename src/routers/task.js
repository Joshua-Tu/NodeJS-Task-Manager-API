const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  })

  try {
    await task.save();
    res.status(201).send(task);
  } catch (err) {
    res.status(400).send(err.message);
  }

  // task.save().then(() => {
  //   res.status(201).send(task);
  // }).catch(err => {
  //   res.status(400).send(err);
  // })
});

// GET /tasks?completed=false
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
  try {
    const match = {};
    const sort = {};

    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] == 'asc' ? 1 : -1;
    }

    if (req.query.completed) {
      match.completed = req.query.completed == 'true' ? true : false;
    }

    const { user } = req;
    await user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    }).execPopulate();
    res.send(user.tasks)
    // ///

    if (tasks.length === 0) {
      return res.status(200).send('No tasks existing');
    }

    res.status(200).send(tasks);
  } catch (err) {
    res.status(500).send(err.message);
  }

  // Task.find({}).then(tasks => {
  //   res.status(200).send(tasks);
  // }).catch(e => {
  //   res.status(500).send();
  // })
});

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send(task);
  } catch (err) {
    res.status(500).send();
  }

  // Task.findById(_id).then(task => {
  //   if (!task) {
  //     return res.status(404).send();
  //   }

  //   res.status(200).send(task);
  // }).catch(e => {
  //   // 鉴于上面的!task不起作用，顾写了这个if语句，error.reason此时为空大概是说服务器端没有错误，仍有返回task为null，即没找到，所以reason为空
  //   if (Object.keys(e.reason.length === 0)) {
  //     return res.status(404).send();
  //   }
  //   res.status(500).send();
  // });
});

router.patch('/tasks/:id', auth, async (req, res) => {
  const { id } = req.params;

  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid update!'});
  }

  try {
    // const task = await Task.findByIdAndUpdate(id, req.body, { new: true, runValidators: true});

    const task = await Task.findOne({ _id: id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach(update => {
      task[update] = req.body[update];
    });
    await task.save();

    res.status(200).send(task);
  } catch (err) {
    res.status(500).send();
  }
});

router.delete('/tasks/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findOneAndDelete({ _id: id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    res.status(200).send(task);
  } catch (err) {
      if (err.message === `Cast to ObjectId failed for value "${id}" at path "_id" for model "Task"`) {
        return res.status(404).send();
      }

      res.status(500).send();
  };


  // Task.findByIdAndDelete(id)
  // .then( task => {
  //   // if (!task) {
  //   //   return res.status(404).send();
  //   // }

  //   res.status(200).send(task);
  // })
  // .catch(err => {
  //   if (err.message === `Cast to ObjectId failed for value "${id}" at path "_id" for model "Task"`) {
  //     return res.status(404).send();
  //   };

  //   res.status(500).send();
  // })
})

module.exports = router;
