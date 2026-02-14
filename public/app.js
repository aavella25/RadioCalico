// API base URL
const API_URL = '/api';

// DOM elements
const addUserForm = document.getElementById('addUserForm');
const usersList = document.getElementById('usersList');

// Load users on page load
document.addEventListener('DOMContentLoaded', () => {
  loadUsers();
});

// Handle form submission
addUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showMessage(data.error || 'Failed to add user', 'error');
      return;
    }
    
    showMessage('User added successfully!', 'success');
    addUserForm.reset();
    loadUsers();
    
  } catch (error) {
    showMessage('Network error: ' + error.message, 'error');
  }
});

// Load and display users
async function loadUsers() {
  try {
    usersList.innerHTML = '<p class="loading">Loading users...</p>';
    
    const response = await fetch(`${API_URL}/users`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to load users');
    }
    
    if (data.users.length === 0) {
      usersList.innerHTML = '<p class="loading">No users yet. Add one above!</p>';
      return;
    }
    
    displayUsers(data.users);
    
  } catch (error) {
    usersList.innerHTML = `<div class="error">Error loading users: ${error.message}</div>`;
  }
}

// Display users in the DOM
function displayUsers(users) {
  usersList.innerHTML = users.map(user => `
    <div class="user-item" data-id="${user.id}">
      <div class="user-info">
        <h3>${escapeHtml(user.name)}</h3>
        <p>📧 ${escapeHtml(user.email)}</p>
        <p class="user-id">ID: ${user.id} • Created: ${formatDate(user.created_at)}</p>
      </div>
      <button class="btn btn-danger" onclick="deleteUser(${user.id})">Delete</button>
    </div>
  `).join('');
}

// Delete user
async function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showMessage(data.error || 'Failed to delete user', 'error');
      return;
    }
    
    showMessage('User deleted successfully!', 'success');
    loadUsers();
    
  } catch (error) {
    showMessage('Network error: ' + error.message, 'error');
  }
}

// Show message to user
function showMessage(message, type) {
  const existingMessage = document.querySelector('.error, .success');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = type;
  messageDiv.textContent = message;
  
  const form = document.querySelector('.card');
  form.insertBefore(messageDiv, form.firstChild);
  
  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make deleteUser available globally
window.deleteUser = deleteUser;
