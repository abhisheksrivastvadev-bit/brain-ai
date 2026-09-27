import { useState } from 'react'
import { LandingPage, HomePage } from './pages'
import './App.css'

export function App() {
  const [showDesignSystem, setShowDesignSystem] = useState(false)

  if (showDesignSystem) {
    return (
      <div className="brain-app-wrapper">
        <div className="brain-view-switcher-bar">
          <button
            type="button"
            className="brain-view-switch-btn"
            onClick={() => setShowDesignSystem(false)}
          >
            ← Back to Brain AI Landing Page
          </button>
        </div>
        <HomePage />
      </div>
    )
  }

  return (
    <LandingPage
      onToggleDesignSystem={() => setShowDesignSystem(true)}
      isDesignSystemOpen={showDesignSystem}
    />
  )
}

export default App
