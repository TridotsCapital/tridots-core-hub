export interface PasswordRequirement {
  id: string;
  label: string;
  validator: (password: string) => boolean;
}

export const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'Mínimo 12 caracteres',
    validator: (password) => password.length >= 12,
  },
  {
    id: 'uppercase',
    label: 'Pelo menos 1 letra maiúscula',
    validator: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'Pelo menos 1 letra minúscula',
    validator: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'Pelo menos 1 número',
    validator: (password) => /[0-9]/.test(password),
  },
  {
    id: 'special',
    label: 'Pelo menos 1 caractere especial (!@#$%&*)',
    validator: (password) => /[!@#$%&*]/.test(password),
  },
];

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export function getPasswordStrength(password: string): PasswordStrength {
  const passedRequirements = passwordRequirements.filter(req => req.validator(password)).length;
  
  if (passedRequirements <= 2) return 'weak';
  if (passedRequirements <= 4) return 'medium';
  return 'strong';
}

export function isPasswordValid(password: string): boolean {
  return passwordRequirements.every(req => req.validator(password));
}

export function getPasswordRequirementStatus(password: string): { id: string; label: string; passed: boolean }[] {
  return passwordRequirements.map(req => ({
    id: req.id,
    label: req.label,
    passed: req.validator(password),
  }));
}
