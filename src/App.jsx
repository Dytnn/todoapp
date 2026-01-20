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
      <aside className="sidebar">
        <div className="logo">
          <h2>To-Do Manager</h2>
        </div>
        
        <nav className="nav-section">
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

        <nav className="nav-section">
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
        <header className="dashboard-header fade-in">
          <div className="dashboard-info">
            <h1>오늘의 일정</h1>
            <p className="date-display">{format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}</p>
          </div>
          <div className="stats">
            <div className="stat-card">
              <span className="stat-value">{todayTodos.length}</span>
              <span className="stat-label">할 일</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{todayTodos.filter(t => t.completed).length}</span>
              <span className="stat-label">완료</span>
            </div>
          </div>
        </header>

        {/* 할일 목록 */}
        <section className="todo-section">
          <div className="section-header">
            <h3>{selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : 
                 activeTab === 'today' ? '오늘' : activeTab === 'week' ? '이번주' : '나중에'}</h3>
            <button className="add-btn" onClick={openAddModal}>
              <Plus size={20} /> 추가하기
            </button>
          </div>

          <div className="todo-list">
            {filteredTodos.length > 0 ? (
              filteredTodos.map(todo => (
                <div key={todo.id} className={`todo-card fade-in ${todo.completed ? 'completed' : ''}`}
                     style={{ borderLeft: `5px solid ${getFolderColor(todo.folderId)}` }}>
                  <div className="todo-check" onClick={() => toggleComplete(todo.id)}>
                    {todo.completed ? <CheckCircle2 size={24} className="icon-completed" /> : <Circle size={24} />}
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
              <div className="empty-state">
                <p>할 일이 없습니다. 새로운 일을 추가해보세요!</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 모달 */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content fade-in">
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
          background-color: #fcfcfc;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 260px;
          background-color: #ffffff;
          border-right: 1px solid #f0f0f0;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .logo h2 {
          margin: 0;
          font-size: 1.25rem;
          color: #333;
          font-weight: 700;
        }

        .section-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #999;
          margin-bottom: 12px;
          letter-spacing: 0.05em;
        }

        .nav-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          color: #555;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          width: 100%;
          text-align: left;
        }

        .nav-item:hover {
          background-color: #f5f5f5;
        }

        .nav-item.active {
          background-color: #e3f2fd;
          color: #1976d2;
          font-weight: 600;
        }

        .folder-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        /* Main Content Styles */
        .main-content {
          flex: 1;
          padding: 40px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #fff;
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }

        .dashboard-info h1 {
          margin: 0;
          font-size: 1.75rem;
          color: #1a1a1a;
        }

        .date-display {
          margin: 8px 0 0;
          color: #666;
        }

        .stats {
          display: flex;
          gap: 24px;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: #f8f9fa;
          padding: 12px 24px;
          border-radius: 12px;
          min-width: 80px;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #333;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #888;
        }

        /* Todo Section Styles */
        .todo-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .section-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #333;
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #1a1a1a;
          color: #fff;
          padding: 10px 20px;
          border-radius: 50px;
          font-weight: 600;
          transition: transform 0.2s;
        }

        .add-btn:hover {
          transform: scale(1.05);
          background-color: #333;
        }

        .todo-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .todo-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background-color: #fff;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .todo-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }

        .todo-card.completed {
          opacity: 0.6;
        }

        .todo-check {
          color: #ddd;
          display: flex;
          align-items: center;
        }

        .icon-completed {
          color: #4caf50;
        }

        .todo-info {
          flex: 1;
        }

        .todo-info h4 {
          margin: 0;
          font-size: 1.05rem;
          color: #333;
        }

        .completed .todo-info h4 {
          text-decoration: line-through;
          color: #888;
        }

        .memo {
          margin: 4px 0 0;
          font-size: 0.9rem;
          color: #666;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .todo-meta {
          display: flex;
          gap: 16px;
          margin-top: 8px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #999;
        }

        .todo-actions {
          display: flex;
          gap: 8px;
        }

        .delete-btn {
          color: #ffcdd2;
          transition: color 0.2s;
        }

        .delete-btn:hover {
          color: #f44336;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background-color: #fff;
          width: 100%;
          max-width: 500px;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .form-group label {
          font-weight: 600;
          font-size: 0.9rem;
          color: #555;
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .form-row .form-group {
          flex: 1;
        }

        textarea {
          height: 100px;
          resize: none;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
        }

        .cancel-btn {
          padding: 12px 24px;
          border-radius: 12px;
          color: #666;
          background-color: #f5f5f5;
        }

        .submit-btn {
          padding: 12px 30px;
          border-radius: 12px;
          background-color: #1a1a1a;
          color: #fff;
          font-weight: 600;
        }

        .empty-state {
          text-align: center;
          padding: 60px;
          color: #999;
          background-color: #fdfdfd;
          border: 2px dashed #f0f0f0;
          border-radius: 16px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .app-container {
            flex-direction: column;
          }
          .sidebar {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #f0f0f0;
            padding: 16px;
            gap: 16px;
          }
          .logo { display: none; }
          .nav-section { flex-direction: row; overflow-x: auto; padding-bottom: 8px; }
          .nav-item { white-space: nowrap; width: auto; }
          .main-content { padding: 20px; gap: 24px; }
          .dashboard-header { flex-direction: column; gap: 20px; text-align: center; }
          .stats { width: 100%; justify-content: center; }
          .form-row { flex-direction: column; gap: 0; }
        }
      `}</style>
    </div>
  );
}

export default App;
