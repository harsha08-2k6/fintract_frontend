export const passwordRules = [
  { label: 'At least 8 characters', test: password => password.length >= 8 },
  { label: 'At least 1 uppercase letter (A-Z)', test: password => /[A-Z]/.test(password) },
  { label: 'At least 1 lowercase letter (a-z)', test: password => /[a-z]/.test(password) },
  { label: 'At least 1 number (0-9)', test: password => /[0-9]/.test(password) },
  { label: 'At least 1 special character (@#$%!...)', test: password => /[@#$%!^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password) }
];

export const getPasswordRuleResults = password =>
  passwordRules.map(rule => ({ ...rule, valid: rule.test(password) }));

export const isStrongPassword = password =>
  getPasswordRuleResults(password).every(rule => rule.valid);
