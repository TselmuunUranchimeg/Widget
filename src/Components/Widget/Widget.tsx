import {
    useState,
    useRef,
    useEffect,
    ChangeEvent,
    Dispatch,
    SetStateAction,
} from "react";
import { io, Socket } from "socket.io-client";
import parser from "socket.io-msgpack-parser";
import { v4 } from "uuid";
import widgetSvg from "./assets/Widget.svg";
import closeSvg from "./assets/Close.svg";
import companyNameSvg from "./assets/CompanyName.svg";
import sendSvg from "./assets/Send.svg";
import userIconSvg from "./assets/UserIcon.svg";
import aiResponseIcon from "./assets/AIResponseIcon.svg";
import likeSvg from "./assets/Like.svg";
import dislikeSvg from "./assets/Dislike.svg";
import feedbackCloseSvg from "./assets/FeedbackClose.svg";
import sameSvg from "./assets/Same.svg";
import "./Widget.css";

interface SocketParametersInterface {
    path: string;
    query: {};
}

interface WidgetInterface {
    parameters: SocketParametersInterface;
}

interface MessageInterface {
    isUser: boolean;
    text: string;
    id: string;
}

interface MessageComponentInterface {
    value: MessageInterface;
    socket?: Socket;
    receivingMessage: boolean;
}

interface ResponseMessageInterface {
    id: string;
    message: string;
    role: string;
    finish_reason?: string;
    object?: string;
}

interface TopicsMessageInterface {
    title: string;
    description: string;
    message: string;
}

interface TopicsInterface {
    data: TopicsMessageInterface;
    socket: Socket;
    setMessages: Dispatch<SetStateAction<MessageInterface[]>>;
    setReceivingMessage: Dispatch<SetStateAction<boolean>>;
}

const Topic = ({
    data,
    socket,
    setMessages,
    setReceivingMessage,
}: TopicsInterface) => {
    return (
        <div
            className="topic"
            onClick={() => {
                const id = v4();
                setMessages((prev) => {
                    if (!prev.find((v) => v.id === id)) {
                        prev.push({
                            id,
                            isUser: true,
                            text: data.description,
                        });
                        prev.push({
                            isUser: false,
                            text: "",
                            id: `response-${id}`,
                        });
                    }
                    return prev;
                });
                socket.emit("sendMessage", {
                    id,
                    message: data.description,
                });
                setReceivingMessage(true);
            }}
        >
            <h1>{data.title}</h1>
            <p>{data.description}</p>
        </div>
    );
};

const Message = ({ value, socket, receivingMessage }: MessageComponentInterface) => {
    if (value.isUser) {
        return (
            <div className="message" id={value.id}>
                <div className="message-icon">
                    <img src={userIconSvg} alt="User icon" />
                </div>
                <div className="message-text">
                    <p>{value.text}</p>
                </div>
            </div>
        );
    }

    const [visible, setVisible] = useState(false);
    const [worse, setWorse] = useState(false);
    const [reasons, setReasons] = useState<Array<string>>([]);
    const [message, setMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const pTag = useRef<null | HTMLParagraphElement>(null);

    enum Feedback {
        Better = "better",
        Worse = "worse",
        Same = "same",
    }

    useEffect(() => {
        if (visible) {
            const messages = document.getElementsByClassName("message");
            let height = 0;
            for (let i = 0; i < messages.length; i++) {
                if (messages[i].id === value.id) {
                    let tabBody =
                        document.getElementsByClassName("tab-body")[0];
                    tabBody.scrollTop =
                        height +
                        messages[i].scrollHeight - tabBody.clientHeight + (i === messages.length - 1 ? 70 : 60);
                    return;
                }
                height += messages[i].clientHeight;
            }
        }
    }, [visible]);

    const handleClick = (target: boolean) => {
        if (!submitted && !receivingMessage) {
            setVisible(true);
            if (!target) {
                setWorse(true);
            } else {
                setWorse(false);
            }
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setReasons((prev) => {
            if (e.target.checked) {
                if (!prev.find((v) => v === e.target.value)) {
                    prev = [...prev, e.target.value];
                }
            } else {
                prev = prev.filter((v) => v !== e.target.value);
            }
            return prev;
        });
    };

    const sendFeedback = (feedback: Feedback) => {
        socket?.emit("sendMessage", {
            id: pTag.current?.id,
            object: "feedback",
            category: feedback,
        });
        setSubmitted(true);
        setVisible(false);
    };

    return (
        <div className="message" id={value.id}>
            <div className="message-icon">
                <img src={aiResponseIcon} alt="AI icon" />
            </div>
            <div className="message-text">
                <p className="actual-text" ref={pTag}>
                    {value.text}
                </p>
                <div className="feedback">
                    <div
                        className="feedback-button"
                        style={{
                            display: visible ? "none" : "flex",
                        }}
                    >
                        <img
                            src={likeSvg}
                            alt="Like"
                            onClick={() => handleClick(true)}
                            className="feedback-button-like"
                        />
                        <img
                            src={dislikeSvg}
                            alt="Dislike"
                            className="feedback-button-dislike"
                            onClick={() => handleClick(false)}
                        />
                    </div>
                    <div
                        className="feedback-tab"
                        style={{
                            display: visible ? "flex" : "none",
                        }}
                    >
                        <div className="feedback-header">
                            <p>
                                {worse
                                    ? "Provide additional feedback"
                                    : "Was this response better or worse?"}
                            </p>
                            <img
                                src={feedbackCloseSvg}
                                alt="Close tab"
                                onClick={() => {
                                    setVisible(false);
                                }}
                            />
                        </div>
                        <div className="feedback-options">
                            <div
                                className="feedback-options-option"
                                onClick={() => {
                                    sendFeedback(Feedback.Better);
                                }}
                            >
                                <img
                                    src={likeSvg}
                                    alt="Better"
                                    style={{
                                        marginBottom: "5px",
                                    }}
                                />
                                <p>Better</p>
                            </div>
                            <div
                                className="feedback-options-option"
                                onClick={() => {
                                    setWorse(true);
                                }}
                                style={{
                                    backgroundColor: worse ? "#636466" : "",
                                }}
                            >
                                <img
                                    src={dislikeSvg}
                                    alt="Worse"
                                    style={{
                                        marginTop: "8px",
                                    }}
                                />
                                <p>Worse</p>
                            </div>
                            <div
                                className="feedback-options-option"
                                onClick={() => {
                                    sendFeedback(Feedback.Same);
                                }}
                            >
                                <img src={sameSvg} alt="Same" />
                                <p>Same</p>
                            </div>
                        </div>
                        <div
                            className="feedback-reason"
                            style={{
                                display: worse ? "block" : "none",
                            }}
                        >
                            <textarea
                                rows={3}
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.currentTarget.value);
                                }}
                                className="feedback-worse-textarea"
                                placeholder="What was the issue with the response? How could it be improved?"
                            />
                            <div className="feedback-worse-categories">
                                <div className="feedback-worse-option">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => {
                                            handleChange(e);
                                        }}
                                        value="This is harmful / unsafe"
                                        id="reason1"
                                        name="reason1"
                                    />
                                    <label htmlFor="reason1">
                                        This is harmful / unsafe
                                    </label>
                                </div>
                                <div className="feedback-worse-option">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => {
                                            handleChange(e);
                                        }}
                                        value="This isn't true"
                                        id="reason2"
                                        name="reason2"
                                    />
                                    <label htmlFor="reason2">
                                        This isn't true
                                    </label>
                                </div>
                                <div className="feedback-worse-option">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => {
                                            handleChange(e);
                                        }}
                                        value="This isn't helpful"
                                        id="reason3"
                                        name="reason3"
                                    />
                                    <label htmlFor="reason3">
                                        This isn't helpful
                                    </label>
                                </div>
                            </div>
                            <div className="feedback-worse-submit">
                                <button
                                    onClick={() => {
                                        if (!receivingMessage && !submitted) {
                                            socket?.emit("sendMessage", {
                                                message,
                                                id: pTag.current?.id,
                                                object: "feedback",
                                                choices: reasons,
                                                category: Feedback.Worse,
                                            });
                                            setSubmitted(true);
                                        }
                                    }}
                                    className="feedback-submit-button"
                                >
                                    Submit feedback
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Widget = ({ parameters }: WidgetInterface) => {
    const { query, path } = parameters;
    const socketRef = useRef<Socket>();
    const [state, setState] = useState("");
    const [tabVisible, setTabVisible] = useState(false);
    const [messages, setMessages] = useState<Array<MessageInterface>>([]);
    const [receivingMessage, setReceivingMessage] = useState(false);
    const [topics, setTopics] = useState<Array<TopicsMessageInterface>>([]);
    const textareaRef = useRef<null | HTMLTextAreaElement>(null);

    const receiveMessage = (d: any) => {
        if (!d.object) {
            const data = { ...d } as ResponseMessageInterface;
            const { message: text, finish_reason, id } = data;
            if (!document.getElementById(id)) {
                let elements = document.getElementsByClassName("actual-text");
                elements[elements.length - 1].id = id;
            }
            if (finish_reason) {
                setReceivingMessage(false);
            }
            let documentElement = document.getElementById(id)!;
            let tabBody = document.getElementsByClassName("tab-body")[0];
            let eleText = documentElement.textContent || "";
            eleText += `${text}`;
            documentElement.textContent = eleText;
            tabBody.scrollTop = tabBody.scrollHeight;
            setMessages((prev) => {
                let ele = prev[prev.length - 1];
                ele.text = eleText;
                return prev;
            });
        } else {
            if (d.object === "topics") {
                setTopics(d.message);
            }
        }
    };

    useEffect(() => {
        try {
            if (tabVisible && topics.length === 0) {
                socketRef.current = io("https://ws.sstrader.com", {
                    path, query,
                    transports: ["websocket"],
                    parser
                });
                socketRef.current.on("message", receiveMessage);
                socketRef.current.emit("sendMessage", {
                    id: "randomWellcomeHash", // Required
                    object: "topics", // Required
                    message: "", // Optional
                    category: "wellcome", // Required
                });
            }
        } catch (e) {
            console.log(e);
        }
    }, [tabVisible, topics]);

    useEffect(() => {
        if (receivingMessage) {
            let tabBody = document.getElementsByClassName("tab-body")[0];
            tabBody.scrollTop = tabBody.scrollHeight;
        }
    }, [receivingMessage]);

    const sendMessage = () => {
        if (!receivingMessage && state !== "") {
            const id = v4();
            socketRef.current?.emit("sendMessage", {
                id,
                message: state,
            });
            setMessages((prev) => {
                if (!prev.find((v) => v.id === id)) {
                    prev.push({
                        id,
                        isUser: true,
                        text: state,
                    });
                    prev.push({
                        id: `response-${id}`,
                        isUser: false,
                        text: "",
                    });
                }
                return prev;
            });
            setState("");
            setReceivingMessage(true);
            textareaRef.current!.style.height = "auto";
        }
    };

    const makeTabVisible = () => {
        setTabVisible(true);
    };

    const closeTab = () => {
        setTabVisible(false);
    };

    return (
        <div className="widget-container">
            <div className="widget" onClick={makeTabVisible}>
                <img src={widgetSvg} alt="Widget icon" />
            </div>
            <div className={`tab ${tabVisible ? "tab-visible" : ""}`}>
                <div className="tab-header">
                    <img src={closeSvg} alt="Close icon" onClick={closeTab} />
                </div>
                <div className="tab-body">
                    <div
                        className="tab-placeholder"
                        style={{
                            display: messages.length > 0 ? "none" : "flex",
                        }}
                    >
                        <div className="tab-placeholder-notice">
                            <h1>AI Chat can be inaccurate.</h1>
                            <p>
                                AI Chat may provide inaccurate information about
                                people, places, or facts.
                            </p>
                        </div>
                        <div className="tab-placeholder-topics">
                            {topics.map((val, ind) => {
                                return (
                                    <Topic
                                        key={ind}
                                        data={val}
                                        setMessages={setMessages}
                                        socket={socketRef.current!}
                                        setReceivingMessage={
                                            setReceivingMessage
                                        }
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <div className="tab-body-messages">
                        {messages.map((value, index) => {
                            return (
                                <Message
                                    key={index}
                                    value={value}
                                    socket={socketRef.current}
                                    receivingMessage = {receivingMessage}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="tab-input">
                    <div className="tab-input-section">
                        <div className="tab-textarea">
                            <textarea
                                rows = {1}
                                placeholder="Send message"
                                value={state}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                onChange={(e) => {
                                    setState(e.currentTarget.value);
                                    textareaRef.current!.style.height = "auto";
                                    textareaRef.current!.style.height = textareaRef.current!.scrollHeight + "px";
                                }}
                                ref = {textareaRef}
                            />
                            <div
                                className="send-button"
                                style={{
                                    backgroundColor:
                                        state === ""
                                            ? ""
                                            : !receivingMessage
                                            ? "#F1CB22"
                                            : "",
                                }}
                                onClick={() => {
                                    sendMessage();
                                }}
                            >
                                <img
                                    src={sendSvg}
                                    alt="Send icon"
                                    style={{
                                        opacity: receivingMessage ? 0.4 : 1,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="tab-input-footer">
                        <h1>Powered by</h1>
                        <img src={companyNameSvg} alt="SSTrader" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Widget;
