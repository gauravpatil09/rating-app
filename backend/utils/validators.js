const { body } = require('express-validator');

const nameRules = body('name')
  .isLength({ min: 20, max: 60 })
  .withMessage('Name must be 20-60 characters');

const addressRules = body('address')
  .optional({ nullable: true })
  .isLength({ max: 400 })
  .withMessage('Address max 400 characters');

const passwordRules = body('password')
  .isLength({ min: 8, max: 16 })
  .withMessage('Password must be 8-16 characters')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least 1 uppercase letter')
  .matches(/[^A-Za-z0-9]/)
  .withMessage('Password must contain at least 1 special character');

const emailRule = body('email').isEmail().withMessage('Invalid email');

module.exports = { nameRules, addressRules, passwordRules, emailRule };
