import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Lock, 
  Database, 
  Key, 
  Server, 
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Mail
} from "lucide-react";
import { Link } from "wouter";

export default function Seguranca() {
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
            <h1 className="text-3xl font-bold mb-2">Documentacao de Seguranca</h1>
            <p className="text-muted-foreground">
              Medidas tecnicas e organizativas para protecao dos seus dados
            </p>
            <Badge variant="outline" className="mt-2">
              Ultima atualizacao: Janeiro 2025
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Visao Geral de Seguranca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                A ImoLead AI Pro implementa multiplas camadas de seguranca para 
                proteger os dados dos nossos utilizadores e dos seus leads. 
                Este documento descreve as principais medidas tecnicas e 
                organizativas em vigor.
              </p>
              
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="border rounded-lg p-4 text-center">
                  <Lock className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-semibold text-sm">Encriptacao</h4>
                  <p className="text-xs text-muted-foreground">Em transito e em repouso</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <Key className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-semibold text-sm">Autenticacao</h4>
                  <p className="text-xs text-muted-foreground">Tokens seguros</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-semibold text-sm">Backups</h4>
                  <p className="text-xs text-muted-foreground">Automaticos e regulares</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Encriptacao de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Dados em Transito</h4>
                <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-4">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">TLS 1.3</p>
                    <p className="text-sm text-muted-foreground">
                      Todas as comunicacoes entre o navegador e os nossos servidores 
                      sao encriptadas usando TLS 1.3, o protocolo mais recente e seguro.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Palavras-passe</h4>
                <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-4">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">bcrypt com salt</p>
                    <p className="text-sm text-muted-foreground">
                      As palavras-passe sao armazenadas usando o algoritmo bcrypt 
                      com um custo computacional elevado. Nunca armazenamos 
                      palavras-passe em texto simples.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Base de Dados</h4>
                <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-4">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">PostgreSQL com SSL</p>
                    <p className="text-sm text-muted-foreground">
                      A ligacao a base de dados e encriptada. O servidor de base 
                      de dados esta isolado e acessivel apenas pela aplicacao.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Autenticacao e Controlo de Acesso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Tokens de Sessao</p>
                    <p className="text-sm text-muted-foreground">
                      Tokens de autenticacao com expiracao automatica de 24 horas. 
                      Renovacao automatica durante o uso ativo.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Principio do Minimo Privilegio</p>
                    <p className="text-sm text-muted-foreground">
                      Cada utilizador so tem acesso aos seus proprios dados. 
                      Funcoes administrativas requerem autenticacao separada.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Cookies Seguros</p>
                    <p className="text-sm text-muted-foreground">
                      Cookies marcados como HttpOnly e Secure, protegidos 
                      contra ataques XSS e transmissao insegura.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Prevencao de Timing Attacks</p>
                    <p className="text-sm text-muted-foreground">
                      Autenticacao com tempo constante usando bcrypt.compare 
                      em todos os cenarios, impedindo enumeracao de utilizadores.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Infraestrutura e Rede
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Alojamento na Cloud</p>
                    <p className="text-sm text-muted-foreground">
                      Infraestrutura alojada em datacenters certificados com 
                      seguranca fisica, controlo de acesso e monitorizacao 24/7.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Isolamento de Rede</p>
                    <p className="text-sm text-muted-foreground">
                      Servidores de base de dados isolados em redes privadas, 
                      inacessiveis diretamente a partir da internet.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">HTTPS Obrigatorio</p>
                    <p className="text-sm text-muted-foreground">
                      Todo o trafego HTTP e automaticamente redirecionado para HTTPS. 
                      Certificados SSL/TLS validos e renovados automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Cabecalhos de Seguranca HTTP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Implementamos cabecalhos de seguranca HTTP para proteger contra 
                ataques comuns na web:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Strict-Transport-Security (HSTS)</p>
                    <p className="text-sm text-muted-foreground">
                      Forca ligacoes HTTPS com preload e includeSubDomains. 
                      Validade de 1 ano (31536000 segundos).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Content-Security-Policy (CSP)</p>
                    <p className="text-sm text-muted-foreground">
                      Politica restritiva que limita fontes de scripts, estilos 
                      e conexoes a origens autorizadas, prevenindo ataques XSS.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">X-Frame-Options</p>
                    <p className="text-sm text-muted-foreground">
                      Definido como SAMEORIGIN para prevenir ataques de clickjacking 
                      atraves de iframes maliciosos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Permissions-Policy</p>
                    <p className="text-sm text-muted-foreground">
                      Restringe mais de 30 funcionalidades do navegador incluindo 
                      camera, microfone, geolocalizacao, USB e sensor.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Cross-Origin Policies</p>
                    <p className="text-sm text-muted-foreground">
                      COOP e CORP definidos como same-origin para isolamento 
                      completo de recursos entre origens.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Protecao contra XSS e Injecao
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Implementamos multiplas camadas de protecao contra ataques 
                de Cross-Site Scripting (XSS) e injecao de codigo:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Sanitizacao Global de Inputs</p>
                    <p className="text-sm text-muted-foreground">
                      Todos os dados recebidos pelo servidor sao sanitizados 
                      com sanitize-html, removendo qualquer tag HTML maliciosa.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Validacao com express-validator</p>
                    <p className="text-sm text-muted-foreground">
                      Formularios criticos (registo, login, leads) sao validados 
                      com escape() que converte caracteres especiais em entidades HTML.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">DOMPurify no Frontend</p>
                    <p className="text-sm text-muted-foreground">
                      Todo o conteudo dinamico exibido na interface e sanitizado 
                      com DOMPurify antes de ser renderizado.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Protecao SQL Injection</p>
                    <p className="text-sm text-muted-foreground">
                      Utilizamos Drizzle ORM com queries parametrizadas, 
                      eliminando o risco de injecao SQL.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Rate Limiting e Anti-Abuso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Implementamos limites de taxa para prevenir ataques de forca 
                bruta e abuso dos servicos:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-sm">Autenticacao</h4>
                  <p className="text-2xl font-bold text-primary">5</p>
                  <p className="text-xs text-muted-foreground">
                    tentativas por 15 minutos (login/registo)
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-sm">API Geral</h4>
                  <p className="text-2xl font-bold text-primary">100</p>
                  <p className="text-xs text-muted-foreground">
                    pedidos por minuto por utilizador
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Apos exceder os limites, os pedidos sao temporariamente 
                bloqueados para proteger a plataforma e outros utilizadores.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup e Recuperacao
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <RefreshCw className="h-6 w-6 mb-2 text-primary" />
                  <h4 className="font-semibold text-sm">Backups Automaticos</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Backups diarios da base de dados com retencao de 30 dias
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <Database className="h-6 w-6 mb-2 text-primary" />
                  <h4 className="font-semibold text-sm">Point-in-Time Recovery</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Capacidade de restaurar para qualquer momento nos ultimos 7 dias
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Os backups sao armazenados de forma encriptada em localizacoes 
                geograficamente separadas para garantir resiliencia.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Monitorizacao e Logging
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Logging Estruturado (Winston)</p>
                    <p className="text-sm text-muted-foreground">
                      Sistema de logging profissional com Winston para registo 
                      de eventos de seguranca com timestamp, IP e user-agent.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Detecao de Padroes Suspeitos</p>
                    <p className="text-sm text-muted-foreground">
                      Monitorizacao automatica de padroes de ataque incluindo 
                      XSS, SQL Injection e path traversal.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Minimizacao de Dados</p>
                    <p className="text-sm text-muted-foreground">
                      Os logs nao contem dados pessoais sensiveis como 
                      passwords. Retencao limitada a 90 dias.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Alertas de Seguranca</p>
                    <p className="text-sm text-muted-foreground">
                      Sistema de alertas para detetar atividades suspeitas 
                      ou tentativas de acesso nao autorizado.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Gestao de Segredos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                As chaves de API e credenciais sensiveis sao geridas de forma segura:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Variaveis de Ambiente</p>
                    <p className="text-sm text-muted-foreground">
                      Segredos armazenados em variaveis de ambiente encriptadas, 
                      nunca em codigo fonte.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Rotacao de Chaves</p>
                    <p className="text-sm text-muted-foreground">
                      Politica de rotacao periodica de chaves de API e tokens de sessao.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Stripe PCI-DSS</p>
                    <p className="text-sm text-muted-foreground">
                      Dados de cartao processados exclusivamente pelo Stripe, 
                      certificado PCI-DSS Nivel 1.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Resposta a Incidentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Temos procedimentos definidos para resposta a incidentes de seguranca:
              </p>
              
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">1</Badge>
                  <span className="font-medium">Detecao e Triagem</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">2</Badge>
                  <span className="font-medium">Contencao e Erradicacao</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">3</Badge>
                  <span className="font-medium">Recuperacao</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">4</Badge>
                  <span className="font-medium">Notificacao (se aplicavel RGPD)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">5</Badge>
                  <span className="font-medium">Analise Pos-Incidente</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Em caso de violacao de dados, notificaremos a CNPD e os utilizadores 
                afetados no prazo legal de 72 horas.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Reportar Vulnerabilidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Se descobrir uma vulnerabilidade de seguranca, agradecemos que 
                nos reporte de forma responsavel:
              </p>
              
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Contacto de Seguranca</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Email: <strong>geralimolead@outlook.pt</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Comprometemo-nos a:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-2">
                  <li>Responder no prazo de 48 horas</li>
                  <li>Mante-lo informado sobre o progresso</li>
                  <li>Nao tomar acoes legais contra investigadores de boa-fe</li>
                  <li>Reconhecer a sua contribuicao (se desejar)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground py-8">
            <p>
              A seguranca e um processo continuo. Revemos e atualizamos 
              regularmente as nossas praticas.
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Link href="/privacidade" className="text-primary hover:underline">
                Politica de Privacidade
              </Link>
              <Link href="/termos" className="text-primary hover:underline">
                Termos de Servico
              </Link>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="py-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 px-4">
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-block bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
                  <h3 className="text-xl font-bold text-primary mb-2">SHALON SOLUÇÕES TECNOLÓGICAS</h3>
                  <p className="text-sm text-muted-foreground">A nossa empresa de tecnologia</p>
                  <Badge variant="outline" className="mt-3">SST</Badge>
                </div>
              </div>
              
              <div className="flex-1 text-center sm:text-right">
                <div className="inline-block bg-gradient-to-l from-amber-500/10 to-amber-500/5 rounded-xl p-6 border border-amber-500/20">
                  <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-2">Deus seja louvado!</h3>
                  <p className="text-sm text-muted-foreground">O nosso guia e base deste projeto</p>
                  <Badge variant="outline" className="mt-3 border-amber-500/30 text-amber-600 dark:text-amber-400">Fé</Badge>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8 text-xs text-muted-foreground">
              <p>Construído com dedicação e propósito pela equipa SST</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
