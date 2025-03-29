import React, { useState, useEffect, useRef } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './App.css';

// Component to display individual tweets
const Tweet = ({ id, tweet, duration, wordCount, regDate, onDelete }) => {
    const [copyButtonText, setCopyButtonText] = useState("복사"); // State to track copy button text

   // Handle copy to clipboard
    const handleCopy = () => {
        const textToCopy = `${regDate} / ${wordCount} words / ${duration} minutes\n\n${tweet}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopyButtonText("복사완료");
            setTimeout(() => {
                setCopyButtonText("복사");
            }, 1000); // Reset button text after 1 second
        }).catch((error) => {
            console.error("Error copying text: ", error);
        });
    };

    const handleDelete = () => {
        // localStorage에서 journalIndex를 불러옵니다.
        const storedIndex = JSON.parse(localStorage.getItem("journalIndex")) || [];
        // 삭제할 id를 제외한 새로운 배열을 생성합니다.
        const updatedIndex = storedIndex.filter((itemId) => itemId !== id);
        // updatedIndex 배열을 다시 localStorage에 저장합니다.
        if (updatedIndex.length > 0) {
            localStorage.setItem("journalIndex", JSON.stringify(updatedIndex));
        } else {
            localStorage.removeItem("journalIndex");
        }

        localStorage.removeItem(`journal_${id}`);

        onDelete(id);
    };

    return (
        <div className="tweet">
            <p className="tweet-info">
                {regDate} / {wordCount} words / {duration} minutes
                <button className="delete-button" onClick={handleDelete}>X</button>
            </p>

            {/* 개행문자도 처리해줘서 입력한 그대로 보이게 한다. */}
            {tweet.split("\n").map((line, index) => (
                <span key={index}>
                    {line}
                    <br />
                </span>
            ))}

            <br />
            <button onClick={handleCopy} className="copy-button">{copyButtonText}</button> {/* Copy button */}
        </div>
    );
};

// Main App component
function App() {
    const [tweetText, setTweetText] = useState('');
    const [tweets, setTweets] = useState([]);
    const [tweetCount, setTweetCount] = useState(0); // To track tweet count
    const [user, setUser] = useState(null);
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isInputHidden, setIsInputHidden] = useState(true);
    const inputRef = useRef(null);
    const [isBlinking, setIsBlinking] = useState(false);
    const [copyButtonText, setCopyButtonText] = useState("복사"); // State to track copy button text
    const [isWriting, setIsWriting] = useState(false);

    // Stopwatch effect
    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    // Check login status when component mounts
    useEffect(() => {
        /*
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }

        // Load data.
        const storedIndex = JSON.parse(localStorage.getItem("journalIndex")) || [];
        const loadedJournals = storedIndex.map((id) => {
            const data = JSON.parse(localStorage.getItem(`journal_${id}`)); // 먼저 데이터를 가져옵니다
            if (data) {
                return { ...data }; // 객체를 반환합니다
            } else {
                return { id:id, regDate:"", duration:0, wordCount:0, text:"No data." };
            }
        }).sort((a, b) => b.id - a.id);
        
        setTweets(loadedJournals);
        setTweetCount(loadedJournals.length);
        */

        setIsInputHidden(false);
    }, []);

    const handleDeleteTweet = (id) => {
        // id로 삭제할 tweet을 찾고 상태에서 제거
        const updatedTweets = tweets.filter(tweet => tweet.id !== id);
        setTweets(updatedTweets); // tweets 상태를 업데이트
        setTweetCount(updatedTweets.length);
    };

    const handleTweetChange = (e) => {
        const newText = e.target.value;
        setTweetText(newText);

        // Start stopwatch when first character is typed
        if (newText.length >= 1 && !isRunning) {
            setIsRunning(true);
            setIsWriting(true);
        }

        // Reset stopwatch when the text field is cleared
        if (newText.length === 0) {
            setTime(0);
            setIsRunning(false);
            setIsWriting(false);
        }
    };

    const handleFinishWriting = () => {
        setIsRunning(false);
        setIsBlinking(true);
        setTimeout(() => {
            setIsBlinking(false);
        }, 1000);
    }

    const handleCopyCurrentJournal = () => {
        if (tweetText.length === 0) {
            return;
        }

        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
        const duration = Math.round(time / 60);
        const wordCount = tweetText.split(/\s+/).filter(Boolean).length; // Count words in the tweet

        const textToCopy = `${formattedDate} / ${wordCount} words / ${duration} minutes\n\n${tweetText}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopyButtonText("복사완료");
            setTimeout(() => {
                setCopyButtonText("복사");
            }, 1000); // Reset button text after 1 second
        }).catch((error) => {
            console.error("Error copying text: ", error);
        });
    }

    const handleRewrite = () => {
        setTime(0);
        inputRef.current.focus();
        setIsRunning(false);
        setTweetText('');
    }

    const handlePostTweet = () => {
        if (tweetText.trim()) {
            const newId = Date.now(); // 현재 시간을 ID로 사용

            const now = new Date();
            const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

            const minutes = Math.round(time / 60);
            const wordCount = tweetText.split(/\s+/).filter(Boolean).length; // Count words in the tweet
            setTweets([{ id:newId, text: tweetText, duration: minutes, wordCount: wordCount, regDate: formattedDate }, ...tweets]);
            setTweetText('');
            setTweetCount(tweetCount + 1);
            setTime(0);
            setIsRunning(false);

            //////////////////////////////////////////////////////
            // Save to local storage.
            const saveData = { id:newId, regDate:formattedDate, wordCount:wordCount, duration:minutes, text:tweetText };
            localStorage.setItem(`journal_${newId}`, JSON.stringify(saveData)); // 개별적으로 저장

            // 인덱스 업데이트
            const storedIndex = JSON.parse(localStorage.getItem("journalIndex")) || [];
            const updatedIndex = [...storedIndex, newId];
            localStorage.setItem("journalIndex", JSON.stringify(updatedIndex));

            setIsInputHidden(true);
        }
    };

    const handleAddNewJournal = () => {
        setIsInputHidden(!isInputHidden);

        setTimeout(() => {
            inputRef.current.focus();
        }, 10); // Reset button text after 1 second
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    // Format time for display
    const formatTime = () => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const wordCount = tweetText.split(/\s+/).filter(Boolean).length;

    return (
        <div className="app">
            <h1>영어 단어수 세기123</h1>

            {/* <button className="new-post-button" onClick={handleAddNewJournal}>{isInputHidden ? "Add new journal" : "Close"}</button> */}

            {/* Show Welcome Message if Logged In, Otherwise Show Login Button */}
            {/*}
            <div className="login-section">
                {!user ? (
                    <GoogleLogin
                        onSuccess={(credentialResponse) => {
                            // Decode the JWT token
                            const decoded = jwtDecode(credentialResponse.credential);
                            console.log('Login Success:', decoded);
                            setUser(decoded);
                            // Save user data to localStorage
                            localStorage.setItem('user', JSON.stringify(decoded));
                        }}
                        onError={() => {
                            console.log('Login Failed');
                        }}
                    />
                ) : (
                    <div className="user-profile">
                        <img 
                            src={user.picture} 
                            alt="Profile" 
                            className="profile-picture"
                        />
                        <p>Welcome, {user.name}!</p>
                        <button onClick={handleLogout} className="logout-button">Logout</button>
                    </div>
                )}
            </div>
            */}

            <div className="tweet-input" style={{ display: isInputHidden ? "none" : "block" }}>
                <div className={isBlinking ? "blinking" : "stopwatch"}>
                    {<span>Writing time: {formatTime()}</span>}
                </div>
                <div className={isBlinking ? "blinking" : "word-count"}>
                    <span>Word count: {wordCount}</span> {/* Display word count */}
                </div>
                <textarea
                    ref={inputRef}
                    value={tweetText}
                    onChange={handleTweetChange}
                    placeholder="글을 입력하면 시간이 흐르고 단어수를 자동으로 세어줍니다.&#13;&#10;200단어 이상의 영어 일기를 매일매일 써보세요.&#13;&#10;어느정도 쌓이면 글쓰는 시간이 빨라졌다는 것을 느끼게 될 거예요.&#13;&#10;다 쓴 후에는 '복사'버튼을 눌러 자신의 블로그나 카페에 올려서 매일매일 기록해 보세요."
                    maxLength="3000" // Twitter's character limit
                />

                <div className="button-container">
                    <div className="left-buttons">
                        <button onClick={handleFinishWriting}>글쓰기 완료</button>
                        <button onClick={handleCopyCurrentJournal} className={isWriting ? "button" : "button-disabled"}>{copyButtonText}</button> {/* Copy button */}
                    </div>
                    <button onClick={handleRewrite} className="delete-button right-button">지우고 다시쓰기</button>
                </div>
                <br /> <br /><br />
            </div>

            {/*}
            <div className={tweetCount === 0 ? "tweet-feed-center" : "tweet-feed-left"}>
                {tweetCount === 0 ? (
                    <p>No Journals</p>
                ) : tweetCount === 1 ? (
                    <h3>{tweetCount} Journal</h3>
                ) : (
                    <h3>{tweetCount} Journals</h3>
                )}

                {tweets.length === 0 ? (
                    <p>Start writing your first one!</p> ) : ("") }
            </div>

            <div className="tweet-feed">
                {tweets.length !== 0 ? (
                    tweets.map((tweet, index) => (
                        <Tweet 
                            key={index} 
                            id={tweet.id}
                            tweet={tweet.text} 
                            duration={tweet.duration} 
                            wordCount={tweet.wordCount} // Pass word count to tweet component
                            regDate={tweet.regDate}
                            onDelete={handleDeleteTweet}  // 부모 컴포넌트의 삭제 함수 전달
                        />
                    ))
                ) : ("") }
            </div>
            */}
        </div>
    );
}

export default App;
