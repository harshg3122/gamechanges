import React, { useState, useEffect } from 'react';
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
  FaExclamationTriangle
} from 'react-icons/fa';
import './Results.css'; // Add your custom CSS

const Results = () => {
  const [currentRound, setCurrentRound] = useState(null);
  const [resultTables, setResultTables] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [adminToken] = useState(localStorage.getItem('adminToken')); // Assume admin token in localStorage

  // Auto refresh every 30 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Fetch current round
      const roundResponse = await fetch('/api/game/current-round', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Check if response is ok and contains JSON
      if (!roundResponse.ok) {
        throw new Error(`HTTP error! status: ${roundResponse.status}`);
      }

      const roundText = await roundResponse.text();
      let roundData;
      
      try {
        roundData = JSON.parse(roundText);
      } catch (parseErr) {
        console.error('Invalid JSON in round response:', roundText);
        throw new Error('Invalid response format from server');
      }

      if (roundData.success) {
        setCurrentRound(roundData.data);

        // Fetch result tables for current round
        const tablesResponse = await fetch(`/api/results/tables?roundId=${roundData.data._id}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!tablesResponse.ok) {
          throw new Error(`HTTP error! status: ${tablesResponse.status}`);
        }

        const tablesText = await tablesResponse.text();
        let tablesData;

        try {
          tablesData = JSON.parse(tablesText);
        } catch (parseErr) {
          console.error('Invalid JSON in tables response:', tablesText);
          // Don't throw error here - just skip tables data
          tablesData = { success: false };
        }

        if (tablesData.success) {
          setResultTables(tablesData.data);
        } else {
          // Set empty tables if no data
          setResultTables({
            singleDigitTable: [],
            tripleDigitTable: [],
            statistics: {
              totalBets: 0,
              totalBetAmount: 0,
              lockedSingleDigitEntries: 0,
              lockedTripleDigitEntries: 0,
              totalSingleDigitEntries: 0,
              totalTripleDigitEntries: 0
            }
          });
        }
      } else {
        throw new Error(roundData.message || 'Failed to fetch round data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to fetch data: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'BETTING_OPEN': return '#22c55e'; // Green
      case 'ADMIN_PERIOD': return '#f59e0b'; // Orange
      case 'CLOSED': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'BETTING_OPEN': return <FaPlay />;
      case 'ADMIN_PERIOD': return <FaTrophy />;
      case 'CLOSED': return <FaStop />;
      default: return <FaClock />;
    }
  };

  if (loading) {
    return (
      <div className="results-container">
        <div className="loading-spinner">
          <FaSync className="spin" size={40} />
          <p>Loading Results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-container">
        <div className="error-message">
          <FaExclamationTriangle size={40} />
          <p>{error}</p>
          <button onClick={fetchData} className="retry-btn">
            <FaSync /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      {/* Header */}
      <div className="results-header">
        <div className="header-title">
          <FaChartLine size={24} />
          <h1>Live Results Dashboard</h1>
        </div>
        <button 
          onClick={handleRefresh} 
          className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
          disabled={refreshing}
        >
          <FaSync className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* Current Round Status */}
      {currentRound && (
        <div className="current-round-card">
          <div className="round-header">
            <div className="round-info">
              <FaGamepad size={20} />
              <h2>Current Round</h2>
              <span className="round-id">#{currentRound._id.slice(-6)}</span>
            </div>
            <div 
              className="status-badge" 
              style={{ backgroundColor: getStatusColor(currentRound.timing?.gameStatus) }}
            >
              {getStatusIcon(currentRound.timing?.gameStatus)}
              <span>{currentRound.timing?.gameStatus || 'ACTIVE'}</span>
            </div>
          </div>

          <div className="round-details">
            <div className="detail-item">
              <FaClock />
              <div>
                <span className="label">Time Slot</span>
                <span className="value">{currentRound.timeSlot}</span>
              </div>
            </div>
            <div className="detail-item">
              <FaGamepad />
              <div>
                <span className="label">Game Class</span>
                <span className="value class-badge">{currentRound.gameClass}</span>
              </div>
            </div>
            <div className="detail-item">
              <FaUsers />
              <div>
                <span className="label">Total Bets</span>
                <span className="value">{resultTables?.statistics?.totalBets || 0}</span>
              </div>
            </div>
            <div className="detail-item">
              <FaCoins />
              <div>
                <span className="label">Total Amount</span>
                <span className="value">₹{resultTables?.statistics?.totalBetAmount || 0}</span>
              </div>
            </div>
            {currentRound.timing && (
              <div className="detail-item">
                <FaClock />
                <div>
                  <span className="label">Remaining</span>
                  <span className="value">{currentRound.timing.remainingMinutes} min</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Tables */}
      {resultTables && (
        <div className="tables-section">
          {/* Single Digit Table */}
          <div className="table-card">
            <div className="table-header">
              <div className="table-title">
                <FaTrophy size={18} />
                <h3>Single Digit Table</h3>
              </div>
              <div className="table-stats">
                <span className="stat-item">
                  <FaLock /> {resultTables.statistics.lockedSingleDigitEntries} Locked
                </span>
                <span className="stat-item">
                  <FaUsers /> {resultTables.statistics.totalSingleDigitEntries} Total
                </span>
              </div>
            </div>
            
            <div className="table-container">
              <table className="results-table single-digit-table">
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Tokens</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {resultTables.singleDigitTable && resultTables.singleDigitTable.length > 0 ? (
                    resultTables.singleDigitTable
                      .sort((a, b) => b.tokens - a.tokens)
                      .map((item, index) => (
                      <tr 
                        key={item.number} 
                        className={`${item.lock ? 'locked-row' : ''} ${item.tokens > 0 ? 'has-bets' : 'no-bets'}`}
                      >
                        <td className="number-cell">
                          <span className="number-badge single-digit">{item.number}</span>
                        </td>
                        <td className="tokens-cell">
                          <div className="tokens-info">
                            <FaCoins />
                            <span>₹{item.tokens}</span>
                          </div>
                        </td>
                        <td className="status-cell">
                          {item.lock ? (
                            <span className="status-locked">
                              <FaLock /> Locked
                            </span>
                          ) : (
                            <span className="status-available">
                              <FaUnlock /> Available
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{textAlign: 'center', padding: '20px', color: '#6b7280'}}>
                        No betting data available for current round
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Triple Digit Table */}
          <div className="table-card">
            <div className="table-header">
              <div className="table-title">
                <FaGamepad size={18} />
                <h3>Triple Digit Table</h3>
              </div>
              <div className="table-stats">
                <span className="stat-item">
                  <FaLock /> {resultTables.statistics.lockedTripleDigitEntries} Locked
                </span>
                <span className="stat-item">
                  <FaUsers /> {resultTables.statistics.totalTripleDigitEntries} Total
                </span>
              </div>
            </div>
            
            <div className="table-container">
              <table className="results-table triple-digit-table">
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Class</th>
                    <th>Tokens</th>
                    <th>Sum</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {resultTables.tripleDigitTable && resultTables.tripleDigitTable.length > 0 ? (
                    resultTables.tripleDigitTable
                      .sort((a, b) => b.tokens - a.tokens)
                      .map((item, index) => (
                      <tr 
                        key={item.number} 
                        className={`${item.lock ? 'locked-row' : ''} ${item.tokens > 0 ? 'has-bets' : 'no-bets'}`}
                      >
                        <td className="number-cell">
                          <span className="number-badge triple-digit">{item.number}</span>
                        </td>
                        <td className="class-cell">
                          <span className={`class-badge class-${item.classType.toLowerCase()}`}>
                            {item.classType}
                          </span>
                        </td>
                        <td className="tokens-cell">
                          <div className="tokens-info">
                            <FaCoins />
                            <span>₹{item.tokens}</span>
                          </div>
                        </td>
                        <td className="sum-cell">
                          <span className="sum-value">{item.sumDigits}</span>
                          <span className="ones-digit">({item.onesDigit})</span>
                        </td>
                        <td className="status-cell">
                          {item.lock ? (
                            <span className="status-locked">
                              <FaLock /> Locked
                            </span>
                          ) : (
                            <span className="status-available">
                              <FaUnlock /> Available
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{textAlign: 'center', padding: '20px', color: '#6b7280'}}>
                        No betting data available for current round
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {resultTables && (
        <div className="summary-stats">
          <div className="stat-card">
            <FaUsers className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{resultTables.statistics.totalBets}</span>
              <span className="stat-label">Total Bets</span>
            </div>
          </div>
          <div className="stat-card">
            <FaCoins className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">₹{resultTables.statistics.totalBetAmount}</span>
              <span className="stat-label">Total Amount</span>
            </div>
          </div>
          <div className="stat-card">
            <FaLock className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">
                {resultTables.statistics.lockedTripleDigitEntries + resultTables.statistics.lockedSingleDigitEntries}
              </span>
              <span className="stat-label">Locked Numbers</span>
            </div>
          </div>
          <div className="stat-card">
            <FaChartLine className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">
                {Math.round((resultTables.statistics.lockedTripleDigitEntries / resultTables.statistics.totalTripleDigitEntries) * 100)}%
              </span>
              <span className="stat-label">Lock Rate</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
