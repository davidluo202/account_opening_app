/**
 * 表单自动保存Hook
 * 每30秒自动保存表单数据
 */

import { useEffect, useRef, useState } from 'react';

interface UseAutoSaveOptions {
  onSave: () => Promise<void> | void;
  interval?: number; // 自动保存间隔（毫秒），默认30秒
  enabled?: boolean; // 是否启用自动保存
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveNow: () => Promise<void>;
}

export function useAutoSave({
  onSave,
  interval = 30000, // 默认30秒
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // 手动保存函数
  const saveNow = async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      await onSave();
      if (isMountedRef.current) {
        setLastSavedAt(new Date());
      }
    } catch (error) {
      console.error('自动保存失败:', error);
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      return;
    }

    // 设置定时器
    timerRef.current = setInterval(() => {
      saveNow();
    }, interval);

    // 清理函数
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, interval, onSave]);

  return {
    isSaving,
    lastSavedAt,
    saveNow,
  };
}
