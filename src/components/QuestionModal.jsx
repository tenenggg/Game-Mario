import { useState } from 'react';

const QuestionModal = ({ question, onAnswer, onClose }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!question) return null;

  const handleSubmit = () => {
    if (selectedOption === null) return;
    
    const correct = selectedOption === question.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
  };

  const handleContinue = () => {
    onAnswer(isCorrect);
    setSelectedOption(null);
    setShowResult(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content question-modal">
        <h2 className="modal-title">💼 Finance Checkpoint</h2>
        
        {!showResult ? (
          <>
            <p className="question-text">{question.question}</p>
            
            <div className="options-container">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-button ${selectedOption === index ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(index)}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                  <span className="option-text">{option}</span>
                </button>
              ))}
            </div>
            
            <button 
              className="submit-button"
              onClick={handleSubmit}
              disabled={selectedOption === null}
            >
              Submit Answer
            </button>
          </>
        ) : (
          <div className="result-container">
            <div className={`result-header ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? (
                <>
                  <span className="result-icon">✅</span>
                  <h3>Correct!</h3>
                  <p className="reward-text">+4 Coins! 🪙</p>
                </>
              ) : (
                <>
                  <span className="result-icon">❌</span>
                  <h3>Incorrect</h3>
                  <p className="penalty-text">-1 Helmet ⛑️</p>
                </>
              )}
            </div>
            
            <div className="explanation-box">
              <h4>Explanation:</h4>
              <p>{question.explanation}</p>
              {!isCorrect && (
                <p className="correct-answer">
                  <strong>Correct answer:</strong> {question.options[question.correctAnswer]}
                </p>
              )}
            </div>
            
            <button 
              className="continue-button"
              onClick={handleContinue}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionModal;
