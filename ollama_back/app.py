from flask import Flask, request, jsonify
import requests
import sys
from flask_cors import CORS  # CORS 설정
import torch  # PyTorch를 사용해 GPU 확인 (필요시)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://172.21.166.164:3000"}})  # React 앱 주소 설정

# UTF-8 인코딩을 기본으로 설정
sys.stdout.reconfigure(encoding='utf-8')

# 서버 시작 시 GPU 사용 여부 확인
def check_gpu_usage():
    if torch.cuda.is_available():
        print(f"GPU 사용 가능: {torch.cuda.get_device_name(0)}")
    else:
        print("GPU 사용 불가능. CPU 모드로 작동 중...")

check_gpu_usage()  # GPU 상태 확인

def call_ollama(question):
    # Ollama API 호출
    url = "http://host.docker.internal:11434/v1/chat/completions"  # Ollama API 엔드포인트 (여기서는 예시 URL입니다)

    headers = {"Content-Type": "application/json", "Authorization": "Bearer your_api_key_here"}
    data = {
        "messages": [{"role": "user", "content": question}],
        "model": "gemma2:2b"  # 예시로 사용한 모델명
    }

    try:
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()  # 응답 상태 코드가 200번대가 아닌 경우 예외를 발생시킴
    except requests.exceptions.RequestException as e:
        print(f"Error during API call: {e}")
        return "Ollama API 호출 실패. 잠시 후 다시 시도해 주세요."

    if response.status_code == 200:
        response_data = response.json()
        answer = response_data.get('choices', [{}])[0].get('message', {}).get('content', '답을 받을 수 없습니다.')
        return answer
    else:
        return "Ollama API 호출 실패. 잠시 후 다시 시도해 주세요."

@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    question = data.get('question', '')  # React에서 전달받은 질문

    if not question:
        return jsonify({"error": "No question provided"}), 400

    # Ollama API 호출
    answer = call_ollama(question)
    print(f"Received answer from Ollama: {answer}")  # 응답 로그 추가
    return jsonify({"answer": answer})  # Ollama의 응답 반환

if __name__ == '__main__':
    # Flask 서버를 실행하기 전에 GPU를 확인합니다.
    check_gpu_usage()
    
    # 서버 실행 (GPU가 활용되는 환경에서 모델을 실행합니다)
    app.run(debug=True, host='0.0.0.0', port=5000)