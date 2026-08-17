import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { MemberProvider } from './lib/member-context'
import CheckIn from './screens/CheckIn'
import Home from './screens/Home'
import Login from './screens/Login'
import Passes from './screens/Passes'
import Profile from './screens/Profile'
import Progress from './screens/Progress'

export default function App() {
  return (
    <MemberProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/passes" element={<Passes />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/checkin" element={<CheckIn />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MemberProvider>
  )
}
