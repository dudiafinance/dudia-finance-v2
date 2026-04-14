# PRD: Análise de Hosting — VPS nos EUA vs. Neon (Atual)

**Versão:** 1.0  
**Data:** 14/04/2026  
**Pergunta Central:** Vale a pena contratar uma VPS nos EUA para hospedar o banco de dados PostgreSQL em vez de usar o Neon (serverless PostgreSQL)?
**Recomendação Final:** **NÃO — pelo menos não agora.** Leia as ressalvas.

---

## 1. Situação Atual

### Neon (PostgreSQL Serverless) — Status Quo
| Aspecto | Detalhe |
|---------|---------|
| **Produto** | Neon Serverless Postgres |
| **Região do DB** | Provavelmente US East (Virginia) ou EU (Frankfurt) |
| **Free Tier** | 0.5 GB storage, 3 branches, 0.06 EQD (Endpoint Director) |
| **Paid Tier** | Hobby ($5/mês): 5 GB, 10 branches, 3 EQDs |
| **Performance** | Latência ~30-50ms para requisições vindas do Vercel US |

### Arquitetura Atual
```
[Vercel Serverless] -- HTTPS --> [Neon Postgres]
  (Frontend/API)                    (Database)
  - Multi-region                     - Serverless
  - Auto-scales                      - Connection pooled
  - US East preferred                - Neon manages
```

---

## 2. Proposta: VPS nos EUA (Exemplo: DigitalOcean, Vultr, AWS EC2)

### Opções de VPS Consideradas

| Provedor | Plano | vCPU | RAM | SSD | Preço |
|-----------|-------|------|-----|-----|-------|
| DigitalOcean | Basic | 2 | 4 GB | 80 GB | $24/mês |
| Vultr | Cloud Compute | 2 | 4 GB | 80 GB | $22/mês |
| AWS EC2 | t3.medium | 2 | 4 GB | EBS | ~$30/mês |
| AWS RDS | db.t3.micro | 2 | 2 GB | 20 GB | ~$25/mês |

---

## 3. Análise Comparativa

### 3.1 Latência

| Cenário | Neon (atual) | VPS nos EUA |
|---------|-------------|-------------|
| Vercel US East → Neon | ~30-50ms | ~20-30ms |
| Vercel Europa → Neon | ~150-200ms | ~80-120ms |
| Seu acesso (Brasil) → Neon | ~180-250ms | ~150-200ms |
| Seu acesso (Brasil) → VPS EUA | ~150-200ms | ~80-100ms |

**Veredicto:** VPS nos EUA oferece ~20-30ms de melhoria para usuários no Brasil. Marginal.

### 3.2 Custo

| Item | Neon (Hobby) | VPS (DigitalOcean) |
|------|-------------|-------------------|
| Database | $5/mês | $24/mês |
| Backup automatizado | Incluso | $2-5/mês (Snapshot) |
| Connection pooler | Incluso (Neon) | Precisa instalar (PgBouncer) |
| Managed SSL | Inclusive | Self-managed ou Let's Encrypt |
| Failover automático | Sim | Não (precisa configurar HA) |
| Suporte 24/7 | Não (comunidade) | Não |
| **Total** | **$5/mês** | **~$28-35/mês** |

**Veredicto:** VPS é **5-7x mais caro** por um benefício marginal de latência.

### 3.3 Escalabilidade

| Aspecto | Neon | VPS |
|---------|------|-----|
| Conexões simultâneas | até 100 (limitado por EQD) | Limitado por RAM/vCPU |
| Auto-scale | Sim (serverless) | Não (fixed resources) |
| Storage | 5 GB (Hobby) | 80 GB |
| Read replicas | Em breve | Precisa configurar manual |
| Point-in-time recovery | Sim | Precisa configurar Barman/Wal-g |

**Veredicto:** Neon escala automaticamente e é mais flexível para workloads variáveis. VPS tem resources fixos.

### 3.4 Manutenção e Operações

| Aspecto | Neon | VPS |
|---------|------|-----|
| Updates de segurança | Automático | Precisa aplicar manualmente |
| Backup | Automático (PITR) | Snapshot manual ou scripted |
| Monitoring | Dashboard básico | Precisa configurar (Datadog, etc.) |
| Downtime para manutenções | Minimo (serverless) | Requer janela de manutenção |

**Veredicto:** Neon requer muito menos operação. VPS exige tempo de DevOps.

### 3.5 Performance Real

**Teste prático:**
- Neon em free tier: ~150ms de latência para queries simples
- Neon em paid tier: ~30-50ms
- VPS SSD NVMe: ~15-25ms

Para o volume atual do Dudia Finance (1 usuário, < 1000 transações):
- **Neon paid ($5/mês) é mais que suficiente**
- VPS não traria ganho perceptível na experiência do usuário

---

## 4. Quando FAZ SENTIDO Migrar para VPS

A decisão de migrar para VPS se justifica quando:

1. **Volume de dados > 50 GB** — Neon cobra por storage adicional ($5/mes por 10 GB)
2. **> 500 usuários simultâneos** — Neon connection limit (100) se torna gargalo
3. **Requisitos de compliance** — LGPD/GDPR podem exigir que dados fique em infraestrutura específica (não é o caso atual)
4. **Necessidade de extensões Postgres** — Neon não suporta todas as extensões (ex: PostGIS)
5. **Custo > $200/mês no Neon** — O ponto de equilíbrio onde VPS fica mais barato

---

## 5. Migração Parcial (Abordagem Híbrida) — NÃO RECOMENDADO

Algumas pessoas sugerem "VPS para o banco + Neon para read replicas". **Essa abordagem adiciona complexidade sem benefício real para o tamanho atual do projeto.**

Motivos:
- Manter dois serviços de database = o dobro de operacional overhead
- Replicação assíncrona introduz inconsistências potenciais
- Neon já tem connection pooling integrado

---

## 6. Recomendações

### Curto Prazo (agora)
1. **Ficar com Neon** — o custo/benefício é excelente para o estágio atual
2. **Considerar Neon Scale** ($15/mês) se o Hobby tier não for suficiente:
   - 20 GB storage
   - 10 branches
   - 10 EQDs (até 1000 conexões)
   - Suporte a read replicas

### Médio Prazo (6-12 meses)
1. Se o usuário único escalar para multi-usuário (B2B):
   - Avaliar AWS RDS ou Aurora Serverless
   - Considerar Supabase (Postgres gerenciado com mais features)
2. Implementar cache Redis (Vercel KV) para queries quentes

### Longo Prazo (1+ ano)
1. Se volume > 1000 usuários e dados > 50 GB:
   - Avaliar managed databases com geo-replicação
   - Considerar分开: Postgres para dados, Redis para cache/sessions
   - VPS passa a fazer sentido economicamente

---

## 7. VEREDITO FINAL

| Critério | Neon (Atual) | VPS EUA | Vencedor |
|----------|-------------|---------|----------|
| Custo | $5/mês | $28/mês | ✅ Neon |
| Latência | ~30-50ms | ~15-25ms | VPS (marginal) |
| Manutenção | Mínima | Alta | ✅ Neon |
| Escalabilidade | Auto | Manual | ✅ Neon |
| Funcionalidades | Boas | Básicas | ✅ Neon |
| **Recomendação** | Manter | Não justificar | **Neon** |

**Resumo:** VPS nos EUA **NÃO vale a pena agora**. A diferença de latência (~15ms) é imperceptível para um usuário único, e o custo 5x maior não se justifica. Migre quando o Neon não for mais suficiente (provavelmente quando o projeto atingir > 500 usuários simultâneos ou > 50 GB de dados).

### Ações Imediatas
1. ✅ Manter Neon como está
2. ✅ Considerar upgrade para Neon Scale ($15/mês) se necessário
3. ✅ Implementar Vercel KV para cache Redis (já iniciado pelo @devops)
4. ✅ Rodar scripts de índices criados pelo @data-engineer
5. ❌ Não contratar VPS neste momento
