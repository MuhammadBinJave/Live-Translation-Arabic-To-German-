import React, { useState, useEffect } from 'react';

function App() {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [listening, setListening] = useState(false);
  const [voices, setVoices] = useState([]);

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const startListening = () => {
    recognition.lang = "ar-SA";
    recognition.interimResults = false; // sirf final results
    recognition.continuous = true;      // mic continuously sunega

    setListening(true);
    let finalTranscript = "";

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if(event.results[i].isFinal){
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      setInputText(finalTranscript.trim());
    };

    recognition.onerror = (err) => {
      console.error("Speech recognition error", err);
      setListening(false);
    };

    // Mic khud stop karne ka mechanism (agar 3 sec user bolna band kare)
    let stopTimer;
    recognition.onstart = () => {
      stopTimer = setInterval(() => {
        if(finalTranscript !== ""){
          recognition.stop();
          clearInterval(stopTimer);

          // Translation & speak
          translateAndSpeak(finalTranscript.trim());
        }
      }, 3000); // 3 seconds pause detect
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const translateAndSpeak = async (text) => {
    if(!text) return;
    const q = encodeURIComponent(text);
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${q}&langpair=ar|de`);
    const data = await response.json();
    const germanText = data.responseData?.translatedText || "Translation error";
    setTranslatedText(germanText);

    // Speak
    const synth = window.speechSynthesis;
    const germanVoice = voices.find(v => v.lang.startsWith("de")) || voices[0];
    const utterance = new SpeechSynthesisUtterance(germanText);
    utterance.voice = germanVoice;
    utterance.lang = germanVoice.lang;
    synth.speak(utterance);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <h1>Live Arabic → German Translation</h1>

      <button onClick={startListening} disabled={listening}>
        {listening ? "Listening..." : "🎙️ Start Speaking"}
      </button>

      <div style={{ marginTop: '20px' }}>
        <textarea
          rows="3"
          cols="50"
          placeholder='Your Arabic text will appear here...'
          value={inputText}
          readOnly
        />

        <div style={{ marginTop: 12 }}>
          <h2>Translated (German)</h2>
          <p>{translatedText}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
