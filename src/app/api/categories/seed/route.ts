import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";


const DEFAULT_CATEGORIES = [
  // === DESPESAS - MORADIA ===
  { name: "IPTU", type: "expense" as const, icon: "home", color: "#EF4444" },
  { name: "Condomínio", type: "expense" as const, icon: "home", color: "#F97316" },
  { name: "Aluguel", type: "expense" as const, icon: "home", color: "#F59E0B" },
  { name: "Financiamento Imóvel", type: "expense" as const, icon: "home", color: "#EAB308" },
  { name: "Manutenção Casa", type: "expense" as const, icon: "home", color: "#84CC16" },
  { name: "Reformas", type: "expense" as const, icon: "home", color: "#22C55E" },
  { name: "Seguro Residência", type: "expense" as const, icon: "home", color: "#10B981" },
  { name: "Gás", type: "expense" as const, icon: "home", color: "#14B8A6" },
  { name: "Interfone", type: "expense" as const, icon: "home", color: "#06B6D4" },
  { name: "Portaria", type: "expense" as const, icon: "home", color: "#0EA5E9" },
  { name: "Lixo/Coleta", type: "expense" as const, icon: "home", color: "#3B82F6" },

  // === DESPESAS - TRANSPORTE ===
  { name: "IPVA", type: "expense" as const, icon: "car", color: "#6366F1" },
  { name: "Combustível", type: "expense" as const, icon: "car", color: "#8B5CF6" },
  { name: "Seguro Auto", type: "expense" as const, icon: "car", color: "#A855F7" },
  { name: "Manutenção Veículo", type: "expense" as const, icon: "car", color: "#D946EF" },
  { name: "Multas", type: "expense" as const, icon: "car", color: "#EC4899" },
  { name: "Pedágio", type: "expense" as const, icon: "car", color: "#F43F5E" },
  { name: "Estacionamento", type: "expense" as const, icon: "car", color: "#EF4444" },
  { name: "Lavagem", type: "expense" as const, icon: "car", color: "#F97316" },
  { name: "Financiamento Carro", type: "expense" as const, icon: "car", color: "#F59E0B" },
  { name: "Licenciamento", type: "expense" as const, icon: "car", color: "#EAB308" },
  { name: "Pneus", type: "expense" as const, icon: "car", color: "#84CC16" },
  { name: "Ônibus/Metrô", type: "expense" as const, icon: "car", color: "#22C55E" },
  { name: "Uber/99", type: "expense" as const, icon: "car", color: "#10B981" },
  { name: "Táxi", type: "expense" as const, icon: "car", color: "#14B8A6" },
  { name: "Bicicleta", type: "expense" as const, icon: "car", color: "#06B6D4" },

  // === DESPESAS - ALIMENTAÇÃO ===
  { name: "Mercado", type: "expense" as const, icon: "coffee", color: "#0EA5E9" },
  { name: "Restaurante", type: "expense" as const, icon: "coffee", color: "#3B82F6" },
  { name: "Delivery", type: "expense" as const, icon: "coffee", color: "#6366F1" },
  { name: "Padaria", type: "expense" as const, icon: "coffee", color: "#8B5CF6" },
  { name: "Lanches", type: "expense" as const, icon: "coffee", color: "#A855F7" },
  { name: "Açougue", type: "expense" as const, icon: "coffee", color: "#D946EF" },
  { name: "Bebidas", type: "expense" as const, icon: "coffee", color: "#EC4899" },
  { name: "Café", type: "expense" as const, icon: "coffee", color: "#F43F5E" },
  { name: "Hortifruti", type: "expense" as const, icon: "coffee", color: "#EF4444" },
  { name: "Produtos de Limpeza", type: "expense" as const, icon: "coffee", color: "#F97316" },
  { name: "Higiene Pessoal", type: "expense" as const, icon: "coffee", color: "#F59E0B" },

  // === DESPESAS - UTILIDADES ===
  { name: "Energia Elétrica", type: "expense" as const, icon: "zap", color: "#EAB308" },
  { name: "Água", type: "expense" as const, icon: "zap", color: "#84CC16" },
  { name: "Gás Encanado", type: "expense" as const, icon: "zap", color: "#22C55E" },
  { name: "Internet", type: "expense" as const, icon: "laptop", color: "#10B981" },
  { name: "TV por Assinatura", type: "expense" as const, icon: "film", color: "#14B8A6" },
  { name: "Telefone Fixo", type: "expense" as const, icon: "phone", color: "#06B6D4" },
  { name: "Celular", type: "expense" as const, icon: "phone", color: "#0EA5E9" },

  // === DESPESAS - SAÚDE ===
  { name: "Plano de Saúde", type: "expense" as const, icon: "heart", color: "#3B82F6" },
  { name: "Farmácia", type: "expense" as const, icon: "heart", color: "#6366F1" },
  { name: "Consultas Médicas", type: "expense" as const, icon: "heart", color: "#8B5CF6" },
  { name: "Exames", type: "expense" as const, icon: "heart", color: "#A855F7" },
  { name: "Odontologia", type: "expense" as const, icon: "heart", color: "#D946EF" },
  { name: "Psicólogo", type: "expense" as const, icon: "heart", color: "#EC4899" },
  { name: "Fisioterapia", type: "expense" as const, icon: "heart", color: "#F43F5E" },
  { name: "Academia", type: "expense" as const, icon: "heart", color: "#EF4444" },
  { name: "Óculos/Contato", type: "expense" as const, icon: "heart", color: "#F97316" },
  { name: "Cirurgias", type: "expense" as const, icon: "heart", color: "#F59E0B" },
  { name: "Nutricionista", type: "expense" as const, icon: "heart", color: "#EAB308" },

  // === DESPESAS - PESSOAIS ===
  { name: "Cuidados Pessoais", type: "expense" as const, icon: "shopping-bag", color: "#84CC16" },
  { name: "Salão/Barbearia", type: "expense" as const, icon: "shopping-bag", color: "#22C55E" },
  { name: "Cosméticos", type: "expense" as const, icon: "shopping-bag", color: "#10B981" },
  { name: "Vestuário", type: "expense" as const, icon: "shopping-bag", color: "#14B8A6" },
  { name: "Calçados", type: "expense" as const, icon: "shopping-bag", color: "#06B6D4" },
  { name: "Acessórios", type: "expense" as const, icon: "shopping-bag", color: "#0EA5E9" },
  { name: "Jóias", type: "expense" as const, icon: "shopping-bag", color: "#3B82F6" },

  // === DESPESAS - ANIMAIS ===
  { name: "Ração", type: "expense" as const, icon: "more-horizontal", color: "#6366F1" },
  { name: "Veterinário", type: "expense" as const, icon: "more-horizontal", color: "#8B5CF6" },
  { name: "Banho e Tosa", type: "expense" as const, icon: "more-horizontal", color: "#A855F7" },
  { name: "Pet Shop", type: "expense" as const, icon: "more-horizontal", color: "#D946EF" },
  { name: "Medicamentos Pet", type: "expense" as const, icon: "more-horizontal", color: "#EC4899" },
  { name: "Acessórios Pet", type: "expense" as const, icon: "more-horizontal", color: "#F43F5E" },

  // === DESPESAS - LAZER ===
  { name: "Cinema", type: "expense" as const, icon: "film", color: "#EF4444" },
  { name: "Shows", type: "expense" as const, icon: "film", color: "#F97316" },
  { name: "Teatro", type: "expense" as const, icon: "film", color: "#F59E0B" },
  { name: "Bares", type: "expense" as const, icon: "coffee", color: "#EAB308" },
  { name: "Baladas", type: "expense" as const, icon: "film", color: "#84CC16" },
  { name: "Viagens", type: "expense" as const, icon: "film", color: "#22C55E" },
  { name: "Hotéis", type: "expense" as const, icon: "home", color: "#10B981" },
  { name: "Parques", type: "expense" as const, icon: "film", color: "#14B8A6" },
  { name: "Netflix", type: "expense" as const, icon: "film", color: "#06B6D4" },
  { name: "Spotify", type: "expense" as const, icon: "film", color: "#0EA5E9" },
  { name: "Games", type: "expense" as const, icon: "laptop", color: "#3B82F6" },
  { name: "Hobbies", type: "expense" as const, icon: "film", color: "#6366F1" },
  { name: "Streaming", type: "expense" as const, icon: "film", color: "#8B5CF6" },
  { name: "Livros", type: "expense" as const, icon: "book", color: "#A855F7" },
  { name: "Esportes", type: "expense" as const, icon: "heart", color: "#D946EF" },
  { name: "Museus", type: "expense" as const, icon: "film", color: "#EC4899" },

  // === DESPESAS - EDUCAÇÃO ===
  { name: "Mensalidade Escolar", type: "expense" as const, icon: "book", color: "#F43F5E" },
  { name: "Faculdade", type: "expense" as const, icon: "book", color: "#EF4444" },
  { name: "Cursos", type: "expense" as const, icon: "book", color: "#F97316" },
  { name: "Material Escolar", type: "expense" as const, icon: "book", color: "#F59E0B" },
  { name: "Idiomas", type: "expense" as const, icon: "book", color: "#EAB308" },
  { name: "Pós-Graduação", type: "expense" as const, icon: "book", color: "#84CC16" },
  { name: "Concursos", type: "expense" as const, icon: "book", color: "#22C55E" },
  { name: "Treinamentos", type: "expense" as const, icon: "book", color: "#10B981" },
  { name: "Livros Técnicos", type: "expense" as const, icon: "book", color: "#14B8A6" },

  // === DESPESAS - FINANCEIRAS ===
  { name: "Juros Cartão", type: "expense" as const, icon: "trending-up", color: "#06B6D4" },
  { name: "Tarifa Bancária", type: "expense" as const, icon: "trending-up", color: "#0EA5E9" },
  { name: "Empréstimos", type: "expense" as const, icon: "trending-up", color: "#3B82F6" },
  { name: "Taxa Investimentos", type: "expense" as const, icon: "trending-up", color: "#6366F1" },
  { name: "Impostos", type: "expense" as const, icon: "trending-up", color: "#8B5CF6" },
  { name: "Taxas Diversas", type: "expense" as const, icon: "trending-up", color: "#A855F7" },

  // === DESPESAS - TRABALHO ===
  { name: "Material de Escritório", type: "expense" as const, icon: "briefcase", color: "#D946EF" },
  { name: "Equipamentos", type: "expense" as const, icon: "laptop", color: "#EC4899" },
  { name: "Softwares", type: "expense" as const, icon: "laptop", color: "#F43F5E" },
  { name: "Cursos Profissionais", type: "expense" as const, icon: "book", color: "#EF4444" },
  { name: "Transporte Trabalho", type: "expense" as const, icon: "car", color: "#F97316" },
  { name: "Alimentação Trabalho", type: "expense" as const, icon: "coffee", color: "#F59E0B" },

  // === DESPESAS - DIVERSOS ===
  { name: "Presentes", type: "expense" as const, icon: "shopping-bag", color: "#F59E0B" },
  { name: "Doações", type: "expense" as const, icon: "heart", color: "#84CC16" },
  { name: "Correios", type: "expense" as const, icon: "more-horizontal", color: "#22C55E" },
  { name: "Documentos", type: "expense" as const, icon: "more-horizontal", color: "#10B981" },
  { name: "Serviços", type: "expense" as const, icon: "more-horizontal", color: "#14B8A6" },
  { name: "Assinaturas", type: "expense" as const, icon: "more-horizontal", color: "#06B6D4" },
  { name: "Compras Online", type: "expense" as const, icon: "shopping-bag", color: "#0EA5E9" },
  { name: "Mercado Livre", type: "expense" as const, icon: "shopping-bag", color: "#3B82F6" },
  { name: "Shopee", type: "expense" as const, icon: "shopping-bag", color: "#6366F1" },
  { name: "Amazon", type: "expense" as const, icon: "shopping-bag", color: "#8B5CF6" },
  { name: "AliExpress", type: "expense" as const, icon: "shopping-bag", color: "#A855F7" },
  { name: "Dívidas", type: "expense" as const, icon: "trending-up", color: "#D946EF" },
  { name: "Empréstimo Pessoal", type: "expense" as const, icon: "trending-up", color: "#EC4899" },
  { name: "Reserva Emergência", type: "expense" as const, icon: "trending-up", color: "#F43F5E" },
  { name: "Reserva IPVA", type: "expense" as const, icon: "trending-up", color: "#EF4444" },
  { name: "Diarista", type: "expense" as const, icon: "home", color: "#F97316" },
  { name: "Empregada", type: "expense" as const, icon: "home", color: "#F59E0B" },
  { name: "Jardineiro", type: "expense" as const, icon: "home", color: "#EAB308" },

  // === RECEITAS - TRABALHO ===
  { name: "Salário", type: "income" as const, icon: "briefcase", color: "#10B981" },
  { name: "13º Salário", type: "income" as const, icon: "briefcase", color: "#14B8A6" },
  { name: "Férias", type: "income" as const, icon: "briefcase", color: "#06B6D4" },
  { name: "Bônus", type: "income" as const, icon: "briefcase", color: "#0EA5E9" },
  { name: "Comissões", type: "income" as const, icon: "briefcase", color: "#3B82F6" },
  { name: "Horas Extras", type: "income" as const, icon: "briefcase", color: "#6366F1" },
  { name: "Freelance", type: "income" as const, icon: "briefcase", color: "#8B5CF6" },
  { name: "Renda Extra", type: "income" as const, icon: "briefcase", color: "#A855F7" },
  { name: "Gratificação", type: "income" as const, icon: "briefcase", color: "#D946EF" },
  { name: "Participação nos Lucros", type: "income" as const, icon: "trending-up", color: "#EC4899" },

  // === RECEITAS - INVESTIMENTOS ===
  { name: "Dividendos", type: "income" as const, icon: "trending-up", color: "#F43F5E" },
  { name: "Juros", type: "income" as const, icon: "trending-up", color: "#EF4444" },
  { name: "Rendimento Poupança", type: "income" as const, icon: "trending-up", color: "#F97316" },
  { name: "Rendimento CDB", type: "income" as const, icon: "trending-up", color: "#F59E0B" },
  { name: "Rendimento Tesouro", type: "income" as const, icon: "trending-up", color: "#EAB308" },
  { name: "Venda Investimentos", type: "income" as const, icon: "trending-up", color: "#84CC16" },
  { name: "Renda Fixa", type: "income" as const, icon: "trending-up", color: "#22C55E" },
  { name: "Renda Variável", type: "income" as const, icon: "trending-up", color: "#10B981" },
  { name: "Fundos Imobiliários", type: "income" as const, icon: "trending-up", color: "#14B8A6" },
  { name: "Criptomoedas", type: "income" as const, icon: "trending-up", color: "#06B6D4" },

  // === RECEITAS - NEGÓCIOS ===
  { name: "Faturamento MEI", type: "income" as const, icon: "briefcase", color: "#0EA5E9" },
  { name: "Faturamento Empresa", type: "income" as const, icon: "briefcase", color: "#3B82F6" },
  { name: "Pró-Labore", type: "income" as const, icon: "briefcase", color: "#6366F1" },
  { name: "Lucro Empresa", type: "income" as const, icon: "trending-up", color: "#8B5CF6" },
  { name: "Vendas", type: "income" as const, icon: "shopping-bag", color: "#A855F7" },
  { name: "Serviços Prestados", type: "income" as const, icon: "briefcase", color: "#D946EF" },

  // === RECEITAS - DIVERSOS ===
  { name: "Reembolsos", type: "income" as const, icon: "more-horizontal", color: "#EC4899" },
  { name: "Presentes Recebidos", type: "income" as const, icon: "shopping-bag", color: "#F43F5E" },
  { name: "Restituição Imposto", type: "income" as const, icon: "trending-up", color: "#EF4444" },
  { name: "Prêmios", type: "income" as const, icon: "trending-up", color: "#F97316" },
  { name: "Herança", type: "income" as const, icon: "more-horizontal", color: "#F59E0B" },
  { name: "Venda Bens", type: "income" as const, icon: "shopping-bag", color: "#EAB308" },
  { name: "Aluguel Recebido", type: "income" as const, icon: "home", color: "#84CC16" },
  { name: "Aposentadoria", type: "income" as const, icon: "briefcase", color: "#22C55E" },
  { name: "Pensão Recebida", type: "income" as const, icon: "trending-up", color: "#10B981" },
  { name: "Seguro Desemprego", type: "income" as const, icon: "briefcase", color: "#14B8A6" },
  { name: "Bolsa Auxílio", type: "income" as const, icon: "book", color: "#06B6D4" },
  { name: "Ajudas Familiares", type: "income" as const, icon: "heart", color: "#0EA5E9" },
  { name: "Cashback", type: "income" as const, icon: "trending-up", color: "#3B82F6" },
  { name: "Reembolso Médico", type: "income" as const, icon: "heart", color: "#6366F1" },
];

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId));

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Você já possui categorias cadastradas", count: existing.length },
      { status: 400 }
    );
  }

  const inserted = await db
    .insert(categories)
    .values(
      DEFAULT_CATEGORIES.map((cat, index) => ({
        ...cat,
        userId,
        order: index,
      }))
    )
    .returning();

  return NextResponse.json({
    success: true,
    message: `${inserted.length} categorias criadas com sucesso!`,
    count: inserted.length,
  });
}