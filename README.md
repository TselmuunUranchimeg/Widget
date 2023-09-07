# Widget source code

## Source code location
Located at `/src/Components/Widget/Widget.tsx`

## How does it work?

It is a component that occupies bottom right section of the screen. Upon loading the first time, the component establishes a connection with the server and fetches the topics through `useEffect` hook.

By using the `<Message />` component, the widget manages (renders) user inputs as well as incoming response. While the `id` and `text` is not necessary for server response messages and can be null, for the sake of better maintenance, those properties remain not null. Without the `id` property, React.js will create two instances of user messages in `<StrictMode>`. While this mode is only available during development, it is better to be prepared "just in case". 

To send a message to the server, type in your question in the textarea at the bottom of the screen, and click the send icon. 

Below sections answer some of the questions you might have regarding this React.js component.

## How to run

1. Install the listed packages in `dependencies` and `devDependencies`
```
npm install;
npm install -D
```

2. Start the development server
```
npm run dev
```

# Q&A

## Why doesn't it use `useState` to update response in the UI?

Due to the response coming in chunks, and having the need to update the component in charge (`<Message />`) in real time, it is better to use DOM to update the texts instead of relying on `useState`.

## Why is every component in a single file?

As I am not aware of how this widget will be integrated in the main project, I deemed it easier to have every component of the widget in a single file. 
