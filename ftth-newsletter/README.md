# Newsletter FTTH semanal

Recolhe todas as semanas as novidades de FTTH/PON das fontes indicadas, filtra o que é relevante e envia um email HTML organizado em 7 secções (associações, normas, notícias, África/Angola, analistas, fabricantes, formação).

## Como os dados são recolhidos (validado em 19/11/2026)

| Fonte | Método | Estado |
|---|---|---|
| Fibre Council Europe (ftthcouncil.eu → **fibrecouncil.eu**) | Leitura da página de notícias + Google News | ✅ (sem RSS; o site mudou de nome) |
| Fiber Broadband Association | Google News (site bloqueia robôs, 403) | ✅ |
| Digital Council Africa | Google News (site sem RSS) | ⚠️ pouco volume |
| FTTH Council Global Alliance | Coberto pelas consultas das associações | — |
| ITU-T | Google News `site:itu.int` + filtro PON | ✅ |
| Broadband Forum | Leitura de broadband-forum.org/news | ✅ |
| IEEE 802.3 | Google News (sem feed de notícias) | ⚠️ raro |
| Lightwave | RSS oficial (secção FTTx + geral) | ✅ |
| Fibre Systems | RSS `/rss.xml` | ✅ |
| Light Reading | RSS `/rss.xml` | ✅ |
| Fierce Network | RSS `/rss/xml` | ✅ |
| Converge Digest | RSS `/feed/` (sem `www`) | ✅ |
| Telecompaper | Google News (sem RSS público) | ✅ |
| TeleGeography | RSS do blog | ✅ |
| ITWeb Africa / TechCentral / Developing Telecoms / Telecom Review Africa | RSS oficial | ✅ |
| INACOM | RSS WordPress `/feed` | ✅ |
| IDATE / Omdia / Dell'Oro | Google News (sem RSS; Dell'Oro limita pedidos, 429) | ✅ |
| Ookla | RSS `/articles/rss` | ✅ |
| Huawei / Nokia / ZTE / Corning | Google News com termos PON/OLT/fibra | ✅ |
| FOA / Huawei Talent | Google News + links fixos no rodapé | ⚠️ raro |

Relatórios pagos (Market Panorama completo, Omdia, Dell'Oro) não são acessíveis automaticamente: a newsletter apanha os anúncios/resumos públicos.

## Execução local

```bash
pip install -r requirements.txt
python newsletter.py        # gera archive/AAAA-MM-DD.html e archive/latest.html
```

## Envio semanal automático (GitHub Actions)

O workflow `.github/workflows/ftth-newsletter.yml` corre todas as segundas às 06:17 (hora de Luanda) e guarda cada edição em `archive/`.

1. Fazer merge deste código no branch principal (os agendamentos do GitHub só correm no branch por defeito).
2. Em **Settings → Secrets and variables → Actions → New repository secret**, criar:

| Secret | Exemplo (Gmail) | Notas |
|---|---|---|
| `SMTP_HOST` | `smtp.gmail.com` | |
| `SMTP_PORT` | `587` | |
| `SMTP_USER` | `conta.envio@gmail.com` | conta que envia |
| `SMTP_PASS` | palavra-passe de aplicação | Google → Segurança → Verificação em 2 passos → Palavras-passe de aplicações |
| `MAIL_TO` | o seu email | vários separados por vírgula |
| `MAIL_FROM` | (opcional) | por defeito = `SMTP_USER` |
| `ANTHROPIC_API_KEY` | (opcional) | acrescenta "Destaques da semana" escritos pelo Claude |

   Contas Outlook/Hotmail podem receber normalmente, mas a Microsoft deixou de aceitar login SMTP com palavra-passe em contas pessoais; para *enviar*, use Gmail com palavra-passe de aplicação ou um serviço como Brevo (`smtp-relay.brevo.com`, porta 587).
3. Testar já: separador **Actions → Newsletter FTTH semanal → Run workflow**.

## Personalizar

Tudo está em `sources.yaml`: acrescentar/remover fontes, mudar consultas do Google News, ou pôr `filter: false` numa fonte para receber tudo dela. Os termos de relevância e os pesos estão em `KEYWORDS` no `newsletter.py`.
