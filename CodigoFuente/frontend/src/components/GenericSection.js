// src/components/GenericSection.js
/**
 * Componente genérico para módulos sin implementación específica
 * Se usa automáticamente para módulos detectados en permisos
 */

import React from 'react';
import { Activity, Lock, CheckCircle } from 'lucide-react';

const GenericSection = ({ module, actions = [], message = null }) => {
  const IconComponent = module?.icon || Activity;

  return (
    <div className="section-placeholder">
      <div className="generic-section-container">
        <div className={`generic-icon-wrapper bg-${module?.color || 'gray'}`}>
          <IconComponent className="w-16 h-16 text-white" />
        </div>
        
        <h2 className="generic-section-title">
          {module?.label || 'Módulo'}
        </h2>
        
        <p className="generic-section-description">
          {message || `El módulo ${module?.label} está disponible para tu perfil.`}
        </p>

        {/* Mostrar acciones disponibles */}
        {actions.length > 0 && (
          <div className="generic-actions-info">
            <div className="actions-header">
              <Lock className="w-4 h-4" />
              <span className="font-semibold">Acciones disponibles:</span>
            </div>
            <div className="actions-list">
              {actions.map((action, index) => (
                <div key={index} className="action-item">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="capitalize">{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="generic-section-note">
          <p className="text-sm text-gray-500">
            Este módulo será implementado próximamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GenericSection;