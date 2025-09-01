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
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaEye,
  FaDownload,
  FaFilter,
  FaPlay,
  FaPause,
  FaStop,
  FaGamepad
} from 'react-icons/fa';
import { exportToCSV, formatCurrency, formatDate, showAlert } from '../utils/helpers';
import { gameAPI, adminAPI } from '../utils/api';

const GameManagement = () => {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [gamesPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load games from API
  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        const [gameInfoResponse, currentRoundResponse] = await Promise.all([
          gameAPI.getGameInfo(),
          gameAPI.getCurrentRound()
        ]);
        
        // Combine game info and current round data
        const gameData = [];
        if (gameInfoResponse.data.success) {
          gameData.push({
            id: 1,
            name: 'Number Selection Game',
            type: 'number_selection',
            status: 'active',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            ticketPrice: 10,
            maxParticipants: 1000,
            currentParticipants: currentRoundResponse.data?.data?.totalSelections || 0,
            prizePool: (currentRoundResponse.data?.data?.totalSelections || 0) * 10
          });
        }
        
        setGames(gameData);
      } catch (error) {
        console.error('Error loading games:', error);
        showAlert(setAlert, 'danger', 'Failed to load game data');
        // Fallback to basic game structure
        setGames([{
          id: 1,
          name: 'Number Selection Game',
          type: 'number_selection',
          status: 'active',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          ticketPrice: 10,
          maxParticipants: 1000,
          currentParticipants: 0,
          prizePool: 0
        }]);
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = games;

    if (searchTerm) {
      filtered = filtered.filter(game =>
        game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(game => game.status === statusFilter);
    }

    setFilteredGames(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, games]);

  // Pagination
  const indexOfLastGame = currentPage * gamesPerPage;
  const indexOfFirstGame = indexOfLastGame - gamesPerPage;
  const currentGames = filteredGames.slice(indexOfFirstGame, indexOfLastGame);
  const totalPages = Math.ceil(filteredGames.length / gamesPerPage);

  const handleCreate = () => {
    setSelectedGame(null);
    setShowCreateModal(true);
  };

  const handleEdit = (game) => {
    setSelectedGame(game);
    setShowEditModal(true);
  };

  const handleDelete = (game) => {
    setSelectedGame(game);
    setShowDeleteModal(true);
  };

  const handleExport = () => {
    const exportData = filteredGames.map(game => ({
      ID: game.id,
      Name: game.name,
      Type: game.type,
      Status: game.status,
      'Start Date': formatDate(game.startDate),
      'End Date': formatDate(game.endDate),
      'Ticket Price': formatCurrency(game.ticketPrice),
      'Max Participants': game.maxParticipants,
      'Current Participants': game.currentParticipants,
      'Prize Pool': formatCurrency(game.prizePool)
    }));
    exportToCSV(exportData, `games-export-${new Date().toISOString().split('T')[0]}`);
    showAlert(setAlert, 'success', 'Games data exported successfully!');
  };

  const handleStatusChange = (game, newStatus) => {
    const updatedGames = games.map(g =>
      g.id === game.id ? { ...g, status: newStatus } : g
    );
    setGames(updatedGames);
    setAlert({
      type: 'success',
      message: `Game "${game.name}" has been ${newStatus}.`
    });
    setTimeout(() => setAlert(null), 3000);
  };

  const confirmDelete = () => {
    const updatedGames = games.filter(g => g.id !== selectedGame.id);
    setGames(updatedGames);
    setShowDeleteModal(false);
    setAlert({
      type: 'success',
      message: `Game "${selectedGame.name}" has been deleted successfully.`
    });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleCreateGame = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newGame = {
      id: games.length + 1,
      name: formData.get('name'),
      type: formData.get('type'),
      status: 'scheduled',
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      participants: 0,
      prizePool: parseFloat(formData.get('prizePool')),
      createdDate: new Date().toISOString().split('T')[0]
    };
    
    setGames([...games, newGame]);
    setShowCreateModal(false);
    setAlert({
      type: 'success',
      message: `Game "${newGame.name}" has been created successfully.`
    });
    setTimeout(() => setAlert(null), 3000);
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      completed: 'primary',
      scheduled: 'info',
      paused: 'warning',
      cancelled: 'danger'
    };
    return <Badge bg={variants[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const getTypeIcon = (type) => {
    const icons = {
      number_selection: '🎯',
      lottery: '🎰',
      instant: '⚡'
    };
    return icons[type] || '🎮';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Game Management</h2>
        <Button variant="primary" onClick={handleCreate}>
          <FaPlus className="me-2" />
          Create Game
        </Button>
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
                  placeholder="Search by name or type..."
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
                <option value="completed">Completed</option>
                <option value="scheduled">Scheduled</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <div className="text-muted">
                Showing {currentGames.length} of {filteredGames.length} games
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Games Table */}
      <Card className="shadow-sm">
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Game Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Participants</th>
                <th>Prize Pool</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentGames.map((game) => (
                <tr key={game.id}>
                  <td>{game.id}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <span className="me-2">{getTypeIcon(game.type)}</span>
                      {game.name}
                    </div>
                  </td>
                  <td>{game.type.replace('_', ' ').toUpperCase()}</td>
                  <td>{getStatusBadge(game.status)}</td>
                  <td>{game.startTime}</td>
                  <td>{game.endTime}</td>
                  <td>{game.participants}</td>
                  <td>${game.prizePool.toLocaleString()}</td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        Actions
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleEdit(game)}>
                          <FaEye className="me-2" />
                          View Details
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleEdit(game)}>
                          <FaEdit className="me-2" />
                          Edit
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        {game.status === 'scheduled' && (
                          <Dropdown.Item onClick={() => handleStatusChange(game, 'active')}>
                            <FaPlay className="me-2 text-success" />
                            Activate
                          </Dropdown.Item>
                        )}
                        {game.status === 'active' && (
                          <Dropdown.Item onClick={() => handleStatusChange(game, 'paused')}>
                            <FaPause className="me-2 text-warning" />
                            Pause
                          </Dropdown.Item>
                        )}
                        {game.status === 'paused' && (
                          <Dropdown.Item onClick={() => handleStatusChange(game, 'active')}>
                            <FaPlay className="me-2 text-success" />
                            Resume
                          </Dropdown.Item>
                        )}
                        {(game.status === 'active' || game.status === 'paused') && (
                          <Dropdown.Item onClick={() => handleStatusChange(game, 'completed')}>
                            <FaStop className="me-2 text-primary" />
                            Complete
                          </Dropdown.Item>
                        )}
                        <Dropdown.Divider />
                        <Dropdown.Item 
                          onClick={() => handleDelete(game)}
                          className="text-danger"
                          disabled={game.status === 'active'}
                        >
                          <FaTrash className="me-2" />
                          Delete
                        </Dropdown.Item>
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

      {/* Create Game Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Game</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateGame}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Game Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    required
                    placeholder="Enter game name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Game Type *</Form.Label>
                  <Form.Select name="type" required>
                    <option value="">Select game type</option>
                    <option value="number_selection">Number Selection</option>
                    <option value="lottery">Lottery</option>
                    <option value="instant">Instant Game</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="startTime"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Time *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="endTime"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prize Pool ($) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="prizePool"
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter prize pool amount"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Participants</Form.Label>
                  <Form.Control
                    type="number"
                    name="maxParticipants"
                    min="1"
                    placeholder="Enter max participants (optional)"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                placeholder="Enter game description"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Game
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Game Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Game</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGame && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Game Name</Form.Label>
                    <Form.Control
                      type="text"
                      defaultValue={selectedGame.name}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Game Type</Form.Label>
                    <Form.Select defaultValue={selectedGame.type}>
                      <option value="number_selection">Number Selection</option>
                      <option value="lottery">Lottery</option>
                      <option value="instant">Instant Game</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Time</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      defaultValue={selectedGame.startTime?.replace(' ', 'T')}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>End Time</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      defaultValue={selectedGame.endTime?.replace(' ', 'T')}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Prize Pool ($)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      defaultValue={selectedGame.prizePool}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select defaultValue={selectedGame.status}>
                      <option value="scheduled">Scheduled</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
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
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGame && (
            <p>
              Are you sure you want to delete game <strong>"{selectedGame.name}"</strong>? 
              This action cannot be undone and will affect all associated data.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete Game
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GameManagement;
