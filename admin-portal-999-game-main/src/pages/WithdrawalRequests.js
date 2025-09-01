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
  Dropdown
} from 'react-bootstrap';
import { 
  FaSearch, 
  FaEye, 
  FaCheck, 
  FaTimes, 
  FaDownload,
  FaFilter,
  FaClock,
  FaMoneyBillWave,
  FaUser
} from 'react-icons/fa';
import { exportToCSV, formatCurrency, formatDateTime, showAlert } from '../utils/helpers';

const WithdrawalRequests = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [withdrawalsPerPage] = useState(10);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [alert, setAlert] = useState(null);
  const [approvalForm, setApprovalForm] = useState({ reason: '', adminNotes: '' });
  const [rejectionForm, setRejectionForm] = useState({ reason: '', adminNotes: '' });
  const [rejectReason, setRejectReason] = useState('');

  // Mock withdrawal data
  useEffect(() => {
    const mockWithdrawals = [
      {
        id: 1,
        userId: 101,
        userName: 'John Doe',
        userEmail: 'john@example.com',
        amount: 500.00,
        status: 'pending',
        requestDate: '2024-01-26 14:30',
        processedDate: null,
        paymentMethod: 'Bank Transfer',
        accountDetails: 'Account: ****1234',
        reason: 'Regular withdrawal',
        adminNotes: ''
      },
      {
        id: 2,
        userId: 102,
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        amount: 250.75,
        status: 'approved',
        requestDate: '2024-01-25 10:15',
        processedDate: '2024-01-25 16:20',
        paymentMethod: 'PayPal',
        accountDetails: 'jane.smith@paypal.com',
        reason: 'Winnings withdrawal',
        adminNotes: 'Verified and processed'
      },
      {
        id: 3,
        userId: 103,
        userName: 'Mike Johnson',
        userEmail: 'mike@example.com',
        amount: 1000.00,
        status: 'pending',
        requestDate: '2024-01-26 09:45',
        processedDate: null,
        paymentMethod: 'Bank Transfer',
        accountDetails: 'Account: ****5678',
        reason: 'Large withdrawal request',
        adminNotes: ''
      },
      {
        id: 4,
        userId: 104,
        userName: 'Sarah Wilson',
        userEmail: 'sarah@example.com',
        amount: 75.50,
        status: 'rejected',
        requestDate: '2024-01-24 16:30',
        processedDate: '2024-01-24 18:15',
        paymentMethod: 'Bank Transfer',
        accountDetails: 'Account: ****9012',
        reason: 'Withdrawal request',
        adminNotes: 'Insufficient verification documents'
      },
      {
        id: 5,
        userId: 105,
        userName: 'David Brown',
        userEmail: 'david@example.com',
        amount: 300.25,
        status: 'processing',
        requestDate: '2024-01-25 12:00',
        processedDate: '2024-01-25 14:30',
        paymentMethod: 'PayPal',
        accountDetails: 'david.brown@paypal.com',
        reason: 'Regular withdrawal',
        adminNotes: 'Payment in progress'
      }
    ];
    setWithdrawals(mockWithdrawals);
    setFilteredWithdrawals(mockWithdrawals);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = withdrawals;

    if (searchTerm) {
      filtered = filtered.filter(withdrawal =>
        withdrawal.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        withdrawal.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        withdrawal.id.toString().includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(withdrawal => withdrawal.status === statusFilter);
    }

    setFilteredWithdrawals(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, withdrawals]);

  // Pagination
  const indexOfLastWithdrawal = currentPage * withdrawalsPerPage;
  const indexOfFirstWithdrawal = indexOfLastWithdrawal - withdrawalsPerPage;
  const currentWithdrawals = filteredWithdrawals.slice(indexOfFirstWithdrawal, indexOfLastWithdrawal);
  const totalPages = Math.ceil(filteredWithdrawals.length / withdrawalsPerPage);

  const handleViewDetails = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailsModal(true);
  };

  const handleApprove = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setApprovalForm({ reason: '', adminNotes: '' });
    setShowApproveModal(true);
  };

  const handleReject = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectionForm({ reason: '', adminNotes: '' });
    setShowRejectModal(true);
  };

  const handleExport = () => {
    const exportData = filteredWithdrawals.map(withdrawal => ({
      ID: withdrawal.id,
      'User Name': withdrawal.userName,
      Amount: formatCurrency(withdrawal.amount),
      Method: withdrawal.paymentMethod,
      Status: withdrawal.status,
      'Request Date': formatDateTime(withdrawal.requestDate),
      'Processed Date': withdrawal.processedDate ? formatDateTime(withdrawal.processedDate) : 'N/A',
      'Admin Notes': withdrawal.adminNotes || 'N/A'
    }));
    exportToCSV(exportData, `withdrawals-export-${new Date().toISOString().split('T')[0]}`);
    showAlert(setAlert, 'success', 'Withdrawal requests exported successfully!');
  };

  const confirmApprove = () => {
    const updatedWithdrawals = withdrawals.map(w =>
      w.id === selectedWithdrawal.id 
        ? { 
            ...w, 
            status: 'approved', 
            processedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
            adminNotes: 'Approved by admin'
          } 
        : w
    );
    setWithdrawals(updatedWithdrawals);
    setShowApproveModal(false);
    setAlert({
      type: 'success',
      message: `Withdrawal request #${selectedWithdrawal.id} has been approved successfully.`
    });
    setTimeout(() => setAlert(null), 3000);
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      setAlert({
        type: 'danger',
        message: 'Please provide a reason for rejection.'
      });
      return;
    }

    const updatedWithdrawals = withdrawals.map(w =>
      w.id === selectedWithdrawal.id 
        ? { 
            ...w, 
            status: 'rejected', 
            processedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
            adminNotes: rejectReason
          } 
        : w
    );
    setWithdrawals(updatedWithdrawals);
    setShowRejectModal(false);
    setAlert({
      type: 'success',
      message: `Withdrawal request #${selectedWithdrawal.id} has been rejected.`
    });
    setTimeout(() => setAlert(null), 3000);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      processing: 'info'
    };
    return <Badge bg={variants[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const exportWithdrawals = () => {
    setAlert({
      type: 'info',
      message: 'Withdrawal data exported successfully!'
    });
    setTimeout(() => setAlert(null), 3000);
  };

  const getPriorityBadge = (amount) => {
    if (amount >= 1000) return <Badge bg="danger">High</Badge>;
    if (amount >= 500) return <Badge bg="warning">Medium</Badge>;
    return <Badge bg="info">Low</Badge>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Withdrawal Requests</h2>
        <Button variant="outline-primary" onClick={exportWithdrawals}>
          <FaDownload className="me-2" />
          Export
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
              <FaClock size={30} className="text-warning mb-2" />
              <h4>{withdrawals.filter(w => w.status === 'pending').length}</h4>
              <small className="text-muted">Pending</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaCheck size={30} className="text-success mb-2" />
              <h4>{withdrawals.filter(w => w.status === 'approved').length}</h4>
              <small className="text-muted">Approved</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaTimes size={30} className="text-danger mb-2" />
              <h4>{withdrawals.filter(w => w.status === 'rejected').length}</h4>
              <small className="text-muted">Rejected</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaMoneyBillWave size={30} className="text-primary mb-2" />
              <h4>${withdrawals.reduce((sum, w) => sum + w.amount, 0).toLocaleString()}</h4>
              <small className="text-muted">Total Amount</small>
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
                  placeholder="Search by ID, user name, or email..."
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="processing">Processing</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <div className="text-muted">
                Showing {currentWithdrawals.length} of {filteredWithdrawals.length} requests
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Withdrawals Table */}
      <Card className="shadow-sm">
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Request Date</th>
                <th>Payment Method</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id}>
                  <td>#{withdrawal.id}</td>
                  <td>
                    <div>
                      <div className="fw-bold">{withdrawal.userName}</div>
                      <small className="text-muted">{withdrawal.userEmail}</small>
                    </div>
                  </td>
                  <td>
                    <span className="fw-bold">${withdrawal.amount.toFixed(2)}</span>
                  </td>
                  <td>{getStatusBadge(withdrawal.status)}</td>
                  <td>{getPriorityBadge(withdrawal.amount)}</td>
                  <td>{withdrawal.requestDate}</td>
                  <td>{withdrawal.paymentMethod}</td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        Actions
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleViewDetails(withdrawal)}>
                          <FaEye className="me-2" />
                          View Details
                        </Dropdown.Item>
                        {withdrawal.status === 'pending' && (
                          <>
                            <Dropdown.Divider />
                            <Dropdown.Item 
                              onClick={() => handleApprove(withdrawal)}
                              className="text-success"
                            >
                              <FaCheck className="me-2" />
                              Approve
                            </Dropdown.Item>
                            <Dropdown.Item 
                              onClick={() => handleReject(withdrawal)}
                              className="text-danger"
                            >
                              <FaTimes className="me-2" />
                              Reject
                            </Dropdown.Item>
                          </>
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

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

      {/* View Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Withdrawal Request Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedWithdrawal && (
            <Row>
              <Col md={6}>
                <h6>Request Information</h6>
                <p><strong>Request ID:</strong> #{selectedWithdrawal.id}</p>
                <p><strong>Amount:</strong> ${selectedWithdrawal.amount.toFixed(2)}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedWithdrawal.status)}</p>
                <p><strong>Request Date:</strong> {selectedWithdrawal.requestDate}</p>
                {selectedWithdrawal.processedDate && (
                  <p><strong>Processed Date:</strong> {selectedWithdrawal.processedDate}</p>
                )}
                <p><strong>Reason:</strong> {selectedWithdrawal.reason}</p>
              </Col>
              <Col md={6}>
                <h6>User Information</h6>
                <p><strong>User ID:</strong> {selectedWithdrawal.userId}</p>
                <p><strong>Name:</strong> {selectedWithdrawal.userName}</p>
                <p><strong>Email:</strong> {selectedWithdrawal.userEmail}</p>
                
                <h6 className="mt-3">Payment Information</h6>
                <p><strong>Method:</strong> {selectedWithdrawal.paymentMethod}</p>
                <p><strong>Account:</strong> {selectedWithdrawal.accountDetails}</p>
                
                {selectedWithdrawal.adminNotes && (
                  <>
                    <h6 className="mt-3">Admin Notes</h6>
                    <p>{selectedWithdrawal.adminNotes}</p>
                  </>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          {selectedWithdrawal?.status === 'pending' && (
            <>
              <Button 
                variant="success" 
                onClick={() => {
                  setShowDetailsModal(false);
                  handleApprove(selectedWithdrawal);
                }}
              >
                Approve
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  setShowDetailsModal(false);
                  handleReject(selectedWithdrawal);
                }}
              >
                Reject
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* Approve Confirmation Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Approval</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedWithdrawal && (
            <p>
              Are you sure you want to approve withdrawal request <strong>#{selectedWithdrawal.id}</strong> 
              for <strong>${selectedWithdrawal.amount.toFixed(2)}</strong> from user <strong>{selectedWithdrawal.userName}</strong>?
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={confirmApprove}>
            Approve Request
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reject Withdrawal Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedWithdrawal && (
            <>
              <p>
                Rejecting withdrawal request <strong>#{selectedWithdrawal.id}</strong> 
                for <strong>${selectedWithdrawal.amount.toFixed(2)}</strong> from user <strong>{selectedWithdrawal.userName}</strong>.
              </p>
              <Form.Group>
                <Form.Label>Reason for Rejection *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a detailed reason for rejection..."
                  required
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmReject}>
            Reject Request
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default WithdrawalRequests;
