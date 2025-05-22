import React, { useRef, useEffect } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

const BettingPage: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage({ action: 'spectate' }, '*');
      }
    }, 1000); // 延迟1秒，确保iframe加载完成

    // 添加消息监听器
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === 'back_to_home') {
        navigate('/');
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header minimal />
      <div className="flex-grow flex items-center justify-center">
        <iframe
          ref={iframeRef}
          src="http://localhost:3000/?mode=betting"
          title="Game Arena"
          width="100%"
          height="100%"
          style={{ border: 'none', flex: 1, minHeight: '80vh' }}
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default BettingPage;