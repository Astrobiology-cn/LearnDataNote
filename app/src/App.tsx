import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import KnowledgePage from './pages/KnowledgePage'
import KnowledgeContentPage from './pages/KnowledgeContentPage'
import ScholarsPage from './pages/ScholarsPage'
import ScholarDetailPage from './pages/ScholarDetailPage'
import ResourcesPage from './pages/ResourcesPage'
import ResourceDetailPage from './pages/ResourceDetailPage'
import AboutPage from './pages/AboutPage'
import NewsDetailPage from './pages/NewsDetailPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        {/* R5：chapterId 可选——章节可深链/分享；非法章节 id 由页面内兜底到第一章 */}
        <Route path="knowledge/:subjectId/:chapterId?" element={<KnowledgeContentPage />} />
        <Route path="scholars" element={<ScholarsPage />} />
        <Route path="scholars/:scholarId" element={<ScholarDetailPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="resources/:resourceId" element={<ResourceDetailPage />} />
        <Route path="news/:id" element={<NewsDetailPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
