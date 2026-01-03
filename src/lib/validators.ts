// CPF Validation - Brazilian Individual Taxpayer Registry
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[10])) return false;
  
  return true;
}

// Email Validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Currency Formatting (Brazilian Real)
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Parse currency string to number
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// CPF Formatting (000.000.000-00)
export function formatCPF(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

// Phone Formatting ((00) 00000-0000)
export function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
}

// CEP Formatting (00000-000)
export function formatCEP(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 8);
  
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
}

// Currency Input Formatting (allows typing with automatic formatting)
export function formatCurrencyInput(value: string): string {
  // Remove everything except digits
  const digits = value.replace(/\D/g, '');
  
  if (!digits) return '';
  
  // Convert to number (cents)
  const cents = parseInt(digits, 10);
  const reais = cents / 100;
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reais);
}

// Parse formatted currency input to number
export function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

// Validate age (must be 18+)
export function validateAge(birthDate: Date): boolean {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
}

// Brazilian states
export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
] as const;

// Property types
export const PROPERTY_TYPES = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'kitnet', label: 'Kitnet/Studio' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'sobrado', label: 'Sobrado' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'galpao', label: 'Galpão' },
  { value: 'sala_comercial', label: 'Sala Comercial' },
  { value: 'loja', label: 'Loja' },
] as const;

// Setup fee options
export const SETUP_FEE_OPTIONS = [
  { value: 0, label: 'R$ 0,00 (Isento)' },
  { value: 50, label: 'R$ 50,00' },
  { value: 100, label: 'R$ 100,00' },
  { value: 120, label: 'R$ 120,00' },
  { value: 160, label: 'R$ 160,00' },
  { value: 200, label: 'R$ 200,00' },
  { value: 235, label: 'R$ 235,00' },
] as const;
