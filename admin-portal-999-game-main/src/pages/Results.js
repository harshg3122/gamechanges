import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Alert,
  Button,
  Spinner,
  Modal
} from 'react-bootstrap';
import { 
  FaClock, 
  FaGamepad, 
  FaLock, 
  FaUnlock, 
  FaCoins, 
  FaTrophy, 
  FaUsers, 
  FaChartLine, 
  FaSync,
  FaPlay,
  FaStop,
  FaExclamationTriangle,
  FaEye
} from 'react-icons/fa';
import { gameAPI } from '../utils/api';
import { showAlert } from '../utils/helpers';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Results = ({ roundId }) => {
  const [currentRound, setCurrentRound] = useState(null);
  const [resultTables, setResultTables] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [roundWithBets, setRoundWithBets] = useState(null);
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [profitNumbers, setProfitNumbers] = useState([]);
  const [result, setResult] = useState(null);
  const [profitLoading, setProfitLoading] = useState(false);
  const [profitError, setProfitError] = useState(null);
  const [declareLoading, setDeclareLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultsHistory, setResultsHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Load data from API
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setAlert(null);
      console.log('🔍 Fetching data...');

      // Fetch current round
      const roundResponse = await gameAPI.getCurrentRoundResults();
      console.log('📊 Round response:', roundResponse.data);
      
      if (roundResponse.data && roundResponse.data.success) {
        const roundData = roundResponse.data.data || roundResponse.data.round;
        setCurrentRound(roundData);

        // Always show current round's tables, even if empty
        if (roundData?._id) {
          try {
            const tablesResponse = await gameAPI.getResultTables(roundData._id);
            console.log('📊 Tables response for current round:', tablesResponse.data);
            if (tablesResponse.data && tablesResponse.data.success) {
              const tables = tablesResponse.data.data || tablesResponse.data.tables;
              // If both tables are empty, show mock data
              if (
                (!tables.singleDigitTable || tables.singleDigitTable.length === 0) &&
                (!tables.tripleDigitTable || tables.tripleDigitTable.length === 0)
              ) {
                loadMockData();
              } else {
                setResultTables({
                  singleDigitTable: tables.singleDigitTable,
                  tripleDigitTable: tables.tripleDigitTable,
                  statistics: tables.statistics || {},
                });
              }
            } else {
              setResultTables({
                singleDigitTable: [],
                tripleDigitTable: [],
                statistics: {},
              });
            }
            setRoundWithBets(roundData);
          } catch (tablesError) {
            console.error('Error fetching result tables for current round:', tablesError);
            setResultTables({
              singleDigitTable: [],
              tripleDigitTable: [],
              statistics: {},
            });
            setRoundWithBets(roundData);
          }
        }
      } else {
        console.error('Invalid round response structure:', roundResponse.data);
        // Load mock data for testing
        loadMockData();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Load mock data for testing when API is not available
      loadMockData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Mock data for testing
  const loadMockData = () => {
    const mockCurrentRound = {
      _id: "674e1234567890abcd123456",
      timeSlot: "10:00-10:30",
      gameClass: "A",
      status: "BETTING_OPEN",
      timing: {
        gameStatus: "BETTING_OPEN",
        remainingMinutes: 15
      }
    };

    const mockResultTables = {
      statistics: {
        totalBets: 250,
        totalBetAmount: 45000,
        lockedSingleDigitEntries: 3,
        totalSingleDigitEntries: 10,
        lockedTripleDigitEntries: 15,
        totalTripleDigitEntries: 100
      },
      singleDigitTable: [
        { number: 0, tokens: 5200, lock: false },
        { number: 1, tokens: 4800, lock: true },
        { number: 2, tokens: 3600, lock: false },
        { number: 3, tokens: 6100, lock: true },
        { number: 4, tokens: 2900, lock: false },
        { number: 5, tokens: 4200, lock: false },
        { number: 6, tokens: 3800, lock: true },
        { number: 7, tokens: 5500, lock: false },
        { number: 8, tokens: 4000, lock: false },
        { number: 9, tokens: 4900, lock: false }
      ],
      tripleDigitTable: [
        { number: 123, classType: 'A', tokens: 1200, sumDigits: 6, onesDigit: 6, lock: false },
        { number: 456, classType: 'B', tokens: 980, sumDigits: 15, onesDigit: 5, lock: true },
        { number: 789, classType: 'A', tokens: 1500, sumDigits: 24, onesDigit: 4, lock: false },
        { number: 234, classType: 'C', tokens: 750, sumDigits: 9, onesDigit: 9, lock: true },
        { number: 567, classType: 'B', tokens: 1100, sumDigits: 18, onesDigit: 8, lock: false }
      ]
    };

    setCurrentRound(mockCurrentRound);
    setResultTables(mockResultTables);
    showAlert(setAlert, 'info', 'Showing demo data. Connect to backend for live results.');
  };

  // Auto refresh every 30 seconds
  useEffect(() => {
    fetchData();
    fetchResultsHistory();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'BETTING_OPEN': 
      case 'ACTIVE': 
      case 'active': 
        return 'success';
      case 'ADMIN_PERIOD': 
      case 'admin': 
        return 'warning';
      case 'CLOSED': 
      case 'closed': 
        return 'danger';
      default: 
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'BETTING_OPEN':
      case 'ACTIVE':
      case 'active':
        return <FaPlay />;
      case 'ADMIN_PERIOD':
      case 'admin':
        return <FaTrophy />;
      case 'CLOSED':
      case 'closed':
        return <FaStop />;
      default:
        return <FaClock />;
    }
  };

  // Helper to get slot start time from timeSlot string
  const getSlotStartTime = (timeSlotStr) => {
    // Example timeSlotStr: "4:00 PM - 4:50 PM"
    if (!timeSlotStr) return null;
    const match = timeSlotStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    const now = new Date();
    const slotStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    // If slotStart is in the future (e.g. after midnight), subtract a day
    if (slotStart > now) slotStart.setDate(slotStart.getDate() - 1);
    return slotStart;
  };

  // Only show button after 50 minutes from slot start
  const canShowViewResult = () => {
    if (!currentRound?.timeSlot) return false;
    const slotStart = getSlotStartTime(currentRound.timeSlot);
    if (!slotStart) return false;
    const now = new Date();
    const diffMinutes = (now - slotStart) / (1000 * 60);


    //  added the time of fifty minutes
    return diffMinutes >= 50;
  };

  // Fetch profit numbers
  const fetchProfitNumbers = async () => {
    setViewLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/results/profit-numbers`, { params: { roundId } });
      if (res.data.success) {
        setProfitNumbers(res.data.profitNumbers);
      } else {
        setError(res.data.message || 'Failed to fetch profit numbers');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profit numbers');
    }
    setViewLoading(false);
  };

  // Fetch declared result
  const fetchResult = async () => {
    setViewLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/results/view`, { params: { roundId } });
      if (res.data.success) {
        setResult(res.data.result);
      } else {
        setResult(null);
        setError(res.data.message || 'No result declared yet');
      }
    } catch (err) {
      setResult(null);
      setError(err.response?.data?.message || 'No result declared yet');
    }
    setViewLoading(false);
  };

  // Declare result
  const handleDeclare = async (tripleDigitNumber) => {
    setDeclareLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/results/declare`, { roundId, tripleDigitNumber });
      if (res.data.success) {
        setResult(res.data.result);
        fetchProfitNumbers();
      } else {
        setError(res.data.message || 'Error declaring result');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error declaring result');
    }
    setDeclareLoading(false);
  };

  // Fetch results history for the table
  const fetchResultsHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await axios.get('/api/game/results');
      setResultsHistory(res.data || []);
    } catch (err) {
      setHistoryError(err?.response?.data?.message || 'Failed to fetch results history');
      setResultsHistory([]);
    }
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (roundId) {
      fetchProfitNumbers();
      fetchResult();
    }
  }, [roundId]);

  // Fetch and show result in modal
  const handleViewResult = async () => {
    setProfitLoading(true);
    setProfitError(null);
    try {
      await fetchProfitNumbers();
      await fetchResult();
      setShowProfitModal(true);
    } catch (err) {
      setProfitError(err?.message || 'Failed to fetch result');
    }
    setProfitLoading(false);
  };

  
  if (loading) {
    return (
      <Container fluid className="p-4">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 h5">Loading Results...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="p-4">
      {/* Alert */}
      {alert && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert(null)} className="mb-4">
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">
            <FaChartLine className="me-3 text-primary" />
            Live Results Dashboard
          </h2>
          <p className="text-muted mb-0">Real-time game results and statistics</p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary"
            onClick={handleRefresh} 
            disabled={refreshing}
          >
            <FaSync className={refreshing ? 'spinner-border spinner-border-sm' : ''} />
            {refreshing ? ' Updating...' : ' Refresh'}
          </Button>
          {canShowViewResult() && (
            <Button
              variant="success"
              onClick={handleViewResult}
            >
              <FaEye className="me-2" />
              View Result
            </Button>
          )}
        </div>
      </div>

      {/* Current Round Status */}
      {currentRound && (
        <Card className="mb-4 shadow-sm">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FaGamepad className="me-2" />
              <h5 className="mb-0">Current Round</h5>
              <Badge bg="info" className="ms-2">#{currentRound._id?.slice(-6) || 'N/A'}</Badge>
            </div>
            <Badge 
              bg={getStatusColor(currentRound.timing?.gameStatus || currentRound.status)}
              className="d-flex align-items-center"
            >
              {getStatusIcon(currentRound.timing?.gameStatus || currentRound.status)}
              <span className="ms-1">{currentRound.timing?.gameStatus || currentRound.status || 'ACTIVE'}</span>
            </Badge>
          </Card.Header>

          <Card.Body>
            <Row>
              <Col md={2}>
                <div className="text-center">
                  <FaClock className="text-primary mb-2" size={20} />
                  <div className="fw-bold">{currentRound.timeSlot || 'N/A'}</div>
                  <small className="text-muted">Time Slot</small>
                </div>
              </Col>
              <Col md={2}>
                <div className="text-center">
                  <FaGamepad className="text-success mb-2" size={20} />
                  <div className="fw-bold">
                    <Badge bg="success">{currentRound.gameClass || 'Standard'}</Badge>
                  </div>
                  <small className="text-muted">Game Class</small>
                </div>
              </Col>
              <Col md={2}>
                <div className="text-center">
                  <FaUsers className="text-info mb-2" size={20} />
                  <div className="fw-bold">{resultTables?.statistics?.totalBets || 0}</div>
                  <small className="text-muted">Total Bets</small>
                </div>
              </Col>
              <Col md={2}>
                <div className="text-center">
                  <FaCoins className="text-warning mb-2" size={20} />
                  <div className="fw-bold">₹{resultTables?.statistics?.totalBetAmount || 0}</div>
                  <small className="text-muted">Total Amount</small>
                </div>
              </Col>
              {currentRound.timing && (
                <Col md={2}>
                  <div className="text-center">
                    <FaClock className="text-danger mb-2" size={20} />
                    <div className="fw-bold">{currentRound.timing.remainingMinutes || 0} min</div>
                    <small className="text-muted">Remaining</small>
                  </div>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Results Tables */}
      {resultTables && (
        <Row className="mb-4">
          {/* Single Digit Table */}
          <Col lg={6} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <FaTrophy className="me-2 text-warning" />
                  <h5 className="mb-0">Single Digit Table</h5>
                  {roundWithBets && roundWithBets._id !== currentRound?._id && (
                    <Badge bg="warning" className="ms-2">
                      Previous Round Data
                    </Badge>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <Badge bg="danger">
                    <FaLock className="me-1" />
                    {resultTables.statistics?.lockedSingleDigitEntries || 0} Locked
                  </Badge>
                  <Badge bg="info">
                    <FaUsers className="me-1" />
                    {resultTables.statistics?.totalSingleDigitEntries || 0} Total
                  </Badge>
                </div>
              </Card.Header>
              
              <Card.Body className="p-0">
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table responsive hover className="mb-0">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Number</th>
                        <th>Tokens</th>
                        {/* Removed Status column */}
                      </tr>
                    </thead>
                    <tbody>
                      {(resultTables.singleDigitTable || [])
                        .sort((a, b) => (b.tokens || 0) - (a.tokens || 0))
                        .map((item, index) => (
                        <tr 
                          key={item.number || index} 
                          className={item.lock ? 'table-danger' : (item.tokens > 0 ? 'table-success' : '')}
                        >
                          <td>
                            <Badge bg="primary" className="fw-bold">{item.number}</Badge>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaCoins className="me-2 text-warning" />
                              <span className="fw-bold">₹{item.tokens || 0}</span>
                            </div>
                          </td>
                          {/* Removed Status cell */}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Triple Digit Table */}
          <Col lg={6} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <FaGamepad className="me-2 text-primary" />
                  <h5 className="mb-0">Triple Digit Table</h5>
                  {roundWithBets && roundWithBets._id !== currentRound?._id && (
                    <Badge bg="warning" className="ms-2">
                      Previous Round Data
                    </Badge>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <Badge bg="danger">
                    <FaLock className="me-1" />
                    {resultTables.statistics?.lockedTripleDigitEntries || 0} Locked
                  </Badge>
                  <Badge bg="info">
                    <FaUsers className="me-1" />
                    {resultTables.statistics?.totalTripleDigitEntries || 0} Total
                  </Badge>
                </div>
              </Card.Header>
              
              <Card.Body className="p-0">
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Table responsive hover className="mb-0">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Number</th>
                        <th>Class</th>
                        <th>Tokens</th>
                        <th>Sum</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(resultTables.tripleDigitTable || [])
                        .sort((a, b) => (b.tokens || 0) - (a.tokens || 0))
                        .map((item, index) => (
                        <tr 
                          key={item.number || index} 
                          className={item.lock ? 'table-danger' : (item.tokens > 0 ? 'table-success' : '')}
                        >
                          <td>
                            <Badge bg="info" className="fw-bold">{item.number}</Badge>
                          </td>
                          <td>
                            <Badge 
                              bg={item.classType === 'A' ? 'success' : item.classType === 'B' ? 'warning' : 'secondary'}
                            >
                              {item.classType || 'N/A'}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaCoins className="me-2 text-warning" />
                              <span className="fw-bold">₹{item.tokens || 0}</span>
                            </div>
                          </td>
                          <td>
                            <span className="fw-bold">{item.sumDigits || 0}</span>
                            {item.onesDigit !== undefined && (
                              <small className="text-muted"> ({item.onesDigit})</small>
                            )}
                          </td>
                          <td>
                            {item.lock ? (
                              <Badge bg="danger">
                                <FaLock className="me-1" /> Locked
                              </Badge>
                            ) : (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleDeclareResult(item.number)}
                              >
                                Declare as Result
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!resultTables.tripleDigitTable || resultTables.tripleDigitTable.length === 0) && (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-4">
                            <FaExclamationTriangle className="me-2" />
                            No triple digit bets placed yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Summary Stats */}
      {resultTables && (
        <Row>
          <Col md={3}>
            <Card className="text-center border-primary">
              <Card.Body>
                <FaUsers className="display-4 text-primary mb-2" />
                <h4>{resultTables.statistics?.totalBets || 0}</h4>
                <p className="text-muted mb-0">Total Bets</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-success">
              <Card.Body>
                <FaCoins className="display-4 text-success mb-2" />
                <h4>₹{resultTables.statistics?.totalBetAmount || 0}</h4>
                <p className="text-muted mb-0">Total Amount</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-warning">
              <Card.Body>
                <FaLock className="display-4 text-warning mb-2" />
                <h4>
                  {(resultTables.statistics?.lockedTripleDigitEntries || 0) + 
                   (resultTables.statistics?.lockedSingleDigitEntries || 0)}
                </h4>
                <p className="text-muted mb-0">Locked Numbers</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-info">
              <Card.Body>
                <FaChartLine className="display-4 text-info mb-2" />
                <h4>
                  {resultTables.statistics?.totalTripleDigitEntries > 0 
                    ? Math.round(((resultTables.statistics?.lockedTripleDigitEntries || 0) / resultTables.statistics.totalTripleDigitEntries) * 100)
                    : 0}%
                </h4>
                <p className="text-muted mb-0">Lock Rate</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* No Data Message */}
      {!currentRound && !loading && !alert && (
        <Card className="text-center py-5">
          <Card.Body>
            <FaExclamationTriangle size={60} className="text-muted mb-3" />
            <h4 className="text-muted">No Active Round</h4>
            <p className="text-muted">There is no active game round at the moment.</p>
            <Button variant="primary" onClick={handleRefresh}>
              <FaSync className="me-2" />
              Check Again
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Profit Modal */}
      <Modal show={showProfitModal} onHide={() => setShowProfitModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Profitable Numbers (Company Profit)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {profitLoading ? (
            <div>Loading...</div>
          ) : profitError ? (
            <div className="text-danger">{profitError}</div>
          ) : !result ? (
            <div className="text-center text-muted">No result found.</div>
          ) : (
            <>
              <div>
                <strong>Triple Digit:</strong> {result.tripleDigitNumber} <br />
                <strong>Single Digit Result:</strong> {result.singleDigitResult}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Tokens</th>
                    <th>Locked</th>
                  </tr>
                </thead>
                <tbody>
                  {profitNumbers.map(item => (
                    <tr key={item.number}>
                      <td>{item.number}</td>
                      <td>{item.tokens}</td>
                      <td>{item.locked ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfitModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Results History Table */}
      {currentRound && resultTables && (
        <Card className="mt-4">
          <Card.Header>
            <h5 className="mb-0">Results History</h5>
          </Card.Header>
          <Card.Body>
            <Table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Single Digit</th>
                  <th>Triple Digit</th>
                </tr>
              </thead>
              <tbody>
                {resultsHistory.map(result => (
                  <tr key={result._id}>
                    <td>{formatDate(result.declaredAt)}</td>
                    <td>{result.timeSlot}</td>
                    <td>{result.singleDigit}</td>
                    <td>{result.tripleDigit}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Results;