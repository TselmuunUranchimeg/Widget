import Widget from "./Components/Widget/Widget";
import "./App.css";

function App() {
    return (
        <div>
            <Widget 
                parameters = {{
                    path: "/ai",
                    query: {
                        username: "MD5 hash of username",
                        language: "EN",
                        token: "JWT string",
                        other_options: "Other values"
                    }
                }}
            />
        </div>
    );
}

export default App;
