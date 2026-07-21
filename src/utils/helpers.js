export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function getInitials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least one number');
  return { valid: errors.length === 0, errors };
}
