import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const iconPaths = {
  search: 'm21 21-4.34-4.34 M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  send: 'm22 2-7 20-4-9-9-4 20-7ZM22 2 11 13',
  plus: 'M12 5v14 M5 12h14',
  menu: 'M4 6h16M4 12h16M4 18h16',
  logout: 'M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-5',
  profile: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  close: 'M18 6 6 18M6 6l12 12',
  message: 'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z',
  sparkle: 'm12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3ZM19 14l1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z',
}

function Icon({ name, size = 20 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={iconPaths[name]} />
    </svg>
  )
}

function Avatar({ name, size = 'normal' }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const tone = (name.charCodeAt(0) || 0) % 5

  return (
    <span className={`avatar avatar-${size} avatar-tone-${tone}`}>
      {initials}
    </span>
  )
}

function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.')
  }
  return data
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', identifier: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isRegistering = mode === 'register'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const payload = isRegistering
        ? { username: form.username, email: form.email, password: form.password }
        : { identifier: form.identifier, password: form.password }
      const { user } = await request(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      onAuthenticated(user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    setError('')
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="brand brand-light">
          <span className="brand-mark"><Icon name="message" size={19} /></span>
          <span>gather<span className="brand-period">.</span></span>
        </div>
        <div className="story-copy">
          <span className="eyebrow"><Icon name="sparkle" size={15} /> A little more human</span>
          <h1>Good conversations<br />make <em>everything</em> better.</h1>
          <p>A quieter corner of the internet, made for the people you want to hear from.</p>
        </div>
        <div className="story-note">
          <div className="note-avatars">
            <Avatar name="Maya" size="small" />
            <Avatar name="Jamie" size="small" />
            <Avatar name="Sam" size="small" />
          </div>
          <span>Better together, one message at a time.</span>
        </div>
        <div className="story-orbit story-orbit-one" />
        <div className="story-orbit story-orbit-two" />
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-heading">
            <span className="auth-kicker">{isRegistering ? 'YOUR PEOPLE ARE HERE' : 'WELCOME BACK'}</span>
            <h2>{isRegistering ? 'Make yourself at home.' : 'Pick up where you left off.'}</h2>
            <p>{isRegistering ? 'Create an account and start a conversation.' : 'Sign in to find your people.'}</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegistering && (
              <>
                <label htmlFor="username">Your name</label>
                <input
                  autoComplete="username"
                  id="username"
                  maxLength={30}
                  minLength={2}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                  placeholder="What should we call you?"
                  required
                  value={form.username}
                />
                <label htmlFor="email">Email address</label>
                <input
                  autoComplete="email"
                  id="email"
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={form.email}
                />
              </>
            )}
            {!isRegistering && (
              <>
                <label htmlFor="identifier">Username or email</label>
                <input
                  autoComplete="username"
                  id="identifier"
                  onChange={(event) => setForm({ ...form, identifier: event.target.value })}
                  placeholder="Your username or email"
                  required
                  value={form.identifier}
                />
              </>
            )}
            <label htmlFor="password">Password</label>
            <input
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              id="password"
              maxLength={128}
              minLength={isRegistering ? 8 : undefined}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder={isRegistering ? 'At least 8 characters' : 'Your password'}
              required
              type="password"
              value={form.password}
            />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary auth-submit" disabled={busy} type="submit">
              {busy ? 'One moment…' : isRegistering ? 'Create your account' : 'Sign in'}
              {!busy && <span aria-hidden="true">→</span>}
            </button>
          </form>
          <p className="auth-switch">
            {isRegistering ? 'Already have a place here?' : 'New around here?'}{' '}
            <button onClick={() => changeMode(isRegistering ? 'login' : 'register')} type="button">
              {isRegistering ? 'Sign in' : 'Create an account'}
            </button>
          </p>
          <p className="auth-footnote">A small space for the people who matter.</p>
        </div>
      </section>
    </main>
  )
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [contacts, setContacts] = useState([])
  const [selectedContact, setSelectedContact] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadedContactId, setLoadedContactId] = useState(null)
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [profileUser, setProfileUser] = useState(null)
  const messagesEndRef = useRef(null)
  const selectedContactIdRef = useRef(null)
  const selectedContactId = selectedContact?._id

  useEffect(() => {
    selectedContactIdRef.current = selectedContactId
  }, [selectedContactId])

  useEffect(() => {
    if (!profileUser) return undefined
    function closeOnEscape(event) {
      if (event.key === 'Escape') setProfileUser(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [profileUser])

  useEffect(() => {
    let active = true
    request('/api/auth/me')
      .then(({ user }) => {
        if (active) setCurrentUser(user)
      })
      .catch(() => {
        if (active) setCurrentUser(null)
      })
      .finally(() => {
        if (active) setCheckingSession(false)
      })
    return () => { active = false }
  }, [])

  async function loadContacts() {
    try {
      const { users } = await request('/api/chat/users')
      setContacts(users)
      setSelectedContact((selected) => {
        if (selected) return users.find((user) => user._id === selected._id && !user.isSelf) || null
        return users.find((user) => !user.isSelf) || null
      })
    } catch (loadError) {
      setError(loadError.message)
    }
  }

  useEffect(() => {
    if (!currentUser) return
    let active = true
    request('/api/chat/users')
      .then(({ users }) => {
        if (!active) return
        setContacts(users)
        setSelectedContact((selected) => (
          selected
            ? users.find((user) => user._id === selected._id && !user.isSelf) || null
            : users.find((user) => !user.isSelf) || null
        ))
      })
      .catch((loadError) => {
      if (active) setError(loadError.message)
    })
    return () => { active = false }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return undefined
    const socket = io(API_URL, { withCredentials: true })
    socket.on('message:new', (message) => {
      setContacts((previous) => {
        const updated = previous.map((contact) => (
          contact._id === message.sender || contact._id === message.recipient
            ? { ...contact, lastMessage: message }
            : contact
        ))
        return updated.sort((first, second) => (
          new Date(second.lastMessage?.createdAt || 0) - new Date(first.lastMessage?.createdAt || 0)
        ))
      })
      if (selectedContactIdRef.current === message.sender || selectedContactIdRef.current === message.recipient) {
        setMessages((previous) => (
          previous.some((existing) => existing._id === message._id)
            ? previous
            : [...previous, message]
        ))
      }
    })
    socket.on('connect_error', () => {
      setError('Live updates are unavailable. Messages can still be sent.')
    })
    socket.on('connect', () => setError(''))
    return () => socket.disconnect()
  }, [currentUser])

  useEffect(() => {
    if (!currentUser || !selectedContactId) return undefined
    let active = true
    request(`/api/chat/messages/${selectedContactId}`)
      .then(({ messages: history }) => {
        if (active) {
          setMessages(history)
          setLoadedContactId(selectedContactId)
        }
      })
      .catch((loadError) => {
        if (active) {
          setMessages([])
          setLoadedContactId(selectedContactId)
          setError(loadError.message)
        }
      })
    return () => { active = false }
  }, [currentUser, selectedContactId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...contacts]
      .filter((contact) => contact.username.toLowerCase().includes(query))
      .sort((first, second) => (
        new Date(second.lastMessage?.createdAt || 0) - new Date(first.lastMessage?.createdAt || 0)
      ))
  }, [contacts, search])

  async function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !selectedContact || sending) return
    setSending(true)
    setError('')
    try {
      const { message } = await request(`/api/chat/messages/${selectedContact._id}`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
      setMessages((previous) => (
        previous.some((item) => item._id === message._id) ? previous : [...previous, message]
      ))
      setContacts((previous) => previous.map((contact) => (
        contact._id === selectedContact._id ? { ...contact, lastMessage: message } : contact
      )))
      setDraft('')
    } catch (sendError) {
      setError(sendError.message)
    } finally {
      setSending(false)
    }
  }

  async function signOut() {
    try {
      await request('/api/auth/logout', { method: 'POST' })
      setCurrentUser(null)
      setContacts([])
      setSelectedContact(null)
      setProfileUser(null)
    } catch (logoutError) {
      setError(logoutError.message)
    }
  }

  function chooseContact(contact) {
    if (contact.isSelf) {
      setProfileUser(contact)
      setMobileSidebarOpen(false)
      return
    }
    setSelectedContact(contact)
    setMobileSidebarOpen(false)
    setError('')
  }

  if (checkingSession) {
    return <main className="boot-screen"><span className="boot-mark"><Icon name="message" /></span><span>Finding your place…</span></main>
  }
  if (!currentUser) return <AuthScreen onAuthenticated={setCurrentUser} />

  return (
    <main className="app-shell">
      <aside className="nav-rail">
        <div className="rail-logo"><Icon name="message" size={21} /></div>
        {/* <div className="rail-divider" />
        <button aria-label="Messages" className="rail-button rail-button-active" type="button"><Icon name="message" /></button> */}
        <div className="rail-spacer" />
        <button aria-label="Sign out" className="rail-button rail-logout" onClick={signOut} type="button"><Icon name="logout" /></button>
        <button
          aria-label="View your profile"
          className="profile-avatar-button"
          onClick={() => setProfileUser(currentUser)}
          type="button"
        >
          <Avatar name={currentUser.username} size="rail" />
        </button>
      </aside>

      <aside className={`contact-panel ${mobileSidebarOpen ? 'contact-panel-open' : ''}`}>
        <header className="contact-heading">
          <div>
            <span className="section-eyebrow">YOUR SPACE</span>
            <h1>Messages<span className="heading-period">.</span></h1>
          </div>
          <span className="contact-count">{contacts.length}</span>
        </header>
        <label className="search-box">
          <Icon name="search" size={17} />
          <input
            aria-label="Search people"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find someone"
            value={search}
          />
          <kbd>⌘ K</kbd>
        </label>
        <div className="list-label">
          <span>ALL PEOPLE</span>
          <span>{filteredContacts.length}</span>
        </div>
        <div className="contact-list">
          {filteredContacts.map((contact) => (
            <div className="contact-row" key={contact._id}>
              <button
                className={`contact-item ${selectedContact?._id === contact._id ? 'contact-item-active' : ''}`}
                onClick={() => chooseContact(contact)}
                type="button"
              >
                <Avatar name={contact.username} />
                <span className="contact-copy">
                  <span className="contact-name">{contact.username}{contact.isSelf ? ' (you)' : ''}</span>
                  <span className="contact-preview">
                    {contact.email}
                  </span>
                </span>
              </button>
              <button
                aria-label={`View ${contact.isSelf ? 'your' : `${contact.username}'s`} profile`}
                className="contact-profile-button"
                onClick={() => setProfileUser(contact)}
                title="View profile"
                type="button"
              >
                <Icon name="profile" size={16} />
              </button>
            </div>
          ))}
          {filteredContacts.length === 0 && (
            <div className="empty-contacts">
              <span className="empty-icon"><Icon name="search" size={21} /></span>
              <strong>{search ? 'No one found' : 'It’s quiet here'}</strong>
              <span>{search ? 'Try another name.' : 'Invite someone by asking them to create an account.'}</span>
            </div>
          )}
        </div>
        <footer className="contact-footer">
          <span className="footer-status"><span /> ALL CAUGHT UP</span>
          <span>GATHER · 01</span>
        </footer>
      </aside>

      <section className="chat-panel">
        {selectedContact ? (
          <>
            <header className="chat-header">
              <button
                aria-label="Open conversations"
                className="mobile-menu"
                onClick={() => setMobileSidebarOpen((open) => !open)}
                type="button"
              >
                <Icon name="menu" />
              </button>
              <Avatar name={selectedContact.username} />
              <div className="chat-person">
                <strong>{selectedContact.username}</strong>
                <span>A conversation just for you two</span>
              </div>
              <div className="header-note"><span className="note-dot" /> YOUR CONVERSATION IS PRIVATE</div>
            </header>

            <div className="message-scroll">
              <div className="conversation-intro">
                <span className="intro-line" />
                <span>A LITTLE SPACE FOR THE TWO OF YOU</span>
                <span className="intro-line" />
              </div>
              <div className="message-stack">
                {loadedContactId !== selectedContactId ? (
                  <div className="message-loading">Opening your conversation…</div>
                ) : messages.length === 0 ? (
                  <div className="empty-chat">
                    <span className="empty-chat-mark"><Icon name="sparkle" size={26} /></span>
                    <h2>Every good chat starts somewhere.</h2>
                    <p>Say hello to {selectedContact.username} and see where it goes.</p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isMine = String(message.sender) === String(currentUser._id)
                    const previous = messages[index - 1]
                    const showDay = !previous
                      || new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString()
                    return (
                      <div key={message._id}>
                        {showDay && (
                          <div className="day-divider">
                            <span>{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(message.createdAt))}</span>
                          </div>
                        )}
                        <div className={`message-row ${isMine ? 'message-row-mine' : ''}`}>
                          {!isMine && <Avatar name={selectedContact.username} size="tiny" />}
                          <div className="message-content">
                            <div className={`message-bubble ${isMine ? 'message-bubble-mine' : ''}`}>{message.text}</div>
                            <time>{formatTime(message.createdAt)}</time>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {error && <div className="chat-error" role="alert">{error}</div>}
            <footer className="composer-wrap">
              <form className="composer" onSubmit={sendMessage}>
                <textarea
                  aria-label="Write a message"
                  maxLength={4000}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      event.currentTarget.form.requestSubmit()
                    }
                  }}
                  placeholder={`Write something to ${selectedContact.username}…`}
                  rows={1}
                  value={draft}
                />
                <span className="composer-hint">ENTER TO SEND · SHIFT + ENTER FOR A NEW LINE</span>
                <button aria-label="Send message" className="send-button" disabled={!draft.trim() || sending} type="submit">
                  {sending ? <span className="send-spinner" /> : <Icon name="send" size={18} />}
                </button>
              </form>
              <div className="composer-caption"><Icon name="sparkle" size={13} /> Good things happen when we reach out.</div>
            </footer>
          </>
        ) : (
          <div className="welcome-panel">
            <button
              aria-label="Open conversations"
              className="mobile-menu"
              onClick={() => setMobileSidebarOpen((open) => !open)}
              type="button"
            >
              <Icon name="menu" />
            </button>
            <span className="welcome-mark"><Icon name="message" size={31} /></span>
            <span className="section-eyebrow">MAKE YOURSELF AT HOME</span>
            <h2>There’s room for<br /><em>your people.</em></h2>
            <p>Once someone creates an account, you can find them here and start a conversation.</p>
            <button className="button button-soft" onClick={loadContacts} type="button"><Icon name="plus" size={17} /> Refresh people</button>
          </div>
        )}
      </section>
      {profileUser && (
        <div className="profile-overlay" onClick={() => setProfileUser(null)}>
          <section
            aria-labelledby="profile-title"
            aria-modal="true"
            className="profile-dialog"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="Close profile"
              className="profile-close"
              onClick={() => setProfileUser(null)}
              type="button"
            >
              <Icon name="close" size={18} />
            </button>
            <Avatar name={profileUser.username} size="profile" />
            <span className="section-eyebrow">GATHER MEMBER</span>
            <h2 id="profile-title">{profileUser.username}</h2>
            <dl className="profile-details">
              <div>
                <dt>Email</dt>
                <dd>{profileUser.email}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
