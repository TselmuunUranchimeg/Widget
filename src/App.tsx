import Widget from "./Components/Widget/Widget";
import "./App.css";

function App() {
    return (
        <div>
            <Widget 
                path = "/ai"
                transports = {["websocket"]}
                username = "randomUsername"
            />
        </div>
    );
}

export default App;
