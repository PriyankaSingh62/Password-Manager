// Password Manager JavaScript
class PasswordManager {
    constructor() {
        this.passwords = this.loadPasswords();
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderPasswords();
    }

    // Event Listeners
    bindEvents() {
        // Form submission
        document.getElementById('passwordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Toggle password visibility
        document.getElementById('togglePassword').addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterPasswords();
        });

        // Category filter
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filterPasswords();
        });

        // Modal events
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('copyPassword').addEventListener('click', () => {
            this.copyPassword();
        });

        document.getElementById('editPassword').addEventListener('click', () => {
            this.editPassword();
        });

        document.getElementById('deletePassword').addEventListener('click', () => {
            this.deletePassword();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('passwordModal')) {
                this.closeModal();
            }
        });
    }

    // Form Submission
    handleFormSubmit() {
        const website = document.getElementById('website').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const category = document.getElementById('category').value;

        if (!website || !username || !password) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        const passwordData = {
            id: this.currentEditId || Date.now().toString(),
            website: website,
            username: username,
            password: this.encryptPassword(password),
            category: category,
            createdAt: this.currentEditId ? this.getPasswordById(this.currentEditId).createdAt : new Date().toISOString()
        };

        if (this.currentEditId) {
            this.updatePassword(passwordData);
            this.currentEditId = null;
            document.querySelector('#passwordForm button[type="submit"]').textContent = 'Add Password';
        } else {
            this.addPassword(passwordData);
        }

        this.clearForm();
        this.renderPasswords();
        this.showToast(this.currentEditId ? 'Password updated successfully!' : 'Password added successfully!');
    }

    // Add Password
    addPassword(passwordData) {
        this.passwords.push(passwordData);
        this.savePasswords();
    }

    // Update Password
    updatePassword(updatedPassword) {
        const index = this.passwords.findIndex(p => p.id === updatedPassword.id);
        if (index !== -1) {
            this.passwords[index] = updatedPassword;
            this.savePasswords();
        }
    }

    // Delete Password
    deletePassword() {
        if (this.currentEditId) {
            if (confirm('Are you sure you want to delete this password?')) {
                this.passwords = this.passwords.filter(p => p.id !== this.currentEditId);
                this.savePasswords();
                this.renderPasswords();
                this.closeModal();
                this.showToast('Password deleted successfully!');
            }
        }
    }

    // Edit Password
    editPassword() {
        if (this.currentEditId) {
            const password = this.getPasswordById(this.currentEditId);
            if (password) {
                document.getElementById('website').value = password.website;
                document.getElementById('username').value = password.username;
                document.getElementById('password').value = this.decryptPassword(password.password);
                document.getElementById('category').value = password.category;
                document.querySelector('#passwordForm button[type="submit"]').textContent = 'Update Password';
                this.closeModal();
                
                // Scroll to form
                document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    // Get Password by ID
    getPasswordById(id) {
        return this.passwords.find(p => p.id === id);
    }

    // Toggle Password Visibility
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.getElementById('togglePassword');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = '👁️';
        }
    }

    // Copy Password to Clipboard
    async copyPassword() {
        if (this.currentEditId) {
            const password = this.getPasswordById(this.currentEditId);
            const decryptedPassword = this.decryptPassword(password.password);
            
            try {
                await navigator.clipboard.writeText(decryptedPassword);
                this.showToast('Password copied to clipboard!');
            } catch (err) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = decryptedPassword;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showToast('Password copied to clipboard!');
            }
        }
    }

    // Filter Passwords
    filterPasswords() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        
        const filteredPasswords = this.passwords.filter(password => {
            const matchesSearch = password.website.toLowerCase().includes(searchTerm) ||
                                password.username.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || password.category === categoryFilter;
            
            return matchesSearch && matchesCategory;
        });
        
        this.renderPasswords(filteredPasswords);
    }

    // Render Passwords
    renderPasswords(passwordsToRender = null) {
        const passwordsList = document.getElementById('passwordsList');
        const emptyState = document.getElementById('emptyState');
        const passwords = passwordsToRender || this.passwords;

        if (passwords.length === 0) {
            passwordsList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        passwordsList.innerHTML = passwords.map(password => `
            <div class="password-card" data-id="${password.id}">
                <h3>${password.website}</h3>
                <p><strong>Username:</strong> ${password.username}</p>
                <p><strong>Password:</strong> ${'*'.repeat(this.decryptPassword(password.password).length)}</p>
                <span class="category-badge category-${password.category}">${this.getCategoryName(password.category)}</span>
            </div>
        `).join('');

        // Add click event listeners to password cards
        document.querySelectorAll('.password-card').forEach(card => {
            card.addEventListener('click', () => {
                this.openModal(card.dataset.id);
            });
        });
    }

    // Open Modal
    openModal(passwordId) {
        const password = this.getPasswordById(passwordId);
        if (password) {
            this.currentEditId = passwordId;
            
            document.getElementById('modalWebsite').textContent = password.website;
            document.getElementById('modalUsername').textContent = password.username;
            document.getElementById('modalPassword').textContent = '*'.repeat(this.decryptPassword(password.password).length);
            document.getElementById('modalCategory').textContent = this.getCategoryName(password.category);
            document.getElementById('modalCreated').textContent = new Date(password.createdAt).toLocaleDateString();
            
            document.getElementById('passwordModal').style.display = 'block';
        }
    }

    // Close Modal
    closeModal() {
        document.getElementById('passwordModal').style.display = 'none';
        this.currentEditId = null;
    }

    // Get Category Name
    getCategoryName(category) {
        const categories = {
            social: 'Social Media',
            email: 'Email',
            work: 'Work',
            shopping: 'Shopping',
            banking: 'Banking',
            other: 'Other'
        };
        return categories[category] || 'Other';
    }

    // Clear Form
    clearForm() {
        document.getElementById('passwordForm').reset();
        document.querySelector('#passwordForm button[type="submit"]').textContent = 'Add Password';
        this.currentEditId = null;
    }

    // Show Toast Notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Simple Encryption/Decryption (for demo purposes)
    // In a real application, use proper encryption libraries
    encryptPassword(password) {
        return btoa(password.split('').reverse().join(''));
    }

    decryptPassword(encryptedPassword) {
        try {
            return atob(encryptedPassword).split('').reverse().join('');
        } catch (e) {
            return encryptedPassword; // Return as-is if decryption fails
        }
    }

    // Local Storage Methods
    savePasswords() {
        try {
            localStorage.setItem('passwordManagerData', JSON.stringify(this.passwords));
        } catch (error) {
            console.error('Error saving passwords:', error);
            this.showToast('Error saving data. Please check your browser storage.', 'error');
        }
    }

    loadPasswords() {
        try {
            const saved = localStorage.getItem('passwordManagerData');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading passwords:', error);
            return [];
        }
    }

    // Export Data
    exportData() {
        const dataStr = JSON.stringify(this.passwords, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `passwords_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        this.showToast('Data exported successfully!');
    }

    // Import Data
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    this.passwords = [...this.passwords, ...importedData];
                    this.savePasswords();
                    this.renderPasswords();
                    this.showToast('Data imported successfully!');
                } else {
                    throw new Error('Invalid data format');
                }
            } catch (error) {
                this.showToast('Error importing data. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the Password Manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PasswordManager();
});

// Add some utility functions for additional features
function generatePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Add password generator functionality
document.addEventListener('DOMContentLoaded', () => {
    // Add password generator button to the form
    const formGroup = document.querySelector('#password').parentElement;
    const generateBtn = document.createElement('button');
    generateBtn.type = 'button';
    generateBtn.className = 'btn btn-small';
    generateBtn.textContent = 'Generate';
    generateBtn.style.marginLeft = '10px';
    generateBtn.addEventListener('click', () => {
        const generatedPassword = generatePassword();
        document.getElementById('password').value = generatedPassword;
        document.getElementById('password').type = 'text';
        document.getElementById('togglePassword').textContent = '🙈';
    });
    formGroup.appendChild(generateBtn);
});