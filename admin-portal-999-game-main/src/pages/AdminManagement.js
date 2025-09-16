import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Badge,
  InputGroup,
  Pagination,
  Dropdown,
} from "react-bootstrap";
import {
  FaUserShield,
  FaPlus,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaEdit,
  FaTrash,
  FaKey,
  FaUsers,
} from "react-icons/fa";
import { adminAPI } from "../utils/api";
import { showAlert } from "../utils/helpers";

const AdminManagement = () => {
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [agentsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [newAgentData, setNewAgentData] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    password: "",
  });

  const [generatedReferralCode, setGeneratedReferralCode] = useState("");

  const [editForm, setEditForm] = useState({
    fullName: "",
    mobile: "",
    commissionRate: 5,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load agents from API
  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAgents();

      if (response.data && response.data.success && response.data.data) {
        // Handle both response.data.data.agents and response.data.data directly
        const agentsData = response.data.data.agents || response.data.data;
        setAgents(Array.isArray(agentsData) ? agentsData : []);
        console.log("✅ Agents loaded:", agentsData.length);
      } else {
        console.error("Invalid response structure:", response.data);
        setAgents([]);
      }
    } catch (error) {
      console.error("Error loading agents:", error);
      // Check if it's a network error (backend not running)
      if (
        error.code === "ERR_NETWORK" ||
        error.message.includes("ERR_CONNECTION_REFUSED")
      ) {
        showAlert(
          setAlert,
          "warning",
          "Backend server is not running. Please start the backend server."
        );
      } else {
        showAlert(setAlert, "danger", `Error loading agents: ${error.message}`);
      }
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = Array.isArray(agents)
      ? agents.filter((agent) => agent && agent._id)
      : [];

    if (searchTerm) {
      filtered = filtered.filter(
        (agent) =>
          agent.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      // For agents, we'll use a simple role mapping
      const agentRole = "agent"; // All agents have the same role
      filtered = filtered.filter((agent) => agentRole === roleFilter);
    }

    setFilteredAgents(filtered);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, agents]);

  // Pagination
  const indexOfLastAgent = currentPage * agentsPerPage;
  const indexOfFirstAgent = indexOfLastAgent - agentsPerPage;
  const currentAgents = filteredAgents.slice(
    indexOfFirstAgent,
    indexOfLastAgent
  );
  const totalPages = Math.ceil(filteredAgents.length / agentsPerPage);

  // Badge functions
  const getRoleBadge = (agent) => {
    // For agents, we'll show their commission rate as the role indicator
    const commissionRate = agent.commissionRate || 5;
    return <Badge bg="info">Agent ({commissionRate}%)</Badge>;
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge bg="success">Active</Badge>
    ) : (
      <Badge bg="secondary">Inactive</Badge>
    );
  };

  // Handle view agent
  const handleView = (agent) => {
    setSelectedAgent(agent);
    setShowViewModal(true);
  };

  // Handle edit agent
  const handleEdit = (agent) => {
    setSelectedAgent(agent);
    setEditForm({
      fullName: agent.fullName,
      mobile: agent.mobile,
      commissionRate: agent.commissionRate || 5,
    });
    setShowEditModal(true);
  };

  // Submit edit agent
  const submitEditAgent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const formData = new FormData(e.target);
      const payload = {
        fullName: formData.get("fullName"),
        mobile: formData.get("mobile"),
        commissionRate: parseInt(formData.get("commissionRate")),
        isActive: formData.get("status") === "active",
      };

      const response = await adminAPI.updateAgent(selectedAgent._id, payload);

      if (response.data.success) {
        await loadAgents(); // Reload the list
        setShowEditModal(false);
        showAlert(
          setAlert,
          "success",
          `Agent ${payload.fullName} has been updated successfully!`
        );
      } else {
        showAlert(
          setAlert,
          "danger",
          response.data.message || "Failed to update agent"
        );
      }
    } catch (error) {
      console.error("Error updating agent:", error);
      showAlert(
        setAlert,
        "danger",
        error.response?.data?.message || "Error updating agent"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle delete agent
  const handleDelete = (agent) => {
    setSelectedAgent(agent);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.deleteAgent(selectedAgent._id);

      if (response.data.success) {
        const updatedAgents = agents.filter((a) => a._id !== selectedAgent._id);
        setAgents(updatedAgents);
        setShowDeleteModal(false);
        showAlert(
          setAlert,
          "success",
          `Agent ${selectedAgent.fullName} has been removed successfully.`
        );
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      showAlert(setAlert, "danger", `Error deleting admin: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle change password
  const handleChangePassword = (agent) => {
    setSelectedAgent(agent);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswordModal(true);
  };

  // Submit change password
  const submitChangePassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        showAlert(setAlert, "danger", "New passwords do not match");
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        showAlert(
          setAlert,
          "danger",
          "New password must be at least 6 characters"
        );
        return;
      }

      const response = await adminAPI.changeAgentPassword({
        agentId: selectedAgent._id,
        newPassword: passwordForm.newPassword,
      });

      if (response.data.success) {
        setShowPasswordModal(false);
        showAlert(
          setAlert,
          "success",
          `Password for ${selectedAgent.fullName} has been changed successfully!`
        );
      } else {
        showAlert(
          setAlert,
          "danger",
          response.data.message || "Failed to change password"
        );
      }
    } catch (error) {
      console.error("Error changing password:", error);
      showAlert(
        setAlert,
        "danger",
        error.response?.data?.message || "Error changing password"
      );
    } finally {
      setLoading(false);
    }
  };

  // Generate referral code
  const generateReferralCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Handle add agent
  const handleAddAgent = () => {
    setAddForm({ fullName: "", mobile: "", email: "", password: "" });
    setGeneratedReferralCode(generateReferralCode());
    setShowAddModal(true);
  };

  // Submit new agent
  const submitNewAgent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Map to backend-required fields
      const payload = {
        fullName: addForm.fullName,
        mobile: addForm.mobile,
        password: addForm.password,
        referralCode: generatedReferralCode,
      };
      const response = await adminAPI.createAgent(payload);

      if (response.data.success) {
        const newAgent = response.data.data.agent;
        await loadAgents(); // Reload the list
        setShowAddModal(false);

        // Store new agent data and show success modal
        setNewAgentData(newAgent);
        setShowSuccessModal(true);

        // Also show alert
        showAlert(
          setAlert,
          "success",
          `Agent ${addForm.fullName} has been added successfully!`
        );
      } else {
        showAlert(
          setAlert,
          "danger",
          response.data.message || "Failed to create agent"
        );
      }
    } catch (error) {
      console.error("Error adding agent:", error);
      // Check if it's a network error (backend not running)
      if (
        error.code === "ERR_NETWORK" ||
        error.message.includes("ERR_CONNECTION_REFUSED")
      ) {
        showAlert(
          setAlert,
          "warning",
          "Backend server is not running. Please start the backend server."
        );
      } else if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        showAlert(setAlert, "danger", error.response.data.message);
      } else {
        showAlert(setAlert, "danger", `Error adding agent: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = () => {
    const exportData = filteredAgents.map((agent) => ({
      ID: agent._id,
      "Full Name": agent.fullName,
      Mobile: agent.mobile,
      "Referral Code": agent.referralCode,
      "Commission Rate": `${agent.commissionRate || 5}%`,
      Status: agent.isActive ? "Active" : "Inactive",
      "Referred Users": agent.referredUsers || 0,
      "Created At": agent.createdAt
        ? new Date(agent.createdAt).toLocaleString()
        : "N/A",
    }));

    const csvContent =
      "data:text/csv;charset=utf-8," +
      Object.keys(exportData[0]).join(",") +
      "\n" +
      exportData.map((row) => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "agents_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container fluid className="p-4">
      {/* Alert */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show`}
          role="alert"
        >
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
                Agent Management
              </h2>
              <p className="text-muted mb-0">
                Manage agent accounts and permissions
              </p>
            </div>
            <div>
              <Button
                variant="success"
                className="me-2"
                onClick={handleAddAgent}
              >
                <FaPlus className="me-2" />
                Add Agent
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
              <h4>{agents.length}</h4>
              <p className="text-muted mb-0">Total Agents</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-success">
            <Card.Body>
              <FaUserShield className="display-4 text-success mb-2" />
              <h4>{agents.filter((agent) => agent.isActive).length}</h4>
              <p className="text-muted mb-0">Active Agents</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-warning">
            <Card.Body>
              <FaUsers className="display-4 text-warning mb-2" />
              <h4>
                {agents.filter((agent) => agent.commissionRate <= 5).length}
              </h4>
              <p className="text-muted mb-0">Regular Agents</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-danger">
            <Card.Body>
              <FaUserShield className="display-4 text-danger mb-2" />
              <h4>
                {agents.filter((agent) => agent.commissionRate > 5).length}
              </h4>
              <p className="text-muted mb-0">Premium Agents</p>
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
              placeholder="Search by name, mobile, or referral code..."
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
              <option value="all">All Agents</option>
              <option value="agent">All Agents</option>
            </Form.Select>
          </InputGroup>
        </Col>
        <Col md={3}>
          <div className="text-muted">
            Showing {filteredAgents.length} of {agents.length} agents
          </div>
        </Col>
      </Row>

      {/* Agents Table */}
      <Card className="shadow-sm">
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Mobile</th>
                <th>Referral Code</th>
                <th>Commission</th>
                <th>Status</th>
                <th>Referred Users</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentAgents.map((agent) => (
                <tr key={agent._id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <FaUserShield className="me-2 text-primary" />
                      {agent.fullName}
                    </div>
                  </td>
                  <td>{agent.mobile}</td>
                  <td>
                    <code>{agent.referralCode}</code>
                  </td>
                  <td>{getRoleBadge(agent)}</td>
                  <td>{getStatusBadge(agent.isActive)}</td>
                  <td>
                    <Badge bg="info">{agent.referredUsers || 0}</Badge>
                  </td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle variant="outline-secondary" size="sm">
                        Actions
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleView(agent)}>
                          <FaEye className="me-2" />
                          View
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleEdit(agent)}>
                          <FaEdit className="me-2" />
                          Edit
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => handleChangePassword(agent)}
                        >
                          <FaKey className="me-2" />
                          Change Password
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item
                          onClick={() => handleDelete(agent)}
                          className="text-danger"
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
          {currentAgents.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">No agents found</p>
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

      {/* Add Agent Modal */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Agent</Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitNewAgent}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={addForm.fullName}
                    onChange={(e) =>
                      setAddForm({ ...addForm, fullName: e.target.value })
                    }
                    placeholder="Enter full name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mobile Number *</Form.Label>
                  <Form.Control
                    type="tel"
                    value={addForm.mobile}
                    onChange={(e) =>
                      setAddForm({ ...addForm, mobile: e.target.value })
                    }
                    placeholder="Enter mobile number"
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
                    onChange={(e) =>
                      setAddForm({ ...addForm, email: e.target.value })
                    }
                    placeholder="Enter email"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    value={addForm.password}
                    onChange={(e) =>
                      setAddForm({ ...addForm, password: e.target.value })
                    }
                    placeholder="Enter password"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Auto-Generated Referral Code Section */}
            <Row>
              <Col md={12}>
                <div className="mb-3 p-3 bg-light rounded border">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="text-primary mb-1">
                        📋 Auto-Generated Referral Code
                      </h6>
                      <small className="text-muted">
                        This unique code will be assigned to the agent
                      </small>
                    </div>
                    <div className="text-end">
                      <h4 className="text-success font-weight-bold mb-0">
                        {generatedReferralCode || "Click 'Generate' to create"}
                      </h4>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() =>
                        setGeneratedReferralCode(generateReferralCode())
                      }
                    >
                      🔄 Generate New Code
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Agent"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Agent Modal */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Agent Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAgent && (
            <div>
              <Row>
                <Col md={6}>
                  <strong>ID:</strong>
                  <p>{selectedAgent._id}</p>
                </Col>
                <Col md={6}>
                  <strong>Full Name:</strong>
                  <p>{selectedAgent.fullName}</p>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <strong>Mobile:</strong>
                  <p>{selectedAgent.mobile}</p>
                </Col>
                <Col md={6}>
                  <strong>Referral Code:</strong>
                  <p>
                    <code>{selectedAgent.referralCode}</code>
                  </p>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <strong>Commission Rate:</strong>
                  <p>{getRoleBadge(selectedAgent)}</p>
                </Col>
                <Col md={6}>
                  <strong>Status:</strong>
                  <p>{getStatusBadge(selectedAgent.isActive)}</p>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <strong>Referred Users:</strong>
                  <p>
                    <Badge bg="info">{selectedAgent.referredUsers || 0}</Badge>
                  </p>
                </Col>
                <Col md={6}>
                  <strong>Commission Rate:</strong>
                  <p>{selectedAgent.commissionRate || 5}%</p>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <strong>Created At:</strong>
                  <p>
                    {selectedAgent.createdAt
                      ? new Date(selectedAgent.createdAt).toLocaleString()
                      : "N/A"}
                  </p>
                </Col>
                <Col md={6}>
                  <strong>Updated At:</strong>
                  <p>
                    {selectedAgent.updatedAt
                      ? new Date(selectedAgent.updatedAt).toLocaleString()
                      : "N/A"}
                  </p>
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

      {/* Edit Agent Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Agent</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAgent && (
            <Form onSubmit={submitEditAgent}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="fullName"
                      defaultValue={selectedAgent.fullName}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Mobile</Form.Label>
                    <Form.Control
                      type="tel"
                      name="mobile"
                      defaultValue={selectedAgent.mobile}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Commission Rate (%)</Form.Label>
                    <Form.Control
                      type="number"
                      name="commissionRate"
                      min="0"
                      max="100"
                      defaultValue={selectedAgent.commissionRate || 5}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      name="status"
                      defaultValue={
                        selectedAgent.isActive ? "active" : "inactive"
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Remove</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAgent && (
            <p>
              Are you sure you want to remove agent{" "}
              <strong>{selectedAgent.fullName}</strong>? This action cannot be
              undone.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={loading}>
            {loading ? "Removing..." : "Remove Agent"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        show={showPasswordModal}
        onHide={() => setShowPasswordModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAgent && (
            <div>
              <p className="mb-3">
                <strong>Agent:</strong> {selectedAgent.fullName}
              </p>
              <Form onSubmit={submitChangePassword}>
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    required
                    minLength={6}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                    minLength={6}
                  />
                </Form.Group>
                <Modal.Footer>
                  <Button
                    variant="secondary"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </Modal.Footer>
              </Form>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Success Modal for New Agent */}
      <Modal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        centered
      >
        <Modal.Header
          closeButton
          style={{ backgroundColor: "#28a745", color: "white" }}
        >
          <Modal.Title>🎉 Agent Created Successfully!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {newAgentData && (
            <div className="text-center">
              <h5>Agent Details:</h5>
              <div className="mb-3">
                <strong>Name:</strong> {newAgentData.fullName}
              </div>
              <div className="mb-3">
                <strong>Mobile:</strong> {newAgentData.mobile}
              </div>
              <div className="mb-4 p-3 bg-light rounded">
                <h6 className="text-primary">📋 Referral Code:</h6>
                <h3 className="text-success font-weight-bold">
                  {newAgentData.referralCode}
                </h3>
                <small className="text-muted">
                  Share this code with new users for referrals
                </small>
              </div>
              <div className="mb-2">
                <strong>Status:</strong>{" "}
                <span className="text-success">Active</span>
              </div>
              <div>
                <strong>Commission Rate:</strong>{" "}
                {newAgentData.commissionRate || 5}%
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => setShowSuccessModal(false)}
            className="px-4"
          >
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminManagement;
