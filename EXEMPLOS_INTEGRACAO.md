/**
 * EXEMPLOS DE INTEGRAÇÃO DO NOVO DASHBOARD
 * 
 * Copie e adapte os exemplos abaixo para sua App.tsx
 */

// ============================================
// EXEMPLO 1: Substituir a view 'dashboard' existente
// ============================================

import { DashboardPage } from './components/DashboardPage';

// Na sua lógica de roteamento/switch da App.tsx, altere:

// ANTES:
// case 'dashboard':
//   return <DashboardOld />;

// DEPOIS:
// case 'dashboard':
//   return <DashboardPage />;


// ============================================
// EXEMPLO 2: Usar apenas o AgentPanel em uma página existente
// ============================================

import { AgentPanel } from './components/AgentPanel';

// Em qualquer componente:
export function MinhaPage() {
  return (
    <div>
      <h1>Meu Dashboard personalizado</h1>
      
      {/* Adicionar AgentPanel com dados mock */}
      <AgentPanel />
      
      {/* Ou com dados customizados */}
      <AgentPanel 
        recommendations={minhasRecomendacoes}
        isLoading={isLoading}
      />
    </div>
  );
}


// ============================================
// EXEMPLO 3: Dashboard com API Integration
// ============================================

import { useEffect, useState } from 'react';
import { AgentPanel, type AgentRecommendation } from './components/AgentPanel';
import type { LeadStats } from './services/api';

export function DashboardComAPI() {
  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar recomendações (criar novo endpoint no backend se necessário)
        const recResponse = await fetch('/api/agent/recommendations');
        const recData = await recResponse.json();
        setRecommendations(recData);

        // Buscar estatísticas (endpoint existente)
        const statsResponse = await fetch('/api/stats');
        const statsData = await statsResponse.json();
        setStats(statsData);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-dark">
      <AgentPanel 
        recommendations={recommendations}
        isLoading={isLoading}
      />
      {/* Resto do dashboard aqui */}
    </div>
  );
}


// ============================================
// EXEMPLO 4: Customizar AgentPanel com dados reais
// ============================================

import { useState } from 'react';

export function CustomAgentPanel({ leads, stats }: any) {
  // Transformar dados de leads em recomendações
  const recommendations = leads
    .filter((lead: any) => lead.aiScore > 70)
    .sort((a: any, b: any) => b.aiScore - a.aiScore)
    .slice(0, 4)
    .map((lead: any) => ({
      id: lead.id,
      title: `${lead.name} - ${lead.aiScore}% de conversão`,
      description: `${lead.property?.location} • Último contacto: ${lead.lastContact}`,
      icon: 'sparkles' as const,
      priority: lead.aiScore > 85 ? ('high' as const) : ('medium' as const),
      score: lead.aiScore,
      action: 'Contactar agora',
      timeframe: 'Próximas 2 horas',
    }));

  return <AgentPanel recommendations={recommendations} />;
}


// ============================================
// EXEMPLO 5: Integração com seu sistema de autenticação
// ============================================

import { useEffect } from 'react';
import { DashboardPage } from './components/DashboardPage';
import type { AuthSession } from './services/api';

interface ProtectedDashboardProps {
  session: AuthSession | null;
  isLoading: boolean;
}

export function ProtectedDashboard({ session, isLoading }: ProtectedDashboardProps) {
  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!session) {
    return <div>Por favor, faça login</div>;
  }

  // Dashboard está protegido por autenticação
  return <DashboardPage />;
}


// ============================================
// EXEMPLO 6: Adicionar ao App.tsx existente
// ============================================

// ANTES (App.tsx original):
/*
import App from './App';

export function MyApp() {
  const [currentView, setCurrentView] = useState<ViewId>('dashboard');
  
  function renderView() {
    switch (currentView) {
      case 'dashboard':
        return <DashboardOld />;
      case 'pipeline':
        return <PipelineView />;
      // ... outros casos
    }
  }
  
  return renderView();
}
*/

// DEPOIS (App.tsx com novo dashboard):
/*
import App from './App';
import { DashboardPage } from './components/DashboardPage';

export function MyApp() {
  const [currentView, setCurrentView] = useState<ViewId>('dashboard');
  
  function renderView() {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage />; // ← Novo dashboard
      case 'pipeline':
        return <PipelineView />;
      // ... outros casos
    }
  }
  
  return renderView();
}
*/


// ============================================
// EXEMPLO 7: Passar RecommendationResponse da API
// ============================================

// Se você criar um novo endpoint no backend:
// GET /api/agent/recommendations

// Resposta esperada:
/*
{
  "recommendations": [
    {
      "id": "lead-123",
      "title": "João Silva qualificado",
      "description": "Apartamento T3 em Lisboa",
      "icon": "sparkles",
      "priority": "high",
      "score": 87,
      "action": "Contactar agora",
      "timeframe": "Próximas 2 horas"
    },
    // ... mais recomendações
  ]
}
*/

// No frontend, converter assim:
async function fetchRecommendations() {
  const response = await fetch('/api/agent/recommendations');
  const data = await response.json();
  
  return data.recommendations.map((rec: any) => ({
    ...rec,
    // Validar tipos if needed
  }));
}


// ============================================
// EXEMPLO 8: Styling customizado
// ============================================

// Se precisar customizar as cores, edite tailwind.config.js:

/*
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        'slate': {
          '950': '#0f172a', // ← Sua cor principal dark
        },
        'purple': {
          '600': '#9333ea', // ← Sua cor primária
        },
        'blue': {
          '500': '#3b82f6', // ← Sua cor secundária
        },
      },
    },
  },
}
*/

// Depois atualize as classes dos componentes conforme necessário


// ============================================
// EXEMPLO 9: Testes
// ============================================

import { render, screen } from '@testing-library/react';
import { AgentPanel } from './components/AgentPanel';

describe('AgentPanel', () => {
  it('deve renderizar com dados mock', () => {
    render(<AgentPanel />);
    
    expect(screen.getByText(/Agente de IA/i)).toBeInTheDocument();
    expect(screen.getByText(/Recomendações/i)).toBeInTheDocument();
  });

  it('deve mostrar loading state', () => {
    render(<AgentPanel isLoading={true} />);
    
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('deve renderizar recomendações customizadas', () => {
    const recs = [{
      id: '1',
      title: 'Test',
      description: 'Test description',
      icon: 'sparkles' as const,
      priority: 'high' as const,
    }];
    
    render(<AgentPanel recommendations={recs} />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});


// ============================================
// RESUMO: 3 PASSOS PARA INTEGRAR
// ============================================

// 1. Importe o componente:
//    import { DashboardPage } from './components/DashboardPage';

// 2. Use-o no seu roteamento:
//    case 'dashboard': return <DashboardPage />;

// 3. Deploy!
//    npm run build && deploy

console.log('✅ Exemplos de integração carregados com sucesso!');
