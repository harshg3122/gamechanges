import React, { useState, useEffect, useCallback } from 'react';
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
  Container
} from 'react-bootstrap';
import { 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaEye,
  FaDownload,
  FaQrcode,
  FaUpload
} from 'react-icons/fa';
import { exportToCSV, formatDate, showAlert } from '../utils/helpers';
import { adminAPI } from '../utils/api';

const QRCodeManagement = () => {
  const [qrCodes, setQrCodes] = useState([]);
  const [filteredQrCodes, setFilteredQrCodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [qrCodesPerPage] = useState(10);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState(null);
  const [alert, setAlert] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    totalQrCodes: 0,
    activeQrCodes: 0,
    availableQrCodes: 0,
    totalUsage: 0
  });
  const [availableUsers, setAvailableUsers] = useState([]);

  // Load QR codes from API
  const loadQrCodes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getQrCodes();
      
      if (response.data && response.data.success) {
        const qrCodesData = response.data.data?.qrCodes || response.data.qrCodes || [];
        setQrCodes(qrCodesData);
        setFilteredQrCodes(qrCodesData);
      } else {
        console.error('Invalid response structure:', response.data);
        setQrCodes([]);
      }
    } catch (error) {
      console.error('Error loading QR codes:', error);
      showAlert(setAlert, 'danger', `Error loading QR codes: ${error.response?.data?.message || error.message}`);
      setQrCodes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const response = await adminAPI.getQrCodeStatistics();
      if (response.data && response.data.success) {
        setStatistics(prev => ({
          ...prev,
          ...(response.data.data || response.data.statistics || {})
        }));
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, []);

  // Load available users for assignment
  const loadAvailableUsers = useCallback(async () => {
    try {
      const response = await adminAPI.getUsers();
      if (response.data && response.data.success) {
        const users = response.data.data?.users || response.data.users || [];
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, []);

  useEffect(() => {
    loadQrCodes();
    loadStatistics();
    loadAvailableUsers();
  }, [loadQrCodes, loadStatistics, loadAvailableUsers]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = qrCodes;

    if (searchTerm) {
      filtered = filtered.filter(qr =>
        qr.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (qr.assignedUser?.fullName && qr.assignedUser.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (qr.assignedUser?.username && qr.assignedUser.username.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(qr => qr.status === statusFilter);
    }

    setFilteredQrCodes(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, qrCodes]);

  // Pagination
  const indexOfLastQrCode = currentPage * qrCodesPerPage;
  const indexOfFirstQrCode = indexOfLastQrCode - qrCodesPerPage;
  const currentQrCodes = filteredQrCodes.slice(indexOfFirstQrCode, indexOfLastQrCode);
  const totalPages = Math.ceil(filteredQrCodes.length / qrCodesPerPage);

  const handleUpload = () => {
    setUploadFile(null);
    setShowUploadModal(true);
  };

  const handleAssign = (qrCode) => {
    setSelectedQrCode(qrCode);
    setShowAssignModal(true);
  };

  const handleDelete = (qrCode) => {
    setSelectedQrCode(qrCode);
    setShowDeleteModal(true);
  };

  const handleExport = () => {
    const exportData = filteredQrCodes.map(qr => ({
      ID: qr._id || qr.id,
      'QR Code': qr.code,
      'Assigned User': qr.assignedUser?.fullName || qr.assignedUser || 'Unassigned',
      'User ID': qr.assignedUser?.userId || qr.userId || 'N/A',
      Status: qr.status,
      'Created Date': formatDate(qr.createdAt || qr.createdDate),
      'Assigned Date': qr.assignedAt ? formatDate(qr.assignedAt) : (qr.assignedDate ? formatDate(qr.assignedDate) : 'Never'),
      'Usage Count': qr.usageCount || 0
    }));
    exportToCSV(exportData, `qr-codes-export-${new Date().toISOString().split('T')[0]}`);
    showAlert(setAlert, 'success', 'QR codes data exported successfully!');
  };

  const handleStatusToggle = async (qrCode) => {
    try {
      setLoading(true);
      const response = await adminAPI.toggleQrCodeStatus(qrCode._id || qrCode.id);
      
      if (response.data && response.data.success) {
        await loadQrCodes(); // Reload the list
        await loadStatistics(); // Reload statistics
        showAlert(setAlert, 'success', `QR Code ${qrCode.code} status has been updated.`);
      }
    } catch (error) {
      console.error('Error toggling QR code status:', error);
      showAlert(setAlert, 'danger', `Error updating status: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.deleteQrCode(selectedQrCode._id || selectedQrCode.id);
      
      if (response.data && response.data.success) {
        await loadQrCodes(); // Reload the list
        await loadStatistics(); // Reload statistics
        setShowDeleteModal(false);
        showAlert(setAlert, 'success', `QR Code ${selectedQrCode.code} has been deleted successfully.`);
      }
    } catch (error) {
      console.error('Error deleting QR code:', error);
      showAlert(setAlert, 'danger', `Error deleting QR code: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size <= 5 * 1024 * 1024) { // 5MB limit
          setUploadFile(file);
        } else {
          showAlert(setAlert, 'danger', 'File size should not exceed 5MB.');
        }
      } else {
        showAlert(setAlert, 'danger', 'Please select a valid image file (PNG, JPG, SVG).');
      }
    }
  };

  const submitUpload = async () => {
    if (!uploadFile) {
      showAlert(setAlert, 'danger', 'Please select a file to upload.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', uploadFile);
      
      const response = await adminAPI.createQrCode(formData);
      
      if (response.data && response.data.success) {
        await loadQrCodes(); // Reload the list
        await loadStatistics(); // Reload statistics
        setShowUploadModal(false);
        setUploadFile(null);
        showAlert(setAlert, 'success', 'QR Code has been uploaded successfully.');
      }
    } catch (error) {
      console.error('Error uploading QR code:', error);
      showAlert(setAlert, 'danger', `Error uploading QR code: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const submitAssignment = async (userId) => {
    if (!userId || !selectedQrCode) {
      showAlert(setAlert, 'danger', 'Please select a user to assign.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('userId', userId);
      
      const response = await adminAPI.updateQrCode(selectedQrCode._id || selectedQrCode.id, formData);
      
      if (response.data && response.data.success) {
        await loadQrCodes(); // Reload the list
        await loadStatistics(); // Reload statistics
        setShowAssignModal(false);
        showAlert(setAlert, 'success', `QR Code ${selectedQrCode.code} has been assigned successfully.`);
      }
    } catch (error) {
      console.error('Error assigning QR code:', error);
      showAlert(setAlert, 'danger', `Error assigning QR code: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      available: 'info',
      deactivated: 'danger',
      inactive: 'warning'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status?.charAt(0).toUpperCase() + status?.slice(1)}</Badge>;
  };

  const downloadQrCode = async (qrCode) => {
    try {
      if (qrCode.imageUrl || qrCode.qrImage) {
        // If we have the image URL, trigger download
        const imageUrl = qrCode.imageUrl || qrCode.qrImage;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${qrCode.code}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showAlert(setAlert, 'success', `QR Code ${qrCode.code} download started.`);
      } else {
        showAlert(setAlert, 'warning', 'QR Code image not available for download.');
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      showAlert(setAlert, 'danger', 'Error downloading QR code.');
    }
  };

  return (
    <Container fluid className="p-4">
      {/* Loading Overlay */}
      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
             style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">
            <FaQrcode className="me-3 text-primary" />
            QR Code Management
          </h2>
          <p className="text-muted mb-0">Upload, assign, and manage QR codes</p>
        </div>
        <Button variant="primary" onClick={handleUpload} disabled={loading}>
          <FaUpload className="me-2" />
          Upload QR Code
        </Button>
      </div>

      {alert && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaQrcode size={30} className="text-primary mb-2" />
              <h4>{statistics.totalQrCodes || qrCodes.length}</h4>
              <small className="text-muted">Total QR Codes</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaQrcode size={30} className="text-success mb-2" />
              <h4>{statistics.activeQrCodes || qrCodes.filter(qr => qr.status === 'active').length}</h4>
              <small className="text-muted">Active</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaQrcode size={30} className="text-info mb-2" />
              <h4>{statistics.availableQrCodes || qrCodes.filter(qr => qr.status === 'available').length}</h4>
              <small className="text-muted">Available</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaQrcode size={30} className="text-warning mb-2" />
              <h4>{statistics.totalUsage || qrCodes.reduce((sum, qr) => sum + (qr.usageCount || 0), 0)}</h4>
              <small className="text-muted">Total Usage</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
                  placeholder="Search by QR code or assigned user..."
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
                <option value="available">Available</option>
                <option value="deactivated">Deactivated</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button variant="outline-primary" onClick={handleExport} disabled={loading}>
                <FaDownload className="me-2" />
                Export
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* QR Codes Table */}
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">QR Codes List</h5>
          <div className="text-muted">
            Showing {currentQrCodes.length} of {filteredQrCodes.length} QR codes
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>QR Code</th>
                <th>Preview</th>
                <th>Assigned User</th>
                <th>Status</th>
                <th>Usage Count</th>
                <th>Created Date</th>
                <th>Assigned Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentQrCodes.map((qrCode) => (
                <tr key={qrCode._id || qrCode.id}>
                  <td>
                    <code className="fw-bold">{qrCode.code}</code>
                  </td>
                  <td>
                    <div style={{ width: '50px', height: '50px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {qrCode.imageUrl || qrCode.qrImage ? (
                        <img 
                          src={qrCode.imageUrl || qrCode.qrImage} 
                          alt={qrCode.code} 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <FaQrcode size={30} className="text-muted" style={{ display: qrCode.imageUrl || qrCode.qrImage ? 'none' : 'block' }} />
                    </div>
                  </td>
                  <td>
                    {qrCode.assignedUser ? (
                      <div>
                        <div className="fw-bold">
                          {qrCode.assignedUser.fullName || qrCode.assignedUser.username || qrCode.assignedUser}
                        </div>
                        <small className="text-muted">
                          ID: {qrCode.assignedUser._id || qrCode.assignedUser.userId || qrCode.userId}
                        </small>
                      </div>
                    ) : (
                      <span className="text-muted">Not assigned</span>
                    )}
                  </td>
                  <td>{getStatusBadge(qrCode.status)}</td>
                  <td>
                    <Badge bg="secondary">{qrCode.usageCount || 0}</Badge>
                  </td>
                  <td>{formatDate(qrCode.createdAt) || qrCode.createdDate}</td>
                  <td>{qrCode.assignedAt ? formatDate(qrCode.assignedAt) : (qrCode.assignedDate || '-')}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => downloadQrCode(qrCode)}
                        title="Download"
                        disabled={loading}
                      >
                        <FaDownload />
                      </Button>
                      {!qrCode.assignedUser && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleAssign(qrCode)}
                          title="Assign"
                          disabled={loading}
                        >
                          <FaEdit />
                        </Button>
                      )}
                      {qrCode.assignedUser && (
                        <Button
                          variant={qrCode.status === 'active' ? 'outline-warning' : 'outline-success'}
                          size="sm"
                          onClick={() => handleStatusToggle(qrCode)}
                          title={qrCode.status === 'active' ? 'Deactivate' : 'Activate'}
                          disabled={loading}
                        >
                          {qrCode.status === 'active' ? '⏸️' : '▶️'}
                        </Button>
                      )}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(qrCode)}
                        title="Delete"
                        disabled={loading}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* No data message */}
          {currentQrCodes.length === 0 && !loading && (
            <div className="text-center py-5">
              <FaQrcode size={60} className="text-muted mb-3" />
              <p className="text-muted h5">No QR codes found</p>
              <p className="text-muted">
                {filteredQrCodes.length === 0 && qrCodes.length > 0 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Upload your first QR code to get started.'
                }
              </p>
              {filteredQrCodes.length === 0 && qrCodes.length === 0 && (
                <Button variant="primary" onClick={handleUpload} className="mt-2">
                  <FaUpload className="me-2" />
                  Upload QR Code
                </Button>
              )}
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

      {/* Upload QR Code Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>QR Code Image *</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                required
              />
              <Form.Text className="text-muted">
                Supported formats: PNG, JPG, JPEG, SVG. Max size: 5MB
              </Form.Text>
            </Form.Group>
            {uploadFile && (
              <div className="text-center">
                <p className="text-success">
                  <FaQrcode className="me-2" />
                  Selected file: {uploadFile.name}
                </p>
                <small className="text-muted">
                  Size: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                </small>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitUpload} disabled={loading || !uploadFile}>
            {loading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Uploading...
              </>
            ) : (
              <>
                <FaUpload className="me-2" />
                Upload QR Code
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assign QR Code Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign QR Code</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedQrCode && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>QR Code</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedQrCode.code}
                  disabled
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Assign to User *</Form.Label>
                <Form.Select id="userSelect" required>
                  <option value="">Select a user</option>
                  {availableUsers.map((user) => (
                    <option key={user._id || user.id} value={user._id || user.id}>
                      {user.fullName || user.username} (ID: {user._id || user.id})
                      {user.email && ` - ${user.email}`}
                    </option>
                  ))}
                </Form.Select>
                {availableUsers.length === 0 && (
                  <Form.Text className="text-muted">
                    No users available for assignment
                  </Form.Text>
                )}
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              const userSelect = document.getElementById('userSelect');
              if (userSelect && userSelect.value) {
                submitAssignment(userSelect.value);
              } else {
                showAlert(setAlert, 'warning', 'Please select a user to assign.');
              }
            }}
            disabled={loading || availableUsers.length === 0}
          >
            {loading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Assigning...
              </>
            ) : (
              <>
                <FaEdit className="me-2" />
                Assign QR Code
              </>
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
          {selectedQrCode && (
            <div>
              <p>
                Are you sure you want to delete QR Code <strong>{selectedQrCode.code}</strong>? 
              </p>
              <div className="alert alert-warning">
                <strong>Warning:</strong> This action cannot be undone. The QR code will be permanently removed from the system.
                {selectedQrCode.assignedUser && (
                  <div className="mt-2">
                    This QR code is currently assigned to <strong>{selectedQrCode.assignedUser.fullName || selectedQrCode.assignedUser}</strong>.
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={loading}>
            {loading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Deleting...
              </>
            ) : (
              <>
                <FaTrash className="me-2" />
                Delete QR Code
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QRCodeManagement;
