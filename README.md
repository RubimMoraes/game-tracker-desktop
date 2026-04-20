# 🎮 Gerenciador de Jogos Zerados

Aplicativo desktop feito com **Electron + HTML + CSS + JavaScript** para registrar sua biblioteca de jogos, destacar jogos já zerados e salvar tudo localmente em **JSON**.

---

## ✨ Funcionalidades

- Cadastro manual de jogos com:
  - Nome
  - URL/caminho da capa
  - Tempo jogado (horas)
  - Nota (opcional)
  - Comentário/feedback
  - Status de zerado
- Exibição dos jogos em **layout de grid**.
- Destaque visual para jogos zerados com borda amarela `#c9ff05`.
- Modal de detalhes ao clicar no card.
- Persistência local dos dados (leitura e escrita em JSON).
- Fallback para imagem quebrada/ausente.

---

## 🧱 Tecnologias

- **Electron** (aplicativo desktop)
- **HTML5** (estrutura)
- **CSS3** (estilo e layout)
- **JavaScript** (lógica do frontend)
- **JSON** (armazenamento de dados)

---

## 📁 Estrutura do projeto

```bash
jogos_zerados/
├── index.html
├── style.css
├── script.js
├── main.js
├── preload.js
├── dados.json
├── assets/
│   └── imagens/
│       └── .gitkeep
└── package.json
```

---

## ▶️ Como executar

### 1) Pré-requisitos

- Node.js 18+ (recomendado)
- npm

### 2) Instalar dependências

```bash
npm install
```

### 3) Iniciar o app

```bash
npm start
```

---

## 🧪 Como testar rapidamente

1. Abra o app com `npm start`.
2. Verifique se os jogos aparecem em cards no grid.
3. Clique em um card e confirme a abertura do modal de detalhes.
4. Clique em **+ Adicionar jogo** e cadastre um novo item.
5. Marque/desmarque **Já foi zerado** e confirme o destaque visual.
6. Feche e abra o app novamente para validar persistência dos dados.

---

## 💾 Persistência e segurança de dados

- Os dados são carregados e salvos por IPC entre renderer e processo principal.
- A gravação do JSON é feita de forma atômica (arquivo temporário + rename), reduzindo risco de corrupção.
- Se o JSON estiver inválido, o app tenta se recuperar sem quebrar a execução.

---

## 🚧 Melhorias futuras

- Filtros (zerados / não zerados)
- Busca por nome
- Ordenação por tempo, nota e nome
- Estatísticas (horas totais, média de notas)
- Categorias (RPG, FPS etc.)
- Importação automática de capas por API

---

## 📄 Licença

Este projeto está aberto para fins de estudo e evolução.
