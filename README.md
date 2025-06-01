# Documentação do Projeto: VideoClear

**Versão:** 1.0
**Data:** 31 de maio de 2025

## 1. Visão Geral do Projeto

O VideoClear é uma aplicação web desenvolvida para oferecer uma solução simples e eficaz para a melhoria da qualidade de áudio em ficheiros de vídeo. A plataforma permite que os utilizadores façam o upload de um vídeo, que é processado no servidor para remover ruídos de fundo indesejados da trilha sonora. O resultado é um novo ficheiro de vídeo com o áudio limpo, que pode ser descarregado pelo utilizador.

O projeto destina-se a criadores de conteúdo, editores de vídeo, estudantes, e qualquer pessoa que precise de melhorar a clareza do áudio nos seus vídeos sem a necessidade de software de edição complexo.

## 2. Funcionalidades Implementadas

-   **Upload de Vídeo:** Interface web responsiva com uma zona de "arrastar e soltar" (drag and drop) e um botão para procurar ficheiros locais.
-   **Processamento no Servidor (Backend):**
    -   O servidor recebe e guarda o ficheiro de vídeo original.
    -   **Extração de Áudio:** O áudio do vídeo é extraído e guardado como um ficheiro `.wav` separado para processamento.
    -   **Redução de Ruído de Áudio:** É aplicado um algoritmo de redução de ruído ao ficheiro de áudio extraído para diminuir ruídos de fundo estacionários (chiados, zumbidos).
    -   **Recombinação:** O áudio limpo é recombinado com a trilha de vídeo original, gerando um novo ficheiro de vídeo final.
-   **Download do Vídeo Final:** Após o processamento ser concluído com sucesso, é disponibilizado um botão para o utilizador descarregar o ficheiro de vídeo processado.
-   **Interface de Utilizador Dinâmica:** A interface fornece feedback em tempo real sobre o estado do processamento, com mensagens de estado, indicadores de carregamento (spinners) e uma barra de progresso (simulada durante o upload inicial).
-   **Tratamento de Erros:** A aplicação fornece feedback ao utilizador caso ocorra algum erro durante o upload ou o processamento.

## 3. Estrutura do Projeto

O projeto está organizado com uma estrutura de pastas típica de uma aplicação Flask para garantir a separação de responsabilidades.

videoclear_site/├── app.py              # Ficheiro principal da aplicação Flask (backend)├── static/             # Pasta para ficheiros estáticos│   ├── css/│   │   └── style.css   # Ficheiro de estilos CSS│   └── js/│       └── script.js   # Ficheiro JavaScript do frontend├── templates/          # Pasta para os templates HTML│   └── index.html      # Página principal da aplicação└── uploads/            # Pasta para guardar ficheiros durante o processamento├── (vídeos originais)├── (áudios extraídos .wav)├── (áudios limpos .wav)└── (vídeos finais)
## 4. Pilha de Tecnologia (Tech Stack)

-   **Linguagem de Backend:** Python 3
-   **Framework Web:** Flask
-   **Linguagens de Frontend:** HTML5, CSS3, JavaScript (ES6+)
-   **Framework CSS:** Tailwind CSS (utilizado via CDN)
-   **Bibliotecas de Processamento de Mídia (Python):**
    -   `MoviePy`: Extração de áudio e recombinação de vídeo/áudio.
    -   `noisereduce`: Redução de ruído no áudio.
    -   `soundfile` / `SciPy`: Leitura e escrita de ficheiros de áudio `.wav`.
    -   `NumPy`: Manipulação numérica de dados de áudio.

## 5. Guia de Instalação e Execução

Para executar o projeto num ambiente de desenvolvimento local:

1.  **Pré-requisitos:**
    * Python 3 instalado.
    * `pip` (gestor de pacotes Python) acessível.

2.  **Estrutura de Ficheiros:** Organize os ficheiros conforme a secção 3.

3.  **Instalação de Dependências:**
    No terminal, na pasta raiz do projeto (`videoclear_site/`), execute:
    ```bash
    # Instalar o Flask
    pip install Flask

    # Instalar bibliotecas de processamento de mídia
    pip install moviepy==1.0.3 noisereduce scipy soundfile numpy
    ```
    *(Recomendado: crie um ficheiro `requirements.txt` com estas dependências e instale com `pip install -r requirements.txt`)*

4.  **Executar o Servidor:**
    No terminal, na pasta raiz do projeto, execute:
    ```bash
    python app.py
    ```
    (Ou `py app.py` no Windows).

5.  **Aceder à Aplicação:**
    Abra o navegador e aceda a: `http://127.0.0.1:5000`

## 6. Fluxo de Processamento de um Vídeo

1.  O utilizador seleciona/arrasta um vídeo para a "drop zone".
2.  O JavaScript (`script.js`) envia o ficheiro via `POST` para o endpoint `/upload`.
3.  O servidor Flask (`app.py`) guarda o vídeo original em `uploads/`.
4.  A função `extract_audio_from_video` (MoviePy) cria uma versão `.wav` do áudio.
5.  A função `reduce_audio_noise` lê o `.wav`, aplica a redução de ruído, e guarda o resultado como `_clean.wav`.
6.  A função `recombine_video_with_audio` junta o vídeo original (sem som) com o áudio limpo, gerando `_final.mp4`.
7.  O servidor responde ao frontend com JSON (sucesso e nome do ficheiro final).
8.  O JavaScript exibe a mensagem e ativa o botão de download.
9.  Ao clicar no download, o navegador faz um `GET` para `/download/<nome_do_ficheiro>`.
10. O servidor Flask envia o ficheiro final para download.

## 7. Possíveis Melhorias Futuras

-   **Processamento Assíncrono:** Usar Celery e Redis/RabbitMQ para vídeos longos, com notificações.
-   **Contas de Utilizador:** Sistema de login para histórico de vídeos.
-   **Pré-visualização do Resultado:** Permitir ouvir/ver um trecho antes de descarregar.
-   **Remoção de Ruído de Vídeo:** Usar OpenCV ou IA para remover granulação visual.
-   **Mais Opções de Processamento:** Controlo de intensidade da remoção de ruído, seleção de tipos de ruído.
-   **Integração com IA Generativa (API Gemini):** Geração de títulos, descrições e tags para vídeos.

