import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, CreditCard, Users, Shield, AlertTriangle, Scale, Mail } from "lucide-react";
import { Link } from "wouter";

export default function Termos() {
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
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Termos de Servico</h1>
            <p className="text-muted-foreground">
              Condicoes gerais de utilizacao da plataforma ImoLead AI Pro
            </p>
            <Badge variant="outline" className="mt-2">
              Ultima atualizacao: Janeiro 2025
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                1. Aceitacao dos Termos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Ao aceder e utilizar a plataforma ImoLead AI Pro, o utilizador aceita 
                ficar vinculado aos presentes Termos de Servico. Se nao concordar com 
                alguma parte destes termos, nao devera utilizar os nossos servicos.
              </p>
              <p>
                Estes termos aplicam-se a todos os visitantes, utilizadores e outras 
                pessoas que acedam ou utilizem o servico.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                2. Elegibilidade e Registo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">2.1 Requisitos</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Ter pelo menos 18 anos de idade</li>
                  <li>Possuir capacidade juridica para celebrar contratos</li>
                  <li>Ser profissional do setor imobiliario ou representar uma empresa do setor</li>
                  <li>Fornecer informacoes verdadeiras e atualizadas</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">2.2 Conta de Utilizador</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>E responsavel por manter a confidencialidade da sua palavra-passe</li>
                  <li>Deve notificar-nos imediatamente sobre qualquer uso nao autorizado</li>
                  <li>E responsavel por todas as atividades realizadas na sua conta</li>
                  <li>Nao pode partilhar as credenciais de acesso com terceiros</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                3. Planos e Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">3.1 Periodo de Teste Gratuito</h4>
                <p className="text-muted-foreground">
                  Oferecemos um periodo de teste gratuito de 7 dias para novos utilizadores. 
                  Durante este periodo, tera acesso a todas as funcionalidades do plano escolhido. 
                  Nao e necessario cartao de credito para iniciar o teste.
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">3.2 Planos Disponiveis</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="border rounded-lg p-4">
                    <h5 className="font-semibold">Plano Basic</h5>
                    <p className="text-2xl font-bold">67 EUR<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                    <p className="text-sm text-muted-foreground">100+ leads/mes, pesquisa automatica</p>
                  </div>
                  <div className="border rounded-lg p-4 border-primary">
                    <h5 className="font-semibold">Plano Pro</h5>
                    <p className="text-2xl font-bold">167 EUR<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                    <p className="text-sm text-muted-foreground">Leads ilimitados, marcacao IA</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-primary/5">
                    <h5 className="font-semibold">Plano Custom</h5>
                    <p className="text-2xl font-bold">397-697 EUR<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                    <p className="text-sm text-muted-foreground">Enterprise, gestor dedicado, 24/7</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">3.3 Faturacao</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Os pagamentos sao processados atraves do Stripe</li>
                  <li>A faturacao e mensal ou anual, conforme o plano escolhido</li>
                  <li>Os precos incluem IVA a taxa legal em vigor</li>
                  <li>Aceitamos cartoes de credito/debito e MBWay</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">3.4 Cancelamento e Reembolsos</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Pode cancelar a sua subscricao a qualquer momento</li>
                  <li>O acesso mantem-se ate ao final do periodo ja pago</li>
                  <li>Nao ha reembolsos por periodos parciais nao utilizados</li>
                  <li>Em caso de insatisfacao nos primeiros 14 dias, contacte-nos para analise</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                4. Uso Aceitavel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">4.1 Obrigacoes do Utilizador</h4>
                <p className="text-muted-foreground mb-2">
                  O utilizador compromete-se a:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Utilizar a plataforma apenas para fins legitimos e profissionais</li>
                  <li>Respeitar a legislacao aplicavel, incluindo o RGPD</li>
                  <li>Obter consentimento adequado dos leads antes de os contactar</li>
                  <li>Nao enviar spam ou comunicacoes nao solicitadas em massa</li>
                  <li>Manter a seguranca e confidencialidade dos dados dos leads</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">4.2 Condutas Proibidas</h4>
                <p className="text-muted-foreground mb-2">
                  E expressamente proibido:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Tentar aceder a contas ou dados de outros utilizadores</li>
                  <li>Fazer engenharia reversa ou descompilar o software</li>
                  <li>Utilizar bots ou scripts automatizados nao autorizados</li>
                  <li>Sobrecarregar intencionalmente os nossos servidores</li>
                  <li>Revender ou sublicenciar o acesso a plataforma</li>
                  <li>Utilizar a plataforma para atividades ilegais</li>
                  <li>Tentar injetar codigo malicioso (XSS, SQL Injection)</li>
                  <li>Exceder os limites de taxa de pedidos estabelecidos</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">4.3 Rate Limiting e Protecao Anti-Abuso</h4>
                <p className="text-muted-foreground mb-2">
                  Para garantir a estabilidade e seguranca da plataforma, aplicamos os seguintes limites:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="border rounded-lg p-3">
                    <p className="font-medium text-sm">Autenticacao</p>
                    <p className="text-xs text-muted-foreground">5 tentativas por 15 minutos</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="font-medium text-sm">API Geral</p>
                    <p className="text-xs text-muted-foreground">100 pedidos por minuto</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Todos os inputs sao sanitizados automaticamente. Tentativas de injecao de 
                  codigo ou padroes suspeitos sao registados e podem resultar em suspensao da conta.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                5. Propriedade Intelectual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">5.1 Direitos da ImoLead AI Pro</h4>
                <p className="text-muted-foreground">
                  A plataforma, incluindo o seu design, logotipos, codigo-fonte, algoritmos 
                  de IA e conteudos originais, sao propriedade exclusiva da ImoLead AI Pro 
                  e estao protegidos por direitos de autor e propriedade industrial.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">5.2 Licenca de Uso</h4>
                <p className="text-muted-foreground">
                  Concedemos-lhe uma licenca limitada, nao exclusiva, nao transferivel e 
                  revogavel para utilizar a plataforma de acordo com estes termos, durante 
                  a vigencia da sua subscricao.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">5.3 Os Seus Dados</h4>
                <p className="text-muted-foreground">
                  O utilizador mantem todos os direitos sobre os dados que introduz na 
                  plataforma. Concede-nos licenca para processar esses dados conforme 
                  necessario para prestar os servicos.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                6. Limitacoes e Exclusoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">6.1 Disponibilidade do Servico</h4>
                <p className="text-muted-foreground">
                  Esforcarmo-nos para manter o servico disponivel 24/7, mas nao garantimos 
                  disponibilidade ininterrupta. Podem ocorrer interrupcoes para manutencao, 
                  atualizacoes ou por motivos de forca maior.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">6.2 Analise de IA</h4>
                <p className="text-muted-foreground">
                  As classificacoes e pontuacoes geradas pela IA sao indicativas e 
                  baseiam-se em padroes estatisticos. Nao garantimos a precisao das 
                  previsoes e o utilizador deve usar o seu proprio julgamento profissional.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">6.3 Limitacao de Responsabilidade</h4>
                <p className="text-muted-foreground">
                  Na maxima extensao permitida por lei, a ImoLead AI Pro nao sera 
                  responsavel por danos indiretos, incidentais, especiais ou consequenciais, 
                  incluindo perda de lucros, dados ou oportunidades de negocio.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Limite Maximo:</strong> A nossa responsabilidade total esta 
                  limitada ao valor pago pelo utilizador nos 12 meses anteriores ao evento 
                  que originou a reclamacao.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                7. Lei Aplicavel e Foro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Estes Termos de Servico sao regidos pela lei portuguesa. 
                Para resolucao de quaisquer litigios emergentes destes termos, 
                as partes elegem o foro da comarca de Lisboa, com renuncia expressa 
                a qualquer outro.
              </p>
              <p className="text-muted-foreground">
                Antes de recorrer aos tribunais, encorajamos a resolucao amigavel 
                de conflitos atraves do nosso servico de apoio ao cliente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                8. Alteracoes aos Termos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                As alteracoes serao comunicadas atraves de:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Email para o endereco registado na conta</li>
                <li>Aviso na plataforma antes do inicio de sessao</li>
                <li>Atualizacao da data de revisao neste documento</li>
              </ul>
              <p className="text-muted-foreground">
                A continuacao do uso da plataforma apos a notificacao constitui 
                aceitacao das novas condicoes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                9. Contactos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Para questoes sobre estes Termos de Servico, contacte-nos atraves de:
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <strong>Email:</strong> geralimolead@outlook.pt
                </p>
                <p className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <strong>Assuntos Legais:</strong> geralimolead@outlook.pt
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground py-8">
            <p>
              Ao utilizar a ImoLead AI Pro, declara ter lido e aceite estes Termos de Servico.
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Link href="/privacidade" className="text-primary hover:underline">
                Politica de Privacidade
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
