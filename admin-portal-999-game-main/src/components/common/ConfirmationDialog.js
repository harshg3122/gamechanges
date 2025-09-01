import React from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import { FaExclamationTriangle, FaTrash, FaBan, FaCheck, FaInfoCircle } from 'react-icons/fa';

const ConfirmationDialog = ({
  show,
  onHide,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // danger, warning, success, info
  icon,
  loading = false,
  additionalInfo,
  confirmButtonVariant,
  size = 'md'
}) => {
  const getIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'danger':
        return <FaTrash className="text-danger" size={24} />;
      case 'warning':
        return <FaExclamationTriangle className="text-warning" size={24} />;
      case 'success':
        return <FaCheck className="text-success" size={24} />;
      case 'info':
        return <FaInfoCircle className="text-info" size={24} />;
      default:
        return <FaExclamationTriangle className="text-warning" size={24} />;
    }
  };

  const getButtonVariant = () => {
    if (confirmButtonVariant) return confirmButtonVariant;
    
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'info':
        return 'primary';
      default:
        return 'danger';
    }
  };

  const getAlertVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'info':
        return 'info';
      default:
        return 'warning';
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      size={size}
      backdrop="static"
      keyboard={!loading}
    >
      <Modal.Header closeButton={!loading}>
        <Modal.Title className="d-flex align-items-center">
          {getIcon()}
          <span className="ms-2">{title}</span>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Alert variant={getAlertVariant()} className="mb-3">
          <div className="fw-bold mb-2">{message}</div>
          {additionalInfo && (
            <div className="mt-2">
              <small>{additionalInfo}</small>
            </div>
          )}
        </Alert>
        
        {variant === 'danger' && (
          <div className="text-muted">
            <small>
              <strong>Warning:</strong> This action cannot be undone. Please confirm that you want to proceed.
            </small>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={onHide}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button 
          variant={getButtonVariant()} 
          onClick={onConfirm}
          disabled={loading}
          className="d-flex align-items-center"
        >
          {loading && (
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationDialog;
