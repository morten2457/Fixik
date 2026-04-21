import React from 'react';
import { System } from '../api/client'; // <-- импорт из client

interface TicketLegendProps {
  systems: System[];
  textColor: string;
}

export const TicketLegend: React.FC<TicketLegendProps> = ({ systems, textColor }) => {
  if (!systems.length) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
      {systems.map((system) => (
        <div key={system.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: system.bg_color,
              border: `2px solid ${system.border_color}`,
            }}
          />
          <span style={{ fontSize: '0.875rem', color: textColor }}>{system.name}</span>
        </div>
      ))}
    </div>
  );
};