import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal.jsx'
import {
  IconCalendar,
  IconCar,
  IconCart,
  IconUser,
  IconHome as IconHouse,
} from '../components/icons.jsx'

// Small, reusable "mockup" pieces built from the app's own colors/icons —
// evocative abstractions of the real UI, not stock illustrations or
// screenshots. Each one directly mirrors something Hangsy actually does.

function HeroMockup() {
  return (
    <div className="hero-mockup">
      <div className="hero-mockup-card hero-mockup-card-back">
        <div className="mockup-pill mockup-pill-teal">Sat, Jun 14</div>
        <div className="mockup-row">
          <span className="mockup-dot" style={{ background: 'var(--accent)' }} />
          <span className="mockup-line" style={{ width: '60%' }} />
        </div>
      </div>
      <div className="hero-mockup-card hero-mockup-card-front">
        <div className="mockup-card-top">
          <span className="mockup-emoji">🏖️</span>
          <div>
            <div className="mockup-title">Beach Hangout</div>
            <div className="mockup-subtitle">Ocean Beach · 5 going</div>
          </div>
        </div>
        <div className="mockup-avatars">
          <span className="mockup-avatar" style={{ background: 'var(--primary)' }} />
          <span className="mockup-avatar" style={{ background: 'var(--secondary)' }} />
          <span className="mockup-avatar" style={{ background: 'var(--accent)' }} />
          <span className="mockup-avatar mockup-avatar-more">+2</span>
        </div>
        <div className="mockup-divider" />
        <div className="mockup-row">
          <IconCar />
          <span className="mockup-line" style={{ width: '70%' }} />
        </div>
        <div className="mockup-row">
          <IconCart />
          <span className="mockup-line" style={{ width: '45%' }} />
        </div>
      </div>
      <span className="hero-mockup-pin">📍</span>
    </div>
  )
}

function CreateMockup() {
  return (
    <div className="story-mockup story-mockup-create">
      <div className="mockup-field">
        <span className="mockup-emoji">🎉</span>
        <span className="mockup-line" style={{ width: '55%' }} />
      </div>
      <div className="mockup-field">
        <IconCalendar />
        <span className="mockup-line" style={{ width: '40%' }} />
      </div>
      <div className="mockup-field">
        <IconHouse />
        <span className="mockup-line" style={{ width: '65%' }} />
      </div>
      <div className="mockup-avatars">
        <span className="mockup-avatar" style={{ background: 'var(--primary)' }} />
        <span className="mockup-avatar" style={{ background: 'var(--secondary)' }} />
        <span className="mockup-avatar-add">+</span>
      </div>
    </div>
  )
}

function PlanMockup() {
  return (
    <div className="story-mockup story-mockup-plan">
      <svg viewBox="0 0 260 160" className="mockup-map">
        <path d="M20 130 C 70 60, 120 150, 170 80 S 230 40, 245 30" className="mockup-route" />
        <circle cx="20" cy="130" r="7" fill="var(--ink)" />
        <circle cx="120" cy="80" r="7" fill="var(--primary)" />
        <circle cx="170" cy="80" r="7" fill="var(--secondary)" />
        <circle cx="245" cy="30" r="7" fill="var(--accent)" />
      </svg>
      <div className="mockup-driver-chips">
        <span className="mockup-chip"><IconCar /> Alex · 2 stops</span>
        <span className="mockup-chip"><IconCar /> Sam · 1 stop</span>
      </div>
    </div>
  )
}

function ShoppingTodoMockup() {
  return (
    <div className="story-mockup story-mockup-shopping">
      <div className="mockup-list-row">
        <span className="mockup-check" />
        <span className="mockup-line" style={{ width: '50%' }} />
      </div>
      <div className="mockup-list-row mockup-list-row-highlight">
        <span className="mockup-check" />
        <span>Buy drinks</span>
      </div>
      <div className="mockup-arrow">↓ becomes</div>
      <div className="mockup-todo-pill">
        <span className="mockup-todo-dot" />
        Buy drinks for Beach Hangout
        <span className="mockup-auto-tag">Auto</span>
      </div>
    </div>
  )
}

function TogetherMockup() {
  return (
    <div className="story-mockup story-mockup-together">
      <div className="together-row">
        <IconUser /> <span className="mockup-line" style={{ width: '70%' }} />
      </div>
      <div className="together-row">
        <IconCar /> <span className="mockup-line" style={{ width: '55%' }} />
      </div>
      <div className="together-row">
        <IconCart /> <span className="mockup-line" style={{ width: '65%' }} />
      </div>
      <div className="together-row">
        <IconCalendar /> <span className="mockup-line" style={{ width: '40%' }} />
      </div>
    </div>
  )
}

const STORY_SECTIONS = [
  {
    eyebrow: 'Start here',
    title: 'Create a hangout in seconds',
    body: "Give it a name, a date, and a place. Add the people coming — that's the whole plan so far, and it's already more than a group chat ever gets you.",
    tone: 'primary',
    Mockup: CreateMockup,
  },
  {
    eyebrow: 'Plan together',
    title: 'Figure out who\u2019s driving, and where',
    body: 'Add stops, split them across drivers, and let Hangsy work out the best order to hit them in — so nobody\u2019s guessing who\u2019s picking up who.',
    tone: 'secondary',
    Mockup: PlanMockup,
  },
  {
    eyebrow: "Don't forget anything",
    title: 'Shopping lists that turn themselves into todos',
    body: 'Add "buy drinks" to the list for the beach trip, and Hangsy quietly adds a matching todo — so it shows up on your home screen, not just buried in a list.',
    tone: 'accent',
    Mockup: ShoppingTodoMockup,
  },
  {
    eyebrow: 'All in one place',
    title: 'Everyone, everything, one plan',
    body: "People, routes, shopping, todos — Hangsy pulls it into one hangout, not five separate apps and a group chat trying to hold it together.",
    tone: 'primary',
    Mockup: TogetherMockup,
  },
]

export default function MarketingPage() {
  return (
    <div className="marketing">
      <section className="hero">
        <Reveal className="hero-copy">
          <span className="eyebrow">Planning things with friends, made easy</span>
          <h1 className="display hero-headline">
            The plan stops living in a group chat.
          </h1>
          <p className="hero-sub">
            Hangsy turns "we should do something" into an actual hangout — who's
            coming, who's driving, what to buy, and what still needs doing, all
            in one place everyone can see.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn-primary btn-lg">Get started</Link>
            <Link to="/login" className="btn-secondary btn-lg">Sign in</Link>
          </div>
          <Link to="/try" className="hero-try-link">Or just try it, no account needed →</Link>
        </Reveal>

        <Reveal delay={120} className="hero-visual">
          <HeroMockup />
        </Reveal>
      </section>

      <div className="story">
        {STORY_SECTIONS.map((section, i) => (
          <section key={section.title} className={`story-section tone-${section.tone}`}>
            <Reveal
              className={`story-copy ${i % 2 === 1 ? 'story-copy-reverse' : ''}`}
              as="div"
            >
              <span className="eyebrow">{section.eyebrow}</span>
              <h2>{section.title}</h2>
              <p className="story-body">{section.body}</p>
            </Reveal>
            <Reveal delay={100} className="story-visual">
              <section.Mockup />
            </Reveal>
          </section>
        ))}
      </div>

      <Reveal as="section" className="final-cta">
        <h2 className="display">Stop planning in six different threads.</h2>
        <p className="hero-sub">Hangsy's free to use — start your first hangout in under a minute.</p>
        <Link to="/signup" className="btn-primary btn-lg">Get started free</Link>
      </Reveal>

      <footer className="marketing-footer">
        <span className="navbar-brand">Hangsy</span>
        <p className="muted">Made for planning things with people you actually like.</p>
      </footer>
    </div>
  )
}
