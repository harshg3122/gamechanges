// Utility functions for the admin panel

// Export data to CSV
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export data to JSON
export const exportToJSON = (data, filename) => {
  if (!data) {
    alert('No data to export');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

// Format date
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format date and time
export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Generate random ID
export const generateId = () => {
  return Date.now() + Math.random().toString(36).substr(2, 9);
};

// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate phone number
export const validatePhone = (phone) => {
  const re = /^\+?[\d\s\-\(\)]{10,}$/;
  return re.test(phone);
};

// Show success alert
export const showAlert = (setAlert, type, message, duration = 3000) => {
  setAlert({ type, message });
  setTimeout(() => setAlert(null), duration);
};

// Confirm action
export const confirmAction = (message) => {
  return window.confirm(message);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate mock data for testing
export const generateMockUsers = (count = 50) => {
  const statuses = ['active', 'inactive', 'blocked'];
  const names = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Lisa Davis', 'Tom Miller', 'Amy Garcia', 'Chris Rodriguez', 'Emma Martinez'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: names[i % names.length] + ` ${i + 1}`,
    email: `user${i + 1}@example.com`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    balance: Math.floor(Math.random() * 5000) + 100,
    joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }));
};

// Generate mock transactions
export const generateMockTransactions = (count = 100) => {
  const types = ['deposit', 'withdrawal', 'bet', 'win', 'bonus'];
  const statuses = ['completed', 'pending', 'failed'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    userId: Math.floor(Math.random() * 50) + 1,
    type: types[Math.floor(Math.random() * types.length)],
    amount: Math.floor(Math.random() * 1000) + 10,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    description: `Transaction ${i + 1} description`
  }));
};

// Generate mock games
export const generateMockGames = (count = 20) => {
  const statuses = ['active', 'inactive', 'completed'];
  const gameTypes = ['Lottery', 'Scratch Card', 'Number Game', 'Slot Game'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${gameTypes[i % gameTypes.length]} ${i + 1}`,
    type: gameTypes[i % gameTypes.length],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ticketPrice: Math.floor(Math.random() * 50) + 5,
    maxParticipants: Math.floor(Math.random() * 1000) + 100,
    currentParticipants: Math.floor(Math.random() * 500) + 50,
    prizePool: Math.floor(Math.random() * 10000) + 1000
  }));
};
