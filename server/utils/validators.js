const Joi = require('joi');

const schemas = {
  login: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).required()
  }),

  createUser: Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'producer', 'viewer').default('producer')
  }),

  updateUser: Joi.object({
    username: Joi.string().min(3).max(50),
    email: Joi.string().email(),
    role: Joi.string().valid('admin', 'producer', 'viewer'),
    is_active: Joi.boolean()
  }),

  changePassword: Joi.object({
    password: Joi.string().min(6).required()
  }),

  preset: Joi.object({
    preset_number: Joi.number().integer().min(1).required(),
    subject: Joi.string().max(100).required(),
    header_text: Joi.string().max(255).required(),
    body_content: Joi.object().required(),
    body_html: Joi.string().required(),
    badge_number: Joi.string().max(10).allow('', null),
    is_global: Joi.boolean().default(false)
  }),

  card: Joi.object({
    header_text: Joi.string().max(255).required(),
    body_content: Joi.object().required(),
    body_html: Joi.string().required(),
    badge_number: Joi.string().max(10).allow('', null),
    preset_id: Joi.number().integer().allow(null),
    hide_header: Joi.boolean().default(false)
  }),

  setting: Joi.object({
    setting_value: Joi.object().required()
  })
};

function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new Error(`Unknown schema: ${schemaName}`));
    }

    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      error.isJoi = true;
      return next(error);
    }

    req.validatedBody = value;
    next();
  };
}

module.exports = { schemas, validate };
