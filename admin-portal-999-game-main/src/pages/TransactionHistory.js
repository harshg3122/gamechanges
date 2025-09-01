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
  FaDownload,
  FaFilter,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaUser
} from 'react-icons/fa';
import { exportToCSV, formatCurrency, formatDateTime, showAlert, generateMockTransactions } from '../utils/helpers';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(15);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [alert, setAlert] = useState(null);

  // Mock transaction data
  useEffect(() => {
    const mockTransactions = [
      {
        id: 'TXN001',
        userId: 101,
        userName: 'John Doe',
        type: 'deposit',
        amount: 500.00,
        status: 'completed',
        date: '2024-01-26 14:30',
        description: 'Account deposit',
        paymentMethod: 'Credit Card',
        reference: 'CC_12345'
      },
      {
        id: 'TXN002',
        userId: 102,
        userName: 'Jane Smith',
        type: 'withdrawal',
        amount: -250.75,
        status: 'completed',
        date: '2024-01-25 16:20',
        description: 'Withdrawal to bank account',
        paymentMethod: 'Bank Transfer',
        reference: 'BT_67890'
      },
      {
        id: 'TXN003',
        userId: 103,
        userName: 'Mike Johnson',
        type: 'game_win',
        amount: 150.00,
        status: 'completed',
        date: '2024-01-25 12:15',
        description: 'Game winnings - Lucky Numbers',
        paymentMethod: 'System Credit',
        reference: 'GAME_001'
      },
      {
        id: 'TXN004',
        userId: 104,
        userName: 'Sarah Wilson',
        type: 'game_bet',
        amount: -25.00,
        status: 'completed',
        date: '2024-01-25 10:30',
        description: 'Game bet - Daily Draw',
        paymentMethod: 'Account Balance',
        reference: 'BET_002'
      },
      {
        id: 'TXN005',
        userId: 105,
        userName: 'David Brown',
        type: 'refund',
        amount: 75.50,
        status: 'pending',
        date: '2024-01-24 18:45',
        description: 'Refund for cancelled game',
        paymentMethod: 'System Credit',
        reference: 'REF_003'
      },
      {
        id: 'TXN006',
        userId: 101,
        userName: 'John Doe',
        type: 'bonus',
        amount: 50.00,
        status: 'completed',
        date: '2024-01-24 09:00',
        description: 'Welcome bonus',
        paymentMethod: 'System Credit',
        reference: 'BONUS_001'
      }
    ];
    setTransactions(mockTransactions);
    setFilteredTransactions(mockTransactions);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }

    if (dateRange.start) {
      filtered = filtered.filter(transaction => 
        new Date(transaction.date) >= new Date(dateRange.start)
      );
    }

    if (dateRange.end) {
      filtered = filtered.filter(transaction => 
        new Date(transaction.date) <= new Date(dateRange.end + ' 23:59:59')
      );
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [searchTerm, typeFilter, dateRange, transactions]);

  // Pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handleExport = () => {
    const exportData = filteredTransactions.map(transaction => ({
      ID: transaction.id,
      'User ID': transaction.userId,
      Type: transaction.type,
      Amount: formatCurrency(transaction.amount),
      Status: transaction.status,
      Date: formatDateTime(transaction.date),
      Description: transaction.description,
      'Reference ID': transaction.reference || 'N/A'
    }));
    exportToCSV(exportData, `transactions-export-${new Date().toISOString().split('T')[0]}`);
    showAlert(setAlert, 'success', 'Transaction history exported successfully!');
  };

  const getTypeBadge = (type) => {
    const variants = {
      deposit: 'success',
      withdrawal: 'primary',
      game_win: 'info',
      game_bet: 'warning',
      refund: 'secondary',
      bonus: 'success'
    };
    const labels = {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      game_win: 'Game Win',
      game_bet: 'Game Bet',
      refund: 'Refund',
      bonus: 'Bonus'
    };
    return <Badge bg={variants[type]}>{labels[type]}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'success',
      pending: 'warning',
      failed: 'danger'
    };
    return <Badge bg={variants[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const exportTransactions = () => {
    setAlert({
      type: 'info',
      message: 'Transaction data exported successfully!'
    });
    setTimeout(() => setAlert(null), 3000);
  };

  const getTotalAmount = () => {
    return filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Transaction History</h2>
        <Button variant="outline-primary" onClick={exportTransactions}>
          <FaDownload className="me-2" />
          Export
        </Button>
      </div>

      {alert && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h4 className="text-primary">{filteredTransactions.length}</h4>
              <small className="text-muted">Total Transactions</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h4 className={getTotalAmount() >= 0 ? 'text-success' : 'text-danger'}>
                ${Math.abs(getTotalAmount()).toLocaleString()}
              </h4>
              <small className="text-muted">Net Amount</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h4 className="text-success">
                {filteredTransactions.filter(t => t.amount > 0).length}
              </h4>
              <small className="text-muted">Credits</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <h4 className="text-warning">
                {filteredTransactions.filter(t => t.amount < 0).length}
              </h4>
              <small className="text-muted">Debits</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by user, ID, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="game_win">Game Win</option>
                <option value="game_bet">Game Bet</option>
                <option value="refund">Refund</option>
                <option value="bonus">Bonus</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                placeholder="Start Date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                placeholder="End Date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
            </Col>
            <Col md={2}>
              <div className="text-muted">
                {currentTransactions.length} of {filteredTransactions.length}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Transactions Table */}
      <Card className="shadow-sm">
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Payment Method</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <code>{transaction.id}</code>
                  </td>
                  <td>
                    <div>
                      <div className="fw-bold">{transaction.userName}</div>
                      <small className="text-muted">ID: {transaction.userId}</small>
                    </div>
                  </td>
                  <td>{getTypeBadge(transaction.type)}</td>
                  <td>
                    <span className={transaction.amount >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                      {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </td>
                  <td>{getStatusBadge(transaction.status)}</td>
                  <td>{transaction.date}</td>
                  <td>{transaction.paymentMethod}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleViewDetails(transaction)}
                    >
                      <FaEye className="me-1" />
                      View
                    </Button>
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

      {/* Transaction Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Transaction Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTransaction && (
            <Row>
              <Col md={6}>
                <h6>Transaction Information</h6>
                <p><strong>Transaction ID:</strong> {selectedTransaction.id}</p>
                <p><strong>Type:</strong> {getTypeBadge(selectedTransaction.type)}</p>
                <p><strong>Amount:</strong> 
                  <span className={selectedTransaction.amount >= 0 ? 'text-success fw-bold ms-2' : 'text-danger fw-bold ms-2'}>
                    {selectedTransaction.amount >= 0 ? '+' : ''}${Math.abs(selectedTransaction.amount).toFixed(2)}
                  </span>
                </p>
                <p><strong>Status:</strong> {getStatusBadge(selectedTransaction.status)}</p>
                <p><strong>Date:</strong> {selectedTransaction.date}</p>
                <p><strong>Description:</strong> {selectedTransaction.description}</p>
              </Col>
              <Col md={6}>
                <h6>User Information</h6>
                <p><strong>User ID:</strong> {selectedTransaction.userId}</p>
                <p><strong>User Name:</strong> {selectedTransaction.userName}</p>
                
                <h6 className="mt-3">Payment Information</h6>
                <p><strong>Payment Method:</strong> {selectedTransaction.paymentMethod}</p>
                <p><strong>Reference:</strong> <code>{selectedTransaction.reference}</code></p>
              </Col>
            </Row>
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

export default TransactionHistory;
