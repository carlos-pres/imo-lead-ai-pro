import React from 'react';
import { DashboardCockpit } from './DashboardCockpit';

/**
 * DashboardPage
 * 
 * Wrapper page para o novo Cockpit minimalista e claro.
 * Conecta aos dados reais da aplicação via props.
 */

export const DashboardPage: React.FC = () => {
  return <DashboardCockpit />;
};
