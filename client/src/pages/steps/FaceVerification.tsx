import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Camera, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";

export default function FaceVerification() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<"prompt" | "granted" | "denied" | "unknown">("unknown");

  const { data: existingData, isLoading: isLoadingData, refetch } = trpc.faceVerification.get.useQuery(
    { applicationId },
    { enabled: !!applicationId }
  );

  const saveMutation = trpc.faceVerification.save.useMutation({
    onSuccess: () => {
      toast.success("人臉識別完成");
      refetch();
    },
    onError: (error) => {
      toast.error(`保存失敗: ${error.message}`);
    },
  });

  // 检查摄像头权限
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: "camera" as PermissionName });
          setPermissionState(result.state);
          
          result.addEventListener("change", () => {
            setPermissionState(result.state);
          });
        }
      } catch (error) {
        console.log("Permission API not supported:", error);
        setPermissionState("unknown");
      }
    };

    checkPermission();
  }, []);

  // 加载已有数据
  useEffect(() => {
    if (existingData?.verificationData) {
      try {
        const data = JSON.parse(existingData.verificationData);
        if (data.faceImageUrl) {
          setCapturedImage(data.faceImageUrl);
        }
      } catch (e) {
        console.error("Error parsing verification data:", e);
      }
    }
  }, [existingData]);

  // 清理摄像头资源
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setCameraError(null);
    
    try {
      // 检查浏览器是否支持getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("您的瀏覽器不支持攝像頭功能，請使用Chrome、Firefox或Safari瀏覽器");
        return;
      }

      // 请求摄像头权限
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      console.log("Media stream obtained:", mediaStream);
      console.log("Video tracks:", mediaStream.getVideoTracks());
      
      setStream(mediaStream);
      
      // 等待video元素准备好
      if (videoRef.current) {
        const video = videoRef.current;
        
        // 设置srcObject
        video.srcObject = mediaStream;
        
        // 使用Promise等待metadata加载
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            console.log("Video dimensions:", video.videoWidth, "x", video.videoHeight);
            resolve();
          };
          
          video.onerror = (e) => {
            console.error("Video element error:", e);
            reject(new Error("視頻元素加載失敗"));
          };
          
          // 超时处理
          setTimeout(() => reject(new Error("視頻加载超时")), 5000);
        });
        
        // 尝试播放视频
        try {
          await video.play();
          console.log("Video playback started successfully");
          setCapturing(true);
        } catch (playError) {
          console.error("Video play error:", playError);
          // 如果自动播放失败，尝试静音播放
          video.muted = true;
          await video.play();
          console.log("Video playback started (muted)");
          setCapturing(true);
        }
      }
      
      setPermissionState("granted");
      
    } catch (error: any) {
      console.error("Camera error:", error);
      
      let errorMessage = "無法訪問攝像頭";
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = "攝像頭權限被拒絕。請在瀏覽器設置中允許訪問攝像頭，然後刷新頁面重試。";
        setPermissionState("denied");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "未檢測到攝像頭設備，請確保您的設備已連接攝像頭。";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage = "攝像頭正被其他應用程序使用，請關閉其他應用後重試。";
      } else if (error.name === "OverconstrainedError") {
        errorMessage = "攝像頭不支持請求的配置，請嘗試使用其他設備。";
      } else if (error.name === "SecurityError") {
        errorMessage = "安全限制：請確保您正在使用HTTPS連接訪問此頁面。";
      }
      
      setCameraError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error("攝像頭未就緒，請重試");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // 检查video是否有有效的视频流
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      toast.error("視頻流未就緒，請稍候再試");
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      toast.error("無法創建畫布上下文");
      return;
    }

    // 设置canvas尺寸为video的实际尺寸
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    // 绘制当前帧到canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 转换为base64图片
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageData);
    stopCamera();

    // 保存到服务器
    saveMutation.mutate({
      applicationId,
      verified: true,
      verificationData: {
        faceImageUrl: imageData,
        capturedAt: new Date().toISOString(),
      },
    });
  };

  const retake = () => {
    setCapturedImage(null);
    setCameraError(null);
    startCamera();
  };

  const handleNext = () => {
    if (!capturedImage && !existingData?.verified) {
      toast.error("請完成人臉識別");
      return;
    }
    setLocation(`/application/${applicationId}/step/12`);
  };

  if (isLoadingData) {
    return (
      <ApplicationWizard applicationId={applicationId} currentStep={11}>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ApplicationWizard>
    );
  }

  return (
    <ApplicationWizard
      applicationId={applicationId}
      currentStep={11}
      onNext={handleNext}
      isNextDisabled={!capturedImage && !existingData?.verified}
    >
      <div className="space-y-6">
        {/* 提示信息 */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>提示：</strong>請確保光線充足，面部清晰可見，並正面對準攝像頭
          </p>
        </div>

        {/* 权限被拒绝的警告 */}
        {permissionState === "denied" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              攝像頭權限被拒絕。請點擊瀏覽器地址欄的鎖形圖標，允許訪問攝像頭，然後刷新頁面重試。
            </AlertDescription>
          </Alert>
        )}

        {/* 错误提示 */}
        {cameraError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{cameraError}</AlertDescription>
          </Alert>
        )}

        <Card className="p-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-center">人臉識別 / Face Verification</h4>

            {/* 攝像頭預覽或已拍攝照片 */}
            <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {capturing ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {stream && (
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      摄像头已启动
                    </div>
                  )}
                </>
              ) : capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  <Camera className="h-16 w-16 mx-auto mb-4" />
                  <p className="mb-2">點擊下方按鈕開始人臉識別</p>
                  <p className="text-xs text-muted-foreground">
                    系統將請求訪問您的攝像頭，請允許權限
                  </p>
                </div>
              )}
            </div>

            {/* 隱藏的canvas用於拍照 */}
            <canvas ref={canvasRef} className="hidden" />

            {/* 操作按鈕 */}
            <div className="flex gap-3 justify-center flex-wrap">
              {!capturing && !capturedImage && (
                <Button 
                  onClick={startCamera} 
                  size="lg"
                  disabled={permissionState === "denied"}
                >
                  <Camera className="h-5 w-5 mr-2" />
                  開始識別
                </Button>
              )}

              {capturing && (
                <>
                  <Button onClick={capturePhoto} size="lg">
                    <Camera className="h-5 w-5 mr-2" />
                    拍照
                  </Button>
                  <Button onClick={stopCamera} variant="outline" size="lg">
                    取消
                  </Button>
                </>
              )}

              {capturedImage && !capturing && (
                <>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">識別完成</span>
                  </div>
                  <Button onClick={retake} variant="outline" size="lg">
                    <RefreshCw className="h-5 w-5 mr-2" />
                    重新拍攝
                  </Button>
                </>
              )}
            </div>

            {saveMutation.isPending && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>正在保存...</span>
              </div>
            )}

            {/* 浏览器兼容性提示 */}
            <div className="text-xs text-center text-muted-foreground mt-4">
              <p>建議使用Chrome、Firefox或Safari瀏覽器以獲得最佳體驗</p>
              <p className="mt-1">如遇問題，請檢查瀏覽器權限設置或聯繫客服</p>
            </div>
          </div>
        </Card>
      </div>
    </ApplicationWizard>
  );
}
