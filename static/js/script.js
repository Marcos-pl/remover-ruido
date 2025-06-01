// static/js/script.js

// --- Seletores de Elementos DOM ---
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseButton = document.getElementById('browseButton');
const fileNameDisplay = document.getElementById('fileName');
const processButton = document.getElementById('processButton');
const downloadButton = document.getElementById('downloadButton');
const cancelUploadOrProcessButton = document.getElementById('cancelUploadOrProcessButton');
const spinner = document.getElementById('spinner');
const statusMessage = document.getElementById('statusMessage');

// Elementos do estado inicial e de progresso
const uploadInitialState = document.getElementById('upload-initial-state');
const uploadProgressState = document.getElementById('upload-progress-state');

// --- NOVO: Seletores para Otimizador de Conteúdo IA ---
const optimizeContentButton = document.getElementById('optimizeContentButton');
const geminiOptimizerSection = document.getElementById('geminiOptimizerSection');
const videoSummaryInput = document.getElementById('videoSummaryInput');
const generateSuggestionsButton = document.getElementById('generateSuggestionsButton');
const geminiSpinner = document.getElementById('geminiSpinner');
const geminiResults = document.getElementById('geminiResults');


let currentFile = null;
let lastProcessedFilename = null; // Para guardar o nome do ficheiro final para download

// --- Funções de Eventos ---
if (document.getElementById('currentYear')) {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}

if (browseButton) {
    browseButton.addEventListener('click', () => {
        fileInput.click();
    });
}

if (fileInput) {
    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

if (dropZone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });
    dropZone.addEventListener('drop', (event) => {
        const dt = event.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFile(files[0]);
        }
    }, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleFile(file) {
    if (!file.type.startsWith('video/')) {
        showStatusMessage('Erro: Por favor, selecione um ficheiro de vídeo.', 'error');
        resetUploadState();
        return;
    }
    currentFile = file;
    lastProcessedFilename = null;
    updateUIForNewFile(file.name);

    // Esconde a zona de drop e mostra a zona de progresso/ações
    if (uploadInitialState) uploadInitialState.style.display = 'none';
    if (uploadProgressState) uploadProgressState.style.display = 'block';
}

if (processButton) {
    processButton.addEventListener('click', () => {
        if (!currentFile) {
            showStatusMessage('Nenhum ficheiro selecionado para processar.', 'error');
            return;
        }
        updateUIForProcessing();
        const formData = new FormData();
        formData.append('file', currentFile);

        fetch('/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.error || `Erro do servidor: ${response.status}`);
                }).catch(() => {
                    throw new Error(`Erro do servidor: ${response.status} ${response.statusText}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Sucesso do servidor (upload):', data);
            lastProcessedFilename = data.final_video_filename;
            updateUIForSuccess(data.message);
        })
        .catch(error => {
            console.error('Erro no fetch /upload:', error);
            updateUIForError(error.message || 'Ocorreu um erro ao enviar/processar o ficheiro.');
        });
    });
}

if (downloadButton) {
    downloadButton.addEventListener('click', () => {
        if (lastProcessedFilename) {
            const downloadUrl = `/download/${lastProcessedFilename}`;
            showStatusMessage(`A iniciar o download de ${lastProcessedFilename}...`, 'info');
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', lastProcessedFilename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            showStatusMessage('Nenhum ficheiro processado disponível para download.', 'warning');
        }
    });
}

// --- NOVO: Lógica para Otimizador de Conteúdo IA ---
if (optimizeContentButton) {
    optimizeContentButton.addEventListener('click', () => {
        if (geminiOptimizerSection) {
            // Alterna a visibilidade da secção do otimizador
            geminiOptimizerSection.classList.toggle('hidden');
            if (!geminiOptimizerSection.classList.contains('hidden')) {
                videoSummaryInput.focus(); // Foca no textarea quando aberto
            }
        }
    });
}

if (generateSuggestionsButton) {
    generateSuggestionsButton.addEventListener('click', () => {
        const summary = videoSummaryInput.value.trim();
        // O nome do ficheiro pode ser útil para o contexto da IA, mas opcional
        const videoFilename = currentFile ? currentFile.name : 'vídeo genérico'; 

        if (geminiSpinner) geminiSpinner.classList.remove('hidden');
        if (geminiResults) geminiResults.innerHTML = ''; // Limpa resultados anteriores
        
        // Prepara os dados para enviar ao backend
        const payload = {
            summary: summary,
            filename: videoFilename 
            // Poderíamos adicionar mais contexto aqui se necessário (ex: duração, tipo de vídeo)
        };

        fetch('/generate_suggestions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
        .then(response => {
            if (geminiSpinner) geminiSpinner.classList.add('hidden');
            if (!response.ok) {
                 return response.json().then(errData => {
                    throw new Error(errData.error || `Erro do servidor (Gemini): ${response.status}`);
                }).catch(() => {
                    throw new Error(`Erro do servidor (Gemini): ${response.status} ${response.statusText}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Sugestões da API Gemini:', data);
            displayGeminiResults(data.suggestions);
        })
        .catch(error => {
            if (geminiSpinner) geminiSpinner.classList.add('hidden');
            console.error('Erro ao gerar sugestões:', error);
            if (geminiResults) {
                geminiResults.innerHTML = `<p class="text-red-600 font-semibold">Erro ao gerar sugestões: ${error.message}</p>`;
            }
        });
    });
}

function displayGeminiResults(suggestions) {
    if (!geminiResults || !suggestions) return;

    let htmlContent = '';

    if (suggestions.titles && suggestions.titles.length > 0) {
        htmlContent += '<h4>Sugestões de Títulos:</h4><ul>';
        suggestions.titles.forEach(title => {
            htmlContent += `<li>${escapeHtml(title)}</li>`;
        });
        htmlContent += '</ul>';
    }

    if (suggestions.descriptions && suggestions.descriptions.length > 0) {
        htmlContent += '<h4>Sugestões de Descrições:</h4>';
        suggestions.descriptions.forEach(desc => {
            // Envolve cada descrição num bloco para melhor formatação
            htmlContent += `<div class="description-block"><p>${escapeHtml(desc).replace(/\n/g, '<br>')}</p></div>`;
        });
    }

    if (suggestions.tags && suggestions.tags.length > 0) {
        htmlContent += '<h4>Sugestões de Tags:</h4><p>';
        htmlContent += suggestions.tags.map(tag => escapeHtml(tag)).join(', ');
        htmlContent += '</p>';
    }
    
    if (htmlContent === '') {
        htmlContent = '<p>Nenhuma sugestão foi gerada. Tente refinar o seu resumo.</p>';
    }

    geminiResults.innerHTML = htmlContent;
}

// Função simples para escapar HTML e prevenir XSS
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}


// --- Funções de Atualização da Interface (UI) ---
function updateUIForNewFile(fileName) {
    if(fileNameDisplay) fileNameDisplay.textContent = `Ficheiro selecionado: ${fileName}`;
    if(fileNameDisplay) fileNameDisplay.style.display = 'block';
    if(processButton) processButton.style.display = 'block';
    
    // Esconde outros botões e secções
    if(downloadButton) downloadButton.style.display = 'none';
    if(optimizeContentButton) optimizeContentButton.style.display = 'none';
    if(geminiOptimizerSection) geminiOptimizerSection.classList.add('hidden'); // Garante que a secção IA está escondida
    if(geminiResults) geminiResults.innerHTML = ''; // Limpa resultados IA anteriores
    if(videoSummaryInput) videoSummaryInput.value = ''; // Limpa o resumo anterior

    if(cancelUploadOrProcessButton) cancelUploadOrProcessButton.style.display = 'none'; // Ou 'block' se quiser permitir cancelar o upload
    if(spinner) spinner.style.display = 'none';
    if(statusMessage) statusMessage.style.display = 'none';
}

function updateUIForProcessing() {
    if(processButton) processButton.style.display = 'none';
    if(downloadButton) downloadButton.style.display = 'none';
    if(optimizeContentButton) optimizeContentButton.style.display = 'none';
    if(geminiOptimizerSection) geminiOptimizerSection.classList.add('hidden');
    if(spinner) spinner.style.display = 'block';
    showStatusMessage('A enviar e a processar o vídeo... Isto pode demorar.', 'info');
}

function updateUIForSuccess(message) {
    if(spinner) spinner.style.display = 'none';
    showStatusMessage(message, 'success');
    if(downloadButton && lastProcessedFilename) downloadButton.style.display = 'block';
    if(optimizeContentButton) optimizeContentButton.style.display = 'block'; // Mostra o botão de otimização IA
}

function updateUIForError(message) {
    if(spinner) spinner.style.display = 'none';
    showStatusMessage(message, 'error');
    if(processButton) processButton.style.display = 'block'; 
}

function showStatusMessage(message, type = 'info') {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    statusMessage.className = 'status-message mt-4 text-base'; // Reset classes
    switch (type) {
        case 'error': statusMessage.classList.add('text-red-600', 'font-semibold'); break;
        case 'success': statusMessage.classList.add('text-green-600', 'font-semibold'); break;
        case 'warning': statusMessage.classList.add('text-yellow-600', 'font-semibold'); break;
        default: statusMessage.classList.add('text-blue-600'); break;
    }
}
        
function resetUploadState() {
    currentFile = null;
    lastProcessedFilename = null;
    if(fileInput) fileInput.value = '';
    
    if(uploadInitialState) uploadInitialState.style.display = 'block';
    if(uploadProgressState) uploadProgressState.style.display = 'none';
    
    updateUIForNewFile(''); // Isto já trata de esconder os botões e limpar displays
    if(fileNameDisplay) fileNameDisplay.style.display = 'none';
}
