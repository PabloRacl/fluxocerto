// components/pdf/RelatorioPDF.tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Registrar fonte com suporte a acentos
Font.register({
  family: "Helvetica",
  src: "https://fonts.gstatic.com/s/helvetica/v12/q9wLtH8B3X8Y5Z8Y5Z8Y5Z8.woff2",
});

// Estilos PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    fontSize: 18,
    marginBottom: 20,
    color: "#047857",
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 15,
    color: "#64748b",
    textAlign: "center",
  },
  table: {
    marginTop: 10,
    display: "table" as any,
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableHeader: {
    backgroundColor: "#f1f5f9",
    fontWeight: "bold",
    padding: 8,
    fontSize: 9,
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    flex: 1,
  },
  totalRow: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#047857",
  },
  totalText: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
  },
});

// Funções auxiliares
function formatarData(data: Date | string): string {
  const date = typeof data === "string" ? new Date(data) : data;
  return format(date, "dd/MM/yyyy");
}

function formatarMoeda(valorEmCentavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorEmCentavos / 100);
}

function formatarTipo(tipo: string): string {
  return tipo === "INCOME" ? "Receita" : "Despesa";
}

// Interface do componente
interface RelatorioPDFProps {
  dados: any[];
  periodo: string;
  filtros: {
    tipo?: string;
    conta?: string;
    categoria?: string;
  };
  saude?: any;
  patrimonio?: any;
}

// Componente PDF
export function RelatorioPDF({ dados, periodo, filtros, saude, patrimonio }: RelatorioPDFProps) {
  const totalReceitas = dados
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDespesas = dados
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const saldo = totalReceitas - totalDespesas;

  const scoreColor = saude?.score >= 80 ? "#059669" : saude?.score >= 50 ? "#d97706" : "#dc2626";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <Text style={styles.header}>FluxoCerto - Relatório Financeiro</Text>
        <Text style={styles.subtitle}>Período: {periodo}</Text>

        {/* Filtros aplicados */}
        {(filtros.tipo || filtros.conta || filtros.categoria) && (
          <View
            style={{
              marginBottom: 10,
              padding: 8,
              backgroundColor: "#f8fafc",
              borderRadius: 4,
            }}
          >
            <Text style={{ fontSize: 8, color: "#64748b" }}>
              {filtros.tipo && `• Tipo: ${formatarTipo(filtros.tipo)} `}
              {filtros.conta && `• Conta: ${filtros.conta} `}
              {filtros.categoria && `• Categoria: ${filtros.categoria}`}
            </Text>
          </View>
        )}

        {/* --- P8 DIAGNÓSTICO FINANCEIRO --- */}
        <View style={{ marginBottom: 20, flexDirection: 'row', gap: 10 }}>
          {/* Coluna Saúde */}
          <View style={{ flex: 1, padding: 10, backgroundColor: "#f8fafc", borderRadius: 8, borderLeftWidth: 4, borderLeftColor: scoreColor }}>
            <Text style={{ fontSize: 8, color: "#64748b", marginBottom: 2 }}>SAÚDE FINANCEIRA</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: scoreColor }}>{saude?.score || 0}/100</Text>
            <Text style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>Status: {saude?.status || 'N/A'}</Text>
          </View>

          {/* Coluna Patrimônio */}
          <View style={{ flex: 1, padding: 10, backgroundColor: "#f8fafc", borderRadius: 8, borderLeftWidth: 4, borderLeftColor: "#047857" }}>
            <Text style={{ fontSize: 8, color: "#64748b", marginBottom: 2 }}>PATRIMÔNIO LÍQUIDO</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: "#1e293b" }}>{formatarMoeda(patrimonio?.patrimonioLiquido || 0)}</Text>
            <Text style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{patrimonio?.ativos?.length || 0} Ativos Ativos</Text>
          </View>
        </View>

        {/* Tabela de transações */}
        <View style={styles.table}>
          {/* Cabeçalho da tabela */}
          <View style={styles.tableRow}>
            <Text
              style={{ ...styles.tableCell, ...styles.tableHeader, flex: 2 }}
            >
              Data
            </Text>
            <Text
              style={{ ...styles.tableCell, ...styles.tableHeader, flex: 3 }}
            >
              Descrição
            </Text>
            <Text
              style={{ ...styles.tableCell, ...styles.tableHeader, flex: 2 }}
            >
              Categoria
            </Text>
            <Text
              style={{ ...styles.tableCell, ...styles.tableHeader, flex: 1 }}
            >
              Tipo
            </Text>
            <Text
              style={{ ...styles.tableCell, ...styles.tableHeader, flex: 1 }}
            >
              Valor
            </Text>
          </View>

          {/* Linhas da tabela */}
          {dados.map((t: any) => (
            <View key={t.id} style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, flex: 2 }}>
                {formatarData(t.occurrenceDate)}
              </Text>
              <Text style={{ ...styles.tableCell, flex: 3 }}>
                {t.description}
              </Text>
              <Text style={{ ...styles.tableCell, flex: 2 }}>
                {t.category?.name || "Sem categoria"}
              </Text>
              <Text style={{ ...styles.tableCell, flex: 1 }}>
                {formatarTipo(t.type)}
              </Text>
              <Text
                style={{
                  ...styles.tableCell,
                  flex: 1,
                  color: t.type === "INCOME" ? "#059669" : "#dc2626",
                }}
              >
                {formatarMoeda(t.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Resumo */}
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>
            Total Receitas: {formatarMoeda(totalReceitas)}
          </Text>
          <Text style={styles.totalText}>
            Total Despesas: {formatarMoeda(totalDespesas)}
          </Text>
          <Text
            style={{
              ...styles.totalText,
              color: saldo >= 0 ? "#059669" : "#dc2626",
              fontSize: 13,
            }}
          >
            Saldo: {formatarMoeda(saldo)}
          </Text>
          <Text style={{ fontSize: 9, color: "#64748b", marginTop: 5 }}>
            Total de transações: {dados.length}
          </Text>
        </View>

        {/* Rodapé */}
        <Text style={styles.footer}>
          Gerado em {format(new Date(), "dd/MM/yyyy HH:mm")} • FluxoCerto
        </Text>
      </Page>
    </Document>
  );
}
