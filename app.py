# app.py
import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import moviepy.editor as mp
import noisereduce as nr
import soundfile as sf
import numpy as np

# Inicializa a aplicação Flask
app = Flask(__name__)

# --- Configuração ---
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = os.path.abspath(UPLOAD_FOLDER)
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


# --- Funções Auxiliares de Processamento ---

def extract_audio_from_video(video_path):
    video_clip = None
    try:
        print(f"A iniciar extração de áudio de: {video_path}")
        video_clip = mp.VideoFileClip(video_path)
        base, ext = os.path.splitext(os.path.basename(video_path))
        audio_filename_wav = f"{base}_audio.wav"
        audio_path = os.path.join(app.config['UPLOAD_FOLDER'], audio_filename_wav)
        video_clip.audio.write_audiofile(audio_path, codec='pcm_s16le')
        print(f"Áudio extraído com sucesso para: {audio_path}")
        return audio_path
    except Exception as e:
        print(f"ERRO ao extrair áudio: {e}")
        return None
    finally:
        if video_clip:
            try:
                video_clip.close()
            except Exception as e_close:
                print(f"Erro ao fechar video_clip em extract_audio: {e_close}")

def reduce_audio_noise(audio_path):
    try:
        print(f"A iniciar redução de ruído para: {audio_path}")
        data, rate = sf.read(audio_path)
        
        if data.ndim > 1 and data.shape[1] > 0:
            print(f"AVISO: Áudio estéreo detetado. A processar o primeiro canal (canal 0).")
            data_to_process = data[:, 0]
        else:
            data_to_process = data

        num_samples = len(data_to_process)
        MIN_N_FFT_FOR_REDUCTION = 512
        DEFAULT_N_FFT = 2048

        if num_samples < MIN_N_FFT_FOR_REDUCTION:
            print(f"AVISO: Áudio muito curto ({num_samples} amostras). A usar áudio original.")
            return audio_path

        current_n_fft = DEFAULT_N_FFT
        if num_samples < DEFAULT_N_FFT:
            n_fft_val = 1
            while (n_fft_val * 2) <= num_samples:
                n_fft_val *= 2
            current_n_fft = max(MIN_N_FFT_FOR_REDUCTION, n_fft_val)
        
        print(f"Usando n_fft={current_n_fft} para redução de ruído.")
        reduced_noise_data = nr.reduce_noise(y=data_to_process, sr=rate, stationary=True,
                                             n_fft=current_n_fft, win_length=current_n_fft,
                                             hop_length=current_n_fft // 4)
        
        base, ext = os.path.splitext(audio_path)
        clean_audio_full_path = f"{base}_clean{ext}"
        sf.write(clean_audio_full_path, reduced_noise_data, rate)
        print(f"Áudio limpo guardado como: {clean_audio_full_path}")
        return clean_audio_full_path
    except Exception as e:
        print(f"ERRO ao reduzir ruído: {e}")
        return None

def recombine_video_with_audio(original_video_path, clean_audio_path):
    original_video_clip = None
    clean_audio_clip = None
    final_video_clip = None # Para garantir que é fechado no finally
    try:
        print(f"A iniciar recombinação do vídeo '{original_video_path}' com áudio '{clean_audio_path}'")
        original_video_clip = mp.VideoFileClip(original_video_path)
        clean_audio_clip = mp.AudioFileClip(clean_audio_path)
        final_video_clip = original_video_clip.set_audio(clean_audio_clip)

        base, ext = os.path.splitext(os.path.basename(original_video_path))
        final_video_filename = f"{base}_final{ext}"
        final_video_path = os.path.join(app.config['UPLOAD_FOLDER'], final_video_filename)

        final_video_clip.write_videofile(final_video_path, codec="libx264", audio_codec="aac")
        print(f"Vídeo final guardado como: {final_video_path}")
        return final_video_path
    except Exception as e:
        print(f"ERRO ao recombinar vídeo e áudio: {e}")
        return None
    finally:
        if original_video_clip:
            try: original_video_clip.close()
            except Exception as e_close: print(f"Erro ao fechar original_video_clip: {e_close}")
        if clean_audio_clip:
            try: clean_audio_clip.close()
            except Exception as e_close: print(f"Erro ao fechar clean_audio_clip: {e_close}")
        if final_video_clip: # O final_video_clip também é um recurso que deve ser fechado
             try: final_video_clip.close()
             except Exception as e_close: print(f"Erro ao fechar final_video_clip: {e_close}")


# --- Rotas da Aplicação ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_video():
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum ficheiro enviado'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nenhum ficheiro selecionado'}), 400

    if file:
        original_filename = secure_filename(file.filename)
        original_video_save_path = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
        file.save(original_video_save_path)
        print(f"Ficheiro '{original_filename}' guardado em '{original_video_save_path}'")

        extracted_audio_path = extract_audio_from_video(original_video_save_path)
        if not extracted_audio_path:
            return jsonify({'error': 'Ficheiro guardado, mas erro ao extrair áudio.'}), 500

        clean_audio_path = reduce_audio_noise(extracted_audio_path)
        if clean_audio_path is None: # Erro real na redução
            return jsonify({'error': 'Áudio extraído, mas erro na redução de ruído.'}), 500
        # Se clean_audio_path == extracted_audio_path, a redução foi pulada.

        final_video_path = recombine_video_with_audio(original_video_save_path, clean_audio_path)
        if not final_video_path:
            return jsonify({'error': 'Processamento de áudio concluído, mas erro ao recombinar com vídeo.'}), 500
        
        final_message = 'Processamento completo! Vídeo final com áudio melhorado gerado.'
        if clean_audio_path == extracted_audio_path:
             final_message = 'Processamento completo! Vídeo final gerado. Redução de ruído de áudio foi pulada (áudio muito curto).'

        return jsonify({
            'message': final_message,
            'original_video': original_filename,
            'final_video_filename': os.path.basename(final_video_path)
        }), 200
    
    return jsonify({'error': 'Erro desconhecido no upload'}), 500

# --- NOVO: Rota para Download ---
@app.route('/download/<path:filename>')
def download_file(filename):
    """
    Serve um ficheiro da pasta UPLOAD_FOLDER para download.
    """
    try:
        # send_from_directory lida com a segurança de caminhos e envia o ficheiro.
        # as_attachment=True força o navegador a descarregar em vez de tentar exibir.
        print(f"A tentar servir para download: {filename} da pasta {app.config['UPLOAD_FOLDER']}")
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)
    except FileNotFoundError:
        print(f"ERRO: Ficheiro não encontrado para download: {filename}")
        return jsonify({'error': 'Ficheiro não encontrado'}), 404


# --- Executar a Aplicação ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)

