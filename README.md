# Jogos Zerados

O Jogos Zerados é um aplicativo desktop minimalista desenvolvido para a organização de bibliotecas de jogos, permitindo o acompanhamento de títulos concluídos e em andamento. Construído com o framework Electron, o projeto prioriza uma interface fluida com persistência de dados local e segura.

## Funcionalidades

* **Gestão Completa (CRUD):** Adição, edição e remoção de registos de jogos.
* **Status de Progresso:** Diferenciação visual entre títulos em andamento e títulos concluídos.
* **Filtros de Navegação:** Organização por categorias através de abas de acesso rápido.
* **Identidade Visual Personalizada:** Tema escuro com elementos de destaque em azul e bordas amarelas exclusivas para jogos finalizados.
* **Persistência de Dados:** Armazenamento automático em formato JSON na pasta de dados do utilizador do sistema operativo, garantindo a integridade das informações entre sessões.
* **Interface Responsiva:** Utilização de painéis laterais para formulários e janelas modais de confirmação.

## Tecnologias Utilizadas

* **Electron:** Framework para desenvolvimento de aplicações desktop.
* **Node.js:** Ambiente de execução do lado do servidor.
* **Frontend:** HTML5, CSS3 (Variáveis CSS, Flexbox e Grid) e JavaScript.
* **Tipografia:** Fonte Outfit obtida via Google Fonts.

## Instruções de Execução

### Pré-requisitos
É necessário ter o Node.js instalado no sistema.

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-utilizador/jogos-zerados.git](https://github.com/seu-utilizador/jogos-zerados.git)
    ```
2.  **Aceda ao diretório do projeto:**
    ```bash
    cd jogos-zerados
    ```
3.  **Instale as dependências necessárias:**
    ```bash
    npm install
    ```
4.  **Inicie a aplicação:**
    ```bash
    npm start
    ```

## Compilação do Executável (.exe)

Para transformar o projeto num instalador para Windows:

1.  Certifique-se de que a dependência `electron-builder` está configurada.
2.  Execute o comando de compilação:
    ```bash
    npm run build
    ```
3.  O ficheiro de instalação será gerado no diretório `/dist`.

## Estrutura de Ficheiros

* **main.js:** Gerenciamento do processo principal e manipulação do sistema de ficheiros.
* **preload.js:** Interface de comunicação segura entre o Node.js e o frontend.
* **script.js:** Lógica de renderização, aplicação de filtros e manipulação do DOM.
* **style.css:** Definições de estilo, variáveis de cor e animações.
* **index.html:** Estrutura hierárquica da interface do utilizador.
