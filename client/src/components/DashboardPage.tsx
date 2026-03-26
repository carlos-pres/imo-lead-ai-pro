import React from 'react';
import { Dashboard } from './Dashboard';

/**
 * DashboardPage
 * 
 * Esta é a página principal do dashboard integrado.
 * Pode ser usada em seu roteamento principal.
 * 
 * Exemplo de uso em App.tsx:
 * 
 * import { DashboardPage } from './pages/DashboardPage';
 * 
 * // Na sua lógica de roteamento:
 * case 'dashboard':
 *   return <DashboardPage />;
 */

export const DashboardPage: React.FC = () => {
  return <Dashboard />;
};
