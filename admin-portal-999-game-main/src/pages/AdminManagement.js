import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, InputGroup, Pagination, Dropdown } from 'react-bootstrap';
import { FaUserShield, FaPlus, FaSearch, FaFilter, FaDownload, FaEye, FaEdit, FaTrash, FaKey, FaUsers } from 'react-icons/fa';
import { adminAPI } from '../utils/api';
import { showAlert } from '../utils/helpers';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [adminsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'admin'
  });

  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    email: '',
    role: 'admin'
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load admins from API
  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAdmins();
      
      if (response.data && response.data.success && response.data.data && response.data.data.admins) {
        setAdmins(response.data.data.admins);
      } else {
        console.error('Invalid response structure:', response.data);
        setAdmins([]);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
      showAlert(setAlert, 'danger', `Error loading admins: ${error.message}`);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = Array.isArray(admins) ? admins.filter(admin => admin && admin._id) : [];

    if (searchTerm) {
      filtered = filtered.filter(admin =>
        admin.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(admin => admin.role === roleFilter);
    }

    setFilteredAdmins(filtered);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, admins]);

  // Pagination
  const indexOfLastAdmin = currentPage * adminsPerPage;
  const indexOfFirstAdmin = indexOfLastAdmin - adminsPerPage;
  const currentAdmins = filteredAdmins.slice(indexOfFirstAdmin, indexOfLastAdmin);
  const totalPages = Math.ceil(filteredAdmins.length / adminsPerPage);

  // Badge functions
  const getRoleBadge = (role) => {
    switch (role) {
      case 'super-admin':
        return <Badge bg="danger">{role}</Badge>;
      case 'admin':
        return <Badge bg="warning">{role}</Badge>;
      default:
        return <Badge bg="secondary">{role}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? 
      <Badge bg="success">Active</Badge> : 
      <Badge bg="secondary">Inactive</Badge>;
  };

  // Handle view admin
  const handleView = (admin) => {
    setSelectedAdmin(admin);
    setShowViewModal(true);
  };

  // Handle edit admin
  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setEditForm({ 
      fullName: admin.fullName, 
      username: admin.username, 
      email: admin.email, 
      role: admin.role 
    });
    setShowEditModal(true);
  };

  // Handle delete admin
  const handleDelete = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.deleteAdmin(selectedAdmin._id);
      
      if (response.data.success) {
        const updatedAdmins = admins.filter(a => a._id !== selectedAdmin._id);
        setAdmins(updatedAdmins);
        setShowDeleteModal(false);
        showAlert(setAlert, 'success', `Admin ${selectedAdmin.fullName} has been removed successfully.`);
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      showAlert(setAlert, 'danger', `Error deleting admin: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle change password
  const handleChangePassword = (admin) => {
    setSelectedAdmin(admin);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  // Handle add admin
  const handleAddAdmin = () => {
    setAddForm({ fullName: '', username: '', email: '', password: '', role: 'admin' });
    setShowAddModal(true);
  };

  // Submit new admin
  const submitNewAdmin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Remove email if empty before sending to backend
      const payload = { ...addForm };
      if (!payload.email || payload.email.trim() === '') {
        delete payload.email;
      }
      const response = await adminAPI.createAdmin(payload);
      
      if (response.data.success) {
        await loadAdmins(); // Reload the list
        setShowAddModal(false);
        showAlert(setAlert, 'success', `Admin ${addForm.fullName} has been added successfully.`);
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      showAlert(setAlert, 'danger', `Error adding admin: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = () => {
    const exportData = filteredAdmins.map(admin => ({
      ID: admin._id,
      'Full Name': admin.fullName,
      Username: admin.username,
      Email: admin.email,
      Role: admin.role,
      Status: admin.isActive ? 'Active' : 'Inactive',
      Permissions: (admin.permissions && Array.isArray(admin.permissions)) ? admin.permissions.join(', ') : 'None',
      'Created At': admin.createdAt ? new Date(admin.createdAt).toLocaleString() : 'N/A'
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(exportData[0]).join(",") + "\n"
      + exportData.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "admins_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container fluid className="p-4">
      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.message}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setAlert(null)}
          ></button>
        </div>
      )}

      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-0">
                <FaUserShield className="me-3 text-primary" />
                Admin Management
              </h2>
              <p className="text-muted mb-0">Manage admin accounts and permissions</p>
            </div>
            <div>
              <Button variant="success" className="me-2" onClick={handleAddAdmin}>
                <FaPlus className="me-2" />
                Add Admin
              </Button>
              <Button variant="outline-primary" onClick={handleExport}>
                <FaDownload className="me-2" />
                Export
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-primary">
            <Card.Body>
              <FaUsers className="display-4 text-primary mb-2" />
              <h4>{admins.length}</h4>
              <p className="text-muted mb-0">Total Admins</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-success">
            <Card.Body>
              <FaUserShield className="display-4 text-success mb-2" />
              <h4>{admins.filter(admin => admin.isActive).length}</h4>
              <p className="text-muted mb-0">Active Admins</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-warning">
            <Card.Body>
              <FaUsers className="display-4 text-warning mb-2" />
              <h4>{admins.filter(admin => admin.role === 'admin').length}</h4>
              <p className="text-muted mb-0">Regular Admins</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-danger">
            <Card.Body>
              <FaUserShield className="display-4 text-danger mb-2" />
              <h4>{admins.filter(admin => admin.role === 'super-admin').length}</h4>
              <p className="text-muted mb-0">Super Admins</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <InputGroup>
            <InputGroup.Text>
              <FaFilter />
            </InputGroup.Text>
            <Form.Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="super-admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </Form.Select>
          </InputGroup>
        </Col>
        <Col md={3}>
          <div className="text-muted">
            Showing {filteredAdmins.length} of {admins.length} admins
          </div>
        </Col>
      </Row>

      {/* Admins Table */}
      <Card className="shadow-sm">
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentAdmins.map((admin) => (
                <tr key={admin._id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <FaUserShield className="me-2 text-primary" />
                      {admin.fullName}
                    </div>
                  </td>
                  <td>{admin.username}</td>
                  <td>{admin.email}</td>
                  <td>{getRoleBadge(admin.role)}</td>
                  <td>{admin.isActive ? getStatusBadge('active') : getStatusBadge('inactive')}</td>
                  <td>
                    <small>{(admin.permissions && Array.isArray(admin.permissions)) ? admin.permissions.join(', ') : 'None'}</small>
                  </td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        Actions
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleView(admin)}>
                          <FaEye className="me-2" />
                          View
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleEdit(admin)}>
                          <FaEdit className="me-2" />
                          Edit
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleChangePassword(admin)}>
                          <FaKey className="me-2" />
                          Change Password
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item 
                          onClick={() => handleDelete(admin)}
                          className="text-danger"
                          disabled={admin.role === 'super-admin'}
                        >
                          <FaTrash className="me-2" />
                          Remove
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* No data message */}
          {currentAdmins.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">No admins found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                <Pagination.Prev
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                />
                {[...Array(totalPages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === currentPage}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Admin Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Admin</Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitNewAdmin}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={addForm.fullName}
                    onChange={(e) => setAddForm({...addForm, fullName: e.target.value})}
                    placeholder="Enter full name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    value={addForm.username}
                    onChange={(e) => setAddForm({...addForm, username: e.target.value})}
                    placeholder="Enter username"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                    placeholder="Enter email "
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({...addForm, password: e.target.value})}
                    placeholder="Enter password"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={addForm.role}
                    onChange={(e) => setAddForm({...addForm, role: e.target.value})}
                  >
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Admin'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Admin Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Admin Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAdmin && (
            <div>
              <Row>
                <Col md={6}>
                  <strong>ID:</strong>
                  <p>{selectedAdmin._id}</p>
                </Col>
                <Col md={6}>
                  <strong>Full Name:</strong>
                  <p>{selectedAdmin.fullName}</p>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <strong>Username:</strong>
                  <p>{selectedAdmin.username}</p>
                </Col>
                <Col md={6}>
                  <strong>Email:</strong>
                  <p>{selectedAdmin.email}</p>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <strong>Role:</strong>
                  <p>{getRoleBadge(selectedAdmin.role)}</p>
                </Col>
                <Col md={6}>
                  <strong>Status:</strong>
                  <p>{selectedAdmin.isActive ? getStatusBadge('active') : getStatusBadge('inactive')}</p>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <strong>Permissions:</strong>
                  <p>{(selectedAdmin.permissions && Array.isArray(selectedAdmin.permissions)) ? selectedAdmin.permissions.join(', ') : 'None'}</p>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <strong>Created At:</strong>
                  <p>{selectedAdmin.createdAt ? new Date(selectedAdmin.createdAt).toLocaleString() : 'N/A'}</p>
                </Col>
                <Col md={6}>
                  <strong>Updated At:</strong>
                  <p>{selectedAdmin.updatedAt ? new Date(selectedAdmin.updatedAt).toLocaleString() : 'N/A'}</p>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Admin Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Admin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAdmin && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={selectedAdmin.fullName}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={selectedAdmin.username}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      defaultValue={selectedAdmin.email}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Select defaultValue={selectedAdmin.role}>
                      <option value="super-admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select defaultValue={selectedAdmin.isActive ? 'active' : 'inactive'}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
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
          <Button variant="primary">
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Remove</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAdmin && (
            <p>
              Are you sure you want to remove admin <strong>{selectedAdmin.fullName}</strong>? 
              This action cannot be undone.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={loading}>
            {loading ? 'Removing...' : 'Remove Admin'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Change Password Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAdmin && (
            <div>
              <p className="mb-3">
                <strong>Admin:</strong> {selectedAdmin.fullName}
              </p>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  />
                </Form.Group>
              </Form>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </Button>
          <Button variant="primary">
            Update Password
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminManagement;
