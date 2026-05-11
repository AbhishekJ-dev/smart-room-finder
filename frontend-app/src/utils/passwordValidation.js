export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  let errors = [];
  
  if (password.length < minLength) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    errors.push('Password must contain uppercase, lowercase, number, and special character');
  }

  const isValid = errors.length === 0;

  // Calculate strength (0 to 4)
  let strength = 0;
  if (password.length >= minLength) strength += 1;
  if (hasUpperCase && hasLowerCase) strength += 1;
  if (hasNumber) strength += 1;
  if (hasSpecialChar) strength += 1;

  return { isValid, errors, strength };
};
