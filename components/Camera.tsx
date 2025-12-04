import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Camera as CameraIcon, AlertCircle, ScanFace } from 'lucide-react';

export interface CameraHandle {
  capture: () => void;
}

interface CameraProps {
  onCapture?: (imageSrc: string) => void;
  overlayText?: string;
  autoCaptureInterval?: number; // If set, simulates auto-scanning for sign-in
  smartCapture?: boolean; // If true, enables the guided "face quality" simulation loop
}

export const Camera = forwardRef<CameraHandle, CameraProps>(({ 
  onCapture, 
  overlayText, 
  autoCaptureInterval,
  smartCapture = false 
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Smart Capture Simulation State
  const [guidanceText, setGuidanceText] = useState(overlayText || '正在检测人脸...');
  const [borderColor, setBorderColor] = useState('border-blue-400'); // blue, yellow, green
  const [isCaptured, setIsCaptured] = useState(false);

  // Update guidance text when prop changes (unless in smart capture mode which controls it itself)
  useEffect(() => {
    if (!smartCapture && overlayText) {
      setGuidanceText(overlayText);
    }
  }, [overlayText, smartCapture]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("无法访问摄像头，请确保已授予权限。");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Horizontal flip for the captured image to match the mirror view
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageSrc = canvas.toDataURL('image/jpeg');
        
        if (onCapture) {
          onCapture(imageSrc);
        }
      }
    }
  };

  // Expose capture method to parent
  useImperativeHandle(ref, () => ({
    capture: captureImage
  }));

  // Logic 1: Auto Scan Loop (for Sign In)
  useEffect(() => {
    let intervalId: any;
    
    if (autoCaptureInterval && isStreaming && onCapture && !smartCapture) {
      intervalId = setInterval(() => {
        captureImage();
      }, autoCaptureInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoCaptureInterval, isStreaming, smartCapture, onCapture]);

  // Logic 2: Smart Guided Capture (for Registration)
  useEffect(() => {
    if (!smartCapture || !isStreaming || isCaptured) return;

    let mounted = true;
    let stepTimeout: any;

    const runSimulation = async () => {
      // Step 1: Detecting
      setGuidanceText('正在寻找人脸...');
      setBorderColor('border-white');
      await new Promise(r => stepTimeout = setTimeout(r, 1000));
      if (!mounted) return;

      // Step 2: Adjusting
      setGuidanceText('请将面部移至框内...');
      setBorderColor('border-yellow-400');
      await new Promise(r => stepTimeout = setTimeout(r, 1500));
      if (!mounted) return;

      // Step 3: Good position
      setGuidanceText('请保持静止...');
      setBorderColor('border-blue-500');
      await new Promise(r => stepTimeout = setTimeout(r, 1500));
      if (!mounted) return;

      // Step 4: Locked & Capture
      setGuidanceText('完美！正在采集...');
      setBorderColor('border-green-500');
      await new Promise(r => stepTimeout = setTimeout(r, 800));
      if (!mounted) return;

      if (onCapture) {
        setIsCaptured(true);
        captureImage();
      }
    };

    runSimulation();

    return () => {
      mounted = false;
      clearTimeout(stepTimeout);
    };
  }, [smartCapture, isStreaming, isCaptured, onCapture]);

  // Reset state if smartCapture is toggled off
  useEffect(() => {
    if (!smartCapture) {
      setIsCaptured(false);
      setGuidanceText(overlayText || '正在检测人脸...');
      setBorderColor('border-green-500');
    }
  }, [smartCapture, overlayText]);

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg aspect-video flex items-center justify-center group">
      {error ? (
        <div className="text-white text-center p-4">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-2" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Facial Recognition Overlay Simulation */}
          {isStreaming && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Dynamic Bounding Box */}
              <div className={`border-2 ${borderColor} w-56 h-56 rounded-2xl transition-all duration-500 relative flex flex-col items-center justify-start`}>
                
                {/* Status Badge */}
                <div className={`absolute -top-10 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 transition-all duration-300 ${borderColor === 'border-green-500' ? 'scale-110 bg-green-600/90' : ''}`}>
                   <ScanFace size={16} className={borderColor === 'border-green-500' ? 'animate-ping absolute opacity-20' : ''}/>
                   <span>{guidanceText}</span>
                </div>

                {/* Corner markers */}
                <div className={`absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 ${borderColor} rounded-tl-lg`}></div>
                <div className={`absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 ${borderColor} rounded-tr-lg`}></div>
                <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 ${borderColor} rounded-bl-lg`}></div>
                <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 ${borderColor} rounded-br-lg`}></div>

                {/* Scanning line animation */}
                <div className={`w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent absolute top-0 opacity-50 animate-scan ${smartCapture ? 'block' : 'hidden'}`}></div>
              </div>
            </div>
          )}
          
          {!isStreaming && !error && (
            <div className="text-white flex flex-col items-center animate-pulse">
              <CameraIcon className="h-12 w-12 mb-2 opacity-50" />
              <p>正在启动摄像头...</p>
            </div>
          )}
        </>
      )}
      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          50% { opacity: 0.8; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
});

Camera.displayName = "Camera";