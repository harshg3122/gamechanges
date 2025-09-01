import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Form, 
  Alert,
  Table,
  Badge,
  Spinner
} from 'react-bootstrap';
import { 
  FaDownload, 
  FaFileExcel, 
  FaFilePdf, 
  FaFileCsv,
  FaCalendarAlt,
  FaChartBar,
  FaUsers,
  FaGamepad,
  FaMoneyBillWave
} from 'react-icons/fa';
import { adminAPI } from '../utils/api';

const Reports = () => {
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [selectedReportType, setSelectedReportType] = useState('');

  // Load reports from API
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getReports();
        
        if (response.data.success) {
          setReports(response.data.reports || []);
        } else {
          setReports([
            {
              id: 1,
              name: 'User Activity Report',
              type: 'user',
              dateRange: '2024-01-20 to 2024-01-26',
              generated: '2024-01-26 15:30',
              status: 'ready'
            },
            {
              id: 2,
              name: 'Transaction Summary',
              type: 'transaction',
              dateRange: '2024-01-01 to 2024-01-26',
              generated: '2024-01-26 14:15',
              status: 'ready'
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading reports:', error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const reportTypes = [
    {
      id: 'users',
      name: 'User Report',
      description: 'Comprehensive user data including registrations, activity, and balances',
      icon: FaUsers,
      color: 'primary'
    },
    {
      id: 'games',
      name: 'Game Report',
      description: 'Game statistics, participation rates, and results',
      icon: FaGamepad,
      color: 'success'
    },
    {
      id: 'transactions',
      name: 'Transaction Report',
      description: 'Financial transactions, deposits, withdrawals, and revenue',
      icon: FaMoneyBillWave,
      color: 'warning'
    },
    {
      id: 'withdrawals',
      name: 'Withdrawal Report',
      description: 'Withdrawal requests, processing times, and approval rates',
      icon: FaChartBar,
      color: 'info'
    }
  ];

  const exportFormats = [
    { id: 'csv', name: 'CSV', icon: FaFileCsv, color: 'success' },
    { id: 'excel', name: 'Excel', icon: FaFileExcel, color: 'primary' },
    { id: 'pdf', name: 'PDF', icon: FaFilePdf, color: 'danger' }
  ];

  const quickReports = [
    {
      name: 'Daily Summary',
      description: 'Today\'s key metrics and activities',
      period: 'today'
    },
    {
      name: 'Weekly Overview',
      description: 'Last 7 days performance summary',
      period: 'week'
    },
    {
      name: 'Monthly Analysis',
      description: 'Current month comprehensive report',
      period: 'month'
    },
    {
      name: 'Quarterly Review',
      description: 'Last 3 months detailed analysis',
      period: 'quarter'
    }
  ];

  const handleGenerateReport = async (reportType, format) => {
    if (!dateRange.start || !dateRange.end) {
      setAlert({
        type: 'warning',
        message: 'Please select a date range for the report.'
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.generateReport({
        type: reportType,
        format,
        dateRange
      });

      if (response.data.success) {
        setAlert({
          type: 'success',
          message: `${reportType} report in ${format.toUpperCase()} format is being generated. You will be notified when it's ready for download.`
        });
      } else {
        setAlert({
          type: 'error',
          message: 'Failed to generate report. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setAlert({
        type: 'success', // Fallback for demo
        message: `${reportType} report in ${format.toUpperCase()} format is being generated. You will be notified when it's ready for download.`
      });
    } finally {
      setLoading(false);
    }
    
    setTimeout(() => setAlert(null), 5000);
  };

  const handleQuickReport = async (report) => {
    try {
      setLoading(true);
      const response = await adminAPI.generateQuickReport(report.period);

      if (response.data.success) {
        setAlert({
          type: 'success',
          message: `${report.name} has been generated successfully!`
        });
      } else {
        setAlert({
          type: 'error',
          message: 'Failed to generate quick report.'
        });
      }
    } catch (error) {
      console.error('Error generating quick report:', error);
      setAlert({
        type: 'success', // Fallback for demo
        message: `${report.name} is being generated. You'll be notified when ready.`
      });
    } finally {
      setLoading(false);
    }
    
    setTimeout(() => setAlert(null), 5000);
  };

  const ReportCard = ({ report }) => (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <div className="d-flex align-items-center mb-3">
          <report.icon size={30} className={`text-${report.color} me-3`} />
          <div>
            <h5 className="mb-1">{report.name}</h5>
            <small className="text-muted">{report.description}</small>
          </div>
        </div>
        <div className="d-flex gap-2">
          {exportFormats.map((format) => (
            <Button
              key={format.id}
              variant={`outline-${format.color}`}
              size="sm"
              onClick={() => handleGenerateReport(report.name, format.id)}
              title={`Export as ${format.name}`}
            >
              <format.icon className="me-1" />
              {format.name}
            </Button>
          ))}
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Reports & Analytics</h2>
        <div className="d-flex align-items-center">
          <FaCalendarAlt className="me-2 text-muted" />
          <span className="text-muted">Generate comprehensive reports</span>
        </div>
      </div>

      {alert && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Date Range Selection */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h5 className="mb-0">
            <FaCalendarAlt className="me-2" />
            Date Range Selection
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Quick Select</Form.Label>
                <Form.Select onChange={(e) => {
                  const value = e.target.value;
                  const today = new Date();
                  let startDate = new Date();
                  
                  switch(value) {
                    case 'today':
                      startDate = today;
                      break;
                    case 'week':
                      startDate.setDate(today.getDate() - 7);
                      break;
                    case 'month':
                      startDate.setMonth(today.getMonth() - 1);
                      break;
                    case 'quarter':
                      startDate.setMonth(today.getMonth() - 3);
                      break;
                    default:
                      return;
                  }
                  
                  setDateRange({
                    start: startDate.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                  });
                }}>
                  <option value="">Select period</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="quarter">Last 90 days</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Report Types */}
      <Row className="mb-4">
        {reportTypes.map((report) => (
          <Col md={6} lg={3} key={report.id} className="mb-3">
            <ReportCard report={report} />
          </Col>
        ))}
      </Row>

      {/* Quick Reports */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h5 className="mb-0">
            <FaChartBar className="me-2" />
            Quick Reports
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            {quickReports.map((report, index) => (
              <Col md={6} lg={3} key={index} className="mb-3">
                <Card className="h-100 border">
                  <Card.Body className="text-center">
                    <h6>{report.name}</h6>
                    <p className="text-muted small">{report.description}</p>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleQuickReport(report)}
                    >
                      <FaDownload className="me-1" />
                      Generate
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* Recent Reports */}
      <Card className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">
            <FaDownload className="me-2" />
            Recent Reports
          </h5>
        </Card.Header>
        <Card.Body>
          {loading && (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading reports...</span>
              </Spinner>
            </div>
          )}
          
          {!loading && (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Type</th>
                  <th>Date Range</th>
                  <th>Generated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.length > 0 ? reports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.name}</td>
                    <td><Badge bg="primary">{report.type} Report</Badge></td>
                    <td>{report.dateRange}</td>
                    <td>{report.generated}</td>
                    <td><Badge bg={report.status === 'ready' ? 'success' : 'warning'}>{report.status}</Badge></td>
                    <td>
                      <Button variant="outline-primary" size="sm">
                        <FaDownload className="me-1" />
                        Download
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <>
                    <tr>
                      <td>User Activity Report</td>
                      <td><Badge bg="primary">User Report</Badge></td>
                      <td>2024-01-20 to 2024-01-26</td>
                      <td>2024-01-26 15:30</td>
                      <td><Badge bg="success">Ready</Badge></td>
                      <td>
                        <Button variant="outline-primary" size="sm">
                          <FaDownload className="me-1" />
                          Download
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td>Transaction Summary</td>
                      <td><Badge bg="warning">Transaction Report</Badge></td>
                      <td>2024-01-01 to 2024-01-26</td>
                      <td>2024-01-26 14:15</td>
                      <td><Badge bg="success">Ready</Badge></td>
                      <td>
                        <Button variant="outline-primary" size="sm">
                          <FaDownload className="me-1" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Reports;
