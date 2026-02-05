import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, FileSpreadsheet, Wand2, Download } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    if (Object.values(row).some(v => v)) {
      rows.push(row);
    }
  }
  
  return rows;
}

export function ImportLeadsDialog() {
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [demoLocation, setDemoLocation] = useState("Lisboa");
  const [demoPropertyType, setDemoPropertyType] = useState("Apartamento");
  const [demoCount, setDemoCount] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (leads: Record<string, string>[]) => {
      const response = await apiRequest("POST", "/api/leads/import-csv", { leads });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Importação Concluída",
        description: data.message,
      });
      setCsvText("");
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Importação",
        description: error.message || "Não foi possível importar os leads.",
        variant: "destructive",
      });
    },
  });

  const generateDemoMutation = useMutation({
    mutationFn: async (params: { count: number; location: string; propertyType: string }) => {
      const response = await apiRequest("POST", "/api/leads/generate-demo", params);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Leads de Demonstração Criados",
        description: data.message,
      });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar leads de demonstração.",
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    const leads = parseCSV(csvText);
    if (leads.length === 0) {
      toast({
        title: "CSV Inválido",
        description: "Não foram encontrados leads válidos no CSV. Verifique o formato.",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate(leads);
  };

  const handleGenerateDemo = () => {
    generateDemoMutation.mutate({
      count: demoCount,
      location: demoLocation,
      propertyType: demoPropertyType,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const sampleCSV = `name,contact,email,property,propertyType,location,price,source
João Silva,912345678,joao@email.com,T2 Renovado,Apartamento,Lisboa,250000,Manual
Maria Santos,923456789,maria@email.com,Moradia com Jardim,Moradia,Porto,450000,Manual
Pedro Costa,934567890,,Terreno 500m2,Terreno,Cascais,180000,Manual`;
    
    const blob = new Blob([sampleCSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exemplo_leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-import-leads">
          <Upload className="h-4 w-4 mr-2" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Leads</DialogTitle>
          <DialogDescription>
            Importe leads através de CSV ou gere leads de demonstração para testar a plataforma.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="csv" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Importar CSV
            </TabsTrigger>
            <TabsTrigger value="demo" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Gerar Demonstração
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="csv" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Carregar Ficheiro CSV</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                data-testid="input-csv-file"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ou cole o conteúdo CSV</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadSampleCSV}
                  className="text-xs"
                  data-testid="button-download-sample"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Descarregar Exemplo
                </Button>
              </div>
              <Textarea
                placeholder="name,contact,email,property,propertyType,location,price,source&#10;João Silva,912345678,joao@email.com,T2 Renovado,Apartamento,Lisboa,250000,Manual"
                className="min-h-[150px] font-mono text-sm"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                data-testid="textarea-csv"
              />
            </div>
            
            <p className="text-xs text-muted-foreground">
              Colunas aceites: name/nome, contact/contacto/telefone, email, property/imovel, 
              propertyType/tipo, location/localizacao/cidade, price/preco/valor, source/origem
            </p>
            
            <DialogFooter>
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending || !csvText.trim()}
                data-testid="button-import-csv"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    A importar...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Leads
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
          
          <TabsContent value="demo" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Gere leads de demonstração realistas para testar a plataforma. 
              Cada lead será analisado pela IA automaticamente.
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Select
                  value={demoCount.toString()}
                  onValueChange={(v) => setDemoCount(parseInt(v))}
                >
                  <SelectTrigger data-testid="select-demo-count">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 leads</SelectItem>
                    <SelectItem value="10">10 leads</SelectItem>
                    <SelectItem value="15">15 leads</SelectItem>
                    <SelectItem value="20">20 leads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Localização</Label>
                <Select value={demoLocation} onValueChange={setDemoLocation}>
                  <SelectTrigger data-testid="select-demo-location">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lisboa">Lisboa</SelectItem>
                    <SelectItem value="Porto">Porto</SelectItem>
                    <SelectItem value="Cascais">Cascais</SelectItem>
                    <SelectItem value="Sintra">Sintra</SelectItem>
                    <SelectItem value="Faro">Faro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tipo de Imóvel</Label>
                <Select value={demoPropertyType} onValueChange={setDemoPropertyType}>
                  <SelectTrigger data-testid="select-demo-property-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartamento">Apartamento</SelectItem>
                    <SelectItem value="Moradia">Moradia</SelectItem>
                    <SelectItem value="Terreno">Terreno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                onClick={handleGenerateDemo}
                disabled={generateDemoMutation.isPending}
                data-testid="button-generate-demo"
              >
                {generateDemoMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    A gerar...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Gerar {demoCount} Leads Demo
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
