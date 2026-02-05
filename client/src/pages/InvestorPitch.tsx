import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  CheckCircle,
  Clock,
  Euro,
  BarChart3,
  Rocket,
  Shield,
  Printer,
  Server,
  PieChart
} from "lucide-react";

export default function InvestorPitch() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-black print:bg-white">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .container { max-width: 100% !important; padding: 20px !important; }
        }
      `}</style>

      <div className="no-print fixed top-4 right-4 z-50">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <div className="container mx-auto px-8 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">IMOLEAD AI PRO</h1>
          <p className="text-xl text-gray-600 mb-4">Plataforma de Automação de Leads Imobiliários com IA</p>
          <Badge className="bg-blue-600 text-white text-sm px-4 py-1">Proposta de Investimento 2025</Badge>
        </div>

        <Card className="mb-8 border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Target className="h-5 w-5" />
              Visão do Produto
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-gray-700 leading-relaxed">
              <strong>ImoLead AI Pro</strong> é uma plataforma SaaS de automação de leads imobiliários 
              com inteligência artificial, focada no mercado português. O sistema automatiza a captação, 
              qualificação e gestão de contactos para profissionais imobiliários, reduzindo em 80% o tempo 
              de gestão de leads e aumentando a taxa de conversão em 30%.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8 border-2 border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Euro className="h-5 w-5" />
              Modelo de Preços
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left">Plano</th>
                    <th className="border p-3 text-center">Preço Mensal</th>
                    <th className="border p-3 text-center">Preço Anual</th>
                    <th className="border p-3 text-left">Público-Alvo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-3 font-semibold">Basic</td>
                    <td className="border p-3 text-center text-green-700 font-bold">€67/mês</td>
                    <td className="border p-3 text-center">€670/ano</td>
                    <td className="border p-3 text-sm">Agentes individuais iniciantes</td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="border p-3 font-semibold">Pro ⭐</td>
                    <td className="border p-3 text-center text-green-700 font-bold">€167/mês</td>
                    <td className="border p-3 text-center">€1.670/ano</td>
                    <td className="border p-3 text-sm">Profissionais que querem escalar</td>
                  </tr>
                  <tr>
                    <td className="border p-3 font-semibold">Custom</td>
                    <td className="border p-3 text-center text-green-700 font-bold">€397-697/mês</td>
                    <td className="border p-3 text-center">Negociável</td>
                    <td className="border p-3 text-sm">Agências e equipas (5-20 users)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Justificação:</strong> Um lead qualificado custa €5-15 no mercado. 
                Com 100+ leads/mês a €67, o custo por lead é apenas €0.67 — ROI de 10x-25x.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-2 border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <Server className="h-5 w-5" />
              Custos Operacionais (Infraestrutura)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <h4 className="font-semibold mb-3">Custos Mensais por Cliente</h4>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Componente</th>
                    <th className="border p-2 text-center">Custo Estimado</th>
                    <th className="border p-2 text-left">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Hosting Replit (Reserved VM)</td>
                    <td className="border p-2 text-center">~€7-15/mês</td>
                    <td className="border p-2 text-xs text-gray-600">Partilhado entre todos os clientes</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Base de Dados (Neon PostgreSQL)</td>
                    <td className="border p-2 text-center">~€0.50-2/cliente</td>
                    <td className="border p-2 text-xs text-gray-600">Serverless, paga por uso</td>
                  </tr>
                  <tr>
                    <td className="border p-2">OpenAI API (Análise IA)</td>
                    <td className="border p-2 text-center">~€2-10/cliente</td>
                    <td className="border p-2 text-xs text-gray-600">Depende do volume de análises</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Email (Outlook/SMTP)</td>
                    <td className="border p-2 text-center">€0-2/cliente</td>
                    <td className="border p-2 text-xs text-gray-600">Gratuito até certo volume</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Stripe (Taxas Pagamento)</td>
                    <td className="border p-2 text-center">1.5% + €0.25</td>
                    <td className="border p-2 text-xs text-gray-600">Por transação</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Margem de Lucro por Plano
            </h4>
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Plano</th>
                    <th className="border p-2 text-center">Preço</th>
                    <th className="border p-2 text-center">Custo/Cliente</th>
                    <th className="border p-2 text-center">Margem</th>
                    <th className="border p-2 text-center">% Lucro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2 font-semibold">Basic</td>
                    <td className="border p-2 text-center">€67</td>
                    <td className="border p-2 text-center text-red-600">~€25</td>
                    <td className="border p-2 text-center text-green-700 font-bold">€42</td>
                    <td className="border p-2 text-center bg-green-100 font-bold text-green-800">63%</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-semibold">Pro</td>
                    <td className="border p-2 text-center">€167</td>
                    <td className="border p-2 text-center text-red-600">~€30</td>
                    <td className="border p-2 text-center text-green-700 font-bold">€137</td>
                    <td className="border p-2 text-center bg-green-100 font-bold text-green-800">82%</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-semibold">Custom</td>
                    <td className="border p-2 text-center">€547</td>
                    <td className="border p-2 text-center text-red-600">~€40</td>
                    <td className="border p-2 text-center text-green-700 font-bold">€507</td>
                    <td className="border p-2 text-center bg-green-100 font-bold text-green-800">93%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="font-semibold mb-3">Custos vs Receita em Escala</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-center">Clientes</th>
                    <th className="border p-2 text-center">Receita Mensal</th>
                    <th className="border p-2 text-center">Custos Infra*</th>
                    <th className="border p-2 text-center">Lucro Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2 text-center">10</td>
                    <td className="border p-2 text-center">€670-1.670</td>
                    <td className="border p-2 text-center text-red-600">~€250-300</td>
                    <td className="border p-2 text-center text-green-700 font-semibold">€440-1.390</td>
                  </tr>
                  <tr>
                    <td className="border p-2 text-center">50</td>
                    <td className="border p-2 text-center">€3.350-8.350</td>
                    <td className="border p-2 text-center text-red-600">~€1.250-1.500</td>
                    <td className="border p-2 text-center text-green-700 font-semibold">€2.200-6.950</td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="border p-2 text-center font-bold">100</td>
                    <td className="border p-2 text-center font-bold">€6.700-16.700</td>
                    <td className="border p-2 text-center text-red-600">~€2.500-3.000</td>
                    <td className="border p-2 text-center text-green-700 font-bold">€4.400-13.900</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>*Nota:</strong> Os custos incluem €20/mês por conta para web scraping (Apify). 
                Com mais clientes, o custo por cliente diminui, mantendo margens de <strong>65-93%</strong> dependendo do plano.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-2 border-amber-200">
          <CardHeader className="bg-amber-50">
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <TrendingUp className="h-5 w-5" />
              Recuperação do Investimento Inicial
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="p-4 bg-amber-100 rounded-lg border border-amber-300 mb-6">
              <p className="text-lg font-bold text-amber-900 text-center">
                Investimento no MVP: €20.000
              </p>
              <p className="text-sm text-amber-800 text-center mt-1">
                Este valor precisa ser recuperado através das subscrições
              </p>
            </div>

            <h4 className="font-semibold mb-3">Tempo para Recuperar o Investimento (Break-Even)</h4>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Cenário</th>
                    <th className="border p-2 text-center">Clientes</th>
                    <th className="border p-2 text-center">Lucro Mensal</th>
                    <th className="border p-2 text-center">Meses p/ Break-Even</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Lento</td>
                    <td className="border p-2 text-center text-sm">10 Basic + 2 Pro</td>
                    <td className="border p-2 text-center">~€720</td>
                    <td className="border p-2 text-center text-red-600">28 meses</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Moderado</td>
                    <td className="border p-2 text-center text-sm">25 Basic + 10 Pro</td>
                    <td className="border p-2 text-center">~€2.500</td>
                    <td className="border p-2 text-center text-amber-600">8 meses</td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="border p-2 font-semibold">Acelerado</td>
                    <td className="border p-2 text-center text-sm">50 Basic + 20 Pro + 2 Custom</td>
                    <td className="border p-2 text-center font-semibold">~€5.900</td>
                    <td className="border p-2 text-center text-green-700 font-bold">3-4 meses</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="font-semibold mb-3">Decomposição do Investimento nos Preços</h4>
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Plano</th>
                    <th className="border p-2 text-center">Preço</th>
                    <th className="border p-2 text-center">Custo Infra</th>
                    <th className="border p-2 text-center">Amortização*</th>
                    <th className="border p-2 text-center">Lucro Real</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2 font-semibold">Basic</td>
                    <td className="border p-2 text-center">€67</td>
                    <td className="border p-2 text-center text-red-600">€25</td>
                    <td className="border p-2 text-center text-amber-600">€10</td>
                    <td className="border p-2 text-center text-green-700 font-semibold">€32</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-semibold">Pro</td>
                    <td className="border p-2 text-center">€167</td>
                    <td className="border p-2 text-center text-red-600">€30</td>
                    <td className="border p-2 text-center text-amber-600">€25</td>
                    <td className="border p-2 text-center text-green-700 font-semibold">€112</td>
                  </tr>
                  <tr>
                    <td className="border p-2 font-semibold">Custom</td>
                    <td className="border p-2 text-center">€547</td>
                    <td className="border p-2 text-center text-red-600">€40</td>
                    <td className="border p-2 text-center text-amber-600">€50</td>
                    <td className="border p-2 text-center text-green-700 font-semibold">€457</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>*Amortização:</strong> Parte do valor de cada subscrição destinada a recuperar 
                o investimento inicial de €20.000. Após o break-even, este valor torna-se lucro adicional.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-gray-600 mb-1">Investimento Inicial</p>
                <p className="text-2xl font-bold text-red-700">€20.000</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-gray-600 mb-1">Break-Even Esperado</p>
                <p className="text-2xl font-bold text-amber-700">6-8 meses</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-gray-600 mb-1">Lucro Após Break-Even</p>
                <p className="text-2xl font-bold text-green-700">90%+</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="print-break"></div>

        <Card className="mb-8 border-2 border-purple-200">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Calendar className="h-5 w-5" />
              Cronograma de Desenvolvimento
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-bold text-green-800">FASE 1: MVP - CONCLUÍDO ✅</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Investimento realizado: ~€20.000</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Sistema de autenticação completo</li>
                <li>• Dashboard de gestão de leads com IA</li>
                <li>• Pagamentos Stripe integrados</li>
                <li>• CRM e calendário funcionais</li>
                <li>• Sistema de 3 planos diferenciados</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h4 className="font-bold text-blue-800">FASE 2: INTEGRAÇÕES CORE - 6 semanas</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Investimento: €8.000 - €12.000</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Google Calendar Sync</li>
                <li>• APIs Casafari/Idealista/OLX ativas</li>
                <li>• Relatórios automáticos por email</li>
                <li>• WhatsApp Business API completa</li>
              </ul>
            </div>

            <div className="border-l-4 border-orange-500 pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="h-5 w-5 text-orange-600" />
                <h4 className="font-bold text-orange-800">FASE 3: FUNCIONALIDADES PRO - 6 semanas</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Investimento: €10.000 - €15.000</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Cards digitais personalizados</li>
                <li>• Automação avançada de mensagens</li>
                <li>• Estudo de mercado analítico</li>
                <li>• Dashboard analytics avançado</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h4 className="font-bold text-purple-800">FASE 4: ENTERPRISE & SOCIAL - 8 semanas</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Investimento: €15.000 - €25.000</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Instagram Automation</li>
                <li>• TikTok Integration</li>
                <li>• Multi-tenant para agências</li>
                <li>• API pública e White-label</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="print-break"></div>

        <Card className="mb-8 border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <BarChart3 className="h-5 w-5" />
              Projeções Financeiras
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <h4 className="font-semibold mb-3">Investimento Total</h4>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Fase</th>
                    <th className="border p-2 text-center">Duração</th>
                    <th className="border p-2 text-center">Investimento</th>
                    <th className="border p-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Fase 1 - MVP</td>
                    <td className="border p-2 text-center">3 meses</td>
                    <td className="border p-2 text-center">€20.000</td>
                    <td className="border p-2 text-center text-green-600 font-semibold">✅ Concluído</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Fase 2 - Core</td>
                    <td className="border p-2 text-center">6 semanas</td>
                    <td className="border p-2 text-center">€8.000-12.000</td>
                    <td className="border p-2 text-center text-blue-600">🔜 Próximo</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Fase 3 - Pro</td>
                    <td className="border p-2 text-center">6 semanas</td>
                    <td className="border p-2 text-center">€10.000-15.000</td>
                    <td className="border p-2 text-center text-gray-500">Planeado</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Fase 4 - Enterprise</td>
                    <td className="border p-2 text-center">8 semanas</td>
                    <td className="border p-2 text-center">€15.000-25.000</td>
                    <td className="border p-2 text-center text-gray-500">Futuro</td>
                  </tr>
                  <tr className="bg-blue-100 font-bold">
                    <td className="border p-2">TOTAL</td>
                    <td className="border p-2 text-center">~6 meses</td>
                    <td className="border p-2 text-center">€53.000-72.000</td>
                    <td className="border p-2 text-center">-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="font-semibold mb-3">Projeção de Receitas (12 meses)</h4>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Cenário</th>
                    <th className="border p-2 text-center">Clientes</th>
                    <th className="border p-2 text-center">MRR</th>
                    <th className="border p-2 text-center">ARR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Conservador</td>
                    <td className="border p-2 text-center text-sm">50 Basic + 20 Pro + 2 Custom</td>
                    <td className="border p-2 text-center">€5.650</td>
                    <td className="border p-2 text-center font-semibold">€67.800</td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="border p-2 font-semibold">Moderado ⭐</td>
                    <td className="border p-2 text-center text-sm">100 Basic + 50 Pro + 5 Custom</td>
                    <td className="border p-2 text-center">€14.350</td>
                    <td className="border p-2 text-center font-semibold text-green-700">€172.200</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Otimista</td>
                    <td className="border p-2 text-center text-sm">200 Basic + 100 Pro + 15 Custom</td>
                    <td className="border p-2 text-center">€30.650</td>
                    <td className="border p-2 text-center font-semibold">€367.800</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="font-semibold mb-3">Métricas de Negócio (3 anos)</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Métrica</th>
                    <th className="border p-2 text-center">Ano 1</th>
                    <th className="border p-2 text-center">Ano 2</th>
                    <th className="border p-2 text-center">Ano 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Clientes totais</td>
                    <td className="border p-2 text-center">75</td>
                    <td className="border p-2 text-center">250</td>
                    <td className="border p-2 text-center">600</td>
                  </tr>
                  <tr>
                    <td className="border p-2">MRR</td>
                    <td className="border p-2 text-center">€7.500</td>
                    <td className="border p-2 text-center">€25.000</td>
                    <td className="border p-2 text-center">€60.000</td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="border p-2 font-semibold">ARR</td>
                    <td className="border p-2 text-center font-semibold">€90.000</td>
                    <td className="border p-2 text-center font-semibold">€300.000</td>
                    <td className="border p-2 text-center font-semibold text-green-700">€720.000</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Margem bruta</td>
                    <td className="border p-2 text-center">70%</td>
                    <td className="border p-2 text-center">75%</td>
                    <td className="border p-2 text-center">80%</td>
                  </tr>
                  <tr>
                    <td className="border p-2">LTV/CAC</td>
                    <td className="border p-2 text-center">6x</td>
                    <td className="border p-2 text-center">12x</td>
                    <td className="border p-2 text-center">19x</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="print-break"></div>

        <Card className="mb-8 border-2 border-orange-200">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Users className="h-5 w-5" />
              Mercado Alvo em Portugal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Segmento</th>
                    <th className="border p-2 text-center">Nº Estimado</th>
                    <th className="border p-2 text-center">Plano Alvo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Agentes imobiliários individuais</td>
                    <td className="border p-2 text-center">~15.000</td>
                    <td className="border p-2 text-center">Basic</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Consultores em agências</td>
                    <td className="border p-2 text-center">~8.000</td>
                    <td className="border p-2 text-center">Pro</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Agências imobiliárias</td>
                    <td className="border p-2 text-center">~3.500</td>
                    <td className="border p-2 text-center">Custom</td>
                  </tr>
                  <tr className="bg-blue-100 font-bold">
                    <td className="border p-2">Total mercado endereçável</td>
                    <td className="border p-2 text-center">~26.500</td>
                    <td className="border p-2 text-center">-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">€26.5M</p>
                <p className="text-xs text-gray-600">TAM (Total)</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">€2.65M</p>
                <p className="text-xs text-gray-600">SAM (10%)</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-700">€720K</p>
                <p className="text-xs text-gray-600">SOM (Ano 3)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-2 border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Shield className="h-5 w-5" />
              Porquê Investir Agora?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold">MVP Funcional</p>
                  <p className="text-sm text-gray-600">Produto já construído e a funcionar</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Timing de Mercado</p>
                  <p className="text-sm text-gray-600">Digitalização acelerada do setor</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Diferenciação</p>
                  <p className="text-sm text-gray-600">IA especializada no mercado PT</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Escalabilidade</p>
                  <p className="text-sm text-gray-600">SaaS com margens de 70%+</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <div className="text-center py-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-blue-800">SHALON SOLUÇÕES TECNOLÓGICAS</h3>
              <p className="text-sm text-gray-600">A nossa empresa de tecnologia</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-amber-600">Deus seja louvado!</h3>
              <p className="text-sm text-gray-600">O nosso guia e base deste projeto</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            Documento confidencial - Janeiro 2025
          </p>
        </div>
      </div>
    </div>
  );
}
