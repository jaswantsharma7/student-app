const express = require('express');
const studentController = require('../controllers/studentController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply authentication to all student routes
router.use(authenticate);

router.get('/', studentController.getStudents);
router.post('/', studentController.createStudent);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

module.exports = router;