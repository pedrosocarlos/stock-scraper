## stock-scraper

#### Sistema simples de verificação de ações possívelmente baratas baseado nas ideias de Joel Greenblatt.

O sistema funciona pesquisando no site [Fundamentus](https://www.fundamentus.com.br/resultado.php) e ordenando as ações de acordo com o seu ROIC (Lucro Operacional Líquido Após Impostos) e EV/EBIT (Valor da empresa dividido pelo lucro antes de juros e imposto de renda)

#### Ordem de execução dos comandos

o repositório possui uma collection que deve ser utilizada para melhor utilização do sistema.

comandos para instalação:
1. npm install
2. npx knex migrate:latest
3. npm run start

requests http:
1. cria base de dados (POST localhost:3001/)
2. ordenar resultados (POST localhost:3001/order)
3. pegar X resultados ordenados (GET localhost:3001/order/30)

#### Resalvas

Esse sistema NÃO retira empresas do ramo bancário/seguros nem empresas em recuperação judicial. Esse segundo processo de análise deve ser feita por quem utilizar o sistema.

OBS: Essa fórmula de investimentos é referenciada e apresentada no livro The Little Book That Beats the Market (A Fórmula Mágica de Joel Greenblatt para Bater o Mercado de Ações).