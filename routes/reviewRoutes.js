const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

// POST / tour/2131412/reviews
// GET / tour/2131412/reviews
// POST / reviews

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = router;
