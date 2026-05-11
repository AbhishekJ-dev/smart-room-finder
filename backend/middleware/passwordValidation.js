const validatePassword = (req, res, next) => {
    // If there's a password in the request body, validate it
    const password = req.body.password || req.body.newPassword;
    
    // We only enforce validation if a password field is present
    if (password) {
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }
        
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
            return res.status(400).json({ 
                message: 'Password must contain uppercase, lowercase, number, and special character' 
            });
        }
    }
    
    next();
};

module.exports = { validatePassword };
