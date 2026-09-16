import { Button, Card, Slider, Space, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';

const PRESET_SPEEDS = [0.25, 0.5, 1, 1.5, 2, 5];
const MIN_SPEED = 0.1;
const MAX_SPEED = 8;

function formatTime(elapsedMs: number) {
  const safeElapsed = Math.max(0, Math.floor(elapsedMs));
  const seconds = Math.floor(safeElapsed / 1000);
  const milliseconds = safeElapsed % 1000;

  return {
    secondsText: String(seconds),
    millisecondsText: String(milliseconds).padStart(3, '0'),
  };
}

export default function TimerPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [speed, setSpeed] = useState(1);

  const rafIdRef = useRef<number | null>(null);
  const realStartRef = useRef<number | null>(null);
  const simulatedStartRef = useRef(0);
  const speedRef = useRef(speed);

  const viewModel = useMemo(() => formatTime(elapsedMs), [elapsedMs]);

  const cancelAnimation = () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  };

  const computeCurrentElapsed = (now: number) => {
    if (realStartRef.current === null) {
      return simulatedStartRef.current;
    }

    return simulatedStartRef.current + (now - realStartRef.current) * speedRef.current;
  };

  useEffect(() => {
    speedRef.current = speed;

    if (!isRunning) {
      return;
    }

    const now = performance.now();
    const progressed = computeCurrentElapsed(now);
    simulatedStartRef.current = progressed;
    realStartRef.current = now;
    setElapsedMs(progressed);
  }, [speed, isRunning]);

  useEffect(() => {
    if (!isRunning) {
      cancelAnimation();
      return;
    }

    realStartRef.current = performance.now();
    simulatedStartRef.current = elapsedMs;

    const tick = (now: number) => {
      setElapsedMs(computeCurrentElapsed(now));
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimation();
    };
  }, [isRunning, elapsedMs]);

  useEffect(
    () => () => {
      cancelAnimation();
    },
    [],
  );

  const onStart = () => {
    if (isRunning) return;
    setIsRunning(true);
  };

  const onPause = () => {
    if (!isRunning) return;
    const now = performance.now();
    const frozen = computeCurrentElapsed(now);
    simulatedStartRef.current = frozen;
    setElapsedMs(frozen);
    setIsRunning(false);
  };

  const onReset = () => {
    cancelAnimation();
    setIsRunning(false);
    setElapsedMs(0);
    realStartRef.current = null;
    simulatedStartRef.current = 0;
  };

  return (
    <div className="timer-screen min-h-dvh px-4 py-5">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <Card className="timer-card border-0 shadow-md" bodyStyle={{ padding: 20 }}>
          <Typography.Text className="timer-title block text-xs tracking-[0.28em] text-slate-500">
            秒表
          </Typography.Text>
          <div className="timer-display mt-3 flex items-end justify-center gap-2 rounded-2xl px-3 py-8">
            <span className="timer-seconds text-[60px] leading-none text-slate-900">
              {viewModel.secondsText}
            </span>
            <span className="timer-dot pb-1 text-[44px] leading-none text-slate-600">.</span>
            <span className="timer-millis pb-1 text-[38px] leading-none text-slate-700">
              {viewModel.millisecondsText}
            </span>
          </div>
          <Typography.Text className="mt-3 block text-center text-xs text-slate-500">
            显示格式：秒.毫秒（秒数可持续累加，不按分钟进位）
          </Typography.Text>

          <Space className="mt-5 flex justify-center" size={12} wrap>
            <Button
              type={isRunning ? 'default' : 'primary'}
              size="large"
              onClick={onStart}
              disabled={isRunning}
            >
              开始
            </Button>
            <Button size="large" onClick={onPause} disabled={!isRunning}>
              暂停
            </Button>
            <Button size="large" danger onClick={onReset}>
              清零
            </Button>
          </Space>
        </Card>

        <Card className="border-0 shadow-sm" bodyStyle={{ padding: 18 }}>
          <div className="mb-2 flex items-center justify-between">
            <Typography.Title level={5} className="!mb-0 !text-[16px]">
              时间流速
            </Typography.Title>
            <Typography.Text strong className="text-sky-600">
              {speed.toFixed(2)}x
            </Typography.Text>
          </div>

          <Slider
            min={MIN_SPEED}
            max={MAX_SPEED}
            step={0.05}
            value={speed}
            onChange={(value) => setSpeed(value)}
            tooltip={{ formatter: (value) => `${Number(value).toFixed(2)}x` }}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {PRESET_SPEEDS.map((preset) => (
              <Button
                key={preset}
                size="small"
                type={Math.abs(speed - preset) < 0.001 ? 'primary' : 'default'}
                onClick={() => setSpeed(preset)}
              >
                {preset}x
              </Button>
            ))}
          </div>

          <Typography.Paragraph className="!mt-3 !mb-0 text-xs text-slate-500">
            1x 时，计时器 1 秒对应现实 1 秒。小于 1x 为慢放，大于 1x 为加速。
          </Typography.Paragraph>
        </Card>
      </div>
    </div>
  );
}
