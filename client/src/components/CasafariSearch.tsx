import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Home, Euro, Bed, Square, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CasafariProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  pricePerSqm: number;
  propertyType: string;
  transactionType: "sale" | "rent";
  location: {
    address: string;
    city: string;
    district: string;
    postalCode: string;
  };
  features: {
    bedrooms: number;
    bathrooms: number;
    area: number;
    floor?: number;
    hasParking: boolean;
    hasGarden: boolean;
    hasPool: boolean;
    hasElevator: boolean;
    energyCertificate?: string;
  };
  source: string;
  sourceUrl: string;
  sellerContact?: {
    name?: string;
    phone?: string;
    type: "private" | "agency";
  };
}

interface SearchResult {
  properties: CasafariProperty[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export function CasafariSearch() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    location: "",
    propertyType: "",
    transactionType: "sale" as "sale" | "rent",
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
  });
  const [hasSearched, setHasSearched] = useState(false);

  const buildQueryUrl = () => {
    const params = new URLSearchParams();
    if (searchParams.location) params.append("location", searchParams.location);
    if (searchParams.propertyType && searchParams.propertyType !== "all") {
      params.append("propertyType", searchParams.propertyType);
    }
    if (searchParams.transactionType) params.append("transactionType", searchParams.transactionType);
    if (searchParams.minPrice) params.append("minPrice", searchParams.minPrice);
    if (searchParams.maxPrice) params.append("maxPrice", searchParams.maxPrice);
    if (searchParams.bedrooms && searchParams.bedrooms !== "any") {
      params.append("bedrooms", searchParams.bedrooms);
    }
    params.append("limit", "12");
    return `/api/casafari/search?${params.toString()}`;
  };

  const queryUrl = buildQueryUrl();

  const { data: searchResult, isLoading, refetch } = useQuery<SearchResult>({
    queryKey: [queryUrl],
    enabled: hasSearched,
  });

  const importMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      return apiRequest("POST", `/api/casafari/import/${propertyId}`);
    },
    onSuccess: () => {
      toast({
        title: "Lead Importado",
        description: "O imóvel foi convertido em lead e classificado pela IA.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível importar o imóvel.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    refetch();
  };

  const formatPrice = (price: number, type: "sale" | "rent") => {
    if (type === "rent") {
      return `${price.toLocaleString("pt-PT")}€/mês`;
    }
    return `${price.toLocaleString("pt-PT")}€`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pesquisa Casafari
          </CardTitle>
          <CardDescription>
            Pesquise imóveis em Portugal e importe-os como leads para o seu CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                placeholder="Lisboa, Porto, Cascais..."
                value={searchParams.location}
                onChange={(e) => setSearchParams((p) => ({ ...p, location: e.target.value }))}
                data-testid="input-casafari-location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyType">Tipo de Imóvel</Label>
              <Select
                value={searchParams.propertyType}
                onValueChange={(value) => setSearchParams((p) => ({ ...p, propertyType: value }))}
              >
                <SelectTrigger id="propertyType" data-testid="select-casafari-type">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="Apartamento">Apartamento</SelectItem>
                  <SelectItem value="Moradia">Moradia</SelectItem>
                  <SelectItem value="Terreno">Terreno</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionType">Tipo de Transação</Label>
              <Select
                value={searchParams.transactionType}
                onValueChange={(value) => setSearchParams((p) => ({ ...p, transactionType: value as "sale" | "rent" }))}
              >
                <SelectTrigger id="transactionType" data-testid="select-casafari-transaction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Venda</SelectItem>
                  <SelectItem value="rent">Arrendamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minPrice">Preço Mínimo</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="0"
                value={searchParams.minPrice}
                onChange={(e) => setSearchParams((p) => ({ ...p, minPrice: e.target.value }))}
                data-testid="input-casafari-min-price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPrice">Preço Máximo</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="Sem limite"
                value={searchParams.maxPrice}
                onChange={(e) => setSearchParams((p) => ({ ...p, maxPrice: e.target.value }))}
                data-testid="input-casafari-max-price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedrooms">Quartos (mín.)</Label>
              <Select
                value={searchParams.bedrooms}
                onValueChange={(value) => setSearchParams((p) => ({ ...p, bedrooms: value }))}
              >
                <SelectTrigger id="bedrooms" data-testid="select-casafari-bedrooms">
                  <SelectValue placeholder="Qualquer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  <SelectItem value="1">T1+</SelectItem>
                  <SelectItem value="2">T2+</SelectItem>
                  <SelectItem value="3">T3+</SelectItem>
                  <SelectItem value="4">T4+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-3 flex justify-end">
              <Button type="submit" disabled={isLoading} data-testid="button-casafari-search">
                <Search className="h-4 w-4 mr-2" />
                Pesquisar Imóveis
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchResult && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {searchResult.total} imóveis encontrados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResult.properties.map((property) => (
              <Card key={property.id} className="hover-elevate" data-testid={`card-property-${property.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-2">{property.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {property.location.city}, {property.location.district}
                      </CardDescription>
                    </div>
                    <Badge variant={property.transactionType === "sale" ? "default" : "secondary"}>
                      {property.transactionType === "sale" ? "Venda" : "Arrend."}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-1 text-lg font-bold text-primary">
                    <Euro className="h-4 w-4" />
                    {formatPrice(property.price, property.transactionType)}
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      {property.propertyType}
                    </div>
                    {property.features.bedrooms > 0 && (
                      <div className="flex items-center gap-1">
                        <Bed className="h-3 w-3" />
                        T{property.features.bedrooms}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Square className="h-3 w-3" />
                      {property.features.area}m²
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {property.description}
                  </p>

                  {property.sellerContact && (
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      <span className="font-medium">Contacto:</span>{" "}
                      {property.sellerContact.name || "Proprietário"}{" "}
                      <Badge variant="outline" className="ml-1">
                        {property.sellerContact.type === "private" ? "Particular" : "Agência"}
                      </Badge>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => importMutation.mutate(property.id)}
                    disabled={importMutation.isPending}
                    data-testid={`button-import-${property.id}`}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Importar Lead
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={property.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {searchResult.properties.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum imóvel encontrado</h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros de pesquisa para encontrar mais resultados.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!hasSearched && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Pesquise imóveis em Portugal</h3>
            <p className="text-muted-foreground">
              Use os filtros acima para encontrar imóveis da base de dados Casafari e importá-los como leads.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
