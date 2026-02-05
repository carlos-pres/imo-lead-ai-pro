import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Mail, Phone, MapPin, Database, Lock, Users, FileText, Clock, Globe } from "lucide-react";
import { Link } from "wouter";

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline text-sm">
            Voltar ao Inicio
          </Link>
        </div>

        <div className="space-y-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Politica de Privacidade</h1>
            <p className="text-muted-foreground">
              Regulamento Geral sobre a Protecao de Dados (RGPD)
            </p>
            <Badge variant="outline" className="mt-2">
              Ultima atualizacao: Janeiro 2025
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                1. Responsavel pelo Tratamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                A ImoLead AI Pro e a entidade responsavel pelo tratamento dos seus dados pessoais, 
                nos termos do Regulamento (UE) 2016/679 (RGPD).
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <strong>Entidade:</strong> ImoLead AI Pro
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <strong>Email DPO:</strong> geralimolead@outlook.pt
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <strong>Pais:</strong> Portugal
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                2. Dados Pessoais Recolhidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Recolhemos as seguintes categorias de dados pessoais:</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Dados de Conta</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Nome completo</li>
                    <li>Endereco de email</li>
                    <li>Palavra-passe (armazenada de forma encriptada com bcrypt)</li>
                    <li>Numero de telefone (opcional)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dados de Leads Imobiliarios</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Nome do contacto</li>
                    <li>Telefone e email do contacto</li>
                    <li>Informacoes do imovel (tipo, localizacao, preco)</li>
                    <li>Notas e historico de interacoes</li>
                    <li>Classificacao e pontuacao IA</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dados de Pagamento</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Dados de faturacao processados pelo Stripe</li>
                    <li>Historico de subscricoes</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dados Tecnicos</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Endereco IP</li>
                    <li>Tipo de navegador e dispositivo</li>
                    <li>Cookies de sessao essenciais</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dados de Seguranca (Logs)</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Timestamps de tentativas de autenticacao</li>
                    <li>Endereco IP e user-agent para detecao de abusos</li>
                    <li>Padroes de pedidos suspeitos (sem dados pessoais)</li>
                    <li>Retencao: 90 dias</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                3. Medidas Tecnicas de Seguranca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Implementamos medidas tecnicas robustas para proteger os seus dados:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Encriptacao de passwords com bcrypt e salt</li>
                <li>Sanitizacao de todos os inputs com sanitize-html e DOMPurify</li>
                <li>Validacao de formularios com express-validator</li>
                <li>Cabecalhos de seguranca HTTP (HSTS, CSP, X-Frame-Options)</li>
                <li>Rate limiting para prevenir ataques de forca bruta</li>
                <li>Logging estruturado com Winston para auditoria</li>
                <li>Protecao contra XSS, SQL Injection e CSRF</li>
              </ul>
              <p className="text-sm">
                Para mais detalhes, consulte a nossa{" "}
                <a href="/seguranca" className="text-primary hover:underline">
                  Documentacao de Seguranca
                </a>.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                4. Finalidades e Bases Legais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-semibold">Finalidade</th>
                      <th className="text-left py-3 px-2 font-semibold">Base Legal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-3 px-2">Criacao e gestao de conta</td>
                      <td className="py-3 px-2 text-muted-foreground">Execucao de contrato</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2">Prestacao dos servicos de gestao de leads</td>
                      <td className="py-3 px-2 text-muted-foreground">Execucao de contrato</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2">Analise de leads com Inteligencia Artificial</td>
                      <td className="py-3 px-2 text-muted-foreground">Interesse legitimo / Consentimento</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2">Processamento de pagamentos</td>
                      <td className="py-3 px-2 text-muted-foreground">Execucao de contrato</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2">Envio de comunicacoes de servico</td>
                      <td className="py-3 px-2 text-muted-foreground">Interesse legitimo</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2">Cumprimento de obrigacoes legais</td>
                      <td className="py-3 px-2 text-muted-foreground">Obrigacao legal</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                4. Partilha de Dados e Subprocessadores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Os seus dados podem ser partilhados com os seguintes subprocessadores 
                para prestacao dos nossos servicos:
              </p>
              
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold">OpenAI (Estados Unidos)</h4>
                  <p className="text-sm text-muted-foreground">
                    Processamento de analise de leads com IA. Transferencia internacional 
                    protegida por Clausulas Contratuais Tipo (SCC).
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold">Stripe (Estados Unidos/UE)</h4>
                  <p className="text-sm text-muted-foreground">
                    Processamento de pagamentos. Certificado PCI-DSS. 
                    Dados de cartao nunca armazenados nos nossos servidores.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold">Casafari API (Portugal)</h4>
                  <p className="text-sm text-muted-foreground">
                    Integracao para prospeccao de imoveis.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold">WhatsApp Business (Meta)</h4>
                  <p className="text-sm text-muted-foreground">
                    Envio de mensagens automatizadas para leads.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                5. Retencao de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Os seus dados sao conservados durante os seguintes periodos:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">-</span>
                  <span><strong>Dados de conta:</strong> Ate ao pedido de eliminacao ou 2 anos apos inatividade</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">-</span>
                  <span><strong>Dados de leads:</strong> Durante a vigencia do contrato e ate 1 ano apos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">-</span>
                  <span><strong>Dados de faturacao:</strong> 10 anos (obrigacao fiscal portuguesa)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">-</span>
                  <span><strong>Logs tecnicos:</strong> 90 dias</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                6. Os Seus Direitos RGPD
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Nos termos do RGPD, tem os seguintes direitos:</p>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold text-sm">Direito de Acesso</h4>
                  <p className="text-xs text-muted-foreground">
                    Obter confirmacao e copia dos seus dados
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold text-sm">Direito de Retificacao</h4>
                  <p className="text-xs text-muted-foreground">
                    Corrigir dados inexatos ou incompletos
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold text-sm">Direito ao Apagamento</h4>
                  <p className="text-xs text-muted-foreground">
                    Solicitar a eliminacao dos seus dados
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold text-sm">Direito a Portabilidade</h4>
                  <p className="text-xs text-muted-foreground">
                    Receber os seus dados em formato estruturado
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold text-sm">Direito de Oposicao</h4>
                  <p className="text-xs text-muted-foreground">
                    Opor-se ao tratamento para marketing
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold text-sm">Direito a Limitacao</h4>
                  <p className="text-xs text-muted-foreground">
                    Restringir o tratamento em certas situacoes
                  </p>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                <h4 className="font-semibold mb-2">Como Exercer os Seus Direitos</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Envie um email para <strong>geralimolead@outlook.pt</strong> com:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>Identificacao do direito que pretende exercer</li>
                  <li>Nome completo e email da conta</li>
                  <li>Copia de documento de identificacao</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  Responderemos no prazo maximo de 30 dias.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                7. Seguranca dos Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Implementamos medidas tecnicas e organizativas para proteger os seus dados:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-primary mt-0.5" />
                  <span>Encriptacao de palavras-passe com bcrypt</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-primary mt-0.5" />
                  <span>Comunicacoes protegidas por TLS/HTTPS</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-primary mt-0.5" />
                  <span>Tokens de autenticacao com expiracao de 24 horas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-primary mt-0.5" />
                  <span>Base de dados PostgreSQL com backups regulares</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-primary mt-0.5" />
                  <span>Acesso restrito por principio do minimo privilegio</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Para mais detalhes, consulte a nossa <Link href="/seguranca" className="text-primary hover:underline">Documentacao de Seguranca</Link>.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                8. Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Utilizamos apenas <strong>cookies essenciais</strong> para o funcionamento da plataforma:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">-</span>
                  <span><strong>Cookie de sessao:</strong> Manter a sua sessao autenticada</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">-</span>
                  <span><strong>Preferencias:</strong> Guardar preferencias de tema (claro/escuro)</span>
                </li>
              </ul>
              <p className="text-sm">
                Nao utilizamos cookies de tracking, analytics ou publicidade.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                9. Contactos e Reclamacoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold">Encarregado de Protecao de Dados (DPO)</h4>
                  <p className="text-muted-foreground">
                    Email: geralimolead@outlook.pt
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold">Autoridade de Controlo</h4>
                  <p className="text-muted-foreground">
                    Tem o direito de apresentar reclamacao junto da Comissao Nacional 
                    de Protecao de Dados (CNPD):
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Website: <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cnpd.pt</a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground py-8">
            <p>
              Esta politica pode ser atualizada periodicamente. 
              A data da ultima atualizacao esta indicada no topo desta pagina.
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Link href="/termos" className="text-primary hover:underline">
                Termos de Servico
              </Link>
              <Link href="/seguranca" className="text-primary hover:underline">
                Documentacao de Seguranca
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
