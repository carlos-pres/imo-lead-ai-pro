import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Dados inválidos',
      errors: errors.array().map(e => ({ field: e.type === 'field' ? (e as any).path : 'unknown', message: e.msg }))
    });
  }
  next();
};

export const validateRegistration = [
  body('name')
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Nome contém caracteres inválidos'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password deve ter pelo menos 8 caracteres'),
  handleValidationErrors
];

export const validateLogin = [
  body().custom((value) => Boolean(value?.email || value?.identifier)).withMessage('Email ou telefone obrigatorio'),
  body('email')
    .optional({ nullable: true })
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inv�lido'),
  body('identifier')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage('Identificador inv�lido'),
  body('password')
    .notEmpty()
    .withMessage('Password � obrigat�ria'),
  handleValidationErrors
];

export const validateLead = [
  body('name')
    .trim()
    .escape()
    .isLength({ min: 2, max: 200 })
    .withMessage('Nome deve ter entre 2 e 200 caracteres'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\s()-]{9,20}$/)
    .withMessage('Telefone inválido'),
  body('price')
    .optional()
    .isNumeric()
    .withMessage('Preço deve ser numérico'),
  body('property')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 500 })
    .withMessage('Propriedade deve ter no máximo 500 caracteres'),
  body('location')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 200 })
    .withMessage('Localização deve ter no máximo 200 caracteres'),
  body('notes')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 2000 })
    .withMessage('Notas devem ter no máximo 2000 caracteres'),
  handleValidationErrors
];

export const validateContact = [
  body('name')
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('message')
    .trim()
    .escape()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Mensagem deve ter entre 10 e 1000 caracteres'),
  handleValidationErrors
];

export const validateTrialRequest = [
  body('name')
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalido'),
  body('phone')
    .trim()
    .matches(/^[0-9+\s()-]{9,20}$/)
    .withMessage('Telefone invalido'),
  body('privacyAccepted')
    .isBoolean()
    .withMessage('Aceite da privacidade obrigatorio'),
  body('termsAccepted')
    .isBoolean()
    .withMessage('Aceite dos termos obrigatorio'),
  body('aiDisclosureAccepted')
    .isBoolean()
    .withMessage('Aceite do uso de IA obrigatorio'),
  handleValidationErrors
];

