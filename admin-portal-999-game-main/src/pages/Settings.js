import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Tab, 
  Tabs, 
  Alert
} from 'react-bootstrap';
import { 
  FaSave, 
  FaCog, 
  FaGamepad, 
  FaMoneyBillWave, 
  FaBell, 
  FaKey
} from 'react-icons/fa';
import { showAlert, validateEmail } from '../utils/helpers';
import { adminAPI } from '../utils/api';

const Settings = () => {
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await adminAPI.getSettings();
        
        if (response.data.success) {
          const settings = response.data.settings;
          if (settings.general) setGeneralSettings(settings.general);
          if (settings.game) setGameSettings(settings.game);
          if (settings.notification) setNotificationSettings(settings.notification);
          if (settings.security) {
            setSecuritySettings(prev => ({...prev, ...settings.security}));
          }
        } 
      } catch (error) {
        console.error('Error loading settings:', error);
        // Continue with default settings
      }
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Admin Panel',
    siteDescription: 'Gaming Platform Administration',
    contactEmail: 'admin@example.com',
    supportPhone: '+1-234-567-8900',
    timezone: 'UTC',
    language: 'en'
  });

  // Game Settings State
  const [gameSettings, setGameSettings] = useState({
    defaultGameDuration: 480, // minutes
    maxParticipants: 1000,
    minBetAmount: 1.00,
    maxBetAmount: 1000.00,
    autoResultTime: 5, // minutes after game end
    enableAutoResult: true
  });

  // Financial Settings State
  const [financialSettings, setFinancialSettings] = useState({
    minWithdrawal: 10.00,
    maxWithdrawal: 5000.00,
    withdrawalFee: 2.50,
    processingTime: 24, // hours
    currency: 'USD',
    taxRate: 0.00
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    withdrawalAlerts: true,
    gameResultAlerts: true,
    userRegistrationAlerts: true
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleGeneralChange = (field, value) => {
    setGeneralSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGameChange = (field, value) => {
    setGameSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFinancialChange = (field, value) => {
    setFinancialSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    if (!generalSettings.siteName || !generalSettings.contactEmail) {
      showAlert(setAlert, 'danger', 'Please fill in all required fields.');
      return;
    }
    if (!validateEmail(generalSettings.contactEmail)) {
      showAlert(setAlert, 'danger', 'Please enter a valid email address.');
      return;
    }
    showAlert(setAlert, 'success', 'General settings saved successfully!');
  };

  const handleSaveGame = (e) => {
    e.preventDefault();
    if (gameSettings.maxBetAmount <= 0 || gameSettings.minBetAmount <= 0) {
      showAlert(setAlert, 'danger', 'Bet amounts must be greater than 0.');
      return;
    }
    showAlert(setAlert, 'success', 'Game settings saved successfully!');
  };

  const handleSaveFinancial = (e) => {
    e.preventDefault();
    if (financialSettings.minWithdrawal <= 0 || financialSettings.maxWithdrawal <= 0) {
      showAlert(setAlert, 'danger', 'Withdrawal amounts must be greater than 0.');
      return;
    }
    showAlert(setAlert, 'success', 'Financial settings saved successfully!');
  };

  const handleSaveNotification = (e) => {
    e.preventDefault();
    showAlert(setAlert, 'success', 'Notification settings saved successfully!');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showAlert(setAlert, 'danger', 'Please fill in all password fields.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showAlert(setAlert, 'danger', 'New password must be at least 6 characters long.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert(setAlert, 'danger', 'New passwords do not match!');
      return;
    }
    
    showAlert(setAlert, 'success', 'Password changed successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // Handler to unify save actions for each settings tab
  const saveSettings = (section) => {
    switch (section) {
      case 'General':
        handleSaveGeneral({ preventDefault: () => {} });
        break;
      case 'Game':
        handleSaveGame({ preventDefault: () => {} });
        break;
      case 'Financial':
        handleSaveFinancial({ preventDefault: () => {} });
        break;
      case 'Notification':
        handleSaveNotification({ preventDefault: () => {} });
        break;
      default:
        showAlert(setAlert, 'danger', 'Unknown settings section!');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Settings</h2>
        <FaCog size={24} className="text-muted" />
      </div>

      {alert && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        {/* General Settings Tab */}
        <Tab eventKey="general" title="General">
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">
                <FaCog className="me-2" />
                General Settings
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Site Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={generalSettings.siteName}
                      onChange={(e) => handleGeneralChange('siteName', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Contact Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={generalSettings.contactEmail}
                      onChange={(e) => handleGeneralChange('contactEmail', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Support Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={generalSettings.supportPhone}
                      onChange={(e) => handleGeneralChange('supportPhone', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Timezone</Form.Label>
                    <Form.Select
                      value={generalSettings.timezone}
                      onChange={(e) => handleGeneralChange('timezone', e.target.value)}
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                      <option value="GMT">Greenwich Mean Time</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Site Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={generalSettings.siteDescription}
                  onChange={(e) => handleGeneralChange('siteDescription', e.target.value)}
                />
              </Form.Group>
              <Button variant="primary" onClick={() => saveSettings('General')}>
                <FaSave className="me-2" />
                Save General Settings
              </Button>
            </Card.Body>
          </Card>
        </Tab>

        {/* Game Settings Tab */}
        <Tab eventKey="games" title="Games">
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">
                <FaGamepad className="me-2" />
                Game Settings
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Default Game Duration (minutes)</Form.Label>
                    <Form.Control
                      type="number"
                      min="60"
                      max="1440"
                      value={gameSettings.defaultGameDuration}
                      onChange={(e) => handleGameChange('defaultGameDuration', parseInt(e.target.value))}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Max Participants per Game</Form.Label>
                    <Form.Control
                      type="number"
                      min="10"
                      max="10000"
                      value={gameSettings.maxParticipants}
                      onChange={(e) => handleGameChange('maxParticipants', parseInt(e.target.value))}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Minimum Bet Amount ($)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={gameSettings.minBetAmount}
                      onChange={(e) => handleGameChange('minBetAmount', parseFloat(e.target.value))}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Maximum Bet Amount ($)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="1"
                      value={gameSettings.maxBetAmount}
                      onChange={(e) => handleGameChange('maxBetAmount', parseFloat(e.target.value))}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Enable Auto Result Selection"
                      checked={gameSettings.enableAutoResult}
                      onChange={(e) => handleGameChange('enableAutoResult', e.target.checked)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Auto Result Time (minutes after game end)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="60"
                      value={gameSettings.autoResultTime}
                      onChange={(e) => handleGameChange('autoResultTime', parseInt(e.target.value))}
                      disabled={!gameSettings.enableAutoResult}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Button variant="primary" onClick={() => saveSettings('Game')}>
                <FaSave className="me-2" />
                Save Game Settings
              </Button>
            </Card.Body>
          </Card>
        </Tab>

        {/* Financial Settings Tab */}
        <Tab eventKey="financial" title="Financial">
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">
                <FaMoneyBillWave className="me-2" />
                Financial Settings
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Minimum Withdrawal Amount ($)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="1"
                      value={financialSettings.minWithdrawal}
                      onChange={(e) => handleFinancialChange('minWithdrawal', parseFloat(e.target.value))}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Maximum Withdrawal Amount ($)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="10"
                      value={financialSettings.maxWithdrawal}
                      onChange={(e) => handleFinancialChange('maxWithdrawal', parseFloat(e.target.value))}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Withdrawal Fee ($)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={financialSettings.withdrawalFee}
                      onChange={(e) => handleFinancialChange('withdrawalFee', parseFloat(e.target.value))}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Processing Time (hours)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="168"
                      value={financialSettings.processingTime}
                      onChange={(e) => handleFinancialChange('processingTime', parseInt(e.target.value))}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Currency</Form.Label>
                    <Form.Select
                      value={financialSettings.currency}
                      onChange={(e) => handleFinancialChange('currency', e.target.value)}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tax Rate (%)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      max="50"
                      value={financialSettings.taxRate}
                      onChange={(e) => handleFinancialChange('taxRate', parseFloat(e.target.value))}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Button variant="primary" onClick={() => saveSettings('Financial')}>
                <FaSave className="me-2" />
                Save Financial Settings
              </Button>
            </Card.Body>
          </Card>
        </Tab>

        {/* Notification Settings Tab */}
        <Tab eventKey="notifications" title="Notifications">
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">
                <FaBell className="me-2" />
                Notification Settings
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Email Notifications"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="SMS Notifications"
                      checked={notificationSettings.smsNotifications}
                      onChange={(e) => handleNotificationChange('smsNotifications', e.target.checked)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Push Notifications"
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Withdrawal Request Alerts"
                      checked={notificationSettings.withdrawalAlerts}
                      onChange={(e) => handleNotificationChange('withdrawalAlerts', e.target.checked)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Game Result Alerts"
                      checked={notificationSettings.gameResultAlerts}
                      onChange={(e) => handleNotificationChange('gameResultAlerts', e.target.checked)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="User Registration Alerts"
                      checked={notificationSettings.userRegistrationAlerts}
                      onChange={(e) => handleNotificationChange('userRegistrationAlerts', e.target.checked)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Button variant="primary" onClick={() => saveSettings('Notification')}>
                <FaSave className="me-2" />
                Save Notification Settings
              </Button>
            </Card.Body>
          </Card>
        </Tab>

        {/* Security Settings Tab */}
        <Tab eventKey="security" title="Security">
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">
                <FaKey className="me-2" />
                Security Settings
              </h5>
            </Card.Header>
            <Card.Body>
              <h6>Change Password</h6>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Current Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      placeholder="Enter new password"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Button variant="warning" onClick={handleChangePassword}>
                <FaKey className="me-2" />
                Change Password
              </Button>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Settings;
