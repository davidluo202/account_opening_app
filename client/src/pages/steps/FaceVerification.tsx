import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import ApplicationWizard from "@/components/ApplicationWizard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Camera, CheckCircle2, RefreshCw } from "lucide-react";

export default function FaceVerification() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const applicationId = parseInt(params.id || "0");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

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

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCapturing(true);
    } catch (error) {
      toast.error("無法訪問攝像頭，請檢查權限設置");
      console.error("Camera error:", error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

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
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>提示：</strong>請確保光線充足，面部清晰可見，並正面對準攝像頭
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-center">人臉識別 / Face Verification</h4>

            {/* 攝像頭預覽或已拍攝照片 */}
            <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {capturing ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Camera className="h-16 w-16 mx-auto mb-4" />
                  <p>點擊下方按鈕開始人臉識別</p>
                </div>
              )}
            </div>

            {/* 隱藏的canvas用於拍照 */}
            <canvas ref={canvasRef} className="hidden" />

            {/* 操作按鈕 */}
            <div className="flex gap-3 justify-center">
              {!capturing && !capturedImage && (
                <Button onClick={startCamera} size="lg">
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
          </div>
        </Card>
      </div>
    </ApplicationWizard>
  );
}
