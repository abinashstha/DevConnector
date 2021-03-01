const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const config = require('config');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');

// @route   POST api/posts
// @desc    Post a post
// @access  private
router.post(
  '/',
  [auth, check('text', 'Text is required.').not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = new Post({
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
      });
      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server error');
    }
  }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
});

// @route   GET api/posts/:id
// @desc    Get post by id
// @access  private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId')
      return res.status(404).json('Profile not found');
    return res.status(500).send('Server error');
  }
});

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json('Post not found');

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    await post.remove();
    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') return res.status(404).json('Post not found');
    return res.status(500).send('Server error');
  }
});

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  private

router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // if (!post) return res.status(404).json({ msg: 'Post not found.' });
    // check if post has already been liked.
    const previousLike =
      post.likes.filter((like) => like.user.toString() == req.user.id).length >
      0;
    if (previousLike)
      return res.status(400).json({ msg: 'Post already liked' });
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json('Server Error');
  }
});

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  private

router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // if (!post) return res.status(404).json({ msg: 'Post not found.' });
    // check if post has not been liked.
    const previousLike =
      post.likes.filter((like) => like.user.toString() == req.user.id)
        .length === 0;
    if (previousLike)
      return res.status(400).json({ msg: 'Post has not been liked yet.' });
    //Get remove index
    const removeIndex = await post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json('Server Error');
  }
});

// @route   POST api/posts/comment/:id
// @desc    Post a comment
// @access  private
router.post(
  '/comment/:id',
  [auth, check('text', 'Text is required.').not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);
      const newComment = {
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
      };
      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server error');
    }
  }
);

// @route   Delete api/posts/comment/:id/:comment_id
// @desc    Delete a comment
// @access  private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const comment = post.comments.find((c) => c.id === req.params.comment_id);
    //Make sure comment exists
    if (!comment)
      return res.status(404).json({ msg: 'Comment does not exist' });
    //Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    //Get remove index
    const removeIndex = await post.comments
      .map((c) => c.user.toString())
      .indexOf(req.user.id);
    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server error');
  }
});

module.exports = router;
