import React, { useState } from 'react'
import {
  Button,
  Input,
  Loader,
  Card,
  Badge,
} from '../../components/ui'
import {
  SparklesIcon,
  SearchIcon,
  MailIcon,
  LockIcon,
  ArrowRightIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  RefreshIcon,
  CheckIcon,
} from '../../components/icons'
import { useTheme } from '../../hooks'
import { palette } from '../../themes/colors'
import './HomePage.css'

export const HomePage: React.FC = () => {
  const { toggleTheme, isDark } = useTheme()

  // Button state
  const [btnLoading, setBtnLoading] = useState(false)
  const [btnShape, setBtnShape] = useState<'rounded' | 'pill' | 'square'>('rounded')

  // Input states
  const [searchValue, setSearchValue] = useState('')
  const [emailValue, setEmailValue] = useState('')
  const [passwordValue, setPasswordValue] = useState('')
  const [errorInputVal, setErrorInputVal] = useState('invalid_syntax@')
  const [inputVariant, setInputVariant] = useState<'outlined' | 'filled' | 'underlined'>('outlined')

  // Loader state
  const [showOverlayLoader, setShowOverlayLoader] = useState(false)
  const [selectedLoaderColor, setSelectedLoaderColor] = useState<'primary' | 'accent' | 'purple'>('primary')

  // Copied hex feedback
  const [copiedHex, setCopiedHex] = useState<string | null>(null)

  const handleCopy = (hex: string) => {
    navigator.clipboard?.writeText(hex)
    setCopiedHex(hex)
    setTimeout(() => setCopiedHex(null), 1800)
  }

  const triggerOverlay = () => {
    setShowOverlayLoader(true)
    setTimeout(() => setShowOverlayLoader(false), 2200)
  }

  return (
    <div className="brain-home">
      {/* Background ambient lighting */}
      <div className="brain-bg-glow brain-bg-glow-1" />
      <div className="brain-bg-glow brain-bg-glow-2" />

      {/* Top Navigation */}
      <header className="brain-nav">
        <div className="brain-nav-container">
          <div className="brain-nav-brand">
            <div className="brain-logo-badge">
              <SparklesIcon size={20} className="brain-logo-icon" />
            </div>
            <div>
              <span className="brain-brand-title">Brain AI</span>
              <span className="brain-brand-sub">Design System</span>
            </div>
            <Badge variant="primary" size="sm" dot>
              v1.0.0 Ready
            </Badge>
          </div>

          <div className="brain-nav-actions">
            <Button
              variant="ghost"
              size="sm"
              shape="pill"
              onClick={toggleTheme}
              leftIcon={isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
              aria-label="Toggle Theme"
            >
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              shape="pill"
              onClick={() => window.open('https://github.com', '_blank')}
            >
              GitHub
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="brain-main-container">
        {/* Hero Section */}
        <section className="brain-hero">
          <Badge variant="accent" size="md" dot>
            Next-Generation Architecture
          </Badge>
          <h1 className="brain-hero-title">
            Intelligent UI Tokens &amp; <span className="brain-text-gradient">Reusable Components</span>
          </h1>
          <p className="brain-hero-desc">
            Production-ready React 19 + TypeScript component library with custom inputs,
            loaders, buttons, and comprehensive theme tokens (colors, fonts, constants).
          </p>

          <div className="brain-hero-cta">
            <Button
              variant="gradient"
              size="lg"
              shape="pill"
              rightIcon={<ArrowRightIcon size={18} />}
              onClick={() => {
                document.getElementById('components-demo')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Explore Components
            </Button>
            <Button
              variant="secondary"
              size="lg"
              shape="pill"
              leftIcon={<RefreshIcon size={18} />}
              onClick={triggerOverlay}
            >
              Test Overlay Loader
            </Button>
          </div>
        </section>

        {/* SECTION 1: Theme Tokens (Colors, Typography, Constants) */}
        <section className="brain-section" id="theme-tokens">
          <div className="brain-section-header">
            <div>
              <span className="brain-section-tag">Design System</span>
              <h2 className="brain-section-title">Theme Tokens: Colors, Fonts &amp; Constants</h2>
              <p className="brain-section-desc">
                Organized inside <code>src/themes/</code> and <code>src/theme/</code> with full TypeScript support.
              </p>
            </div>
            {copiedHex && (
              <Badge variant="success" size="md">
                <CheckIcon size={14} /> Copied {copiedHex}
              </Badge>
            )}
          </div>

          <div className="brain-swatches-grid">
            {/* Primary Palette */}
            <Card title="Primary Brand (Indigo)" description="Core brand color scale" glass>
              <div className="brain-palette-row">
                {[100, 300, 500, 700, 900].map((step) => {
                  const hex = palette.primary[step as keyof typeof palette.primary]
                  return (
                    <button
                      key={step}
                      type="button"
                      className="brain-swatch"
                      style={{ backgroundColor: hex }}
                      onClick={() => handleCopy(hex)}
                      title={`Click to copy ${hex}`}
                    >
                      <span className="brain-swatch-label">{step}</span>
                      <span className="brain-swatch-hex">{hex}</span>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Accent Palette */}
            <Card title="Accent Brand (Cyan)" description="Secondary highlight scale" glass>
              <div className="brain-palette-row">
                {[100, 300, 500, 700, 900].map((step) => {
                  const hex = palette.accent[step as keyof typeof palette.accent]
                  return (
                    <button
                      key={step}
                      type="button"
                      className="brain-swatch"
                      style={{ backgroundColor: hex }}
                      onClick={() => handleCopy(hex)}
                      title={`Click to copy ${hex}`}
                    >
                      <span className="brain-swatch-label">{step}</span>
                      <span className="brain-swatch-hex">{hex}</span>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Status Semantic Colors */}
            <Card title="Semantic Status Colors" description="Success, warning, error, and info tokens" glass>
              <div className="brain-palette-row">
                {[
                  { name: 'Success', hex: palette.success.main },
                  { name: 'Warning', hex: palette.warning.main },
                  { name: 'Error', hex: palette.error.main },
                  { name: 'Info', hex: palette.info.main },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    className="brain-swatch"
                    style={{ backgroundColor: item.hex }}
                    onClick={() => handleCopy(item.hex)}
                    title={`Click to copy ${item.hex}`}
                  >
                    <span className="brain-swatch-label">{item.name}</span>
                    <span className="brain-swatch-hex">{item.hex}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* SECTION 2: Custom Button Component */}
        <section className="brain-section" id="components-demo">
          <div className="brain-section-header">
            <div>
              <span className="brain-section-tag">Reusable Component</span>
              <h2 className="brain-section-title">Custom Button Component</h2>
              <p className="brain-section-desc">
                Supports variants (Primary, Gradient, Secondary, Outline, Ghost, Danger, Success),
                sizes (sm, md, lg), shapes, icons, and integrated loading state.
              </p>
            </div>
            <div className="brain-control-group">
              <Button
                variant={btnLoading ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setBtnLoading((prev) => !prev)}
                leftIcon={<RefreshIcon size={14} />}
              >
                Toggle Loading: {btnLoading ? 'ON' : 'OFF'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setBtnShape((prev) =>
                    prev === 'rounded' ? 'pill' : prev === 'pill' ? 'square' : 'rounded'
                  )
                }
              >
                Shape: {btnShape}
              </Button>
            </div>
          </div>

          <div className="brain-grid-cards">
            {/* Button Variants */}
            <Card title="Variants" description="Different visual hierarchies" glass>
              <div className="brain-btn-demo-row">
                <Button variant="primary" shape={btnShape} isLoading={btnLoading}>
                  Primary Button
                </Button>
                <Button variant="gradient" shape={btnShape} isLoading={btnLoading} leftIcon={<SparklesIcon size={16} />}>
                  Gradient Glow
                </Button>
                <Button variant="secondary" shape={btnShape} isLoading={btnLoading}>
                  Secondary
                </Button>
                <Button variant="outline" shape={btnShape} isLoading={btnLoading}>
                  Outline
                </Button>
                <Button variant="ghost" shape={btnShape} isLoading={btnLoading}>
                  Ghost
                </Button>
                <Button variant="success" shape={btnShape} isLoading={btnLoading} leftIcon={<CheckIcon size={16} />}>
                  Success
                </Button>
                <Button variant="danger" shape={btnShape} isLoading={btnLoading}>
                  Danger
                </Button>
              </div>
            </Card>

            {/* Button Sizes & Shapes */}
            <Card title="Sizes &amp; Icons" description="Adaptive sizing and icon slots" glass>
              <div className="brain-btn-demo-row">
                <Button variant="primary" size="sm" shape={btnShape} leftIcon={<SparklesIcon size={14} />}>
                  Small (sm)
                </Button>
                <Button variant="primary" size="md" shape={btnShape} rightIcon={<ArrowRightIcon size={16} />}>
                  Medium (md)
                </Button>
                <Button variant="primary" size="lg" shape={btnShape} leftIcon={<UserIcon size={18} />}>
                  Large (lg)
                </Button>
                <Button variant="secondary" size="md" disabled>
                  Disabled
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* SECTION 3: Custom Input Component */}
        <section className="brain-section">
          <div className="brain-section-header">
            <div>
              <span className="brain-section-tag">Reusable Component</span>
              <h2 className="brain-section-title">Custom Input Component</h2>
              <p className="brain-section-desc">
                Equipped with floating/clean labels, built-in password reveal toggle, clearable button,
                left &amp; right icon slots, and real-time validation error states.
              </p>
            </div>

            <div className="brain-control-group">
              <span className="brain-control-label">Variant:</span>
              {(['outlined', 'filled', 'underlined'] as const).map((v) => (
                <Button
                  key={v}
                  variant={inputVariant === v ? 'primary' : 'ghost'}
                  size="sm"
                  shape="pill"
                  onClick={() => setInputVariant(v)}
                >
                  {v}
                </Button>
              ))}
            </div>
          </div>

          <div className="brain-inputs-grid">
            <Card title="Password with Reveal Toggle" description="Click the eye icon to toggle visibility" glass>
              <Input
                label="Account Password"
                type="password"
                placeholder="Enter your secure password"
                variant={inputVariant}
                leftIcon={<LockIcon size={18} />}
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                helperText="Password must be at least 8 characters"
                fullWidth
              />
            </Card>

            <Card title="Search with Clear Button" description="Type anything and click 'X' to clear" glass>
              <Input
                label="Search Models &amp; Prompts"
                type="text"
                placeholder="e.g. GPT-4, Gemini 2.0, Claude..."
                variant={inputVariant}
                leftIcon={<SearchIcon size={18} />}
                isClearable
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onClear={() => setSearchValue('')}
                fullWidth
              />
            </Card>

            <Card title="Email with Left Icon" description="Clean input with icon and helper" glass>
              <Input
                label="Work Email Address"
                type="email"
                placeholder="alex@brain.ai"
                variant={inputVariant}
                leftIcon={<MailIcon size={18} />}
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                helperText="We will never share your email"
                fullWidth
              />
            </Card>

            <Card title="Validation Error State" description="Interactive error messaging and highlight" glass>
              <Input
                label="API Endpoint URL"
                type="text"
                variant={inputVariant}
                value={errorInputVal}
                onChange={(e) => setErrorInputVal(e.target.value)}
                error="Invalid API URI format. Expected https://..."
                fullWidth
              />
            </Card>
          </div>
        </section>

        {/* SECTION 4: Custom Loader Component */}
        <section className="brain-section">
          <div className="brain-section-header">
            <div>
              <span className="brain-section-tag">Reusable Component</span>
              <h2 className="brain-section-title">Custom Loader Component</h2>
              <p className="brain-section-desc">
                Includes Spinner, Bouncing Dots, Pulse Ring, Equalizer Bars, Skeleton Shimmer,
                and Fullscreen/Overlay mode.
              </p>
            </div>

            <div className="brain-control-group">
              <span className="brain-control-label">Color:</span>
              {(['primary', 'accent', 'purple'] as const).map((c) => (
                <Button
                  key={c}
                  variant={selectedLoaderColor === c ? 'primary' : 'ghost'}
                  size="sm"
                  shape="pill"
                  onClick={() => setSelectedLoaderColor(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          <div className="brain-loaders-grid">
            <Card title="Spinner" description="Classic smooth circular spinner" glass>
              <div className="brain-loader-box">
                <Loader variant="spinner" size="lg" color={selectedLoaderColor} text="Thinking..." />
              </div>
            </Card>

            <Card title="Bouncing Dots" description="3-dot wave animation" glass>
              <div className="brain-loader-box">
                <Loader variant="dots" size="lg" color={selectedLoaderColor} text="Generating tokens..." />
              </div>
            </Card>

            <Card title="Pulse Ring" description="Glowing expanding concentric rings" glass>
              <div className="brain-loader-box">
                <Loader variant="pulse" size={36} color={selectedLoaderColor} text="Calibrating weights..." />
              </div>
            </Card>

            <Card title="Wave Bars" description="Audio / frequency equalizer bars" glass>
              <div className="brain-loader-box">
                <Loader variant="bars" size="lg" color={selectedLoaderColor} text="Processing audio..." />
              </div>
            </Card>
          </div>

          {/* Skeleton Shimmer */}
          <div style={{ marginTop: '20px' }}>
            <Card title="Skeleton Shimmer" description="Loading placeholders for content and text blocks" glass>
              <div className="brain-skeleton-container">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <Loader variant="skeleton" skeletonWidth="48px" skeletonHeight="48px" style={{ borderRadius: '50%' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Loader variant="skeleton" skeletonWidth="45%" skeletonHeight="16px" />
                    <Loader variant="skeleton" skeletonWidth="25%" skeletonHeight="12px" />
                  </div>
                </div>
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Loader variant="skeleton" skeletonWidth="100%" skeletonHeight="14px" />
                  <Loader variant="skeleton" skeletonWidth="90%" skeletonHeight="14px" />
                  <Loader variant="skeleton" skeletonWidth="60%" skeletonHeight="14px" />
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* SECTION 5: Integrated Interactive Form Showcase */}
        <section className="brain-section">
          <div className="brain-form-showcase">
            <Card
              title="Interactive Form Demo"
              description="See how Button, Input, and Loader coordinate seamlessly together"
              glass
              glow
              className="brain-demo-form-card"
            >
              <form
                className="brain-demo-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  triggerOverlay()
                }}
              >
                <div className="brain-form-row">
                  <Input
                    label="Username"
                    placeholder="john_doe"
                    leftIcon={<UserIcon size={18} />}
                    required
                    fullWidth
                  />
                  <Input
                    label="Work Email"
                    type="email"
                    placeholder="john@example.com"
                    leftIcon={<MailIcon size={18} />}
                    required
                    fullWidth
                  />
                </div>

                <Input
                  label="Master Key"
                  type="password"
                  placeholder="Enter secret key"
                  leftIcon={<LockIcon size={18} />}
                  required
                  fullWidth
                />

                <div className="brain-form-actions">
                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    fullWidth
                    rightIcon={<ArrowRightIcon size={18} />}
                  >
                    Authenticate with Brain AI
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </section>
      </main>

      {/* Fullscreen Overlay Loader Simulation */}
      {showOverlayLoader && (
        <Loader
          fullscreen
          variant="spinner"
          size={52}
          color="accent"
          text="Syncing with Brain AI Neural Cluster..."
        />
      )}

      {/* Footer */}
      <footer className="brain-footer">
        <p>Brain AI Design System &bull; Built with React 19, TypeScript, and CSS Variables</p>
      </footer>
    </div>
  )
}

export default HomePage
