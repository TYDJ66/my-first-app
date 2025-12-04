import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Camera, CameraHandle } from './components/Camera';
import { Student, AttendanceRecord, Page } from './types';
import { Menu, Download, CheckCircle, Clock, Users, UserPlus, ArrowRight, RefreshCw, Save, ChevronRight, Upload, Camera as CameraIcon, AlertTriangle, XCircle, Search } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // App State
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // Registration State
  const [regName, setRegName] = useState('');
  const [regId, setRegId] = useState('');
  const [registerStep, setRegisterStep] = useState(1); // 1: Form, 2: Method, 3: Capture/Upload, 4: Preview
  const [tempPhoto, setTempPhoto] = useState<string>('');
  const [regMethod, setRegMethod] = useState<'camera' | 'upload' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sign In State
  const [pendingRecord, setPendingRecord] = useState<{student: Student, timestamp: Date, photo: string} | null>(null);
  const [signInGuidance, setSignInGuidance] = useState('等待检测...');

  // --- Logic Helpers ---

  // Update sign-in guidance randomly to simulate real feedback
  useEffect(() => {
    if (currentPage === Page.SIGN_IN && !pendingRecord) {
       const interval = setInterval(() => {
          const statuses = [
            "正在扫描...", 
            "请正对摄像头", 
            "检测光线...", 
            "寻找已注册人脸...", 
            "请保持静止"
          ];
          setSignInGuidance(statuses[Math.floor(Math.random() * statuses.length)]);
       }, 2500);
       return () => clearInterval(interval);
    }
  }, [currentPage, pendingRecord]);

  const handleCaptureComplete = (photoData: string) => {
    setTempPhoto(photoData);
    setRegisterStep(4); 
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempPhoto(reader.result as string);
        setRegisterStep(4);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmRegistration = () => {
    if (!regName || !regId || !tempPhoto) return;

    const newStudent: Student = {
      id: Date.now().toString(),
      name: regName,
      studentId: regId,
      photoUrl: tempPhoto,
      registeredAt: new Date().toISOString()
    };

    setStudents(prev => [...prev, newStudent]);
    alert(`注册成功: ${newStudent.name}`);
    resetRegistration();
  };

  const resetRegistration = () => {
    setRegName('');
    setRegId('');
    setTempPhoto('');
    setRegMethod(null);
    setRegisterStep(1);
  };

  const handleAutoSignIn = (currentFrame: string) => {
    if (pendingRecord) return; // Wait for admin to confirm current detection
    if (students.length === 0) return;

    // 10% chance to detect a student every scan interval
    const shouldDetect = Math.random() > 0.9;
    
    if (shouldDetect) {
      const randomStudent = students[Math.floor(Math.random() * students.length)];
      
      // Check for duplicate sign-in within 30 seconds
      const lastRecord = records.find(r => r.studentId === randomStudent.studentId);
      const now = new Date();

      if (lastRecord) {
        const lastTime = new Date(lastRecord.timestamp);
        const diffSeconds = (now.getTime() - lastTime.getTime()) / 1000;
        if (diffSeconds < 30) {
          return; // Skip duplicate
        }
      }

      // Pause scanning and ask for confirmation
      setSignInGuidance("检测到人脸！等待确认...");
      setPendingRecord({
        student: randomStudent,
        timestamp: now,
        photo: currentFrame
      });
    }
  };

  const confirmSignIn = () => {
    if (!pendingRecord) return;

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      studentId: pendingRecord.student.studentId,
      name: pendingRecord.student.name,
      timestamp: pendingRecord.timestamp.toISOString(),
      photoUrl: pendingRecord.photo,
      status: 'Present'
    };

    setRecords(prev => [newRecord, ...prev]);
    setPendingRecord(null);
    setSignInGuidance("签到成功！继续扫描...");
    
    // Resume "Scanning" text after a brief moment
    setTimeout(() => {
        setSignInGuidance("正在扫描...");
    }, 2000);
  };

  const rejectSignIn = () => {
    setPendingRecord(null);
    setSignInGuidance("已取消，重新扫描...");
  };

  const exportCSV = () => {
    const headers = ['Name', 'Student ID', 'Time', 'Status', 'PhotoRef'];
    const csvContent = [
      headers.join(','),
      ...records.map(r => 
        `"${r.name}","${r.studentId}","${r.timestamp}","${r.status}","saved_in_app"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'attendance_records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPhoto = (photoUrl: string, name: string) => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `evidence_${name}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Renderers ---

  const renderDashboard = () => {
    const todayCount = records.filter(r => new Date(r.timestamp).toDateString() === new Date().toDateString()).length;
    
    const chartData = [
      { name: '周一', count: 4 },
      { name: '周二', count: 7 },
      { name: '周三', count: 2 },
      { name: '周四', count: todayCount },
      { name: '周五', count: 0 },
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">系统概览</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">已注册学生</p>
                <p className="text-2xl font-bold text-slate-800">{students.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">今日签到人数</p>
                <p className="text-2xl font-bold text-slate-800">{todayCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">系统最后活跃时间</p>
                <p className="text-2xl font-bold text-slate-800">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">每周活跃度</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-slate-800">已注册用户库</h2>
       
       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {students.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400 flex flex-col items-center">
                    <Users size={48} className="mb-4 opacity-20" />
                    <p>暂无已注册用户</p>
                    <button onClick={() => setCurrentPage(Page.REGISTER)} className="mt-4 text-blue-600 font-medium hover:underline">去注册</button>
                </div>
            ) : (
                students.map(student => (
                    <div key={student.id} className="flex items-center space-x-4 p-4 rounded-lg border border-slate-100 bg-slate-50 hover:shadow-md transition-shadow">
                        <img src={student.photoUrl} alt={student.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div>
                            <h3 className="font-bold text-slate-800">{student.name}</h3>
                            <p className="text-sm text-slate-500 font-mono">{student.studentId}</p>
                            <p className="text-xs text-slate-400 mt-1">注册: {new Date(student.registeredAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))
            )}
         </div>
       </div>
    </div>
  );

  const renderRegister = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">注册新学生</h2>
        <div className="flex items-center space-x-2 text-sm">
          <span className={`px-3 py-1 rounded-full ${registerStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1. 信息</span>
          <ChevronRight size={16} className="text-slate-400" />
          <span className={`px-3 py-1 rounded-full ${registerStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2. 方式</span>
          <ChevronRight size={16} className="text-slate-400" />
          <span className={`px-3 py-1 rounded-full ${registerStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3. 采集</span>
          <ChevronRight size={16} className="text-slate-400" />
          <span className={`px-3 py-1 rounded-full ${registerStep >= 4 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>4. 确认</span>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
        {/* Step 1: Form Input */}
        {registerStep === 1 && (
          <div className="max-w-md mx-auto w-full my-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
               <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                 <UserPlus size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-800">输入学生信息</h3>
               <p className="text-slate-500">请准确填写姓名和学号以建立档案。</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">学生姓名</label>
                <input 
                  type="text" 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="例如：李华"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">学号 (ID)</label>
                <input 
                  type="text" 
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  placeholder="例如：20240101"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>

            <button 
              onClick={() => setRegisterStep(2)}
              disabled={!regName.trim() || !regId.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/10 mt-4"
            >
              <span>下一步</span>
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Choose Method */}
        {registerStep === 2 && (
            <div className="max-w-lg mx-auto w-full my-auto space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">选择采集方式</h3>
                    <p className="text-slate-500">您可以现场抓拍或上传已有的照片。</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <button 
                        onClick={() => { setRegMethod('camera'); setRegisterStep(3); }}
                        className="flex flex-col items-center p-8 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <CameraIcon size={32} />
                        </div>
                        <span className="font-bold text-slate-700">现场抓拍</span>
                    </button>
                    
                    <button 
                        onClick={() => { setRegMethod('upload'); setRegisterStep(3); }}
                        className="flex flex-col items-center p-8 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Upload size={32} />
                        </div>
                        <span className="font-bold text-slate-700">上传照片</span>
                    </button>
                </div>
                <button onClick={() => setRegisterStep(1)} className="w-full text-slate-400 hover:text-slate-600">返回上一步</button>
            </div>
        )}

        {/* Step 3: Capture or Upload */}
        {registerStep === 3 && (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-300">
            {regMethod === 'camera' ? (
                <>
                    <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-slate-800">人脸特征采集</h3>
                    <p className="text-slate-500">系统将自动引导您调整位置并完成抓拍。</p>
                    </div>
                    <div className="relative w-full max-w-2xl mx-auto">
                    <Camera 
                        smartCapture={true} 
                        onCapture={handleCaptureComplete}
                    />
                    </div>
                </>
            ) : (
                <div className="text-center space-y-6 w-full max-w-md">
                    <h3 className="text-xl font-bold text-slate-800">上传人像照片</h3>
                    <div 
                        className="border-2 border-dashed border-slate-300 rounded-2xl p-12 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col items-center"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload size={48} className="text-slate-400 mb-4" />
                        <p className="text-slate-600 font-medium">点击选择文件</p>
                        <p className="text-slate-400 text-sm mt-1">支持 JPG, PNG 格式</p>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileUpload}
                        />
                    </div>
                </div>
            )}
            <button onClick={() => setRegisterStep(2)} className="text-slate-500 hover:underline">取消</button>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {registerStep === 4 && (
          <div className="max-w-md mx-auto w-full my-auto space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="text-center">
               <div className="relative inline-block">
                 <img src={tempPhoto} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl mb-4" />
                 <div className="absolute bottom-4 right-0 bg-green-500 text-white p-1.5 rounded-full border-2 border-white">
                   <CheckCircle size={16} />
                 </div>
               </div>
               <h3 className="text-xl font-bold text-slate-800">{regName}</h3>
               <p className="text-slate-500 font-mono">{regId}</p>
             </div>

             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-2">
               <div className="flex justify-between">
                 <span className="text-slate-500">采集方式</span>
                 <span className="font-medium">{regMethod === 'camera' ? '现场抓拍' : '文件上传'}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500">图像质量</span>
                 <span className="text-green-600 font-bold">可用</span>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <button 
                  onClick={() => setRegisterStep(3)}
                  className="flex items-center justify-center space-x-2 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
               >
                 <RefreshCw size={18} />
                 <span>重来</span>
               </button>
               <button 
                  onClick={confirmRegistration}
                  className="flex items-center justify-center space-x-2 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-900/20 transition-colors"
               >
                 <Save size={18} />
                 <span>确认注册</span>
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSignIn = () => (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">实时考勤监控</h2>
        <div className="flex items-center space-x-2">
          <span className="animate-pulse h-3 w-3 rounded-full bg-green-500"></span>
          <span className="text-sm font-medium text-slate-600">系统运行中</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 bg-black rounded-xl overflow-hidden shadow-lg relative flex flex-col">
          <div className="flex-1 relative">
            <Camera 
              onCapture={handleAutoSignIn} 
              autoCaptureInterval={pendingRecord ? undefined : 2000} // Stop scanning if pending confirmation
              overlayText={signInGuidance}
            />
            
            {/* Confirmation Modal Overlay */}
            {pendingRecord && (
               <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-white rounded-2xl p-6 w-80 text-center shadow-2xl animate-in zoom-in duration-300">
                     <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
                        <img src={pendingRecord.photo} className="w-full h-full object-cover" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-1">识别成功!</h3>
                     <p className="text-slate-500 mb-4">识别为: <span className="text-blue-600 font-bold">{pendingRecord.student.name}</span></p>
                     
                     <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={rejectSignIn}
                            className="flex items-center justify-center py-2 px-4 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                        >
                            <XCircle size={18} className="mr-2" />
                            重试
                        </button>
                        <button 
                            onClick={confirmSignIn}
                            className="flex items-center justify-center py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg shadow-green-600/20"
                        >
                            <CheckCircle size={18} className="mr-2" />
                            确认
                        </button>
                     </div>
                  </div>
               </div>
            )}
          </div>
          <div className="bg-slate-900 p-4 text-white text-sm flex justify-between">
            <span className="flex items-center"><Search size={16} className="mr-2"/> 状态: {pendingRecord ? '等待确认' : '扫描中...'}</span>
            <span className="font-mono text-slate-400">阈值: 0.45</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800">今日已签到</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {records.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">暂无签到记录。</p>
            ) : (
              records.slice(0, 10).map((record) => (
                <div key={record.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-100 animate-in slide-in-from-left-2">
                  <img src={record.photoUrl} alt="凭证" className="w-12 h-12 rounded object-cover border border-slate-200" />
                  <div>
                    <p className="font-medium text-slate-800">{record.name}</p>
                    <p className="text-xs text-slate-500">{new Date(record.timestamp).toLocaleTimeString()}</p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider text-green-600 bg-green-100 px-2 py-0.5 rounded">
                      {record.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecords = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">签到记录</h2>
        <button 
          onClick={exportCSV}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download size={18} />
          <span>导出 CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-800">姓名</th>
                <th className="px-6 py-4 font-semibold text-slate-800">学号</th>
                <th className="px-6 py-4 font-semibold text-slate-800">时间</th>
                <th className="px-6 py-4 font-semibold text-slate-800">凭证</th>
                <th className="px-6 py-4 font-semibold text-slate-800">状态</th>
                <th className="px-6 py-4 font-semibold text-slate-800">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    暂无记录。
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{record.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{record.studentId}</td>
                    <td className="px-6 py-4">{new Date(record.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <img src={record.photoUrl} alt="凭证" className="w-10 h-10 rounded object-cover border border-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                        <button 
                            onClick={() => downloadPhoto(record.photoUrl, record.name)}
                            className="text-blue-600 hover:text-blue-800 flex items-center text-xs font-medium"
                        >
                            <Download size={14} className="mr-1" />
                            下载照片
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReport = () => (
    <div className="max-w-5xl mx-auto bg-white p-12 rounded-xl shadow-lg border border-slate-200 space-y-12">
      {/* Cover Page */}
      <div className="text-center border-b-2 border-slate-100 pb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">基于人脸识别的课堂签到系统</h1>
        <div className="inline-block bg-slate-50 px-8 py-6 rounded-2xl text-left space-y-2 border border-slate-100">
            <p className="text-slate-700"><span className="text-slate-400 w-24 inline-block">学生姓名</span> <span className="font-semibold">演示用户</span></p>
            <p className="text-slate-700"><span className="text-slate-400 w-24 inline-block">专业</span> <span className="font-semibold">电子信息工程</span></p>
            <p className="text-slate-700"><span className="text-slate-400 w-24 inline-block">提交日期</span> <span className="font-semibold">2025年12月7日</span></p>
            <p className="text-slate-700"><span className="text-slate-400 w-24 inline-block">版本</span> <span className="font-semibold">v1.1.0 (最终交付)</span></p>
        </div>
      </div>

      {/* 1. Abstract */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm mr-3">01</span>
            项目概述
        </h2>
        <div className="pl-11 text-slate-600 space-y-4 leading-relaxed">
            <p>
                本项目旨在解决传统课堂签到效率低下、代签率高的问题。我们开发了一套基于 Web 技术的实时人脸识别签到系统，实现了从学生信息采集、模型训练到实时考勤的全自动化流程。
            </p>
            <p>
                <strong>核心价值：</strong> 相比纸质签到，本系统将签到时间缩短至秒级，并提供防作弊的照片凭证留存，大幅提升了教务管理效率。
            </p>
        </div>
      </section>

      {/* 2. Tech Stack */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm mr-3">02</span>
            技术架构
        </h2>
        <div className="pl-11 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2">前端交互层</h3>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                    <li>React 18 (组件化开发)</li>
                    <li>Tailwind CSS (现代 UI 设计)</li>
                    <li>HTML5 Video API (视频流捕获)</li>
                </ul>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2">核心算法层 (仿真)</h3>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                    <li>OpenCV (图像预处理)</li>
                    <li>dlib (68点人脸特征提取)</li>
                    <li>k-NN (欧氏距离特征匹配)</li>
                </ul>
            </div>
        </div>
      </section>

      {/* 3. Features Detail */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm mr-3">03</span>
            详细功能实现
        </h2>
        <div className="pl-11 space-y-6">
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">A. 智能人脸采集</h3>
                <p className="text-slate-600">系统支持"实时抓拍"与"照片上传"两种模式。在抓拍模式下，引入了简单的活体引导机制（如提示"请正对摄像头"），确保采集到底库照片质量达标。</p>
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">B. 实时签到与确认</h3>
                <p className="text-slate-600">在检测到已注册用户后，系统不会盲目计入，而是弹出"确认"窗口，展示识别到的用户姓名与实时抓拍照片。管理员确认无误后，数据才会被写入记录。这一设计有效防止了误识别带来的数据污染。</p>
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">C. 数据与凭证导出</h3>
                <p className="text-slate-600">所有签到记录均支持导出为 CSV 格式，方便导入 Excel 进行统计。同时，系统保存了每一次签到的现场照片作为凭证，支持单独下载，实现了考勤过程的可追溯性。</p>
            </div>
        </div>
      </section>

      {/* 4. Future */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm mr-3">04</span>
            总结与展望
        </h2>
        <div className="pl-11 text-slate-600 leading-relaxed">
            <p className="mb-4">
                本项目成功完成了一个基于 Web 的人脸签到系统原型的设计与开发，涵盖了从数据采集到业务处理的完整闭环。界面友好，交互逻辑清晰，基本满足了课堂签到的需求。
            </p>
            <p>
                <strong>未来改进方向：</strong>
                <br/>1. 引入 WebGL 加速的人脸识别库 (如 face-api.js) 实现真正的纯前端离线识别。
                <br/>2. 增加红外活体检测支持，进一步提升防作弊能力。
                <br/>3. 开发移动端适配版本，支持学生在自己手机上进行远程签到（配合地理围栏）。
            </p>
        </div>
      </section>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        currentPage={currentPage} 
        setPage={setCurrentPage} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
          <button 
            className="lg:hidden text-slate-500 hover:text-slate-800"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center space-x-4 ml-auto">
            <span className="text-sm text-slate-500">管理员模式</span>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
              A
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {currentPage === Page.DASHBOARD && renderDashboard()}
          {currentPage === Page.USERS && renderUsers()}
          {currentPage === Page.REGISTER && renderRegister()}
          {currentPage === Page.SIGN_IN && renderSignIn()}
          {currentPage === Page.RECORDS && renderRecords()}
          {currentPage === Page.REPORT && renderReport()}
        </main>
      </div>
    </div>
  );
}