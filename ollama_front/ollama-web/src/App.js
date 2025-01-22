import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [error, setError] = useState('');

  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);

  const [voices, setVoices] = useState([]);
  const [activeSpeech, setActiveSpeech] = useState(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length) {
        setVoices(availableVoices);
      } else {
        setTimeout(loadVoices, 100);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
    setError('');
  };

  const handleTTS = () => {
    setIsTTSActive(!isTTSActive);
  };

  const detectLanguage = (text) => {
    const koreanRegex = /[\u3131-\uD79D]/; // 한글 범위
    return koreanRegex.test(text) ? 'ko-KR' : 'en-US';
  };

  const handleAsk = async (e) => {
    if (e) e.preventDefault();
    if (!question.trim()) {
      setError('질문을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    const newChatHistory = [...chatHistory, { user: question }];
    setChatHistory(newChatHistory);
    setQuestion('');

    try {
      const response = await axios.post('http://172.21.166.164:5000/ask', { question });
      const newAnswer = response.data.answer;
      setChatHistory((prevHistory) => [...prevHistory, { bot: newAnswer }]);

      if (isTTSActive && voices.length > 0) {
        const speech = new SpeechSynthesisUtterance(newAnswer);
        const language = detectLanguage(newAnswer);
        const selectedVoice = voices.find((voice) => voice.lang === language);
        speech.voice = selectedVoice || voices[0];
        window.speechSynthesis.speak(speech);
      }
    } catch (err) {
      setError('서버와의 통신에 문제가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleAsk();
    }
  };

  const handleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      if (inputRef.current) inputRef.current.focus();
    };

    recognition.onerror = (event) => {
      setError('음성 인식 오류가 발생했습니다. 마이크를 확인해 주세요.');
      console.error(event.error);
    };

    recognition.start();
  };

  const handleSpeechPlay = (text) => {
    if (activeSpeech) {
      window.speechSynthesis.cancel(); // 현재 음성을 정지합니다.
    }

    const speech = new SpeechSynthesisUtterance(text);
    const language = detectLanguage(text);
    const selectedVoice = voices.find((voice) => voice.lang === language);
    speech.voice = selectedVoice || voices[0];
    window.speechSynthesis.speak(speech);

    setActiveSpeech(speech); // 현재 음성 객체를 저장하여 나중에 정지할 수 있도록 합니다.
  };

  const handleSpeechStop = () => {
    if (activeSpeech) {
      window.speechSynthesis.cancel(); // 음성을 정지합니다.
      setActiveSpeech(null); // 정지된 후 음성 객체를 초기화합니다.
    }
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
    if (inputRef.current) inputRef.current.focus();
  }, [chatHistory]);

  return (
    <>
      <h1 className="app-header">Ollama 챗봇</h1>
      <div className="app-container">
        <div className="chat-container">
          <div className="chat-box" ref={chatBoxRef}>
            <div className="chat-history">
              {chatHistory.length === 0 ? (
                <div className="no-chat-message">대화 내용이 없습니다.</div>
              ) : (
                chatHistory.map((chat, index) => (
                  <div key={index} className="chat-message">
                    {chat.user && (
                      <div className="user-message">
                        <span className="user-icon">👤</span> {chat.user}
                      </div>
                    )}
                    {chat.bot && (
                      <div className="bot-message">
                        <div className="bot-message-text">
                          <span className="bot-icon">🤖</span>
                          <span>{chat.bot}</span>
                        </div>
                        <div className="speech-controls">
                          <button 
                            className="speech-play-button" 
                            onClick={() => handleSpeechPlay(chat.bot)}
                          >
                            🔊 음성 읽기
                          </button>
                          <button 
                            className="speech-stop-button" 
                            onClick={handleSpeechStop}
                          >
                            ⏹️ 정지
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <form className="chat-input-form" onSubmit={handleAsk}>
            <textarea
              ref={inputRef}
              value={question}
              onChange={handleQuestionChange}
              onKeyPress={handleKeyPress}
              placeholder="궁금한 점을 입력해 주세요..."
              rows="4"
              className="input-box"
              disabled={loading}
            />
            <button type="submit" className="send-button" disabled={loading}>
              {loading ? '전송 중...' : '전송'}
            </button>
          </form>

          <button onClick={handleSpeechRecognition} className="voice-button">
            🎤 음성 인식
          </button>

          <button onClick={handleTTS} className="tts-toggle-button">
            {isTTSActive ? '🔊 자동 음성 읽기 끄기' : '🔊 자동 음성 읽기 켜기'}
          </button>

          {loading && <div className="loading-message">답변을 생성 중입니다. 잠시만 기다려 주세요.</div>}
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </>
  );
}

export default App;
