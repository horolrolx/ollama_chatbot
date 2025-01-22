# NVIDIA CUDA 기반 이미지를 사용하여 GPU를 사용할 수 있게 설정
FROM nvidia/cuda:11.2.2-cudnn8-runtime-ubuntu20.04

# 필요한 라이브러리 설치
RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-dev \
    git \
    curl

# 작업 디렉토리 설정
WORKDIR /app

# requirements.txt 복사 및 필요한 Python 라이브러리 설치
RUN pip3 install torch==1.7.1+cu110 -f https://download.pytorch.org/whl/torch_stable.html
RUN pip3 install torchvision==0.8.2+cu110 -f https://download.pytorch.org/whl/torch_stable.html
RUN pip3 install ollama
RUN pip3 install Flask
RUN pip3 install requests
RUN pip3 install flask_cors
RUN pip3 install flask-socketio
RUN pip3 install gtts

# 애플리케이션 코드 복사
COPY . .

# 애플리케이션 실행
CMD ["python3", "app.py"]