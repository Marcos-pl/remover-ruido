Documentação do Projeto: VideoClear
Versão: 1.0
Data: 31 de maio de 2025

1. Visão Geral do Projeto
O VideoClear é uma aplicação web desenvolvida para oferecer uma solução simples e eficaz para a melhoria da qualidade de áudio em ficheiros de vídeo. A plataforma permite que os utilizadores façam o upload de um vídeo, que é processado no servidor para remover ruídos de fundo indesejados da trilha sonora. O resultado é um novo ficheiro de vídeo com o áudio limpo, que pode ser descarregado pelo utilizador.

O projeto destina-se a criadores de conteúdo, editores de vídeo, estudantes, e qualquer pessoa que precise de melhorar a clareza do áudio nos seus vídeos sem a necessidade de software de edição complexo.
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
2. Funcionalidades Implementadas
Upload de Vídeo: Interface web responsiva com uma zona de "arrastar e soltar" (drag and drop) e um botão para procurar ficheiros locais.
Processamento no Servidor (Backend):
O servidor recebe e guarda o ficheiro de vídeo original.
Extração de Áudio: O áudio do vídeo é extraído e guardado como um ficheiro .wav separado para processamento.
Redução de Ruído de Áudio: É aplicado um algoritmo de redução de ruído ao ficheiro de áudio extraído para diminuir ruídos de fundo estacionários (chiados, zumbidos).
Recombinação: O áudio limpo é recombinado com a trilha de vídeo original, gerando um novo ficheiro de vídeo final.
Download do Vídeo Final: Após o processamento ser concluído com sucesso, é disponibilizado um botão para o utilizador descarregar o ficheiro de vídeo processado.
Interface de Utilizador Dinâmica: A interface fornece feedback em tempo real sobre o estado do processamento, com mensagens de estado, indicadores de carregamento (spinners) e uma barra de progresso (simulada durante o upload inicial).
Tratamento de Erros: A aplicação fornece feedback ao utilizador caso ocorra algum erro durante o upload ou o processamento.
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
3. Estrutura do Projeto
O projeto está organizado com uma estrutura de pastas típica de uma aplicação Flask para garantir a separação de responsabilidades.

videoclear_site/
├── app.py              # Ficheiro principal da aplicação Flask (backend)
├── static/             # Pasta para ficheiros estáticos (servidos diretamente ao navegador)
│   ├── css/
│   │   └── style.css   # Ficheiro de estilos CSS personalizados
│   └── js/
│       └── script.js   # Ficheiro JavaScript para a lógica do frontend
├── templates/          # Pasta para os templates HTML
│   └── index.html      # A página principal da aplicação
└── uploads/            # Pasta onde os ficheiros são guardados durante o processamento
    ├── (vídeos originais enviados pelos utilizadores)
    ├── (áudios extraídos em formato .wav)
    ├── (áudios limpos em formato .wav)
    └── (vídeos finais com o áudio limpo)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
4. Pilha de Tecnologia (Tech Stack)
Linguagem de Backend: Python 3
Framework Web: Flask
Linguagens de Frontend: HTML5, CSS3, JavaScript (ES6+)
Framework CSS: Tailwind CSS (utilizado via CDN para estilização rápida)
Bibliotecas de Processamento de Mídia (Python):
MoviePy: Utilizada para extrair o áudio do vídeo e para recombinar o áudio limpo com o vídeo original.
noisereduce: A biblioteca principal para realizar a redução de ruído no áudio.
soundfile / SciPy: Utilizadas para ler e escrever os ficheiros de áudio .wav de forma fiável.
NumPy: Dependência fundamental para manipulação numérica de dados de áudio.

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

5. Guia de Instalação e Execução
Para executar o projeto num ambiente de desenvolvimento local, siga estes passos:

Pré-requisitos: Certifique-se de que tem o Python 3 instalado no seu sistema e que o pip está acessível a partir da linha de comandos.

Estrutura de Ficheiros: Organize os ficheiros do projeto conforme a estrutura descrita na secção 3.

Instalação de Dependências: Abra um terminal ou linha de comandos, navegue até à pasta raiz do projeto (videoclear_site/) e instale todas as bibliotecas Python necessárias com os seguintes comandos:


# Instalar o Flask
pip install Flask

# Instalar bibliotecas de processamento de mídia (versão específica do moviepy para garantir compatibilidade)
pip install moviepy==1.0.3 noisereduce scipy soundfile nump
Executar o Servidor: No mesmo terminal, na pasta raiz do projeto, execute o seguinte comando para iniciar o servidor de desenvolvimento Flask:


python app.py
(Ou py app.py dependendo da sua configuração do Windows).

Aceder à Aplicação: Abra o seu navegador web e aceda ao seguinte endereço: http://127.0.0.1:5000. A aplicação deverá estar a funcionar.
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

6. Fluxo de Processamento de um Vídeo
O fluxo de trabalho, desde o upload até ao download, ocorre da seguinte forma:

O utilizador seleciona ou arrasta um ficheiro de vídeo para a "drop zone" na página web.
O JavaScript (script.js) captura o ficheiro e faz uma requisição POST para o endpoint /upload do servidor Flask.
O servidor Flask (app.py) recebe o ficheiro e guarda-o na pasta uploads/.
A função extract_audio_from_video é chamada, usando MoviePy para criar uma versão .wav do áudio do vídeo.
A função reduce_audio_noise é chamada. Ela lê o ficheiro .wav, aplica o algoritmo de redução de ruído e guarda o resultado como um novo ficheiro _clean.wav.
A função recombine_video_with_audio é chamada. Ela pega o vídeo original (sem som) e o áudio limpo (_clean.wav) e junta-os, gerando um ficheiro de vídeo final (_final.mp4).
O servidor responde ao frontend com uma mensagem de sucesso em formato JSON, incluindo o nome do ficheiro de vídeo final.
O JavaScript recebe a resposta, exibe a mensagem de sucesso e ativa o botão "Descarregar Vídeo Processado".
Ao clicar no botão de download, o navegador faz uma requisição GET para o endpoint /download/<nome_do_ficheiro>.
O servidor Flask usa a função send_from_directory para enviar o ficheiro de vídeo final para o navegador, que o descarrega para o computador do utilizador.


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


7. Possíveis Melhorias Futuras
Processamento Assíncrono: Para vídeos longos, o processamento pode demorar. Implementar uma fila de tarefas (com Celery e Redis/RabbitMQ) permitiria que o utilizador fechasse o navegador e fosse notificado por e-mail quando o processo terminasse.
Contas de Utilizador: Adicionar um sistema de login para que os utilizadores possam ver o seu histórico de vídeos processados.
Pré-visualização do Resultado: Permitir que o utilizador ouça um trecho do áudio limpo ou veja uma parte do vídeo final antes de descarregar.
Remoção de Ruído de Vídeo: Adicionar algoritmos (usando OpenCV ou modelos de IA) para remover granulação e outros artefactos visuais do vídeo.
Mais Opções de Processamento: Permitir que o utilizador escolha a intensidade da remoção de ruído ou selecione tipos específicos de ruído a serem removidos.
Integração com IA Generativa (API Gemini): Como explorámos, adicionar funcionalidades como geração de títulos, descrições e tags para os vídeos processados.
