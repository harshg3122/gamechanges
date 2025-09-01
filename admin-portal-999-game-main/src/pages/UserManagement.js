import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Table, 
  Button, 
  Form, 
  InputGroup, 
  Badge, 
  Modal, 
  Alert,
  Pagination,
  Dropdown,
  Spinner
} from 'react-bootstrap';
import { 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaBan, 
  FaCheck, 
  FaPlus, 
  FaEye,
  FaDownload,
  FaSync
} from 'react-icons/fa';
import { exportToCSV, formatCurrency, formatDate, formatDateTime, showAlert } from '../utils/helpers';
import { adminAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({ 
    username: '', 
    email: '', 
    mobileNumber: '' 
  });
  
  const [addUserForm, setAddUserForm] = useState({ 
    username: '', 
    email: '', 
    mobileNumber: '', 
    password: '' 
  });

  // Load users from API
  useEffect(() => {
    console.log('🔐 UserManagement - isAuthenticated:', isAuthenticated);
    
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Check authentication first
      const token = localStorage.getItem('admin_token');
      console.log('🔍 Loading users - Token exists:', !!token);
      console.log('🔍 IsAuthenticated:', isAuthenticated);
      
      if (!token || !isAuthenticated) {
        console.log('❌ No authentication found, showing mock data');
        // Create some mock users for testing
        const mockUsers = [
          {
            _id: '507f1f77bcf86cd799439011',
            username: 'john_doe',
            email: 'john@example.com',
            mobileNumber: '9876543210',
            isActive: true,
            walletBalance: 1500.50,
            createdAt: '2024-01-15T10:30:00Z',
            lastLogin: '2024-08-12T14:22:00Z',
            updatedAt: '2024-08-12T14:22:00Z'
          },
          {
            _id: '507f1f77bcf86cd799439012',
            username: 'jane_smith',
            email: 'jane@example.com',
            mobileNumber: '9876543211',
            isActive: false,
            walletBalance: 750.25,
            createdAt: '2024-02-20T09:15:00Z',
            lastLogin: '2024-08-10T11:30:00Z',
            updatedAt: '2024-08-10T11:30:00Z'
          },
          {
            _id: '507f1f77bcf86cd799439013',
            username: 'mike_johnson',
            email: 'mike@example.com',
            mobileNumber: '9876543212',
            isActive: true,
            walletBalance: 2300.75,
            createdAt: '2024-03-10T16:45:00Z',
            lastLogin: null,
            updatedAt: '2024-03-10T16:45:00Z'
          }
        ];
        
        setUsers(mockUsers);
        showAlert(setAlert, 'warning', 'Using demo data. Please login to see real users from database.');
        return;
      }
      
      // Try to call API with authentication
      console.log('🚀 Making API call to get users...');
      const response = await adminAPI.getUsers();
      console.log('✅ API Response:', response.data);
      
      if (response.data.success) {
        const userData = response.data.data?.users || response.data.users || response.data.data || [];
        console.log('👥 Received users:', userData.length);
        setUsers(Array.isArray(userData) ? userData : []);
        if (userData.length > 0) {
          showAlert(setAlert, 'success', `Loaded ${userData.length} users from database.`);
        } else {
          showAlert(setAlert, 'info', 'No users found in database.');
        }
      } else {
        showAlert(setAlert, 'danger', 'Failed to load users: ' + (response.data.message || 'Unknown error'));
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      
      if (error.response?.status === 401) {
        console.log('🔐 401 Unauthorized - Token may be invalid');
        showAlert(setAlert, 'danger', 'Authentication failed. Please login again.');
        
        // For now, show mock data instead of failing
        const mockUsers = [
          {
            _id: '507f1f77bcf86cd799439011',
            username: 'demo_user1',
            email: 'demo1@example.com',
            mobileNumber: '1234567890',
            isActive: true,
            walletBalance: 1000,
            createdAt: '2024-01-01T00:00:00Z',
            lastLogin: '2024-08-13T00:00:00Z',
            updatedAt: '2024-08-13T00:00:00Z'
          }
        ];
        setUsers(mockUsers);
      } else {
        showAlert(setAlert, 'danger', `Failed to connect to server: ${error.message}. Showing demo data.`);
        // Show mock data as fallback
        const mockUsers = [
          {
            _id: '507f1f77bcf86cd799439011',
            username: 'demo_user1',
            email: 'demo1@example.com',
            mobileNumber: '1234567890',
            isActive: true,
            walletBalance: 1000,
            createdAt: '2024-01-01T00:00:00Z',
            lastLogin: '2024-08-13T00:00:00Z',
            updatedAt: '2024-08-13T00:00:00Z'
          }
        ];
        setUsers(mockUsers);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter and search functionality
  useEffect(() => {
    let filtered = Array.isArray(users) ? users.filter(user => user && user._id) : [];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobileNumber?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => user.isActive === true);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(user => user.isActive === false);
      }
    }

    setFilteredUsers(Array.isArray(filtered) ? filtered : []);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, users]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = Array.isArray(filteredUsers) ? filteredUsers.slice(indexOfFirstUser, indexOfLastUser) : [];
  const totalPages = Math.ceil((Array.isArray(filteredUsers) ? filteredUsers.length : 0) / usersPerPage);

  const handleView = async (user) => {
    try {
      setActionLoading(true);
      
      // First, set the user data we already have
      setSelectedUser(user);
      setUserDetails(user);
      setShowViewModal(true);
      
      // Try to get detailed user info from API
      try {
        const response = await adminAPI.getUserDetails(user._id);
        
        if (response.data.success) {
          const detailedUser = response.data.data?.user || response.data.user || response.data.data || user;
          setUserDetails(detailedUser);
        }
      } catch (apiError) {
        console.log('API call for user details failed, using existing data:', apiError.message);
        // Keep using the user data we already have
      }
      
    } catch (error) {
      console.error('Error in handleView:', error);
      // Fallback to showing basic user data
      setSelectedUser(user);
      setUserDetails(user);
      setShowViewModal(true);
      showAlert(setAlert, 'warning', 'Showing basic user info. Detailed info unavailable.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditForm({ 
      username: user.username || '', 
      email: user.email || '', 
      mobileNumber: user.mobileNumber || '' 
    });
    setShowEditModal(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleAddUser = () => {
    setAddUserForm({ username: '', email: '', mobileNumber: '', password: '' });
    setShowAddUserModal(true);
  };

  const handleExport = () => {
    const exportData = filteredUsers.map(user => ({
      ID: user._id,
      Username: user.username,
      Email: user.email,
      Phone: user.mobileNumber || 'N/A',
      Status: user.isActive ? 'Active' : 'Inactive',
      Balance: formatCurrency(user.walletBalance || user.wallet || 0),
      'Join Date': formatDate(user.createdAt),
      'Last Login': user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'
    }));
    exportToCSV(exportData, `users-export-${new Date().toISOString().split('T')[0]}`);
    showAlert(setAlert, 'success', 'Users data exported successfully!');
  };

  const handleToggleStatus = async (user) => {
    try {
      setActionLoading(true);
      const response = await adminAPI.toggleUserStatus(user._id);
      
      if (response.data.success) {
        const newStatus = !user.isActive;
        const updatedUsers = users.map(u =>
          u._id === user._id ? { ...u, isActive: newStatus } : u
        );
        setUsers(updatedUsers);
        showAlert(setAlert, 'success', 
          `User ${user.username} has been ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      } else {
        showAlert(setAlert, 'danger', 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      showAlert(setAlert, 'danger', 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setActionLoading(true);
      const response = await adminAPI.deleteUser(selectedUser._id);
      
      if (response.data.success) {
        const updatedUsers = users.filter(u => u._id !== selectedUser._id);
        setUsers(updatedUsers);
        setShowDeleteModal(false);
        showAlert(setAlert, 'success', `User ${selectedUser.username} has been deleted successfully.`);
      } else {
        showAlert(setAlert, 'danger', 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert(setAlert, 'danger', 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.username || !editForm.email) {
      showAlert(setAlert, 'danger', 'Please fill in all required fields.');
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await adminAPI.updateUser(selectedUser._id, editForm);
      
      if (response.data.success) {
        const updatedUsers = users.map(u =>
          u._id === selectedUser._id 
            ? { ...u, ...editForm }
            : u
        );
        setUsers(updatedUsers);
        setShowEditModal(false);
        showAlert(setAlert, 'success', `User ${editForm.username} has been updated successfully.`);
      } else {
        showAlert(setAlert, 'danger', 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.response?.status === 400) {
        showAlert(setAlert, 'danger', 'Invalid data provided');
      } else if (error.response?.status === 409) {
        showAlert(setAlert, 'danger', 'Username or email already exists');
      } else {
        showAlert(setAlert, 'danger', 'Failed to update user');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    const { username, email, mobileNumber, password } = addUserForm;
    
    if (!username || !email || !password) {
      showAlert(setAlert, 'danger', 'Please fill in all required fields.');
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await adminAPI.createUser(addUserForm);
      
      if (response.data.success) {
        const newUser = response.data.data?.user || response.data.user || response.data.data;
        if (newUser && newUser._id) {
          setUsers([newUser, ...users]);
          setShowAddUserModal(false);
          showAlert(setAlert, 'success', `User ${username} has been created successfully.`);
        } else {
          console.log('⚠️ New user data structure:', response.data);
          showAlert(setAlert, 'warning', 'User created but response format unexpected. Please refresh to see changes.');
          setShowAddUserModal(false);
          // Reload users to get fresh data
          setTimeout(() => loadUsers(), 1000);
        }
      } else {
        showAlert(setAlert, 'danger', 'Failed to create user: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.response?.status === 400) {
        showAlert(setAlert, 'danger', 'Invalid data provided');
      } else if (error.response?.status === 409) {
        showAlert(setAlert, 'danger', 'Username or email already exists');
      } else {
        showAlert(setAlert, 'danger', 'Failed to create user');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (isActive) => {
    return (
      <Badge bg={isActive ? 'success' : 'danger'}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>User Management</h2>
        <div className="d-flex gap-2">
          {/* Test Backend Button */}
          {/* <Button 
            variant="warning" 
            size="sm"
            onClick={async () => {
              try {
                showAlert(setAlert, 'info', 'Testing backend connection...');
                
                // Test without authentication first
                const testResponse = await fetch('http://localhost:3001/api/admin-panel/users', {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  }
                });
                
                console.log('🧪 Backend test response:', testResponse.status);
                
                if (testResponse.status === 401) {
                  // Backend is running but needs authentication
                  showAlert(setAlert, 'warning', 'Backend is running but needs proper authentication. Creating test token...');
                  
                  // Create a mock token and try login with correct endpoint
                  const loginResponse = await fetch('http://localhost:3001/api/admin-panel/login', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      username: 'admin',  // Changed from 'identifier' to 'username'
                      password: 'admin123'
                    })
                  });
                  
                  const loginData = await loginResponse.json();
                  console.log('🔐 Login response:', loginData);
                  
                  if (loginData.success) {
                    localStorage.setItem('admin_token', loginData.token);
                    localStorage.setItem('admin_user', JSON.stringify(loginData.admin));
                    showAlert(setAlert, 'success', 'Logged in successfully! Refreshing users...');
                    setTimeout(() => loadUsers(), 1000);
                  } else {
                    showAlert(setAlert, 'danger', 'Login failed: ' + loginData.message);
                  }
                } else if (testResponse.status === 404) {
                  showAlert(setAlert, 'danger', 'Backend endpoint not found. Check if backend is running on localhost:3001');
                } else {
                  const data = await testResponse.json();
                  console.log('🧪 Test data:', data);
                  showAlert(setAlert, 'info', 'Backend response: ' + JSON.stringify(data));
                }
                
              } catch (error) {
                console.error('Backend test error:', error);
                showAlert(setAlert, 'danger', 'Backend connection failed: ' + error.message);
              }
            }}
          >
            🧪 Test Backend
          </Button> */}
          
          {/* Debug Info Button */}
          {/* <Button 
            variant="outline-info" 
            size="sm"
            onClick={() => {
              const token = localStorage.getItem('admin_token');
              const userData = localStorage.getItem('admin_user');
              console.log('🔍 Debug Info:');
              console.log('Token exists:', !!token);
              console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
              console.log('User data exists:', !!userData);
              console.log('IsAuthenticated:', isAuthenticated);
              console.log('User object:', user);
              
              alert(`Debug Info:
Token exists: ${!!token}
User data exists: ${!!userData}
IsAuthenticated: ${isAuthenticated}
User: ${user ? user.username : 'none'}`);
            }}
          >
            🔍 Debug
          </Button> */}
          
          {/* Quick Login Button */}
          {!isAuthenticated && (
            <Button 
              variant="success" 
              size="sm"
              onClick={async () => {
                try {
                  showAlert(setAlert, 'info', 'Logging in with backend...');
                  
                  // Call real backend login
                  const response = await fetch('http://localhost:3001/api/auth/admin/login', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      identifier: 'admin',
                      password: 'admin123'
                    }),
                  });
                  
                  const data = await response.json();
                  
                  if (data.success) {
                    const { token, admin } = data.data;
                    
                    // Store real backend token
                    const tokenData = {
                      token: token,
                      timestamp: Date.now(),
                      expiresIn: 30 * 24 * 60 * 60 * 1000 // 30 days
                    };
                    
                    localStorage.setItem('admin_token', token);
                    localStorage.setItem('admin_token_data', JSON.stringify(tokenData));
                    localStorage.setItem('admin_user', JSON.stringify(admin));
                    
                    showAlert(setAlert, 'success', 'Real backend login successful! Refreshing data...');
                    
                    // Force auth context update
                    setTimeout(() => {
                      window.dispatchEvent(new StorageEvent('storage', { key: 'admin_token', newValue: token }));
                      loadUsers(); // Reload users with real token
                    }, 500);
                  } else {
                    showAlert(setAlert, 'danger', 'Login failed: ' + data.message);
                  }
                } catch (error) {
                  console.error('Login error:', error);
                  showAlert(setAlert, 'danger', 'Backend connection failed. Using mock token.');
                  
                  // Fallback to mock token
                  // const mockToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(JSON.stringify({
                  //   adminId: 'test-admin-id',
                  //   username: 'admin',
                  //   role: 'admin',
                  //   exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
                  // }));
                  
                  const mockUser = {
                    _id: 'test-admin-id',
                    username: 'admin',
                    email: 'admin@test.com',
                    role: 'admin'
                  };
                  
                  localStorage.setItem('admin_token', mockToken);
                  localStorage.setItem('admin_user', JSON.stringify(mockUser));
                  
                  setTimeout(() => {
                    window.dispatchEvent(new StorageEvent('storage', { key: 'admin_token', newValue: mockToken }));
                  }, 500);
                }
              }}
            >
              🔐 Backend Login
            </Button>
          )}
          
          <Button 
            variant="outline-secondary" 
            onClick={loadUsers}
            disabled={loading}
          >
            <FaSync className="me-2" />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button 
            variant="outline-primary" 
            className="d-flex align-items-center"
            onClick={handleExport}
            disabled={filteredUsers.length === 0}
          >
            <FaDownload className="me-2" />
            Export ({filteredUsers.length})
          </Button>
          <Button variant="primary" onClick={handleAddUser}>
            <FaPlus className="me-2" />
            Add User
          </Button>
        </div>
      </div>

      {alert && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Search and Filter */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by username, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <div className="text-muted">
                Showing {currentUsers.length} of {filteredUsers.length} users
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Users Table */}
      <Card className="shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <div className="mt-2">Loading users...</div>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Balance</th>
                  <th>Join Date</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      No users found
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr key={user?._id || Math.random()}>
                      <td>
                        <small className="text-muted">
                          {user?._id ? user._id.slice(-6) : 'N/A'}
                        </small>
                      </td>
                      <td>
                        <strong>{user?.username || 'N/A'}</strong>
                      </td>
                      <td>{user?.email || 'N/A'}</td>
                      <td>{user?.mobileNumber || 'N/A'}</td>
                      <td>{getStatusBadge(user?.isActive)}</td>
                      <td>
                        <strong className="text-success">
                          {formatCurrency(user.walletBalance || user.wallet || 0)}
                        </strong>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        {user.lastLogin ? formatDateTime(user.lastLogin) : (
                          <small className="text-muted">Never</small>
                        )}
                      </td>
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle 
                            variant="outline-secondary" 
                            size="sm"
                            disabled={actionLoading}
                          >
                            Actions
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleView(user)}>
                              <FaEye className="me-2" />
                              View Details
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleEdit(user)}>
                              <FaEdit className="me-2" />
                              Edit
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleToggleStatus(user)}>
                              {user.isActive ? (
                                <>
                                  <FaBan className="me-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <FaCheck className="me-2" />
                                  Activate
                                </>
                              )}
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item 
                              onClick={() => handleDelete(user)}
                              className="text-danger"
                            >
                              <FaTrash className="me-2" />
                              Delete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                <Pagination.Prev
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                />
                {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = index + 1;
                  } else if (currentPage <= 3) {
                    pageNum = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + index;
                  } else {
                    pageNum = currentPage - 2 + index;
                  }
                  
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                })}
                <Pagination.Next
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* View User Details Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userDetails ? (
            <Row>
              <Col md={6}>
                <h6>Basic Information</h6>
                <p><strong>ID:</strong> <code>{userDetails._id}</code></p>
                <p><strong>Username:</strong> {userDetails.username}</p>
                <p><strong>Email:</strong> {userDetails.email || 'Not provided'}</p>
                <p><strong>Phone:</strong> {userDetails.mobileNumber || 'N/A'}</p>
                <p><strong>Status:</strong> {getStatusBadge(userDetails.isActive)}</p>
                <p><strong>Role:</strong> <Badge bg="info">{userDetails.role || 'user'}</Badge></p>
              </Col>
              <Col md={6}>
                <h6>Account Information</h6>
                <p><strong>Balance:</strong> <span className="text-success fs-5">{formatCurrency(userDetails.walletBalance || userDetails.wallet || 0)}</span></p>
                <p><strong>Total Winnings:</strong> {formatCurrency(userDetails.totalWinnings || 0)}</p>
                <p><strong>Total Losses:</strong> {formatCurrency(userDetails.totalLosses || 0)}</p>
                <p><strong>Games Played:</strong> {userDetails.gamesPlayed || 0}</p>
                <p><strong>Join Date:</strong> {formatDateTime(userDetails.createdAt)}</p>
                <p><strong>Last Login:</strong> {userDetails.lastLogin ? formatDateTime(userDetails.lastLogin) : <span className="text-muted">Never</span>}</p>
                <p><strong>Last Updated:</strong> {formatDateTime(userDetails.updatedAt)}</p>
                {userDetails.referral && (
                  <p><strong>Referral Code:</strong> <code>{userDetails.referral}</code></p>
                )}
              </Col>
            </Row>
          ) : (
            <div className="text-center py-3">
              <Spinner animation="border" />
              <div className="mt-2">Loading user details...</div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add User Modal */}
      <Modal show={showAddUserModal} onHide={() => setShowAddUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddUserSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    value={addUserForm.username}
                    onChange={(e) => setAddUserForm({...addUserForm, username: e.target.value})}
                    required
                    placeholder="Enter username"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={addUserForm.email}
                    onChange={(e) => setAddUserForm({...addUserForm, email: e.target.value})}
                    required
                    placeholder="Enter email"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={addUserForm.mobileNumber}
                    onChange={(e) => setAddUserForm({...addUserForm, mobileNumber: e.target.value})}
                    placeholder="9999999999"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    value={addUserForm.password}
                    onChange={(e) => setAddUserForm({...addUserForm, password: e.target.value})}
                    required
                    placeholder="Enter password"
                    minLength="6"
                  />
                  <Form.Text className="text-muted">
                    Minimum 6 characters
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddUserModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddUserSubmit}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Creating...
              </>
            ) : (
              'Create User'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Form onSubmit={handleEditSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Username *</Form.Label>
                    <Form.Control
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email *</Form.Label>
                    <Form.Control
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={editForm.mobileNumber}
                      onChange={(e) => setEditForm({...editForm, mobileNumber: e.target.value})}
                      placeholder="9999999999"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Current Balance</Form.Label>
                    <Form.Control
                      type="text"
                      value={formatCurrency(selectedUser.walletBalance || selectedUser.wallet || 0)}
                      disabled
                    />
                    <Form.Text className="text-muted">
                      Balance can only be modified through wallet management
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEditSubmit}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div>
              <Alert variant="warning">
                <strong>Warning!</strong> This action cannot be undone.
              </Alert>
              <p>
                Are you sure you want to delete user <strong>{selectedUser.username}</strong>? 
                This will permanently remove:
              </p>
              <ul>
                <li>User account and profile</li>
                <li>Transaction history</li>
                <li>Wallet balance: {formatCurrency(selectedUser.walletBalance || selectedUser.wallet || 0)}</li>
                <li>All associated data</li>
              </ul>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement;
