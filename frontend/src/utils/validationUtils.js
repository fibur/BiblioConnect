export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  export const isValidUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    return usernameRegex.test(username);
  };
  
  export const isPasswordSecure = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
  };
  
  export const getPasswordStrength = (password) => {
      let strengthScore = 0;
        
      if (password.length > 8) strengthScore += 2;
  
      if (password.match(/[a-z]/)) strengthScore += 1;
  
      if (password.match(/[A-Z]/)) strengthScore += 1;
  
      if (password.match(/\d/)) strengthScore += 1;
  
      if (password.match(/[\W_]/)) strengthScore += 2;
  
      if (password.length > 12) strengthScore += 2;
      if (password.length > 16) strengthScore += 2;
  
      const strength = strengthScore / 11;
  
      return strength;
  };