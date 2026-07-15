const express = require('express');
const authController = require('../controllers/authController');
const projectController = require('../controllers/projectController');
const upload = require('../util/uploadMiddleware');

const router = express.Router();

router.route('/').get(projectController.getTopProjects);
router.route('/all').get(projectController.getAllProjects);
router.route('/:id').get(projectController.getProject);

router.use(authController.protect, authController.restrictTo('admin'));

router.route('/').post(upload.single('video'), projectController.createProject);

router
  .route('/:id')
  .patch(upload.single('video'), projectController.updateProject)
  .delete(projectController.deleteProject);

module.exports = router;
