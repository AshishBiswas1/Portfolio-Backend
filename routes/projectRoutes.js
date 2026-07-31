const express = require('express');
const authController = require('../controllers/authController');
const projectController = require('../controllers/projectController');
const upload = require('../util/uploadMiddleware');

const router = express.Router();

// ─── PUBLIC ML & RECOMMENDATION ROUTES ───
router.route('/recommendations/:id').get(projectController.getProjectRecommendations);
router.route('/match').get(projectController.getRoleMatchedProjects);

router.route('/').get(projectController.getTopProjects);
router.route('/all').get(projectController.getAllProjects);
router.route('/:id').get(projectController.getProject);
router.route('/:id/view').patch(projectController.incrementProjectViews).post(projectController.incrementProjectViews);

// ─── PROTECTED ADMIN ROUTES ───
router.use(authController.protect, authController.restrictTo('admin'));

router.route('/').post(
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  projectController.createProject
);

router
  .route('/:id')
  .patch(
    upload.fields([
      { name: 'video', maxCount: 1 },
      { name: 'images', maxCount: 10 }
    ]),
    projectController.updateProject
  )
  .delete(projectController.deleteProject);

module.exports = router;
