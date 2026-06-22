import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useReturnToPreview } from "@/hooks/useReturnToPreview";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { useLang } from '@/lib/i18n';
import { toast } from "sonner";
import { Loader2, Camera, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import * as faceapi from 'face-api.js';

export default function FaceVerification() {
  const { t } = useLang();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");
  const showReturnToPreview = useReturnToPreview();

  // 浏览器摄像头相关
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // 状态管理
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [autoCapture, setAutoCapture] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [consecutiveDetections, setConsecutiveDetections] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    confidence: number;
    message: string;
  } | null>(null);
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);

  const { data: existingData, isLoading: isLoadingData, refetch } = trpc.faceVerification.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.faceVerification.save.useMutation({
    onSuccess: () => {
      toast.success(t("人臉識別完成", "Face verification completed", "人脸识别完成"));
      refetch();
    },
    onError: (error: any) => {
      const fallback = t('保存失敗，請稍後再試', 'Save failed, please try again later', '保存失败，请稍后再试');
      const errorMessage = error?.message || fallback;
      // 只顯示簡短的錯誤信息，不顯示JSON數據
      const shortMessage = errorMessage.length > 100 ? fallback : errorMessage;
      toast.error(shortMessage);
      console.error('Save error:', error);
    },
  });

  // 加载face-api.js模型
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setIsModelLoaded(true);
        console.log('Face detection models loaded successfully');
      } catch (error) {
        console.error('Error loading face detection models:', error);
        toast.error(t('人臉檢測模型加載失敗', 'Failed to load face detection model', '人脸检测模型加载失败'));
      }
    };
    loadModels();
  }, []);

  // 加载已有的人脸照片和驗證狀態
  useEffect(() => {
    if (existingData?.verificationData) {
      try {
        const data = JSON.parse(existingData.verificationData);
        if (data.faceImageUrl) {
          setSelfieImage(data.faceImageUrl);
        }
        // 檢查是否已驗證通過
        if (data.verified === true || existingData.verified === true) {
          setIsAlreadyVerified(true);
          setVerificationResult({
            success: true,
            confidence: data.confidence || 95,
            message: t("人臉驗證已通過", "Face verification passed", "人脸验证已通过")
          });
        }
      } catch (e) {
        console.error("Error parsing verification data:", e);
      }
    }
  }, [existingData]);

  // 清理资源
  useEffect(() => {
    return () => {
      stopCamera();
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    // 先设置isCapturing为true，让video元素渲染到DOM中
    setIsCapturing(true);
    setCameraError(null);
    
    // 等待下一个React渲染周期，确保video元素已经渲染
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        streamRef.current = stream;
        
        // 监听视频加载事件
        const handleLoadedMetadata = () => {
          setIsVideoReady(true);
          toast.success(t('攝像頭已啟動', 'Camera started', '摄像头已启动'));
        };
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        await video.play();
        
        // 启动人脸检测
        if (autoCapture && isModelLoaded) {
          startFaceDetection();
        }
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      let errorMessage = t('無法訪問攝像頭', 'Cannot access camera', '无法访问摄像头');

      if (error.name === 'NotAllowedError') {
        errorMessage = t('您拒絕了攝像頭權限，請在瀏覽器設置中允許訪問攝像頭', 'Camera permission denied. Please allow camera access in browser settings', '您拒绝了摄像头权限，请在浏览器设置中允许访问摄像头');
      } else if (error.name === 'NotFoundError') {
        errorMessage = t('未找到攝像頭設備', 'No camera device found', '未找到摄像头设备');
      } else if (error.name === 'NotReadableError') {
        errorMessage = t('攝像頭被其他應用占用', 'Camera is in use by another application', '摄像头被其他应用占用');
      }
      
      setCameraError(errorMessage);
      setIsCapturing(false);
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsCapturing(false);
    setIsVideoReady(false);
    setFaceDetected(false);
    setCountdown(null);
    setConsecutiveDetections(0);
  };

  const startFaceDetection = () => {
    const REQUIRED_DETECTIONS = 3; // 需要连续检测到3次
    let detectionCount = 0;
    
    detectionIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || !isModelLoaded) return;
      
      try {
        // 使用face-api.js检测人脸
        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        );
        
        if (detection) {
          detectionCount++;
          setConsecutiveDetections(detectionCount);
          setFaceDetected(true);
          
          if (detectionCount >= REQUIRED_DETECTIONS) {
            // 连续检测到人脸，开始倒计时
            if (detectionIntervalRef.current) {
              clearInterval(detectionIntervalRef.current);
              detectionIntervalRef.current = null;
            }
            startCountdownAndCapture();
          }
        } else {
          detectionCount = 0;
          setConsecutiveDetections(0);
          setFaceDetected(false);
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    }, 300); // 每300ms检测一次
  };

  const startCountdownAndCapture = () => {
    let count = 3;
    setCountdown(count);
    
    countdownIntervalRef.current = window.setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(null);
        // 自动拍照
        capturePhoto();
      }
    }, 1000);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // 设置canvas尺寸
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 绘制当前视频帧到canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 转换为base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setSelfieImage(imageData);
    
    // 停止摄像头
    stopCamera();
    
    toast.success(t('照片已拍攝', 'Photo captured', '照片已拍摄'));
    
    // 自动开始验证
    handleVerify(imageData);
  };

  const compareFacesMutation = trpc.faceVerification.compareFaces.useMutation();

  const handleVerify = async (imageData: string) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Call AWS Rekognition via server-side tRPC route
      const result = await compareFacesMutation.mutateAsync({
        applicationId,
        selfieBase64: imageData,
      });

      setVerificationResult({
        success: result.success,
        confidence: result.confidence,
        message: result.message,
      });

      if (result.success) {
        toast.success(t('人臉驗證成功', 'Face verification successful', '人脸验证成功'));
      } else {
        toast.error(t('人臉驗證失敗，請重新拍攝', 'Face verification failed, please retake', '人脸验证失败，请重新拍摄'));
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      const verifyFallback = t('驗證過程出錯，請重試', 'Verification error, please retry', '验证过程出错，请重试');
      const verifyFailFallback = t('驗證失敗，請重試', 'Verification failed, please retry', '验证失败，请重试');
      const errorMsg = error?.message || verifyFallback;
      toast.error(errorMsg.length > 80 ? verifyFailFallback : errorMsg);
      setVerificationResult({
        success: false,
        confidence: 0,
        message: errorMsg.length > 100 ? verifyFallback : errorMsg,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetake = () => {
    setSelfieImage(null);
    setVerificationResult(null);
    startCamera();
  };

  const handleNext = async () => {
    // 如果已驗證通過，直接跳轉到下一步
    if (isAlreadyVerified) {
      setLocation(`/application/${applicationId}/step/12`);
      return;
    }

    if (!selfieImage) {
      toast.error(t("請先完成人臉識別", "Please complete face verification first", "请先完成人脸识别"));
      return;
    }

    if (!verificationResult?.success) {
      toast.error(t("人臉驗證未通過，請重新拍攝", "Face verification failed, please retake", "人脸验证未通过，请重新拍摄"));
      return;
    }

    try {
      await saveMutation.mutateAsync({
        applicationId,
        verified: true,
        faceImageData: selfieImage, // base64 image data
        confidence: verificationResult.confidence,
      });

      setLocation(`/application/${applicationId}/step/12`);
    } catch (error: any) {
      const saveFallback = t('保存失敗，請稍後再試', 'Save failed, please try again later', '保存失败，请稍后再试');
      const errorMessage = error?.message || saveFallback;
      // 只顯示簡短的錯誤信息
      const shortMessage = errorMessage.length > 100 ? saveFallback : errorMessage;
      toast.error(shortMessage);
      console.error('HandleNext error:', error);
    }
  };

  const handleBack = () => {
    setLocation(`/application/${applicationId}/step/10`);
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard currentStep={11} applicationId={applicationId}
      showReturnToPreview={showReturnToPreview}
    >
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ApplicationWizard>
    );
  }

  // 如果已驗證通過，允許直接點擊下一步
  const isNextDisabled = isAlreadyVerified ? false : (!selfieImage || !verificationResult?.success || saveMutation.isPending);

  return (
    <ApplicationWizard 
      currentStep={11} 
      applicationId={applicationId}
      onNext={handleNext}
      onPrevious={handleBack}
      isNextDisabled={isNextDisabled}
      isNextLoading={saveMutation.isPending}
    
      showReturnToPreview={showReturnToPreview}
    >
      <div className="space-y-6">
        {/* 已驗證狀態提示 */}
        {isAlreadyVerified && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>✓ {t('人臉驗證已通過', 'Face verification passed', '人脸验证已通过')}</strong>{t('，您可以直接點擊"下一步"繼續申請流程。', '. You can click "Next" to continue.', '，您可以直接点击"下一步"继续申请流程。')}
            </AlertDescription>
          </Alert>
        )}

        <Card className="p-6">
          <div className="space-y-4">
            {!isCapturing && !selfieImage && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Camera className="h-24 w-24 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('點擊下方按鈕開始人臉識別', 'Click the button below to start face verification', '点击下方按钮开始人脸识别')}
                </p>
                <Button onClick={startCamera} size="lg" disabled={!isModelLoaded}>
                  {!isModelLoaded ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('加載中...', 'Loading...', '加载中...')}
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      {t('開始拍攝', 'Start Capture', '开始拍摄')}
                    </>
                  )}
                </Button>
              </div>
            )}

            {cameraError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            )}

            {isCapturing && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg bg-black"
                  style={{ maxHeight: '500px' }}
                />
                
                {/* 人脸框 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div 
                    className={`border-4 rounded-full transition-colors duration-300 ${
                      faceDetected ? 'border-green-500' : 'border-white/50'
                    }`}
                    style={{
                      width: '60%',
                      paddingBottom: '75%',
                      borderStyle: 'dashed',
                    }}
                  />
                </div>
                
                {/* 倒计时显示 */}
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-8xl font-bold animate-pulse">
                      {countdown}
                    </div>
                  </div>
                )}
                
                {/* 检测状态提示 */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                  {countdown !== null ? (
                    t('準備拍攝...', 'Preparing to capture...', '准备拍摄...')
                  ) : faceDetected ? (
                    `${t('檢測到人臉', 'Face detected', '检测到人脸')} (${consecutiveDetections}/3)`
                  ) : (
                    t('請將臉部對準框內', 'Please align your face within the frame', '请将脸部对准框内')
                  )}
                </div>
                
                <div className="mt-4 flex justify-center gap-2">
                  <Button onClick={stopCamera} variant="outline">
                    {t('取消', 'Cancel', '取消')}
                  </Button>
                  {!autoCapture && isVideoReady && (
                    <Button onClick={capturePhoto}>
                      <Camera className="mr-2 h-4 w-4" />
                      {t('手動拍攝', 'Manual Capture', '手动拍摄')}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {selfieImage && (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={selfieImage}
                    alt="Selfie"
                    className="w-full rounded-lg"
                    style={{ maxHeight: '500px', objectFit: 'contain' }}
                  />
                  {verificationResult && (
                    <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg ${
                      verificationResult.success 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {verificationResult.success ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <span>{t('驗證成功', 'Verified', '验证成功')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          <span>{t('驗證失敗', 'Failed', '验证失败')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {isVerifying && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>{t('正在驗證人臉...', 'Verifying face...', '正在验证人脸...')}</AlertDescription>
                  </Alert>
                )}
                
                {verificationResult && (
                  <Alert variant={verificationResult.success ? "default" : "destructive"}>
                    <AlertDescription>
                      {verificationResult.message}
                    </AlertDescription>
                  </Alert>
                )}
                
                {!verificationResult?.success && (
                  <div className="flex justify-center">
                    <Button onClick={handleRetake} variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {t('重新拍攝', 'Retake', '重新拍摄')}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </Card>
      </div>
    </ApplicationWizard>
  );
}
