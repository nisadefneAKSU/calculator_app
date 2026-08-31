import { Calculator } from './components/Calculator'
import './App.css'

function App() {
  return (
    <main className="app">
      <div className="app__intro">
        <h1 className="app__title">Calculator</h1>
        <p className="app__subtitle">
          Every operation runs through the Go backend API — this screen just
          sends the numbers and shows what comes back.
        </p>
      </div>
      <Calculator />
    </main>
  )
}

export default App
