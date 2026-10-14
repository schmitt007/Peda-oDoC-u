# Pedaço do Céu

Vitrine responsiva da loja de algodão doce Pedaço do Céu, em Cerquilho, SP. Apresenta os produtos, fotos dos eventos, informações de aluguel e contato pelo WhatsApp.

## Executar localmente

Requer Node.js 18 ou superior. Não há dependências externas para instalar. No PowerShell, dentro desta pasta, execute:

```powershell
npm start
```

Abra `http://localhost:3000` no navegador. Para usar outra porta, defina a variável `PORT` antes de iniciar o servidor.

## Publicar no GitHub

Os dados de pedidos ficam na pasta local `data/`, que é ignorada pelo Git. Confirme que nenhum pedido ou dado pessoal foi adicionado ao repositório antes de publicá-lo.

Depois de criar um repositório vazio no GitHub, conecte-o e envie o projeto:

```powershell
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git add .
git status
git commit -m "Preparar site Pedaço do Céu"
git push -u origin main
```

Confira a saída de `git status` antes do commit. A pasta `data/` e os arquivos nela contidos não devem aparecer como arquivos a enviar.

## Publicar o site na internet

O formulário depende do back-end Node.js deste projeto. **O GitHub e o GitHub Pages armazenam o código, mas o GitHub Pages não executa esse servidor nem recebe os pedidos.** Para que o formulário funcione no domínio próprio, publique o projeto em uma hospedagem que execute Node.js e mantenha o armazenamento local persistente, ou migre os pedidos para um banco de dados/serviço de armazenamento persistente antes de publicar. Configure também o domínio e HTTPS na hospedagem.

## Pedidos de orçamento e privacidade

O formulário envia pedidos para `POST /api/orcamentos`. O servidor valida os campos e acrescenta cada pedido a `data/orcamentos.jsonl`. Esse arquivo JSON Lines **não é um banco de dados**; os pedidos ficam no disco da hospedagem e podem ser consultados apenas por acesso privado ao servidor ou ao painel de arquivos. O diretório `data/` não é servido publicamente e está excluído do Git pelo `.gitignore`.

Os pedidos contêm dados pessoais, como nome e telefone. Proteja-os, configure backups e não os inclua em commits ou repositórios. Confirme que a hospedagem mantém os arquivos após reinicializações e atualizações: algumas hospedagens apagam arquivos locais. O projeto não possui painel administrativo nem envia notificações.

## Conteúdo

As fotografias fornecidas estão em `assets/`. O valor exibido para o aluguel da máquina — R$ 160,00 por hora — foi informado na tabela enviada.
