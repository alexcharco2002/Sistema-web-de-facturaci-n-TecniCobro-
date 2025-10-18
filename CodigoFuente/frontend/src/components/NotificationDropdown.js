// src/components/common/NotificationDropdown.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';

const NotificationDropdown = ({ 
  notifications = [], 
  onMarkAsRead,
  onViewAll 
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Efecto para manejar clics fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'warning': return AlertCircle;
      case 'success': return CheckCircle;
      case 'error': return XCircle;
      default: return Bell;
    }
  };

  const handleNotificationClick = (notification) => {
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleViewAll = () => {
    setShowNotifications(false);
    if (onViewAll) {
      onViewAll();
    }
  };

  return (
    <div className="notification-container" ref={notificationRef}>
      <button 
        className="notification-btn"
        onClick={() => setShowNotifications(!showNotifications)}
        title="Notificaciones"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {notifications.length > 0 && (
          <span className="notification-badge">
            {notifications.length}
          </span>
        )}
      </button>
      
      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notificaciones</h3>
            <span className="notification-count">{notifications.length}</span>
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                return (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.type} ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <IconComponent className="notification-icon" />
                    <div className="notification-content">
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                    {!notification.read && <div className="notification-dot"></div>}
                  </div>
                );
              })
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="btn-link"
                onClick={handleViewAll}
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;