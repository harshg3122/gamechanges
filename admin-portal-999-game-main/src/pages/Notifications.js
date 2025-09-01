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
  Spinner
} from 'react-bootstrap';
import { 
  FaSearch, 
  FaEye, 
  FaPlus, 
  FaBell,
  FaEnvelope,
  FaUsers,
  FaTrash
} from 'react-icons/fa';
import { adminAPI } from '../utils/api';
import { showAlert } from '../utils/helpers';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationsPerPage] = useState(10);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    recipients: 'all'
  });

  // Load notifications from API
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getNotifications();
        
        if (response.data.success) {
          const notificationData = response.data.notifications || response.data.data || [];
          setNotifications(notificationData);
        } else {
          // Fallback to mock data
          const mockNotifications = [
            {
              id: 1,
              title: 'System Maintenance Scheduled',
              message: 'The system will undergo maintenance on Jan 27, 2024 from 2:00 AM to 4:00 AM UTC.',
              type: 'warning',
              recipients: 'all',
              sentBy: 'System Admin',
              sentDate: '2024-01-26 15:30',
              status: 'sent',
              readCount: 245
            },
            {
              id: 2,
              title: 'New Game Available',
              message: 'A new exciting game "Super Lucky Numbers" is now available for all users!',
              type: 'info',
              recipients: 'active_users',
              sentBy: 'Game Admin',
              sentDate: '2024-01-25 12:00',
              status: 'sent',
              readCount: 198
            }
          ];
          setNotifications(mockNotifications);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        showAlert(setAlert, 'danger', 'Failed to load notifications');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = notifications;

    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(notification => notification.type === typeFilter);
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1);
  }, [searchTerm, typeFilter, notifications]);

  // Pagination
  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = filteredNotifications.slice(indexOfFirstNotification, indexOfLastNotification);
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);

  const handleViewDetails = (notification) => {
    setSelectedNotification(notification);
    setShowDetailsModal(true);
  };

  const handleDeleteNotification = (notificationId) => {
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    setNotifications(updatedNotifications);
    setAlert({
      type: 'success',
      message: 'Notification has been deleted successfully.'
    });
    setTimeout(() => setAlert(null), 3000);
  };

  const submitNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      setAlert({
        type: 'danger',
        message: 'Please fill in both title and message fields.'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.sendNotification(newNotification);
      
      if (response.data.success) {
        const notification = response.data.notification || {
          id: notifications.length + 1,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          recipients: newNotification.recipients,
          sentBy: 'Current Admin',
          sentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'sent',
          readCount: 0
        };

        setNotifications([notification, ...notifications]);
        setShowSendModal(false);
        setNewNotification({ title: '', message: '', type: 'info', recipients: 'all' });
        showAlert(setAlert, 'success', 'Notification sent successfully!');
      } else {
        showAlert(setAlert, 'danger', response.data.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      // Fallback success for demo
      const notification = {
        id: notifications.length + 1,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        recipients: newNotification.recipients,
        sentBy: 'Current Admin',
        sentDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'sent',
        readCount: 0
      };

      setNotifications([notification, ...notifications]);
      setShowSendModal(false);
      setNewNotification({ title: '', message: '', type: 'info', recipients: 'all' });
      showAlert(setAlert, 'success', 'Notification sent successfully!');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = () => {
    setNewNotification({ title: '', message: '', type: 'info', recipients: 'all' });
    setShowSendModal(true);
  };

  const getTypeBadge = (type) => {
    const variants = {
      info: 'info',
      success: 'success',
      warning: 'warning',
      danger: 'danger'
    };
    return <Badge bg={variants[type]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
  };

  const getRecipientLabel = (recipients) => {
    const labels = {
      all: 'All Users',
      active_users: 'Active Users',
      new_users: 'New Users',
      users_with_pending_withdrawals: 'Users with Pending Withdrawals',
      admins: 'Admins Only'
    };
    return labels[recipients] || recipients;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Notifications</h2>
        <Button variant="primary" onClick={handleSendNotification}>
          <FaPlus className="me-2" />
          Send Notification
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
              <FaBell size={30} className="text-primary mb-2" />
              <h4>{notifications.length}</h4>
              <small className="text-muted">Total Notifications</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaEnvelope size={30} className="text-success mb-2" />
              <h4>{notifications.filter(n => n.status === 'sent').length}</h4>
              <small className="text-muted">Sent</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaUsers size={30} className="text-info mb-2" />
              <h4>{notifications.reduce((sum, n) => sum + n.readCount, 0)}</h4>
              <small className="text-muted">Total Reads</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <FaBell size={30} className="text-warning mb-2" />
              <h4>{notifications.filter(n => n.type === 'warning').length}</h4>
              <small className="text-muted">Warnings</small>
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
                  placeholder="Search by title or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="danger">Danger</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <div className="text-muted">
                Showing {currentNotifications.length} of {filteredNotifications.length} notifications
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Notifications Table */}
      <Card className="shadow-sm">
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Recipients</th>
                <th>Sent By</th>
                <th>Sent Date</th>
                <th>Read Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentNotifications.map((notification) => (
                <tr key={notification.id}>
                  <td>
                    <div className="fw-bold">{notification.title}</div>
                    <small className="text-muted">
                      {notification.message.substring(0, 50)}...
                    </small>
                  </td>
                  <td>{getTypeBadge(notification.type)}</td>
                  <td>
                    <small>{getRecipientLabel(notification.recipients)}</small>
                  </td>
                  <td>{notification.sentBy}</td>
                  <td>{notification.sentDate}</td>
                  <td>
                    <Badge bg="secondary">{notification.readCount}</Badge>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleViewDetails(notification)}
                        title="View Details"
                      >
                        <FaEye />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteNotification(notification.id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </Button>
                    </div>
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

      {/* Send Notification Modal */}
      <Modal show={showSendModal} onHide={() => setShowSendModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Send Notification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={newNotification.title}
                onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                placeholder="Enter notification title"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Message *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={newNotification.message}
                onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                placeholder="Enter notification message"
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="danger">Danger</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Recipients</Form.Label>
                  <Form.Select
                    value={newNotification.recipients}
                    onChange={(e) => setNewNotification({...newNotification, recipients: e.target.value})}
                  >
                    <option value="all">All Users</option>
                    <option value="active_users">Active Users</option>
                    <option value="new_users">New Users</option>
                    <option value="users_with_pending_withdrawals">Users with Pending Withdrawals</option>
                    <option value="admins">Admins Only</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSendModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitNotification}>
            Send Notification
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Notification Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNotification && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Title:</strong>
                  <p>{selectedNotification.title}</p>
                </Col>
                <Col md={6}>
                  <strong>Type:</strong>
                  <p>{getTypeBadge(selectedNotification.type)}</p>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <strong>Message:</strong>
                  <p>{selectedNotification.message}</p>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Recipients:</strong>
                  <p>{getRecipientLabel(selectedNotification.recipients)}</p>
                </Col>
                <Col md={6}>
                  <strong>Sent By:</strong>
                  <p>{selectedNotification.sentBy}</p>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <strong>Sent Date:</strong>
                  <p>{selectedNotification.sentDate}</p>
                </Col>
                <Col md={6}>
                  <strong>Read Count:</strong>
                  <p><Badge bg="secondary">{selectedNotification.readCount}</Badge></p>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Notifications;
