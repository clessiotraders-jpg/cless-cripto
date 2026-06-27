const Joi = require('joi');

const validateUserRegistration = (req, res, next) => {
  const schema = Joi.object({
    telegramId: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  req.validated = value;
  next();
};

const validateSignalCreation = (req, res, next) => {
  const schema = Joi.object({
    symbol: Joi.string().required(),
    entry: Joi.number().positive().required(),
    target: Joi.number().positive().required(),
    stopLoss: Joi.number().positive().required(),
    leverage: Joi.number().positive().max(10),
    type: Joi.string().valid('LONG', 'SHORT'),
    reason: Joi.string(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  req.validated = value;
  next();
};

const validateDeposit = (req, res, next) => {
  const schema = Joi.object({
    amount: Joi.number().positive().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  req.validated = value;
  next();
};

const validateAffiliateWithdrawal = (req, res, next) => {
  const schema = Joi.object({
    amount: Joi.number().positive().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  req.validated = value;
  next();
};

module.exports = {
  validateUserRegistration,
  validateSignalCreation,
  validateDeposit,
  validateAffiliateWithdrawal,
};