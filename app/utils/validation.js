export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // Password must be at least 8 characters long and contain at least one number and one special character
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
  return passwordRegex.test(password);
};

export const validateName = (name) => {
  return name.length >= 2;
};

export const validatePhoneNumber = (phoneNumber) => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phoneNumber);
};

export const validateZipCode = (zipCode) => {
  const zipRegex = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
  return zipRegex.test(zipCode);
};

export const validateCreditCard = (cardNumber) => {
  // Luhn algorithm implementation
  let sum = 0;
  let isEven = false;
  
  // Loop through values starting from the rightmost digit
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i));

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

export const validateExpiryDate = (month, year) => {
  const today = new Date();
  const expiry = new Date(year, month - 1);
  return expiry > today;
};

export const validateCVV = (cvv) => {
  const cvvRegex = /^[0-9]{3,4}$/;
  return cvvRegex.test(cvv);
}; 