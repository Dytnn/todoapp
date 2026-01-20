import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Folder as FolderIcon, 
  MoreVertical, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Search,
  LayoutDashboard,
  CalendarDays,
  ListTodo,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import { 
  format, 
  isToday, 
  isThisWeek, 
  isAfter, 
  startOfToday, 
  endOfToday,
  addDays,
  parseISO
} from 'date-fns';
import { ko } from 'date-fns/locale';

// 초기 데이터
const DEFAULT_FOLDERS = [
  { id: 'f1', name: '업무', color: '#E1F5FE' }, // 파스텔 블루
  { id: 'f2', name: '개인', color: '#FCE4EC' }, // 파스텔 핑크
  { id: 'f3', name: '공부', color: '#E8F5E9' }, // 파스텔 민트
];

function App() {
  // --- 상태 관리 ---
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });

  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem('folders');
    return saved ? JSON.parse(saved) : DEFAULT_FOLDERS;
  });

  const [activeTab, setActiveTab] = useState('today'); // 'today', 'week', 'later'
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  
  // 모달 입력 필드
  const [newTitle, setNewTitle] = useState('');
  const [newMemo, setNewMemo] = useState('');
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTime, setNewTime] = useState(format(new Date(), 'HH:mm'));
  const [newFolderId, setNewFolderId] = useState('');

  // --- 로컬 스토리지 저장 ---
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('folders', JSON.stringify(folders));
  }, [folders]);

  // --- 필터링 로직 ---
  const filteredTodos = useMemo(() => {
    let result = todos;

    // 폴더 필터링
    if (selectedFolderId) {
      result = result.filter(t => t.folderId === selectedFolderId);
    }

    // 탭 필터링 (날짜 기준)
    if (activeTab === 'today') {
      result = result.filter(t => t.date && isToday(parseISO(t.date)));
    } else if (activeTab === 'week') {
      result = result.filter(t => t.date && isThisWeek(parseISO(t.date), { weekStartsOn: 1 }));
    } else if (activeTab === 'later') {
      const today = endOfToday();
      result = result.filter(t => !t.date || isAfter(parseISO(t.date), today));
    }

    return result.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
  }, [todos, activeTab, selectedFolderId]);

  // 대시보드 데이터 (오늘의 일정)
  const todayTodos = todos.filter(t => t.date && isToday(parseISO(t.date)));

  // --- 핸들러 ---
  const openAddModal = () => {
    setEditingTodo(null);
    setNewTitle('');
    setNewMemo('');
    setNewDate(format(new Date(), 'yyyy-MM-dd'));
    setNewTime(format(new Date(), 'HH:mm'));
    setNewFolderId(selectedFolderId || '');
    setIsModalOpen(true);
  };

  const openEditModal = (todo) => {
    setEditingTodo(todo);
    setNewTitle(todo.title);
    setNewMemo(todo.memo);
    setNewDate(todo.date);
    setNewTime(todo.time);
    setNewFolderId(todo.folderId);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (editingTodo) {
      setTodos(todos.map(t => t.id === editingTodo.id ? {
        ...t,
        title: newTitle,
        memo: newMemo,
        date: newDate,
        time: newTime,
        folderId: newFolderId
      } : t));
    } else {
      const newTodo = {
        id: Date.now().toString(),
        title: newTitle,
        memo: newMemo,
        date: newDate,
        time: newTime,
        folderId: newFolderId,
        completed: false
      };
      setTodos([...todos, newTodo]);
    }
    setIsModalOpen(false);
  };

  const toggleComplete = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const getFolderColor = (folderId) => {
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.color : '#f0f0f0';
  };

  return (
    <div className="app-container">
      {/* 사이드바 */}
      <aside className="sidebar glass">
        <div className="logo animate-fade-in-up">
          <h2>To-Do Manager</h2>
        </div>
        
        <nav className="nav-section animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <p className="section-title">카테고리</p>
          <button 
            className={`nav-item ${activeTab === 'today' && !selectedFolderId ? 'active' : ''}`}
            onClick={() => { setActiveTab('today'); setSelectedFolderId(null); }}
          >
            <CalendarDays size={18} /> 오늘
          </button>
          <button 
            className={`nav-item ${activeTab === 'week' && !selectedFolderId ? 'active' : ''}`}
            onClick={() => { setActiveTab('week'); setSelectedFolderId(null); }}
          >
            <ListTodo size={18} /> 이번주
          </button>
          <button 
            className={`nav-item ${activeTab === 'later' && !selectedFolderId ? 'active' : ''}`}
            onClick={() => { setActiveTab('later'); setSelectedFolderId(null); }}
          >
            <Clock size={18} /> 나중에
          </button>
        </nav>

        <nav className="nav-section animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <p className="section-title">폴더</p>
          {folders.map(folder => (
            <button 
              key={folder.id}
              className={`nav-item folder-item ${selectedFolderId === folder.id ? 'active' : ''}`}
              onClick={() => { setSelectedFolderId(folder.id); setActiveTab('all'); }}
            >
              <span className="folder-dot" style={{ backgroundColor: folder.color }}></span>
              {folder.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="main-content">
        {/* 상단 대시보드 영역 */}
        <header className="dashboard-header glass animate-fade-in-up">
          <div className="dashboard-info">
            <h1>오늘의 일정</h1>
            <p className="date-display">{format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}</p>
          </div>
          <div className="stats">
            <div className="stat-card animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <span className="stat-value">{todayTodos.length}</span>
              <span className="stat-label">할 일</span>
            </div>
            <div className="stat-card animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <span className="stat-value">{todayTodos.filter(t => t.completed).length}</span>
              <span className="stat-label">완료</span>
            </div>
          </div>
        </header>

        {/* 할일 목록 */}
        <section className="todo-section">
          <div className="section-header animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <h3>{selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : 
                 activeTab === 'today' ? '오늘' : activeTab === 'week' ? '이번주' : '나중에'}</h3>
            <button className="add-btn animate-scale-in" onClick={openAddModal}>
              <Plus size={20} /> 추가하기
            </button>
          </div>

          <div className="todo-list">
            {filteredTodos.length > 0 ? (
              filteredTodos.map((todo, index) => (
                <div key={todo.id} 
                     className={`todo-card animate-fade-in-up ${todo.completed ? 'completed' : ''}`}
                     style={{ 
                       borderLeft: `5px solid ${getFolderColor(todo.folderId)}`,
                       animationDelay: `${0.6 + index * 0.05}s`
                     }}>
                  <div className="todo-check" onClick={() => toggleComplete(todo.id)}>
                    {todo.completed ? <CheckCircle2 size={24} className="icon-completed animate-scale-in" /> : <Circle size={24} />}
                  </div>
                  <div className="todo-info" onClick={() => openEditModal(todo)}>
                    <h4>{todo.title}</h4>
                    {todo.memo && <p className="memo">{todo.memo}</p>}
                    <div className="todo-meta">
                      <span className="meta-item"><Calendar size={14} /> {todo.date}</span>
                      <span className="meta-item"><Clock size={14} /> {todo.time}</span>
                    </div>
                  </div>
                  <div className="todo-actions">
                    <button onClick={() => deleteTodo(todo.id)} className="delete-btn">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <p>할 일이 없습니다. 새로운 일을 추가해보세요!</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 모달 */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale-in">
            <div className="modal-header">
              <h3>{editingTodo ? '할 일 수정' : '새로운 할 일'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>제목</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  placeholder="무엇을 해야 하나요?"
                  required
                />
              </div>
              <div className="form-group">
                <label>메모</label>
                <textarea 
                  value={newMemo} 
                  onChange={(e) => setNewMemo(e.target.value)} 
                  placeholder="상세 내용을 입력하세요 (선택)"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>날짜</label>
                  <input 
                    type="date" 
                    value={newDate} 
                    onChange={(e) => setNewDate(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>시간</label>
                  <input 
                    type="time" 
                    value={newTime} 
                    onChange={(e) => setNewTime(e.target.value)} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>폴더 선택</label>
                <select value={newFolderId} onChange={(e) => setNewFolderId(e.target.value)}>
                  <option value="">폴더 없음</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>취소</button>
                <button type="submit" className="submit-btn">{editingTodo ? '저장' : '추가'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 스타일링 (CSS-in-JS 스타일의 간편 CSS 적용) */}
      <style>{`
        .app-container {
          display: flex;
          height: 100vh;
          width: 100%;
          background: transparent;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 280px;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 40px;
          z-index: 10;
        }

        .logo h2 {
          margin: 0;
          font-size: 1.4rem;
          background: linear-gradient(135deg, #1E293B 0%, #3B82F6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .section-title {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: #94A3B8;
          margin-bottom: 16px;
          font-weight: 700;
          letter-spacing: 0.1em;
          padding-left: 12px;
        }

        .nav-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 12px;
          color: #64748B;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          text-align: left;
        }

        .nav-item:hover {
          background-color: rgba(59, 130, 246, 0.05);
          color: #3B82F6;
          transform: translateX(4px);
        }

        .nav-item.active {
          background-color: #3B82F6;
          color: #ffffff;
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
        }

        .folder-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          box-shadow: 0 0 10px currentColor;
        }

        /* Main Content Styles */
        .main-content {
          flex: 1;
          padding: 40px 60px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 40px;
          background: transparent;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 40px;
          border-radius: 24px;
        }

        .dashboard-info h1 {
          margin: 0;
          font-size: 2rem;
          color: #0F172A;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .date-display {
          margin: 10px 0 0;
          color: #64748B;
          font-size: 1.1rem;
          font-weight: 500;
        }

        .stats {
          display: flex;
          gap: 20px;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(255, 255, 255, 0.5);
          padding: 16px 28px;
          border-radius: 20px;
          min-width: 100px;
          border: 1px solid rgba(255, 255, 255, 0.8);
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 800;
          color: #1E293B;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #94A3B8;
          font-weight: 600;
        }

        /* Todo Section Styles */
        .todo-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 10px;
        }

        .section-header h3 {
          margin: 0;
          font-size: 1.5rem;
          color: #1E293B;
          font-weight: 700;
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #3B82F6;
          color: #fff;
          padding: 12px 24px;
          border-radius: 16px;
          font-weight: 600;
          box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
        }

        .add-btn:hover {
          background: #2563EB;
          transform: translateY(-2px) scale(1.02);
        }

        .todo-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .todo-card {
          display: flex;
          align-items: center;
          gap: 20px;
          background: rgba(255, 255, 255, 0.8);
          padding: 20px 28px;
          border-radius: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(8px);
        }

        .todo-card.completed {
          opacity: 0.5;
          filter: grayscale(0.5);
        }

        .todo-check {
          color: #CBD5E1;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
        }

        .todo-check:hover {
          color: #3B82F6;
          transform: scale(1.1);
        }

        .icon-completed {
          color: #10B981;
        }

        .todo-info {
          flex: 1;
        }

        .todo-info h4 {
          margin: 0;
          font-size: 1.15rem;
          color: #1E293B;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .completed .todo-info h4 {
          text-decoration: line-through;
          color: #64748B;
        }

        .memo {
          margin: 6px 0 0;
          font-size: 0.95rem;
          color: #64748B;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .todo-meta {
          display: flex;
          gap: 20px;
          margin-top: 10px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #94A3B8;
          font-weight: 500;
        }

        .todo-actions {
          display: flex;
          gap: 12px;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .todo-card:hover .todo-actions {
          opacity: 1;
        }

        .delete-btn {
          color: #FDA4AF;
          padding: 8px;
          border-radius: 10px;
        }

        .delete-btn:hover {
          color: #F43F5E;
          background: rgba(244, 63, 94, 0.1);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.3);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background-color: #fff;
          width: 100%;
          max-width: 520px;
          border-radius: 32px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.6rem;
          font-weight: 800;
          color: #1E293B;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
        }

        .form-group label {
          font-weight: 700;
          font-size: 0.9rem;
          color: #64748B;
        }

        input, textarea, select {
          border: 2px solid #F1F5F9;
          background: #F8FAFC;
          padding: 14px 18px;
          border-radius: 16px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        input:focus, textarea:focus, select:focus {
          border-color: #3B82F6;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 14px;
          margin-top: 20px;
        }

        .cancel-btn {
          padding: 14px 28px;
          border-radius: 16px;
          color: #64748B;
          background-color: #F1F5F9;
          font-weight: 600;
        }

        .submit-btn {
          padding: 14px 36px;
          border-radius: 16px;
          background-color: #3B82F6;
          color: #fff;
          font-weight: 700;
          box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
        }

        .empty-state {
          text-align: center;
          padding: 80px 40px;
          color: #94A3B8;
          background: rgba(255, 255, 255, 0.3);
          border: 2px dashed #E2E8F0;
          border-radius: 32px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .main-content { padding: 40px; }
        }

        @media (max-width: 768px) {
          .app-container {
            flex-direction: column;
          }
          .sidebar {
            width: 100%;
            height: auto;
            border-bottom: 1px solid rgba(0,0,0,0.05);
            padding: 20px;
            gap: 20px;
          }
          .logo { display: none; }
          .nav-section { flex-direction: row; overflow-x: auto; padding-bottom: 8px; }
          .nav-item { white-space: nowrap; width: auto; padding: 10px 18px; }
          .main-content { padding: 24px; gap: 32px; }
          .dashboard-header { flex-direction: column; gap: 24px; text-align: center; padding: 30px; }
          .stats { width: 100%; justify-content: center; }
          .form-row { flex-direction: column; gap: 0; }
        }
      `}</style>
    </div>
  );
}

export default App;
