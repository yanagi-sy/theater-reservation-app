import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Firebase 初期化を読み込む ← この1行を追加するだけ！
import './firebase.js'

createRoot(document.getElementById('root')).render(
  
    <App />
  
)
